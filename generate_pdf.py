import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    Preformatted,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 755, 572, 755)
            self.drawString(40, 760, "FLOWJEEP — Current Database Architecture & Agent Handoff Document")

        # Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.drawString(40, 30, "CONFIDENTIAL & PROPRIETARY — FLOWJEEP PARATRANSIT PLATFORM")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 30, page_str)
        self.restoreState()

def build_pdf(filename="FLOWJEEP_DATABASE_ARCHITECTURE_HANDOFF.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#E31B23'),
        spaceAfter=14,
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15,
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5,
    )
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        spaceAfter=3,
    )
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0F172A'),
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white,
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("FLOWJEEP — DATABASE ARCHITECTURE", title_style))
    story.append(Paragraph("System Specification, Schema Definition & Technical Handoff Document", subtitle_style))
    story.append(Paragraph("<b>Target Environment:</b> Google Firebase Realtime Database (flowjeep-bf08a) | <b>Region:</b> asia-southeast1 (Singapore)<br/><b>Local Timezone:</b> Asia/Manila (UTC+8) | <b>Platform Version:</b> 2.1.0 Production", meta_style))
    story.append(Spacer(1, 4))

    # Section 1: Executive Summary
    story.append(Paragraph("1. Executive Summary & Diagnostic Inspection", h1_style))
    story.append(Paragraph(
        "This document provides the canonical, ground-truth reference for the FlowJeep database architecture. "
        "The entire platform—comprising the React TypeScript web application, the Python OpenCV/YOLOv8 edge camera vision pipeline, "
        "and ESP32 paratransit hardware—relies exclusively on <b>Firebase Realtime Database (RTDB)</b>. "
        "Cloud Firestore is <b>NOT initialized or used</b> anywhere in the active codebase.",
        body_style
    ))
    story.append(Paragraph("<b>Database Configuration Details:</b>", h2_style))
    story.append(Paragraph("• <b>Instance URL:</b> https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app", bullet_style))
    story.append(Paragraph("• <b>Project ID:</b> flowjeep-bf08a", bullet_style))
    story.append(Paragraph("• <b>Authentication:</b> Firebase Authentication (email/password & Google OAuth) with profiles synced to /users/{uid}", bullet_style))
    story.append(Paragraph("• <b>Legacy Deprecation:</b> The legacy prototype node <code>/vehicles</code> has been completely removed. Live streaming telemetry is consolidated into <code>/live_telemetry</code>, while master vehicle attributes are stored in <code>/jeepneys</code>.", bullet_style))
    story.append(Spacer(1, 6))

    # Section 2: Node by Node
    story.append(Paragraph("2. Canonical Database Structure (Node-by-Node Specification)", h1_style))
    
    nodes_info = [
        ("/system_config", "Root", "Holds system-wide constants, paratransit fare matrix formulas, and time-to-live thresholds.",
         "version (string), activeFareMatrix { baseFareFirst4km, succeedingKmRate, discountRate }, pingExpirationMinutes (number), gpsStaleThresholdSeconds (number)"),
        ("/users/{uid}", "Root", "Authenticated user profiles, roles, and operator cooperative assignments.",
         "uid (string), email (string), name (string), role ('commuter'|'operator'|'admin'), cooperative (string?), operatorId (string?), assignedRouteId (string?), assignedPlate (string?), createdAt (number), lastLoginAt (number?)"),
        ("/routes/{routeId}", "Root", "Official LTFRB transit corridor registry, origin/destinations, base fares, and ordered stop sequences.",
         "id (string), routeCode (string), name (string), origin (string), destination (string), totalDistanceKm (number), estimatedDurationMin (number), baseFare (number), status ('ACTIVE'|'INACTIVE'), color (string), stops (map of RouteStop)"),
        ("/jeepneys/{jeepneyId}", "Root", "Master vehicle registry for modern jeepneys. Stores permanent vehicle identity and hardware links.",
         "id (string), plateNumber (string), cooperative (string), assignedRouteId (string), deviceId (string?), model (string), isAircon (boolean), totalSeats (number), standingAllowed (boolean), status ('IN_SERVICE'|'OFF_DUTY'|'MAINTENANCE')"),
        ("/devices/{deviceId}", "Root", "IoT hardware registry tracking edge units installed in vehicles.",
         "deviceId (string), jeepneyId (string), esp32CamIp (string), firmwareVersion (string), cameraStatus ('STREAMING'|'DISCONNECTED'), dualBeamStatus ('CONNECTED'|'DISCONNECTED'), lastHeartbeat (number), plateNumber (string)"),
        ("/live_telemetry/{jeepneyId}", "Root", "High-frequency streaming telemetry: real-time GPS, speed, heading, and live passenger load.",
         "jeepneyId (string), routeId (string), routeCode (string), routeName (string), plateNumber (string), currentCoord [lat, lng], headingDegrees (number), speedKmh (number), occupiedSeats (number), totalSeats (number), capacityPct (number), loadCategory (string), lastUpdate (number), isOnline (boolean)"),
        ("/doorway_events/{eventId}", "Root", "Chronological audit log of boarding/alighting events detected by YOLOv8n + ByteTrack.",
         "eventId (string), jeepneyId (string), tripId (string?), eventType ('BOARDING'|'ALIGHTING'|'CANCELLED'), trackingId (number), confidence (number), currentOccupancy (number), timestamp (number), location [lat, lng]?"),
        ("/waiting_commuters/{pingId}", "Root", "Active transit wait pings submitted by commuters broadcasting stop locations.",
         "pingId (string), userId (string), isGuest (boolean), routeId (string), pickupCoords { lat, lng }, destinationCoords { lat, lng }?, pickupStopName (string?), destinationName (string?), status ('waiting'|'acknowledged'|'expired'), timestamp (number), expiresAt (number)"),
        ("/trips/{tripId}", "Root", "Operating shift tracking for jeepney runs between terminals.",
         "tripId (string), jeepneyId (string), routeId (string), driverUid (string?), startTime (number), endTime (number?), status ('IN_PROGRESS'|'COMPLETED'|'CANCELLED'), totalBoarded (number), totalAlighted (number), peakOccupancy (number)"),
        ("/demand_hotspots/{corridorId}/{id}", "Root", "Aggregated passenger concentration clusters along transit corridors for operator dispatch.",
         "id (string), corridorId (string), stopName (string), lat (number), lng (number), waitingCount (number), demandLevel ('high'|'medium'|'low'), lastUpdated (number)"),
        ("/forecast_records/{corridorId}/{date}", "Root", "Persistent cache for pre-computed passenger load forecasts.",
         "corridorId (string), dateString (string), weatherCondition (string), temperatureC (number), precipitationProb (number), peakPercentage (number), recommendedWindow (string), periods (map of PeriodRecord), lastModelRun (number)")
    ]

    for path, parent, purpose, fields in nodes_info:
        p_path = Paragraph(f"<b>Path: <code>{path}</code></b>", h2_style)
        p_purp = Paragraph(f"<b>Purpose:</b> {purpose}", body_style)
        p_flds = Paragraph(f"<b>Fields:</b> {fields}", body_style)
        story.append(KeepTogether([p_path, p_purp, p_flds, Spacer(1, 3)]))

    story.append(Spacer(1, 6))

    # Section 3: Entity Matrix Table
    story.append(Paragraph("3. Database Entity Implementation Matrix", h1_style))
    matrix_data = [
        [Paragraph("Entity", table_header), Paragraph("Status", table_header), Paragraph("Location & Implementation Details", table_header)],
        [Paragraph("Users", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/users/{uid}</code>. Commuter and operator profiles.", table_cell)],
        [Paragraph("Jeepneys", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/jeepneys/{id}</code>. Master registry (plate, capacity, model).", table_cell)],
        [Paragraph("IoT Devices", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/devices/{id}</code>. DEV-ESP32-01 hardware unit.", table_cell)],
        [Paragraph("Routes", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/routes/{id}</code>. Vector geometries in R-Tree.", table_cell)],
        [Paragraph("Live Telemetry", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/live_telemetry/{id}</code>. Real-time GPS & passenger count.", table_cell)],
        [Paragraph("Doorway Events", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/doorway_events</code>. YOLOv8n boarding/alighting logs.", table_cell)],
        [Paragraph("Waiting Pings", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/waiting_commuters</code>. 20-min broadcasting pings.", table_cell)],
        [Paragraph("Demand Hotspots", table_cell), Paragraph("IMPLEMENTED", table_cell), Paragraph("RTDB <code>/demand_hotspots</code>. Live heatmap circles.", table_cell)],
        [Paragraph("Trips", table_cell), Paragraph("PARTIAL", table_cell), Paragraph("Service methods implemented in <code>databaseService.ts</code>.", table_cell)],
        [Paragraph("Forecast Records", table_cell), Paragraph("PARTIAL", table_cell), Paragraph("Schema ready; Python Random Forest model runs in backend.", table_cell)],
        [Paragraph("Weather", table_cell), Paragraph("EXTERNAL API", table_cell), Paragraph("NOT stored in DB. OpenWeather + Open-Meteo in-memory cache.", table_cell)],
        [Paragraph("ETA", table_cell), Paragraph("CALCULATED", table_cell), Paragraph("NOT stored in DB. OSRM engine & paratransit dwell speeds.", table_cell)],
    ]
    t = Table(matrix_data, colWidths=[100, 95, 337])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Section 4: Data Streams Classification
    story.append(Paragraph("4. Real-Time vs. Historical Data Classification", h1_style))
    story.append(Paragraph("• <b>Real-Time Streaming:</b> <code>/live_telemetry</code> (GPS, speed, heading, passenger load) and <code>/waiting_commuters</code> (commuter broadcasts). Delivered via WebSocket sub-100ms listeners.", bullet_style))
    story.append(Paragraph("• <b>Historical & Audit:</b> <code>/doorway_events</code> (camera vision logs) and <code>/trips</code> (shift records). Preserved for auditing and ML retraining.", bullet_style))
    story.append(Paragraph("• <b>Master Reference:</b> <code>/jeepneys</code>, <code>/devices</code>, <code>/routes</code>, <code>/system_config</code>. Static metadata read on demand.", bullet_style))
    story.append(Paragraph("• <b>External / Not Stored:</b> Weather observations and forecasts are fetched dynamically and cached in client memory with a 10-minute TTL. They are never persisted to Firebase.", bullet_style))
    story.append(Spacer(1, 8))

    # Section 5: Weather Subsystem
    story.append(Paragraph("5. Weather Subsystem Architecture", h1_style))
    story.append(Paragraph(
        "FlowJeep employs a strict hybrid weather architecture that operates area-specifically without being constrained to transit corridors: "
        "<br/>1. <b>Past Dates:</b> Open-Meteo Historical Weather API (archive-api.open-meteo.com) for observed actual conditions."
        "<br/>2. <b>Today (Current):</b> OpenWeather Current API (api.openweathermap.org/data/2.5/weather)."
        "<br/>3. <b>Future Dates:</b> OpenWeather 5-Day / 3-Hour Forecast API (api.openweathermap.org/data/2.5/forecast)."
        "<br/><b>Storage Decision:</b> Weather data is deliberately <b>NOT stored in Firebase</b> to avoid bloat and redundant API cost. "
        "It is transformed into a unified format in <code>hybridWeatherService.ts</code> and cached in a lightweight in-memory JavaScript Map.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 6: Forecasting Subsystem
    story.append(Paragraph("6. Passenger-Load Forecasting Subsystem", h1_style))
    story.append(Paragraph(
        "Passenger-load predictions combine temporal patterns with live weather impact factors: "
        "<br/>• <b>Frontend Engine:</b> <code>forecastService.ts</code> resolves 6 baseline daily operating periods (Early Dispatch, Morning Rush, Midday Off-Peak, School Surge, Evening Homeward, Night Sweep) with weather-driven ridership advisories."
        "<br/>• <b>Python Backend Model:</b> <code>iot_architecture/backend_server/rf_model_service.py</code> hosts a Scikit-Learn <code>RandomForestRegressor</code> predicting load percentage from <code>[day_of_week, hour_of_day, is_weekend, stop_index, historical_load, weather_factor]</code>."
        "<br/>• <b>Database Storage:</b> Schema is prepared at <code>/forecast_records/{corridorId}/{date}</code> via <code>saveCorridorForecast()</code>.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 7: Security Rules & Indexes
    story.append(Paragraph("7. Database Security Rules & Indexing", h1_style))
    story.append(Paragraph(
        "Security rules are declared in <code>database.rules.json</code>: "
        "<br/>• <code>system_config</code>, <code>routes</code>: Public read; write restricted to administrators (<code>role === 'admin'</code>)."
        "<br/>• <code>users/$uid</code>: Read and write restricted strictly to the authenticated user owning the record or admin."
        "<br/>• <code>jeepneys/$jeepney_id</code>: Public read; write restricted to authorized operators and administrators."
        "<br/>• <code>live_telemetry</code>: Public read; write open to edge hardware. Indexed on <code>['routeId', 'capacityPct', 'lastUpdate', 'isOnline']</code>."
        "<br/>• <code>waiting_commuters</code>: Public read; indexed on <code>['routeId', 'status', 'expiresAt']</code>.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 8: Hardware & Zero Mock Data Audit
    story.append(Paragraph("8. Connected Hardware & Data Authenticity Audit", h1_style))
    story.append(Paragraph(
        "• <b>Zero Sample/Mock Vehicles:</b> All dummy vehicles (including JEEP-VAL-1102) and legacy nodes (<code>/vehicles</code>) were permanently purged from Firebase. Automatic mock data seeding is disabled."
        "<br/>• <b>Connected ESP32 Hardware:</b> The database holds exactly one real, physical hardware unit and jeepney:"
        "<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>Device ID:</b> <code>DEV-ESP32-01</code> | <b>IP:</b> <code>192.168.100.173:81/stream</code> | <b>Status:</b> STREAMING"
        "<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>Associated Jeepney:</b> <code>JEEP-NCR-0482</code> | <b>Plate:</b> <code>NDL-8421</code> | <b>Seats:</b> 22 | <b>Coop:</b> MAVANODA",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 9: Key Source Files
    story.append(Paragraph("9. Primary Source File Directory for Incoming Agents", h1_style))
    ref_data = [
        [Paragraph("Component", table_header), Paragraph("Source File Path", table_header)],
        [Paragraph("Firebase Config", table_cell), Paragraph("<code>src/services/firebase.ts</code>", table_cell)],
        [Paragraph("Database Service Layer", table_cell), Paragraph("<code>src/services/databaseService.ts</code>", table_cell)],
        [Paragraph("TypeScript Schemas", table_cell), Paragraph("<code>src/types/database.ts</code>", table_cell)],
        [Paragraph("Security Rules", table_cell), Paragraph("<code>database.rules.json</code>", table_cell)],
        [Paragraph("Auth Service", table_cell), Paragraph("<code>src/services/authService.ts</code>", table_cell)],
        [Paragraph("Live Map UI", table_cell), Paragraph("<code>src/components/MainInterface.tsx</code>", table_cell)],
        [Paragraph("Wait Broadcasting", table_cell), Paragraph("<code>src/components/waiting/WaitingScreen.tsx</code>", table_cell)],
        [Paragraph("Demand Heatmap", table_cell), Paragraph("<code>src/components/operator/OperatorDemandMapView.tsx</code>", table_cell)],
        [Paragraph("Hybrid Weather", table_cell), Paragraph("<code>src/services/hybridWeatherService.ts</code>", table_cell)],
        [Paragraph("Camera Vision Backend", table_cell), Paragraph("<code>camera_vision_backend/main.py</code>", table_cell)],
        [Paragraph("Camera Vision Config", table_cell), Paragraph("<code>camera_vision_backend/config.py</code>", table_cell)],
        [Paragraph("ESP32-CAM Firmware", table_cell), Paragraph("<code>camera_vision_backend/esp32cam_live/esp32cam_live.ino</code>", table_cell)],
    ]
    t_ref = Table(ref_data, colWidths=[160, 372])
    t_ref.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_ref)
    story.append(Spacer(1, 14))

    # Section 10: Database Tree
    story.append(Paragraph("10. Compact Database Tree Handoff", h1_style))
    tree_text = (
        "FLOWJEEP REALTIME DATABASE (flowjeep-bf08a)\n"
        "├── system_config\n"
        "│   ├── activeFareMatrix (baseFareFirst4km: 15, succeedingKmRate: 2.2, discountRate: 0.2)\n"
        "│   ├── gpsStaleThresholdSeconds: 45\n"
        "│   └── pingExpirationMinutes: 20\n"
        "├── users\n"
        "│   └── {uid} (email, name, role: 'commuter'|'operator', cooperative, assignedRouteId, assignedPlate)\n"
        "├── routes\n"
        "│   └── {routeId} (routeCode, name, origin, destination, baseFare: 15, stops: map)\n"
        "├── jeepneys\n"
        "│   └── JEEP-NCR-0482 (plateNumber: NDL-8421, deviceId: DEV-ESP32-01, model, totalSeats: 22, status)\n"
        "├── devices\n"
        "│   └── DEV-ESP32-01 (cameraStatus: STREAMING, esp32CamIp: 192.168.100.173, firmwareVersion: 1.4.2)\n"
        "├── live_telemetry\n"
        "│   └── {jeepneyId} (currentCoord: [lat, lng], speedKmh, headingDegrees, occupiedSeats, capacityPct)\n"
        "├── trips [Schema ready / in service]\n"
        "│   └── {tripId} (jeepneyId, routeId, startTime, endTime, totalBoarded, totalAlighted, peakOccupancy)\n"
        "├── doorway_events\n"
        "│   └── {eventId} (jeepneyId, eventType, trackingId, confidence, currentOccupancy, timestamp)\n"
        "├── waiting_commuters\n"
        "│   └── {pingId} (userId, routeId, pickupCoords, destinationCoords, status: 'waiting', expiresAt)\n"
        "├── demand_hotspots\n"
        "│   └── {corridorId}/{hotspotId} (stopName, lat, lng, waitingCount, demandLevel)\n"
        "└── forecast_records\n"
        "    └── {corridorId}/{dateKey} (dateString, weatherCondition, peakPercentage, periods)"
    )
    story.append(Preformatted(tree_text, code_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    out_name = sys.argv[1] if len(sys.argv) > 1 else "FLOWJEEP_DATABASE_ARCHITECTURE_HANDOFF.pdf"
    build_pdf(out_name)
