// TERRAFEED//NODE — offline-first SD image queue.
//
// Layout on card:
//   /tfn/i00000042.jpg   image, monotonically increasing sequence number
//   /tfn/i00000042.mta   sidecar: "<epoch_or_uptime> <flags_hex>" one line
//   /tfn/state.txt       "next_seq last_synced_seq" persisted after every mutation
//
// Ring behavior: at most TFN_SD_MAX_IMAGES images kept; pushing a new image
// deletes seq (next - MAX) if present. If the ring overruns unsynced images,
// last_synced is advanced past them (data loss is logged — by design, the node
// never wedges on a full card).
//
// Same pattern as the ToiletCam firmware queue, generalized with a persisted
// sync cursor instead of move-on-upload.

#include "sd_queue.h"
#include "config.h"
#include <Arduino.h>
#include <SD.h>

static uint32_t s_next = 1;         // next sequence to assign
static uint32_t s_last_synced = 0;  // highest sequence confirmed uploaded
static bool s_ok = false;

static void img_path(char *out, size_t n, uint32_t seq, const char *ext) {
    snprintf(out, n, "/tfn/i%08lu.%s", (unsigned long)seq, ext);
}

static void save_state() {
    File f = SD.open("/tfn/state.txt", FILE_WRITE);
    if (!f) return;
    f.printf("%lu %lu\n", (unsigned long)s_next, (unsigned long)s_last_synced);
    f.close();
}

static void load_state() {
    File f = SD.open("/tfn/state.txt", FILE_READ);
    if (!f) return;
    unsigned long a = 1, b = 0;
    String line = f.readStringUntil('\n');
    f.close();
    if (sscanf(line.c_str(), "%lu %lu", &a, &b) == 2) {
        s_next = a;
        s_last_synced = b;
    }
}

bool sdq_begin() {
    if (!SD.begin(TFN_SD_CS)) {
        Serial.println("[sdq] SD.begin failed (no card / wiring / CS pin?)");
        return false;
    }
    if (!SD.exists("/tfn")) SD.mkdir("/tfn");
    load_state();
    s_ok = true;
    Serial.printf("[sdq] ready next=%lu synced=%lu\n",
                  (unsigned long)s_next, (unsigned long)s_last_synced);
    return true;
}

bool sdq_ok() { return s_ok; }

int32_t sdq_push(const uint8_t *jpeg, size_t len, uint32_t epoch, uint8_t flags) {
    if (!s_ok) return -1;
    uint32_t seq = s_next;
    char path[32];

    img_path(path, sizeof(path), seq, "jpg");
    File f = SD.open(path, FILE_WRITE);
    if (!f) { Serial.println("[sdq] open for write failed"); return -1; }
    size_t written = f.write(jpeg, len);
    f.close();
    if (written != len) {
        Serial.println("[sdq] short write — card full or failing");
        SD.remove(path);
        return -1;
    }

    img_path(path, sizeof(path), seq, "mta");
    File m = SD.open(path, FILE_WRITE);
    if (m) { m.printf("%lu %02x\n", (unsigned long)epoch, flags); m.close(); }

    s_next = seq + 1;

    // Enforce ring: drop the image that falls off the back.
    if (seq >= TFN_SD_MAX_IMAGES) {
        uint32_t victim = seq - TFN_SD_MAX_IMAGES + 1;
        img_path(path, sizeof(path), victim, "jpg");
        if (SD.exists(path)) {
            SD.remove(path);
            img_path(path, sizeof(path), victim, "mta");
            SD.remove(path);
            if (s_last_synced < victim) {
                Serial.printf("[sdq] ring overran unsynced seq %lu (dropped)\n",
                              (unsigned long)victim);
                s_last_synced = victim;
            }
        }
    }
    save_state();
    return (int32_t)seq;
}

bool sdq_next_unsynced(uint32_t *seq_out, uint32_t *epoch_out, uint8_t *flags_out) {
    if (!s_ok) return false;
    char path[32];
    while (s_last_synced + 1 < s_next) {
        uint32_t cand = s_last_synced + 1;
        img_path(path, sizeof(path), cand, "jpg");
        if (SD.exists(path)) {
            *seq_out = cand;
            *epoch_out = 0;
            *flags_out = 0;
            img_path(path, sizeof(path), cand, "mta");
            File m = SD.open(path, FILE_READ);
            if (m) {
                unsigned long e = 0; unsigned int fl = 0;
                String line = m.readStringUntil('\n');
                m.close();
                if (sscanf(line.c_str(), "%lu %x", &e, &fl) >= 1) {
                    *epoch_out = e; *flags_out = (uint8_t)fl;
                }
            }
            return true;
        }
        // Gap (manually deleted / ring victim): skip forward.
        s_last_synced = cand;
    }
    save_state();
    return false;
}

File sdq_open_image(uint32_t seq) {
    char path[32];
    img_path(path, sizeof(path), seq, "jpg");
    return SD.open(path, FILE_READ);
}

void sdq_mark_synced(uint32_t seq) {
    if (seq > s_last_synced) s_last_synced = seq;
    save_state();
}

uint32_t sdq_pending() {
    return (s_next > s_last_synced + 1) ? (s_next - s_last_synced - 1) : 0;
}
