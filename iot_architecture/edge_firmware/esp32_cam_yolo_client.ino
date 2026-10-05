/**
 * FlowJeep ESP32-CAM MB - YOLOv8 Vision Client
 * 
 * Hardware: AI Thinker ESP32-CAM (with MB programmer shield)
 * Sensor: OmniVision OV2640 Camera
 * 
 * Function:
 * 1. Initializes OV2640 camera in QVGA/VGA mode.
 * 2. Connects to Wi-Fi.
 * 3. Periodically captures a JPEG snapshot.
 * 4. Sends the frame over HTTP POST to the local Python YOLOv8 server.
 * 5. Python server runs person detection and syncs count to Firebase Realtime Database.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ===================== 1. USER CONFIGURATION =====================
const char* ssid     = "Snow-WiFi_5GHz";
const char* password = "YOUR_WIFI_PASSWORD"; // <-- Replace with your Wi-Fi password

// IP address of the PC running the Python YOLOv8 server
// (Your PC's IP on Snow-WiFi_5GHz is 192.168.1.63)
const char* serverUrl = "http://192.168.1.63:5000/upload-frame";

// Frame capture interval (in milliseconds)
const unsigned long CAPTURE_INTERVAL_MS = 3000; // Captures and checks every 3 seconds

// ================= 2. AI THINKER ESP32-CAM PINOUT =================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

unsigned long lastCaptureTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[FlowJeep] Initializing ESP32-CAM YOLOv8 Client...");

  // 1. Configure Camera Hardware
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Frame size & quality (QVGA 320x240 is ideal for high-speed Wi-Fi transmission)
  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 12;           // 0-63 lower means higher quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  // Initialize the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[Error] Camera init failed with error 0x%x\n", err);
    return;
  }
  Serial.println("[FlowJeep] OV2640 Camera initialized successfully!");

  // 2. Connect to Wi-Fi
  Serial.printf("[FlowJeep] Connecting to Wi-Fi: %s\n", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[FlowJeep] Wi-Fi Connected!");
  Serial.print("[FlowJeep] ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long now = millis();
  if (now - lastCaptureTime >= CAPTURE_INTERVAL_MS) {
    lastCaptureTime = now;
    captureAndSendFrame();
  }
}

void captureAndSendFrame() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[FlowJeep] Wi-Fi disconnected, skipping capture.");
    return;
  }

  // 1. Capture image frame from camera
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[Error] Camera capture failed!");
    return;
  }

  Serial.printf("[FlowJeep] Captured frame (%u bytes). Sending to YOLOv8 server...\n", fb->len);

  // 2. Send JPEG buffer via HTTP POST to the Python server
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "image/jpeg");

  int httpCode = http.POST(fb->buf, fb->len);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[FlowJeep] Server Response (%d): %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("[Error] HTTP POST failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();

  // 3. Return frame buffer back to camera driver
  esp_camera_fb_return(fb);
}
