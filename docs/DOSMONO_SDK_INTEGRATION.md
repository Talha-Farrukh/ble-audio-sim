# Dosmono SDK Integration Guide

## Overview

This guide covers the complete integration of the Dosmono SDK into your Expo prebuild React Native project. The Dosmono SDK provides Bluetooth Low Energy (BLE) functionality for smart pen audio recording devices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [SDK Components](#sdk-components)
3. [Android Integration](#android-integration)
4. [React Native Bridge](#react-native-bridge)
5. [TypeScript Interface](#typescript-interface)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

## Prerequisites

- **Expo CLI** 49+ with prebuild support
- **React Native** 0.72+
- **Android SDK** API Level 23+ (Android 6.0)
- **Java/Kotlin** development environment
- **Node.js** 16+

### Required Permissions

The SDK requires the following Android permissions:

- `BLUETOOTH_SCAN` (Android 12+)
- `BLUETOOTH_CONNECT` (Android 12+)
- `BLUETOOTH_ADVERTISE` (Android 12+)
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `RECORD_AUDIO`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `READ_PHONE_STATE`
- `FOREGROUND_SERVICE`

## SDK Components

### Files Structure

```
your-project/
├── android/app/
│   ├── libs/
│   │   └── sdk.aar                          # Dosmono SDK AAR file
│   ├── src/main/
│   │   ├── AndroidManifest.xml              # Updated with permissions
│   │   ├── java/com/yourpackage/
│   │   │   ├── DosmonoModule.kt             # React Native bridge
│   │   │   ├── DosmonoSDKPackage.kt         # Package registration
│   │   │   └── MainApplication.kt           # Updated with package
│   │   └── res/xml/
│   │       └── file_paths.xml               # FileProvider configuration
│   └── build.gradle                         # Updated with dependencies
├── src/services/
│   └── DosmonoSDK.ts                        # TypeScript wrapper
├── components/
│   └── DosmonoDemo.tsx                      # Example component
└── docs/
    └── DOSMONO_SDK_INTEGRATION.md           # This documentation
```

## Android Integration

### Step 1: Copy SDK Files

1. Copy the SDK AAR file to your Android project:
   ```bash
   cp SDK/SDKTest/app/libs/sdk.aar android/app/libs/
   ```

### Step 2: Update Android Build Configuration

Update `android/app/build.gradle`:

```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "org.jetbrains.kotlin.kapt"  // Add this line
apply plugin: "com.facebook.react"

android {
    defaultConfig {
        minSdkVersion Math.max(rootProject.ext.minSdkVersion, 23)
        multiDexEnabled true
        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }
    
    packagingOptions {
        // Dosmono SDK packaging options
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/io.netty.versions.properties'
        exclude 'META-INF/INDEX.LIST'
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE.txt'
        exclude 'project.properties'
        exclude 'META-INF/speech_release.kotlin_module'
        exclude 'META-INF/translate_release.kotlin_module'
    }
}

repositories {
    flatDir {
        dirs 'libs'
    }
}

dependencies {
    // Dosmono SDK AAR file
    implementation(name: 'sdk', ext: 'aar')
    
    // SDK dependencies
    implementation 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.10'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.4'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.multidex:multidex:2.0.1'
    
    // Additional dependencies...
}
```

### Step 3: Update AndroidManifest.xml

Add required permissions and services:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Existing permissions -->
    
    <!-- Dosmono SDK permissions -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    
    <!-- Bluetooth features -->
    <uses-feature
        android:name="android.hardware.bluetooth_le"
        android:required="false" />
    
    <application>
        <!-- Existing activities -->
        
        <!-- Dosmono SDK Bluetooth service -->
        <service
            android:name="com.dosmono.recorder.service.BleService"
            android:enabled="true"
            android:exported="false">
            <intent-filter android:priority="1000">
                <action android:name="com.dosmono.BleService" />
            </intent-filter>
        </service>
        
        <!-- File provider -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileProvider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

### Step 4: Register Native Module

Update `MainApplication.kt`:

```kotlin
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages
    packages.add(DosmonoSDKPackage()) // Add this line
    return packages
}
```

## React Native Bridge

The bridge consists of three main files:

### DosmonoModule.kt
Main native module that interfaces with the SDK:

```kotlin
@ReactModule(name = DosmonoModule.NAME)
class DosmonoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "DosmonoSDK"
    }
    
    @ReactMethod
    fun initialize(accessKey: String, secretKey: String, promise: Promise) {
        // SDK initialization logic
    }
    
    // Additional methods...
}
```

### DosmonoSDKPackage.kt
Package registration:

```kotlin
class DosmonoSDKPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(DosmonoModule(reactContext))
    }
}
```

## TypeScript Interface

### DosmonoSDK.ts
Complete TypeScript wrapper with type safety:

```typescript
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';

export interface DosmonoDevice {
  name: string;
  mac: string;
  rssi: number;
  uuid: string;
}

export enum DosmonoFlags {
  ELECTRICITY = 'ELECTRICITY',
  MEMORY = 'MEMORY',
  FILE_LIST = 'FILE_LIST',
  // ... other flags
}

class DosmonoSDKService {
  async initialize(accessKey: string, secretKey: string): Promise<DosmonoInitResult> {
    // Implementation
  }
  
  async startDeviceScan(duration?: number, times?: number): Promise<boolean> {
    // Implementation
  }
  
  // ... other methods
}

export const DosmonoSDK = new DosmonoSDKService();
```

## Usage Examples

### Basic Initialization

```typescript
import DosmonoSDK from '../src/services/DosmonoSDK';

const initializeSDK = async () => {
  try {
    // Request permissions first
    const permissionsGranted = await DosmonoSDK.requestPermissions();
    if (!permissionsGranted) {
      throw new Error('Required permissions not granted');
    }
    
    // Initialize SDK
    const result = await DosmonoSDK.initialize(
      'com.dosmono.lianying.sdk',
      '473a4acaad6923b14f4d60bb0e6ecdcd8e9e2f76154505d91e5a05aba410ae96'
    );
    
    if (result.success) {
      console.log('SDK initialized successfully');
    } else {
      console.error('SDK initialization failed:', result.message);
    }
  } catch (error) {
    console.error('Error initializing SDK:', error);
  }
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
  
  DosmonoSDK.addEventListener('onBleSearchStart', () => {
    console.log('Scan started');
    setIsScanning(true);
  });
  
  DosmonoSDK.addEventListener('onBleSearchStop', () => {
    console.log('Scan stopped');
    setIsScanning(false);
  });
  
  // Start scanning
  await DosmonoSDK.startDeviceScan(10000, 3); // 10 seconds, 3 times
};
```

### Device Connection

```typescript
const connectToDevice = async (device: DosmonoDevice) => {
  try {
    // Setup connection event listeners
    DosmonoSDK.addEventListener('onBleConnectionSuccess', (event) => {
      console.log('Connected to:', event.mac);
      setConnectedDevice(event.mac);
    });
    
    DosmonoSDK.addEventListener('onBleConnectionFailed', () => {
      console.log('Connection failed');
    });
    
    // Connect to device
    await DosmonoSDK.connectToDevice(device.mac);
  } catch (error) {
    console.error('Error connecting to device:', error);
  }
};
```

### Recording Management

```typescript
const startRecording = async () => {
  try {
    // Setup recording event listeners
    DosmonoSDK.addEventListener('onRecordingFilePath', (event) => {
      console.log('Recording file:', event.fileName, 'at:', event.path);
    });
    
    DosmonoSDK.addEventListener('onRecordingError', (event) => {
      console.error('Recording error:', event.errorCode);
    });
    
    // Start recording
    const success = await DosmonoSDK.startRecording();
    if (success) {
      setIsRecording(true);
      console.log('Recording started');
    }
  } catch (error) {
    console.error('Error starting recording:', error);
  }
};

const stopRecording = async () => {
  try {
    const success = await DosmonoSDK.stopRecording();
    if (success) {
      setIsRecording(false);
      console.log('Recording stopped');
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
  }
};
```

## API Reference

### Core Methods

#### `initialize(accessKey: string, secretKey: string): Promise<DosmonoInitResult>`
Initializes the SDK with authentication credentials.

#### `requestPermissions(): Promise<boolean>`
Requests all required Android permissions.

#### `startDeviceScan(duration?: number, times?: number): Promise<boolean>`
Starts scanning for BLE devices.

#### `connectToDevice(macAddress: string): Promise<boolean>`
Connects to a specific device by MAC address.

#### `sendCommand(value: string, flags: DosmonoFlags): Promise<boolean>`
Sends a command to the connected device.

### Device Management

#### `getBatteryLevel(): Promise<number>`
Gets the current battery level of the connected device.

#### `getMemoryInfo(): Promise<DosmonoMemoryInfo>`
Gets memory information from the device.

#### `syncTime(): Promise<boolean>`
Synchronizes time with the device.

### Recording Functions

#### `startRecording(audioStoragePath?: string, bleStoragePath?: string): Promise<boolean>`
Starts audio recording on the device.

#### `stopRecording(): Promise<boolean>`
Stops the current recording.

#### `getFileList(): Promise<boolean>`
Retrieves the list of files from the device.

### Event Listeners

#### Device Scanning Events
- `onBleSearchStart`: Scan started
- `onBleDevicesFound`: Devices discovered
- `onBleSearchStop`: Scan completed

#### Connection Events
- `onBleConnectionSuccess`: Device connected
- `onBleConnectionFailed`: Connection failed
- `onBleConnectionTimeout`: Connection timeout

#### Recording Events
- `onRecordingFilePath`: Recording file path
- `onRecordingError`: Recording error
- `onRecordingTransferProgress`: File transfer progress

## Troubleshooting

### Common Issues

#### 1. SDK Initialization Fails
- **Cause**: Invalid credentials or missing permissions
- **Solution**: Verify access key and secret key, ensure all permissions are granted

#### 2. Device Scanning Not Working
- **Cause**: Bluetooth or GPS disabled, missing permissions
- **Solution**: Enable Bluetooth and GPS, request location permissions

#### 3. Connection Timeouts
- **Cause**: Device out of range, interference
- **Solution**: Move closer to device, retry connection

#### 4. Build Errors
- **Cause**: Missing dependencies or incorrect configuration
- **Solution**: Verify all dependencies are included, check build.gradle configuration

### Debug Tips

1. **Enable SDK Logging**:
   ```typescript
   // The SDK automatically enables logging in development
   console.log('SDK events will appear in logs');
   ```

2. **Check Permissions**:
   ```typescript
   const checkPermissions = async () => {
     const granted = await DosmonoSDK.requestPermissions();
     console.log('Permissions granted:', granted);
   };
   ```

3. **Monitor Connection Status**:
   ```typescript
   const checkConnection = async () => {
     const status = await DosmonoSDK.getConnectionStatus();
     console.log('Connection status:', status);
   };
   ```

## Advanced Configuration

### Custom Storage Paths

```typescript
const customPaths = {
  audioPath: '/storage/emulated/0/MyApp/audio/',
  blePath: '/storage/emulated/0/MyApp/ble/'
};

await DosmonoSDK.startRecording(customPaths.audioPath, customPaths.blePath);
```

### Event Management

```typescript
class SDKManager {
  private eventListeners: Map<string, any> = new Map();
  
  setupListeners() {
    // Setup all event listeners
    this.addEventListener('onBleDevicesFound', this.handleDevicesFound);
  }
  
  cleanup() {
    // Remove all listeners
    DosmonoSDK.removeAllListeners();
  }
}
```

### Error Handling

```typescript
const robustOperation = async () => {
  try {
    await DosmonoSDK.someOperation();
  } catch (error) {
    console.error('Operation failed:', error);
    
    // Attempt recovery
    await DosmonoSDK.releaseResources();
    await this.reinitialize();
  }
};
```

## Security Considerations

1. **Credentials Management**: Store SDK credentials securely
2. **Permissions**: Request only necessary permissions
3. **Data Handling**: Encrypt sensitive recording data
4. **Network Security**: Use secure connections for data transfer

## Performance Optimization

1. **Memory Management**: Release resources when not needed
2. **Event Listeners**: Remove unused listeners
3. **Scanning Optimization**: Use appropriate scan duration and intervals
4. **Background Processing**: Handle recording in background service

## Platform Compatibility

- **Android**: Full support (API 23+)
- **iOS**: Future implementation planned
- **Expo**: Requires prebuild (not compatible with Expo Go)

## Version History

- **v1.0.0**: Initial Android integration
- **Future**: iOS support, additional features

## Support

For issues and questions:
1. Check this documentation
2. Review console logs and debug output
3. Verify SDK credentials and permissions
4. Contact Dosmono support team

---

This integration guide provides a complete implementation of the Dosmono SDK for BLE audio recording devices in React Native applications. 