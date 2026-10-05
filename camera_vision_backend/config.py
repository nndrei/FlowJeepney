# FlowJeep Camera Vision - Configuration (ESP32-CAM-MB version)
# File: config.py
from pathlib import Path

# ---------------------------------------------------------------------------
# VIDEO SOURCE - pick ONE
# ---------------------------------------------------------------------------
# 1) ESP32-CAM-MB over Wi-Fi (run the esp32cam_live sketch, read the IP from Serial Monitor)
ESP32_CAM_IP = "192.168.0.113"          # <-- Put your ESP32-CAM's IP here
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

# APPEARANCE & DISAPPEARANCE LOGIC (NO VIRTUAL LINES)
# The ESP32-CAM streams ~10-20 fps and YOLO on CPU may process fewer, so these are in
# PROCESSED frames. Raise PERSON_MISSING_FRAMES if people are counted as leaving too early.
EXIT_TIMEOUT_SECONDS = 0.0      # extra seconds a person must be absent before EXIT (0 = off)
PERSON_MISSING_FRAMES = 15
CONFIRM_APPEARANCE_FRAMES = 2
REENTRY_COOLDOWN_FRAMES = 30    # same ID back within this many frames after EXIT = tracker blip, EXIT is cancelled

INITIAL_PASSENGER_COUNT = 0
MAX_JEEPNEY_CAPACITY = 22

# ---------------------------------------------------------------------------
# FIREBASE REALTIME DATABASE SYNC
# ---------------------------------------------------------------------------
ENABLE_FIREBASE_SYNC = True
FIREBASE_DATABASE_URL = "https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app/vehicles/vehicle-01/telemetry.json"

BASE_DIR = Path(__file__).resolve().parent
LOGS_DIR = BASE_DIR / "logs"
CSV_LOG_FILENAME = "events.csv"

COLOR_BBOX = (0, 220, 130)
COLOR_BBOX_TEXT = (0, 0, 0)
COLOR_TRAIL = (255, 180, 0)
COLOR_HUD_BG = (20, 24, 28)
COLOR_ENTRY = (50, 205, 50)
COLOR_EXIT = (0, 70, 255)
