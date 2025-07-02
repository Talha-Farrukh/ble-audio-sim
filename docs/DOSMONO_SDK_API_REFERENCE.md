# Dosmono SDK API Reference

## Overview

The Dosmono SDK provides comprehensive Bluetooth Low Energy (BLE) functionality for connecting to and controlling Dosmono wearable devices. This includes device discovery, connection management, data retrieval, recording controls, and file management.

## Table of Contents

1. [Authentication](#authentication)
2. [Device Management](#device-management)
3. [Connection Management](#connection-management)
4. [Device Commands](#device-commands)
5. [Recording Features](#recording-features)
6. [File Management](#file-management)
7. [Status & Monitoring](#status--monitoring)
8. [Event Listening](#event-listening)
9. [Error Handling](#error-handling)

## Authentication

### `initialize(accessKey: string, secretKey: string)`

Initializes the Dosmono SDK with authentication credentials.

**Parameters:**
- `accessKey` (string): Your Dosmono access key
- `secretKey` (string): Your Dosmono secret key

**Returns:** `Promise<DosmonoInitResult>`

**Example:**
```typescript
const result = await dosmonoSDK.initialize('your-access-key', 'your-secret-key');
if (result.success) {
  console.log('SDK initialized successfully');
} else {
  console.error('Initialization failed:', result.message);
}
```

### `isSDKInitialized()`

Checks if the SDK has been properly initialized.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isInitialized = await dosmonoSDK.isSDKInitialized();
console.log('SDK initialized:', isInitialized);
```

## Device Management

### `startDeviceScan(duration?: number, times?: number)`

Starts scanning for nearby Dosmono devices.

**Parameters:**
- `duration` (optional): Duration of each scan in seconds (default: 30)
- `times` (optional): Number of scan cycles (default: 3)

**Returns:** `Promise<boolean>`

**Example:**
```typescript
// Scan for 60 seconds, 2 cycles
await dosmonoSDK.startDeviceScan(60, 2);

// Use default settings
await dosmonoSDK.startDeviceScan();
```

### `stopDeviceScan()`

Stops the current device scanning process.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.stopDeviceScan();
```

### `isBluetoothEnabled()`

Checks if Bluetooth is enabled on the device.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isEnabled = await dosmonoSDK.isBluetoothEnabled();
if (!isEnabled) {
  console.log('Please enable Bluetooth');
}
```

### `isGpsEnabled()`

Checks if GPS/Location services are enabled (required for BLE scanning).

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isGpsEnabled = await dosmonoSDK.isGpsEnabled();
if (!isGpsEnabled) {
  console.log('Please enable location services');
}
```

## Connection Management

### `connectToDevice(macAddress: string)`

Connects to a specific Dosmono device using its MAC address.

**Parameters:**
- `macAddress` (string): The MAC address of the target device

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const connected = await dosmonoSDK.connectToDevice('AA:BB:CC:DD:EE:FF');
if (connected) {
  console.log('Device connected successfully');
}
```

### `disconnectFromDevice(macAddress: string)`

Disconnects from a specific device.

**Parameters:**
- `macAddress` (string): The MAC address of the device to disconnect

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.disconnectFromDevice('AA:BB:CC:DD:EE:FF');
```

### `getConnectionStatus()`

Retrieves the current connection status and connected device information.

**Returns:** `Promise<DosmonoConnectionStatus>`

**Example:**
```typescript
const status = await dosmonoSDK.getConnectionStatus();
console.log('Connected:', status.isConnected);
console.log('Device:', status.connectedDevice);
```

## Device Commands

### `getBatteryLevel()`

Retrieves the battery level of the connected device.

**Returns:** `Promise<number>` (0-100)

**Example:**
```typescript
const batteryLevel = await dosmonoSDK.getBatteryLevel();
console.log(`Battery: ${batteryLevel}%`);
```

### `getMemoryInfo()`

Gets memory usage information from the connected device.

**Returns:** `Promise<DosmonoMemoryInfo>`

**Example:**
```typescript
const memoryInfo = await dosmonoSDK.getMemoryInfo();
console.log(`Total: ${memoryInfo.total}, Available: ${memoryInfo.remaining}`);
```

### `syncTime()`

Synchronizes the device time with the current system time.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const synced = await dosmonoSDK.syncTime();
if (synced) {
  console.log('Time synchronized successfully');
}
```

### `getDeviceVersion()`

Retrieves the firmware version of the connected device.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.getDeviceVersion();
// Listen for 'onBleCommandReceived' event for the version response
```

### `activateDevice()`

Activates the device (required for first-time use).

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const activated = await dosmonoSDK.activateDevice();
if (activated) {
  console.log('Device activated successfully');
}
```

## Recording Features

### `startRecording(audioStoragePath?: string, bleStoragePath?: string)`

Starts recording on the connected device.

**Parameters:**
- `audioStoragePath` (optional): Path for storing audio files
- `bleStoragePath` (optional): Path for storing BLE-specific files

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.startRecording('/path/to/audio', '/path/to/ble');
```

### `stopRecording()`

Stops the current recording.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.stopRecording();
```

### `finishRecording()`

Finishes and saves the current recording.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.finishRecording();
```

## File Management

### `getFileList()`

Retrieves the list of files stored on the device.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
await dosmonoSDK.getFileList();
// Listen for 'onBleFileList' event for the file list
```

### `deleteFile(fileName: string)`

Deletes a specific file from the device.

**Parameters:**
- `fileName` (string): Name of the file to delete

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const deleted = await dosmonoSDK.deleteFile('recording_001.wav');
if (deleted) {
  console.log('File deleted successfully');
}
```

### `startFileTransfer(fileName: string, startPoint?: number)`

Starts transferring a file from the device.

**Parameters:**
- `fileName` (string): Name of the file to transfer
- `startPoint` (optional): Byte position to start from (for resume functionality)

**Returns:** `Promise<boolean>`

**Example:**
```typescript
// Start new transfer
await dosmonoSDK.startFileTransfer('recording_001.wav');

// Resume from specific position
await dosmonoSDK.startFileTransfer('recording_001.wav', 1024);
```

## Event Listening

The SDK provides event-driven communication for real-time updates.

### Available Events

- `onBleSearchStart`: Scanning started
- `onBleDevicesFound`: Devices discovered
- `onBleSearchStop`: Scanning stopped
- `onBleSearchCancel`: Scanning cancelled
- `onBleConnectionStatus`: Connection status changed
- `onBleConnectionSuccess`: Device connected
- `onBleConnectionFailed`: Connection failed
- `onBleConnectionTimeout`: Connection timeout
- `onBleCommandReceived`: Command response received
- `onBleFileList`: File list received

### Event Listener Example

```typescript
// Listen for device discoveries
dosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
  console.log('Found devices:', event.devices);
  event.devices.forEach(device => {
    console.log(`Device: ${device.name} (${device.mac}) - Signal: ${device.rssi}dBm`);
  });
});

// Listen for connection status
dosmonoSDK.addEventListener('onBleConnectionStatus', (event) => {
  console.log(`Device ${event.mac} ${event.isConnected ? 'connected' : 'disconnected'}`);
});

// Listen for command responses
dosmonoSDK.addEventListener('onBleCommandReceived', (event) => {
  console.log(`Command response: ${event.value} (${event.flags})`);
});
```

## Error Handling

All SDK methods return promises and should be wrapped in try-catch blocks:

```typescript
try {
  const result = await dosmonoSDK.initialize(accessKey, secretKey);
  if (!result.success) {
    console.error('Initialization failed:', result.message);
    return;
  }
  
  const connected = await dosmonoSDK.connectToDevice(deviceMac);
  if (!connected) {
    console.error('Failed to connect to device');
    return;
  }
  
  const batteryLevel = await dosmonoSDK.getBatteryLevel();
  console.log(`Battery: ${batteryLevel}%`);
  
} catch (error) {
  console.error('SDK Error:', error);
}
```

## Data Types

### DosmonoDevice
```typescript
interface DosmonoDevice {
  name: string;     // Device name
  mac: string;      // MAC address
  rssi: number;     // Signal strength
  uuid: string;     // Device UUID
}
```

### DosmonoMemoryInfo
```typescript
interface DosmonoMemoryInfo {
  total: string;      // Total memory (e.g., "2GB")
  remaining: string;  // Available memory (e.g., "1.5GB")
}
```

### DosmonoConnectionStatus
```typescript
interface DosmonoConnectionStatus {
  isConnected: boolean;           // Connection state
  connectedDevice: string | null; // Connected device MAC
  isInitialized: boolean;         // SDK initialization state
}
```

### DosmonoInitResult
```typescript
interface DosmonoInitResult {
  success: boolean;    // Initialization success
  message: string;     // Status message
  errorCode?: number;  // Error code if failed
}
``` 