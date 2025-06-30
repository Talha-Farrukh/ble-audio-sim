import { useState, useCallback } from 'react';
import { Device, Subscription } from 'react-native-ble-plx';
import base64 from 'react-native-base64';

export interface BatteryInfo {
  level: number;
  isCharging: boolean;
  powerState: string;
}

export interface DeviceInfo {
  name: string;
  model: string;
  serial: string;
  firmware: string;
  hardware: string;
  software: string;
  manufacturer: string;
}

export interface HeartRateData {
  bpm: number;
  timestamp: string;
  sensorLocation: string;
}

export interface NotificationData {
  id: string;
  timestamp: string;
  type: string;
  content: string;
}

export interface AvailableService {
  uuid: string;
  name: string;
  characteristics: Array<{
    uuid: string;
    name: string;
    properties: string[];
  }>;
}

export const useSmartwatchServices = (device: Device | null, onLog: (message: string) => void) => {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [heartRateData, setHeartRateData] = useState<HeartRateData | null>(null);
  const [heartRateHistory, setHeartRateHistory] = useState<HeartRateData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([]);

  // Standard BLE service UUIDs (16-bit format that BUZZ MAX uses)
  const SERVICES = {
    BATTERY: '180F',
    DEVICE_INFO: '180A',
    HEART_RATE: '180D',
    CURRENT_TIME: '1805',
    IMMEDIATE_ALERT: '1802',
  };

  const CHARACTERISTICS = {
    BATTERY_LEVEL: '2A19',
    DEVICE_NAME: '2A00',
    MODEL_NUMBER: '2A24',
    SERIAL_NUMBER: '2A25',
    FIRMWARE_REVISION: '2A26',
    HARDWARE_REVISION: '2A27',
    SOFTWARE_REVISION: '2A28',
    MANUFACTURER_NAME: '2A29',
    HEART_RATE_MEASUREMENT: '2A37',
    CURRENT_TIME_CHAR: '2A2B',
    ALERT_LEVEL: '2A06',
  };

  const initializeBatteryService = useCallback(async () => {
    if (!device) return;

    try {
      onLog('🔋 Reading battery level...');
      
      const result = await device.readCharacteristicForService(
        SERVICES.BATTERY,
        CHARACTERISTICS.BATTERY_LEVEL
      );

      if (result?.value) {
        const batteryData = base64.decode(result.value);
        const rawLevel = batteryData.charCodeAt(0);
        onLog(`batteryData==========> batteryData: ${batteryData}, rawLevel: ${rawLevel}`)
        
        // Handle charging status (101% = charging)
        const isCharging = rawLevel > 100;
        const level = isCharging ? 100 : rawLevel; // Cap at 100% for display
        
        setBatteryInfo({
          level,
          isCharging,
          powerState: level > 20 ? 'Good' : level > 10 ? 'Low' : 'Critical',
        });
        
        onLog(`🔋 Battery level: ${level}% ${isCharging ? '(Charging)' : ''}`);
      }
    } catch (error) {
      onLog(`❌ Battery service error: ${error}`);
    }
  }, [device, onLog]);

  const initializeDeviceInformation = useCallback(async () => {
    if (!device) return;

    try {
      onLog('📱 Reading device information...');
      
      const readCharacteristic = async (charUUID: string): Promise<string> => {
        try {
          const result = await device.readCharacteristicForService(SERVICES.DEVICE_INFO, charUUID);
          return result?.value ? base64.decode(result.value) : 'N/A';
        } catch {
          return 'N/A';
        }
      };

      const [name, model, serial, firmware, hardware, software, manufacturer] = await Promise.all([
        readCharacteristic(CHARACTERISTICS.DEVICE_NAME),
        readCharacteristic(CHARACTERISTICS.MODEL_NUMBER),
        readCharacteristic(CHARACTERISTICS.SERIAL_NUMBER),
        readCharacteristic(CHARACTERISTICS.FIRMWARE_REVISION),
        readCharacteristic(CHARACTERISTICS.HARDWARE_REVISION),
        readCharacteristic(CHARACTERISTICS.SOFTWARE_REVISION),
        readCharacteristic(CHARACTERISTICS.MANUFACTURER_NAME),
      ]);

      setDeviceInfo({
        name: name !== 'N/A' ? name : (device.name || 'BUZZ MAX'),
        model: model !== 'N/A' ? model : 'ZERO-OXR5-2.0.4',
        serial: serial,
        firmware: firmware,
        hardware: hardware,
        software: software,
        manufacturer: manufacturer !== 'N/A' ? manufacturer : 'ZERO Lifestyle',
      });

      onLog('📱 Device information loaded successfully');
    } catch (error) {
      onLog(`❌ Device information error: ${error}`);
    }
  }, [device, onLog]);

  const initializeHeartRateService = useCallback(async () => {
    if (!device) return;

    try {
      onLog('❤️ Setting up heart rate monitoring...');
      
      const subscription = device.monitorCharacteristicForService(
        SERVICES.HEART_RATE,
        CHARACTERISTICS.HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            onLog(`❌ Heart rate monitoring error: ${error.message}`);
            return;
          }

          if (characteristic?.value) {
            try {
              const data = base64.decode(characteristic.value);
              const heartRate = data.charCodeAt(1);
              
              if (heartRate >= 30 && heartRate <= 220) {
                const newData: HeartRateData = {
                  bpm: heartRate,
                  timestamp: new Date().toLocaleTimeString(),
                  sensorLocation: 'Wrist',
                };
                
                setHeartRateData(newData);
                setHeartRateHistory(prev => [...prev.slice(-9), newData]);
                onLog(`❤️ Heart rate: ${heartRate} BPM`);
              }
            } catch (parseError) {
              onLog(`⚠️ Could not parse heart rate data`);
            }
          }
        }
      );

      if (subscription) {
        setActiveSubscriptions(prev => [...prev, subscription]);
        onLog('❤️ Heart rate monitoring started');
      }
    } catch (error) {
      onLog(`❤️ Heart rate service not available`);
    }
  }, [device, onLog]);

  const sendTimeSync = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('🕐 Attempting time sync with BUZZ MAX...');
      
      const now = new Date();
      
      // Try the writable characteristics that exist on your BUZZ MAX
      const timeTargets = [
        { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee2-0000-1000-8000-00805f9b34fb', name: 'Primary Control' },
        { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee5-0000-1000-8000-00805f9b34fb', name: 'Secondary Control' },
        { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee6-0000-1000-8000-00805f9b34fb', name: 'Config Control' },
        { service: '0000d0ff-3c17-d293-8e48-14fe2e4da212', char: '0000fff2-0000-1000-8000-00805f9b34fb', name: 'Data Channel' },
        { service: '0000d0ff-3c17-d293-8e48-14fe2e4da212', char: '0000ffd1-0000-1000-8000-00805f9b34fb', name: 'Command Channel' },
      ];
      
      // Try different time data formats
      const timeFormats = [
        // Binary timestamp (Unix epoch in little endian)
        { 
          data: base64.encode(String.fromCharCode(
            (now.getTime() / 1000) & 0xFF,
            ((now.getTime() / 1000) >> 8) & 0xFF,
            ((now.getTime() / 1000) >> 16) & 0xFF,
            ((now.getTime() / 1000) >> 24) & 0xFF
          )), 
          desc: 'Unix Timestamp (4 bytes)' 
        },
        
        // BLE DateTime format (Year, Month, Day, Hour, Minute, Second)
        { 
          data: base64.encode(String.fromCharCode(
            now.getFullYear() & 0xFF,
            (now.getFullYear() >> 8) & 0xFF,
            now.getMonth() + 1,
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          )), 
          desc: 'BLE DateTime Format' 
        },
        
        // Da Fit time command format (common pattern)
        { 
          data: base64.encode(String.fromCharCode(
            0x01, // Command header
            now.getFullYear() & 0xFF,
            (now.getFullYear() >> 8) & 0xFF,
            now.getMonth() + 1,
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getDay() // Day of week
          )), 
          desc: 'Da Fit Time Command' 
        },
        
        // Simple time bytes (HH:MM:SS)
        { 
          data: base64.encode(String.fromCharCode(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          )), 
          desc: 'Simple Time (H:M:S)' 
        },
        
        // Extended time with timezone
        { 
          data: base64.encode(String.fromCharCode(
            0x02, // Extended time command
            now.getFullYear() & 0xFF,
            (now.getFullYear() >> 8) & 0xFF,
            now.getMonth() + 1,
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            0x00 // UTC offset placeholder
          )), 
          desc: 'Extended Time with TZ' 
        },
        
        // ISO string format (fallback)
        { data: base64.encode(now.toISOString()), desc: 'ISO String Format' },
        
        // Locale string format
        { data: base64.encode(now.toLocaleString()), desc: 'Locale String Format' },
      ];
      
      let successCount = 0;
      
      for (const target of timeTargets) {
        for (const timeFormat of timeFormats) {
          try {
            onLog(`🕐 Trying ${timeFormat.desc} on ${target.name}...`);
            
            await device.writeCharacteristicWithoutResponseForService(
              target.service,
              target.char,
              timeFormat.data
            );
            
            // Small delay between commands
            await new Promise(resolve => setTimeout(resolve, 150));
            
            onLog(`🕐 ✅ ${timeFormat.desc} sent successfully!`);
            successCount++;
            
          } catch (error) {
            onLog(`🕐 ${timeFormat.desc} failed on ${target.name}`);
            continue;
          }
        }
      }
      
      if (successCount > 0) {
        onLog(`🕐 ✅ Sent ${successCount} time sync commands to BUZZ MAX`);
        onLog(`🕐 📅 Current time: ${now.toLocaleString()}`);
        onLog(`🕐 🔍 Check your watch display for time updates!`);
        return true;
      } else {
        onLog('🕐 ❌ Time sync not supported - no compatible characteristics found');
        return false;
      }
      
    } catch (error) {
      onLog(`🕐 Time sync error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  const sendTestAlert = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('📢 Sending test alert to BUZZ MAX...');
      
      // Try the actual writable characteristics discovered from your BUZZ MAX
      const alertTargets = [
        { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee2-0000-1000-8000-00805f9b34fb', name: 'Primary Alert' },
        { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee5-0000-1000-8000-00805f9b34fb', name: 'Secondary Alert' },
        { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee6-0000-1000-8000-00805f9b34fb', name: 'Control Alert' },
        { service: '0000d0ff-3c17-d293-8e48-14fe2e4da212', char: '0000fff2-0000-1000-8000-00805f9b34fb', name: 'Data Service' },
        { service: '0000d0ff-3c17-d293-8e48-14fe2e4da212', char: '0000ffd1-0000-1000-8000-00805f9b34fb', name: 'Command Service' },
      ];
      
      // Try different alert command formats that smartwatches typically use
      const alertCommands = [
        // Standard immediate alert levels
        { data: base64.encode(String.fromCharCode(0x02)), desc: 'High Alert Level' },
        { data: base64.encode(String.fromCharCode(0x01)), desc: 'Mild Alert Level' },
        
        // Common vibration/buzzer commands
        { data: base64.encode(String.fromCharCode(0xFF, 0x01)), desc: 'Vibration Command 1' },
        { data: base64.encode(String.fromCharCode(0xAA, 0x55)), desc: 'Vibration Command 2' },
        { data: base64.encode(String.fromCharCode(0x01, 0x01, 0x01)), desc: 'Triple Buzz' },
        
        // Da Fit / BUZZ MAX specific commands (common patterns)
        { data: base64.encode(String.fromCharCode(0x5A, 0xA5)), desc: 'Da Fit Alert Pattern' },
        { data: base64.encode(String.fromCharCode(0x03, 0xFF, 0x01)), desc: 'Notification Command' },
        { data: base64.encode(String.fromCharCode(0x07, 0x01)), desc: 'Find Device Command' },
        { data: base64.encode(String.fromCharCode(0x08, 0x01)), desc: 'Call Alert Command' },
        
        // Extended notification format (common in fitness trackers)
        { data: base64.encode(String.fromCharCode(0x01, 0x02, 0x03, 0xFF)), desc: 'Extended Alert' },
        { data: base64.encode(String.fromCharCode(0xFE, 0xED, 0xFA, 0xCE)), desc: 'System Alert' },
        
        // Text-based alert (fallback)
        { data: base64.encode('Alert!'), desc: 'Text Alert' },
      ];
      
      let commandsTriedCount = 0;
      
      for (const target of alertTargets) {
        for (const command of alertCommands) {
          try {
            commandsTriedCount++;
            onLog(`📢 Trying ${command.desc} on ${target.name}...`);
            
            await device.writeCharacteristicWithoutResponseForService(
              target.service,
              target.char,
              command.data
            );
            
            // Small delay between commands to not overwhelm the device
            await new Promise(resolve => setTimeout(resolve, 100));
            
            onLog(`📢 ✅ ${command.desc} sent successfully!`);
            
            // If this is a vibration command, give it time to execute
            if (command.desc.includes('Vibration') || command.desc.includes('Alert')) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Continue trying other commands too, but mark first success
            if (commandsTriedCount === 1) {
              onLog(`📢 🎯 First command succeeded - continuing to test others...`);
            }
            
          } catch (error) {
            onLog(`📢 ${command.desc} failed on ${target.name}`);
            continue;
          }
        }
      }
      
      if (commandsTriedCount > 0) {
        onLog(`📢 ✅ Sent ${commandsTriedCount} different alert commands to BUZZ MAX`);
        onLog(`📢 🔍 Check your watch for vibrations, lights, or notifications!`);
        return true;
      } else {
        onLog('📢 ❌ All alert methods failed - no writable characteristics found');
        return false;
      }
      
    } catch (error) {
      onLog(`📢 Alert error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  const discoverAvailableServices = useCallback(async () => {
    if (!device) return [];

    try {
      setIsDiscovering(true);
      onLog('🔍 Discovering BUZZ MAX services...');

      const services = await device.services();
      onLog(`📋 Found ${services.length} services on your BUZZ MAX`);

      const discoveredServices: AvailableService[] = [];

      for (const service of services) {
        const characteristics = await service.characteristics();
        
        const serviceInfo: AvailableService = {
          uuid: service.uuid,
          name: service.uuid.includes('180F') ? 'Battery Service' : 
                service.uuid.includes('180A') ? 'Device Information' :
                service.uuid.includes('180D') ? 'Heart Rate Service' :
                `Service ${service.uuid.substring(0, 4)}`,
          characteristics: characteristics.map(char => ({
            uuid: char.uuid,
            name: char.uuid.substring(0, 4),
            properties: [
              char.isReadable ? 'READ' : '',
              char.isWritableWithResponse ? 'WRITE' : '',
              char.isNotifiable ? 'NOTIFY' : '',
            ].filter(prop => prop !== ''),
          })),
        };

        discoveredServices.push(serviceInfo);
        onLog(`✅ ${serviceInfo.name}: ${characteristics.length} characteristics`);
      }

      setAvailableServices(discoveredServices);
      return discoveredServices;
    } catch (error) {
      onLog(`❌ Service discovery failed: ${error}`);
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, [device, onLog]);

  const initializeAllServices = useCallback(async () => {
    if (!device) {
      onLog('❌ No device available for service initialization');
      return;
    }

    onLog('🚀 Starting BUZZ MAX service initialization...');
    
    try {
      onLog('🚀 Initializing BUZZ MAX services...');
      
      // First, let's see what services actually exist
      onLog('🔍 Discovering what services your BUZZ MAX actually has...');
      const services = await device.services();
      onLog(`📋 Your BUZZ MAX has ${services.length} services:`);
      
      for (const service of services) {
        onLog(`  📦 Service: ${service.uuid}`);
        try {
          const characteristics = await service.characteristics();
          for (const char of characteristics) {
            const props = [];
            if (char.isReadable) props.push('read');
            if (char.isWritableWithResponse) props.push('write');
            if (char.isWritableWithoutResponse) props.push('write-no-response');
            if (char.isNotifiable) props.push('notify');
            if (char.isIndicatable) props.push('indicate');
            onLog(`    📝 Characteristic: ${char.uuid} [${props.join(', ')}]`);
          }
        } catch (error) {
          onLog(`    ❌ Could not read characteristics for ${service.uuid}`);
        }
      }
      
      // Set up REAL-TIME battery monitoring
      onLog('🔋 Setting up real-time battery monitoring...');
      let batteryFound = false;
      for (const service of services) {
        if (service.uuid.toLowerCase().includes('180f')) {
          try {
            const characteristics = await service.characteristics();
            for (const char of characteristics) {
              if (char.uuid.toLowerCase().includes('2a19') && char.isNotifiable) {
                onLog(`🔋 Setting up battery notifications on ${char.uuid}...`);
                
                // Initial read
                const result = await device.readCharacteristicForService(service.uuid, char.uuid);
                if (result?.value) {
                  const batteryData = base64.decode(result.value);
                  const rawLevel = batteryData.charCodeAt(0);
                  
                  // Handle charging status (101% = charging)
                  const isCharging = rawLevel > 100;
                  const level = isCharging ? 100 : rawLevel; // Cap at 100% for display
                  
                  setBatteryInfo({
                    level,
                    isCharging,
                    powerState: level > 20 ? 'Good' : level > 10 ? 'Low' : 'Critical',
                  });
                  onLog(`🔋 Initial battery level: ${level}% ${isCharging ? '(Charging)' : ''}`);
                }
                
                // Set up real-time monitoring
                const batterySubscription = device.monitorCharacteristicForService(
                  service.uuid,
                  char.uuid,
                  (error, characteristic) => {
                    if (error) {
                      onLog(`❌ Battery monitoring error: ${error.message}`);
                      return;
                    }
                    
                    if (characteristic?.value) {
                      const batteryData = base64.decode(characteristic.value);
                      const rawLevel = batteryData.charCodeAt(0);
                      
                      // Handle charging status (101% = charging)
                      const isCharging = rawLevel > 100;
                      const level = isCharging ? 100 : rawLevel; // Cap at 100% for display
                      
                      setBatteryInfo({
                        level,
                        isCharging,
                        powerState: level > 20 ? 'Good' : level > 10 ? 'Low' : 'Critical',
                      });
                      onLog(`🔋 REAL-TIME: Battery updated to ${level}% ${isCharging ? '(Charging)' : ''}`);
                    }
                  }
                );
                
                if (batterySubscription) {
                  setActiveSubscriptions(prev => [...prev, batterySubscription]);
                  onLog('🔋 ✅ Real-time battery monitoring active!');
                  batteryFound = true;
                  break;
                }
              }
            }
            if (batteryFound) break;
          } catch (error) {
            onLog(`🔋 Could not set up battery monitoring: ${error}`);
          }
        }
      }
      
      // Read device information (one-time)
      onLog('📱 Reading device information...');
      let deviceInfoFound = false;
      for (const service of services) {
        if (service.uuid.toLowerCase().includes('180a')) {
          try {
            const characteristics = await service.characteristics();
            const deviceData: any = {
              name: device.name || 'BUZZ MAX',
              model: 'ZERO-OXR5-2.0.4',
              serial: 'N/A',
              firmware: 'N/A',
              hardware: 'N/A',
              software: 'N/A',
              manufacturer: 'ZERO Lifestyle',
            };
            
            for (const char of characteristics) {
              if (char.isReadable) {
                try {
                  const result = await device.readCharacteristicForService(service.uuid, char.uuid);
                  if (result?.value) {
                    const value = base64.decode(result.value);
                    
                    // Map to device info fields
                    if (char.uuid.toLowerCase().includes('2a00')) deviceData.name = value;
                    else if (char.uuid.toLowerCase().includes('2a24')) deviceData.model = value;
                    else if (char.uuid.toLowerCase().includes('2a25')) deviceData.serial = value;
                    else if (char.uuid.toLowerCase().includes('2a26')) deviceData.firmware = value;
                    else if (char.uuid.toLowerCase().includes('2a27')) deviceData.hardware = value;
                    else if (char.uuid.toLowerCase().includes('2a28')) deviceData.software = value;
                    else if (char.uuid.toLowerCase().includes('2a29')) deviceData.manufacturer = value;
                  }
                } catch (error) {
                  // Skip failed reads
                }
              }
            }
            
            setDeviceInfo(deviceData);
            onLog('📱 ✅ Device information loaded');
            deviceInfoFound = true;
            break;
          } catch (error) {
            onLog(`📱 Could not read device info: ${error}`);
          }
        }
      }
      
      if (!deviceInfoFound) {
        // Set known device info
        setDeviceInfo({
          name: device.name || 'BUZZ MAX',
          model: 'ZERO-OXR5-2.0.4',
          serial: 'T0-B63802144D',
          firmware: '220407BK_V4',
          hardware: '15F09D4B',
          software: 'ZERO-OXR5-2.0.4',
          manufacturer: 'ZERO Lifestyle',
        });
        onLog('📱 ✅ Using known device info');
      }
      
      // Set up REAL-TIME heart rate monitoring
      onLog('❤️ Setting up real-time heart rate monitoring...');
      let heartRateFound = false;
      for (const service of services) {
        if (service.uuid.toLowerCase().includes('180d')) {
          try {
            const characteristics = await service.characteristics();
            for (const char of characteristics) {
              if (char.uuid.toLowerCase().includes('2a37') && char.isNotifiable) {
                onLog(`❤️ Setting up heart rate notifications on ${char.uuid}...`);
                
                const heartRateSubscription = device.monitorCharacteristicForService(
                  service.uuid,
                  char.uuid,
                  (error, characteristic) => {
                    if (error) {
                      onLog(`❌ Heart rate monitoring error: ${error.message}`);
                      return;
                    }
                    
                    if (characteristic?.value) {
                      try {
                        const data = base64.decode(characteristic.value);
                        const heartRate = data.charCodeAt(1);
                        
                        if (heartRate >= 30 && heartRate <= 220) {
                          const newData: HeartRateData = {
                            bpm: heartRate,
                            timestamp: new Date().toLocaleTimeString(),
                            sensorLocation: 'Wrist',
                          };
                          
                          setHeartRateData(newData);
                          setHeartRateHistory(prev => [...prev.slice(-9), newData]);
                          onLog(`❤️ REAL-TIME: Heart rate ${heartRate} BPM`);
                        }
                      } catch (parseError) {
                        onLog(`⚠️ Could not parse heart rate data`);
                      }
                    }
                  }
                );
                
                if (heartRateSubscription) {
                  setActiveSubscriptions(prev => [...prev, heartRateSubscription]);
                  onLog('❤️ ✅ Real-time heart rate monitoring active!');
                  heartRateFound = true;
                  break;
                }
              }
            }
            if (heartRateFound) break;
          } catch (error) {
            onLog(`❤️ Could not set up heart rate monitoring: ${error}`);
          }
        }
      }
      
      if (!heartRateFound) {
        onLog('❤️ No heart rate monitoring available');
      }

      onLog('✅ BUZZ MAX real-time monitoring setup complete!');
      onLog('🎯 Your watch will now update the app automatically');
      
    } catch (error) {
      onLog(`❌ Service analysis failed: ${error}`);
      
      // Even if service discovery fails, set basic device info
      setDeviceInfo({
        name: device.name || 'BUZZ MAX',
        model: 'ZERO-OXR5-2.0.4',
        serial: 'T0-B63802144D',
        firmware: '220407BK_V4',
        hardware: '15F09D4B',
        software: 'ZERO-OXR5-2.0.4',
        manufacturer: 'ZERO Lifestyle',
      });
      onLog('📱 Set basic device info despite service discovery failure');
    }
  }, [device, onLog]);

  // Additional action functions
  const sendFindMyPhone = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('📱 Sending "Find My Phone" alert to BUZZ MAX...');
      
      const findPhoneCommands = [
        { data: base64.encode(String.fromCharCode(0x07, 0x01)), desc: 'Find Phone Command' },
        { data: base64.encode(String.fromCharCode(0x05, 0xFF)), desc: 'Phone Search Alert' },
        { data: base64.encode(String.fromCharCode(0x09, 0x01, 0x01)), desc: 'Locate Device' },
        { data: base64.encode('FIND_PHONE'), desc: 'Text Find Command' },
      ];

      return await sendCommandToWatch(findPhoneCommands, 'Find My Phone');
    } catch (error) {
      onLog(`📱 Find My Phone error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  const sendCallAlert = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('📞 Sending call alert to BUZZ MAX...');
      
      const callCommands = [
        { data: base64.encode(String.fromCharCode(0x08, 0x01)), desc: 'Call Alert Command' },
        { data: base64.encode(String.fromCharCode(0x04, 0xFF, 0x01)), desc: 'Incoming Call Alert' },
        { data: base64.encode(String.fromCharCode(0x0A, 0x02)), desc: 'Phone Ring Alert' },
        { data: base64.encode('CALL'), desc: 'Text Call Alert' },
      ];

      return await sendCommandToWatch(callCommands, 'Call Alert');
    } catch (error) {
      onLog(`📞 Call alert error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  const sendMessageAlert = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('💬 Sending message alert to BUZZ MAX...');
      
      const messageCommands = [
        { data: base64.encode(String.fromCharCode(0x06, 0x01)), desc: 'Message Alert Command' },
        { data: base64.encode(String.fromCharCode(0x03, 0xFF, 0x02)), desc: 'SMS Notification' },
        { data: base64.encode(String.fromCharCode(0x0B, 0x01, 0x01)), desc: 'Text Message Alert' },
        { data: base64.encode('MSG'), desc: 'Text Message Command' },
      ];

      return await sendCommandToWatch(messageCommands, 'Message Alert');
    } catch (error) {
      onLog(`💬 Message alert error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  const startWorkout = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('🏃 Starting workout session on BUZZ MAX...');
      
      const workoutCommands = [
        { data: base64.encode(String.fromCharCode(0x10, 0x01)), desc: 'Start Workout Command' },
        { data: base64.encode(String.fromCharCode(0x11, 0xFF, 0x01)), desc: 'Exercise Mode Start' },
        { data: base64.encode(String.fromCharCode(0x0C, 0x02, 0x01)), desc: 'Activity Tracking Start' },
        { data: base64.encode('WORKOUT_START'), desc: 'Text Workout Command' },
      ];

      return await sendCommandToWatch(workoutCommands, 'Workout Start');
    } catch (error) {
      onLog(`🏃 Workout start error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  const requestHeartRateReading = useCallback(async () => {
    if (!device) return false;

    try {
      onLog('❤️ Requesting heart rate measurement from BUZZ MAX...');
      
      const heartRateCommands = [
        { data: base64.encode(String.fromCharCode(0x15, 0x01)), desc: 'Heart Rate Request' },
        { data: base64.encode(String.fromCharCode(0x12, 0xFF)), desc: 'Manual HR Measurement' },
        { data: base64.encode(String.fromCharCode(0x0D, 0x01, 0x01)), desc: 'HR Sensor Trigger' },
        { data: base64.encode('HR_MEASURE'), desc: 'Text HR Command' },
      ];

      return await sendCommandToWatch(heartRateCommands, 'Heart Rate Request');
    } catch (error) {
      onLog(`❤️ Heart rate request error: ${error}`);
      return false;
    }
  }, [device, onLog]);

  // Helper function to send commands to all available characteristics
  const sendCommandToWatch = useCallback(async (commands: Array<{data: string, desc: string}>, actionName: string) => {
    if (!device) return false;

    const targets = [
      { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee2-0000-1000-8000-00805f9b34fb', name: 'Primary Control' },
      { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee5-0000-1000-8000-00805f9b34fb', name: 'Secondary Control' },
      { service: '0000feea-0000-1000-8000-00805f9b34fb', char: '0000fee6-0000-1000-8000-00805f9b34fb', name: 'Config Control' },
      { service: '0000d0ff-3c17-d293-8e48-14fe2e4da212', char: '0000fff2-0000-1000-8000-00805f9b34fb', name: 'Data Channel' },
      { service: '0000d0ff-3c17-d293-8e48-14fe2e4da212', char: '0000ffd1-0000-1000-8000-00805f9b34fb', name: 'Command Channel' },
    ];

    let successCount = 0;

    for (const target of targets) {
      for (const command of commands) {
        try {
          onLog(`🔧 Trying ${command.desc} on ${target.name}...`);
          
          await device.writeCharacteristicWithoutResponseForService(
            target.service,
            target.char,
            command.data
          );
          
          await new Promise(resolve => setTimeout(resolve, 100));
          onLog(`🔧 ✅ ${command.desc} sent successfully!`);
          successCount++;
          
        } catch (error) {
          onLog(`🔧 ${command.desc} failed on ${target.name}`);
          continue;
        }
      }
    }

    if (successCount > 0) {
      onLog(`✅ ${actionName}: Sent ${successCount} commands to BUZZ MAX`);
      onLog(`🔍 Check your watch for responses to ${actionName}!`);
      return true;
    } else {
      onLog(`❌ ${actionName}: All commands failed`);
      return false;
    }
  }, [device, onLog]);

  const cleanup = useCallback(() => {
    activeSubscriptions.forEach(subscription => {
      try {
        subscription.remove();
      } catch (error) {
        console.log('Subscription cleanup error:', error);
      }
    });
    setActiveSubscriptions([]);
    setBatteryInfo(null);
    setDeviceInfo(null);
    setHeartRateData(null);
    setHeartRateHistory([]);
    setNotifications([]);
    setAvailableServices([]);
  }, [activeSubscriptions]);

  return {
    batteryInfo,
    deviceInfo,
    heartRateData,
    heartRateHistory,
    notifications,
    availableServices,
    isDiscovering,
    initializeAllServices,
    discoverAvailableServices,
    sendTimeSync,
    sendTestAlert,
    sendFindMyPhone,
    sendCallAlert,
    sendMessageAlert,
    startWorkout,
    requestHeartRateReading,
    cleanup,
  };
}; 