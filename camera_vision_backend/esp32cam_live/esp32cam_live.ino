#include "esp_camera.h"
#include <WiFi.h>
#include "esp_wifi.h"
#include "esp_http_server.h"

// Note: ESP32 only supports 2.4GHz Wi-Fi channels
const char *ssid = "Snow-WiFi";
const char *password = "Heaven123";

// ---- Smoothness settings ----
// FRAMESIZE_QVGA (320x240) = smoothest, FRAMESIZE_CIF (400x296) = good balance,
// FRAMESIZE_VGA (640x480) = sharper but slower
#define STREAM_FRAMESIZE FRAMESIZE_VGA
#define JPEG_QUALITY 12  // 10 = best quality, 63 = lowest (smaller = faster)
#define XCLK_HZ 20000000 // try 10000000 if camera init fails

// AI Thinker ESP32-CAM pins
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22
#define FLASH_LED 4

httpd_handle_t pageServer = NULL;
httpd_handle_t streamServer = NULL;

static const char *BOUNDARY = "\r\n--frame\r\n";
static const char *PART_HDR = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = XCLK_HZ;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = STREAM_FRAMESIZE;
  config.jpeg_quality = JPEG_QUALITY;
  config.grab_mode = CAMERA_GRAB_LATEST;  // always newest frame, no old buffered frames
  if (psramFound()) {
    config.fb_count = 2;                  // double buffering = smoother video
    config.fb_location = CAMERA_FB_IN_PSRAM;
  } else {
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.frame_size = FRAMESIZE_QVGA;
  }

  pinMode(PWDN_GPIO_NUM, OUTPUT);
  digitalWrite(PWDN_GPIO_NUM, HIGH);
  delay(100);
  digitalWrite(PWDN_GPIO_NUM, LOW);
  delay(100);

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    return false;
  }
  return true;
}

static esp_err_t indexHandler(httpd_req_t *req) {
  String ip = WiFi.localIP().toString();
  String html =
    "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>"
    "<body style='margin:0;background:#000;text-align:center'>"
    "<img style='width:100%;max-width:960px' src='http://" + ip + ":81/stream'>"
    "</body></html>";
  httpd_resp_set_type(req, "text/html");
  return httpd_resp_send(req, html.c_str(), html.length());
}

static esp_err_t streamHandler(httpd_req_t *req) {
  httpd_resp_set_type(req, "multipart/x-mixed-replace;boundary=frame");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  char part[64];

  while (true) {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) continue;

    esp_err_t res = httpd_resp_send_chunk(req, BOUNDARY, strlen(BOUNDARY));
    if (res == ESP_OK) {
      size_t n = snprintf(part, sizeof(part), PART_HDR, (unsigned)fb->len);
      res = httpd_resp_send_chunk(req, part, n);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)fb->buf, fb->len);
    }
    esp_camera_fb_return(fb);
    if (res != ESP_OK) break;  // viewer closed the page
  }
  return ESP_OK;
}

void startServers() {
  httpd_config_t cfg = HTTPD_DEFAULT_CONFIG();
  cfg.server_port = 80;
  httpd_uri_t index_uri = {"/", HTTP_GET, indexHandler, NULL};
  if (httpd_start(&pageServer, &cfg) == ESP_OK) {
    httpd_register_uri_handler(pageServer, &index_uri);
  }

  cfg.server_port = 81;
  cfg.ctrl_port += 1;
  httpd_uri_t stream_uri = {"/stream", HTTP_GET, streamHandler, NULL};
  if (httpd_start(&streamServer, &cfg) == ESP_OK) {
    httpd_register_uri_handler(streamServer, &stream_uri);
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  esp_wifi_set_ps(WIFI_PS_NONE);            // no power-saving pauses
  WiFi.setTxPower(WIFI_POWER_19_5dBm);      // strongest signal
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nESP32-CAM live stream starting...");

  pinMode(FLASH_LED, OUTPUT);
  digitalWrite(FLASH_LED, LOW);

  if (!initCamera()) {
    Serial.println("CAMERA NOT WORKING. Check ribbon cable and sensor module.");
    while (true) {  // blink the flash LED to show the failure
      digitalWrite(FLASH_LED, HIGH); delay(100);
      digitalWrite(FLASH_LED, LOW);  delay(900);
    }
  }

  sensor_t *s = esp_camera_sensor_get();
  Serial.printf("Sensor PID: 0x%x\n", s->id.PID);
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }

  connectWiFi();
  startServers();

  Serial.print("Live camera: http://");
  Serial.println(WiFi.localIP());
  Serial.print("Direct stream: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream");
}

void loop() {
  // reconnect automatically if the Wi-Fi drops
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost, reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    delay(5000);
  }
  delay(2000);
}
