#pragma once
#include "esp_camera.h"

bool cam_begin();
// Grabs a full-res JPEG frame after AE/AWB warm-up. Caller MUST return it
// with esp_camera_fb_return(). NULL on failure.
camera_fb_t *cam_capture();
void cam_deinit();
