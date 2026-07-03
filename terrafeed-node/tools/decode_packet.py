#!/usr/bin/env python3
"""Decode a TfnPacketV1 (34 bytes, little-endian) from hex or a binary file.

Usage:
  python3 decode_packet.py 4654010b...          # hex string
  python3 decode_packet.py --file packet.bin

Typical receive path: Meshtastic node -> MQTT (Pi broker) -> payload bytes
on the Serial portnum -> this decoder.
"""
import struct, sys

FMT = "<HBBIIHHHHHHhhhHH"
SIZE = struct.calcsize(FMT)
assert SIZE == 34

FLAGS = {0x01: "TIME_VALID", 0x02: "CAMERA_OK", 0x04: "SD_OK",
         0x08: "LOW_BATT", 0x10: "SOIL", 0x20: "TEMP"}

def crc16_ccitt(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return crc

def decode(raw: bytes) -> dict:
    if len(raw) != SIZE:
        raise ValueError(f"expected {SIZE} bytes, got {len(raw)}")
    (magic, version, flags, node_id, ts, boots, batt, green, brown,
     bright, edge, soil, temp, hum, reserved, crc) = struct.unpack(FMT, raw)
    if magic != 0x5446:
        raise ValueError(f"bad magic 0x{magic:04x}")
    if crc != crc16_ccitt(raw[:-2]):
        raise ValueError("CRC mismatch")
    return {
        "version": version,
        "flags": [n for bit, n in FLAGS.items() if flags & bit],
        "node_id": f"{node_id:08x}",
        "timestamp": ts,
        "boot_count": boots,
        "batt_mv": batt,
        "green_pct": green / 100,
        "brown_pct": brown / 100,
        "brightness_pct": bright / 100,
        "edge_pct": edge / 100,
        "soil_moisture": None if soil == 0x7FFF else soil,
        "temp_c": None if temp == 0x7FFF else temp / 100,
        "humidity": None if hum == 0x7FFF else hum / 100,
    }

if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--file":
        raw = open(sys.argv[2], "rb").read()
    elif len(sys.argv) >= 2:
        raw = bytes.fromhex(sys.argv[1])
    else:
        sys.exit(__doc__)
    for k, v in decode(raw).items():
        print(f"{k:16} {v}")
