// Host-side unit tests for the pure logic: packet layout, CRC, analysis core.
// Build:  g++ -std=c++17 -Wall -Wextra -I../../include -I../../src -o test_core test_core.cpp
#include <cassert>
#include <cstdio>
#include <cstring>
#include <vector>
#include "tfn_packet.h"
#include "analysis_core.h"

static void put_px(std::vector<uint8_t> &buf, long i, uint8_t r, uint8_t g, uint8_t b) {
    uint16_t px = (uint16_t)(((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3));
    buf[i * 2]     = (uint8_t)(px >> 8);   // big-endian, matching jpg2rgb565
    buf[i * 2 + 1] = (uint8_t)(px & 0xFF);
}

int main() {
    // --- packet layout & CRC ---
    static_assert(sizeof(TfnPacketV1) == 34, "packet size");
    assert(crc16_ccitt((const uint8_t *)"123456789", 9) == 0x29B1);  // known-answer

    TfnPacketV1 p;
    tfn_packet_init(&p);
    p.node_id = 0xDEADBEEF;
    p.timestamp = 1780000000;
    p.green_bp = 6100;
    tfn_packet_finalize(&p);
    assert(tfn_packet_verify(&p));
    ((uint8_t *)&p)[9] ^= 0x01;            // corrupt one byte
    assert(!tfn_packet_verify(&p));

    // --- analysis: healthy field (mostly green, some brown soil, flat) ---
    const int W = 200, H = 150;
    std::vector<uint8_t> img((size_t)W * H * 2), luma((size_t)W * H);
    for (long i = 0; i < (long)W * H; i++) {
        if (i % 10 < 7)      put_px(img, i, 40, 160, 40);    // crop canopy
        else if (i % 10 < 9) put_px(img, i, 130, 90, 40);    // soil
        else                 put_px(img, i, 235, 235, 235);  // bright specular/sky gaps
    }
    TfnAnalysis a;
    tfn_analyze_rgb565(img.data(), W, H, 1, luma.data(), &a);
    printf("healthy: green=%u brown=%u bright=%u edge=%u\n",
           a.green_bp, a.brown_bp, a.brightness_bp, a.edge_bp);
    assert(a.green_bp > 6000 && a.green_bp < 8000);
    assert(a.brown_bp > 1000 && a.brown_bp < 3000);
    assert(a.edge_bp > 100);  // high-contrast stripes create texture

    // --- analysis: dead/dry field (brown dominant) ---
    for (long i = 0; i < (long)W * H; i++) put_px(img, i, 140, 95, 45);
    tfn_analyze_rgb565(img.data(), W, H, 1, luma.data(), &a);
    printf("dry:     green=%u brown=%u bright=%u edge=%u\n",
           a.green_bp, a.brown_bp, a.brightness_bp, a.edge_bp);
    assert(a.green_bp == 0);
    assert(a.brown_bp > 9900);
    assert(a.edge_bp == 0);  // uniform image, no texture

    // --- byte-order sanity: same image, swap=0 with LE bytes ---
    std::vector<uint8_t> img_le((size_t)W * H * 2);
    for (long i = 0; i < (long)W * H; i++) {
        img_le[i * 2]     = img[i * 2 + 1];
        img_le[i * 2 + 1] = img[i * 2];
    }
    TfnAnalysis a2;
    tfn_analyze_rgb565(img_le.data(), W, H, 0, luma.data(), &a2);
    assert(memcmp(&a, &a2, sizeof(a)) == 0);

    printf("all host tests passed\n");
    return 0;
}
