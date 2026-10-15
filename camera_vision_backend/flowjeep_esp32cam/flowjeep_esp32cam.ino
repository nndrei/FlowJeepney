// FlowJeep ESP32-CAM: IR doorway events + camera frame + GPS -> Air780E -> MQTT
//
// Board: AI Thinker ESP32-CAM (Tools > Board). Library needed: TinyGPSPlus.
//
// Pins (SD card must be removed):
//   Air780E TX -> GPIO14      Air780E RX <- GPIO13
//   NEO-6M TX  -> GPIO15
//   IR A signal -> GPIO2      IR B signal -> GPIO4    (E18-D80NK, NPN, active LOW)
//   (GPIO4 is also the bright flash LED: with the pull-up it may glow, cover it with tape)
//
// MQTT topics (TOPIC_BASE must match bridge.py):
//   <base>/tel  small text messages:
//        T;lat;lng;speed;heading;sats;hdop;fix;irEntry;irExit;uptimeSec
//        E;eventId;E|X;irEntry;irExit;hasImage;uptimeSec
//   <base>/img  picture chunks: I;eventId;pictureNo;pictureCount;chunkIdx;chunkTotal;base64data
//        (BURST_COUNT pictures are taken per door event so YOLO can count the people)
//
// NOTE: images of passengers are personal data. While on the PUBLIC broker use
// test pictures only (see SEND_IMAGES). Use a private broker with a login for real use.

#include <Arduino.h>
#include <HardwareSerial.h>
#include <TinyGPSPlus.h>
#include "esp_camera.h"
#include "mbedtls/base64.h"

// ===================== PINS =====================
#define GPS_RX_PIN 15      // NEO-6M TX -> GPIO15
#define GPS_TX_PIN -1      // not used
#define AIR_RX_PIN 14      // Air780E TX -> GPIO14
#define AIR_TX_PIN 13      // Air780E RX -> GPIO13
#define IR_A_PIN 2
#define IR_B_PIN 4
#define IR_ACTIVE_LEVEL LOW   // E18-D80NK pulls the signal to GND when it detects something
#define A_FIRST_IS_ENTRY 1    // 1: A then B = ENTRY.  Set to 0 to flip the direction

// ===================== TIMING =====================
#define DEBOUNCE_MS 15
#define CROSS_WINDOW_MS 3000        // second beam must trigger within this time
#define CLEAR_MS 250                // both beams must be clear this long before the next event
#define CAPTURE_DELAY_MS 100        // wait after the first beam so the person moves into the camera view
#define CAM_PUMP_MS 0               // pause between frames; 0 = pull as fast as the sensor delivers (like the Wi-Fi sketch)

// ---- troubleshooting switches (for hunting the cam_hal FB-OVF warning) ----
#define CAM_ONLY_TEST 0             // 1 = run ONLY the camera (no GPS, IR or modem) and print frames per second
#define SILENCE_CAM_WARNINGS 1      // 1 = hide "cam_hal: FB-OVF" lines so Serial Monitor stays clean
#define ENABLE_GPS_TASK 1           // 0 = do not start the GPS task
#define ENABLE_IR_TASK 1            // 0 = do not start the IR task
#define TELEMETRY_INTERVAL_MS 5000
#define RECONNECT_INTERVAL_MS 8000

// ===================== IMAGES =====================
#define SEND_IMAGES 0               // 1 = send snapshot per door event
#define CHUNK_RAW_BYTES 768         // -> 1024 base64 characters per MQTT message
#define BURST_COUNT 1               // 1 fast snapshot per door event for rapid cellular upload
#define BURST_INTERVAL_MS 250       // time between pictures
#define IMG_QUEUE_LEN 4             // pictures waiting to be sent
#define MAX_IMG_BYTES 80000         // frames larger than this are skipped

// ===================== MQTT =====================
const char* BROKER    = "broker.hivemq.com";
const int   PORT      = 1883;
const char* MQTT_USER = "";                         // fill in for a private broker
const char* MQTT_PASS = "";
const char* CLIENT_ID = "flowjeep-cam-0482-a1236azs";   // must be unique on a public broker
#define TOPIC_BASE "flowjeep/a1236azs/JEEP-NCR-0482"    // must match TOPIC_SECRET in bridge.py
const char* TOPIC_TEL = TOPIC_BASE "/tel";
const char* TOPIC_IMG = TOPIC_BASE "/img";

// ===================== CAMERA (fast cellular upload profile) =====================
#define STREAM_FRAMESIZE FRAMESIZE_QVGA   // 320x240 (~6-8 KB): uploads in ~1 second over Air780E
#define JPEG_QUALITY 16                   // crisp for YOLO, small file size
#define XCLK_HZ 20000000                  // same as your working Wi-Fi sketch
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

// ===================== GLOBALS =====================
TinyGPSPlus gps;
HardwareSerial GPSSerial(1);
HardwareSerial Air780(2);

struct GpsSnap { bool valid; double lat, lng, spd, hdg, hdop; int sats; };
GpsSnap gpsSnap = {false, 0, 0, 0, 0, 1.0, 0};
SemaphoreHandle_t gpsMutex;

struct EvtMsg { char id[10]; char dir; uint32_t entry; uint32_t exitCnt; uint8_t hasImg; uint32_t upSec; };
struct ImgJob { char id[10]; uint8_t no; uint8_t cnt; uint8_t* buf; size_t len; };
QueueHandle_t evtQ;
QueueHandle_t imgQ;

volatile uint32_t irEntry = 0;
volatile uint32_t irExitCnt = 0;
uint16_t bootTag = 0;
uint32_t evtSeq = 0;
bool cameraOk = false;

// burst of pictures taken after the first beam, waiting for the direction to be known
uint8_t* burstBuf[BURST_COUNT];     // copies of the pictures (in PSRAM)
size_t burstLen[BURST_COUNT];
volatile uint8_t burstGot = 0;      // pictures stored so far
volatile uint8_t burstWant = 0;     // pictures still to take (0 = idle)
volatile uint32_t capAt = 0;        // earliest time the next picture may be taken
SemaphoreHandle_t capMutex;

// modem/uploader state (used only by loop())
bool mqttReady = false;
uint32_t lastReconnect = 0;
uint32_t lastTel = 0;
bool haveCur = false;
ImgJob cur;
size_t curOff = 0;
uint16_t curIdx = 0, curTotal = 0;
uint8_t curFails = 0;

static char cmdBuf[1500];
static char payloadBuf[1200];

// ===================== CAMERA =====================
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
  config.grab_mode = CAMERA_GRAB_LATEST;
  if (psramFound()) {
    config.fb_count = 2;
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
  sensor_t* s = esp_camera_sensor_get();
  Serial.printf("Sensor PID: 0x%x\n", s->id.PID);
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  return true;
}

void freeBurst() {
  for (int i = 0; i < BURST_COUNT; i++) {
    if (burstBuf[i]) free(burstBuf[i]);
    burstBuf[i] = nullptr;
    burstLen[i] = 0;
  }
  burstGot = 0;
}

// IR task asks for a burst of pictures; the camera task takes them one by one.
void requestCapture() {
#if SEND_IMAGES
  if (!cameraOk) return;
  xSemaphoreTake(capMutex, portMAX_DELAY);
  freeBurst();
  capAt = millis() + CAPTURE_DELAY_MS;
  burstWant = BURST_COUNT;
  xSemaphoreGive(capMutex);
#endif
}

// Drop the burst (the event was discarded).
void discardCapture() {
#if SEND_IMAGES
  xSemaphoreTake(capMutex, portMAX_DELAY);
  burstWant = 0;
  freeBurst();
  xSemaphoreGive(capMutex);
#endif
}

// Collect the pictures for a finished event. Returns how many were taken.
int takeCaptures(uint8_t** bufs, size_t* lens) {
#if SEND_IMAGES
  uint32_t t0 = millis();
  while (burstWant > 0 && millis() - t0 < 1500) vTaskDelay(pdMS_TO_TICKS(5));
  xSemaphoreTake(capMutex, portMAX_DELAY);
  burstWant = 0;
  int n = burstGot;
  for (int i = 0; i < n; i++) {
    bufs[i] = burstBuf[i];
    lens[i] = burstLen[i];
    burstBuf[i] = nullptr;
    burstLen[i] = 0;
  }
  burstGot = 0;
  xSemaphoreGive(capMutex);
  return n;
#else
  return 0;
#endif
}

// Camera task: always pulls frames (like the Wi-Fi stream sketch did) and keeps one on request.
void camTask(void*) {
#if CAM_ONLY_TEST
  uint32_t frames = 0, lastReport = millis();
#endif
  for (;;) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) { vTaskDelay(pdMS_TO_TICKS(30)); continue; }
#if CAM_ONLY_TEST
    frames++;
    if (millis() - lastReport >= 5000) {
      Serial.printf("[CAM TEST] %lu frames in 5 s (%.1f fps), last frame %u bytes\n",
                    (unsigned long)frames, frames / 5.0, (unsigned)fb->len);
      frames = 0;
      lastReport = millis();
    }
#endif
    if (burstWant > 0 && (int32_t)(millis() - capAt) >= 0) {
      xSemaphoreTake(capMutex, portMAX_DELAY);
      if (burstWant > 0) {
        if (fb->len <= MAX_IMG_BYTES) {
          uint8_t* b = (uint8_t*)ps_malloc(fb->len);
          if (!b) b = (uint8_t*)malloc(fb->len);
          if (b) {
            memcpy(b, fb->buf, fb->len);
            burstBuf[burstGot] = b;
            burstLen[burstGot] = fb->len;
            burstGot++;
            Serial.printf("[CAM] picture %u taken (%u bytes)\n", (unsigned)burstGot, (unsigned)fb->len);
          } else {
            Serial.printf("[CAM ERROR] memory allocation failed for %u bytes (check Tools > PSRAM)\n", (unsigned)fb->len);
          }
        } else {
          Serial.printf("[CAM] frame too large (%u bytes), skipped\n", (unsigned)fb->len);
        }
        burstWant--;
        capAt = millis() + BURST_INTERVAL_MS;
      }
      xSemaphoreGive(capMutex);
    }
    esp_camera_fb_return(fb);
    vTaskDelay(pdMS_TO_TICKS(CAM_PUMP_MS));
  }
}

// ===================== GPS TASK =====================
void gpsTask(void*) {
  uint32_t lastSnap = 0;
  for (;;) {
    while (GPSSerial.available() > 0) gps.encode(GPSSerial.read());
    uint32_t now = millis();
    if (now - lastSnap >= 250) {
      lastSnap = now;
      GpsSnap s;
      s.valid = gps.location.isValid() && gps.location.age() < 3000;
      s.lat = gps.location.lat();
      s.lng = gps.location.lng();
      s.spd = gps.speed.isValid() ? gps.speed.kmph() : 0.0;
      s.hdg = gps.course.isValid() ? gps.course.deg() : 0.0;
      s.hdop = gps.hdop.isValid() ? gps.hdop.hdop() : 1.0;
      s.sats = gps.satellites.isValid() ? (int)gps.satellites.value() : 0;
      xSemaphoreTake(gpsMutex, portMAX_DELAY);
      gpsSnap = s;
      xSemaphoreGive(gpsMutex);
    }
    vTaskDelay(pdMS_TO_TICKS(5));
  }
}

// ===================== IR TASK =====================
// debounce state for the two sensors: index 0 = IR A, index 1 = IR B
bool debStable[2] = {false, false};
bool debLast[2] = {false, false};
uint32_t debT[2] = {0, 0};

bool readDeb(int idx, int pin) {
  bool raw = (digitalRead(pin) == IR_ACTIVE_LEVEL);
  uint32_t now = millis();
  if (raw != debLast[idx]) { debLast[idx] = raw; debT[idx] = now; }
  if (raw != debStable[idx] && now - debT[idx] >= DEBOUNCE_MS) debStable[idx] = raw;
  return debStable[idx];
}

void finishEvent(char first) {
  bool isEntry = ((first == 'A') == (A_FIRST_IS_ENTRY == 1));
  if (isEntry) irEntry++; else irExitCnt++;

  char id[10];
  snprintf(id, sizeof(id), "%04X%04u", (unsigned)bootTag, (unsigned)(++evtSeq % 10000));

  EvtMsg e;
  memset(&e, 0, sizeof(e));
  strlcpy(e.id, id, sizeof(e.id));
  e.dir = isEntry ? 'E' : 'X';
  e.entry = irEntry;
  e.exitCnt = irExitCnt;
  e.upSec = millis() / 1000;
  e.hasImg = 0;

  uint8_t* frameBufs[BURST_COUNT];
  size_t frameLens[BURST_COUNT];
  int got = takeCaptures(frameBufs, frameLens);
  int room = (int)uxQueueSpacesAvailable(imgQ);
  int keep = got < room ? got : room;
  for (int i = 0; i < got; i++) {
    if (i < keep) {
      ImgJob j;
      memset(&j, 0, sizeof(j));
      strlcpy(j.id, id, sizeof(j.id));
      j.no = (uint8_t)i;
      j.cnt = (uint8_t)keep;
      j.buf = frameBufs[i];
      j.len = frameLens[i];
      if (xQueueSend(imgQ, &j, 0) != pdTRUE) { free(frameBufs[i]); keep = i; }
    } else {
      free(frameBufs[i]);
    }
  }
  if (keep < got) Serial.println("[IR] image queue full, some pictures dropped");
  e.hasImg = (uint8_t)keep;     // number of pictures that will follow
  if (xQueueSend(evtQ, &e, 0) != pdTRUE) Serial.println("[IR] event queue full");
  Serial.printf("[IR] %s event %s | entry=%lu exit=%lu | pictures=%d\n",
                isEntry ? "ENTRY" : "EXIT", id,
                (unsigned long)irEntry, (unsigned long)irExitCnt, e.hasImg);
}

void irTask(void*) {
  pinMode(IR_A_PIN, INPUT_PULLUP);
  pinMode(IR_B_PIN, INPUT_PULLUP);
  enum State { IDLE, FIRST_A, FIRST_B, WAIT_CLEAR };
  State st = IDLE;
  uint32_t tFirst = 0, tClear = 0;
  bool clearing = false;

  for (;;) {
    bool a = readDeb(0, IR_A_PIN);
    bool b = readDeb(1, IR_B_PIN);
    uint32_t now = millis();

    switch (st) {
      case IDLE:
        if (a && b) { st = WAIT_CLEAR; clearing = false; }       // both at once: direction unknown
        else if (a) { st = FIRST_A; tFirst = now; requestCapture(); }
        else if (b) { st = FIRST_B; tFirst = now; requestCapture(); }
        break;

      case FIRST_A:
        if (b) { finishEvent('A'); st = WAIT_CLEAR; clearing = false; }
        else if (now - tFirst > CROSS_WINDOW_MS) {
          discardCapture();
          Serial.println("[IR] A triggered but B did not: discarded");
          st = WAIT_CLEAR; clearing = false;
        }
        break;

      case FIRST_B:
        if (a) { finishEvent('B'); st = WAIT_CLEAR; clearing = false; }
        else if (now - tFirst > CROSS_WINDOW_MS) {
          discardCapture();
          Serial.println("[IR] B triggered but A did not: discarded");
          st = WAIT_CLEAR; clearing = false;
        }
        break;

      case WAIT_CLEAR:
        if (a || b) {
          clearing = false;
        } else {
          if (!clearing) { clearing = true; tClear = now; }
          else if (now - tClear >= CLEAR_MS) st = IDLE;
        }
        break;
    }
    vTaskDelay(pdMS_TO_TICKS(2));
  }
}

// ===================== MODEM / MQTT =====================
bool at(const String& cmd, const char* expect = "OK", uint32_t timeoutMs = 3000) {
  while (Air780.available()) Air780.read();
  Air780.print(cmd + "\r\n");
  String resp;
  uint32_t start = millis();
  bool found = false;
  while (millis() - start < timeoutMs) {
    while (Air780.available()) resp += (char)Air780.read();
    if (resp.indexOf(expect) >= 0) { found = true; break; }
    if (resp.indexOf("ERROR") >= 0) break;
    delay(2);
  }
  Serial.println(String(">> ") + cmd + (found ? "  [OK]" : "  [FAIL]"));
  if (!found) Serial.println(resp);
  return found;
}

bool cellularReady() {
  return at("AT") && at("AT+CPIN?", "READY") && at("AT+CGPADDR=1", "+CGPADDR");
}

bool mqttConnect() {
  at("AT+MDISCONNECT", "OK", 2000);   // clear any old session (failure is fine)
  at("AT+MIPCLOSE", "OK", 2000);
  String cfg = String("AT+MCONFIG=\"") + CLIENT_ID + "\",\"" + MQTT_USER + "\",\"" + MQTT_PASS + "\"";
  if (!at(cfg)) return false;
  if (!at(String("AT+MIPSTART=\"") + BROKER + "\"," + PORT, "CONNECT OK", 12000)) return false;
  return at("AT+MCONNECT=1,60", "CONNACK OK", 15000);
}

// Publish one message. Long commands (images) are quiet on the Serial Monitor.
bool mpub(const char* topic, const char* payload, uint32_t timeoutMs = 6000) {
  int n = snprintf(cmdBuf, sizeof(cmdBuf), "AT+MPUB=\"%s\",0,0,\"%s\"", topic, payload);
  if (n <= 0 || n >= (int)sizeof(cmdBuf)) { Serial.println("[MQTT] message too long"); return false; }
  while (Air780.available()) Air780.read();
  Air780.print(cmdBuf);
  Air780.print("\r\n");
  String resp;
  uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    while (Air780.available()) resp += (char)Air780.read();
    if (resp.indexOf("OK") >= 0) return true;
    if (resp.indexOf("ERROR") >= 0) { Serial.println("[MQTT] publish ERROR: " + resp); return false; }
    delay(1);
  }
  Serial.println("[MQTT] publish timeout");
  return false;
}

bool sendTelemetry() {
  GpsSnap g;
  xSemaphoreTake(gpsMutex, portMAX_DELAY);
  g = gpsSnap;
  xSemaphoreGive(gpsMutex);
  char p[180];
  snprintf(p, sizeof(p), "T;%.6f;%.6f;%.1f;%.1f;%d;%.2f;%d;%lu;%lu;%lu",
           g.lat, g.lng, g.spd, g.hdg, g.sats, g.hdop, g.valid ? 1 : 0,
           (unsigned long)irEntry, (unsigned long)irExitCnt, (unsigned long)(millis() / 1000));
  bool ok = mpub(TOPIC_TEL, p);
  Serial.println(ok ? String("[MQTT] ") + p : String("[MQTT] telemetry FAILED"));
  return ok;
}

bool sendEvent(const char* id, char dir, uint32_t entry, uint32_t exitCnt, uint8_t hasImg, uint32_t upSec) {
  char p[100];
  snprintf(p, sizeof(p), "E;%s;%c;%lu;%lu;%d;%lu", id, dir,
           (unsigned long)entry, (unsigned long)exitCnt, hasImg, (unsigned long)upSec);
  bool ok = mpub(TOPIC_TEL, p);
  Serial.println(ok ? String("[MQTT] ") + p : String("[MQTT] event FAILED"));
  return ok;
}

bool sendChunk(const char* id, uint8_t no, uint8_t cnt, const uint8_t* buf, size_t off, size_t n, uint16_t idx, uint16_t total) {
  int hdr = snprintf(payloadBuf, sizeof(payloadBuf), "I;%s;%u;%u;%u;%u;", id, (unsigned)no, (unsigned)cnt,
                     (unsigned)idx, (unsigned)total);
  size_t olen = 0;
  int rc = mbedtls_base64_encode((unsigned char*)payloadBuf + hdr, sizeof(payloadBuf) - hdr - 1,
                                 &olen, buf + off, n);
  if (rc != 0) return false;
  payloadBuf[hdr + olen] = 0;
  return mpub(TOPIC_IMG, payloadBuf, 8000);
}

// ===================== SETUP / LOOP =====================
void setup() {
  Serial.begin(115200);
#if SILENCE_CAM_WARNINGS
  esp_log_level_set("cam_hal", ESP_LOG_ERROR);   // hides warnings only; real errors still print
#endif
  delay(1000);
  Serial.println("\n=== FlowJeep ESP32-CAM: IR + camera + GPS -> Air780E -> MQTT ===");

  bootTag = (uint16_t)(esp_random() & 0xFFFF);
  gpsMutex = xSemaphoreCreateMutex();
  capMutex = xSemaphoreCreateMutex();
  evtQ = xQueueCreate(16, sizeof(EvtMsg));
  imgQ = xQueueCreate(IMG_QUEUE_LEN, sizeof(ImgJob));

  // Camera first, exactly like the working Wi-Fi sketch
#if SEND_IMAGES || CAM_ONLY_TEST
  Serial.printf("[CAM] PSRAM: %s\n", psramFound() ? "found" : "NOT FOUND (enable it in Tools > PSRAM)");
  cameraOk = initCamera();
  Serial.println(cameraOk ? "[CAM] ready" : "[CAM] NOT working: IR and GPS will still run, images disabled");
  if (cameraOk) xTaskCreatePinnedToCore(camTask, "cam", 4096, nullptr, 1, nullptr, 1);
#else
  Serial.println("[CAM] images disabled (SEND_IMAGES 0)");
#endif

#if CAM_ONLY_TEST
  Serial.println("[CAM TEST] camera-only mode: GPS, IR and modem are NOT running");
  return;
#endif

  GPSSerial.setRxBufferSize(1024);
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Air780.setRxBufferSize(2048);
  Air780.begin(115200, SERIAL_8N1, AIR_RX_PIN, AIR_TX_PIN);

#if ENABLE_GPS_TASK
  xTaskCreatePinnedToCore(gpsTask, "gps", 3072, nullptr, 2, nullptr, 0);
#endif
#if ENABLE_IR_TASK
  xTaskCreatePinnedToCore(irTask, "ir", 6144, nullptr, 3, nullptr, 0);
#endif

  delay(3000);
  at("ATE0");
  mqttReady = cellularReady() && mqttConnect();
  Serial.println(mqttReady ? "[MQTT] Connected" : "[MQTT] FAILED, will retry");
}

void loop() {
#if CAM_ONLY_TEST
  delay(1000);
  return;
#endif
  uint32_t now = millis();

  // 1. (re)connect when needed
  if (!mqttReady) {
    if (now - lastReconnect >= RECONNECT_INTERVAL_MS) {
      lastReconnect = now;
      mqttReady = cellularReady() && mqttConnect();
      Serial.println(mqttReady ? "[MQTT] Reconnected" : "[MQTT] reconnect failed");
    }
    delay(50);
    return;
  }

  // 2. door events first (small, urgent)
  EvtMsg e;
  if (xQueueReceive(evtQ, &e, 0) == pdTRUE) {
    if (!sendEvent(e.id, e.dir, e.entry, e.exitCnt, e.hasImg, e.upSec)) {
      xQueueSendToFront(evtQ, &e, 0);
      mqttReady = false;
    }
    return;
  }

  // 3. telemetry every few seconds
  if (now - lastTel >= TELEMETRY_INTERVAL_MS) {
    lastTel = now;
    if (!sendTelemetry()) mqttReady = false;
    return;
  }

#if SEND_IMAGES
  // 4. one image chunk per pass, so events and telemetry are never stuck behind an image
  if (!haveCur && xQueueReceive(imgQ, &cur, 0) == pdTRUE) {
    haveCur = true;
    curOff = 0;
    curIdx = 0;
    curFails = 0;
    curTotal = (uint16_t)((cur.len + CHUNK_RAW_BYTES - 1) / CHUNK_RAW_BYTES);
    Serial.printf("[IMG] sending %s picture %u/%u: %u bytes in %u chunks\n", cur.id,
                  (unsigned)cur.no + 1, (unsigned)cur.cnt, (unsigned)cur.len, (unsigned)curTotal);
  }
  if (haveCur) {
    size_t left = cur.len - curOff;
    size_t n = left < (size_t)CHUNK_RAW_BYTES ? left : (size_t)CHUNK_RAW_BYTES;
    if (sendChunk(cur.id, cur.no, cur.cnt, cur.buf, curOff, n, curIdx, curTotal)) {
      curOff += n;
      curIdx++;
      curFails = 0;
      if (curOff >= cur.len) {
        free(cur.buf);
        haveCur = false;
        Serial.printf("[IMG] %s picture %u/%u sent\n", cur.id, (unsigned)cur.no + 1, (unsigned)cur.cnt);
      }
    } else {
      mqttReady = false;
      if (++curFails >= 3) {
        free(cur.buf);
        haveCur = false;
        Serial.printf("[IMG] %s picture %u abandoned after 3 failures\n", cur.id, (unsigned)cur.no + 1);
      }
    }
    return;
  }
#endif

  delay(5);
}
