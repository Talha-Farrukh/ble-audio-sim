import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Device, BleManager } from 'react-native-ble-plx';
import { SMARTWATCH_FILTER_CRITERIA } from '../constants/BluetoothConstants';

export interface SmartWatchDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  services?: string[];
  manufacturerData?: string;
  isConnectable?: boolean;
}

interface SmartwatchScannerProps {
  manager: BleManager;
  isPermissionGranted: boolean;
  bluetoothState: string;
  onDeviceSelect: (deviceId: string) => void;
  onLog: (message: string) => void;
  isConnecting: boolean;
}

interface FoundDevice {
  id: string;
  name: string;
  rssi: number;
  manufacturerData?: string;
}

export const SmartwatchScanner: React.FC<SmartwatchScannerProps> = ({
  manager,
  isPermissionGranted,
  bluetoothState,
  onDeviceSelect,
  onLog,
  isConnecting,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<FoundDevice[]>([]);
  const [scanDuration, setScanDuration] = useState(0);

  // Filter for relevant smartwatch devices only
  const isRelevantDevice = (device: Device): boolean => {
    const name = device.name?.toUpperCase() || '';
    const localName = device.localName?.toUpperCase() || '';
    
    // Priority devices - show these first
    const priorityKeywords = [
      'BUZZ MAX', 'BUZZ', 'ZERO', 'DA FIT'
    ];
    
    // Secondary relevant devices
    const relevantKeywords = [
      'WATCH', 'BAND', 'FIT', 'SMART', 'HEART', 'HEALTH',
      'XIAOMI', 'AMAZFIT', 'GARMIN', 'FITBIT', 'POLAR',
      'HUAWEI', 'SAMSUNG', 'APPLE', 'NORDIC'
    ];
    
    // Check if device name contains priority keywords
    const hasPriorityKeyword = priorityKeywords.some(keyword => 
      name.includes(keyword) || localName.includes(keyword)
    );
    
    // Check if device name contains relevant keywords
    const hasRelevantKeyword = relevantKeywords.some(keyword => 
      name.includes(keyword) || localName.includes(keyword)
    );
    
    // Show devices with names (not just MAC addresses) that match our criteria
    const hasValidName = Boolean(device.name && device.name.length > 2 && 
      !device.name.match(/^[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}$/i));
    
    return (hasPriorityKeyword || (hasRelevantKeyword && hasValidName)) && (device.rssi ?? -100) > -90;
  };

  const getDeviceDisplayName = (device: Device): string => {
    const name = device.name || device.localName || 'Unknown Device';
    
    // Special handling for BUZZ MAX
    if (name.toUpperCase().includes('BUZZ MAX')) {
      return `🎯 ${name}`;
    }
    
    // Mark other fitness/health devices
    if (name.toUpperCase().includes('WATCH') || 
        name.toUpperCase().includes('BAND') || 
        name.toUpperCase().includes('FIT')) {
      return `⌚ ${name}`;
    }
    
    return `📱 ${name}`;
  };

  useEffect(() => {
    let scanTimer: NodeJS.Timeout;
    let durationTimer: NodeJS.Timeout;

    if (isScanning) {
      // Auto-stop scan after 15 seconds
      scanTimer = setTimeout(() => {
        stopScan();
      }, 15000);

      // Update scan duration every second
      durationTimer = setInterval(() => {
        setScanDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (scanTimer) clearTimeout(scanTimer);
      if (durationTimer) clearInterval(durationTimer);
    };
  }, [isScanning]);

  const startScan = async () => {
    if (!isPermissionGranted || bluetoothState !== 'PoweredOn') {
      Alert.alert(
        'Cannot Scan',
        'Please ensure Bluetooth is enabled and permissions are granted.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    setFoundDevices([]);
    setScanDuration(0);
    
    onLog('🔍 Scanning for BUZZ MAX and compatible smartwatches...');

    try {
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          onLog(`❌ Scan error: ${error.message}`);
          setIsScanning(false);
          return;
        }

        if (device && isRelevantDevice(device)) {
                     const deviceInfo: FoundDevice = {
             id: device.id,
             name: getDeviceDisplayName(device),
             rssi: device.rssi || -100,
             manufacturerData: device.manufacturerData || undefined
           };

          setFoundDevices(prevDevices => {
            // Check if device already exists
            const existingIndex = prevDevices.findIndex(d => d.id === device.id);
            
            if (existingIndex >= 0) {
              // Update existing device with better RSSI if available
              const updated = [...prevDevices];
              if (device.rssi && device.rssi > updated[existingIndex].rssi) {
                updated[existingIndex] = deviceInfo;
              }
              return updated;
            } else {
              // Add new device, sort by RSSI (stronger signal first)
              const newList = [...prevDevices, deviceInfo].sort((a, b) => {
                // BUZZ MAX devices first
                const aIsBuzz = a.name.includes('BUZZ MAX');
                const bIsBuzz = b.name.includes('BUZZ MAX');
                if (aIsBuzz && !bIsBuzz) return -1;
                if (!aIsBuzz && bIsBuzz) return 1;
                
                // Then by signal strength
                return b.rssi - a.rssi;
              });
              
              return newList;
            }
          });

          // Log only BUZZ MAX devices or when we first find a relevant device
          if (device.name?.toUpperCase().includes('BUZZ MAX')) {
            onLog(`🎯 Found BUZZ MAX: ${device.name} (${device.id}) RSSI: ${device.rssi}`);
          }
        }
      });
    } catch (error) {
      onLog(`❌ Failed to start scan: ${error}`);
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
    setScanDuration(0);
    onLog(`🛑 Scan stopped. Found ${foundDevices.length} compatible devices`);
  };

  const handleDeviceSelect = (deviceId: string) => {
    if (isScanning) {
      stopScan();
    }
    onDeviceSelect(deviceId);
  };

  const canScan = isPermissionGranted && bluetoothState === 'PoweredOn' && !isConnecting;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 BUZZ MAX Scanner</Text>
      <Text style={styles.subtitle}>Scanning for BUZZ MAX and compatible smartwatches</Text>
      
      <View style={styles.scanControls}>
        {!isScanning ? (
          <TouchableOpacity
            style={[styles.scanButton, !canScan && styles.disabledButton]}
            onPress={startScan}
            disabled={!canScan}
          >
            <Text style={[styles.scanButtonText, !canScan && styles.disabledText]}>
              {isConnecting ? '🔗 Connecting...' : '🔍 Start Scan'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopScan}>
            <Text style={styles.stopButtonText}>
              🛑 Stop Scan ({scanDuration}s)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {foundDevices.length > 0 && (
        <View style={styles.devicesContainer}>
          <Text style={styles.devicesTitle}>
            📱 Found Devices ({foundDevices.length})
          </Text>
          
          {foundDevices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceItem,
                device.name.includes('BUZZ MAX') && styles.buzzMaxDevice
              ]}
              onPress={() => handleDeviceSelect(device.id)}
              disabled={isConnecting}
            >
              <View style={styles.deviceInfo}>
                <Text style={[
                  styles.deviceName,
                  device.name.includes('BUZZ MAX') && styles.buzzMaxName
                ]}>
                  {device.name}
                </Text>
                <Text style={styles.deviceDetails}>
                  📶 Signal: {device.rssi} dBm
                </Text>
                <Text style={styles.deviceId}>
                  🔗 {device.id}
                </Text>
              </View>
              <View style={styles.connectButton}>
                <Text style={styles.connectButtonText}>
                  {isConnecting ? '⏳' : '🔗'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isScanning && foundDevices.length === 0 && (
        <View style={styles.searchingContainer}>
          <Text style={styles.searchingText}>
            🔍 Searching for BUZZ MAX...
          </Text>
          <Text style={styles.searchingSubtext}>
            Make sure your BUZZ MAX is nearby and discoverable
          </Text>
        </View>
      )}

      {!isScanning && foundDevices.length === 0 && (
        <View style={styles.noDevicesContainer}>
          <Text style={styles.noDevicesText}>
            📱 No compatible devices found
          </Text>
          <Text style={styles.noDevicesSubtext}>
            • Make sure your BUZZ MAX is turned on{'\n'}
            • Keep it close to your phone{'\n'}
            • Try scanning again
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanControls: {
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  devicesContainer: {
    marginTop: 10,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  buzzMaxDevice: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buzzMaxName: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  deviceDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  connectButton: {
    backgroundColor: '#34C759',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  searchingText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  searchingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noDevicesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDevicesText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 10,
  },
  noDevicesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 