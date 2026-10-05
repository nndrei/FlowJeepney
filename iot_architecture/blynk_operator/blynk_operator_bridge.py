"""
FlowJeep Blynk IoT Fleet Operator Bridge
Synchronizes vehicle telemetry from Firebase Realtime Database to the Blynk IoT Cloud platform.
Enables fleet managers to view live GPS pins, passenger capacity gauges, and hardware diagnostics.
"""

import os
import time
import logging
import requests
import firebase_admin
from firebase_admin import credentials, db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BLYNK_AUTH_TOKEN = os.getenv("BLYNK_AUTH_TOKEN", "YOUR_BLYNK_DEVICE_AUTH_TOKEN")
BLYNK_SERVER = "https://blynk.cloud/external/api"
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DB_URL", "https://flowjeep-paratransit-default-rtdb.asia-southeast1.firebasedatabase.app")

def update_blynk_pin(pin: str, value: any):
    """Sends virtual pin updates to Blynk IoT Cloud REST API."""
    try:
        url = f"{BLYNK_SERVER}/update?token={BLYNK_AUTH_TOKEN}&{pin}={value}"
        res = requests.get(url, timeout=2.5)
        if res.status_code == 200:
            logging.debug(f"[Blynk] Updated {pin} = {value}")
        else:
            logging.warning(f"[Blynk] HTTP {res.status_code} for pin {pin}")
    except Exception as e:
        logging.error(f"[Blynk API Error] {e}")

def on_telemetry_change(event):
    """Firebase listener callback triggered on every edge telemetry push."""
    try:
        data = event.data
        if not data or not isinstance(data, dict):
            return

        lat = data.get("lat")
        lng = data.get("lng")
        passengers = data.get("passengers_onboard", 0)
        capacity_pct = data.get("capacity_pct", 0)
        speed = data.get("speed_kph", 0.0)
        total_boarded = data.get("total_boarded", 0)
        total_alighted = data.get("total_alighted", 0)
        csq = data.get("lte_csq", 24)
        volts = data.get("battery_v", 13.8)

        # Update Blynk Virtual Pins
        if lat and lng:
            # V0: Map Widget (lat,lon,name)
            update_blynk_pin("V0", f"{lat},{lng},FlowJeep-0482")

        update_blynk_pin("V1", passengers)
        update_blynk_pin("V2", capacity_pct)
        update_blynk_pin("V3", speed)
        update_blynk_pin("V6", total_boarded)
        update_blynk_pin("V7", total_alighted)
        update_blynk_pin("V8", csq)
        update_blynk_pin("V9", volts)

        logging.info(f"[Blynk Sync] Fleet sync: {passengers} pax ({capacity_pct}%), Speed: {speed} km/h")

    except Exception as e:
        logging.error(f"[Blynk Bridge Error] {e}")

def main():
    logging.info("[Blynk Bridge] Initializing Firebase & Blynk synchronization loop...")
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json") if os.path.exists("serviceAccountKey.json") else credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_DATABASE_URL})

        # Attach real-time listener to lead paratransit vehicle
        vehicle_ref = db.reference("vehicles/JEEP-NCR-0482/telemetry")
        vehicle_ref.listen(on_telemetry_change)
        logging.info("[Blynk Bridge] Real-time stream active. Press Ctrl+C to terminate.")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        logging.info("[Blynk Bridge] Shutdown requested.")
    except Exception as e:
        logging.error(f"[Blynk Bridge Fatal] {e}")

if __name__ == "__main__":
    main()
