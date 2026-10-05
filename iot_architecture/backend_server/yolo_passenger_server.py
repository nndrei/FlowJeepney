"""
FlowJeep YOLOv8 Passenger Counter Server
Receives camera frames from ESP32-CAM, runs YOLOv8 person detection,
and automatically pushes the live passenger count to Firebase Realtime Database.
"""

import io
import time
import requests
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

FIREBASE_URL = "https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app/vehicles/vehicle-01/telemetry.json"
TOTAL_SEATS = 22

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model (yolov8n is ultra-fast and lightweight)
print("[FlowJeep] Loading YOLOv8n model...")
from ultralytics import YOLO
model = YOLO("yolov8n.pt")
print("[FlowJeep] YOLOv8n model loaded successfully!")

@app.route("/upload-frame", methods=["POST"])
def upload_frame():
    try:
        # Get raw JPEG bytes from ESP32-CAM
        image_bytes = request.data
        if not image_bytes:
            return jsonify({"error": "Empty frame data"}), 400

        # Convert bytes to PIL Image / NumPy array
        pil_image = Image.open(io.BytesIO(image_bytes))
        frame = np.array(pil_image)

        # Run YOLOv8 inference: class 0 = 'person' in COCO dataset
        results = model(frame, classes=[0], conf=0.40, verbose=False)
        person_boxes = results[0].boxes
        person_count = len(person_boxes)

        print(f"[{time.strftime('%H:%M:%S')}] Detected {person_count} person(s) in frame.")

        # Push updated count to Firebase Realtime Database
        payload = {
            "occupiedSeats": person_count,
            "totalSeats": TOTAL_SEATS,
            "routeCode": "Route 1",
            "routeName": "Baclaran – Monumento",
            "plateNumber": "NDL-8421",
            "speedKmh": 24.0,
            "currentCoord": [14.6544, 120.9839],
            "lastVisionUpdate": int(time.time() * 1000)
        }

        try:
            fb_res = requests.patch(FIREBASE_URL, json=payload, timeout=3)
            fb_status = fb_res.status_code
        except Exception as fb_err:
            fb_status = f"Failed ({fb_err})"

        return jsonify({
            "status": "success",
            "person_count": person_count,
            "firebase_status": fb_status
        }), 200

    except Exception as e:
        print(f"[Error] Failed to process frame: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("[FlowJeep] Starting YOLOv8 Vision Server on port 5000...")
    print("ESP32-CAM should POST frames to: http://<YOUR_PC_IP>:5000/upload-frame")
    app.run(host="0.0.0.0", port=5000, debug=False)
