# FlowJeep Camera Vision - Main Application Entry Point
# File: main.py
# Purpose: Real-time passenger counting prototype via Person Appearance & Disappearance.
#          Uses ESP32-CAM stream (or webcam/video file), YOLOv8n, ByteTrack, missing-frames exit logic,
#          and AUTOMATIC live telemetry sync to Firebase Realtime Database.

import sys
import time
import logging
import cv2
import requests
import numpy as np
from pathlib import Path

# Local subsystem modules
from config import (
    CAMERA_SOURCE,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    TARGET_FPS,
    ENABLE_THREADED_CAMERA,
    YOLO_MODEL_NAME,
    DETECTION_CONFIDENCE,
    TARGET_CLASSES,
    INFERENCE_IMAGE_SIZE,
    DEVICE,
    TRACKER_TYPE,
    TRAJECTORY_MAX_POINTS,
    PERSON_MISSING_FRAMES,
    CONFIRM_APPEARANCE_FRAMES,
    REENTRY_COOLDOWN_FRAMES,
    INITIAL_PASSENGER_COUNT,
    LOGS_DIR,
    CSV_LOG_FILENAME,
    EXIT_TIMEOUT_SECONDS,
    MIN_PERSON_HEIGHT,
    MIN_PERSON_WIDTH,
    MIN_ASPECT_RATIO,
    MAX_ASPECT_RATIO,
    CAMERA_RECONNECT_DELAY,
    COLOR_BBOX,
    COLOR_BBOX_TEXT,
    COLOR_TRAIL,
    COLOR_HUD_BG,
    COLOR_ENTRY,
    COLOR_EXIT,
    ENABLE_FIREBASE_SYNC,
    FIREBASE_TELEMETRY_URL,
    FIREBASE_EVENTS_URL,
    FIREBASE_DEVICE_URL,
    DEVICE_ID,
    ESP32_CAM_IP,
    JEEPNEY_ID,
    ROUTE_ID,
    ROUTE_NAME,
    PLATE_NUMBER,
    MAX_JEEPNEY_CAPACITY,
)
from camera import CameraStream
from tracker import PassengerTracker
from counter import AppearancePassengerCounter
from logger import EventLogger

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("flowjeep.main")


def draw_hud_overlay(
    frame: np.ndarray,
    counter: AppearancePassengerCounter,
    fps: float,
    status: str,
    recent_toast: str,
    toast_timer: float,
) -> np.ndarray:
    """
    Renders the FlowJeep engineering HUD:
    FLOWJEEP CAMERA VISION
    Entry: 5
    Exit: 2
    Current Passengers: 3
    Active IDs: 3
    FPS: 24.6
    Status: RUNNING
    """
    h, w, _ = frame.shape
    stats = counter.get_stats()

    overlay = frame.copy()
    panel_w = 270
    panel_h = 160
    cv2.rectangle(overlay, (12, 12), (panel_w, panel_h), COLOR_HUD_BG, -1)
    cv2.addWeighted(overlay, 0.88, frame, 0.12, 0, frame)
    cv2.rectangle(frame, (12, 12), (panel_w, panel_h), (50, 60, 70), 1)

    cv2.putText(frame, "FLOWJEEP CAMERA VISION", (22, 34), cv2.FONT_HERSHEY_DUPLEX, 0.52, (0, 215, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"Entry: {stats['entry_count']}", (22, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (120, 255, 120), 1, cv2.LINE_AA)
    cv2.putText(frame, f"Exit: {stats['exit_count']}", (22, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (100, 150, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"Current Passengers: {stats['current_passenger_count']}", (22, 102), cv2.FONT_HERSHEY_DUPLEX, 0.54, (0, 240, 160), 1, cv2.LINE_AA)

    active_str = f"Active IDs: {stats['active_ids_count']}"
    if stats['active_ids_list']:
        active_str += f" ({', '.join(map(str, stats['active_ids_list'][:4]))})"
    cv2.putText(frame, active_str, (22, 122), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (200, 200, 200), 1, cv2.LINE_AA)
    cv2.putText(frame, f"FPS: {fps:.1f} | Status: {status}", (22, 142), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (160, 220, 255), 1, cv2.LINE_AA)

    cv2.putText(
        frame,
        f"[Q] Quit | [R] Reset | [+/-] Missing Thresh ({counter.person_missing_frames} frames) | [S] Snap",
        (14, h - 12),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.38,
        (160, 160, 160),
        1,
        cv2.LINE_AA,
    )

    if recent_toast and (time.time() - toast_timer < 2.5):
        toast_y = h - 35
        toast_color = COLOR_ENTRY if ("ENTRY" in recent_toast or "CANCELLED" in recent_toast) else COLOR_EXIT
        cv2.rectangle(frame, (12, toast_y - 20), (w - 12, toast_y + 8), (15, 20, 25), -1)
        cv2.rectangle(frame, (12, toast_y - 20), (w - 12, toast_y + 8), toast_color, 1)
        cv2.putText(frame, recent_toast, (24, toast_y - 2), cv2.FONT_HERSHEY_DUPLEX, 0.50, (255, 255, 255), 1, cv2.LINE_AA)

    return frame


def draw_detected_people(frame: np.ndarray, tracks: list) -> np.ndarray:
    """Renders bounding box and requested label: Person #<ID> \n <Confidence>"""
    for track in tracks:
        track_id = track["track_id"]
        conf = track["confidence"]
        x1, y1, x2, y2 = track["bbox"]

        cv2.rectangle(frame, (x1, y1), (x2, y2), COLOR_BBOX, 2)
        label_line1 = f"Person #{track_id}"
        label_line2 = f"{conf:.2f}"

        (w1, h1), _ = cv2.getTextSize(label_line1, cv2.FONT_HERSHEY_SIMPLEX, 0.46, 1)
        (w2, h2), _ = cv2.getTextSize(label_line2, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
        tag_w = max(w1, w2) + 8
        tag_h = h1 + h2 + 8
        tag_y1 = max(0, y1 - tag_h - 2)
        tag_y2 = tag_y1 + tag_h

        cv2.rectangle(frame, (x1, tag_y1), (x1 + tag_w, tag_y2), COLOR_BBOX, -1)
        cv2.putText(frame, label_line1, (x1 + 4, tag_y1 + h1 + 1), cv2.FONT_HERSHEY_SIMPLEX, 0.46, COLOR_BBOX_TEXT, 1, cv2.LINE_AA)
        cv2.putText(frame, label_line2, (x1 + 4, tag_y2 - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (40, 40, 40), 1, cv2.LINE_AA)

    return frame


def main():
    camera = CameraStream(
        source=CAMERA_SOURCE,
        width=FRAME_WIDTH,
        height=FRAME_HEIGHT,
        target_fps=TARGET_FPS,
        use_threading=ENABLE_THREADED_CAMERA,
        reconnect_delay=CAMERA_RECONNECT_DELAY,
    )
    if not camera.start():
        logger.error("Could not open camera source: %s", CAMERA_SOURCE)
        return

    tracker = PassengerTracker(
        model_name=YOLO_MODEL_NAME,
        tracker_config=TRACKER_TYPE,
        confidence_threshold=DETECTION_CONFIDENCE,
        target_classes=TARGET_CLASSES,
        imgsz=INFERENCE_IMAGE_SIZE,
        max_trajectory_points=TRAJECTORY_MAX_POINTS,
        device=DEVICE,
        min_height=MIN_PERSON_HEIGHT,
        min_width=MIN_PERSON_WIDTH,
        min_aspect_ratio=MIN_ASPECT_RATIO,
        max_aspect_ratio=MAX_ASPECT_RATIO,
    )
    counter = AppearancePassengerCounter(
        person_missing_frames=PERSON_MISSING_FRAMES,
        confirm_appearance_frames=CONFIRM_APPEARANCE_FRAMES,
        reentry_cooldown_frames=REENTRY_COOLDOWN_FRAMES,
        initial_passenger_count=INITIAL_PASSENGER_COUNT,
        exit_timeout_seconds=EXIT_TIMEOUT_SECONDS,
    )
    event_logger = EventLogger(log_dir=LOGS_DIR, filename=CSV_LOG_FILENAME)

    window_name = "FlowJeep Camera Vision"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    recent_toast = ""
    toast_timer = 0.0
    prev_time = time.time()
    fps = 0.0
    status = "RUNNING"
    last_heartbeat = time.time()

    def sync_firebase(count: int, is_heartbeat: bool = False):
        if not ENABLE_FIREBASE_SYNC:
            return
        now_ms = int(time.time() * 1000)
        capacity_pct = round((count / MAX_JEEPNEY_CAPACITY) * 100)
        load_cat = "Seats Available" if capacity_pct < 80 else ("Near-Full" if capacity_pct < 95 else "Full / Standing")
        telemetry_payload = {
            "jeepneyId": JEEPNEY_ID,
            "routeId": ROUTE_ID,
            "routeCode": "Route 1",
            "routeName": ROUTE_NAME,
            "plateNumber": PLATE_NUMBER,
            "currentCoord": [14.6544, 120.9839],
            "headingDegrees": 88.0,
            "speedKmh": 24.0,
            "occupiedSeats": count,
            "totalSeats": MAX_JEEPNEY_CAPACITY,
            "capacityPct": capacity_pct,
            "loadCategory": load_cat,
            "lastUpdate": now_ms,
            "isOnline": True,
        }
        device_payload = {
            "deviceId": DEVICE_ID,
            "jeepneyId": JEEPNEY_ID,
            "plateNumber": PLATE_NUMBER,
            "esp32CamIp": ESP32_CAM_IP,
            "cameraStatus": "STREAMING",
            "dualBeamStatus": "CONNECTED",
            "lastHeartbeat": now_ms,
        }
        try:
            requests.patch(FIREBASE_TELEMETRY_URL, json=telemetry_payload, timeout=2.0)
            requests.patch(FIREBASE_DEVICE_URL, json=device_payload, timeout=2.0)
            if not is_heartbeat:
                logger.info(f"[Firebase Sync] Live passenger count pushed -> {count} / {MAX_JEEPNEY_CAPACITY} ({load_cat})")
        except Exception as e:
            logger.debug(f"[Firebase Sync Notice] {e}")

    disconnect_start_time = None
    is_marked_offline = False

    def mark_offline():
        if not ENABLE_FIREBASE_SYNC:
            return
        now_ms = int(time.time() * 1000)
        try:
            requests.patch(FIREBASE_TELEMETRY_URL, json={"isOnline": False, "lastUpdate": now_ms}, timeout=2.0)
            requests.patch(FIREBASE_DEVICE_URL, json={"cameraStatus": "DISCONNECTED", "lastHeartbeat": now_ms}, timeout=2.0)
            logger.info(f"[Firebase Sync] ESP32-CAM stream dropped -> Unit {JEEPNEY_ID} marked offline")
        except Exception as err:
            logger.debug(f"[Firebase Offline Sync Notice] {err}")

    # Immediately push active heartbeat to Firebase upon camera launch
    sync_firebase(0, is_heartbeat=True)
    logger.info(f"[Firebase Initialized] ESP32-CAM active: {ESP32_CAM_IP} -> Unit {JEEPNEY_ID}")

    try:
        while True:
            ok, frame = camera.read()
            if not ok or frame is None:
                if camera.is_live:
                    if disconnect_start_time is None:
                        disconnect_start_time = time.time()
                    elif not is_marked_offline and (time.time() - disconnect_start_time >= 4.0):
                        mark_offline()
                        is_marked_offline = True

                    # ESP32-CAM / webcam hiccup: keep the window alive while it reconnects
                    status = "WAITING FOR CAMERA"
                    placeholder = np.zeros((FRAME_HEIGHT, FRAME_WIDTH, 3), dtype=np.uint8)
                    cv2.putText(placeholder, "CONNECTING TO ESP32-CAM...", (60, FRAME_HEIGHT // 2 - 10),
                                cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 215, 255), 1, cv2.LINE_AA)
                    cv2.putText(placeholder, f"Source: {CAMERA_SOURCE}", (60, FRAME_HEIGHT // 2 + 25),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.44, (180, 180, 180), 1, cv2.LINE_AA)
                    cv2.putText(placeholder, "Make sure ESP32-CAM is powered and on 'Snow-WiFi'", (60, FRAME_HEIGHT // 2 + 55),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.40, (120, 120, 120), 1, cv2.LINE_AA)
                    placeholder = draw_hud_overlay(placeholder, counter, fps, status, recent_toast, toast_timer)
                    cv2.imshow(window_name, placeholder)
                    if cv2.waitKey(100) & 0xFF == ord("q"):
                        break
                    continue
                logger.warning("End of video / camera read failed, stopping.")
                break

            if disconnect_start_time is not None:
                disconnect_start_time = None
                if is_marked_offline:
                    is_marked_offline = False
                    sync_firebase(counter.get_stats()["current_passenger_count"], is_heartbeat=True)
                    logger.info(f"[Firebase Sync] ESP32-CAM reconnected -> Unit {JEEPNEY_ID} marked online")

            status = "RUNNING"

            tracks = tracker.update(frame)
            events = counter.update(tracks)
            for event in events:
                event_logger.log_event(event)
                recent_toast = f"{event['event_type']} - ID {event['tracking_id']}"
                toast_timer = time.time()

            # --- FLOWJEEP REALTIME FIREBASE SYNC ---
            if events and ENABLE_FIREBASE_SYNC:
                stats = counter.get_stats()
                new_count = stats["current_passenger_count"]
                now_ms = int(time.time() * 1000)

                # 1. Log doorway event to RTDB /doorway_events
                for evt in events:
                    try:
                        event_payload = {
                            "jeepneyId": JEEPNEY_ID,
                            "eventType": evt.get("event_type", "BOARDING"),
                            "trackingId": evt.get("tracking_id", -1),
                            "confidence": float(f"{evt.get('confidence', 0.0):.2f}"),
                            "currentOccupancy": new_count,
                            "timestamp": now_ms,
                            "location": [14.6544, 120.9839]
                        }
                        requests.post(FIREBASE_EVENTS_URL, json=event_payload, timeout=1.2)
                    except Exception as evt_err:
                        logger.debug(f"[Firebase Event Log Error] {evt_err}")

                # 2. Push updated passenger count
                sync_firebase(new_count, is_heartbeat=False)
                last_heartbeat = time.time()
            elif time.time() - last_heartbeat >= 5.0:
                # Periodic 5-second online heartbeat
                stats = counter.get_stats()
                sync_firebase(stats["current_passenger_count"], is_heartbeat=True)
                last_heartbeat = time.time()

            now = time.time()
            dt = now - prev_time
            prev_time = now
            if dt > 0:
                fps = (fps * 0.9) + ((1.0 / dt) * 0.1)

            frame = draw_detected_people(frame, tracks)
            frame = draw_hud_overlay(frame, counter, fps, status, recent_toast, toast_timer)

            cv2.imshow(window_name, frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):
                break
            elif key == ord("r"):
                counter.reset()
                tracker.reset()
                recent_toast = "COUNTER RESET"
                toast_timer = time.time()
                if ENABLE_FIREBASE_SYNC:
                    try:
                        requests.patch(FIREBASE_DATABASE_URL, json={"occupiedSeats": 0}, timeout=1.5)
                        logger.info("[Firebase Sync] Reset passenger count to 0")
                    except Exception as e:
                        logger.warning(f"[Firebase Sync Error] {e}")
            elif key == ord("+"):
                counter.person_missing_frames += 1
            elif key == ord("-"):
                counter.person_missing_frames = max(1, counter.person_missing_frames - 1)
            elif key == ord("s"):
                snap_path = LOGS_DIR / f"snapshot_{int(time.time())}.png"
                cv2.imwrite(str(snap_path), frame)
                recent_toast = f"SNAPSHOT SAVED"
                toast_timer = time.time()
    finally:
        mark_offline()
        camera.stop()
        event_logger.close()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
