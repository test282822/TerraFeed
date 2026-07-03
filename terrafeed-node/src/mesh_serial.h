#pragma once
#include <stdint.h>
#include <stddef.h>

void mesh_begin();
// Writes raw packet bytes to the companion Meshtastic node's SerialModule
// (SIMPLE mode). The companion broadcasts them over the mesh. Returns bytes written.
size_t mesh_send(const uint8_t *data, size_t len);
