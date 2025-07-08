# BLE Audio Sim

A React Native Expo application that integrates with Dosmono wearable devices for Bluetooth Low Energy (BLE) audio recording and control.

## Features

- **Device Discovery**: Scan and discover nearby Dosmono wearable devices
- **Bluetooth Connection**: Connect and manage connections to wearable devices
- **Audio Recording**: Start, stop, and control audio recording on connected devices
- **Device Information**: Retrieve battery status, memory information, version details, and file lists
- **Real-time Monitoring**: Activity logs and connection status monitoring
- **File Management**: Transfer and manage audio files from the device

## Prerequisites

- Node.js (v16 or later)
- Yarn or npm
- React Native development environment
- Android Studio (for Android builds)
- Physical Android device (API level 23+) with Bluetooth and location permissions

## SDK Integration

This app integrates the Dosmono SDK (provided as an AAR file) through a custom Expo native module. The integration includes:

- **Authentication**: SDK initialization with access keys
- **Bluetooth Management**: Device scanning, connection, and communication
- **Recording Control**: Audio recording functionality
- **File Operations**: File transfer and management

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ble-audio-sim
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure your SDK credentials in `App.tsx`:
```typescript
const ACCESS_KEY = "your-access-key-here";
const SECRET_KEY = "your-secret-key-here";
```

## Building and Running

### Development Build

1. Generate native projects:
```bash
npx expo prebuild --clean
```

2. Run on Android:
```bash
npx expo run:android
```

### Production Build

```bash
eas build --platform android --profile production
```

## Permissions

The app requires the following Android permissions:

- **Bluetooth permissions**: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`
- **Location permissions**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- **Storage permissions**: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- **Network permissions**: `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`
- **Audio permission**: `RECORD_AUDIO`
- **Service permission**: `FOREGROUND_SERVICE`

## Usage

### 1. Initialize SDK
The app automatically initializes the Dosmono SDK on startup with your configured credentials.

### 2. Scan for Devices
- Tap "Start Scan" to discover nearby Dosmono devices
- Ensure Bluetooth and GPS are enabled
- Found devices will appear in the list with name, MAC address, and signal strength

### 3. Connect to Device
- Tap on any discovered device to connect
- Connection status will be displayed in the status section

### 4. Control Recording
Once connected, you can:
- Start/stop audio recording
- Monitor recording status
- View device information (battery, memory, version)

### 5. Device Management
- Get battery level
- Check memory usage
- Retrieve firmware version
- List recorded files
- Transfer files from device

## API Reference

### DosmonoBleManager

#### Core Methods

```typescript
// Initialize SDK
await dosmonoBle.initialize(accessKey: string, secretKey: string): Promise<boolean>

// Device scanning
await dosmonoBle.startDeviceSearch(): Promise<boolean>
dosmonoBle.stopDeviceSearch(): boolean

// Connection management
await dosmonoBle.connectDevice(mac: string): Promise<string>
dosmonoBle.disconnectDevice(): boolean

// Recording control
await dosmonoBle.initializeRecording(): Promise<boolean>
await dosmonoBle.startRecording(): Promise<boolean>
dosmonoBle.stopRecording(): boolean

// Device information
await dosmonoBle.getDeviceBattery(): Promise<boolean>
await dosmonoBle.getDeviceMemory(): Promise<boolean>
await dosmonoBle.getFileList(): Promise<boolean>
await dosmonoBle.getDeviceVersion(): Promise<boolean>
```

#### Event Listeners

```typescript
// Authentication result
dosmonoBle.addEventListener('onAuthResult', (event: AuthResult) => {
  console.log(event.success, event.message);
});

// Device discovery
dosmonoBle.addEventListener('onDevicesFound', (event: DevicesFoundEvent) => {
  console.log('Found devices:', event.devices);
});

// Connection status
dosmonoBle.addEventListener('onConnectStatus', (event: ConnectStatusEvent) => {
  console.log('Device connected:', event.connected);
});

// Recording events
dosmonoBle.addEventListener('onRecordStart', (event: RecordingInfo) => {
  console.log('Recording started:', event.fileName);
});

// Command responses
dosmonoBle.addEventListener('onCmdReceive', (event: CmdReceiveEvent) => {
  console.log('Command response:', event.flag, event.command);
});
```

### Data Types

```typescript
interface DosmonoDevice {
  name: string;
  mac: string;
  rssi: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  connectedDevice: string | null;
}

interface RecordingInfo {
  fileName: string;
  path: string;
  fileType: number;
}

type DosmonoCommand = 
  | 'ELECTRICITY' | 'MEMORY' | 'FILE_LIST' | 'DELETE_FILE'
  | 'SN_NUMBER' | 'RECORD_STATUS' | 'VERSION' | 'ACTIVE'
  | 'SYNC_TIME' | 'START_RECORD' | 'FINISH_RECORD' 
  | 'STOP_RECORD' | 'STOP_TRANSFER';
```

## Architecture

### Native Module Structure
```
modules/expo-dosmono-ble/
├── android/
│   ├── libs/sdk.aar          # Dosmono SDK
│   ├── build.gradle          # Android dependencies
│   └── src/main/java/expo/modules/dosmonoble/
│       └── ExpoDosmonoBleModule.kt  # Native bridge
├── src/
│   ├── DosmonoBle.types.ts   # TypeScript definitions
│   └── ExpoDosmonoBle.ts     # JavaScript interface
└── index.ts                  # Module exports
```

### App Structure
```
├── App.tsx                   # Main application component
├── app.config.ts            # Expo configuration
├── package.json             # Dependencies
└── modules/                 # Local native modules
```

## Troubleshooting

### Common Issues

1. **SDK not initialized**
   - Check your access key and secret key
   - Ensure internet connectivity
   - Verify the AAR file is present

2. **Bluetooth scanning fails**
   - Enable Bluetooth in device settings
   - Grant location permissions
   - Ensure GPS is enabled

3. **Connection timeout**
   - Device may be out of range
   - Check device compatibility
   - Restart Bluetooth on phone

4. **Recording fails**
   - Ensure device is connected
   - Check audio permissions
   - Initialize recording before starting

### Debugging

Enable detailed logging by checking the Activity Log section in the app. All SDK operations and responses are logged there.

## Development

### Adding New Features

1. **Native Module**: Add new functions to `ExpoDosmonoBleModule.kt`
2. **TypeScript Interface**: Update type definitions in `DosmonoBle.types.ts`
3. **Manager Class**: Add methods to `DosmonoBleManager` in `ExpoDosmonoBle.ts`
4. **UI Components**: Update `App.tsx` with new UI elements

### Testing

Test on physical Android devices with:
- Different Android versions (API 23+)
- Various Bluetooth configurations
- Different wearable device models

## License

Private - Internal use only

## Support

For technical support or questions about the Dosmono SDK integration, refer to the SDK documentation or contact the development team. 