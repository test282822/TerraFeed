# TfnPacketV1 — wire format

34 bytes, little-endian, packed. Canonical definition: `include/tfn_packet.h`.
Python reference decoder: `tools/decode_packet.py` (struct format `<HBBIIHHHHHHhhhHH`).

| Offset | Size | Field | Notes |
|---|---|---|---|
| 0 | 2 | magic | `0x5446` ("TF"); wire bytes `46 54` |
| 2 | 1 | version | `1` |
| 3 | 1 | flags | see below |
| 4 | 4 | node_id | efuse MAC low 32 bits (or config override) |
| 8 | 4 | timestamp | unix seconds if `TIME_VALID`, else uptime seconds |
| 12 | 2 | boot_count | deep-sleep wake counter, wraps at 65535 |
| 14 | 2 | batt_mv | 0 = battery sensing disabled |
| 16 | 2 | green_bp | basis points (0–10000) of pixels classified green |
| 18 | 2 | brown_bp | pixels classified brown/senescent |
| 20 | 2 | brightness_bp | mean luminance, 0–10000 |
| 22 | 2 | edge_bp | pixels above gradient threshold (canopy texture proxy) |
| 24 | 2 | soil_moisture | int16, reserved; `0x7FFF` = absent |
| 26 | 2 | temp_c_x100 | int16, reserved; `0x7FFF` = absent |
| 28 | 2 | humidity_x100 | int16, reserved; `0x7FFF` = absent |
| 30 | 2 | reserved | must be 0 in v1 |
| 32 | 2 | crc | CRC16-CCITT (0x1021, init 0xFFFF) over bytes 0–31 |

## Flags

| Bit | Name | Meaning |
|---|---|---|
| 0x01 | TIME_VALID | timestamp is NTP-synced epoch |
| 0x02 | CAMERA_OK | capture succeeded this cycle |
| 0x04 | SD_OK | SD card mounted and writable |
| 0x08 | LOW_BATT | batt_mv < configured threshold |
| 0x10 | SOIL | soil_moisture populated (future hardware) |
| 0x20 | TEMP | temp/humidity populated (future hardware) |

## Versioning contract

- Never reorder or resize existing v1 fields.
- Additions = version bump + new struct. Receivers dispatch on `(magic, version)`.
- Receivers MUST verify CRC before trusting any field, and MUST tolerate
  unknown versions silently (log and drop).

## Why 34 bytes

Meshtastic's usable payload is roughly 230 bytes; staying tiny keeps airtime
low, plays nice with EU duty-cycle limits, and leaves headroom to batch
multiple readings per mesh packet in a future version.
