import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';

const { DosmonoSDK: DosmonoSDKNative } = NativeModules;

// TypeScript interfaces
export interface DosmonoDevice {
  name: string;
  mac: string;
  rssi: number;
  uuid: string;
}

export interface DosmonoFileInfo {
  name: string;
  size: string;
  date: string;
}

export interface DosmonoConnectionStatus {
  isConnected: boolean;
  connectedDevice: string | null;
  isInitialized: boolean;
}

export interface DosmonoInitResult {
  success: boolean;
  message: string;
  errorCode?: number;
}

export interface DosmonoMemoryInfo {
  total: string;
  remaining: string;
}

export interface SDKVersion {
  version: string;
  buildDate: string;
  isRealSDK: boolean;
}

// SDK Events
export interface DosmonoSDKEvents {
  onBleSearchStart: () => void;
  onBleDevicesFound: (event: { devices: DosmonoDevice[] }) => void;
  onBleSearchStop: () => void;
  onBleSearchCancel: () => void;
  onBleConnectionStatus: (event: { mac: string; isConnected: boolean }) => void;
  onBleConnectionSuccess: (event: { mac: string }) => void;
  onBleConnectionFailed: () => void;
  onBleConnectionTimeout: () => void;
  onBleCommandReceived: (event: { value: string; flags: string }) => void;
  onBleFileList: (event: { files: DosmonoFileInfo[] }) => void;
  onRecordingFilePath: (event: { fileName: string; path: string; fileType: number }) => void;
  onRecordingAudioData: (event: { dataSize: number }) => void;
  onRecordingDecodeProgress: (event: { progress: number }) => void;
  onRecordingError: (event: { errorCode: number }) => void;
  onRecordingTransferProgress: (event: { progress: number }) => void;
  onRecordingCommandReceived: (event: { value: string; flags: string }) => void;
  onRecordingFileList: (event: { files: string[] }) => void;
}

// SDK Commands/Flags enum
export enum DosmonoFlags {
  ELECTRICITY = 'ELECTRICITY',
  MEMORY = 'MEMORY',
  FILE_LIST = 'FILE_LIST',
  DELETE_FILE = 'DELETE_FILE',
  START_TRANSFER_FILE = 'START_TRANSFER_FILE',
  START_TRANSFER_FILE_COMPLETE = 'START_TRANSFER_FILE_COMPLETE',
  SN_NUMBER = 'SN_NUMBER',
  RECORD_STATUS = 'RECORD_STATUS',
  VERSION = 'VERSION',
  ACTIVE = 'ACTIVE',
  SYNC_TIME = 'SYNC_TIME',
  START_RECORD = 'START_RECORD',
  FINISH_RECORD = 'FINISH_RECORD',
  STOP_RECORD = 'STOP_RECORD',
  STOP_TRANSFER = 'STOP_TRANSFER'
}

class DosmonoSDKService {
  private eventEmitter: NativeEventEmitter | null = null;
  private isInitialized: boolean = false;
  private eventListeners: Map<string, any> = new Map();

  constructor() {
    if (Platform.OS === 'android' && DosmonoSDKNative) {
      this.eventEmitter = new NativeEventEmitter(DosmonoSDKNative);
    } else {
      // iOS implementation would go here in the future
      console.warn('Dosmono SDK is currently only supported on Android');
    }
  }

  // Request required permissions for Android
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      // Check if all permissions are granted
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      return allGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Initialize SDK with authentication credentials
  async initialize(accessKey: string, secretKey: string): Promise<DosmonoInitResult> {
    try {
      if (!DosmonoSDKNative) {
        return {
          success: false,
          message: 'Dosmono SDK native module not found. Please ensure proper installation.',
        };
      }

      const result = await DosmonoSDKNative.initialize(accessKey, secretKey);
      this.isInitialized = result.success;
      return result;
    } catch (error) {
      console.error('SDK initialization error:', error);
      return {
        success: false,
        message: `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // Check if SDK is initialized
  async isSDKInitialized(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.isInitialized();
    } catch (error) {
      console.error('Error checking initialization status:', error);
      return false;
    }
  }

  // Check Bluetooth status
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.isBluetoothEnabled();
    } catch (error) {
      console.error('Error checking Bluetooth status:', error);
      return false;
    }
  }

  // Check GPS status
  async isGpsEnabled(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.isGpsEnabled();
    } catch (error) {
      console.error('Error checking GPS status:', error);
      return false;
    }
  }

  // Start device scanning
  async startDeviceScan(duration?: number, times?: number): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.startDeviceScan(duration, times);
    } catch (error) {
      console.error('Error starting device scan:', error);
      return false;
    }
  }

  // Stop device scanning
  async stopDeviceScan(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.stopDeviceScan();
    } catch (error) {
      console.error('Error stopping device scan:', error);
      return false;
    }
  }

  // Connect to device
  async connectToDevice(macAddress: string): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.connectToDevice(macAddress);
    } catch (error) {
      console.error('Error connecting to device:', error);
      return false;
    }
  }

  // Disconnect from device
  async disconnectFromDevice(macAddress: string): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.disconnectFromDevice(macAddress);
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      return false;
    }
  }

  // Send command to device
  async sendCommand(value: string, flags: DosmonoFlags): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.sendCommand(value, flags);
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  }

  // Get device battery level
  async getBatteryLevel(): Promise<number> {
    try {
      if (!DosmonoSDKNative) return 0;
      return await DosmonoSDKNative.getBatteryLevel();
    } catch (error) {
      console.error('Error getting battery level:', error);
      return 0;
    }
  }

  // Get device memory info
  async getMemoryInfo(): Promise<DosmonoMemoryInfo> {
    try {
      if (!DosmonoSDKNative) return { total: '0GB', remaining: '0GB' };
      return await DosmonoSDKNative.getMemoryInfo();
    } catch (error) {
      console.error('Error getting memory info:', error);
      return { total: '0GB', remaining: '0GB' };
    }
  }

  // Get file list from device
  async getFileList(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.getFileList();
    } catch (error) {
      console.error('Error getting file list:', error);
      return false;
    }
  }

  // Sync time with device
  async syncTime(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.syncTime();
    } catch (error) {
      console.error('Error syncing time:', error);
      return false;
    }
  }

  // Start recording
  async startRecording(audioStoragePath?: string, bleStoragePath?: string): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.startRecording(audioStoragePath, bleStoragePath);
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  // Stop recording
  async stopRecording(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }

  // Finish recording
  async finishRecording(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.finishRecording();
    } catch (error) {
      console.error('Error finishing recording:', error);
      return false;
    }
  }

  // Delete file from device
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.deleteFile(fileName);
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Start file transfer
  async startFileTransfer(fileName: string, startPoint: number = 0): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.startFileTransfer(fileName, startPoint);
    } catch (error) {
      console.error('Error starting file transfer:', error);
      return false;
    }
  }

  // Get device version
  async getDeviceVersion(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.getDeviceVersion();
    } catch (error) {
      console.error('Error getting device version:', error);
      return false;
    }
  }

  // Activate device
  async activateDevice(): Promise<boolean> {
    try {
      if (!DosmonoSDKNative) return false;
      return await DosmonoSDKNative.activateDevice();
    } catch (error) {
      console.error('Error activating device:', error);
      return false;
    }
  }

  // Get connection status
  async getConnectionStatus(): Promise<DosmonoConnectionStatus> {
    try {
      if (!DosmonoSDKNative) return { isConnected: false, connectedDevice: null, isInitialized: false };
      return await DosmonoSDKNative.getConnectionStatus();
    } catch (error) {
      console.error('Error getting connection status:', error);
      return { isConnected: false, connectedDevice: null, isInitialized: false };
    }
  }

  // Release resources
  async releaseResources(): Promise<boolean> {
    try {
      // Remove all event listeners
      this.removeAllListeners();
      
      if (!DosmonoSDKNative) return true;
      const result = await DosmonoSDKNative.releaseResources();
      this.isInitialized = false;
      return result;
    } catch (error) {
      console.error('Error releasing resources:', error);
      return false;
    }
  }

  // Event listener management
  addEventListener<K extends keyof DosmonoSDKEvents>(
    eventName: K,
    listener: DosmonoSDKEvents[K]
  ): void {
    if (this.eventEmitter) {
      const subscription = this.eventEmitter.addListener(eventName, listener);
      this.eventListeners.set(eventName, subscription);
    }
  }

  removeEventListener(eventName: keyof DosmonoSDKEvents): void {
    const subscription = this.eventListeners.get(eventName);
    if (subscription) {
      subscription.remove();
      this.eventListeners.delete(eventName);
    }
  }

  removeAllListeners(): void {
    this.eventListeners.forEach((subscription) => {
      subscription.remove();
    });
    this.eventListeners.clear();
  }

  // Get SDK version
  async getSDKVersion(): Promise<SDKVersion> {
    try {
      if (!DosmonoSDKNative) return { version: '', buildDate: '', isRealSDK: false };
      return await DosmonoSDKNative.getSDKVersion();
    } catch (error) {
      console.error('Error getting SDK version:', error);
      return { version: '', buildDate: '', isRealSDK: false };
    }
  }
}

// Export singleton instance
export const DosmonoSDK = new DosmonoSDKService();
export default DosmonoSDK; 