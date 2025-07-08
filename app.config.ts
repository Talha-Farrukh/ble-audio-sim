import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "BLE Audio Sim",
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
    supportsTablet: true,
    bundleIdentifier: "com.dsavagezr.bleaudiosim",
    infoPlist: {
      NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to wearable devices for audio recording.",
      NSLocationWhenInUseUsageDescription: "This app needs location permission to scan for Bluetooth devices.",
      NSMicrophoneUsageDescription: "This app needs microphone access for audio recording."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_WIFI_STATE",
      "android.permission.ACCESS_NETWORK_STATE", 
      "android.permission.READ_PHONE_STATE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_ADVERTISE",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.RECORD_AUDIO"
    ],
    package: "com.dsavagezr.bleaudiosim"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-dev-client",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24
        }
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "your-project-id-here"
    }
  }
}); 