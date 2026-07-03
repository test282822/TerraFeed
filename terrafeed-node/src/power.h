#pragma once
#include <stdint.h>

uint16_t power_batt_mv();          // 0 if TFN_VBAT_ENABLED == 0
void power_sleep(uint32_t seconds); // deep sleep (or delay loop in debug mode)
