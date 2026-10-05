"""
FlowJeep Cloud Relay: High-Performance MQTT to Firebase Realtime Database Bridge
Connects cellular edge vehicle publishers to Firebase RTDB for sub-100ms client fanout.
"""

import json
import logging
import os
import time
from typing import Dict, Any
import paho.mqtt.client as mqtt
import firebase_admin
from firebase_admin import credentials, db

# Configuration
MQTT_BROKER_HOST = os.getenv("MQTT_HOST", "mqtt.flowjeep.transport.gov.ph")
MQTT_BROKER_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_USER = os.getenv("MQTT_USER", "relay_service")
MQTT_PASS = os.getenv("MQTT_PASS", "relay_secure_pass_921")
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DB_URL", "https://flowjeep-paratransit-default-rtdb.asia-southeast1.firebasedatabase.app")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("serviceAccountKey.json") if os.path.exists("serviceAccountKey.json") else credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'databaseURL': FIREBASE_DATABASE_URL
    })
    logging.info("[Firebase] Connected to Realtime Database successfully.")
except Exception as e:
    logging.warning(f"[Firebase] Initialization note (falling back to emulator/mock if creds missing): {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logging.info("[MQTT] Connected to Edge MQTT Broker. Subscribing to vehicle topics...")
        # Subscribe to all paratransit edge node telemetry and events
        client.subscribe("paratransit/flowjeep/+/telemetry", qos=1)
        client.subscribe("paratransit/flowjeep/+/doorway_event", qos=1)
        client.subscribe("paratransit/flowjeep/+/camera_frame", qos=1)
    else:
        logging.error(f"[MQTT] Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    try:
        topic_parts = msg.topic.split('/')
        if len(topic_parts) < 4:
            return
        
        vehicle_id = topic_parts[2]
        event_type = topic_parts[3] # telemetry, doorway_event, camera_frame
        payload_str = msg.payload.decode('utf-8')
        payload_json = json.loads(payload_str)

        ref_vehicle = db.reference(f"vehicles/{vehicle_id}")

        if event_type == "telemetry":
            # Direct atomic update into Firebase Realtime Database
            ref_vehicle.child("telemetry").update({
                "lat": payload_json.get("lat"),
                "lng": payload_json.get("lng"),
                "speed_kph": payload_json.get("speed_kph", 0),
                "heading": payload_json.get("heading", 0),
                "passengers_onboard": payload_json.get("passengers_onboard", 0),
                "capacity_pct": payload_json.get("capacity_pct", 0),
                "total_boarded": payload_json.get("total_boarded", 0),
                "total_alighted": payload_json.get("total_alighted", 0),
                "lte_csq": payload_json.get("lte_csq", 0),
                "battery_v": payload_json.get("battery_v", 13.8),
                "timestamp": payload_json.get("timestamp", int(time.time() * 1000)),
                "last_relay_sync": int(time.time() * 1000)
            })
            logging.info(f"[Relay] Updated telemetry for {vehicle_id}: {payload_json.get('passengers_onboard')} pax")

        elif event_type == "doorway_event":
            # Append doorway crossing event for commuter and operator logs
            event_id = f"evt_{int(time.time() * 1000)}"
            ref_vehicle.child(f"doorway_events/{event_id}").set({
                "type": payload_json.get("type"),
                "delta": payload_json.get("delta"),
                "occupancy": payload_json.get("occupancy"),
                "timestamp": payload_json.get("timestamp", int(time.time() * 1000))
            })
            logging.info(f"[Relay] Logged doorway event {payload_json.get('type')} on {vehicle_id}")

    except Exception as e:
        logging.error(f"[Relay] Error handling message on topic {msg.topic}: {e}")

def main():
    client = mqtt.Client(client_id="flowjeep_cloud_relay_daemon")
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = on_connect
    client.on_message = on_message

    logging.info(f"[Relay] Connecting to MQTT broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}...")
    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
        client.loop_forever()
    except KeyboardInterrupt:
        logging.info("[Relay] Shutting down bridge gracefully.")
    except Exception as e:
        logging.error(f"[Relay] Fatal MQTT error: {e}")

if __name__ == "__main__":
    main()
