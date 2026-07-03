# Power budget — solar + 18650 operation

Status: **estimates from datasheets and community measurements, not yet
measured on this build.** Treat every number here as a hypothesis until you
put a current meter (Nordic PPK2, Otii, or a µCurrent) on your actual node.

## The one number that matters most

**Deep sleep current with the Sense expansion board attached.** The bare XIAO
ESP32S3 deep-sleeps in the tens-of-µA range. But the Sense board's OV2640 has
no PWDN line wired (pin is -1 in the camera config), so the camera and its
rail can't be hard powered down from firmware. Community reports for
S3-Sense-with-camera deep sleep range from a few hundred µA to a few mA
depending on board revision, SD card, and whether the camera was left in a
clean state. Everything below models a pessimistic 1 mA sleep floor and an
optimistic 100 µA one.

Mitigations if measured sleep is bad:
1. Call `esp_camera_deinit()` before sleep (firmware already does).
2. High-side P-FET on the Sense board 3V3 rail, gated by a GPIO — cuts camera
   and SD entirely at the cost of a small hardware mod.
3. Some SD cards draw 100–500 µA idle; try a different card before blaming
   the ESP32.

## Per-cycle energy model (hourly capture, defaults)

| Phase | Current (est.) | Duration | Charge |
|---|---|---|---|
| Boot + camera init + warm-up | ~120 mA | ~3 s | 0.10 mAh |
| Capture + SD write + analysis | ~150 mA | ~5 s | 0.21 mAh |
| Mesh serial TX | ~40 mA | <1 s | ~0 |
| WiFi sync (amortized: 1 in 6 wakes, ~45 s @ ~180 mA avg w/ TX bursts) | — | — | 0.38 mAh |
| **Active total per hour** | | | **~0.7 mAh** |
| Sleep @ 1 mA (pessimistic) | | ~1 h | 1.0 mAh |
| Sleep @ 0.1 mA (optimistic) | | ~1 h | 0.1 mAh |

**Hourly total: ~0.8–1.7 mAh → ~20–41 mAh/day.**

## Battery-only runtime (3000 mAh 18650, ~2500 mAh usable)

- Pessimistic sleep: **~60 days**
- Optimistic sleep: **~120 days**

The companion Meshtastic node is NOT in this budget. A XIAO C3 + SX1262
running Meshtastic with power-save enabled adds meaningfully to the load
(mesh nodes listen). Budget it separately or give it its own cell; if the
mesh only needs your hourly beacon, configure aggressive power-save /
`is_router = false` on the companion.

## Solar sizing (Florida Space Coast)

~4–5 peak sun hours/day most of the year. Even a 1 W / 5 V panel at 50%
real-world harvest delivers ~350–450 mAh/day into the battery — an order of
magnitude above consumption, so panel size is driven by worst-case cloudy
stretches, not averages.

Charging path notes:
- The XIAO's onboard charger is convenient but its charge current is low
  (~100 mA class) and it expects a clean 5 V input — do not feed a raw panel
  straight in; panel open-circuit voltage swings will exceed the input rating.
- Recommended: panel → small buck/solar charge board (TP4056-with-protection
  class or better, or a proper MPPT like the CN3791 for larger panels) →
  18650 → XIAO BAT pads.
- Fuse or PTC between battery and load for anything left unattended in a field.

## Battery sensing

The XIAO ESP32S3 has no built-in VBAT ADC route. `batt_mv` reports 0 until you
add a divider (e.g. 220k/100k) from BAT+ to A0/GPIO1 and set
`TFN_VBAT_ENABLED 1`. High-value resistors keep divider drain ~12 µA; add a
100 nF cap at the ADC pin for stable reads.
