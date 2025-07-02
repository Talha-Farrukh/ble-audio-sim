const withDosmonoSDK = require('./expo-plugins/dosmono-sdk-plugin');

module.exports = {
  expo: {
    name: "ble-audio-sim",
    slug: "ble-audio-sim",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.dsavagezr.bleaudiosim",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_ADVERTISE",
        "android.permission.INTERNET",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.VIBRATE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        // Dosmono SDK additional permissions
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.READ_PHONE_STATE",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.RECORD_AUDIO"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 23,
            targetSdkVersion: 34,
            usesCleartextTraffic: true
          }
        }
      ],
      // Add Dosmono SDK plugin
      withDosmonoSDK
    ],
    extra: {
      eas: {
        projectId: "your-project-id-here"
      }
    },
    hooks: {
      postPublish: []
    }
  }
}; 