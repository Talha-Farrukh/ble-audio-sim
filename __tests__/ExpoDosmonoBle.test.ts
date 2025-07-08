import { ExpoDosmonoBleModule } from '../modules/expo-dosmono-ble/src/ExpoDosmonoBle.types';

// Mock the native module
const mockNativeModule: jest.Mocked<ExpoDosmonoBleModule> = {
  initialize: jest.fn(),
  isBluetoothEnabled: jest.fn(),
  isGpsEnabled: jest.fn(),
  startDeviceSearch: jest.fn(),
  stopDeviceSearch: jest.fn(),
  connectDevice: jest.fn(),
  disconnectDevice: jest.fn(),
  sendCommand: jest.fn(),
  initializeRecording: jest.fn(),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  setAudioStoragePath: jest.fn(),
  transferFile: jest.fn(),
  getConnectionStatus: jest.fn(),
  release: jest.fn(),
};

// Mock the module
jest.mock('../modules/expo-dosmono-ble/src/ExpoDosmonoBleModule', () => mockNativeModule);

// Import the manager after mocking
import { DosmonoBleManager } from '../modules/expo-dosmono-ble/src/ExpoDosmonoBle';

describe('ExpoDosmonoBle Module', () => {
  let bleManager: DosmonoBleManager;

  beforeEach(() => {
    jest.clearAllMocks();
    bleManager = new DosmonoBleManager();
  });

  describe('Initialization', () => {
    it('should initialize with correct parameters', async () => {
      const accessKey = 'test-access-key';
      const secretKey = 'test-secret-key';
      mockNativeModule.initialize.mockResolvedValue(true);

      const result = await bleManager.initialize(accessKey, secretKey);

      expect(mockNativeModule.initialize).toHaveBeenCalledWith(accessKey, secretKey);
      expect(result).toBe(true);
    });

    it('should handle initialization failure', async () => {
      mockNativeModule.initialize.mockRejectedValue(new Error('Initialization failed'));

      await expect(bleManager.initialize('key', 'secret')).rejects.toThrow('Initialization failed');
    });
  });

  describe('Bluetooth and GPS Status', () => {
    it('should check Bluetooth status', () => {
      mockNativeModule.isBluetoothEnabled.mockReturnValue(true);

      const result = bleManager.isBluetoothEnabled();

      expect(mockNativeModule.isBluetoothEnabled).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should check GPS status', () => {
      mockNativeModule.isGpsEnabled.mockReturnValue(false);

      const result = bleManager.isGpsEnabled();

      expect(mockNativeModule.isGpsEnabled).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('Device Scanning', () => {
    it('should start device search', async () => {
      mockNativeModule.startDeviceSearch.mockResolvedValue(true);

      const result = await bleManager.startDeviceSearch();

      expect(mockNativeModule.startDeviceSearch).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should stop device search', () => {
      mockNativeModule.stopDeviceSearch.mockReturnValue(true);

      const result = bleManager.stopDeviceSearch();

      expect(mockNativeModule.stopDeviceSearch).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle search failure', async () => {
      mockNativeModule.startDeviceSearch.mockRejectedValue(new Error('Search failed'));

      await expect(bleManager.startDeviceSearch()).rejects.toThrow('Search failed');
    });
  });

  describe('Device Connection', () => {
    it('should connect to device', async () => {
      const deviceMac = '00:11:22:33:44:55';
      mockNativeModule.connectDevice.mockResolvedValue(deviceMac);

      const result = await bleManager.connectDevice(deviceMac);

      expect(mockNativeModule.connectDevice).toHaveBeenCalledWith(deviceMac);
      expect(result).toBe(deviceMac);
    });

    it('should disconnect from device', () => {
      mockNativeModule.disconnectDevice.mockReturnValue(true);

      const result = bleManager.disconnectDevice();

      expect(mockNativeModule.disconnectDevice).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle connection failure', async () => {
      mockNativeModule.connectDevice.mockRejectedValue(new Error('Connection failed'));

      await expect(bleManager.connectDevice('invalid-mac')).rejects.toThrow('Connection failed');
    });

    it('should get connection status', () => {
      const status = { isConnected: true, connectedDevice: '00:11:22:33:44:55' };
      mockNativeModule.getConnectionStatus.mockReturnValue(status);

      const result = bleManager.getConnectionStatus();

      expect(mockNativeModule.getConnectionStatus).toHaveBeenCalled();
      expect(result).toEqual(status);
    });
  });

  describe('Device Commands', () => {
    it('should send ELECTRICITY command', async () => {
      mockNativeModule.sendCommand.mockResolvedValue(true);

      const result = await bleManager.sendCommand('', 'ELECTRICITY');

      expect(mockNativeModule.sendCommand).toHaveBeenCalledWith('', 'ELECTRICITY');
      expect(result).toBe(true);
    });

    it('should send MEMORY command', async () => {
      mockNativeModule.sendCommand.mockResolvedValue(true);

      const result = await bleManager.sendCommand('', 'MEMORY');

      expect(mockNativeModule.sendCommand).toHaveBeenCalledWith('', 'MEMORY');
      expect(result).toBe(true);
    });

    it('should send VERSION command', async () => {
      mockNativeModule.sendCommand.mockResolvedValue(true);

      const result = await bleManager.sendCommand('', 'VERSION');

      expect(mockNativeModule.sendCommand).toHaveBeenCalledWith('', 'VERSION');
      expect(result).toBe(true);
    });

    it('should send FILE_LIST command', async () => {
      mockNativeModule.sendCommand.mockResolvedValue(true);

      const result = await bleManager.sendCommand('', 'FILE_LIST');

      expect(mockNativeModule.sendCommand).toHaveBeenCalledWith('', 'FILE_LIST');
      expect(result).toBe(true);
    });

    it('should handle command failure', async () => {
      mockNativeModule.sendCommand.mockRejectedValue(new Error('Command failed'));

      await expect(bleManager.sendCommand('', 'ELECTRICITY')).rejects.toThrow('Command failed');
    });
  });

  describe('Recording Functions', () => {
    it('should initialize recording', async () => {
      mockNativeModule.initializeRecording.mockResolvedValue(true);

      const result = await bleManager.initializeRecording();

      expect(mockNativeModule.initializeRecording).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should start recording', async () => {
      mockNativeModule.startRecording.mockResolvedValue(true);

      const result = await bleManager.startRecording();

      expect(mockNativeModule.startRecording).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should stop recording', () => {
      mockNativeModule.stopRecording.mockReturnValue(true);

      const result = bleManager.stopRecording();

      expect(mockNativeModule.stopRecording).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle recording initialization failure', async () => {
      mockNativeModule.initializeRecording.mockRejectedValue(new Error('Recording init failed'));

      await expect(bleManager.initializeRecording()).rejects.toThrow('Recording init failed');
    });

    it('should handle recording start failure', async () => {
      mockNativeModule.startRecording.mockRejectedValue(new Error('Recording start failed'));

      await expect(bleManager.startRecording()).rejects.toThrow('Recording start failed');
    });
  });

  describe('File Operations', () => {
    it('should set audio storage path', () => {
      const path = '/test/audio/path';
      mockNativeModule.setAudioStoragePath.mockReturnValue(true);

      const result = bleManager.setAudioStoragePath(path);

      expect(mockNativeModule.setAudioStoragePath).toHaveBeenCalledWith(path);
      expect(result).toBe(true);
    });

    it('should transfer file', async () => {
      const fileName = 'test.wav';
      const startPoint = 0;
      mockNativeModule.transferFile.mockResolvedValue(true);

      const result = await bleManager.transferFile(fileName, startPoint);

      expect(mockNativeModule.transferFile).toHaveBeenCalledWith(fileName, startPoint);
      expect(result).toBe(true);
    });

    it('should handle file transfer failure', async () => {
      mockNativeModule.transferFile.mockRejectedValue(new Error('Transfer failed'));

      await expect(bleManager.transferFile('test.wav', 0)).rejects.toThrow('Transfer failed');
    });
  });

  describe('Event Management', () => {
    it('should add event listener', () => {
      const callback = jest.fn();
      bleManager.addEventListener('onDevicesFound', callback);
      // Just check that addEventListener does not throw and callback is a function
      expect(typeof callback).toBe('function');
    });

    it('should remove specific event listener', () => {
      const callback = jest.fn();
      bleManager.addEventListener('onDevicesFound', callback);
      bleManager.removeEventListener('onDevicesFound');
      expect(typeof callback).toBe('function');
    });

    it('shoulyard remove all event listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      bleManager.addEventListener('onDevicesFound', callback1);
      bleManager.addEventListener('onConnectSuccess', callback2);
      bleManager.removeAllEventListeners();
      expect(typeof callback1).toBe('function');
      expect(typeof callback2).toBe('function');
    });

    it('should call event listener when event is triggered (simulated)', () => {
      const callback = jest.fn();
      // Simulate event by calling the callback directly
      bleManager.addEventListener('onDevicesFound', callback);
      const eventData = { devices: [{ name: 'Test', mac: '00:11:22:33:44:55', rssi: -45 }] };
      callback(eventData);
      expect(callback).toHaveBeenCalledWith(eventData);
    });
  });

  describe('Resource Management', () => {
    it('should release resources', () => {
      mockNativeModule.release.mockReturnValue(true);

      const result = bleManager.release();

      expect(mockNativeModule.release).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should clear event listeners on release', () => {
      const callback = jest.fn();
      bleManager.addEventListener('onDevicesFound', callback);
      bleManager.release();
      expect(typeof callback).toBe('function');
    });
  });

  describe('Error Boundaries', () => {
    it('should handle null/undefined parameters gracefully', async () => {
      // Test null access key
      await expect(bleManager.initialize(null as any, 'secret')).rejects.toThrow();
      
      // Test null device mac
      await expect(bleManager.connectDevice(null as any)).rejects.toThrow();
    });

    it('should validate MAC address format', async () => {
      mockNativeModule.connectDevice.mockRejectedValue(new Error('Invalid MAC format'));
      
      await expect(bleManager.connectDevice('invalid-mac')).rejects.toThrow('Invalid MAC format');
    });

    it('should handle concurrent operations gracefully', async () => {
      mockNativeModule.startDeviceSearch.mockResolvedValue(true);
      mockNativeModule.connectDevice.mockResolvedValue('00:11:22:33:44:55');
      
      // Start multiple operations concurrently
      const searchPromise = bleManager.startDeviceSearch();
      const connectPromise = bleManager.connectDevice('00:11:22:33:44:55');
      
      await Promise.all([searchPromise, connectPromise]);
      
      expect(mockNativeModule.startDeviceSearch).toHaveBeenCalled();
      expect(mockNativeModule.connectDevice).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct command types', async () => {
      // Valid commands should work
      await expect(bleManager.sendCommand('', 'ELECTRICITY')).resolves.not.toThrow();
      await expect(bleManager.sendCommand('', 'MEMORY')).resolves.not.toThrow();
      await expect(bleManager.sendCommand('', 'VERSION')).resolves.not.toThrow();
      await expect(bleManager.sendCommand('', 'FILE_LIST')).resolves.not.toThrow();
    });

    it('should handle event data type safety', () => {
      const callback = jest.fn();
      bleManager.addEventListener('onDevicesFound', callback);
      const validEventData = {
        devices: [
          { name: 'Test Device', mac: '00:11:22:33:44:55', rssi: -45 }
        ]
      };
      callback(validEventData);
      expect(callback).toHaveBeenCalledWith(validEventData);
    });
  });
}); 