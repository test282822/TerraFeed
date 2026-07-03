// TERRAFEED//NODE — wire packet v1
// Host-compatible: no Arduino/ESP-IDF dependencies. Compiles on desktop for tests.
//
// Wire format: little-endian, packed, 34 bytes total.
// CRC16-CCITT (poly 0x1021, init 0xFFFF) over bytes [0 .. sizeof-3].
//
// Versioning rules for contributors:
//   - NEVER reorder or resize existing fields.
//   - New fields require a version bump and a new struct (TfnPacketV2).
//   - Receivers dispatch on (magic, version) before touching anything else.

#pragma once
#include <stdint.h>
#include <stddef.h>
#include "crc16.h"

#define TFN_PACKET_MAGIC   0x5446u  // "TF" little-endian on the wire: 0x46 0x54
#define TFN_PACKET_VERSION 1u

// flags bitfield
#define TFN_F_TIME_VALID 0x01u  // timestamp is unix epoch (NTP-synced); else seconds since boot
#define TFN_F_CAMERA_OK  0x02u
#define TFN_F_SD_OK      0x04u
#define TFN_F_LOW_BATT   0x08u
#define TFN_F_SOIL       0x10u  // soil_moisture field populated (reserved for v1 hardware)
#define TFN_F_TEMP       0x20u  // temp/humidity fields populated (reserved for v1 hardware)

#define TFN_SENSOR_ABSENT ((int16_t)0x7FFF)

#pragma pack(push, 1)
typedef struct {
    uint16_t magic;          // TFN_PACKET_MAGIC
    uint8_t  version;        // TFN_PACKET_VERSION
    uint8_t  flags;          // TFN_F_*
    uint32_t node_id;        // derived from efuse MAC (low 32 bits) or config override
    uint32_t timestamp;      // unix seconds if TIME_VALID, else uptime seconds
    uint16_t boot_count;     // deep-sleep wake counter (RTC memory), wraps
    uint16_t batt_mv;        // 0 = sensing disabled
    uint16_t green_bp;       // basis points 0..10000: fraction of pixels classified green
    uint16_t brown_bp;       // fraction classified brown/senescent
    uint16_t brightness_bp;  // mean luminance scaled 0..10000
    uint16_t edge_bp;        // fraction of pixels above gradient threshold (canopy texture)
    int16_t  soil_moisture;  // reserved; TFN_SENSOR_ABSENT if not fitted
    int16_t  temp_c_x100;    // reserved; TFN_SENSOR_ABSENT if not fitted
    int16_t  humidity_x100;  // reserved; TFN_SENSOR_ABSENT if not fitted
    uint16_t reserved;       // must be 0 in v1
    uint16_t crc;            // CRC16-CCITT over preceding 32 bytes
} TfnPacketV1;
#pragma pack(pop)

#ifdef __cplusplus
static_assert(sizeof(TfnPacketV1) == 34, "TfnPacketV1 must be exactly 34 bytes");
#else
_Static_assert(sizeof(TfnPacketV1) == 34, "TfnPacketV1 must be exactly 34 bytes");
#endif

static inline void tfn_packet_init(TfnPacketV1 *p) {
    for (size_t i = 0; i < sizeof(*p); i++) ((uint8_t *)p)[i] = 0;
    p->magic         = TFN_PACKET_MAGIC;
    p->version       = TFN_PACKET_VERSION;
    p->soil_moisture = TFN_SENSOR_ABSENT;
    p->temp_c_x100   = TFN_SENSOR_ABSENT;
    p->humidity_x100 = TFN_SENSOR_ABSENT;
}

static inline void tfn_packet_finalize(TfnPacketV1 *p) {
    p->crc = crc16_ccitt((const uint8_t *)p, sizeof(*p) - sizeof(p->crc));
}

static inline int tfn_packet_verify(const TfnPacketV1 *p) {
    if (p->magic != TFN_PACKET_MAGIC) return 0;
    if (p->version != TFN_PACKET_VERSION) return 0;
    return p->crc == crc16_ccitt((const uint8_t *)p, sizeof(*p) - sizeof(p->crc));
}
