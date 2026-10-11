#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ===== CONFIG =====
#define GPS_RX_PIN 16   // ESP32 RX <- GPS TX
#define GPS_TX_PIN 17   // ESP32 TX -> GPS RX
#define PRINT_INTERVAL_MS 2000
#define STREAM_TIMEOUT_MS 3000
#define FIREBASE_SYNC_INTERVAL_MS 2000 // Send telemetry to Firebase every 2s

// ===== WI-FI & FIREBASE CREDENTIALS =====
// Replace with your 2.4GHz Wi-Fi network or smartphone hotspot
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// FlowJeep Canonical Firebase Realtime Database
const char* FIREBASE_HOST = "https://flowjeep-bf08a-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* JEEPNEY_ID = "JEEP-NCR-0482";
const char* ROUTE_ID = "route-1";
const char* ROUTE_NAME = "Baclaran - Monumento via EDSA";
const char* PLATE_NUMBER = "NDL-8421";
const char* DEVICE_ID = "DEV-ESP32-GPS-01";

const unsigned long BAUDS[] = {9600};
const int NUM_BAUDS = 1;

TinyGPSPlus gps;
HardwareSerial GPSSerial(2);
TinyGPSCustom satsInView(gps, "GPGSV", 3);

int baudIndex = 0;
unsigned long lastPrint = 0;
unsigned long lastByteMs = 0;
unsigned long baudStartMs = 0;
unsigned long bootMs = 0;
unsigned long firstFixMs = 0;
unsigned long lastFirebaseSync = 0;
bool gotFix = false;
bool everReceived = false;
uint32_t dropouts = 0;
bool wasAlive = false;

void startGps(unsigned long baud) {
  GPSSerial.end();
  delay(100);
  GPSSerial.begin(baud, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  baudStartMs = millis();
  Serial.print(">>> GPS UART started at baud ");
  Serial.println(baud);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (String(WIFI_SSID) == "YOUR_WIFI_SSID") {
    // Wi-Fi credentials not configured yet, skip Wi-Fi and operate in Serial mode
    return;
  }
  Serial.print(">>> Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

void pushTelemetryToFirebase(double lat, double lng, double speedKmh, double heading, int sats, double hdop) {
  if (WiFi.status() != WL_CONNECTED) {
    // Attempt auto-reconnect periodically without blocking GPS UART
    static unsigned long lastWifiAttempt = 0;
    if (millis() - lastWifiAttempt > 15000) {
      lastWifiAttempt = millis();
      connectWiFi();
    }
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Lightweight TLS without CA cert storage
  HTTPClient https;

  String url = String(FIREBASE_HOST) + "/live_telemetry/" + JEEPNEY_ID + ".json";

  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");

    // Construct LiveTelemetryRecord payload (PATCH preserves doorway counter & capacity fields)
    String payload = "{";
    payload += "\"jeepneyId\":\"" + String(JEEPNEY_ID) + "\",";
    payload += "\"plateNumber\":\"" + String(PLATE_NUMBER) + "\",";
    payload += "\"routeId\":\"" + String(ROUTE_ID) + "\",";
    payload += "\"routeName\":\"" + String(ROUTE_NAME) + "\",";
    payload += "\"currentCoord\":[" + String(lat, 6) + "," + String(lng, 6) + "],";
    payload += "\"speedKmh\":" + String(speedKmh, 1) + ",";
    payload += "\"headingDegrees\":" + String(heading, 1) + ",";
    payload += "\"satellites\":" + String(sats) + ",";
    payload += "\"hdop\":" + String(hdop, 2) + ",";
    payload += "\"isOnline\":true,";
    payload += "\"lastUpdate\":{\".sv\":\"timestamp\"}";
    payload += "}";

    int httpCode = https.sendRequest("PATCH", payload);
    if (httpCode == HTTP_CODE_OK || httpCode == 200 || httpCode == 204) {
      Serial.print(">>> [Firebase Sync OK] ");
      Serial.print("Lat: "); Serial.print(lat, 6);
      Serial.print(", Lng: "); Serial.print(lng, 6);
      Serial.print(" | Speed: "); Serial.print(speedKmh, 1); Serial.println(" km/h");
    } else {
      Serial.print(">>> [Firebase Sync HTTP] Status code: ");
      Serial.println(httpCode);
    }
    https.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("=== FlowJeep GPS Edge Telemetry v4 (NEO-6M + Firebase RTDB) ===");
  bootMs = millis();
  lastByteMs = millis();

  connectWiFi();
  startGps(BAUDS[baudIndex]);
}

void loop() {
  while (GPSSerial.available() > 0) {
    gps.encode(GPSSerial.read());
    lastByteMs = millis();
    everReceived = true;
  }

  // If nothing has EVER arrived, try the next baud rate every 8 s
  if (!everReceived && millis() - baudStartMs > 8000) {
    baudIndex = (baudIndex + 1) % NUM_BAUDS;
    startGps(BAUDS[baudIndex]);
  }

  // Diagnostic print interval
  if (millis() - lastPrint >= PRINT_INTERVAL_MS) {
    lastPrint = millis();

    static uint32_t lastGood = 0;
    static unsigned long lastGoodMs = millis();
    if (gps.passedChecksum() != lastGood) { lastGood = gps.passedChecksum(); lastGoodMs = millis(); }
    bool alive = everReceived && (millis() - lastGoodMs < STREAM_TIMEOUT_MS);

    Serial.println("--------------------------------");
    Serial.print("Uptime (s)       : "); Serial.println((millis() - bootMs) / 1000);
    Serial.print("Wi-Fi Status     : ");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("Connected (IP: "); Serial.print(WiFi.localIP()); Serial.println(")");
    } else {
      Serial.println("Disconnected / Standby");
    }
    Serial.print("Chars received   : "); Serial.println(gps.charsProcessed());
    Serial.print("Good / Corrupt   : ");
    Serial.print(gps.passedChecksum()); Serial.print(" / ");
    Serial.println(gps.failedChecksum());
    Serial.print("Stream dropouts  : "); Serial.println(dropouts);

    if (!everReceived) {
      Serial.println("STREAM           : NO DATA EVER RECEIVED");
      Serial.println("DIAGNOSIS: Check VCC (use VIN/5V), GND, TX/RX crossing, solder joints.");
      return;
    }

    if (!alive) {
      if (wasAlive) dropouts++;
      wasAlive = false;
      Serial.print("STREAM           : DEAD for ");
      Serial.print((millis() - lastByteMs) / 1000);
      Serial.println(" s");
      Serial.println("DIAGNOSIS: GPS stopped sending. Power or wire dropout, or failing module.");
      Serial.println("           Check LED, reseat VCC/GND, press EN to reset.");
      return;   // do not print stale values
    }
    wasAlive = true;
    Serial.println("STREAM           : ALIVE");

    int inView = atoi(satsInView.value());
    bool fixValid = gps.location.isValid() && gps.location.age() < 2000;

    Serial.print("Satellites seen  : "); Serial.println(inView);
    Serial.print("Satellites used  : ");
    Serial.println(gps.satellites.isValid() ? gps.satellites.value() : 0);

    if (fixValid) {
      if (!gotFix) { gotFix = true; firstFixMs = millis() - bootMs; }
      Serial.println("STATUS           : FIX OK");
      Serial.print("Time to 1st fix  : "); Serial.print(firstFixMs / 1000); Serial.println(" s");
      Serial.print("Latitude         : "); Serial.println(gps.location.lat(), 6);
      Serial.print("Longitude        : "); Serial.println(gps.location.lng(), 6);
      Serial.print("Speed (km/h)     : "); Serial.println(gps.speed.kmph());
      Serial.print("Heading (deg)    : "); Serial.println(gps.course.deg());
      Serial.print("HDOP             : "); Serial.println(gps.hdop.hdop());
      Serial.print("Maps link        : https://www.google.com/maps?q=");
      Serial.print(gps.location.lat(), 6); Serial.print(",");
      Serial.println(gps.location.lng(), 6);

      // Periodically push to Firebase RTDB
      if (millis() - lastFirebaseSync >= FIREBASE_SYNC_INTERVAL_MS) {
        lastFirebaseSync = millis();
        int sats = gps.satellites.isValid() ? gps.satellites.value() : inView;
        double heading = gps.course.isValid() ? gps.course.deg() : 0.0;
        double hdopVal = gps.hdop.isValid() ? gps.hdop.hdop() : 1.0;
        pushTelemetryToFirebase(
          gps.location.lat(),
          gps.location.lng(),
          gps.speed.kmph(),
          heading,
          sats,
          hdopVal
        );
      }
    } else {
      Serial.println("STATUS           : NO FIX");
      if (inView == 0) Serial.println("DIAGNOSIS: Stream OK, 0 satellites. Needs open sky / antenna check.");
      else             Serial.println("DIAGNOSIS: Satellites seen, still locking. Keep waiting.");
    }
  }
}