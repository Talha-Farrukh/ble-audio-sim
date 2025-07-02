import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import DosmonoSDK, { DosmonoDevice } from '../src/services/DosmonoSDK';

export default function DosmonoSDKDemo() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState('');
  const [devices, setDevices] = useState<DosmonoDevice[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [accessKey, setAccessKey] = useState('your-access-key');
  const [secretKey, setSecretKey] = useState('your-secret-key');
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    setupEventListeners();
    checkStatus();
    
    return () => {
      DosmonoSDK.removeAllListeners();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 50)]);
  };

  const setupEventListeners = () => {
    DosmonoSDK.addEventListener('onBleSearchStart', () => {
      addLog('🔍 Scan started');
      setIsScanning(true);
    });

    DosmonoSDK.addEventListener('onBleSearchStop', () => {
      addLog('⏹️ Scan stopped');
      setIsScanning(false);
    });

    DosmonoSDK.addEventListener('onBleDevicesFound', (event: { devices: DosmonoDevice[] }) => {
      addLog(`📱 Found ${event.devices.length} devices`);
      setDevices(event.devices);
    });

    DosmonoSDK.addEventListener('onBleConnectionSuccess', (data: { mac: string }) => {
      addLog(`✅ Connected to ${data.mac}`);
      setIsConnected(true);
      setConnectedDevice(data.mac);
    });

    DosmonoSDK.addEventListener('onBleConnectionStatus', (data: { mac: string; isConnected: boolean }) => {
      addLog(`🔗 Connection status: ${data.isConnected ? 'Connected' : 'Disconnected'}`);
      setIsConnected(data.isConnected);
      setConnectedDevice(data.isConnected ? data.mac : '');
    });

    DosmonoSDK.addEventListener('onBleConnectionFailed', () => {
      addLog('❌ Connection failed');
      setIsConnected(false);
    });

    DosmonoSDK.addEventListener('onBleConnectionTimeout', () => {
      addLog('⏰ Connection timeout');
      setIsConnected(false);
    });

    DosmonoSDK.addEventListener('onBleCommandReceived', (data: { value: string; flags: string }) => {
      addLog(`📨 Command received: ${data.value} (${data.flags})`);
    });

    DosmonoSDK.addEventListener('onBleFileList', (data: { files: any[] }) => {
      addLog(`📁 File list received: ${data.files.length} files`);
    });
  };

  const checkStatus = async () => {
    try {
      const initialized = await DosmonoSDK.isSDKInitialized();
      setIsInitialized(initialized);
      addLog(`SDK initialized: ${initialized}`);

      if (initialized) {
        const status = await DosmonoSDK.getConnectionStatus();
        setIsConnected(status.isConnected);
        setConnectedDevice(status.connectedDevice || '');
        
        const btEnabled = await DosmonoSDK.isBluetoothEnabled();
        const gpsOn = await DosmonoSDK.isGpsEnabled();
        setBluetoothEnabled(btEnabled);
        setGpsEnabled(gpsOn);
        
        addLog(`Bluetooth: ${btEnabled}, GPS: ${gpsOn}`);
      }
    } catch (error) {
      addLog(`Error checking status: ${error}`);
    }
  };

  const initializeSDK = async () => {
    try {
      addLog('Initializing SDK...');
      const result = await DosmonoSDK.initialize(accessKey, secretKey);
      setIsInitialized(result.success);
      addLog(`✅ SDK initialized: ${result.message}`);
      checkStatus();
    } catch (error: any) {
      addLog(`❌ SDK initialization failed: ${error.message}`);
      Alert.alert('Error', `Failed to initialize SDK: ${error.message}`);
    }
  };

  const startScanning = async () => {
    try {
      await DosmonoSDK.startDeviceScan(10000, 3); // 10 seconds, 3 times
      addLog('🔍 Started scanning...');
    } catch (error: any) {
      addLog(`❌ Scan error: ${error.message}`);
    }
  };

  const stopScanning = async () => {
    try {
      await DosmonoSDK.stopDeviceScan();
      addLog('⏹️ Stopped scanning');
    } catch (error: any) {
      addLog(`❌ Stop scan error: ${error.message}`);
    }
  };

  const connectToDevice = async (macAddress: string) => {
    try {
      await DosmonoSDK.connectToDevice(macAddress);
      addLog(`🔗 Connecting to ${macAddress}...`);
    } catch (error: any) {
      addLog(`❌ Connect error: ${error.message}`);
    }
  };

  const disconnect = async () => {
    try {
      if (connectedDevice) {
        await DosmonoSDK.disconnectFromDevice(connectedDevice);
        addLog('🔌 Disconnecting...');
      }
    } catch (error: any) {
      addLog(`❌ Disconnect error: ${error.message}`);
    }
  };

  const getBatteryLevel = async () => {
    try {
      await DosmonoSDK.getBatteryLevel();
      addLog('🔋 Requesting battery level...');
    } catch (error: any) {
      addLog(`❌ Battery error: ${error.message}`);
    }
  };

  const syncTime = async () => {
    try {
      await DosmonoSDK.syncTime();
      addLog('🕒 Syncing time...');
    } catch (error: any) {
      addLog(`❌ Time sync error: ${error.message}`);
    }
  };

  const getMemoryInfo = async () => {
    try {
      await DosmonoSDK.getMemoryInfo();
      addLog('💾 Requesting memory info...');
    } catch (error: any) {
      addLog(`❌ Memory error: ${error.message}`);
    }
  };

  const renderDevice = ({ item }: { item: DosmonoDevice }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item.mac)}
    >
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
      <Text style={styles.deviceMac}>{item.mac}</Text>
      <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dosmono SDK Demo</Text>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          SDK: {isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
        </Text>
        <Text style={styles.statusText}>
          Bluetooth: {bluetoothEnabled ? '✅ Enabled' : '❌ Disabled'}
        </Text>
        <Text style={styles.statusText}>
          GPS: {gpsEnabled ? '✅ Enabled' : '❌ Disabled'}
        </Text>
        <Text style={styles.statusText}>
          Connection: {isConnected ? `✅ ${connectedDevice}` : '❌ Disconnected'}
        </Text>
      </View>

      {/* SDK Initialization */}
      {!isInitialized && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initialize SDK</Text>
          <TextInput
            style={styles.input}
            placeholder="Access Key"
            value={accessKey}
            onChangeText={setAccessKey}
          />
          <TextInput
            style={styles.input}
            placeholder="Secret Key"
            value={secretKey}
            onChangeText={setSecretKey}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={initializeSDK}>
            <Text style={styles.buttonText}>Initialize SDK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scanning Controls */}
      {isInitialized && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Scanning</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={startScanning}
              disabled={isScanning}
            >
              <Text style={styles.buttonText}>
                {isScanning ? 'Scanning...' : 'Start Scan'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={stopScanning}
            >
              <Text style={styles.buttonText}>Stop Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Device List */}
      {devices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Found Devices ({devices.length})</Text>
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.mac}
            style={styles.deviceList}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Device Controls */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Controls</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.buttonSmall]} onPress={getBatteryLevel}>
              <Text style={styles.buttonText}>Battery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSmall]} onPress={syncTime}>
              <Text style={styles.buttonText}>Sync Time</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSmall]} onPress={getMemoryInfo}>
              <Text style={styles.buttonText}>Memory</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={disconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logs Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logsContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonHalf: {
    flex: 0.48,
  },
  buttonSmall: {
    flex: 0.3,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  deviceList: {
    maxHeight: 200,
  },
  deviceItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceMac: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}); 