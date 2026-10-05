# FlowJeep: Scalable IoT & Machine Learning Backend Architecture for Public Paratransit

## Architectural Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EDGE NODE (JEEPNEY)                              │
│                                                                             │
│  [ Dual E18-D80NK IR Sensors ] ───► [ High-Speed Directional FSM (GPIO 4/5) ]
│  [ ATGM336H / NEO-8M GNSS ]   ───► [ Hardware UART1 @ 9600bps ]             │
│  [ OV2640 DVP Camera ]        ───► [ Doorway Snapshot Buffer (QVGA JPEG) ]  │
│                                        │                                    │
│                              [ ESP32-S3 Dual-Core ]                         │
│                                        │                                    │
│  [ SIM7600E-H 4G LTE Modem ]  ◄────────┴─── UART2 @ 115200bps               │
│               │ (MQTT over TLS / 4G LTE Uplink)                            │
└───────────────┼─────────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLOUD RELAY & REAL-TIME BROKER                          │
│                                                                             │
│  [ Secure MQTT Broker (Port 8883) ]                                         │
│               │                                                             │
│  [ Cloud Relay Bridge Daemon (firebase_mqtt_bridge.py) ]                    │
│               │                                                             │
│  [ Firebase Realtime Database (rtdb.asia-southeast1) ]                      │
│      ├── /vehicles/{id}/telemetry (Lat, Lng, Speed, Occupancy, Capacity %)  │
│      ├── /vehicles/{id}/doorway_events (Direction, Timestamp, State)        │
│      └── /corridors/{code} (Congestion level, active fleet count)           │
└───────────────┬─────────────────────────────────────────────────────────────┘
                │
       ┌────────┴──────────────────────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐       ┌──────────────────────────────────────┐
│  AI & BACKEND SERVER (Flask) │       │            CLIENT LAYER              │
│                              │       │                                      │
│ 1. Computer Vision Pipeline: │       │ 1. Flutter Commuter App:             │
│    • YOLOv8n + ByteTrack     │       │    • Real-time SSE / RTDB stream     │
│    • Cross-validates IR beam │       │    • Interactive map & live vehicle  │
│      counts with person bbox │       │    • Seat capacity gauge (<75% green)│
│                              │       │    • Dynamic arrival countdown       │
│ 2. Scikit-Learn ML Model:    │       │                                      │
│    • RandomForestRegressor   │       │ 2. Blynk Operator Dashboard:         │
│    • Temporal features       │       │    • Real-time fleet radar (V0)      │
│    • OpenWeatherMap API      │       │    • Live passenger meters (V1, V2)  │
│    • Historical corridor pct │       │    • Door beam diagnostic LEDs       │
│                              │       │    • Alternator voltage & LTE RSSI   │
│ 3. OSRM Routing Engine:      │       │    • Emergency SOS dispatch alerts   │
│    • Corridor node snapping  │       └──────────────────────────────────────┘
│    • Travel time & ETA calc  │
└──────────────────────────────┘
```

## System Components Summary

1. **Edge Node (`/iot_architecture/edge_firmware`)**:
   - `flowjeep_edge_esp32s3.ino`: Complete firmware for ESP32-S3 with TinyGPS++, SIM7600 AT MQTT driver, LittleFS offline buffer, and non-blocking dual E18-D80NK beam state machine.
   - `platformio.ini`: Production build configuration with Octal PSRAM enabled.
   - `hardware_schematic.md`: Full pinout matrix, optical sensor geometry, and automotive power conditioning.

2. **Cloud Relay (`/iot_architecture/cloud_relay`)**:
   - `database.rules.json`: Strict Firebase Realtime Database security rules with role validation.
   - `schema.json`: Complete JSON database schema.
   - `firebase_mqtt_bridge.py`: High-throughput daemon forwarding MQTT packets into Firebase RTDB nodes.

3. **Backend Server (`/iot_architecture/backend_server`)**:
   - `app.py`: Flask REST API exposing CV, ML load prediction, OSRM snapping, and telemetry ingestion.
   - `cv_pipeline.py`: YOLOv8n + ByteTrack doorway detection & tripwire logic.
   - `rf_model_service.py`: Scikit-learn Random Forest regression model with OpenWeatherMap API integration.
   - `osrm_service.py`: Open Source Routing Machine client for map matching and congestion ETA.
   - `train_rf_model.py`: Historical model training pipeline.

4. **Client Layer (`/iot_architecture/flutter_client` & `/iot_architecture/blynk_operator`)**:
   - `flutter_client/`: Cross-platform Flutter app for commuters with Firebase Realtime Database stream, animated vehicle markers, and occupancy indicator.
   - `blynk_operator/`: Template, bridge daemon, and Virtual Pin mapping (V0-V13) for fleet operators.
