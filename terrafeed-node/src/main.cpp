// TERRAFEED//NODE — main firmware loop.
//
// Wake cycle:
//   1. capture full-res JPEG (OV2640, UXGA)
//   2. queue JPEG to SD ring buffer (offline-first)
//   3. decode a 1/8-scale RGB565 copy (200x150) in PSRAM
//   4. run heuristic CV: green/brown ratio, brightness, edge density
//   5. build 34-byte TfnPacketV1, write to companion Meshtastic node over UART
//   6. every Nth wake: WiFi sync (NTP + upload queued JPEGs to terrafeed backend)
//   7. deep sleep until next interval
//
// Time model: ESP32-S3 system time persists across deep sleep on the RTC clock
// (with drift — expect seconds/day; NTP corrects it every sync window). Until
// the first NTP sync, timestamps are uptime-seconds and TFN_F_TIME_VALID is clear.

#include <Arduino.h>
#include <time.h>
#include "esp_camera.h"
#include "img_converters.h"   // jpg2rgb565 (esp32-camera)
#include "config.h"
#include "tfn_packet.h"
#include "analysis_core.h"
#include "camera_ctl.h"
#include "sd_queue.h"
#include "mesh_serial.h"
#include "power.h"
#include "wifi_sync.h"

// Survives deep sleep, lost on power cycle.
RTC_DATA_ATTR uint16_t g_boot_count = 0;
RTC_DATA_ATTR uint8_t  g_time_valid = 0;

// UXGA (1600x1200) decoded at JPG_SCALE_8X -> 200x150 RGB565
static const int ANA_W = 200;
static const int ANA_H = 150;

static uint32_t node_id() {
#if TFN_NODE_ID_FROM_MAC
    uint64_t mac = ESP.getEfuseMac();
    return (uint32_t)(mac & 0xFFFFFFFFULL);
#else
    return TFN_NODE_ID_OVERRIDE;
#endif
}

static uint32_t now_seconds() {
    if (g_time_valid) return (uint32_t)time(nullptr);
    return (uint32_t)(millis() / 1000);  // pre-NTP fallback: uptime this wake
}

static void run_cycle() {
    g_boot_count++;
    Serial.printf("\n[tfn] wake %u, node %08lx\n",
                  g_boot_count, (unsigned long)node_id());

    uint8_t flags = 0;
    if (g_time_valid) flags |= TFN_F_TIME_VALID;

    uint16_t batt = power_batt_mv();
    if (batt > 0 && batt < TFN_LOW_BATT_MV) flags |= TFN_F_LOW_BATT;

    bool sd = sdq_begin();
    if (sd) flags |= TFN_F_SD_OK;

    TfnAnalysis ana = {};
    bool cam_ok = false;

    if (cam_begin()) {
        camera_fb_t *fb = cam_capture();
        if (fb && fb->format == PIXFORMAT_JPEG) {
            cam_ok = true;
            flags |= TFN_F_CAMERA_OK;

            if (sd) {
                int32_t seq = sdq_push(fb->buf, fb->len, now_seconds(), flags);
                Serial.printf("[tfn] queued jpeg %uB as seq %ld\n",
                              (unsigned)fb->len, (long)seq);
            }

            // Scaled decode for analysis: 200*150*2 = 60 KB in PSRAM.
            size_t rgb_len = (size_t)ANA_W * ANA_H * 2;
            uint8_t *rgb = (uint8_t *)ps_malloc(rgb_len);
            uint8_t *luma = (uint8_t *)ps_malloc((size_t)ANA_W * ANA_H);
            if (rgb && luma && jpg2rgb565(fb->buf, fb->len, rgb, JPG_SCALE_8X)) {
                // swap=1: jpg2rgb565 emits byte-swapped (big-endian) RGB565.
                tfn_analyze_rgb565(rgb, ANA_W, ANA_H, 1, luma, &ana);
                Serial.printf("[tfn] green=%u brown=%u bright=%u edge=%u (bp)\n",
                              ana.green_bp, ana.brown_bp,
                              ana.brightness_bp, ana.edge_bp);
            } else {
                Serial.println("[tfn] analysis decode failed");
            }
            if (rgb) free(rgb);
            if (luma) free(luma);
        }
        if (fb) esp_camera_fb_return(fb);
    }

    // Build + transmit the mesh packet even on partial failure — a packet with
    // CAMERA_OK clear is itself useful field telemetry.
    TfnPacketV1 pkt;
    tfn_packet_init(&pkt);
    pkt.flags         = flags;
    pkt.node_id       = node_id();
    pkt.timestamp     = now_seconds();
    pkt.boot_count    = g_boot_count;
    pkt.batt_mv       = batt;
    pkt.green_bp      = ana.green_bp;
    pkt.brown_bp      = ana.brown_bp;
    pkt.brightness_bp = ana.brightness_bp;
    pkt.edge_bp       = ana.edge_bp;
    tfn_packet_finalize(&pkt);

    mesh_begin();
    size_t sent = mesh_send((const uint8_t *)&pkt, sizeof(pkt));
    Serial.printf("[tfn] mesh: wrote %u/%u bytes to companion\n",
                  (unsigned)sent, (unsigned)sizeof(pkt));

    if (sd && wifi_sync_due(g_boot_count)) {
        bool ts = false;
        wifi_sync_run(node_id(), &ts);
        if (ts) g_time_valid = 1;
    }

    if (cam_ok) cam_deinit();
}

void setup() {
    Serial.begin(115200);
    delay(200);
    run_cycle();
    power_sleep(TFN_CAPTURE_INTERVAL_S);
}

void loop() {
#if !TFN_DEEP_SLEEP
    // Debug/bench mode: power_sleep() returned after a delay; run again.
    run_cycle();
    power_sleep(TFN_CAPTURE_INTERVAL_S);
#endif
}
