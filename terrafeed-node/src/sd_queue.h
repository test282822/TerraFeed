#pragma once
#include <stdint.h>
#include <stddef.h>
#include <SD.h>

bool sdq_begin();
bool sdq_ok();
// Store a JPEG + metadata sidecar. Returns assigned sequence, or -1 on failure.
int32_t sdq_push(const uint8_t *jpeg, size_t len, uint32_t epoch, uint8_t flags);
// Iterate the oldest not-yet-uploaded image. Returns false when queue is drained.
bool sdq_next_unsynced(uint32_t *seq_out, uint32_t *epoch_out, uint8_t *flags_out);
File sdq_open_image(uint32_t seq);
void sdq_mark_synced(uint32_t seq);
uint32_t sdq_pending();
