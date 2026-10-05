# Blynk Operator IoT Dashboard Specification

## Overview
This specification details the Blynk IoT Cloud configuration for paratransit fleet supervisors, cooperative dispatchers, and depot operators. It provides a real-time command dashboard showing live GPS map pins, passenger occupancy gauges, door beam states, and battery/LTE health.

---

## Virtual Pin Reference Table

| Virtual Pin | Data Type | Widget Type | Range / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| **V0** | String / Geo | **GPS Map** | `lat,lng,label` | Real-time vehicle location marker on OpenStreetMap / Google Maps |
| **V1** | Integer | **Value Display** | `0 - 32 pax` | Instantaneous onboard passenger count |
| **V2** | Float | **Radial Gauge** | `0.0 - 100.0%` | Passenger seat capacity percentage (Color: Green `<75%`, Amber `75-90%`, Red `>90%`) |
| **V3** | Float | **Speedometer** | `0.0 - 100.0 km/h`| Current vehicle velocity parsed from GNSS NMEA `$GPRMC` sentence |
| **V4** | Integer | **LED Light** | `0 / 1` | Optical Beam A (Outer doorway threshold) obstructed indicator |
| **V5** | Integer | **LED Light** | `0 / 1` | Optical Beam B (Inner cabin threshold) obstructed indicator |
| **V6** | Integer | **Labeled Display**| `0 - 2000` | Cumulative passengers boarded on current operational shift |
| **V7** | Integer | **Labeled Display**| `0 - 2000` | Cumulative passengers alighted on current operational shift |
| **V8** | Integer | **Level Indicator**| `0 - 31 CSQ` | Cellular LTE signal strength from SIM7600 `+CSQ` query |
| **V9** | Float | **Voltage Meter** | `9.0 - 16.0 V` | Vehicle alternator / 12V battery step-down voltage reading |
| **V10** | String | **Status Pill** | `VERIFIED / AUDIT`| YOLOv8n + ByteTrack CV verification state |
| **V11** | String | **Text Label** | String | OSRM Corridor snapping state (e.g. `EDSA-North Corridor ±3.2m`) |
| **V12** | Integer | **Button / Buzzer**| `0 / 1` | Emergency driver SOS trigger / cabin alarm |
| **V13** | Integer | **Push Button** | `0 / 1` | Operator command: Request high-res doorway camera snapshot |

---

## Operator UI Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🟢 FlowJeep Operator Radar - NCR Fleet Unit #0482          │
├─────────────────────────────────────────────────────────────┤
│  [ LIVE MAP (V0) ]                                          │
│  Shows JEEP-NCR-0482 tracking along EDSA - QMC corridor     │
├───────────────────────────────┬─────────────────────────────┤
│   [ CAPACITY GAUGE (V2) ]     │   [ PASSENGER METRICS ]     │
│             67%               │   Onboard: 16 / 24 seats    │
│     🟢 Normal Operation       │   Total Boarded: 142 pax    │
│                               │   Total Alighted: 126 pax   │
├───────────────────────────────┼─────────────────────────────┤
│   [ SPEEDOMETER (V3) ]        │   [ HARDWARE TELEMETRY ]    │
│          24.5 km/h            │   LTE CSQ: 27/31 (Strong 4G)│
│                               │   Battery: 13.8V Alternator │
│                               │   Beam A: ⚪  Beam B: ⚪    │
├───────────────────────────────┴─────────────────────────────┤
│   [ AI & ROUTING AUDIT ]                                    │
│   YOLOv8 + ByteTrack: ✅ Corroborated (94% confidence)      │
│   OSRM Corridor: Aligned (3.1m offset) • ETA Terminal: 3m   │
└─────────────────────────────────────────────────────────────┘
```
