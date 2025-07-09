import { useState, useEffect, useRef, useCallback } from 'react';
import { BleManager, Device, BleError, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Buffer } from 'buffer';
import { 
  BLE_CONSTANTS, 
  RECORDING_COMMANDS,
  ProtocolHelpers,
  CONNECTION_CONFIG,
  DeviceStatus
} from '../constants/BluetoothConstants';

export interface DeviceInfo {
  id: string;
  name: string | null;
  rssi: number;
  isConnected: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  isRecording?: boolean;
  deviceStatus?: DeviceStatus;
}

export interface BluetoothState {
  isScanning: boolean;
  discoveredDevices: DeviceInfo[];
  connectedDevice: DeviceInfo | null;
  isConnecting: boolean;
  bluetoothState: 'Unknown' | 'Resetting' | 'Unsupported' | 'Unauthorized' | 'PoweredOff' | 'PoweredOn';
  error: string | null;
  recordingState: RecordingState;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
}

interface BluetoothHook {
  isScanning: boolean;
  devices: DeviceInfo[];
  connectedDevice: DeviceInfo | null;
  isConnecting: boolean;
  connectionError: string | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  sendCommand: (command: number, data?: number[]) => Promise<void>;
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
}

export const useBluetooth = (): BluetoothHook => {
  const bleManager = useRef<BleManager>(new BleManager()).current;
  
  const [state, setState] = useState<BluetoothState>({
    isScanning: false,
    discoveredDevices: [],
    connectedDevice: null,
    isConnecting: false,
    bluetoothState: 'Unknown',
    error: null,
    recordingState: {
      isRecording: false,
      isPaused: false,
      duration: 0
    }
  });

  // Request necessary permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version as number;
        console.log('Android API Level:', apiLevel);
        
        let permissionsToRequest: (keyof typeof PermissionsAndroid.PERMISSIONS)[] = [];
        
        if (apiLevel >= 31) {
          // Android 12+ (API 31+) - New Bluetooth permissions
          permissionsToRequest = [
            'BLUETOOTH_SCAN',
            'BLUETOOTH_CONNECT', 
            'ACCESS_FINE_LOCATION',
          ];
          
          // Check if BLUETOOTH_ADVERTISE is available (some devices might not have it)
          try {
            if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE) {
              permissionsToRequest.push('BLUETOOTH_ADVERTISE');
            }
          } catch (e) {
            console.log('BLUETOOTH_ADVERTISE permission not available');
          }
        } else if (apiLevel >= 23) {
          // Android 6+ (API 23-30) - Legacy Bluetooth permissions
          permissionsToRequest = [
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
          ];
        }
        
        if (permissionsToRequest.length === 0) {
          console.log('No permissions needed for this Android version');
          return true;
        }
        
        console.log('Requesting permissions:', permissionsToRequest);
        
        const permissionValues = permissionsToRequest.map(p => PermissionsAndroid.PERMISSIONS[p]);
        const granted = await PermissionsAndroid.requestMultiple(permissionValues);
        console.log('Permission results:', granted);

        const deniedPermissions = Object.entries(granted)
          .filter(([_, result]) => result !== PermissionsAndroid.RESULTS.GRANTED)
          .map(([permission, _]) => permission);

        if (deniedPermissions.length > 0) {
          console.log('Denied permissions:', deniedPermissions);
          
          Alert.alert(
            'Permissions Required',
            `The following permissions are required for Bluetooth functionality:\n\n${deniedPermissions.map(p => 
              p.replace('android.permission.', '').replace('_', ' ')
            ).join('\n')}\n\nPlease grant these permissions in Settings to use the app.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  // Note: You might want to add react-native-settings or similar package
                  // for now, just show a message
                  Alert.alert('Settings', 'Please manually open Settings > Apps > BLE Audio Sim > Permissions and grant the required permissions.');
                }
              }
            ]
          );
          return false;
        }

        console.log('All permissions granted successfully');
        return true;
        
      } catch (error) {
        console.error('Permission request failed:', error);
        Alert.alert(
          'Permission Error',
          `Failed to request permissions: ${error}`,
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    
    // iOS doesn't need runtime permission requests for Bluetooth
    return true;
  }, []);

  // Initialize Bluetooth manager and check state
  const initializeBluetooth = useCallback(async () => {
    try {
      const hasPermissions = await requestPermissions();
      console.log('hasPermissions', hasPermissions);
      if (!hasPermissions) {
        setState(prev => ({ ...prev, error: 'Bluetooth permissions not granted' }));
        return false;
      }

      const state = await bleManager.state();
      setState(prev => ({ ...prev, bluetoothState: state }));

      if (state !== 'PoweredOn') {
        setState(prev => ({ ...prev, error: 'Bluetooth is not powered on' }));
        return false;
      }

      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: `Bluetooth initialization failed: ${error}` }));
      return false;
    }
  }, [bleManager, requestPermissions]);

  // Start scanning for devices
  const startScan = useCallback(async (): Promise<void> => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      setState(prev => ({ ...prev, isScanning: true, error: null }));
      
      console.log('Starting BLE scan for voice recording devices...');
      
      // Clear previous devices
      setState(prev => ({ ...prev, discoveredDevices: [] }));

      // Start scanning for devices
      await bleManager.startDeviceScan(
        null, // Show all devices instead of filtering by services
        { 
          allowDuplicates: false, // Reduce noise in the device list
        }, 
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            setState(prev => ({ ...prev, isScanning: false, error: error.message }));
            return;
          }

          if (device) {
            // Enhanced device logging
            console.log('Found device:', {
              id: device.id,
              name: device.name || device.localName,
              rssi: device.rssi,
              serviceUUIDs: device.serviceUUIDs,
              manufacturerData: device.manufacturerData,
              isConnectable: device.isConnectable,
              serviceData: device.serviceData,
            });

            // Add all discoverable devices
            const deviceInfo: DeviceInfo = {
              id: device.id,
              name: device.name || device.localName || 'Unknown Device',
              rssi: device.rssi || -100,
              isConnected: false,
              isRecording: false,
            };

            // Check if this might be a voice recorder
            if (device.name?.toLowerCase().includes('smart') || 
                device.name?.toLowerCase().includes('rec') ||
                device.name?.toLowerCase().includes('voice') ||
                device.name?.toLowerCase().includes('audio') ||
                device.localName?.toLowerCase().includes('smart') ||
                device.localName?.toLowerCase().includes('rec') ||
                device.localName?.toLowerCase().includes('voice') ||
                device.localName?.toLowerCase().includes('audio')) {
              deviceInfo.name = `🎙️ ${deviceInfo.name} (Possible Voice Recorder)`;
              console.log('✅ POTENTIAL VOICE RECORDER FOUND:', deviceInfo);
            }

            setState(prev => {
              const existingDeviceIndex = prev.discoveredDevices.findIndex(d => d.id === device.id);
              
              if (existingDeviceIndex !== -1) {
                // Update existing device
                const updatedDevices = [...prev.discoveredDevices];
                updatedDevices[existingDeviceIndex] = deviceInfo;
                return { ...prev, discoveredDevices: updatedDevices };
              } else {
                // Add new device
                console.log('Adding device to list:', deviceInfo);
                return { ...prev, discoveredDevices: [...prev.discoveredDevices, deviceInfo] };
              }
            });
          }
        }
      );

      // Extended scan time for better device discovery
      setTimeout(() => {
        bleManager.stopDeviceScan();
        setState(prev => ({ ...prev, isScanning: false }));
        console.log('Voice recorder scan completed');
      }, CONNECTION_CONFIG.SCAN_DURATION * 2); // Double the scan time

    } catch (error: any) {
      console.error('Failed to start scan:', error);
      setState(prev => ({ ...prev, isScanning: false, error: error.message }));
    }
  }, [bleManager, requestPermissions]);

  // Helper function to identify voice recording devices
  const isVoiceRecorderDevice = useCallback((device: Device): boolean => {
    if (!device.serviceUUIDs) return false;

    const expectedServices = [
      BLE_CONSTANTS.SERVICES.COMMAND.toLowerCase(),
      BLE_CONSTANTS.SERVICES.AUDIO_STREAM.toLowerCase(),
      BLE_CONSTANTS.SERVICES.FILE_STREAM.toLowerCase(),
      BLE_CONSTANTS.SERVICES.OTA_STREAM.toLowerCase(),
    ];

    const deviceServices = device.serviceUUIDs.map(uuid => 
      uuid.toLowerCase().replace(/-/g, '')
    );

    // Check if device has any of our expected services
    const hasExpectedService = expectedServices.some(expectedUuid => 
      deviceServices.some(deviceUuid => 
        deviceUuid.includes(expectedUuid.replace(/-/g, '')) || 
        expectedUuid.replace(/-/g, '').includes(deviceUuid)
      )
    );

    // Also check device name for voice recorder indicators
    const deviceName = (device.name || device.localName || '').toLowerCase();
    const isVoiceRecorderName = deviceName.includes('voice') || 
                               deviceName.includes('record') || 
                               deviceName.includes('smart rec') ||
                               deviceName.includes('aimt') || // From protocol document
                               deviceName.includes('recorder');

    return hasExpectedService || isVoiceRecorderName;
  }, []);

  // Enhanced connection with better validation
  const connectToDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log(`Attempting to connect to device: ${deviceId}`);
      
      // Connect to device with extended timeout
      const device = await bleManager.connectToDevice(deviceId, {
        timeout: CONNECTION_CONFIG.CONNECTION_TIMEOUT * 2,
        requestMTU: 517, // Request larger MTU for better data transfer
      });
      
      console.log('Connected, discovering services...');
      await device.discoverAllServicesAndCharacteristics();
      
      // Get all services and log them
      const services = await device.services();
      console.log('Discovered services:', services.map(s => s.uuid));
      
      // Set up monitoring for notifications
      const commandService = services.find(s => 
        s.uuid.toLowerCase().includes('fff9') || // Command service
        s.uuid.toLowerCase().includes('ffe0')    // Alternative command service
      );
      
      if (commandService) {
        await setupDeviceNotifications(device, commandService);
      } else {
        console.log('Warning: Command service not found, some features may not work');
      }
      
      // Update device info
      const deviceInfo: DeviceInfo = {
        id: device.id,
        name: device.name || 'Connected Device',
        rssi: device.rssi || -100,
        isConnected: true,
        isRecording: false,
      };

      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectedDevice: deviceInfo,
        error: null
      }));

      console.log('Successfully connected to device:', deviceInfo);

    } catch (error: any) {
      console.error('Connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: `Connection failed: ${error.message}. Try moving closer to the device or restarting it.`
      }));
      throw error;
    }
  }, [bleManager]);

  // Service validation helper
  const validateVoiceRecorderServices = useCallback((services: any[]): {
    isCompatible: boolean;
    commandService?: any;
    audioService?: any;
    fileService?: any;
    reason?: string;
  } => {
    const expectedServices = {
      command: BLE_CONSTANTS.SERVICES.COMMAND.toLowerCase().replace(/-/g, ''),
      audio: BLE_CONSTANTS.SERVICES.AUDIO_STREAM.toLowerCase().replace(/-/g, ''),
      file: BLE_CONSTANTS.SERVICES.FILE_STREAM.toLowerCase().replace(/-/g, ''),
      ota: BLE_CONSTANTS.SERVICES.OTA_STREAM.toLowerCase().replace(/-/g, ''),
    };

    const foundServices = {
      command: null as any,
      audio: null as any,
      file: null as any,
      ota: null as any,
    };

    // Check each service
    for (const service of services) {
      const serviceUuid = service.uuid.toLowerCase().replace(/-/g, '');
      
      if (serviceUuid.includes(expectedServices.command) || expectedServices.command.includes(serviceUuid)) {
        foundServices.command = service;
      } else if (serviceUuid.includes(expectedServices.audio) || expectedServices.audio.includes(serviceUuid)) {
        foundServices.audio = service;
      } else if (serviceUuid.includes(expectedServices.file) || expectedServices.file.includes(serviceUuid)) {
        foundServices.file = service;
      } else if (serviceUuid.includes(expectedServices.ota) || expectedServices.ota.includes(serviceUuid)) {
        foundServices.ota = service;
      }
    }

    // Require at least command service for basic compatibility
    const isCompatible = foundServices.command !== null;
    
    return {
      isCompatible,
      commandService: foundServices.command,
      audioService: foundServices.audio,
      fileService: foundServices.file,
      reason: isCompatible ? 'Compatible voice recorder' : 'Missing required command service (FFF9)',
    };
  }, []);

  // Set up device notifications
  const setupDeviceNotifications = useCallback(async (device: Device, commandService: any): Promise<void> => {
    try {
      const characteristics = await commandService.characteristics();
      console.log('Command service characteristics:', characteristics.map((c: any) => c.uuid));
      
      // Find notification characteristic
      const notifyChar = characteristics.find((c: any) => 
        c.uuid.toLowerCase().includes(BLE_CONSTANTS.CHARACTERISTICS.COMMAND_NOTIFY.toLowerCase()) ||
        c.isNotifiable
      );
      
      if (notifyChar) {
        console.log('Setting up notifications on:', notifyChar.uuid);
        
        await device.monitorCharacteristicForService(
          commandService.uuid,
          notifyChar.uuid,
          (error: BleError | null, characteristic: Characteristic | null) => {
            if (error) {
              console.error('Notification error:', error);
              return;
            }

            if (characteristic && characteristic.value) {
              try {
                const data = Buffer.from(characteristic.value, 'base64');
                console.log('Received voice recorder data:', Array.from(data));
                
                // Parse response according to protocol
                handleVoiceRecorderResponse(data);
                
              } catch (parseError) {
                console.error('Failed to parse voice recorder response:', parseError);
              }
            }
          }
        );
        
        console.log('✅ Voice recorder notifications set up successfully');
      } else {
        console.log('⚠️ No notification characteristic found');
      }
      
    } catch (error) {
      console.error('Failed to set up notifications:', error);
    }
  }, []);

  // Handle voice recorder responses
  const handleVoiceRecorderResponse = useCallback((data: Buffer): void => {
    if (data.length === 0) return;

    // Parse according to your protocol document
    console.log('Processing voice recorder response:', {
      length: data.length,
      data: Array.from(data),
      hex: data.toString('hex'),
    });

    // Update recording state based on response
    const command = data[0];
    if (command === RECORDING_COMMANDS.START_RECORDING) {
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isRecording: true, isPaused: false }
      }));
    } else if (command === RECORDING_COMMANDS.END_RECORDING) {
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isRecording: false, isPaused: false }
      }));
    } else if (command === RECORDING_COMMANDS.PAUSE_RECORDING) {
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isPaused: true }
      }));
    } else if (command === RECORDING_COMMANDS.RESUME_RECORDING) {
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isPaused: false }
      }));
    }
  }, []);

  // Stop scanning
  const stopScan = useCallback(() => {
    bleManager.stopDeviceScan();
    setState(prev => ({ ...prev, isScanning: false }));
    console.log('Scan stopped by user');
  }, [bleManager]);

  // Disconnect from device
  const disconnectDevice = useCallback(async (): Promise<void> => {
    if (state.connectedDevice) {
      try {
        await bleManager.cancelDeviceConnection(state.connectedDevice.id);
        setState(prev => ({
          ...prev,
          connectedDevice: null,
          discoveredDevices: prev.discoveredDevices.map(d => ({ ...d, isConnected: false })),
        }));
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  }, [bleManager, state.connectedDevice]);

  // Send command to device
  const sendCommand = useCallback(async (command: number, data: number[] = []): Promise<void> => {
    if (!state.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const device = await bleManager.connectToDevice(state.connectedDevice.id);
      const commandFrame = ProtocolHelpers.createCommandFrame(command, data);
      const base64Command = Buffer.from(commandFrame).toString('base64');
      
      await device.writeCharacteristicWithResponseForService(
        BLE_CONSTANTS.SERVICES.COMMAND,
        BLE_CONSTANTS.CHARACTERISTICS.COMMAND_WRITE,
        base64Command
      );
      
      console.log('Command sent successfully');
    } catch (error) {
      console.error('Failed to send command:', error);
      throw error;
    }
  }, [bleManager, state.connectedDevice]);

  // Recording control methods
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      await sendCommand(RECORDING_COMMANDS.START_RECORDING);
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isRecording: true, isPaused: false }
      }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [sendCommand]);

  const stopRecording = useCallback(async (): Promise<void> => {
    try {
      await sendCommand(RECORDING_COMMANDS.END_RECORDING);
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isRecording: false, isPaused: false }
      }));
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }, [sendCommand]);

  const pauseRecording = useCallback(async (): Promise<void> => {
    try {
      await sendCommand(RECORDING_COMMANDS.PAUSE_RECORDING);
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isPaused: true }
      }));
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }, [sendCommand]);

  const resumeRecording = useCallback(async (): Promise<void> => {
    try {
      await sendCommand(RECORDING_COMMANDS.RESUME_RECORDING);
      setState(prev => ({
        ...prev,
        recordingState: { ...prev.recordingState, isPaused: false }
      }));
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }, [sendCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
      if (state.connectedDevice) {
        bleManager.cancelDeviceConnection(state.connectedDevice.id);
      }
    };
  }, [bleManager, state.connectedDevice]);

  return {
    isScanning: state.isScanning,
    devices: state.discoveredDevices,
    connectedDevice: state.connectedDevice,
    isConnecting: state.isConnecting,
    connectionError: state.error,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
    sendCommand,
    recordingState: state.recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}; 