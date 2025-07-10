import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BleManager as BleManagerClass, Device, BleError, Characteristic, State as BluetoothManagerState } from 'react-native-ble-plx';
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
  isConnecting: boolean;
  error: string | null;
  connectedDevice: DeviceInfo | null;
  discoveredDevices: DeviceInfo[];
  bluetoothState: BluetoothManagerState;
  recordingState: RecordingState;
  batteryState: {
    level: number;
    isCharging: boolean;
    lastUpdated: number;
  };
  deviceServices: {
    commandServiceUuid?: string;
    audioServiceUuid?: string;
    commandWriteCharUuid?: string;
    commandNotifyCharUuid?: string;
  };
}

export interface DeviceInfo {
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
  state: BluetoothState;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectFromDevice: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
}

// Smart Microphone BLE Services and Characteristics
const MICROPHONE_BLE_CONSTANTS = {
  SERVICES: {
    COMMAND: 'FFF9',  // Command service for recording control
    AUDIO_STREAM: 'FFF3', // Audio streaming service
  },
  CHARACTERISTICS: {
    COMMAND_WRITE: 'FFFA',  // Command write characteristic
    COMMAND_NOTIFY: 'FFFB', // Command notify characteristic
    AUDIO_STREAM_WRITE: 'FFF4', // Audio stream write
    AUDIO_STREAM_NOTIFY: 'FFF5', // Audio stream notify
  },
  PROTOCOL: {
    VERSION: [0x01, 0x00],  // 2 bytes version
    HEADER: [0x61, 0x69, 0x6d, 0x74, 0x2d, 0x30],  // 6 bytes header identifier
  },
  COMMANDS: {
    START_RECORDING: 0x61,  // Start real-time recording
    STOP_RECORDING: 0x62,   // End real-time recording
    PAUSE_RECORDING: 0x7F,  // Pause recording
    RESUME_RECORDING: 0x7E, // Resume recording
  },
};

// Helper function to construct command frames according to Voice Recorder Protocol v1.0.2
const constructCommandFrame = (command: number, data?: number[]) => {
  // Protocol specification exact values:
  // Protocol Version: 2 bytes [0x01, 0x00]
  // Header Identifier: 6 bytes [0x61, 0x69, 0x6d, 0x74, 0x2d, 0x30] = "aimt-0"
  const frame = [
    0x01, 0x00,                                    // Protocol Version (2 bytes)
    0x61, 0x69, 0x6d, 0x74, 0x2d, 0x30,          // Header Identifier (6 bytes)
    command,                                       // Command (1 byte)
    0x00,                                         // Error code (1 byte)
  ];

  if (data) {
    frame.push(...data);
  }

  console.log('🔧 Command frame construction:', {
    protocolVersion: '[0x01, 0x00]',
    headerIdentifier: '[0x61, 0x69, 0x6d, 0x74, 0x2d, 0x30] = "aimt-0"',
    command: '0x' + command.toString(16).padStart(2, '0'),
    errorCode: '0x00',
    data: data ? '[' + data.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ') + ']' : 'none',
    totalFrame: '[' + frame.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ') + ']'
  });

  return Buffer.from(frame);
};

export const useBluetooth = () => {
  // Initialize BleManager as a singleton using useRef
  const bleManagerRef = useRef<BleManagerClass | null>(null);
  
  // Initialize BleManager on first render
  useEffect(() => {
    bleManagerRef.current = new BleManagerClass();
    
    return () => {
      if (bleManagerRef.current) {
        bleManagerRef.current.destroy();
      }
    };
  }, []);

  const [state, setState] = useState<BluetoothState>({
    isScanning: false,
    isConnecting: false,
    error: null,
    connectedDevice: null,
    discoveredDevices: [],
    bluetoothState: BluetoothManagerState.Unknown,
    recordingState: {
      isRecording: false,
      isPaused: false,
      duration: 0
    },
    batteryState: {
      level: 0,
      isCharging: false,
      lastUpdated: 0
    },
    deviceServices: {}
  });

  // Add at the top level of the useBluetooth hook, before any other functions
  let deviceResponseResolver: ((value: unknown) => void) | null = null;

  const waitForDeviceResponse = () => new Promise((resolve) => {
    deviceResponseResolver = resolve;
    // Timeout after 5 seconds
    setTimeout(() => {
      if (deviceResponseResolver) {
        console.log('⚠️ Device response timeout');
        deviceResponseResolver(null);
        deviceResponseResolver = null;
      }
    }, 5000);
  });

  // Helper function to identify voice recording devices
  const filterSmartMicrophone = useCallback((device: Device) => {
    // Check device name
    const isNameMatch = device.name?.toLowerCase().includes('smart microphone');
    
    // Also check for known service UUIDs
    const hasKnownService = device.serviceUUIDs?.some(uuid => 
      uuid.toLowerCase() === MICROPHONE_BLE_CONSTANTS.SERVICES.COMMAND.toLowerCase() ||
      uuid.toLowerCase() === MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_STREAM.toLowerCase()
    );

    return isNameMatch || hasKnownService;
  }, []);

  // Define stopScan before it's used
  const stopScan = useCallback(() => {
    if (bleManagerRef.current) {
      bleManagerRef.current.stopDeviceScan();
      setState(prev => ({ ...prev, isScanning: false }));
      console.log('Smart Microphone scan completed');
    }
  }, []);

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

  const handleDiscoverDevice = useCallback((error: BleError | null, device: Device | null) => {
    if (error) {
      console.error('Scan error:', error);
      stopScan();
      setState(prev => ({ ...prev, error: 'Scan failed' }));
      return;
    }

    if (!device || !filterSmartMicrophone(device)) {
      return;
    }

    setState(prev => {
      // Check if device already exists
      const exists = prev.discoveredDevices.some(d => d.id === device.id);
      if (exists) {
        return prev;
      }

      const newDevice: DeviceInfo = {
        id: device.id,
        name: device.name || 'Unknown Device',
        rssi: device.rssi || -100,
        isConnected: false,
        isRecording: false,
      };

      return {
        ...prev,
        discoveredDevices: [...prev.discoveredDevices, newDevice]
      };
    });
  }, [filterSmartMicrophone, stopScan]);

  const handleCharacteristicUpdate = useCallback((error: BleError | null, characteristic: Characteristic | null) => {
    if (error) {
      console.error('Notification error:', error);
      return;
    }
    // Handle incoming data
    if (characteristic?.value) {
      const data = Buffer.from(characteristic.value, 'base64');
      console.log('Received data:', data);
    }
  }, []);

  const startScan = useCallback(async (): Promise<void> => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions || !bleManagerRef.current) {
        return;
      }

      setState(prev => ({ ...prev, isScanning: true }));
      
      console.log('Starting BLE scan for Smart Microphone devices...');
      
      // Clear previous devices
      setState(prev => ({ ...prev, discoveredDevices: [] }));

      // Start scanning for devices
      await bleManagerRef.current.startDeviceScan(
        null,
        { allowDuplicates: false },
        handleDiscoverDevice
      );

      // Stop scan after timeout
      setTimeout(() => {
        stopScan();
      }, CONNECTION_CONFIG.SCAN_DURATION);
    } catch (error) {
      console.error('Start scan error:', error);
      setState(prev => ({ ...prev, isScanning: false, error: (error as Error).message }));
    }
  }, [requestPermissions, stopScan, handleDiscoverDevice]);



  // Update the service validation in connectToDevice
  const connectToDevice = useCallback(async (deviceId: string): Promise<void> => {
    if (!bleManagerRef.current) {
      throw new Error('BLE Manager not initialized');
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      console.log(`Attempting to connect to Smart Microphone: ${deviceId}`);
      
      // Connect to device
      const device = await bleManagerRef.current.connectToDevice(deviceId, {
        timeout: 10000,
        requestMTU: 517,
        autoConnect: true,
      });
      
      console.log('Connected, discovering services...');
      await device.discoverAllServicesAndCharacteristics();
      
      // Get all services
      const services = await device.services();
      console.log('Discovered services:', services.map(s => s.uuid));
      
      // Log all characteristics for each service
      for (const service of services) {
        const characteristics = await device.characteristicsForService(service.uuid);
        console.log(`Characteristics for service ${service.uuid}:`, 
          characteristics.map(c => ({
            uuid: c.uuid,
            isWritableWithResponse: c.isWritableWithResponse,
            isWritableWithoutResponse: c.isWritableWithoutResponse,
            isNotifiable: c.isNotifiable,
            isReadable: c.isReadable
          }))
        );
      }

      // Find command and audio services using actual device UUIDs
      const commandService = services.find((s: any) => {
        const uuid = s.uuid.toLowerCase();
        return uuid === MICROPHONE_BLE_CONSTANTS.SERVICES.COMMAND.toLowerCase() ||
               uuid === '0011200a-2233-4455-6677-889912345678';
      });
      
      const audioService = services.find((s: any) => {
        const uuid = s.uuid.toLowerCase();
        return uuid === MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_STREAM.toLowerCase() ||
               uuid === 'e49a25f8-f69a-11e8-8eb2-f2801f1b9fd1';
      });
      
      if (!commandService || !audioService) {
        throw new Error('Device validation failed: Missing required audio control or streaming services');
      }

      console.log('Found required services:', {
        command: commandService.uuid,
        audio: audioService.uuid
      });

      // Set connection priority to high for better audio streaming
      if (Platform.OS === 'android') {
        try {
          // @ts-ignore: Android-specific method
          await device.requestConnectionPriority(1); // HIGH
        } catch (error) {
          console.warn('Failed to set connection priority:', error);
        }
      }

      // Set up device notifications for command responses inline
      try {
        const characteristics = await device.characteristicsForService(commandService.uuid);
        console.log('Command service characteristics:', characteristics.map((c: any) => c.uuid));
        
        // CRITICAL FIX: Use the correct characteristics based on device response pattern
        // Find write characteristic - we need one that supports writeWithoutResponse
        let writeChar = characteristics.find((c: any) => {
          const uuid = c.uuid.toLowerCase();
          return uuid === '0011202a-2233-4455-6677-889912345678' && c.isWritableWithoutResponse;
        });

        // If not found, try alternative write characteristic
        if (!writeChar) {
          writeChar = characteristics.find((c: any) => {
            const uuid = c.uuid.toLowerCase();
            return uuid === '0011204a-2233-4455-6677-889912345678' && c.isWritableWithoutResponse;
          });
        }

        // Find notification characteristic - we need one that supports notifications
        let notifyChar = characteristics.find((c: any) => {
          const uuid = c.uuid.toLowerCase();
          return uuid === '0011203a-2233-4455-6677-889912345678' && c.isNotifiable;
        });

        // If not found, try alternative notification characteristic
        if (!notifyChar) {
          notifyChar = characteristics.find((c: any) => {
            const uuid = c.uuid.toLowerCase();
            return uuid === '0011201a-2233-4455-6677-889912345678' && c.isNotifiable;
          });
        }

        console.log('Selected characteristics:', {
          write: writeChar?.uuid,
          writeProperties: {
            isWritableWithResponse: writeChar?.isWritableWithResponse,
            isWritableWithoutResponse: writeChar?.isWritableWithoutResponse,
            isNotifiable: writeChar?.isNotifiable
          },
          notify: notifyChar?.uuid,
          notifyProperties: {
            isNotifiable: notifyChar?.isNotifiable,
            isWritable: notifyChar?.isWritableWithoutResponse || notifyChar?.isWritableWithResponse
          }
        });

        if (!writeChar || !notifyChar) {
          throw new Error('Required characteristics not found');
        }

        // Store service UUIDs for later use including audio service
        setState(prev => ({
          ...prev,
          deviceServices: {
            commandServiceUuid: commandService.uuid,
            audioServiceUuid: audioService.uuid,
            commandWriteCharUuid: writeChar.uuid,
            commandNotifyCharUuid: notifyChar.uuid,
          }
        }));
        
                // CRITICAL FIX: Set up notifications on the WRITE characteristic that also has notify capability
        const writeNotifyChar = writeChar.isNotifiable ? writeChar : notifyChar;
        console.log('🔔 Setting up PRIMARY notification on WRITE+NOTIFY characteristic:', writeNotifyChar.uuid);

        // Set up a Promise to wait for device response
        // let deviceResponseResolver: ((value: unknown) => void) | null = null; // Moved to top level
        // const waitForDeviceResponse = () => new Promise((resolve) => { // Moved to top level
        //   deviceResponseResolver = resolve;
        //   // Timeout after 5 seconds
        //   setTimeout(() => {
        //     if (deviceResponseResolver) {
        //       console.log('⚠️ Device response timeout');
        //       deviceResponseResolver(null);
        //       deviceResponseResolver = null;
        //     }
        //   }, 5000);
        // });

        // Set up notifications on the NOTIFICATION characteristic (not the write one)
        console.log('🔔 Setting up notifications on characteristic:', notifyChar.uuid);

        // Set up a Promise to wait for device response
        deviceResponseResolver = null;

        await device.monitorCharacteristicForService(
          commandService.uuid,
          notifyChar.uuid,  // Use the notification characteristic
          (error: BleError | null, characteristic: Characteristic | null) => {
            if (error) {
              console.error('❌ Notification error:', error);
              if (deviceResponseResolver) {
                deviceResponseResolver(null);
                deviceResponseResolver = null;
              }
              return;
            }

            if (characteristic && characteristic.value) {
              console.log('📨 Notification received:', {
                characteristic: characteristic.uuid,
                value: characteristic.value
              });

              try {
                const data = Buffer.from(characteristic.value, 'base64');
                console.log('📨 Parsed data:', {
                  hex: data.toString('hex'),
                  bytes: Array.from(data),
                  ascii: data.toString('ascii')
                });

                // Handle different types of device responses
                if (data.length > 0) {
                  const command = data[8]; // Command byte is at index 8
                  console.log('📨 Command byte:', '0x' + command.toString(16));

                  if (data.length >= 10) {
                    const errorCode = data[9];
                    if (errorCode !== 0x00) {
                      console.error('❌ Error code:', '0x' + errorCode.toString(16));
                      if (deviceResponseResolver) {
                        deviceResponseResolver(false);
                        deviceResponseResolver = null;
                      }
                      return;
                    }
                  }

                  switch(command) {
                    case 0x6E: // Battery level response
                      if (data.length >= 12) {
                        const battery = data[10];
                        const charging = data[11];
                        console.log(`🔋 Battery: ${battery}%, Charging: ${charging === 1}`);
                        setState(prev => ({
                          ...prev,
                          batteryState: {
                            level: battery,
                            isCharging: charging === 1,
                            lastUpdated: Date.now()
                          }
                        }));
                        if (deviceResponseResolver) {
                          deviceResponseResolver(true);
                          deviceResponseResolver = null;
                        }
                      }
                      break;

                    case 0xaa: // Battery warning
                      if (data.length >= 3) {
                        const battery = data[data.length - 2];
                        const charging = data[data.length - 1];
                        console.log(`🔋 Low Battery Warning: ${battery}%, Charging: ${charging === 1}`);
                        setState(prev => ({
                          ...prev,
                          batteryState: {
                            level: battery,
                            isCharging: charging === 1,
                            lastUpdated: Date.now()
                          }
                        }));
                        if (deviceResponseResolver) {
                          deviceResponseResolver(true);
                          deviceResponseResolver = null;
                        }
                      }
                      break;

                    case MICROPHONE_BLE_CONSTANTS.COMMANDS.START_RECORDING:
                      console.log('🎙️ Recording started');
                      setState(prev => ({
                        ...prev,
                        recordingState: { 
                          ...prev.recordingState, 
                          isRecording: true, 
                          isPaused: false 
                        }
                      }));
                      if (deviceResponseResolver) {
                        deviceResponseResolver(true);
                        deviceResponseResolver = null;
                      }
                      break;

                    default:
                      console.log('📨 Other command response:', '0x' + command.toString(16));
                      if (deviceResponseResolver) {
                        deviceResponseResolver(true);
                        deviceResponseResolver = null;
                      }
                  }
                }
              } catch (error) {
                console.error('Failed to parse notification:', error);
                if (deviceResponseResolver) {
                  deviceResponseResolver(false);
                  deviceResponseResolver = null;
                }
              }
            }
          }
        );

        // ALSO monitor ALL other notification characteristics to debug
        const allNotifyChars = characteristics.filter(c => c.isNotifiable);
        console.log('🔔 All notifiable characteristics:', allNotifyChars.map(c => c.uuid));
        
        for (const char of allNotifyChars) {
          if (char.uuid !== notifyChar.uuid) {
            console.log('🔔 Setting up DEBUG notification on:', char.uuid);
            try {
              await device.monitorCharacteristicForService(
                commandService.uuid,
                char.uuid,
                (error: BleError | null, characteristic: Characteristic | null) => {
                  if (error) {
                    console.error(`❌ DEBUG notification error on ${char.uuid}:`, error);
                    return;
                  }
                  if (characteristic && characteristic.value) {
                    const data = Buffer.from(characteristic.value, 'base64');
                    console.log(`📨 DEBUG notification from ${char.uuid}:`, {
                      bytes: Array.from(data),
                      hex: data.toString('hex')
                    });
                  }
                }
              );
            } catch (debugError) {
              console.warn(`⚠️ Could not set up debug monitoring on ${char.uuid}:`, debugError);
            }
          }
        }
        
                console.log('✅ Smart Microphone notifications set up successfully');
        
      } catch (notificationError) {
        console.error('Failed to set up notifications:', notificationError);
        throw notificationError;
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
        error: null
      }));

      console.log('Successfully connected to Smart Microphone');
        console.log('✅ Device ready - using correct characteristics that responded!');
    } catch (error) {
      console.error('Connection error:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
      throw error;
    }
  }, []);

  // Helper function to identify voice recording devices
  const isVoiceRecorderDevice = useCallback((device: Device): boolean => {
    if (!device.serviceUUIDs) return false;

    const expectedServices = [
      MICROPHONE_BLE_CONSTANTS.SERVICES.COMMAND.toLowerCase(),
      MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_STREAM.toLowerCase(),
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
    reason?: string;
  } => {
    const expectedServices = {
      control: MICROPHONE_BLE_CONSTANTS.SERVICES.COMMAND.toLowerCase(),
      audio: MICROPHONE_BLE_CONSTANTS.SERVICES.AUDIO_STREAM.toLowerCase(),
    };

    const foundServices = {
      control: null as any,
      audio: null as any,
    };

    // Check each service
    for (const service of services) {
      const serviceUuid = service.uuid.toLowerCase();
      if (serviceUuid === expectedServices.control) {
        foundServices.control = service;
      } else if (serviceUuid === expectedServices.audio) {
        foundServices.audio = service;
      }
    }

    // Both services are required
    const isCompatible = foundServices.control !== null && foundServices.audio !== null;

    return {
      isCompatible,
      commandService: foundServices.control,
      audioService: foundServices.audio,
      reason: isCompatible ? undefined : 'Missing required audio services',
    };
  }, []);



  // Disconnect from device
  const disconnectDevice = useCallback(async (): Promise<void> => {
    if (state.connectedDevice) {
      try {
        if (bleManagerRef.current) {
          await bleManagerRef.current.cancelDeviceConnection(state.connectedDevice.id);
        }
        setState(prev => ({
          ...prev,
          connectedDevice: null,
          discoveredDevices: prev.discoveredDevices.map(d => ({ ...d, isConnected: false })),
        }));
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  }, [state.connectedDevice]);



  // Recording timer
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const updateRecordingDuration = useCallback(() => {
    setState(prev => ({
      ...prev,
      recordingState: {
        ...prev.recordingState,
        duration: prev.recordingState.duration + 1
      }
    }));
  }, []);

  const startRecordingTimer = useCallback(() => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    recordingTimer.current = setInterval(updateRecordingDuration, 1000);
  }, [updateRecordingDuration]);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  }, []);

  // Update the sendCommandAndWaitForResponse function
  const sendCommandAndWaitForResponse = useCallback(async (device: Device, command: number, data?: number[]) => {
    const commandFrame = constructCommandFrame(command, data);
    console.log(`Sending command: 0x${command.toString(16)}`, {
      data: data ? data.map(b => '0x' + b.toString(16)).join(' ') : 'none',
      frame: Array.from(commandFrame).map(b => '0x' + b.toString(16)).join(' ')
    });
    
    try {
      // Always use writeWithoutResponse as that's what the characteristic supports
      await device.writeCharacteristicWithoutResponseForService(
        state.deviceServices.commandServiceUuid!,
        state.deviceServices.commandWriteCharUuid!,
        commandFrame.toString('base64')
      );
      
      // Wait for response with timeout
      const response = await waitForDeviceResponse();
      if (response === null) {
        console.log(`Command 0x${command.toString(16)} timed out`);
        return false;
      }
      
      console.log(`Command 0x${command.toString(16)} completed:`, response);
      return response;
    } catch (error) {
      console.error(`Failed to send command 0x${command.toString(16)}:`, error);
      return false;
    }
  }, [state.deviceServices, waitForDeviceResponse]);

  // Update startRecording function
  const startRecording = useCallback(async () => {
    if (!state.connectedDevice || !bleManagerRef.current || !state.deviceServices.commandServiceUuid || !state.deviceServices.commandWriteCharUuid) {
      setState(prev => ({ ...prev, error: 'Device not ready' }));
      return;
    }

    try {
      const device = await bleManagerRef.current.devices([state.connectedDevice.id]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      console.log('Starting device initialization sequence...');

      // 1. Check battery level
      const batteryResponse = await sendCommandAndWaitForResponse(device[0], 0x6E);
      if (!batteryResponse) {
        console.error('Failed to get battery status');
        return;
      }

      // Check if battery is too low
      if (state.batteryState.level < 10) {
        setState(prev => ({ ...prev, error: 'Battery too low to start recording' }));
        return;
      }

      // 2. Get device status
      const statusResponse = await sendCommandAndWaitForResponse(device[0], 0x71);
      if (!statusResponse) {
        console.error('Failed to get device status');
        return;
      }

      // 3. Sync time with device
      const timestamp = Math.floor(Date.now() / 1000);
      const timeBytes = [
        (timestamp >> 24) & 0xFF,
        (timestamp >> 16) & 0xFF,
        (timestamp >> 8) & 0xFF,
        timestamp & 0xFF,
        12 // UTC+12 timezone
      ];
      const timeResponse = await sendCommandAndWaitForResponse(device[0], 0x69, timeBytes);
      if (!timeResponse) {
        console.error('Failed to sync time');
        return;
      }

      // 4. Start recording
      const sessionId = Math.floor(Date.now() / 1000);
      const sessionIdBytes = [
        (sessionId >> 24) & 0xFF,
        (sessionId >> 16) & 0xFF,
        (sessionId >> 8) & 0xFF,
        sessionId & 0xFF,
      ];
      
      // Try both save flags
      const saveFlagOptions = [0x00, 0x01];
      let recordingStarted = false;

      for (const saveFlag of saveFlagOptions) {
        console.log('Trying to start recording with save flag:', saveFlag);
        const recordResponse = await sendCommandAndWaitForResponse(
          device[0],
          MICROPHONE_BLE_CONSTANTS.COMMANDS.START_RECORDING,
          [...sessionIdBytes, saveFlag]
        );

        if (recordResponse) {
          recordingStarted = true;
          console.log('Recording started successfully with save flag:', saveFlag);
          break;
        }
      }

      if (!recordingStarted) {
        setState(prev => ({ ...prev, error: 'Failed to start recording' }));
      }
    } catch (error) {
      console.error('Start recording error:', error);
      setState(prev => ({ ...prev, error: 'Failed to start recording' }));
    }
  }, [state.connectedDevice, state.deviceServices, state.batteryState.level, sendCommandAndWaitForResponse]);

  const stopRecording = useCallback(async () => {
    if (!state.connectedDevice || !state.recordingState.isRecording) {
      return;
    }

    if (!bleManagerRef.current) {
      throw new Error('BLE Manager not initialized');
    }

    if (!state.deviceServices.commandServiceUuid || !state.deviceServices.commandWriteCharUuid) {
      setState(prev => ({ ...prev, error: 'Device services not ready' }));
      return;
    }

    try {
      const device = await bleManagerRef.current.devices([state.connectedDevice.id]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      console.log('Using service:', state.deviceServices.commandServiceUuid, 'and characteristic:', state.deviceServices.commandWriteCharUuid);

      const commandFrame = constructCommandFrame(MICROPHONE_BLE_CONSTANTS.COMMANDS.STOP_RECORDING);
      console.log('Constructed command frame:', {
        protocolVersion: '0x' + MICROPHONE_BLE_CONSTANTS.PROTOCOL.VERSION.map(b => b.toString(16).padStart(2, '0')).join(' 0x'),
        headerIdentifier: '0x' + MICROPHONE_BLE_CONSTANTS.PROTOCOL.HEADER.map(b => b.toString(16).padStart(2, '0')).join(' 0x'),
        commandIndicator: '0x' + MICROPHONE_BLE_CONSTANTS.COMMANDS.STOP_RECORDING.toString(16),
        errorCode: '0x00',
        data: 'none',
        frame: '0x' + Array.from(commandFrame).map(b => b.toString(16).padStart(2, '0')).join(' 0x')
      });

      // Try both write methods
      console.log('🔧 Trying writeWithoutResponse first...');
      try {
        await device[0].writeCharacteristicWithoutResponseForService(
          state.deviceServices.commandServiceUuid,
          state.deviceServices.commandWriteCharUuid,
          commandFrame.toString('base64')
        );
        console.log('✅ Stop recording command sent (writeWithoutResponse)');
      } catch (error) {
        console.log('⚠️ writeWithoutResponse failed, trying writeWithResponse...');
      await device[0].writeCharacteristicWithResponseForService(
          state.deviceServices.commandServiceUuid,
          state.deviceServices.commandWriteCharUuid,
          commandFrame.toString('base64')
      );
        console.log('✅ Stop recording command sent (writeWithResponse)');
      }
      // Note: Recording state will be updated when device confirms via notification
    } catch (error) {
      console.error('Stop recording error:', error);
      setState(prev => ({ ...prev, error: 'Failed to stop recording' }));
    }
  }, [state.connectedDevice, state.deviceServices, state.recordingState.isRecording]);

  const pauseRecording = useCallback(async () => {
    if (!state.connectedDevice || !state.recordingState.isRecording || state.recordingState.isPaused) {
      return;
    }

    if (!bleManagerRef.current) {
      throw new Error('BLE Manager not initialized');
    }

    if (!state.deviceServices.commandServiceUuid || !state.deviceServices.commandWriteCharUuid) {
      setState(prev => ({ ...prev, error: 'Device services not ready' }));
      return;
    }

    try {
      const device = await bleManagerRef.current.devices([state.connectedDevice.id]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      // Try both write methods
      const pauseFrame = constructCommandFrame(MICROPHONE_BLE_CONSTANTS.COMMANDS.PAUSE_RECORDING);
      try {
        await device[0].writeCharacteristicWithoutResponseForService(
          state.deviceServices.commandServiceUuid,
          state.deviceServices.commandWriteCharUuid,
          pauseFrame.toString('base64')
        );
        console.log('✅ Pause recording command sent (writeWithoutResponse)');
      } catch (error) {
        console.log('⚠️ writeWithoutResponse failed, trying writeWithResponse...');
      await device[0].writeCharacteristicWithResponseForService(
          state.deviceServices.commandServiceUuid,
          state.deviceServices.commandWriteCharUuid,
          pauseFrame.toString('base64')
      );
        console.log('✅ Pause recording command sent (writeWithResponse)');
      }
      // Note: Recording state will be updated when device confirms via notification
    } catch (error) {
      console.error('Pause recording error:', error);
      setState(prev => ({ ...prev, error: 'Failed to pause recording' }));
    }
  }, [state.connectedDevice, state.deviceServices, state.recordingState]);

  const resumeRecording = useCallback(async () => {
    if (!state.connectedDevice || !state.recordingState.isRecording || !state.recordingState.isPaused) {
      return;
    }

    if (!bleManagerRef.current) {
      throw new Error('BLE Manager not initialized');
    }

    if (!state.deviceServices.commandServiceUuid || !state.deviceServices.commandWriteCharUuid) {
      setState(prev => ({ ...prev, error: 'Device services not ready' }));
      return;
    }

    try {
      const device = await bleManagerRef.current.devices([state.connectedDevice.id]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      // Try both write methods
      const resumeFrame = constructCommandFrame(MICROPHONE_BLE_CONSTANTS.COMMANDS.RESUME_RECORDING);
      try {
        await device[0].writeCharacteristicWithoutResponseForService(
          state.deviceServices.commandServiceUuid,
          state.deviceServices.commandWriteCharUuid,
          resumeFrame.toString('base64')
        );
        console.log('✅ Resume recording command sent (writeWithoutResponse)');
      } catch (error) {
        console.log('⚠️ writeWithoutResponse failed, trying writeWithResponse...');
      await device[0].writeCharacteristicWithResponseForService(
          state.deviceServices.commandServiceUuid,
          state.deviceServices.commandWriteCharUuid,
          resumeFrame.toString('base64')
      );
        console.log('✅ Resume recording command sent (writeWithResponse)');
      }
      // Note: Recording state will be updated when device confirms via notification
    } catch (error) {
      console.error('Resume recording error:', error);
      setState(prev => ({ ...prev, error: 'Failed to resume recording' }));
    }
  }, [state.connectedDevice, state.deviceServices, state.recordingState]);

  // Add after other useRef declarations
  const batteryCheckTimer = useRef<NodeJS.Timeout | null>(null);

  // Add this new function
  const checkBatteryLevel = useCallback(async () => {
    if (!state.connectedDevice || !bleManagerRef.current || !state.deviceServices.commandServiceUuid || !state.deviceServices.commandWriteCharUuid) {
      return;
    }

    try {
      const device = await bleManagerRef.current.devices([state.connectedDevice.id]);
      if (device.length === 0) return;

      const batteryFrame = constructCommandFrame(0x6E);
      await device[0].writeCharacteristicWithoutResponseForService(
        state.deviceServices.commandServiceUuid,
        state.deviceServices.commandWriteCharUuid,
        batteryFrame.toString('base64')
      );
    } catch (error) {
      console.error('Battery check failed:', error);
    }
  }, [state.connectedDevice, state.deviceServices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bleManagerRef.current) {
        bleManagerRef.current.stopDeviceScan();
      }
      if (state.connectedDevice) {
        if (bleManagerRef.current) {
          bleManagerRef.current.cancelDeviceConnection(state.connectedDevice.id);
        }
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (batteryCheckTimer.current) {
        clearInterval(batteryCheckTimer.current);
      }
    };
  }, [state.connectedDevice]);

  const disconnectFromDevice = useCallback(async () => {
    if (!state.connectedDevice) return;

    if (!bleManagerRef.current) {
      throw new Error('BLE Manager not initialized');
    }

    try {
      const device = await bleManagerRef.current.devices([state.connectedDevice.id]);
      if (device.length > 0) {
        await device[0].cancelConnection();
      }
      setState(prev => ({ 
        ...prev, 
        connectedDevice: null,
        deviceServices: {} // Clear stored services
      }));
    } catch (error) {
      console.error('Disconnect error:', error);
      setState(prev => ({ ...prev, error: 'Failed to disconnect from device' }));
    }
  }, [state.connectedDevice]);

  return {
    state,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}; 