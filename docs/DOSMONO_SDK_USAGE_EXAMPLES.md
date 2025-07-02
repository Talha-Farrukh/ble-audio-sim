# Dosmono SDK Usage Examples

## Basic Setup and Initialization

```typescript
import DosmonoSDKService from './src/services/DosmonoSDK';

const dosmonoSDK = new DosmonoSDKService();

// Initialize SDK
const initializeSDK = async () => {
  try {
    const result = await dosmonoSDK.initialize(
      'your-access-key',
      'your-secret-key'
    );
    
    if (result.success) {
      console.log('✅ SDK initialized successfully');
      return true;
    } else {
      console.error('❌ Initialization failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ SDK initialization error:', error);
    return false;
  }
};
```

## Device Discovery

```typescript
const discoverDevices = async () => {
  // Check prerequisites
  const bluetoothEnabled = await dosmonoSDK.isBluetoothEnabled();
  const gpsEnabled = await dosmonoSDK.isGpsEnabled();
  
  if (!bluetoothEnabled) {
    console.log('Please enable Bluetooth');
    return;
  }
  
  if (!gpsEnabled) {
    console.log('Please enable GPS/Location services');
    return;
  }
  
  // Setup event listeners
  dosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
    console.log(`Found ${event.devices.length} devices:`);
    event.devices.forEach(device => {
      console.log(`- ${device.name} (${device.mac}) Signal: ${device.rssi}dBm`);
    });
  });
  
  dosmonoSDK.addEventListener('onBleSearchStart', () => {
    console.log('🔍 Scanning started...');
  });
  
  dosmonoSDK.addEventListener('onBleSearchStop', () => {
    console.log('⏹️ Scanning stopped');
  });
  
  // Start scanning (30 seconds, 3 cycles)
  await dosmonoSDK.startDeviceScan(30, 3);
};
```

## Device Connection

```typescript
const connectToDevice = async (deviceMac: string) => {
  try {
    // Setup connection event listeners
    dosmonoSDK.addEventListener('onBleConnectionSuccess', (event) => {
      console.log(`✅ Connected to device: ${event.mac}`);
    });
    
    dosmonoSDK.addEventListener('onBleConnectionFailed', () => {
      console.log('❌ Connection failed');
    });
    
    dosmonoSDK.addEventListener('onBleConnectionTimeout', () => {
      console.log('⏰ Connection timeout');
    });
    
    dosmonoSDK.addEventListener('onBleConnectionStatus', (event) => {
      console.log(`Connection status: ${event.mac} - ${event.isConnected ? 'Connected' : 'Disconnected'}`);
    });
    
    // Initiate connection
    const connected = await dosmonoSDK.connectToDevice(deviceMac);
    
    if (connected) {
      console.log('Connection request sent...');
    } else {
      console.log('Failed to send connection request');
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
};
```

## Device Commands

```typescript
const getDeviceInfo = async () => {
  try {
    // Get battery level
    const battery = await dosmonoSDK.getBatteryLevel();
    console.log(`🔋 Battery: ${battery}%`);
    
    // Get memory information
    const memory = await dosmonoSDK.getMemoryInfo();
    console.log(`💾 Memory: ${memory.remaining}/${memory.total}`);
    
    // Sync time with device
    const timeSynced = await dosmonoSDK.syncTime();
    if (timeSynced) {
      console.log('⏰ Time synchronized');
    }
    
    // Get device version (response via event)
    await dosmonoSDK.getDeviceVersion();
    
    // Activate device (if needed)
    const activated = await dosmonoSDK.activateDevice();
    if (activated) {
      console.log('✅ Device activated');
    }
    
  } catch (error) {
    console.error('Error getting device info:', error);
  }
};

// Listen for command responses
dosmonoSDK.addEventListener('onBleCommandReceived', (event) => {
  console.log(`📨 Command response: ${event.value} (${event.flags})`);
  
  switch (event.flags) {
    case 'VERSION':
      console.log(`📱 Device version: ${event.value}`);
      break;
    case 'SN_NUMBER':
      console.log(`🔢 Serial number: ${event.value}`);
      break;
    case 'RECORD_STATUS':
      console.log(`🎤 Recording status: ${event.value}`);
      break;
    default:
      console.log(`Other response: ${event.flags} = ${event.value}`);
  }
});
```

## File Management

```typescript
const manageFiles = async () => {
  try {
    // Setup file list listener
    dosmonoSDK.addEventListener('onBleFileList', (event) => {
      console.log(`📁 Files on device (${event.files.length}):`);
      event.files.forEach(file => {
        console.log(`- ${file}`);
      });
    });
    
    // Get file list from device
    await dosmonoSDK.getFileList();
    
    // Delete a specific file
    const deleteResult = await dosmonoSDK.deleteFile('recording_001.wav');
    if (deleteResult) {
      console.log('🗑️ File deleted successfully');
    }
    
    // Start file transfer
    const transferResult = await dosmonoSDK.startFileTransfer('recording_002.wav', 0);
    if (transferResult) {
      console.log('📥 File transfer started');
    }
    
  } catch (error) {
    console.error('File management error:', error);
  }
};
```

## Recording Control

```typescript
const controlRecording = async () => {
  try {
    // Start recording
    const recordingStarted = await dosmonoSDK.startRecording();
    if (recordingStarted) {
      console.log('🎤 Recording started');
    }
    
    // Wait some time or based on user input...
    
    // Stop recording
    const recordingStopped = await dosmonoSDK.stopRecording();
    if (recordingStopped) {
      console.log('⏹️ Recording stopped');
    }
    
    // Finish and save recording
    const recordingFinished = await dosmonoSDK.finishRecording();
    if (recordingFinished) {
      console.log('✅ Recording finished and saved');
    }
    
  } catch (error) {
    console.error('Recording control error:', error);
  }
};
```

## Complete React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert } from 'react-native';
import DosmonoSDKService from './src/services/DosmonoSDK';

const DosmonoDemo = () => {
  const [dosmonoSDK] = useState(() => new DosmonoSDKService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({
    battery: 0,
    memory: { total: '0GB', remaining: '0GB' }
  });

  useEffect(() => {
    setupEventListeners();
    return () => {
      dosmonoSDK.removeAllListeners();
    };
  }, []);

  const setupEventListeners = () => {
    dosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
      setDevices(event.devices);
    });

    dosmonoSDK.addEventListener('onBleConnectionSuccess', (event) => {
      setConnectedDevice(event.mac);
      Alert.alert('Success', `Connected to ${event.mac}`);
    });

    dosmonoSDK.addEventListener('onBleConnectionStatus', (event) => {
      if (!event.isConnected) {
        setConnectedDevice(null);
      }
    });

    dosmonoSDK.addEventListener('onBleCommandReceived', (event) => {
      console.log(`Command: ${event.flags} = ${event.value}`);
    });
  };

  const initializeSDK = async () => {
    try {
      const result = await dosmonoSDK.initialize(
        'your-access-key',
        'your-secret-key'
      );
      
      setIsInitialized(result.success);
      
      if (!result.success) {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize SDK');
    }
  };

  const startScanning = async () => {
    const bluetoothEnabled = await dosmonoSDK.isBluetoothEnabled();
    const gpsEnabled = await dosmonoSDK.isGpsEnabled();

    if (!bluetoothEnabled || !gpsEnabled) {
      Alert.alert('Error', 'Please enable Bluetooth and GPS');
      return;
    }

    await dosmonoSDK.startDeviceScan(30, 3);
  };

  const connectToDevice = async (deviceMac) => {
    await dosmonoSDK.connectToDevice(deviceMac);
  };

  const refreshDeviceInfo = async () => {
    if (!connectedDevice) return;

    try {
      const battery = await dosmonoSDK.getBatteryLevel();
      const memory = await dosmonoSDK.getMemoryInfo();
      
      setDeviceInfo({ battery, memory });
    } catch (error) {
      console.error('Error refreshing device info:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Dosmono SDK Demo</Text>
      
      {!isInitialized ? (
        <Button title="Initialize SDK" onPress={initializeSDK} />
      ) : (
        <>
          <Button title="Start Scanning" onPress={startScanning} />
          
          <Text style={{ marginTop: 20, marginBottom: 10 }}>Devices Found:</Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.mac}
            renderItem={({ item }) => (
              <View style={{ padding: 10, borderBottomWidth: 1 }}>
                <Text>{item.name} ({item.mac})</Text>
                <Text>Signal: {item.rssi}dBm</Text>
                <Button 
                  title="Connect" 
                  onPress={() => connectToDevice(item.mac)}
                />
              </View>
            )}
          />
          
          {connectedDevice && (
            <View style={{ marginTop: 20 }}>
              <Text>Connected to: {connectedDevice}</Text>
              <Text>Battery: {deviceInfo.battery}%</Text>
              <Text>Memory: {deviceInfo.memory.remaining}/{deviceInfo.memory.total}</Text>
              <Button title="Refresh Info" onPress={refreshDeviceInfo} />
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default DosmonoDemo;
```

## Error Handling Best Practices

```typescript
const safeSDKOperation = async (operation, operationName) => {
  try {
    // Ensure SDK is initialized
    const isInitialized = await dosmonoSDK.isSDKInitialized();
    if (!isInitialized) {
      throw new Error('SDK not initialized');
    }
    
    // Execute operation
    const result = await operation();
    console.log(`✅ ${operationName} successful:`, result);
    return result;
    
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error);
    
    // Show user-friendly error message
    Alert.alert(
      `${operationName} Failed`,
      'Please check your device connection and try again.'
    );
    
    return null;
  }
};

// Usage examples:
const battery = await safeSDKOperation(
  () => dosmonoSDK.getBatteryLevel(),
  'Get Battery Level'
);

const connected = await safeSDKOperation(
  () => dosmonoSDK.connectToDevice(deviceMac),
  'Connect to Device'
);
```

## Cleanup and Resource Management

```typescript
const cleanupSDK = async () => {
  try {
    // Remove all event listeners
    dosmonoSDK.removeAllListeners();
    
    // Release SDK resources
    await dosmonoSDK.releaseResources();
    
    console.log('✅ SDK resources cleaned up');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};

// Use in component unmount or app background
useEffect(() => {
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      cleanupSDK();
    }
  };

  AppState.addEventListener('change', handleAppStateChange);
  
  return () => {
    AppState.removeEventListener('change', handleAppStateChange);
    cleanupSDK();
  };
}, []);
``` 