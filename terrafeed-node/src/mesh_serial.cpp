// Link to companion Meshtastic node over UART.
//
// Companion config (Meshtastic SerialModule, SIMPLE mode) — see docs/COMPANION_NODE.md.
// SIMPLE mode passes raw bytes from serial straight onto the mesh as a single
// packet (chunked by an inter-byte timeout on the Meshtastic side), so we write
// the whole 34-byte packet in one burst and flush.
//
// HONESTY FLAG: this exact XIAO-S3 -> XIAO-C3 SerialModule SIMPLE binary path
// has not been verified on hardware in this session. The pattern is widely used,
// but confirm (a) binary bytes pass through unmodified, (b) one write burst maps
// to one mesh packet on your firmware version. See README table.
#include "mesh_serial.h"
#include "config.h"
#include <Arduino.h>

static HardwareSerial MeshUart(1);

void mesh_begin() {
#if TFN_MESH_ENABLED
    MeshUart.begin(TFN_MESH_BAUD, SERIAL_8N1, TFN_MESH_UART_RX, TFN_MESH_UART_TX);
    delay(50);
#endif
}

size_t mesh_send(const uint8_t *data, size_t len) {
#if TFN_MESH_ENABLED
    size_t n = MeshUart.write(data, len);
    MeshUart.flush();
    // Give the companion's serial timeout a beat before we power down,
    // so it doesn't glue our packet to a subsequent debug byte.
    delay(150);
    return n;
#else
    (void)data; (void)len;
    return 0;
#endif
}
