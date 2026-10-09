# FlowJeep GPS Backend - Configuration
# File: config.py

# ---------------------------------------------------------------------------
# FIREBASE REALTIME DATABASE SYNC
# ---------------------------------------------------------------------------
ENABLE_FIREBASE_SYNC = True
FIREBASE_RTDB_BASE_URL = "https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app"

# Assigned vehicle identifiers (matches database schema & frontend)
JEEPNEY_ID = "JEEP-NCR-0482"
ROUTE_ID = "route-1"
ROUTE_NAME = "Baclaran – Monumento via EDSA"
PLATE_NUMBER = "NDL-8421"
DEVICE_ID = "DEV-ESP32-GPS-01"

# Endpoint URLs
FIREBASE_TELEMETRY_URL = f"{FIREBASE_RTDB_BASE_URL}/live_telemetry/{JEEPNEY_ID}.json"
FIREBASE_DEVICE_URL = f"{FIREBASE_RTDB_BASE_URL}/devices/{DEVICE_ID}.json"

# ---------------------------------------------------------------------------
# SERIAL PORT SETTINGS (for USB connected ESP32)
# ---------------------------------------------------------------------------
DEFAULT_SERIAL_PORT = "COM3"  # Windows: COM3, COM4 / Linux/Mac: /dev/ttyUSB0
DEFAULT_BAUD_RATE = 115200    # Matches ESP32 Serial.begin(115200)

# Sync interval in seconds
TELEMETRY_INTERVAL_SECONDS = 2.0
