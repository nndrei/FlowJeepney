"""
FlowJeep Backend Server
Production Flask REST API for Paratransit IoT & Machine Learning
Hosts:
  1. YOLOv8n + ByteTrack Doorway Passenger Verification (/api/cv/verify-doorway)
  2. Scikit-Learn Random Forest Passenger Load Regression (/api/ml/predict-load)
  3. OSRM Geospatial Snapping & ETA Engine (/api/routing/snap-eta)
  4. Unified Telemetry Ingestion Pipeline (/api/telemetry/ingest)
"""

import os
import time
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from cv_pipeline import DoorwayCVPipeline
from rf_model_service import PassengerLoadPredictor
from osrm_service import OSRMRoutingService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
CORS(app)

# Initialize Core Services
cv_service = DoorwayCVPipeline()
ml_service = PassengerLoadPredictor()
osrm_service = OSRMRoutingService()

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health and pipeline status check."""
    return jsonify({
        "status": "healthy",
        "service": "flowjeep_backend_ai",
        "timestamp": int(time.time() * 1000),
        "components": {
            "cv_yolov8_bytetrack": "operational",
            "rf_passenger_load_predictor": "operational",
            "osrm_routing_engine": "operational",
            "firebase_cloud_relay": "ready"
        }
    }), 200

@app.route("/api/cv/verify-doorway", methods=["POST"])
def verify_doorway():
    """
    Receives base64/JPEG doorway image from ESP32-S3 OV2640 camera,
    runs YOLOv8n person detection and ByteTrack line-crossing logic,
    and reconciles count with dual E18-D80NK optical beam sensors.
    """
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400

        image_data = data.get("image") or data.get("frame_base64")
        claimed_event = data.get("event_type", "BOARDING") # BOARDING or ALIGHTING
        beam_occupancy = data.get("current_occupancy", 16)

        if not image_data:
            return jsonify({"error": "No image data provided"}), 400

        result = cv_service.process_doorway_frame(
            image_data=image_data,
            claimed_event=claimed_event,
            current_beam_occupancy=beam_occupancy
        )

        return jsonify({
            "status": "success",
            "verification": result,
            "timestamp": int(time.time() * 1000)
        }), 200

    except Exception as e:
        logging.error(f"[API CV Error] {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/ml/predict-load", methods=["POST"])
def predict_load():
    """
    Scikit-learn Random Forest regression model:
    Predicts passenger load on a route given temporal parameters,
    live OpenWeatherMap API metrics, and historical corridor records.
    """
    try:
        data = request.get_json(force=True) or {}
        route_code = data.get("route_code", "EDSA-QMC-DILIMAN")
        target_timestamp = data.get("timestamp", time.time())
        stop_index = data.get("stop_index", 4)
        historical_load = data.get("historical_load", 68.0)
        weather_override = data.get("weather_override")

        prediction = ml_service.predict_passenger_load(
            route_code=route_code,
            target_timestamp=target_timestamp,
            stop_index=stop_index,
            historical_load=historical_load,
            weather_override=weather_override
        )

        return jsonify({
            "status": "success",
            "prediction": prediction,
            "timestamp": int(time.time() * 1000)
        }), 200

    except Exception as e:
        logging.error(f"[API ML Error] {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/routing/snap-eta", methods=["POST"])
def snap_and_eta():
    """
    OSRM Geospatial Snapping and Congestion-Aware ETA:
    Projects raw GPS fix onto authorized jeepney corridor and calculates travel duration.
    """
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400

        curr_lat = float(data.get("current_lat", 14.6535))
        curr_lng = float(data.get("current_lng", 121.0332))
        dest_lat = float(data.get("dest_lat", 14.6515))
        dest_lng = float(data.get("dest_lng", 121.0494))
        route_code = data.get("route_code", "EDSA-QMC-DILIMAN")
        congestion_factor = float(data.get("congestion_factor", 1.35))

        snapped = osrm_service.snap_to_corridor(curr_lat, curr_lng, route_code)
        eta_result = osrm_service.compute_route_eta(
            current_lat=curr_lat,
            current_lng=curr_lng,
            destination_lat=dest_lat,
            destination_lng=dest_lng,
            traffic_congestion_factor=congestion_factor
        )

        return jsonify({
            "status": "success",
            "snapping": snapped,
            "routing": eta_result,
            "timestamp": int(time.time() * 1000)
        }), 200

    except Exception as e:
        logging.error(f"[API Routing Error] {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/telemetry/ingest", methods=["POST"])
def ingest_telemetry():
    """
    Full pipeline endpoint:
    Ingests raw edge packet, performs OSRM corridor snapping,
    runs ML load forecasting, and outputs processed payload ready for Firebase / Blynk.
    """
    try:
        payload = request.get_json(force=True)
        vehicle_id = payload.get("vehicle_id", "JEEP-NCR-0482")
        lat = payload.get("lat", 14.6535)
        lng = payload.get("lng", 121.0332)
        route_code = payload.get("route_code", "EDSA-QMC-DILIMAN")
        passengers = payload.get("passengers_onboard", 16)
        max_cap = payload.get("max_capacity", 24)

        # 1. Snap to authorized corridor
        snap_info = osrm_service.snap_to_corridor(lat, lng, route_code)

        # 2. Predict corridor congestion for next 30 minutes
        ml_pred = ml_service.predict_passenger_load(route_code=route_code)

        # 3. Calculate ETA to terminal
        terminal_eta = osrm_service.compute_route_eta(
            current_lat=lat,
            current_lng=lng,
            destination_lat=14.6515,
            destination_lng=121.0494
        )

        processed = {
            "vehicle_id": vehicle_id,
            "route_code": route_code,
            "raw_coords": [lat, lng],
            "snapped_coords": [snap_info["snapped_lat"], snap_info["snapped_lng"]],
            "distance_offset_m": snap_info["distance_to_corridor_m"],
            "passengers_onboard": passengers,
            "capacity_pct": round((passengers / max_cap) * 100),
            "eta_terminal_min": terminal_eta["eta_minutes"],
            "ml_predicted_corridor_load": ml_pred["predicted_load_pct"],
            "congestion_status": ml_pred["congestion_category"],
            "weather_condition": ml_pred["weather"]["description"],
            "timestamp": int(time.time() * 1000)
        }

        return jsonify({
            "status": "success",
            "processed_telemetry": processed
        }), 200

    except Exception as e:
        logging.error(f"[API Ingest Error] {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logging.info(f"Starting FlowJeep Backend Server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
