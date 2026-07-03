# Companion Meshtastic node setup

The field node's ESP32-S3 runs this firmware; a second board runs **stock
Meshtastic** and owns the SX1262 + mesh protocol. They talk over a 3-wire UART.

Suggested companion: Seeed XIAO ESP32C3 + Wio-SX1262 (the GHOST//SCAN /
Build-Off stack). Any Meshtastic-supported board with a free UART works.

## Why a companion instead of driving the SX1262 natively

Reimplementing Meshtastic's radio layer (channel hashing, AES-CTR encryption,
header format, flood routing, regional duty-cycle logic) in custom firmware is
a large, drift-prone surface — and getting it subtly wrong makes your node a
bad citizen on shared meshes. The companion keeps mesh behavior on
battle-tested firmware you can update independently.

## Wiring

| TERRAFEED//NODE (XIAO S3 Sense) | Companion |
|---|---|
| GPIO43 / D6 (TX) | SerialModule RXD |
| GPIO44 / D7 (RX) | SerialModule TXD |
| GND | GND |

Power the companion from the same battery rail. Do NOT cross 5V.

## Meshtastic configuration (via CLI)

```
meshtastic --set serial.enabled true \
           --set serial.mode SIMPLE \
           --set serial.baud BAUD_38400 \
           --set serial.rxd <free GPIO on companion> \
           --set serial.txd <free GPIO on companion>
```

SIMPLE mode broadcasts raw serial bytes over the mesh on the Serial port
number; the inter-byte timeout chunks our single 34-byte burst into one mesh
packet.

**VERIFY ON HARDWARE (not confirmed in this repo's development):**
1. Binary bytes (including 0x00) pass through SIMPLE mode unmodified on your
   Meshtastic firmware version.
2. One `write()` burst maps to exactly one mesh packet.
3. Which GPIOs are actually free on the XIAO C3 once the Wio-SX1262 shield
   claims its SPI pins — check the shield schematic before assigning
   serial.rxd/txd.

If SIMPLE mode mangles binary on your firmware version, fallback options:
hex-encode the packet (68 ASCII bytes, still tiny), or move to the full
Meshtastic client API over serial with nanopb-encoded `ToRadio` protobufs on a
private portnum (64–511). The `mesh_serial` module is intentionally a two-
function interface so either swap is contained.

## Receiving

On your Pi MQTT broker node, subscribe to the mesh via `meshtasticd`/MQTT and
feed the payload bytes on the Serial portnum into `tools/decode_packet.py`.
The decoder validates magic + CRC, so line noise gets rejected cleanly.
