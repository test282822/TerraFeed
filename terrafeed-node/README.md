# TERRAFEED//NODE

Open-source "ground truth" field sensor firmware for agriculture and
food-security monitoring. A solar-powered camera node that does lightweight
computer vision **on-device** and reports over a **Meshtastic LoRa mesh** —
no images over LoRa, ever.

Companion project to [terrafeed](https://github.com/test282822) (global food
security data platform). This repo is the hardware edge: where satellite and
API data meet a camera physically pointed at a crop row.

## How it works

```
 ┌─────────────────────────────── field node ───────────────────────────────┐
 │                                                                          │
 │  OV2640 ──► JPEG (UXGA) ──► SD ring buffer (offline-first)               │
 │                │                     │                                   │
 │                ▼ 1/8-scale decode    ▼ every Nth wake, WiFi in range     │
 │  on-device CV: green/brown ratio,    HTTPS POST ──► terrafeed backend    │
 │  brightness, edge density            (full-res JPEGs, NTP time sync)     │
 │                │                                                         │
 │                ▼                                                         │
 │  34-byte TfnPacketV1 ──UART──► companion Meshtastic node ──► LoRa mesh   │
 └──────────────────────────────────────────────────────────────────────────┘
```

One packet per hour is ~34 bytes of airtime. The mesh carries crop-health
telemetry in near-real-time; full imagery syncs opportunistically when the
node sees WiFi. If it never sees WiFi, the SD ring buffer holds the most
recent ~500 captures for physical retrieval.

## Hardware

| Part | Role |
|---|---|
| Seeed XIAO ESP32S3 **Sense** | main MCU: camera, CV, SD, WiFi |
| Any Meshtastic board with free UART (e.g. XIAO ESP32C3 + Wio-SX1262) | companion mesh node |
| 18650 + small solar panel + charge board | power (see `docs/POWER_BUDGET.md`) |

Wiring and companion configuration: `docs/COMPANION_NODE.md`.

## Quickstart

```bash
git clone https://github.com/test282822/terrafeed-node
cd terrafeed-node
# edit include/config.h  (WiFi creds, backend URL/token, intervals)
pio run -t upload
pio device monitor
```

Bench tip: set `TFN_DEEP_SLEEP 0` and `TFN_CAPTURE_INTERVAL_S 30` in
`config.h` to loop continuously with serial logs instead of sleeping.

Host-side unit tests (no hardware needed):

```bash
cd test/host
g++ -std=c++17 -Wall -Wextra -I../../include -I../../src -o test_core test_core.cpp
./test_core
```

## Repo layout

```
include/tfn_packet.h    wire packet (versioned, host-testable)
include/crc16.h         CRC16-CCITT
include/config.h        all tunables
src/main.cpp            wake cycle state machine
src/camera_ctl.*        OV2640 init + AE warm-up capture
src/analysis_core.h     pure CV heuristics (host-testable)
src/sd_queue.*          SD ring buffer + persisted sync cursor
src/mesh_serial.*       UART link to companion Meshtastic node
src/wifi_sync.*         NTP + queued JPEG upload
src/power.*             battery ADC + deep sleep
docs/                   packet format, companion setup, backend API, power budget
tools/decode_packet.py  reference decoder (mesh/MQTT receive side)
test/host/              desktop unit tests for packet + analysis logic
```

## Design decisions (and why)

- **No images over LoRa.** Airtime is a shared commons. 34 bytes/hour respects
  duty-cycle limits everywhere and scales to many nodes per channel.
- **Companion Meshtastic node instead of driving the SX1262 natively.**
  Meshtastic's radio layer (encryption, routing, regional duty cycle) is not
  a weekend reimplementation, and getting it wrong pollutes shared meshes.
  Stock firmware on a second MCU is the boring, correct choice.
  `src/mesh_serial.*` is a two-function interface so a future native or
  client-API implementation swaps in cleanly.
- **Heuristic CV, not ML, for v1.** Green/brown ratio + brightness + edge
  density answer "is this crop row alive and how dense is the canopy" well
  enough to trend over time, run in milliseconds, and need zero model
  maintenance. TinyML is a v2 conversation once real field data exists to
  train on.
- **Offline-first SD queue.** The node never depends on connectivity to do
  its job. Same pattern proven in prior field-camera firmware.
- **Reserved sensor fields in v1 packets.** Soil moisture and temp/RH land in
  the existing 34-byte format without a version bump.

## Honest engineering: what's verified vs. what isn't

| Item | Status |
|---|---|
| Packet layout, CRC, encode/decode round-trip (C ↔ Python) | ✅ unit-tested on host in this repo |
| Analysis heuristics on synthetic images | ✅ unit-tested on host; ⚠️ thresholds NOT yet tuned on real field captures |
| XIAO ESP32S3 Sense camera pin map, SD CS=21 | ✅ Seeed's official values |
| Firmware compiled against espressif32 toolchain | ⚠️ NOT compiled in this environment — expect minor include/API fixups on first `pio run` |
| `jpg2rgb565` scaled decode path | ⚠️ documented esp32-camera API, untested here on hardware |
| SerialModule SIMPLE binary passthrough (one burst = one mesh packet) | ⚠️ MUST verify on your Meshtastic version — see `docs/COMPANION_NODE.md` for fallbacks |
| Deep sleep current with Sense board attached | ⚠️ known community pain point; MEASURE — see `docs/POWER_BUDGET.md` |
| Battery voltage sensing | ⚠️ requires hardware mod (divider to A0); disabled by default |
| Power budget numbers | ⚠️ datasheet estimates, not measurements |

If you flash this on hardware, opening an issue (or PR) with measured sleep
current and SerialModule behavior on your firmware version is the single most
valuable contribution you can make right now.

## Contributing

PRs welcome. Ground rules:

- Packet changes follow the versioning contract in `docs/PACKET_FORMAT.md`.
- Pure logic (packet, CV) stays Arduino-free so host tests keep working;
  run `test/host/test_core` before submitting.
- New claims about hardware behavior go in the honest-engineering table with
  the right status marker. "Works on my bench" with a firmware version noted
  beats silence.
- Keep the mesh footprint sacred: nothing that increases per-cycle airtime
  lands without discussion.

## License

MIT — see [LICENSE](LICENSE). © 2026 Hansen Enterprises LLC.
