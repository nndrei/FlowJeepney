# FlowJeep Camera Vision - Configuration (ESP32-CAM-MB version)
# File: config.py
from pathlib import Path

# ---------------------------------------------------------------------------
# VIDEO SOURCE - pick ONE
# ---------------------------------------------------------------------------
# 1) ESP32-CAM-MB over Wi-Fi (run the esp32cam_live sketch, read the IP from Serial Monitor)
ESP32_CAM_IP = "192.168.100.173"          # <-- ESP32-CAM live stream IP
CAMERA_SOURCE = f"http://{ESP32_CAM_IP}:81/stream"

# 2) Laptop webcam (change to 0 to test immediately on your PC webcam!):
# CAMERA_SOURCE = 0

# 3) Video file test:
# CAMERA_SOURCE = "sample.mp4"

FRAME_WIDTH = 640    # frames are resized to this size (matches ESP32 FRAMESIZE_VGA)
FRAME_HEIGHT = 480
TARGET_FPS = 30
ENABLE_THREADED_CAMERA = True   # live sources: always process the NEWEST frame (no lag build-up)
CAMERA_RECONNECT_DELAY = 2.0    # seconds between reconnect attempts if Wi-Fi/stream drops

YOLO_MODEL_NAME = "yolov8n.pt"  # auto-downloaded by ultralytics if the file is missing
PERSON_CLASS_ID = 0
TARGET_CLASSES = [PERSON_CLASS_ID]  # STRICT REQUIREMENT: Only class 0 ('person')

# Configurable minimum confidence threshold for person detection
PERSON_CONFIDENCE = 0.50
DETECTION_CONFIDENCE = PERSON_CONFIDENCE  # Backward compatibility alias

# Human Geometry & Plausibility Filters (now applied in tracker.py)
# Values assume 640x480 frames. Aspect ratio = box height / box width.
MIN_PERSON_HEIGHT = 80
MIN_PERSON_WIDTH = 40
MIN_ASPECT_RATIO = 0.85
MAX_ASPECT_RATIO = 4.2

INFERENCE_IMAGE_SIZE = 640
DEVICE = None

TRACKER_TYPE = "bytetrack.yaml"
TRACK_BUFFER = 30
TRAJECTORY_MAX_POINTS = 15

# VIRTUAL LINE-CROSSING CONFIGURATION
# Default assumes camera looking down: doorway entrance is at the bottom of frame (BELOW),
# inside cabin is towards the top (ABOVE).
# ENTRY: Centroid moves from BELOW line to ABOVE line
# EXIT: Centroid moves from ABOVE line to BELOW line
LINE_Y = 240                     # Y-coordinate of the horizontal virtual line (0 to FRAME_HEIGHT)
LINE_HYSTERESIS = 25             # Dead-zone band (pixels) +/- LINE_Y to prevent boundary jitter
ENTRY_DIRECTION = "BELOW_TO_ABOVE"  # "BELOW_TO_ABOVE" or "ABOVE_TO_BELOW"

# TRACKING PERSISTENCE
TRACK_MAX_MISSING_FRAMES = 30    # Maximum frames to keep track alive after temporary occlusion

INITIAL_PASSENGER_COUNT = 0
MAX_JEEPNEY_CAPACITY = 22

# ---------------------------------------------------------------------------
# FIREBASE REALTIME DATABASE SYNC
# ---------------------------------------------------------------------------
ENABLE_FIREBASE_SYNC = True
FIREBASE_RTDB_BASE_URL = "https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app"
JEEPNEY_ID = "JEEP-NCR-0482"
ROUTE_ID = "route-1"
ROUTE_NAME = "Baclaran – Monumento via EDSA"
PLATE_NUMBER = "NDL-8421"
FIREBASE_TELEMETRY_URL = f"{FIREBASE_RTDB_BASE_URL}/live_telemetry/{JEEPNEY_ID}.json"
FIREBASE_EVENTS_URL = f"{FIREBASE_RTDB_BASE_URL}/doorway_events.json"
DEVICE_ID = "DEV-ESP32-01"
FIREBASE_DEVICE_URL = f"{FIREBASE_RTDB_BASE_URL}/devices/{DEVICE_ID}.json"

BASE_DIR = Path(__file__).resolve().parent
LOGS_DIR = BASE_DIR / "logs"
CSV_LOG_FILENAME = "events.csv"

COLOR_BBOX = (0, 220, 130)
COLOR_BBOX_TEXT = (0, 0, 0)
COLOR_TRAIL = (255, 180, 0)
COLOR_HUD_BG = (20, 24, 28)
COLOR_ENTRY = (50, 205, 50)
COLOR_EXIT = (0, 70, 255)
