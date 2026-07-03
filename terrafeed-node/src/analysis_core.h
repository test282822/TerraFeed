// TERRAFEED//NODE — pure analysis core. No Arduino/ESP-IDF deps; unit-tested on host.
//
// Input: RGB565 buffer as produced by esp32-camera's jpg2rgb565(), which emits
// big-endian (byte-swapped) 16-bit pixels. If your pipeline produces native
// little-endian RGB565, set swap=0.
//
// Heuristics, not ML — deliberately. Basis-point outputs (0..10000) so the
// packet stays integer-only. Thresholds tuned on synthetic data; expect to
// re-tune against real field captures (see README: honest-engineering table).
#pragma once
#include <stdint.h>
#include <stddef.h>

typedef struct {
    uint16_t green_bp;
    uint16_t brown_bp;
    uint16_t brightness_bp;
    uint16_t edge_bp;
} TfnAnalysis;

#define TFN_EDGE_THRESHOLD 40  // |dx|+|dy| on 8-bit luma

// luma_scratch must hold w*h bytes.
static inline void tfn_analyze_rgb565(const uint8_t *buf, int w, int h,
                                      int swap, uint8_t *luma_scratch,
                                      TfnAnalysis *out) {
    const long total = (long)w * h;
    long green = 0, brown = 0, luma_sum = 0;

    for (long i = 0; i < total; i++) {
        uint16_t px = swap
            ? (uint16_t)((buf[i * 2] << 8) | buf[i * 2 + 1])
            : (uint16_t)((buf[i * 2 + 1] << 8) | buf[i * 2]);
        uint8_t r = (uint8_t)(((px >> 11) & 0x1F) << 3);
        uint8_t g = (uint8_t)(((px >> 5)  & 0x3F) << 2);
        uint8_t b = (uint8_t)(( px        & 0x1F) << 3);

        uint8_t luma = (uint8_t)((r * 77 + g * 150 + b * 29) >> 8);
        luma_scratch[i] = luma;
        luma_sum += luma;

        // Vegetation heuristics. Green: G dominates both channels with margin.
        // Brown/senescent: warm, red-led (R > G > B), strong red-blue spread.
        if (g > r + 16 && g > b + 16 && g > 40)                 green++;
        else if (r > g && g > b && r > 60 && (r - b) > 40)      brown++;
    }

    long edges = 0;
    for (int y = 0; y < h - 1; y++) {
        const uint8_t *row  = luma_scratch + (long)y * w;
        const uint8_t *next = row + w;
        for (int x = 0; x < w - 1; x++) {
            int dx = row[x + 1] - row[x];
            int dy = next[x]    - row[x];
            if ((dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy) > TFN_EDGE_THRESHOLD) edges++;
        }
    }
    long edge_total = (long)(w - 1) * (h - 1);

    out->green_bp      = (uint16_t)((green * 10000L) / total);
    out->brown_bp      = (uint16_t)((brown * 10000L) / total);
    out->brightness_bp = (uint16_t)(((luma_sum / total) * 10000L) / 255);
    out->edge_bp       = (uint16_t)(edge_total ? (edges * 10000L) / edge_total : 0);
}
