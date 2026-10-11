# FlowJeep GPS Backend & Hardware Integration

This directory contains the firmware and bridge services for the **NEO-6M GPS module** connected to an **ESP32** microcontroller, publishing real-time coordinates, speed, and heading to FlowJeep's Firebase Realtime Database.

---

## 1. Hardware Pin Wiring

| NEO-6M GPS Pin | ESP32 Pin | Notes |
|---|---|---|
| **VCC** | **VIN (5V)** or **3V3** | Recommended: VIN / 5V |
| **GND** | **GND** | Common ground |
| **TX** | **GPIO 16** | GPS TX connects to ESP32 RX2 |
| **RX** | **GPIO 17** | GPS RX connects to ESP32 TX2 |

---

## 2. Operation Modes

You have **two flexible ways** to send GPS coordinates from your hardware to FlowJeep:

### Mode A: Standalone Wi-Fi (Direct ESP32 to Firebase)
The ESP32 reads GPS data and uploads it directly to Firebase over Wi-Fi without needing a computer running:
1. Open [`gps_backend/gps.ino`](./gps.ino) in the Arduino IDE.
2. Update the Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
   ```
3. Required Arduino IDE Library: `TinyGPSPlus` (install via *Library Manager*).
4. Select board **ESP32 Dev Module** and upload.
5. Open Serial Monitor at **115200 baud**. Once Wi-Fi and GPS lock are achieved, it automatically sends telemetry every 2 seconds via HTTPS to:
   `https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app/live_telemetry/JEEP-NCR-0482.json`

### Mode B: USB Cable via Python Bridge
If testing indoors, developing, or using a laptop in the vehicle:
1. Upload [`gps_backend/gps.ino`](./gps.ino) to the ESP32 (leave Wi-Fi as default).
2. Plug the ESP32 into your computer via USB.
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the bridge:
   ```bash
   python gps_bridge.py --port COM3
   ```
   *(Replace `COM3` with your device's COM port, e.g. COM4 on Windows or `/dev/ttyUSB0` on Linux/macOS)*.

---

## 3. Instant Simulation Mode (No Hardware Needed)
To test the website dashboard and driver map moving live along the Manila EDSA corridor right now:
```bash
python gps_bridge.py --simulate
```
To send a single test coordinate point:
```bash
python gps_bridge.py --once
```

---

## 4. Firebase Database Mapping

The telemetry payload directly updates `/live_telemetry/JEEP-NCR-0482` matching the `LiveTelemetryRecord` schema:

```json
{
  "jeepneyId": "JEEP-NCR-0482",
  "plateNumber": "NDL-8421",
  "routeId": "route-1",
  "routeName": "Baclaran – Monumento via EDSA",
  "currentCoord": [14.6544, 120.9839],
  "speedKmh": 24.5,
  "headingDegrees": 180.0,
  "satellites": 8,
  "hdop": 1.1,
  "isOnline": true,
  "lastUpdate": 1775088000000
}
```
All frontend screens ([Driver Map](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/src/components/driver/DriverMapScreen.tsx), [Driver Dashboard](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/src/components/driver/DriverDashboard.tsx), and [Commuter Live Map](file:///c:/Users/LENOVO/Documents/Flow%20Jeep%20Development/src/components/MainInterface.tsx)) listen to this node in real-time.
