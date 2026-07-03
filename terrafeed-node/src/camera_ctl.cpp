// OV2640 on Seeed XIAO ESP32S3 Sense. Pin map is Seeed's official definition
// for this board (known-good). Note PWDN is not wired on this board (-1):
// the camera cannot be hard powered-down from firmware — see docs/POWER_BUDGET.md.
#include "camera_ctl.h"
#include "config.h"
#include <Arduino.h>

#define CAM_PIN_PWDN  -1
#define CAM_PIN_RESET -1
#define CAM_PIN_XCLK  10
#define CAM_PIN_SIOD  40
#define CAM_PIN_SIOC  39
#define CAM_PIN_D7    48
#define CAM_PIN_D6    11
#define CAM_PIN_D5    12
#define CAM_PIN_D4    14
#define CAM_PIN_D3    16
#define CAM_PIN_D2    18
#define CAM_PIN_D1    17
#define CAM_PIN_D0    15
#define CAM_PIN_VSYNC 38
#define CAM_PIN_HREF  47
#define CAM_PIN_PCLK  13

bool cam_begin() {
    camera_config_t c = {};
    c.ledc_channel = LEDC_CHANNEL_0;
    c.ledc_timer   = LEDC_TIMER_0;
    c.pin_pwdn  = CAM_PIN_PWDN;   c.pin_reset = CAM_PIN_RESET;
    c.pin_xclk  = CAM_PIN_XCLK;
    c.pin_sccb_sda = CAM_PIN_SIOD; c.pin_sccb_scl = CAM_PIN_SIOC;
    c.pin_d7 = CAM_PIN_D7; c.pin_d6 = CAM_PIN_D6; c.pin_d5 = CAM_PIN_D5;
    c.pin_d4 = CAM_PIN_D4; c.pin_d3 = CAM_PIN_D3; c.pin_d2 = CAM_PIN_D2;
    c.pin_d1 = CAM_PIN_D1; c.pin_d0 = CAM_PIN_D0;
    c.pin_vsync = CAM_PIN_VSYNC; c.pin_href = CAM_PIN_HREF; c.pin_pclk = CAM_PIN_PCLK;
    c.xclk_freq_hz = 20000000;
    c.pixel_format = PIXFORMAT_JPEG;
    c.frame_size   = FRAMESIZE_UXGA;      // 1600x1200 stored image
    c.jpeg_quality = TFN_JPEG_QUALITY;
    c.fb_count     = 1;
    c.fb_location  = CAMERA_FB_IN_PSRAM;
    c.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;

    esp_err_t err = esp_camera_init(&c);
    if (err != ESP_OK) {
        Serial.printf("[cam] init failed: 0x%x\n", err);
        return false;
    }
    return true;
}

camera_fb_t *cam_capture() {
    // OV2640 auto-exposure/white-balance needs a few frames to settle,
    // especially waking cold into daylight. Discard warm-up frames.
    for (int i = 0; i < TFN_WARMUP_FRAMES; i++) {
        camera_fb_t *fb = esp_camera_fb_get();
        if (fb) esp_camera_fb_return(fb);
        delay(120);
    }
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) Serial.println("[cam] capture failed");
    return fb;
}

void cam_deinit() { esp_camera_deinit(); }
