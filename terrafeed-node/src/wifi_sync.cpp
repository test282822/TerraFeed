// WiFi sync: opportunistic bulk upload of queued JPEGs to the terrafeed backend,
// plus NTP so packet timestamps become real epochs. Contract in docs/BACKEND_ENDPOINT.md.
//
// Design choices:
//  - Raw image/jpeg body + metadata in headers (no multipart) — trivial to
//    stream from SD with bounded RAM, trivial to parse in FastAPI.
//  - Hard caps on connect time and uploads per session so a bad link can't
//    burn the battery. The queue simply resumes next session.
#include "wifi_sync.h"
#include "sd_queue.h"
#include "config.h"
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

bool wifi_sync_due(uint16_t boot_count) {
#if TFN_WIFI_ENABLED
    return (boot_count % TFN_WIFI_SYNC_EVERY_N_WAKES) == 0;
#else
    (void)boot_count;
    return false;
#endif
}

static bool ntp_sync() {
    configTime(0, 0, TFN_NTP_SERVER);
    struct tm t;
    if (getLocalTime(&t, 8000)) {
        Serial.println("[wifi] NTP synced");
        return true;
    }
    Serial.println("[wifi] NTP timed out");
    return false;
}

int wifi_sync_run(uint32_t node_id, bool *time_synced_out) {
    *time_synced_out = false;
#if !TFN_WIFI_ENABLED
    (void)node_id;
    return 0;
#else
    WiFi.mode(WIFI_STA);
    WiFi.begin(TFN_WIFI_SSID, TFN_WIFI_PASS);
    uint32_t t0 = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - t0 > TFN_WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println("[wifi] connect timeout — will retry next window");
            WiFi.disconnect(true);
            WiFi.mode(WIFI_OFF);
            return 0;
        }
        delay(200);
    }
    Serial.printf("[wifi] connected, rssi=%d\n", WiFi.RSSI());

    *time_synced_out = ntp_sync();

    int uploaded = 0;
    uint32_t seq, epoch; uint8_t flags;
    while (uploaded < TFN_MAX_UPLOADS_PER_SESSION &&
           sdq_next_unsynced(&seq, &epoch, &flags)) {
        File img = sdq_open_image(seq);
        if (!img) { sdq_mark_synced(seq); continue; }  // vanished; skip

        char url[192];
        snprintf(url, sizeof(url), "%s/%08lx/images",
                 TFN_BACKEND_URL, (unsigned long)node_id);

        HTTPClient http;
        http.begin(url);
        http.setTimeout(20000);
        http.addHeader("Authorization", "Bearer " TFN_BACKEND_TOKEN);
        http.addHeader("Content-Type", "image/jpeg");
        char hv[24];
        snprintf(hv, sizeof(hv), "%lu", (unsigned long)seq);
        http.addHeader("X-TFN-Seq", hv);
        snprintf(hv, sizeof(hv), "%lu", (unsigned long)epoch);
        http.addHeader("X-TFN-Captured-At", hv);
        snprintf(hv, sizeof(hv), "%02x", flags);
        http.addHeader("X-TFN-Flags", hv);

        int code = http.sendRequest("POST", &img, img.size());
        img.close();
        http.end();

        if (code == 200 || code == 201) {
            sdq_mark_synced(seq);
            uploaded++;
            Serial.printf("[wifi] uploaded seq %lu\n", (unsigned long)seq);
        } else {
            Serial.printf("[wifi] upload seq %lu failed (%d) — stopping session\n",
                          (unsigned long)seq, code);
            break;  // don't hammer a broken backend on battery
        }
    }

    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    Serial.printf("[wifi] session done: %d uploaded, %lu pending\n",
                  uploaded, (unsigned long)sdq_pending());
    return uploaded;
#endif
}
