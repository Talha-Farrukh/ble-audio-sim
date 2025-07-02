# Dosmono SDK Implementation Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Setup](#project-setup)
3. [Basic Usage Examples](#basic-usage-examples)
4. [Advanced Features](#advanced-features)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Testing Guide](#testing-guide)

## Quick Start

### 1. Initialize the SDK

```typescript
import DosmonoSDKService from './src/services/DosmonoSDK';

const dosmonoSDK = new DosmonoSDKService();

// Initialize with your credentials
const initResult = await dosmonoSDK.initialize(
  'your-access-key', 
  'your-secret-key'
);

if (initResult.success) {
  console.log('✅ SDK initialized successfully');
} else {
  console.error('❌ Initialization failed:', initResult.message);
}
```

### 2. Basic Device Discovery

```typescript
// Check prerequisites
const bluetoothEnabled = await dosmonoSDK.isBluetoothEnabled();
const gpsEnabled = await dosmonoSDK.isGpsEnabled();

if (!bluetoothEnabled || !gpsEnabled) {
  console.log('Please enable Bluetooth and GPS');
  return;
}

// Listen for discovered devices
dosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
  event.devices.forEach(device => {
    console.log(`Found: ${device.name} (${device.mac})`);
  });
});

// Start scanning
await dosmonoSDK.startDeviceScan(30, 3); // 30 seconds, 3 cycles
```

### 3. Connect and Control Device

```typescript
// Connect to a device
const connected = await dosmonoSDK.connectToDevice('AA:BB:CC:DD:EE:FF');

if (connected) {
  // Get device information
  const battery = await dosmonoSDK.getBatteryLevel();
  const memory = await dosmonoSDK.getMemoryInfo();
  
  console.log(`Battery: ${battery}%`);
  console.log(`Memory: ${memory.remaining}/${memory.total}`);
  
  // Sync time
  await dosmonoSDK.syncTime();
}
```

## Project Setup

### Prerequisites

1. **React Native Expo Project**
2. **Android SDK** (for native module compilation)
3. **Dosmono SDK AAR file** (placed in `android/app/libs/`)
4. **Valid Dosmono credentials** (access key and secret key)

### Required Permissions

Ensure these permissions are in your `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### Gradle Configuration

Your `android/app/build.gradle` should include:

```gradle
dependencies {
    implementation(name: 'sdk', ext: 'aar')
    implementation 'com.squareup.retrofit2:retrofit:2.5.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.5.0'
    implementation 'com.squareup.retrofit2:adapter-rxjava2:2.5.0'
    implementation 'io.reactivex.rxjava2:rxandroid:2.1.1'
    implementation 'com.github.tbruyelle:rxpermissions:0.10.2'
    implementation 'top.zibin:Luban:1.1.6'
    // Other dependencies...
}
```

## Basic Usage Examples

### Complete Device Discovery Workflow

```typescript
export const DeviceDiscoveryExample = () => {
  const [devices, setDevices] = useState<DosmonoDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Setup event listeners
    dosmonoSDK.addEventListener('onBleSearchStart', () => {
      setIsScanning(true);
      console.log('🔍 Scanning started');
    });

    dosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
      setDevices(event.devices);
      console.log(`📱 Found ${event.devices.length} devices`);
    });

    dosmonoSDK.addEventListener('onBleSearchStop', () => {
      setIsScanning(false);
      console.log('⏹️ Scanning stopped');
    });

    return () => {
      dosmonoSDK.removeAllListeners();
    };
  }, []);

  const startScanning = async () => {
    try {
      // Check prerequisites
      const [bluetoothEnabled, gpsEnabled] = await Promise.all([
        dosmonoSDK.isBluetoothEnabled(),
        dosmonoSDK.isGpsEnabled()
      ]);

      if (!bluetoothEnabled) {
        Alert.alert('Error', 'Please enable Bluetooth');
        return;
      }

      if (!gpsEnabled) {
        Alert.alert('Error', 'Please enable Location Services');
        return;
      }

      // Start scanning
      await dosmonoSDK.startDeviceScan(30, 3);
    } catch (error) {
      console.error('Scan error:', error);
    }
  };

  const stopScanning = async () => {
    await dosmonoSDK.stopDeviceScan();
  };

  return (
    <View>
      <Button 
        title={isScanning ? "Stop Scanning" : "Start Scanning"}
        onPress={isScanning ? stopScanning : startScanning}
      />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.mac}
        renderItem={({ item }) => (
          <DeviceListItem device={item} onConnect={connectToDevice} />
        )}
      />
    </View>
  );
};
```

### Device Connection Management

```typescript
export const DeviceConnectionExample = () => {
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<DosmonoConnectionStatus>();

  useEffect(() => {
    // Listen for connection events
    dosmonoSDK.addEventListener('onBleConnectionSuccess', (event) => {
      setConnectedDevice(event.mac);
      console.log(`✅ Connected to ${event.mac}`);
    });

    dosmonoSDK.addEventListener('onBleConnectionStatus', (event) => {
      if (!event.isConnected && connectedDevice === event.mac) {
        setConnectedDevice(null);
        console.log(`❌ Disconnected from ${event.mac}`);
      }
    });

    dosmonoSDK.addEventListener('onBleConnectionFailed', () => {
      console.log('❌ Connection failed');
      Alert.alert('Error', 'Failed to connect to device');
    });

    return () => {
      dosmonoSDK.removeAllListeners();
    };
  }, [connectedDevice]);

  const connectToDevice = async (deviceMac: string) => {
    try {
      const connected = await dosmonoSDK.connectToDevice(deviceMac);
      if (connected) {
        console.log('Connection initiated...');
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await dosmonoSDK.disconnectFromDevice(connectedDevice);
    }
  };

  const getConnectionStatus = async () => {
    const status = await dosmonoSDK.getConnectionStatus();
    setConnectionStatus(status);
  };

  return (
    <View>
      <Text>Connected Device: {connectedDevice || 'None'}</Text>
      <Button title="Get Status" onPress={getConnectionStatus} />
      {connectedDevice && (
        <Button title="Disconnect" onPress={disconnectDevice} />
      )}
    </View>
  );
};
```

### Device Information Retrieval

```typescript
export const DeviceInfoExample = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    battery: 0,
    memory: { total: '0GB', remaining: '0GB' },
    version: 'Unknown'
  });

  useEffect(() => {
    // Listen for command responses
    dosmonoSDK.addEventListener('onBleCommandReceived', (event) => {
      console.log(`Command response: ${event.value} (${event.flags})`);
      
      switch (event.flags) {
        case 'VERSION':
          setDeviceInfo(prev => ({ ...prev, version: event.value }));
          break;
        // Handle other command responses...
      }
    });

    return () => {
      dosmonoSDK.removeEventListener('onBleCommandReceived');
    };
  }, []);

  const refreshDeviceInfo = async () => {
    try {
      // Get battery level
      const battery = await dosmonoSDK.getBatteryLevel();
      
      // Get memory info
      const memory = await dosmonoSDK.getMemoryInfo();
      
      // Request version (response comes via event)
      await dosmonoSDK.getDeviceVersion();
      
      setDeviceInfo(prev => ({
        ...prev,
        battery,
        memory
      }));
    } catch (error) {
      console.error('Error getting device info:', error);
    }
  };

  return (
    <View>
      <Text>Battery: {deviceInfo.battery}%</Text>
      <Text>Memory: {deviceInfo.memory.remaining}/{deviceInfo.memory.total}</Text>
      <Text>Version: {deviceInfo.version}</Text>
      <Button title="Refresh Info" onPress={refreshDeviceInfo} />
    </View>
  );
};
```

## Advanced Features

### File Management

```typescript
export const FileManagementExample = () => {
  const [fileList, setFileList] = useState<string[]>([]);

  useEffect(() => {
    dosmonoSDK.addEventListener('onBleFileList', (event) => {
      setFileList(event.files);
    });

    return () => {
      dosmonoSDK.removeEventListener('onBleFileList');
    };
  }, []);

  const getFileList = async () => {
    await dosmonoSDK.getFileList();
  };

  const deleteFile = async (fileName: string) => {
    const deleted = await dosmonoSDK.deleteFile(fileName);
    if (deleted) {
      console.log(`File ${fileName} deleted`);
      await getFileList(); // Refresh list
    }
  };

  const transferFile = async (fileName: string) => {
    const started = await dosmonoSDK.startFileTransfer(fileName);
    if (started) {
      console.log(`Transfer started for ${fileName}`);
    }
  };

  return (
    <View>
      <Button title="Get File List" onPress={getFileList} />
      <FlatList
        data={fileList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row' }}>
            <Text>{item}</Text>
            <Button title="Download" onPress={() => transferFile(item)} />
            <Button title="Delete" onPress={() => deleteFile(item)} />
          </View>
        )}
      />
    </View>
  );
};
```

### Recording Control

```typescript
export const RecordingExample = () => {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const started = await dosmonoSDK.startRecording();
      if (started) {
        setIsRecording(true);
        console.log('🎤 Recording started');
      }
    } catch (error) {
      console.error('Recording start error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await dosmonoSDK.stopRecording();
      setIsRecording(false);
      console.log('⏹️ Recording stopped');
    } catch (error) {
      console.error('Recording stop error:', error);
    }
  };

  const finishRecording = async () => {
    try {
      await dosmonoSDK.finishRecording();
      setIsRecording(false);
      console.log('✅ Recording finished and saved');
    } catch (error) {
      console.error('Recording finish error:', error);
    }
  };

  return (
    <View>
      <Text>Recording Status: {isRecording ? 'Recording' : 'Stopped'}</Text>
      <Button 
        title="Start Recording" 
        onPress={startRecording}
        disabled={isRecording}
      />
      <Button 
        title="Stop Recording" 
        onPress={stopRecording}
        disabled={!isRecording}
      />
      <Button 
        title="Finish & Save" 
        onPress={finishRecording}
        disabled={!isRecording}
      />
    </View>
  );
};
```

## Best Practices

### 1. Proper Initialization

```typescript
// Always check initialization status before using SDK
const ensureSDKReady = async () => {
  const isInitialized = await dosmonoSDK.isSDKInitialized();
  
  if (!isInitialized) {
    const result = await dosmonoSDK.initialize(accessKey, secretKey);
    if (!result.success) {
      throw new Error(`SDK initialization failed: ${result.message}`);
    }
  }
  
  return true;
};
```

### 2. Event Listener Management

```typescript
// Use custom hook for event management
export const useDosmonoEvents = () => {
  useEffect(() => {
    // Setup listeners
    const listeners = {
      onBleDevicesFound: (event) => { /* handle */ },
      onBleConnectionStatus: (event) => { /* handle */ },
      // ... other listeners
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      dosmonoSDK.addEventListener(event, handler);
    });

    return () => {
      dosmonoSDK.removeAllListeners();
    };
  }, []);
};
```

### 3. Error Handling Pattern

```typescript
const safeSDKCall = async <T>(operation: () => Promise<T>): Promise<T | null> => {
  try {
    await ensureSDKReady();
    return await operation();
  } catch (error) {
    console.error('SDK operation failed:', error);
    
    // Show user-friendly error
    Alert.alert(
      'Operation Failed',
      'Please check your device connection and try again.'
    );
    
    return null;
  }
};

// Usage
const battery = await safeSDKCall(() => dosmonoSDK.getBatteryLevel());
```

### 4. Resource Cleanup

```typescript
// Always clean up resources when app is backgrounded or closed
useEffect(() => {
  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      await dosmonoSDK.releaseResources();
    }
  };

  AppState.addEventListener('change', handleAppStateChange);
  
  return () => {
    AppState.removeEventListener('change', handleAppStateChange);
    dosmonoSDK.releaseResources();
  };
}, []);
```

## Troubleshooting

### Common Issues

#### 1. "DosmonoSDKNative.startDeviceScan is not a function"

**Solution:** Ensure the native module is properly registered:
- Check `MainApplication.kt` includes `DosmonoSDKPackage()`
- Rebuild the project: `cd android && ./gradlew clean && cd .. && npx expo run:android`

#### 2. Device scanning fails

**Solutions:**
- Ensure Bluetooth is enabled: `await dosmonoSDK.isBluetoothEnabled()`
- Ensure GPS/Location is enabled: `await dosmonoSDK.isGpsEnabled()`
- Check location permissions are granted
- Try different scan duration/times parameters

#### 3. Connection timeouts

**Solutions:**
- Ensure device is in pairing mode
- Check device is within BLE range (< 10 meters)
- Verify correct MAC address format
- Try connecting after device discovery

#### 4. Command responses not received

**Solutions:**
- Ensure device is connected before sending commands
- Set up event listeners before sending commands
- Check device supports the requested command
- Verify command flag is correct

### Debug Mode

Enable detailed logging:

```typescript
// Add this to your app initialization
if (__DEV__) {
  // Enable verbose logging
  console.log('🔧 Debug mode enabled');
  
  // Log all SDK events
  Object.keys(dosmonoSDK.eventEmitter?.eventNames() || {}).forEach(event => {
    dosmonoSDK.addEventListener(event, (data) => {
      console.log(`📡 Event: ${event}`, data);
    });
  });
}
```

## Testing Guide

### Testing with Real Devices

1. **Setup Test Environment**
   ```bash
   # Ensure clean build
   cd android && ./gradlew clean
   cd .. && npx expo run:android
   ```

2. **Test Checklist**
   - [ ] SDK initialization with valid credentials
   - [ ] Bluetooth/GPS status checks
   - [ ] Device discovery and listing
   - [ ] Device connection/disconnection
   - [ ] Battery level retrieval
   - [ ] Memory information retrieval
   - [ ] Time synchronization
   - [ ] File list retrieval
   - [ ] Recording start/stop
   - [ ] File transfer

3. **Expected Behaviors**
   - Device should appear in scan results within 30 seconds
   - Connection should establish within 10 seconds
   - Commands should respond within 5 seconds
   - File transfers should show progress events

### Testing without Physical Device

For development without a physical Dosmono device, the SDK will:
- Return mock data for device commands
- Simulate connection events
- Log all operations for debugging

This allows you to develop and test the UI/UX before having the actual hardware.

### Performance Testing

Monitor these metrics during testing:
- Scan duration and device discovery rate
- Connection establishment time
- Command response time
- File transfer speed
- Battery usage during BLE operations

Use Android's Developer Options > Bluetooth HCI snoop log for detailed BLE debugging. 