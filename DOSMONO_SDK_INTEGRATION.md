# Dosmono SDK Integration Guide

## Overview

This guide covers the complete integration of the Dosmono SDK into your Expo prebuild React Native project. The Dosmono SDK provides Bluetooth Low Energy (BLE) functionality for smart pen audio recording devices.

## Prerequisites

- **Expo CLI** 49+ with prebuild support
- **React Native** 0.72+
- **Android SDK** API Level 23+ (Android 6.0)
- **Java/Kotlin** development environment
- **Node.js** 16+

## Integration Steps Completed

### 1. Android Native Module
✅ **Created**: `android/app/src/main/java/com/dsavagezr/bleaudiosim/DosmonoModule.kt`
- React Native bridge module
- Placeholder implementations for all SDK methods
- Event handling setup

✅ **Created**: `android/app/src/main/java/com/dsavagezr/bleaudiosim/DosmonoSDKPackage.kt`
- Package registration for React Native

✅ **Updated**: `android/app/src/main/java/com/dsavagezr/bleaudiosim/MainApplication.kt`
- Registered DosmonoSDKPackage

### 2. Android Build Configuration
✅ **Updated**: `android/app/build.gradle`
- Added Kotlin kapt plugin
- Configured minimum SDK version (23)
- Added multiDex support
- Added NDK ABI filters
- Added packaging options for SDK
- Added flatDir repository for AAR files
- Added all required dependencies

### 3. Android Permissions and Services
✅ **Updated**: `android/app/src/main/AndroidManifest.xml`
- Added all required permissions
- Added Bluetooth features
- Added BLE foreground service configuration
- Added FileProvider configuration

✅ **Created**: `android/app/src/main/res/xml/file_paths.xml`
- FileProvider paths configuration

### 4. TypeScript Interface
✅ **Created**: `src/services/DosmonoSDK.ts`
- Complete TypeScript wrapper
- Type-safe interfaces
- Permission handling
- Event management
- Error handling
- All SDK methods implemented

### 5. Demo Component
✅ **Created**: `components/DosmonoDemo.tsx`
- Example React component
- Shows SDK initialization
- Device scanning demo
- Activity logging

## Next Steps Required

### 1. Copy SDK AAR File
You need to manually copy the SDK AAR file:

```bash
# Create libs directory
mkdir -p android/app/libs

# Copy the SDK AAR file
cp SDK/SDKTest/app/libs/sdk.aar android/app/libs/
```

### 2. Enable SDK Implementation
Once the AAR file is copied, update `android/app/build.gradle`:

```gradle
dependencies {
    // Uncomment this line after copying AAR file
    implementation(name: 'sdk', ext: 'aar')
    
    // ... other dependencies remain unchanged
}
```

### 3. Update Native Module
After copying the AAR file, update `DosmonoModule.kt` to import and use the actual SDK:

```kotlin
// Uncomment these imports after AAR is available
import com.dosmono.sdk.Config
import com.dosmono.sdk.Dosmono
import com.dosmono.sdk.ble.BleFactory
import com.dosmono.sdk.ble.Flags
// ... other SDK imports

// Then replace placeholder implementations with actual SDK calls
```

## Usage Examples

### Basic Setup

```typescript
import DosmonoSDK from '../src/services/DosmonoSDK';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeSDK = async () => {
    try {
      // Request permissions
      const permissionsGranted = await DosmonoSDK.requestPermissions();
      if (!permissionsGranted) {
        Alert.alert('Permissions Required', 'Please grant all permissions');
        return;
      }

      // Initialize SDK
      const result = await DosmonoSDK.initialize(
        'com.dosmono.lianying.sdk',
        '473a4acaad6923b14f4d60bb0e6ecdcd8e9e2f76154505d91e5a05aba410ae96'
      );

      if (result.success) {
        setIsInitialized(true);
        console.log('SDK initialized successfully');
      } else {
        console.error('SDK initialization failed:', result.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    // Your app components
    <DosmonoDemo onLog={(message) => console.log(message)} />
  );
};
```

### Device Scanning

```typescript
const scanForDevices = async () => {
  // Setup event listeners
  DosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
    console.log('Found devices:', event.devices);
    setDevices(event.devices);
  });

  // Start scanning
  await DosmonoSDK.startDeviceScan(10000, 3); // 10 seconds, 3 times
};
```

### Device Connection and Control

```typescript
const connectAndControl = async (device) => {
  // Connect to device
  await DosmonoSDK.connectToDevice(device.mac);

  // Get battery level
  await DosmonoSDK.getBatteryLevel();

  // Start recording
  await DosmonoSDK.startRecording();

  // Sync time
  await DosmonoSDK.syncTime();
};
```

## API Reference

### Core Methods

- `initialize(accessKey: string, secretKey: string): Promise<DosmonoInitResult>`
- `requestPermissions(): Promise<boolean>`
- `startDeviceScan(duration?: number, times?: number): Promise<boolean>`
- `connectToDevice(macAddress: string): Promise<boolean>`
- `disconnectFromDevice(macAddress: string): Promise<boolean>`

### Device Commands

- `getBatteryLevel(): Promise<number>`
- `getMemoryInfo(): Promise<DosmonoMemoryInfo>`
- `getFileList(): Promise<boolean>`
- `syncTime(): Promise<boolean>`
- `activateDevice(): Promise<boolean>`

### Recording Functions

- `startRecording(audioStoragePath?: string, bleStoragePath?: string): Promise<boolean>`
- `stopRecording(): Promise<boolean>`
- `finishRecording(): Promise<boolean>`

### Event Types

- `onBleSearchStart`, `onBleDevicesFound`, `onBleSearchStop`
- `onBleConnectionSuccess`, `onBleConnectionFailed`, `onBleConnectionTimeout`
- `onRecordingFilePath`, `onRecordingError`, `onRecordingTransferProgress`

## Build and Test

### 1. Prebuild the Project

```bash
npx expo prebuild --platform android
```

### 2. Build for Android

```bash
cd android
./gradlew assembleDebug
```

### 3. Test on Device

```bash
npx expo run:android
```

## Required Permissions

The SDK requires these Android permissions:

- `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE` (Android 12+)
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `RECORD_AUDIO`
- `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- `READ_PHONE_STATE`
- `FOREGROUND_SERVICE`

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are added to `build.gradle`
2. **Permission Denied**: Call `requestPermissions()` before SDK operations
3. **Connection Failures**: Check Bluetooth and GPS are enabled
4. **AAR Not Found**: Ensure `sdk.aar` is copied to `android/app/libs/`

### Debug Tips

1. Check Android logs: `adb logcat | grep Dosmono`
2. Verify permissions in device settings
3. Test with actual BLE device in range
4. Monitor network connectivity for authentication

## Security Notes

- Store SDK credentials securely
- Request only necessary permissions
- Handle recording data with appropriate privacy measures
- Use secure connections for data transmission

## Platform Support

- **Android**: ✅ Full support (API 23+)
- **iOS**: 🔄 Future implementation planned
- **Expo Go**: ❌ Not supported (requires prebuild)

## Complete File Structure

```
your-project/
├── android/app/
│   ├── libs/
│   │   └── sdk.aar                          # ⚠️ COPY THIS FILE
│   ├── src/main/
│   │   ├── AndroidManifest.xml              # ✅ Updated
│   │   ├── java/com/dsavagezr/bleaudiosim/
│   │   │   ├── DosmonoModule.kt             # ✅ Created
│   │   │   ├── DosmonoSDKPackage.kt         # ✅ Created
│   │   │   └── MainApplication.kt           # ✅ Updated
│   │   └── res/xml/
│   │       └── file_paths.xml               # ✅ Created
│   └── build.gradle                         # ✅ Updated
├── src/services/
│   └── DosmonoSDK.ts                        # ✅ Created
├── components/
│   └── DosmonoDemo.tsx                      # ✅ Created
└── DOSMONO_SDK_INTEGRATION.md               # ✅ This file
```

## Status Summary

✅ **Completed**: 
- Android native module bridge
- Build configuration
- Permissions setup
- TypeScript interface
- Demo component
- Documentation

⚠️ **Manual Steps Required**:
1. Copy `SDK/SDKTest/app/libs/sdk.aar` to `android/app/libs/`
2. Uncomment AAR dependency in `build.gradle`
3. Update native module with actual SDK imports
4. Test with physical device and BLE hardware

The integration framework is complete and ready for the SDK AAR file! 