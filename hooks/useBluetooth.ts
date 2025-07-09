import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BleManager, Device, BleError, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Buffer } from 'buffer';
import { 
  RECORDING_COMMANDS,
  ProtocolHelpers,
  CONNECTION_CONFIG,
} from '../constants/BluetoothConstants';

// Types
interface BluetoothState {
  isScanning: boolean;
  error: string | null;
  discoveredDevices: DeviceInfo[];
  connectedDevice: DeviceInfo | null;
  isConnecting: boolean;
  bluetoothState: 'Unknown' | 'Resetting' | 'Unsupported' | 'Unauthorized' | 'PoweredOff' | 'PoweredOn';
  recordingState: RecordingState;
}

interface DeviceInfo {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  isRecording: boolean;
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

// Smart Microphone BLE Services and Characteristics
const MICROPHONE_BLE_CONSTANTS = {
  SERVICES: {
    AUDIO_CONTROL: '0011200a-2233-4455-6677-889912345678',
    AUDIO_DATA: 'e49a25f8-f69a-11e8-8eb2-f2801f1b9fd1',
  },
  DEVICE_NAME: 'Smart Microphone',
};

export const useBluetooth = (): BluetoothHook => {
  const [state, setState] = useState<BluetoothState>({
    isScanning: false,
    error: null,
    discoveredDevices: [],
    connectedDevice: null,
    isConnecting: false,
    bluetoothState: 'Unknown',
    recordingState: {
      isRecording: false,
      isPaused: false,
      duration: 0,
    },
  });

  const bleManager = useMemo(() => new BleManager(), []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true;
    }

    if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Bluetooth Permission',
          message: 'This app needs access to Bluetooth to connect to your Smart Microphone.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  }, []);

  const stopScan = useCallback(() => {
    bleManager.stopDeviceScan();
    setState(prev => ({ ...prev, isScanning: false }));
    console.log('Smart Microphone scan completed');
  }, [bleManager]);

  const startScan = useCallback(async (): Promise<void> => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.error('Bluetooth permissions not granted');
      setState(prev => ({ ...prev, error: 'Bluetooth permissions not granted' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isScanning: true, error: null }));
      
      console.log('Starting BLE scan for Smart Microphone devices...');
      
      // Clear previous devices
      setState(prev => ({ ...prev, discoveredDevices: [] }));

      // Start scanning for devices
      await bleManager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            setState(prev => ({ ...prev, isScanning: false, error: error.message }));
            return;
          }

          // Log all discovered devices for debugging
          if (device) {
            console.log('Found device:', {
              id: device.id,
              name: device.name,
              localName: device.localName,
              serviceUUIDs: device.serviceUUIDs,
              manufacturerData: device.manufacturerData,
              rssi: device.rssi,
            });

            // More lenient device name matching
            const deviceName = (device.name || device.localName || '').toLowerCase();
            const isTargetDevice = 
              deviceName.includes('smart') || 
              deviceName.includes('mic') ||
              deviceName.includes('audio') ||
              // Also check for known service UUIDs
              device.serviceUUIDs?.some(uuid => 
                uuid.toLowerCase() === MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_CONTROL.toLowerCase() ||
                uuid.toLowerCase() === MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_DATA.toLowerCase()
              );

            if (isTargetDevice) {
              console.log('Found potential Smart Microphone device:', device.name || device.localName);
              const deviceInfo: DeviceInfo = {
                id: device.id,
                name: device.name || device.localName || 'Smart Microphone',
                rssi: device.rssi || -100,
                isConnected: false,
                isRecording: false,
              };
              setState(prev => ({
                ...prev,
                discoveredDevices: [...prev.discoveredDevices.filter(d => d.id !== device.id), deviceInfo],
              }));
            }
          }
        },
      );

      // Stop scan after timeout
      setTimeout(() => {
        stopScan();
      }, CONNECTION_CONFIG.SCAN_DURATION);
    } catch (error) {
      console.error('Start scan error:', error);
      setState(prev => ({ ...prev, isScanning: false, error: (error as Error).message }));
    }
  }, [bleManager, requestPermissions, stopScan]);

  const connectToDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log(`Attempting to connect to Smart Microphone: ${deviceId}`);
      
      // Connect to device
      const device = await bleManager.connectToDevice(deviceId, {
        timeout: 10000,
        requestMTU: 517, // Request maximum MTU for better data transfer
        autoConnect: true,
      });
      
      console.log('Connected, discovering services...');
      await device.discoverAllServicesAndCharacteristics();
      
      // Get all services
      const services = await device.services();
      console.log('Discovered services:', services.map(s => s.uuid));

      // Validate required services
      const hasAudioControl = services.some(s => 
        s.uuid.toLowerCase() === MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_CONTROL.toLowerCase()
      );
      const hasAudioData = services.some(s => 
        s.uuid.toLowerCase() === MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_DATA.toLowerCase()
      );

      if (!hasAudioControl || !hasAudioData) {
        throw new Error('Device validation failed: Missing required audio services');
      }

      // Set connection priority to high for better audio streaming
      if (Platform.OS === 'android') {
        try {
          // @ts-ignore: Android-specific method
          await device.requestConnectionPriority(1); // HIGH
        } catch (error) {
          console.warn('Failed to set connection priority:', error);
        }
      }

      const deviceInfo: DeviceInfo = {
        id: device.id,
        name: device.name || 'Smart Microphone',
        rssi: device.rssi || -100,
        isConnected: true,
        isRecording: false,
      };

      setState(prev => ({
        ...prev,
        connectedDevice: deviceInfo,
        isConnecting: false,
      }));

      console.log('Successfully connected to Smart Microphone');
    } catch (error) {
      console.error('Connection error:', error);
      setState(prev => ({ ...prev, isConnecting: false, error: (error as Error).message }));
      throw error;
    }
  }, [bleManager]);

  // Helper function to identify voice recording devices
  const isVoiceRecorderDevice = useCallback((device: Device): boolean => {
    if (!device.serviceUUIDs) return false;

    const expectedServices = [
      MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_CONTROL.toLowerCase(),
      MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_DATA.toLowerCase(),
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

  // Enhanced service validation helper
  const validateVoiceRecorderServices = useCallback((services: any[]): {
    isCompatible: boolean;
    commandService?: any;
    audioService?: any;
    fileService?: any;
    reason?: string;
  } => {
    const expectedServices = {
      command: MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_CONTROL.toLowerCase(),
      audio: MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_DATA.toLowerCase(),
    };

    const foundServices = {
      command: null as any,
      audio: null as any,
    };

    // Check each service
    for (const service of services) {
      const serviceUuid = service.uuid.toLowerCase().replace(/-/g, '');
      
      if (serviceUuid.includes(expectedServices.command)) {
        foundServices.command = service;
      } else if (serviceUuid.includes(expectedServices.audio)) {
        foundServices.audio = service;
      }
    }

    // Require at least command and audio services for basic functionality
    const isCompatible = foundServices.command !== null && foundServices.audio !== null;
    
    return {
      isCompatible,
      commandService: foundServices.command,
      audioService: foundServices.audio,
      fileService: null, // No file service in this model
      reason: isCompatible ? 'Compatible Smart Microphone' : 'Missing required services (0011200a and e49a25f8)',
    };
  }, []);

  // Handle voice recorder responses
  const handleVoiceRecorderResponse = useCallback((data: Buffer): void => {
    if (data.length === 0) return;

    // Parse according to your protocol document
    console.log('Processing Smart Microphone response:', {
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

  // Enhanced notification setup
  const setupDeviceNotifications = useCallback(async (device: Device, commandService: any): Promise<void> => {
    try {
      const characteristics = await commandService.characteristics();
      console.log('Command service characteristics:', characteristics.map((c: any) => c.uuid));
      
      // Find notification characteristic
      const notifyChar = characteristics.find((c: any) => 
        c.uuid.toLowerCase().includes(MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_DATA.toLowerCase()) ||
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
                console.log('Received Smart Microphone data:', Array.from(data));
                
                // Parse response according to protocol
                handleVoiceRecorderResponse(data);
                
              } catch (parseError) {
                console.error('Failed to parse Smart Microphone response:', parseError);
              }
            }
          }
        );
        
        console.log('✅ Smart Microphone notifications set up successfully');
      } else {
        console.log('⚠️ No notification characteristic found');
      }
      
    } catch (error) {
      console.error('Failed to set up notifications:', error);
    }
  }, [handleVoiceRecorderResponse]);

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
        MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_CONTROL,
        MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_DATA,
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