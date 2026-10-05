# FlowJeep Flutter Cross-Platform Application

The official cross-platform Flutter application for the **FlowJeep** modern paratransit network. It retains 100% of the features present in the FlowJeep web interface and IoT architecture:

---

## Key Features & Architecture

1. **Onboarding & Commuter Authentication:**
   * Carousel introducing real-time paratransit GPS, dual IR passenger counting, and wait signal broadcasts.
   * Sign In / Sign Up flow with instant demo/guest commuter mode.

2. **Live Interactive Transit Map (`screens/live_commuter_map_screen.dart`):**
   * High-performance OpenStreetMap vector rendering via `flutter_map` and `latlong2`.
   * **Corridor Snapping Engine:** Vector projection math (`services/corridor_service.dart`) automatically snaps pickup and destination pins to primary Metro Manila Modern PUV routes (Fairview–Buendia, Commonwealth–Quiapo, Visayas Ave–Manila City Hall, SM North–Philcoa).
   * **Metro Manila Transit Hub Autocomplete:** Instant search covering SM North EDSA, TriNoma, Philcoa, UP Diliman, QC Circle, Fisher Mall, Welcome Rotonda, UST España, Quiapo, and MRT/LRT terminals.
   * **Real-Time Fleet Markers:** Live vehicle markers with occupancy indicators, route badges, and plate numbers.
   * **Collapsible Bottom Drawer:** Displays approaching units, countdown arrival ETAs, seat counts, and quick "I Am Waiting" broadcast actions.

3. **"I Am Waiting" Commuter Broadcast (`screens/waiting_screen.dart`):**
   * Broadcasts waiting presence at the current snapped pickup point to approaching drivers.
   * Real-time approaching jeepney queue with seat availability and "Track on Map" panning.
   * Driver signal toggles with visual toast notifications.

4. **Passenger Load Forecast (`screens/forecast_screen.dart`):**
   * Multi-period crowd projection (Early Worker Dispatch, Morning Peak, Midday Off-Peak, Afternoon School Surge, Evening Homeward Rush, Night Sweep).
   * Weather-driven demand notes and temperature context.
   * Interactive 7-day selector and corridor dropdown.

5. **Fleet Operator & IoT Sensor Radar (`screens/operator_dashboard_screen.dart`):**
   * Dispatcher radar tracking all active fleet units.
   * **ESP32-S3 Edge Node Diagnostics:** Alternator voltage monitoring (13.8V–14.2V), 4G LTE signal RSSI (dBm), speed, and heading.
   * **Dual E18-D80NK Doorway FSM Visualizer:** Outer (Beam 1) and Inner (Beam 2) optical sensor state indicators with directional boarding and alighting tallies.
   * Emergency SOS dispatch alert monitoring.

6. **Commuter Profile & LTFRB Fare Calculator (`screens/profile_screen.dart`):**
   * Built-in LTFRB Modern PUV Fare Matrix Calculator (Base ₱15 for 4km + ₱2.20/km thereafter; 20% concessionary discount for Students, PWDs, and Senior Citizens).
   * Commuter preferences (audio chimes, haptics, high-contrast map mode, and English/Filipino language toggle).
   * Emergency transit hotlines (LTFRB 1342, MMDA 136).

---

## Project Structure

```
iot_architecture/flutter_client/
├── pubspec.yaml
├── README.md
└── lib/
    ├── main.dart                          # App entry point & flow controller
    ├── models/
    │   ├── vehicle_telemetry.dart         # Edge telemetry & occupancy models
    │   ├── corridor_route.dart            # Route definitions & OSM vector paths
    │   ├── transit_place.dart             # Curated NCR transit landmarks & aliases
    │   └── forecast_model.dart            # Multi-period dispatch load models
    ├── services/
    │   ├── corridor_service.dart          # Vector road-snapping & journey filtering
    │   ├── firebase_stream_service.dart   # Live Firebase RTDB stream & fallback simulator
    │   ├── fare_service.dart              # LTFRB Fare Matrix calculation
    │   └── forecast_service.dart          # Historical & weather-aware demand engine
    ├── screens/
    │   ├── onboarding_screen.dart         # Intro feature carousel
    │   ├── auth_screen.dart               # Commuter sign-in & demo access
    │   ├── main_navigation_shell.dart     # 5-tab bottom navigation & side drawer
    │   ├── live_commuter_map_screen.dart  # Interactive OSM map with vehicle cards
    │   ├── waiting_screen.dart            # Wait signal broadcast & queue
    │   ├── forecast_screen.dart           # 6-period daily passenger load prediction
    │   ├── operator_dashboard_screen.dart # Fleet dispatcher & IoT sensor monitor
    │   └── profile_screen.dart            # Commuter profile & tools
    └── widgets/
        ├── jeepney_card.dart              # Vehicle card with capacity progress bar
        ├── place_search_dialog.dart       # Autocomplete transit search modal
        ├── fare_calculator_dialog.dart    # Interactive LTFRB fare calculator
        └── settings_help_dialog.dart      # Preferences and helpline dialogs
```

---

## How to Build & Run

### Prerequisites
* Flutter SDK (3.2.0 or higher)
* Android Studio / Xcode / Chrome for target platform compilation

### Installation
```bash
cd iot_architecture/flutter_client
flutter pub get
```

### Run Locally (Desktop / Mobile / Web)
```bash
flutter run
```

### Build Production Releases
* **Android APK:**
  ```bash
  flutter build apk --release
  ```
* **Android App Bundle (Google Play):**
  ```bash
  flutter build appbundle --release
  ```
* **Web:**
  ```bash
  flutter build web --release
  ```
* **iOS:**
  ```bash
  flutter build ios --release
  ```
