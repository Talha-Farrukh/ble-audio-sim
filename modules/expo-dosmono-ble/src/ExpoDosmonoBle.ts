import { requireNativeModule } from 'expo-modules-core';
import { 
  DosmonoDevice, 
  ConnectionStatus, 
  DosmonoCommand,
  DosmonoBleEventMap,
  ExpoDosmonoBleModule as ExpoDosmonoBleModuleType
} from './DosmonoBle.types';

// Import the native module using modern approach
const ExpoDosmonoBleModule = requireNativeModule<ExpoDosmonoBleModuleType>('ExpoDosmonoBle');

export class DosmonoBleManager {
  private subscriptions: Map<string, any> = new Map();
  private isInitializing = false;

  /**
   * Initialize the Dosmono SDK with authentication
   */
  async initialize(accessKey: string, secretKey: string): Promise<boolean> {
    if (this.isInitializing) {
      console.log('SDK initialization already in progress');
      return false;
    }

    try {
      this.isInitializing = true;
      console.log('Starting SDK initialization...');
      
      // Set up auth result promise
      const authResultPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.removeEventListener('onAuthResult');
          reject(new Error('Auth result timeout'));
        }, 10000);

        const authListener = (event: { success: boolean }) => {
          clearTimeout(timeout);
          this.removeEventListener('onAuthResult');
          resolve(event.success);
        };

        this.addEventListener('onAuthResult', authListener);
      });

      // Start initialization
      const initResult = await ExpoDosmonoBleModule.initialize(accessKey, secretKey);
      if (!initResult) {
        throw new Error('SDK initialization failed');
      }

      // Wait for auth result
      const authResult = await authResultPromise;
      return authResult;
    } catch (error) {
      console.error('SDK initialization error:', error);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check if Bluetooth is enabled on the device
   */
  isBluetoothEnabled(): boolean {
    return ExpoDosmonoBleModule.isBluetoothEnabled();
  }

  /**
   * Check if GPS location is enabled on the device
   */
  isGpsEnabled(): boolean {
    return ExpoDosmonoBleModule.isGpsEnabled();
  }

  /**
   * Start scanning for nearby Dosmono devices
   */
  async startDeviceSearch(): Promise<boolean> {
    return await ExpoDosmonoBleModule.startDeviceSearch();
  }

  /**
   * Stop scanning for devices
   */
  stopDeviceSearch(): boolean {
    return ExpoDosmonoBleModule.stopDeviceSearch();
  }

  /**
   * Connect to a specific device by MAC address
   */
  async connectDevice(mac: string): Promise<string> {
    return await ExpoDosmonoBleModule.connectDevice(mac);
  }

  /**
   * Disconnect from the currently connected device
   */
  disconnectDevice(): boolean {
    return ExpoDosmonoBleModule.disconnectDevice();
  }

  /**
   * Send a command to the connected device
   */
  async sendCommand(command: string, flag: DosmonoCommand): Promise<boolean> {
    return await ExpoDosmonoBleModule.sendCommand(command, flag);
  }

  /**
   * Initialize recording functionality
   */
  async initializeRecording(): Promise<boolean> {
    return await ExpoDosmonoBleModule.initializeRecording();
  }

  /**
   * Start recording on the connected device
   */
  async startRecording(): Promise<boolean> {
    return await ExpoDosmonoBleModule.startRecording();
  }

  /**
   * Stop recording on the connected device
   */
  stopRecording(): boolean {
    return ExpoDosmonoBleModule.stopRecording();
  }

  /**
   * Set the local storage path for audio files
   */
  setAudioStoragePath(path: string): boolean {
    return ExpoDosmonoBleModule.setAudioStoragePath(path);
  }

  /**
   * Transfer a file from the device
   */
  async transferFile(fileName: string, startPoint: number = 0): Promise<boolean> {
    return await ExpoDosmonoBleModule.transferFile(fileName, startPoint);
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return ExpoDosmonoBleModule.getConnectionStatus();
  }

  /**
   * Release all resources and cleanup
   */
  release(): boolean {
    this.removeAllEventListeners();
    return ExpoDosmonoBleModule.release();
  }

  // Event listener methods
  addEventListener<K extends keyof DosmonoBleEventMap>(
    eventName: K,
    listener: (event: DosmonoBleEventMap[K]) => void
  ): void {
    console.log(`Adding listener for event: ${eventName}`);
    // @ts-ignore - The native module handles event subscription
    const subscription = ExpoDosmonoBleModule.addListener(eventName, listener);
    this.subscriptions.set(eventName.toString(), subscription);
  }

  removeEventListener(eventName: keyof DosmonoBleEventMap): void {
    console.log(`Removing listener for event: ${eventName}`);
    const subscription = this.subscriptions.get(eventName.toString());
    if (subscription) {
      subscription.remove();
      this.subscriptions.delete(eventName.toString());
    }
  }

  removeAllEventListeners(): void {
    console.log('Removing all event listeners');
    this.subscriptions.forEach((subscription) => subscription.remove());
    this.subscriptions.clear();
  }

  // Convenience methods for device management
  async getDeviceBattery(): Promise<boolean> {
    return await this.sendCommand('', 'ELECTRICITY');
  }

  async getDeviceMemory(): Promise<boolean> {
    return await this.sendCommand('', 'MEMORY');
  }

  async getFileList(): Promise<boolean> {
    return await this.sendCommand('', 'FILE_LIST');
  }

  async getDeviceVersion(): Promise<boolean> {
    return await this.sendCommand('', 'VERSION');
  }

  async activateDevice(): Promise<boolean> {
    return await this.sendCommand('', 'ACTIVE');
  }

  async syncTime(): Promise<boolean> {
    return await this.sendCommand('', 'SYNC_TIME');
  }

  async deleteFile(fileName: string): Promise<boolean> {
    return await this.sendCommand(fileName, 'DELETE_FILE');
  }
}

// Export a singleton instance
export const dosmonoBle = new DosmonoBleManager();

// Export types and interfaces
export * from './DosmonoBle.types'; 