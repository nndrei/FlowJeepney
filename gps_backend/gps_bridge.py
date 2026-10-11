"""
FlowJeep GPS Backend Bridge
Relays live GPS telemetry from USB Serial (ESP32 NEO-6M) or simulation mode
directly into FlowJeep's Firebase Realtime Database (/live_telemetry/{JEEPNEY_ID}).
"""

import sys
import time
import re
import math
import argparse
import json
import requests
from pathlib import Path

# Load config
try:
    from config import (
        FIREBASE_TELEMETRY_URL,
        FIREBASE_DEVICE_URL,
        JEEPNEY_ID,
        ROUTE_ID,
        ROUTE_NAME,
        PLATE_NUMBER,
        DEVICE_ID,
        DEFAULT_SERIAL_PORT,
        DEFAULT_BAUD_RATE,
        TELEMETRY_INTERVAL_SECONDS,
    )
except ImportError:
    from gps_backend.config import (
        FIREBASE_TELEMETRY_URL,
        FIREBASE_DEVICE_URL,
        JEEPNEY_ID,
        ROUTE_ID,
        ROUTE_NAME,
        PLATE_NUMBER,
        DEVICE_ID,
        DEFAULT_SERIAL_PORT,
        DEFAULT_BAUD_RATE,
        TELEMETRY_INTERVAL_SECONDS,
    )

# Corridor Waypoints: EDSA Route 1 (Baclaran -> Ayala -> Ortigas -> Cubao -> Monumento)
CORRIDOR_WAYPOINTS = [
    (14.5342, 120.9985, "Baclaran Terminal"),
    (14.5378, 121.0014, "Taft Ave / EDSA"),
    (14.5420, 121.0105, "Magallanes"),
    (14.5510, 121.0280, "One Ayala Terminal"),
    (14.5585, 121.0340, "Buendia"),
    (14.5700, 121.0450, "Guadalupe"),
    (14.5770, 121.0530, "Boni Ave"),
    (14.5868, 121.0565, "Shaw Blvd / Ortigas"),
    (14.5980, 121.0585, "Santolan"),
    (14.6195, 121.0515, "Cubao / Araneta"),
    (14.6345, 121.0435, "GMA Kamuning"),
    (14.6475, 121.0380, "Quezon Ave"),
    (14.6544, 121.0305, "North Ave / Trinoma"),
    (14.6575, 121.0205, "Roosevelt / FPJ"),
    (14.6560, 120.9980, "Balintawak"),
    (14.6540, 120.9840, "Monumento Rotonda"),
]


def push_telemetry(lat: float, lng: float, speed_kmh: float = 0.0, heading: float = 0.0, sats: int = 8, hdop: float = 1.0) -> bool:
    """Publishes GPS telemetry directly to Firebase Realtime Database via HTTP PATCH."""
    now_ms = int(time.time() * 1000)
    payload = {
        "jeepneyId": JEEPNEY_ID,
        "plateNumber": PLATE_NUMBER,
        "routeId": ROUTE_ID,
        "routeName": ROUTE_NAME,
        "currentCoord": [round(lat, 6), round(lng, 6)],
        "speedKmh": round(speed_kmh, 1),
        "headingDegrees": round(heading, 1),
        "satellites": int(sats),
        "hdop": round(hdop, 2),
        "isOnline": True,
        "lastUpdate": now_ms,
    }

    try:
        resp = requests.patch(
            FIREBASE_TELEMETRY_URL,
            json=payload,
            timeout=4.0
        )
        if resp.status_code in (200, 204):
            print(f"[{time.strftime('%H:%M:%S')}] [Firebase OK] Coords: [{lat:.6f}, {lng:.6f}] | Speed: {speed_kmh:.1f} km/h | Heading: {heading:.0f} deg")
            return True
        else:
            print(f"[{time.strftime('%H:%M:%S')}] [Firebase Warn] HTTP {resp.status_code}: {resp.text[:120]}")
            return False
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [Firebase Error] {e}")
        return False


def run_simulation(interval: float = 2.0, once: bool = False):
    """Simulates realistic vehicle travel along the route corridor."""
    print("=" * 60)
    print(" FlowJeep GPS Telemetry Simulator (Real-time Firebase Sync)")
    print(f" Target URL: {FIREBASE_TELEMETRY_URL}")
    print(f" Vehicle ID: {JEEPNEY_ID} | Route: {ROUTE_NAME}")
    print("=" * 60)

    step_index = 0
    total_waypoints = len(CORRIDOR_WAYPOINTS)

    while True:
        wp_curr = CORRIDOR_WAYPOINTS[step_index % total_waypoints]
        wp_next = CORRIDOR_WAYPOINTS[(step_index + 1) % total_waypoints]

        # Interpolate between waypoints for smooth motion
        steps_between = 5
        for sub in range(steps_between):
            ratio = sub / float(steps_between)
            lat = wp_curr[0] + (wp_next[0] - wp_curr[0]) * ratio
            lng = wp_curr[1] + (wp_next[1] - wp_curr[1]) * ratio

            # Calculate heading
            dlat = wp_next[0] - wp_curr[0]
            dlng = wp_next[1] - wp_curr[1]
            heading = math.degrees(math.atan2(dlng, dlat))
            if heading < 0:
                heading += 360.0

            # Realistic urban jeepney speed: 18 - 38 km/h
            speed = 22.0 + 8.0 * math.sin(step_index + sub)

            push_telemetry(lat, lng, speed_kmh=speed, heading=heading, sats=9, hdop=0.9)

            if once:
                print("Single test telemetry point pushed successfully.")
                return

            time.sleep(interval)

        step_index += 1


def run_serial_bridge(port_name: str, baud_rate: int):
    """Reads Serial output from an ESP32 connected via USB and pushes GPS to Firebase."""
    try:
        import serial
        import serial.tools.list_ports
    except ImportError:
        print("ERROR: pyserial is required for USB serial mode. Run: pip install pyserial")
        sys.exit(1)

    print("=" * 60)
    print(" FlowJeep ESP32 GPS USB-to-Firebase Bridge")
    print(f" Target URL : {FIREBASE_TELEMETRY_URL}")
    print(f" Serial Port: {port_name} @ {baud_rate} baud")
    print("=" * 60)

    try:
        ser = serial.Serial(port_name, baud_rate, timeout=1.0)
        print(f"Connected to {port_name}. Listening for GPS data...\n")
    except Exception as e:
        print(f"Failed to open port {port_name}: {e}")
        print("Available serial ports:")
        ports = serial.tools.list_ports.comports()
        for p in ports:
            print(f"  - {p.device} ({p.description})")
        return

    curr_lat = None
    curr_lng = None
    curr_speed = 0.0
    curr_sats = 0
    last_push_time = 0.0

    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            print(f"[ESP32] {line}")

            # Match standard output from gps.ino:
            # "Latitude         : 14.654321"
            # "Longitude        : 120.987654"
            # "Speed (km/h)     : 24.50"
            lat_match = re.search(r"Latitude\s*:\s*([-+]?\d+\.\d+)", line)
            if lat_match:
                curr_lat = float(lat_match.group(1))

            lng_match = re.search(r"Longitude\s*:\s*([-+]?\d+\.\d+)", line)
            if lng_match:
                curr_lng = float(lng_match.group(1))

            speed_match = re.search(r"Speed\s*\(km/h\)\s*:\s*([-+]?\d+\.?\d*)", line)
            if speed_match:
                curr_speed = float(speed_match.group(1))

            sats_match = re.search(r"Satellites seen\s*:\s*(\d+)", line)
            if sats_match:
                curr_sats = int(sats_match.group(1))

            # Push telemetry if coordinates are valid and interval elapsed
            now = time.time()
            if curr_lat is not None and curr_lng is not None and (now - last_push_time >= TELEMETRY_INTERVAL_SECONDS):
                last_push_time = now
                push_telemetry(curr_lat, curr_lng, speed_kmh=curr_speed, sats=curr_sats)

        except KeyboardInterrupt:
            print("\nBridge stopped by user.")
            break
        except Exception as e:
            print(f"Error reading serial: {e}")
            time.sleep(1.0)

    ser.close()


def main():
    parser = argparse.ArgumentParser(description="FlowJeep GPS Firebase Telemetry Bridge")
    parser.add_argument("--simulate", action="store_true", help="Run simulated GPS track along Manila EDSA corridor")
    parser.add_argument("--once", action="store_true", help="Send a single test packet and exit")
    parser.add_argument("--port", type=str, default=DEFAULT_SERIAL_PORT, help=f"Serial port name (default: {DEFAULT_SERIAL_PORT})")
    parser.add_argument("--baud", type=int, default=DEFAULT_BAUD_RATE, help=f"Serial baud rate (default: {DEFAULT_BAUD_RATE})")
    parser.add_argument("--interval", type=float, default=TELEMETRY_INTERVAL_SECONDS, help="Telemetry update interval in seconds")

    args = parser.parse_args()

    if args.simulate or args.once:
        run_simulation(interval=args.interval, once=args.once)
    else:
        run_serial_bridge(args.port, args.baud)


if __name__ == "__main__":
    main()
