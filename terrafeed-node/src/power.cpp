#include "power.h"
#include "config.h"
#include <Arduino.h>

uint16_t power_batt_mv() {
#if TFN_VBAT_ENABLED
    // Average a few reads; analogReadMilliVolts applies the eFuse ADC calibration.
    uint32_t acc = 0;
    for (int i = 0; i < 8; i++) { acc += analogReadMilliVolts(TFN_VBAT_ADC_PIN); delay(2); }
    return (uint16_t)((acc / 8) * TFN_VBAT_DIVIDER);
#else
    return 0;
#endif
}

void power_sleep(uint32_t seconds) {
#if TFN_DEEP_SLEEP
    Serial.printf("[pwr] deep sleep %lus\n", (unsigned long)seconds);
    Serial.flush();
    esp_sleep_enable_timer_wakeup((uint64_t)seconds * 1000000ULL);
    esp_deep_sleep_start();
#else
    Serial.printf("[pwr] debug mode: delay %lus\n", (unsigned long)seconds);
    delay(seconds * 1000UL);
#endif
}
