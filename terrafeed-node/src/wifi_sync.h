#pragma once
#include <stdint.h>

// True when this wake cycle should attempt a WiFi sync.
bool wifi_sync_due(uint16_t boot_count);
// Connect, NTP-sync clock, upload queued images to the terrafeed backend.
// Returns number of images uploaded. Radios are fully powered off on exit.
int wifi_sync_run(uint32_t node_id, bool *time_synced_out);
