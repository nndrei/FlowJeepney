# FlowJeep

> **Intelligent Public Transit Telemetry, AI Doorway Vision & Fleet Passenger Monitoring System**

FlowJeep is a modern transit telemetry platform designed for Philippine jeepneys and urban transit networks. It connects IoT-enabled edge hardware (ESP32-CAM), an AI computer vision passenger counting engine (YOLOv8 + ByteTrack), real-time cloud data pipelines (Firebase Realtime Database), and a mobile-friendly commuter web application (React + Vite + Leaflet).

---

## Table of Contents

1. [Overview](#1-what-is-flowjeep)
2. [Technology Stack](#2-what-technologies-does-it-use)
3. [Prerequisites](#3-prerequisites)
4. [Clone the Repository](#4-how-do-i-clone-the-repository)
5. [Install Frontend Dependencies](#5-how-do-i-install-frontend-dependencies)
6. [Install Python / Vision Dependencies](#6-how-do-i-install-backendpython-dependencies)
7. [Configure Environment Variables](#7-how-do-i-configure-environment-variables)
8. [Configure Firebase](#8-how-do-i-configure-firebase)
9. [Configure API Keys](#9-how-do-i-configure-api-keys)
10. [Run the Frontend Website](#10-how-do-i-run-the-frontend)
11. [Run the Camera / Vision System](#11-how-do-i-run-the-cameravision-system)
12. [Connect IoT Hardware (ESP32-CAM)](#12-how-do-i-connect-iot-hardware-when-available)
13. [Verification & End-to-End Testing](#13-how-do-i-test-that-everything-is-working)
14. [Troubleshooting & Common Errors](#14-what-common-errors-might-occur)
15. [Stopping & Restarting Services](#15-how-do-i-stoprestart-the-project)
16. [Project Structure](#project-structure)

---

## 1. What is FlowJeep?

FlowJeep bridges physical transit vehicles and commuters by streaming real-time operational telemetry:
- **Live Passenger Counting**: An onboard ESP32-CAM feeds doorway video to a lightweight vision server running YOLOv8 + ByteTrack to automatically log passenger boarding and alighting events.
- **Corridor Snapping & Live Telemetry**: Vehicle positions, speed, heading, and seat occupancy (`occupiedSeats / totalSeats`) are synced directly to Firebase Realtime Database and projected onto real OpenStreetMap road corridors.
- **Commuter Web Interface**: Real-time interactive Leaflet map featuring GPS geolocation, corridor-snapped draggable pickup and destination selection, ETA calculations, live approaching vehicle feeds ("I Am Waiting" signals), and weather forecasts.
- **Weather Intelligence**: A hybrid weather engine combining OpenWeather (live and future 5-day forecasts) with Open-Meteo Historical Archive (past dates) for Manila transit conditions.

---

## 2. What Technologies Does It Use?

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling & Icons** | Tailwind CSS 4, Lucide React |
| **Mapping & GIS** | Leaflet 1.9, OpenStreetMap Tiles, OSRM Routing, RBush R-Tree |
| **Cloud & Database** | Firebase Realtime Database (RTDB), Firebase Authentication |
| **Weather APIs** | OpenWeather API (Current + 5-Day Forecast), Open-Meteo Historical Archive |
| **Vision & AI Engine** | Python 3.10–3.12, OpenCV, Ultralytics YOLOv8 (`yolov8n.pt`), ByteTrack, PyTorch |
| **IoT / Edge Hardware** | ESP32-CAM (AI-Thinker model with OV2640 sensor), Arduino C++ Firmware |

---

## 3. Prerequisites

Before setting up FlowJeep, ensure the following software is installed on your operating system:

### Node.js & npm

Required to build and run the frontend web application.

- **Recommended Version**: Node.js `20.x LTS` or `22.x LTS` (Node 18+ supported)
- **Verify Installation**:
  ```bash
  node --version
  npm --version
  ```
  *(On Windows PowerShell, use `npm.cmd --version` if script execution policies apply).*

### Python & pip

Required to run the camera vision engine and passenger tracking server.

- **Recommended Version**: Python `3.10`, `3.11`, or `3.12` (64-bit)
- **Verify Installation**:
  ```bash
  python --version
  pip --version
  ```

### Git

Required to clone and manage the codebase.

- **Verify Installation**:
  ```bash
  git --version
  ```

### Web Browser

Modern desktop or mobile browser with Geolocation support (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Arduino IDE *(Optional — only required for flashing physical ESP32 hardware)*

Required if you are compiling and uploading firmware to an ESP32-CAM board.
- **Recommended**: Arduino IDE 2.x with the `esp32` board package by Espressif installed.

---

## 4. How Do I Clone the Repository?

Open your terminal or command prompt and clone the repository:

```bash
git clone https://github.com/aldcan/FlowJeep.git
cd FlowJeep
```

---

## 5. How Do I Install Frontend Dependencies?

From the project root directory, install all Node.js dependencies:

```bash
npm install
```

*(On Windows PowerShell if `npm` execution policy is restricted, run:)*
```powershell
npm.cmd install
```

This installs:
- `react` (v19) & `react-dom`
- `vite` (v8) & `@vitejs/plugin-react`
- `tailwindcss` (v4) & `@tailwindcss/vite`
- `firebase` (v12)
- `leaflet` & `@types/leaflet`
- `lucide-react`
- `rbush`

---

## 6. How Do I Install Backend/Python Dependencies?

The AI vision engine is located in the `camera_vision_backend/` folder. It is recommended to create an isolated Python virtual environment.

### Step 6.1: Create a Virtual Environment

**Windows (PowerShell / Command Prompt):**
```powershell
cd camera_vision_backend
python -m venv venv
.\venv\Scripts\activate
```

**macOS / Linux:**
```bash
cd camera_vision_backend
python3 -m venv venv
source venv/bin/activate
```

### Step 6.2: Install Required Packages

Install dependencies listed in `requirements.txt`:

```bash
pip install -r requirements.txt
```

This installs:
- `opencv-python` (video decoding, drawing HUD overlay, MJPEG streaming)
- `ultralytics` (YOLOv8 person detector)
- `torch` (PyTorch inference runtime)
- `numpy` (array manipulations and trajectory vectors)
- `requests` (HTTP REST sync to Firebase Realtime Database)
- `Pillow` (image formatting)

*(Optional GPU acceleration: If you have an NVIDIA GPU with CUDA, install the CUDA-enabled PyTorch build from [pytorch.org](https://pytorch.org) for faster FPS).*

Return to the root directory when done:
```bash
cd ..
```

---

## 7. How Do I Configure Environment Variables?

In the project root, FlowJeep uses a `.env` file for Vite frontend settings.

Copy the provided template:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

### Environment Variable Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_OPENWEATHER_API_KEY` | OpenWeather API key for live & 5-day weather | *Pre-configured in repository* |
| `VITE_DEV_ROLE` | Default active view on load (`commuter` or `operator`) | `commuter` |
| `VITE_FIREBASE_API_KEY` | *(Optional override)* Firebase Web API Key | *Embedded in `src/services/firebase.ts`* |
| `VITE_FIREBASE_DATABASE_URL` | *(Optional override)* Firebase Realtime Database URL | *Embedded in `src/services/firebase.ts`* |
| `VITE_FIREBASE_PROJECT_ID` | *(Optional override)* Firebase Project ID | `flowjeep-bf08a` |

---

## 8. How Do I Configure Firebase?

FlowJeep connects to **Firebase Realtime Database** in region `asia-southeast1`.

### Pre-Configured Settings
The repository comes pre-wired to the active project:
- **Project ID**: `flowjeep-bf08a`
- **Database URL**: `https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Auth Domain**: `flowjeep-bf08a.firebaseapp.com`

Client initialization is handled in [`src/services/firebase.ts`](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/src/services/firebase.ts).

### Firebase Database Structure Used by FlowJeep

```text
/live_telemetry/
  └── JEEP-NCR-0482/
        ├── jeepneyId: "JEEP-NCR-0482"
        ├── plateNumber: "NDL-8421"
        ├── routeName: "Baclaran – Monumento via EDSA"
        ├── currentCoord: [14.6544, 120.9839]
        ├── occupiedSeats: 5
        ├── totalSeats: 22
        ├── isOnline: true
        └── lastUpdate: 1728212345678
/devices/
  └── DEV-ESP32-01/
        ├── cameraStatus: "STREAMING" | "DISCONNECTED"
        └── lastHeartbeat: 1728212345678
/doorway_events/
  └── <event_id>/
        ├── eventType: "BOARDING" | "ALIGHTING"
        ├── currentOccupancy: 5
        └── timestamp: 1728212345678
```

If you wish to use your own Firebase project, replace the credentials in your `.env` file or [`src/services/firebase.ts`](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/src/services/firebase.ts) and [`camera_vision_backend/config.py`](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/camera_vision_backend/config.py).

---

## 9. How Do I Configure API Keys?

1. **OpenWeather**:
   - Register a free account at [openweathermap.org](https://openweathermap.org/api).
   - Generate an API key with access to Current Weather (2.5) and 5-Day Forecast (2.5).
   - Paste it into `.env`:
     ```env
     VITE_OPENWEATHER_API_KEY="your_api_key_here"
     ```
2. **Open-Meteo Historical Weather**:
   - No API key is required. The archive service connects directly to `archive-api.open-meteo.com`.
3. **OpenStreetMap / Leaflet**:
   - Free and open tile service used directly; no API key required.
4. **OSRM Routing**:
   - Uses the public OSRM demonstration server (`router.project-osrm.org`) for driving route polylines; no key required.

---

## 10. How Do I Run the Frontend?

From the root project folder, start the Vite development server:

```bash
npm run dev
```

*(Or on Windows PowerShell:)*
```powershell
npm.cmd run dev
```

### Server Output:
```text
  VITE v8.3.2  ready in 350 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.100.172:3000/
```

- Open **`http://localhost:3000/`** in your browser.
- When prompted, **Allow Geolocation** permissions so the interactive map automatically centers on your live coordinates.
- Mobile testing: Open the `Network` address (e.g. `http://192.168.x.x:3000/`) on any phone connected to the same Wi-Fi.

### Other Useful Frontend Scripts:
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```
- **Type Checking (Lint)**:
  ```bash
  npm run lint
  ```

---

## 11. How Do I Run the Camera/Vision System?

The AI vision passenger counter runs independently from the web frontend and publishes telemetry straight to Firebase RTDB.

### Step 1: Open the Backend Directory

```bash
cd camera_vision_backend
```
*(Activate your virtual environment if created: `.\venv\Scripts\activate` or `source venv/bin/activate`).*

### Step 2: Choose Your Video Source in `config.py`

Open [`camera_vision_backend/config.py`](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/camera_vision_backend/config.py):

- **Option A: Physical ESP32-CAM over Wi-Fi (Default)**:
  ```python
  ESP32_CAM_IP = "192.168.100.173"  # Replace with your ESP32's actual Wi-Fi IP
  CAMERA_SOURCE = f"http://{ESP32_CAM_IP}:81/stream"
  ```
- **Option B: Laptop / USB Webcam (Test without hardware)**:
  ```python
  CAMERA_SOURCE = 0
  ```
- **Option C: Prerecorded Video File**:
  ```python
  CAMERA_SOURCE = "doorway_test.mp4"
  ```

### Step 3: Run the Vision Script

```bash
python main.py
```

### Camera HUD Window Controls:
When running, an OpenCV window titled **"FlowJeep Camera Vision"** will display:
- Real-time video with green bounding boxes on detected passengers (`Person #ID`).
- Top-left HUD panel: `Entry Count`, `Exit Count`, `Current Passengers`, `Active IDs`, and `FPS`.
- **Keyboard Shortcuts**:
  - `Q`: Quit the program cleanly and mark the vehicle offline.
  - `R`: Reset passenger counter and synchronize `occupiedSeats: 0` to Firebase.
  - `S`: Save a snapshot frame to `camera_vision_backend/logs/`.
  - `+` / `-`: Increase or decrease the person missing-frame tolerance.

---

## 12. How Do I Connect IoT Hardware When Available?

FlowJeep is designed to use an **ESP32-CAM (AI-Thinker model with OV2640 camera)** mounted at the jeepney entrance doorway.

### Wiring & Power
- Power the ESP32-CAM via an ESP32-CAM-MB micro-USB daughterboard or a clean 5V (2A minimum) power supply to avoid brownouts.

### Flashing Firmware
1. Open the Arduino IDE.
2. Open [`camera_vision_backend/esp32cam_live/esp32cam_live.ino`](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/camera_vision_backend/esp32cam_live/esp32cam_live.ino).
3. Update the Wi-Fi credentials in the sketch:
   ```cpp
   const char* ssid     = "Your_WiFi_SSID";
   const char* password = "Your_WiFi_Password";
   ```
4. Set Board to **AI Thinker ESP32-CAM**.
5. Click **Upload**.
6. Open **Serial Monitor** at `115200 baud` and reset the board.
7. Note the printed streaming URL, for example:
   ```text
   WiFi connected. IP address: 192.168.100.173
   Camera Ready! Use 'http://192.168.100.173:81/stream' to view
   ```
8. Update `ESP32_CAM_IP` in [`camera_vision_backend/config.py`](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/camera_vision_backend/config.py) to match this IP.

---

## 13. How Do I Test That Everything Is Working?

Follow this checklist to verify full system integration:

1. **Frontend Map Verification**:
   - Visit `http://localhost:3000/`.
   - Verify that the blue pulsing pin appears at your live GPS location.
   - Verify the draggable pickup pin snaps cleanly to the nearest corridor.
   - Click the crosshair icon (**Recenter**) and confirm the pin re-anchors to your location.
2. **Vision & Occupancy Verification**:
   - Start the vision engine (`python main.py` in `camera_vision_backend`).
   - Look into the camera or walk past it.
   - Confirm that the OpenCV HUD increments `Entry` and `Current Passengers`.
   - Look at the web interface bottom drawer (**Live Jeepneys**):
     - The jeepney `NDL-8421` (Unit `JEEP-NCR-0482`) should appear with matching live seat occupancy (e.g., `1 / 22 seats`).
3. **Automatic Offline Pruning**:
   - Turn off the ESP32-CAM (or quit `main.py` with `Q`).
   - Within **20 seconds**, the jeepney marker and card will automatically disappear from the live map and drawer.
4. **Weather Screen**:
   - Tap the bottom navigation **Forecast** tab.
   - Confirm the 7-day forecast cards load with temperature, conditions, and rainfall data.

---

## 14. What Common Errors Might Occur?

### 1. `npm.ps1 cannot be loaded because running scripts is disabled` (Windows)
- **Cause**: PowerShell execution policy restricts running unsigned `.ps1` scripts.
- **Fix**: Run `npm.cmd` explicitly instead of `npm`:
  ```powershell
  npm.cmd run dev
  ```
  Or adjust execution policy in an Administrator PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 2. `WAITING FOR CAMERA: Connecting to ESP32-CAM...` in OpenCV
- **Cause**: The computer cannot reach `http://<ESP32_IP>:81/stream`.
- **Fix**:
  1. Confirm your computer and ESP32-CAM are on the **exact same Wi-Fi network** (and not split between 2.4 GHz and guest isolation).
  2. Verify the stream in your web browser by navigating directly to `http://<ESP32_IP>:81/stream`.
  3. If testing without hardware, set `CAMERA_SOURCE = 0` in `config.py` to use your laptop webcam.

### 3. `ReferenceError: useMemo is not defined`
- **Cause**: Missing React hook import.
- **Fix**: Ensure `useMemo` is imported in `src/components/MainInterface.tsx`:
  ```typescript
  import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
  ```

### 4. `Geolocation position unavailable / denied`
- **Cause**: Browser blocked location permissions, or running on an insecure HTTP non-localhost origin.
- **Fix**: In your browser address bar, click the lock/tune icon and set Location to **Allow**. The app will gracefully fall back to default transit coordinates if GPS is unavailable.

### 5. `ModuleNotFoundError: No module named 'ultralytics'` or `'cv2'`
- **Cause**: Python packages were not installed or virtual environment is inactive.
- **Fix**: Activate your virtual environment and run:
  ```bash
  pip install -r camera_vision_backend/requirements.txt
  ```

---

## 15. How Do I Stop/Restart the Project?

### To Stop the Services:
- **Frontend**: In the terminal running Vite, press `Ctrl + C`, then press `Y` to terminate the batch job.
- **Vision Backend**: In the OpenCV camera window, press `Q`, or in the terminal running Python, press `Ctrl + C`.

### To Restart:
1. Terminal 1 (Frontend):
   ```bash
   npm run dev
   ```
2. Terminal 2 (Vision Backend):
   ```bash
   cd camera_vision_backend
   python main.py
   ```

---

## Project Structure

```text
FlowJeep/
├── src/                               # Frontend React + TypeScript application
│   ├── components/                    # UI Components
│   │   ├── MainInterface.tsx          # Primary passenger map, corridor snapping, & drawer
│   │   ├── AuthScreen.tsx             # Role authentication interface
│   │   ├── NavigationDrawer.tsx       # Side drawer menu navigation
│   │   ├── forecast/                  # Transit weather forecasting views
│   │   ├── waiting/                   # "I Am Waiting" broadcast commuter feed
│   │   ├── driver/                    # Driver interface placeholder
│   │   └── admin/                     # Admin assignment interface placeholder
│   ├── services/                      # Cloud and external service connectors
│   │   ├── firebase.ts                # Firebase app, auth, and RTDB initialization
│   │   ├── authService.ts             # Role-based credential authentication
│   │   ├── databaseService.ts         # RTDB live telemetry subscriptions & trips
│   │   ├── hybridWeatherService.ts    # Merged OpenWeather + Open-Meteo logic
│   │   └── openWeatherService.ts      # OpenWeather REST endpoints
│   ├── utils/                         # Mathematics, geometry & dates
│   │   ├── jeepneyCorridors.ts        # Vector corridor projections & R-tree search
│   │   └── weatherDateUtils.ts        # Manila timezone date classifications
│   ├── types/                         # TypeScript interfaces
│   │   └── database.ts                # Realtime Database entity models
│   ├── App.tsx                        # Root application shell & session routing
│   └── main.tsx                       # React DOM entrypoint
├── camera_vision_backend/             # Python AI vision & passenger tracking engine
│   ├── main.py                        # Vision pipeline loop with Firebase sync & HUD
│   ├── config.py                      # Camera IP, YOLO model, & Firebase URLs
│   ├── tracker.py                     # YOLOv8 + ByteTrack person detection
│   ├── counter.py                     # Appearance / disappearance doorway counting
│   ├── camera.py                      # Threaded MJPEG frame stream receiver
│   ├── logger.py                      # CSV logging for door events
│   ├── requirements.txt               # Python package dependencies
│   ├── yolov8n.pt                     # Pretrained YOLOv8 nano neural weights
│   └── esp32cam_live/                 # ESP32 Arduino firmware sketch
│       └── esp32cam_live.ino          # MJPEG HTTP server for OV2640 sensor
├── iot_architecture/                  # Additional firmware and hardware reference designs
├── public/                            # Static web assets
├── .env.example                       # Environment variables template
├── package.json                       # Node.js project scripts and dependencies
├── vite.config.ts                     # Vite build configuration
└── README.md                          # Project documentation and setup guide
```

---

## License

This project is developed for the FlowJeep Public Transit Initiative. All rights reserved.
