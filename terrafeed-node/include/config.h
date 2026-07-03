// TERRAFEED//NODE — build-time configuration.
// Copy to config_local.h and add to .gitignore if you keep credentials here,
// or override via -D build flags in platformio.ini.
#pragma once

// ---------- Identity ----------
#define TFN_NODE_ID_FROM_MAC  1           // 1 = derive node_id from efuse MAC low 32 bits
#define TFN_NODE_ID_OVERRIDE  0x00000000  // used when FROM_MAC == 0

// ---------- Capture ----------
#define TFN_CAPTURE_INTERVAL_S  3600      // default hourly
#define TFN_WARMUP_FRAMES       3         // discarded frames so OV2640 AE/AWB settles
#define TFN_JPEG_QUALITY        12        // 0(best)..63

// ---------- Power ----------
#define TFN_DEEP_SLEEP   1                // 0 = stay awake and loop (bench/debug mode)
#define TFN_LOW_BATT_MV  3300

// Battery sensing: the XIAO ESP32S3 has NO built-in VBAT ADC path.
// Requires a hardware mod: divider from BAT+ to A0 (GPIO1), e.g. 220k top / 100k bottom.
// Leave TFN_VBAT_ENABLED = 0 until the divider is installed; batt_mv reports 0.
#define TFN_VBAT_ENABLED  0
#define TFN_VBAT_ADC_PIN  1               // A0
#define TFN_VBAT_DIVIDER  3.2f            // (Rtop + Rbot) / Rbot

// ---------- Mesh serial (to companion Meshtastic node) ----------
#define TFN_MESH_ENABLED  1
#define TFN_MESH_UART_TX  43              // XIAO S3 D6 -> companion RXD
#define TFN_MESH_UART_RX  44              // XIAO S3 D7 <- companion TXD
#define TFN_MESH_BAUD     38400           // must match serial.baud on the companion

// ---------- SD queue ----------
#define TFN_SD_CS          21             // XIAO ESP32S3 Sense expansion board SD CS
#define TFN_SD_MAX_IMAGES  500            // ring buffer size; oldest deleted first

// ---------- WiFi sync ----------
#define TFN_WIFI_ENABLED            1
#define TFN_WIFI_SYNC_EVERY_N_WAKES 6     // attempt sync every N capture cycles
#define TFN_WIFI_SSID               "changeme"
#define TFN_WIFI_PASS               "changeme"
#define TFN_WIFI_CONNECT_TIMEOUT_MS 15000
#define TFN_MAX_UPLOADS_PER_SESSION 12
#define TFN_NTP_SERVER              "pool.ntp.org"

// Backend contract: see docs/BACKEND_ENDPOINT.md
#define TFN_BACKEND_URL   "https://terrafeed.example.com/api/v1/nodes"
#define TFN_BACKEND_TOKEN "changeme"
