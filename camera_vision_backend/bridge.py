"""
FlowJeep backend bridge  (put this file next to your config.py)

ESP32-CAM -> Air780E -> MQTT broker -> THIS PROGRAM -> Firebase

What it does
  * T; messages  -> writes GPS + IR counts + online status to live_telemetry/<jeepney>
  * E; messages  -> a door event (direction decided by the IR order on the ESP32)
  * I; messages  -> picture chunks. Each door event sends a short burst of pictures; YOLOv8
    counts the people in every picture and the HIGHEST count is used for the event.
  * Entry/exit totals use that camera count (falls back to 1 per IR event if no picture
    arrives or YOLO sees nobody). The raw IR totals are stored next to them.

It writes ONLY these fields, so it does not fight with the GPS data:
  GPS side  : currentCoord, speedKmh, headingDegrees, satellites, hdop
  This side : occupiedSeats, capacityPct, loadCategory, irEntryCount, irExitCount, ...

Do NOT run the old main.py at the same time: it writes fake GPS coordinates.

Install:  pip install paho-mqtt requests opencv-python numpy ultralytics
Run:      python bridge.py            (add --reset to zero the camera totals)
"""
import base64
import json
import logging
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import paho.mqtt.client as mqtt
import requests
from ultralytics import YOLO

from config import (
    YOLO_MODEL_NAME,
    PERSON_CONFIDENCE,
    TARGET_CLASSES,
    INFERENCE_IMAGE_SIZE,
    DEVICE,
    MIN_PERSON_HEIGHT,
    MIN_PERSON_WIDTH,
    MIN_ASPECT_RATIO,
    MAX_ASPECT_RATIO,
    ENABLE_FIREBASE_SYNC,
    FIREBASE_TELEMETRY_URL,
    FIREBASE_EVENTS_URL,
    FIREBASE_DEVICE_URL,
    JEEPNEY_ID,
    ROUTE_ID,
    ROUTE_NAME,
    PLATE_NUMBER,
    MAX_JEEPNEY_CAPACITY,
    DEVICE_ID,
    LOGS_DIR,
)

# ---------------------------------------------------------------------------
# SETTINGS (edit these)
# ---------------------------------------------------------------------------
MQTT_HOST = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_USER = None              # set for a private broker
MQTT_PASS = None
TOPIC_SECRET = "a1236azs"     # must match TOPIC_BASE in the ESP32 sketch
BASE_TOPIC = f"flowjeep/{TOPIC_SECRET}/{JEEPNEY_ID}"

# Only people whose box centre is inside this zone are counted: (x1, y1, x2, y2) as 0..1
# fractions of the image. (0, 0, 1, 1) = whole picture. Narrow it to the doorway later.
DOORWAY_ZONE = (0.0, 0.0, 1.0, 1.0)

SAVE_IMAGES = False           # keep False for privacy; True saves event_<id>.jpg in logs/
IMAGE_WAIT_SECONDS = 90       # if an image never completes, fall back to the IR count
FIREBASE_TIMEOUT = 4.0
STATE_FILE = LOGS_DIR / "bridge_state.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("flowjeep.bridge")

# ---------------------------------------------------------------------------
# SHARED STATE
# ---------------------------------------------------------------------------
lock = threading.Lock()
state = {"cam_entry": 0, "cam_exit": 0}
last_gps = None          # [lat, lng] of the last valid GPS fix
entries = {}             # event id -> dict (event info + camera result)
partials = {}            # event id -> image chunks received so far
executor = ThreadPoolExecutor(max_workers=1)
model = None

# Bandwidth & SIM Speed Diagnostics
net_stats = {
    "last_rx_time": None,
    "rx_bytes_window": 0,
    "window_start": time.time(),
}


def load_state(reset: bool):
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    if reset or not STATE_FILE.exists():
        save_state()
        return
    try:
        data = json.loads(STATE_FILE.read_text())
        state["cam_entry"] = int(data.get("cam_entry", 0))
        state["cam_exit"] = int(data.get("cam_exit", 0))
        log.info("Loaded totals: entry=%d exit=%d", state["cam_entry"], state["cam_exit"])
    except Exception as e:
        log.warning("Could not read %s (%s), starting from 0", STATE_FILE, e)


def save_state():
    try:
        STATE_FILE.write_text(json.dumps(state))
    except Exception as e:
        log.warning("Could not save state: %s", e)


# ---------------------------------------------------------------------------
# FIREBASE (Persistent Session with Automatic Retries for WinError 10054)
# ---------------------------------------------------------------------------
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

fb_session = requests.Session()
fb_retries = Retry(total=3, backoff_factor=0.3, status_forcelist=[500, 502, 503, 504], raise_on_status=False)
fb_session.mount("https://", HTTPAdapter(max_retries=fb_retries, pool_connections=4, pool_maxsize=4))
fb_session.headers.update({"User-Agent": "FlowJeep-Bridge/1.0", "Connection": "keep-alive"})


def fb_send(method: str, url: str, payload: dict):
    if not ENABLE_FIREBASE_SYNC:
        return
    raw_body = json.dumps(payload).encode("utf-8")
    tx_bytes = len(raw_body)
    for attempt in range(2):
        t0 = time.perf_counter()
        try:
            r = fb_session.request(method, url, data=raw_body, headers={"Content-Type": "application/json"}, timeout=FIREBASE_TIMEOUT)
            dt = max(0.001, time.perf_counter() - t0)
            rx_bytes = len(r.content or b"")
            ul_kbps = (tx_bytes * 8 / 1000.0) / dt
            dl_kbps = (rx_bytes * 8 / 1000.0) / dt
            if not r.ok:
                log.warning("Firebase %s %s -> HTTP %s (%.0fms)", method, url.split("/")[-1], r.status_code, dt * 1000)
            else:
                log.info("[NET-FB] %s %s OK in %.0fms | UL: %.1f kbps (%dB) | DL: %.1f kbps (%dB)",
                         method, url.split("/")[-1], dt * 1000, ul_kbps, tx_bytes, dl_kbps, rx_bytes)
            return
        except Exception as e:
            if attempt == 0:
                time.sleep(0.2)
                continue
            log.warning("Firebase error: %s", e)


def load_info(count: int):
    pct = round((count / MAX_JEEPNEY_CAPACITY) * 100)
    cat = "Seats Available" if pct < 80 else ("Near-Full" if pct < 95 else "Full / Standing")
    return pct, cat


# ---------------------------------------------------------------------------
# YOLO
# ---------------------------------------------------------------------------
def detect_people(jpeg: bytes):
    """Return (people_in_zone, best_confidence) or None if the image can't be decoded."""
    arr = np.frombuffer(jpeg, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    h, w = img.shape[:2]
    kwargs = dict(imgsz=INFERENCE_IMAGE_SIZE, conf=PERSON_CONFIDENCE,
                  classes=TARGET_CLASSES, verbose=False)
    if DEVICE is not None:
        kwargs["device"] = DEVICE
    res = model.predict(img, **kwargs)[0]

    zx1, zy1, zx2, zy2 = DOORWAY_ZONE
    count, best = 0, 0.0
    for box in res.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        bw, bh = x2 - x1, y2 - y1
        # size filters from config.py are written for 640x480 frames
        if bh < MIN_PERSON_HEIGHT * (h / 480.0) or bw < MIN_PERSON_WIDTH * (w / 640.0):
            continue
        ratio = bh / max(bw, 1.0)
        if not (MIN_ASPECT_RATIO <= ratio <= MAX_ASPECT_RATIO):
            continue
        cx, cy = ((x1 + x2) / 2) / w, ((y1 + y2) / 2) / h
        if not (zx1 <= cx <= zx2 and zy1 <= cy <= zy2):
            continue
        count += 1
        best = max(best, conf)
    return count, best


# ---------------------------------------------------------------------------
# MESSAGE HANDLERS
# ---------------------------------------------------------------------------
def handle_telemetry(text: str):
    global last_gps
    p = text.split(";")
    if len(p) < 11:
        log.warning("Bad telemetry: %s", text)
        return
    try:
        lat, lng, spd, hdg = float(p[1]), float(p[2]), float(p[3]), float(p[4])
        sats, hdop, fix = int(p[5]), float(p[6]), int(p[7])
        ir_in, ir_out = int(p[8]), int(p[9])
    except ValueError:
        log.warning("Bad telemetry values: %s", text)
        return

    now_ms = int(time.time() * 1000)
    ir_occ = max(0, ir_in - ir_out)
    with lock:
        cam_occ = max(0, state["cam_entry"] - state["cam_exit"])
    # Use IR occupancy if camera hasn't counted yet, or latest active count
    occ = ir_occ if (state["cam_entry"] == 0 and state["cam_exit"] == 0) else cam_occ
    pct, cat = load_info(occ)

    payload = {
        "jeepneyId": JEEPNEY_ID,
        "plateNumber": PLATE_NUMBER,
        "routeId": ROUTE_ID,
        "routeName": ROUTE_NAME,
        "occupiedSeats": occ,
        "totalSeats": MAX_JEEPNEY_CAPACITY,
        "capacityPct": pct,
        "loadCategory": cat,
        "irEntryCount": ir_in,
        "irExitCount": ir_out,
        "lastUpdate": now_ms,
        "isOnline": True,
    }
    if fix == 1:
        payload.update({
            "currentCoord": [lat, lng],
            "speedKmh": spd,
            "headingDegrees": hdg,
            "satellites": sats,
            "hdop": hdop,
        })
        with lock:
            last_gps = [lat, lng]
    fb_send("PATCH", FIREBASE_TELEMETRY_URL, payload)
    fb_send("PATCH", FIREBASE_DEVICE_URL, {
        "deviceId": DEVICE_ID,
        "jeepneyId": JEEPNEY_ID,
        "plateNumber": PLATE_NUMBER,
        "cameraStatus": "EVENT_CAPTURE",
        "dualBeamStatus": "CONNECTED",
        "lastHeartbeat": now_ms,
    })
    log.info("Telemetry: fix=%d lat=%.6f lng=%.6f sats=%d IR in/out=%d/%d (occ=%d)", fix, lat, lng, sats, ir_in, ir_out, occ)


def new_entry():
    return {"t": time.time(), "results": {}, "got": 0}


def handle_event(text: str):
    p = text.split(";")
    if len(p) < 7:
        log.warning("Bad event: %s", text)
        return
    eid = p[1]
    try:
        info = {"dir": p[2], "ir_entry": int(p[3]), "ir_exit": int(p[4]), "n_img": int(p[5])}
    except ValueError:
        log.warning("Bad event values: %s", text)
        return
    with lock:
        ent = entries.setdefault(eid, new_entry())
        ent.update(info)
        ent["evt"] = True
    log.info("Event %s: %s (%d picture(s) coming) | IR in/out=%d/%d",
             eid, "ENTRY" if p[2] == "E" else "EXIT", info["n_img"], info["ir_entry"], info["ir_exit"])

    # Immediately push IR count to Firebase so UI updates with zero delay
    ir_occ = max(0, info["ir_entry"] - info["ir_exit"])
    pct, cat = load_info(ir_occ)
    fb_send("PATCH", FIREBASE_TELEMETRY_URL, {
        "occupiedSeats": ir_occ,
        "totalSeats": MAX_JEEPNEY_CAPACITY,
        "capacityPct": pct,
        "loadCategory": cat,
        "irEntryCount": info["ir_entry"],
        "irExitCount": info["ir_exit"],
        "lastUpdate": int(time.time() * 1000),
        "isOnline": True,
    })
    executor.submit(try_resolve, eid)


def handle_chunk(text: str):
    # I;eventId;pictureNo;pictureCount;chunkIdx;chunkTotal;base64
    p = text.split(";", 6)
    if len(p) < 7:
        return
    eid = p[1]
    try:
        no, idx, total = int(p[2]), int(p[4]), int(p[5])
    except ValueError:
        return
    key = (eid, no)
    now = time.time()
    chunk_bytes = len(text)
    with lock:
        part = partials.setdefault(key, {"total": total, "parts": {}, "t": now, "raw_bytes": 0, "last_t": now})
        dt_chunk = max(0.001, now - part["last_t"])
        part["last_t"] = now
        part["raw_bytes"] += chunk_bytes
        part["parts"][idx] = p[6]
        got_chunks = len(part["parts"])
        done = got_chunks >= part["total"]
        if done:
            parts = partials.pop(key)
    chunk_kbps = (chunk_bytes * 8 / 1000.0) / dt_chunk
    log.info("[SIM-UL] Event %s pic %d chunk %d/%d (%dB) | Instant Rate: %.1f kbps",
             eid, no + 1, got_chunks, total, chunk_bytes, chunk_kbps)
    if not done:
        return
    total_time = max(0.001, now - parts["t"])
    avg_sim_kbps = (parts["raw_bytes"] * 8 / 1000.0) / total_time
    try:
        jpeg = b"".join(base64.b64decode(parts["parts"][i]) for i in range(parts["total"]))
    except Exception as e:
        log.warning("Picture %s/%d could not be rebuilt (%s)", eid, no, e)
        with lock:
            ent = entries.setdefault(eid, new_entry())
            ent["results"][no] = None
            ent["got"] = len(ent["results"])
        executor.submit(try_resolve, eid)
        return
    log.info("[SIM-UL COMPLETE] Picture %s/%d: %d bytes in %.2fs | SIM Upload Speed: %.1f kbps",
             eid, no, len(jpeg), total_time, avg_sim_kbps)
    executor.submit(process_image, eid, no, jpeg)


def process_image(eid: str, no: int, jpeg: bytes):
    if SAVE_IMAGES:
        try:
            (LOGS_DIR / f"event_{eid}_{no}.jpg").write_bytes(jpeg)
        except Exception as e:
            log.warning("Could not save image: %s", e)
    result = detect_people(jpeg)
    with lock:
        ent = entries.setdefault(eid, new_entry())
        ent["results"][no] = result          # (people, best_confidence) or None
        ent["got"] = len(ent["results"])
    log.info("Picture %s/%d: YOLO sees %s person(s)", eid, no, "?" if result is None else result[0])
    try_resolve(eid)


def try_resolve(eid: str):
    with lock:
        ent = entries.get(eid)
        if not ent or ent.get("resolved") or not ent.get("evt"):
            return
        expected = ent.get("n_img", 0)
        if ent["got"] < expected and not ent.get("timed_out"):
            return                      # still waiting for pictures
        ent["resolved"] = True

        good = [r for r in ent["results"].values() if r is not None]
        per_frame = [r[0] for r in good]
        # Rule: the highest head count seen in any picture of the burst.
        n = max(per_frame) if per_frame else None
        conf = max((r[1] for r in good if r[0] == n), default=0.0) if good else 0.0
        if n is None:
            counted, note = 1, "ir_only"
        elif n == 0:
            counted, note = 1, "camera_saw_nobody"
        else:
            counted, note = n, "camera"
        mismatch = n is not None and n != 1

        is_entry = ent["dir"] == "E"
        if is_entry:
            state["cam_entry"] += counted
        else:
            state["cam_exit"] += counted
        occupancy = max(0, state["cam_entry"] - state["cam_exit"])
        cam_entry, cam_exit = state["cam_entry"], state["cam_exit"]
        save_state()
        ir_entry, ir_exit = ent["ir_entry"], ent["ir_exit"]
        location = list(last_gps) if last_gps else None

    pct, cat = load_info(occupancy)
    now_ms = int(time.time() * 1000)

    event_payload = {
        "jeepneyId": JEEPNEY_ID,
        "eventType": "ENTRY" if is_entry else "EXIT",
        "eventId": eid,
        "trackingId": int(eid, 16) if all(c in "0123456789abcdefABCDEF" for c in eid) else -1,
        "confidence": round(float(conf), 2),
        "currentOccupancy": occupancy,
        "timestamp": now_ms,
        "personsCounted": counted,
        "cameraCount": n,
        "perPictureCounts": per_frame,
        "picturesAnalyzed": len(good),
        "irCount": 1,
        "mismatch": mismatch,
        "source": note,
    }
    if location:
        event_payload["location"] = location
    fb_send("POST", FIREBASE_EVENTS_URL, event_payload)

    fb_send("PATCH", FIREBASE_TELEMETRY_URL, {
        "occupiedSeats": occupancy,
        "totalSeats": MAX_JEEPNEY_CAPACITY,
        "capacityPct": pct,
        "loadCategory": cat,
        "camEntryCount": cam_entry,
        "camExitCount": cam_exit,
        "irEntryCount": ir_entry,
        "irExitCount": ir_exit,
        "lastUpdate": now_ms,
        "isOnline": True,
    })
    log.info("%s %s: pictures say %s -> counted %d (%s)%s -> occupancy %d/%d (%s)",
             event_payload["eventType"], eid, per_frame, counted, note,
             "  ** MISMATCH with IR **" if mismatch else "", occupancy, MAX_JEEPNEY_CAPACITY, cat)


def sweeper():
    """Clean up stale items and fall back to what we have if pictures never arrive."""
    while True:
        time.sleep(10)
        now = time.time()
        to_resolve = []
        with lock:
            for eid, ent in list(entries.items()):
                age = now - ent["t"]
                if (ent.get("evt") and not ent.get("resolved")
                        and ent.get("n_img", 0) > ent["got"] and age > IMAGE_WAIT_SECONDS):
                    ent["timed_out"] = True
                    to_resolve.append(eid)
                    log.warning("Pictures for %s did not all arrive, using what we have", eid)
                elif age > 900:
                    del entries[eid]
            for key, part in list(partials.items()):
                if now - part["t"] > IMAGE_WAIT_SECONDS:
                    del partials[key]
        for eid in to_resolve:
            executor.submit(try_resolve, eid)


# ---------------------------------------------------------------------------
# MQTT
# ---------------------------------------------------------------------------
def on_connect(client, userdata, flags, rc, properties=None):
    log.info("MQTT connected (%s). Subscribing to %s/#", rc, BASE_TOPIC)
    client.subscribe(BASE_TOPIC + "/#", qos=0)


def on_message(client, userdata, msg):
    now = time.time()
    pkt_bytes = len(msg.payload)
    with lock:
        last_rx = net_stats["last_rx_time"]
        net_stats["last_rx_time"] = now
        net_stats["rx_bytes_window"] += pkt_bytes
        win_dt = now - net_stats["window_start"]
        if win_dt >= 10.0:
            avg_rx_kbps = (net_stats["rx_bytes_window"] * 8 / 1000.0) / win_dt
            net_stats["rx_bytes_window"] = 0
            net_stats["window_start"] = now
        else:
            avg_rx_kbps = None
    gap_str = f"{now - last_rx:.2f}s since last pkt" if last_rx else "first pkt"
    try:
        text = msg.payload.decode("ascii")
    except UnicodeDecodeError:
        return
    msg_type = text[:2]
    log.info("[SIM-RX] %s packet (%dB) | %s%s",
             msg_type, pkt_bytes, gap_str,
             f" | 10s Avg Throughput: {avg_rx_kbps:.1f} kbps" if avg_rx_kbps is not None else "")
    if text.startswith("T;"):
        executor.submit(handle_telemetry, text)
    elif text.startswith("E;"):
        handle_event(text)
    elif text.startswith("I;"):
        handle_chunk(text)


def main():
    global model
    load_state("--reset" in sys.argv)

    log.info("Loading YOLO model %s ...", YOLO_MODEL_NAME)
    model = YOLO(YOLO_MODEL_NAME)
    model.predict(np.zeros((480, 640, 3), dtype=np.uint8), verbose=False)   # warm-up
    log.info("Model ready.")

    threading.Thread(target=sweeper, daemon=True).start()

    cid = f"flowjeep-bridge-{int(time.time())}"
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=cid)
    except AttributeError:          # older paho-mqtt (1.x)
        client = mqtt.Client(client_id=cid)
    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect_async(MQTT_HOST, MQTT_PORT, keepalive=60)
    try:
        client.loop_forever(retry_first_connection=True)
    except KeyboardInterrupt:
        log.info("Stopping.")


if __name__ == "__main__":
    main()
