# Dosmono SDK Documentation

This folder contains comprehensive documentation for the Dosmono SDK integration in your React Native Expo project.

## 📚 Available Documentation

### 1. [API Reference](./DOSMONO_SDK_API_REFERENCE.md)
Complete API reference with all available methods, parameters, return types, and interfaces.

**Contents:**
- Authentication methods
- Device management
- Connection handling
- Device commands
- Recording features
- File management
- Event listening
- Data types and interfaces

### 2. [Usage Examples](./DOSMONO_SDK_USAGE_EXAMPLES.md)
Practical code examples and implementation patterns for common use cases.

**Contents:**
- Basic setup and initialization
- Device discovery workflow
- Connection management
- Device command execution
- File operations
- Recording control
- Complete React component example
- Error handling patterns
- Resource cleanup

### 3. [Integration Guide](./DOSMONO_SDK_INTEGRATION.md)
Detailed guide for integrating the Dosmono SDK into your project.

**Contents:**
- Project setup instructions
- Android configuration
- Native module implementation
- TypeScript service layer
- Expo prebuild considerations
- Build and deployment

## 🚀 Quick Start

1. **Initialize the SDK**
   ```typescript
   import DosmonoSDKService from './src/services/DosmonoSDK';
   
   const dosmonoSDK = new DosmonoSDKService();
   await dosmonoSDK.initialize('your-access-key', 'your-secret-key');
   ```

2. **Discover Devices**
   ```typescript
   dosmonoSDK.addEventListener('onBleDevicesFound', (event) => {
     console.log('Found devices:', event.devices);
   });
   
   await dosmonoSDK.startDeviceScan(30, 3);
   ```

3. **Connect and Control**
   ```typescript
   await dosmonoSDK.connectToDevice('device-mac-address');
   const battery = await dosmonoSDK.getBatteryLevel();
   await dosmonoSDK.syncTime();
   ```

## 🔧 SDK Features

### ✅ Core Functionality
- **Authentication**: SDK initialization with access key/secret key
- **Device Discovery**: BLE scanning with filtering and device listing
- **Connection Management**: Connect/disconnect with status monitoring
- **Device Commands**: Battery, memory, time sync, version info
- **Status Monitoring**: Real-time connection and device status

### ✅ Advanced Features  
- **Recording Control**: Start, stop, and finish recording operations
- **File Management**: List, download, and delete files from device
- **Event System**: Real-time event notifications for all operations
- **Error Handling**: Comprehensive error handling and logging
- **Resource Management**: Proper cleanup and resource release

### 🔄 In Development
- **Recording Callbacks**: Advanced recording event handling
- **File Transfer Progress**: Real-time transfer progress tracking
- **Audio Processing**: Audio data streaming and processing

## 📱 Supported Platforms

- **Android**: ✅ Full support with native module
- **iOS**: 🔄 Coming soon

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           React Native App          │
├─────────────────────────────────────┤
│      DosmonoSDKService (TS)        │
├─────────────────────────────────────┤
│     DosmonoSDKModule (Kotlin)      │
├─────────────────────────────────────┤
│       Dosmono SDK (AAR)            │
├─────────────────────────────────────┤
│         BLE Hardware               │
└─────────────────────────────────────┘
```

## 🧪 Testing

The SDK includes a comprehensive demo component for testing all functionality:

```typescript
import DosmonoSDKDemo from './components/DosmonoSDKDemo';

// Use in your App.tsx
<DosmonoSDKDemo />
```

**Demo Features:**
- SDK initialization interface
- Real-time status indicators
- Device scanning and listing
- Connection management
- Device control buttons
- Activity logging
- Error handling demonstrations

## 🔍 Debugging

Enable detailed logging for development:

```typescript
// In development mode
if (__DEV__) {
  console.log('🔧 Dosmono SDK Debug Mode');
  
  // Log all events
  dosmonoSDK.addEventListener('*', (event, data) => {
    console.log(`📡 ${event}:`, data);
  });
}
```

## 📋 Requirements

### System Requirements
- **React Native**: 0.70+
- **Expo**: SDK 49+
- **Android**: API Level 23+ (Android 6.0)
- **Node.js**: 16+

### Hardware Requirements
- **Bluetooth**: BLE 4.0+ support
- **GPS**: Location services for BLE scanning
- **Storage**: For file transfers and recordings

### Permissions
- Bluetooth permissions (BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_CONNECT, BLUETOOTH_SCAN)
- Location permissions (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)  
- Storage permissions (for file operations)

## 🆘 Support

### Common Issues
1. **"DosmonoSDKNative is undefined"** - Check native module registration
2. **"Permission denied"** - Verify Bluetooth and location permissions
3. **"Connection timeout"** - Ensure device is in range and pairing mode
4. **"SDK not initialized"** - Call `initialize()` before other operations

### Getting Help
- Check the troubleshooting sections in the documentation
- Review the usage examples for proper implementation patterns
- Enable debug logging to identify issues
- Verify all prerequisites are met

## 🔄 Updates

This documentation is updated with each SDK release. Check the file timestamps and version numbers for the latest information.

**Last Updated**: December 2024
**SDK Version**: 1.0.0
**Documentation Version**: 1.0.0 