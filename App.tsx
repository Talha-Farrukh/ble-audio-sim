import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  AuthResult,
  CmdReceiveEvent,
  ConnectStatusEvent,
  DevicesFoundEvent,
  dosmonoBle,
  DosmonoDevice,
  DosmonoCommand,
  FileListEvent,
  RecordingInfo
} from './modules/expo-dosmono-ble';

// Configuration - Replace with your actual keys
const ACCESS_KEY = "com.dosmono.lianying.sdk";
const SECRET_KEY = "473a4acaad6923b14f4d60bb0e6ecdcd8e9e2f76154505d91e5a05aba410ae96";

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [devices, setDevices] = useState<DosmonoDevice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ [key: string]: string }>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Use refs to track component mount state and prevent memory leaks
  const isMountedRef = useRef(true);
  const eventListenersSetupRef = useRef(false);

  const addLog = useCallback((message: string) => {
    if (!isMountedRef.current) return;
    
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  }, []);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    try {
      dosmonoBle.removeAllEventListeners();
      dosmonoBle.release();
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }, []);

  const setupEventListeners = useCallback(() => {
    try {
      // Remove any existing listeners first to prevent duplicates
      dosmonoBle.removeAllEventListeners();
      
      dosmonoBle.addEventListener('onAuthResult', (event: AuthResult) => {
        if (!isMountedRef.current) return;
        
        const message = `Auth: ${event.success ? 'Success' : 'Failed'} - ${event.message}`;
        console.log(message); // Add console log for debugging
        addLog(message);
        
        setIsInitialized(event.success);
        setIsInitializing(false);
      });

      dosmonoBle.addEventListener('onSearchStart', () => {
        if (!isMountedRef.current) return;
        addLog('Device scan started');
        setIsScanning(true);
      });

      dosmonoBle.addEventListener('onDevicesFound', (event: DevicesFoundEvent) => {
        if (!isMountedRef.current) return;
        addLog(`Found ${event.devices.length} devices`);
        setDevices(event.devices);
      });

      dosmonoBle.addEventListener('onSearchStop', () => {
        if (!isMountedRef.current) return;
        addLog('Device scan stopped');
        setIsScanning(false);
      });

      dosmonoBle.addEventListener('onConnectStatus', (event: ConnectStatusEvent) => {
        if (!isMountedRef.current) return;
        addLog(`Device ${event.mac} ${event.connected ? 'connected' : 'disconnected'}`);
        setIsConnected(event.connected);
        setConnectedDevice(event.connected ? event.mac : null);
        
        // Clear device info when disconnected
        if (!event.connected) {
          setDeviceInfo({});
        }
      });

      dosmonoBle.addEventListener('onConnectSuccess', (event: { mac: string }) => {
        if (!isMountedRef.current) return;
        addLog(`Successfully connected to ${event.mac}`);
        setIsConnected(true);
        setConnectedDevice(event.mac);
        // Clear devices list after successful connection
        setDevices([]);
      });

      dosmonoBle.addEventListener('onConnectFail', () => {
        if (!isMountedRef.current) return;
        addLog('Connection failed');
        setIsConnected(false);
        setConnectedDevice(null);
        setDeviceInfo({});
      });

      dosmonoBle.addEventListener('onRecordStart', (event: RecordingInfo) => {
        if (!isMountedRef.current) return;
        addLog(`Recording started: ${event.fileName}`);
        setIsRecording(true);
      });

      dosmonoBle.addEventListener('onRecordStop', () => {
        if (!isMountedRef.current) return;
        addLog('Recording stopped');
        setIsRecording(false);
      });

      dosmonoBle.addEventListener('onCmdReceive', (event: CmdReceiveEvent) => {
        if (!isMountedRef.current) return;
        addLog(`Command response: ${event.flag} - ${event.command}`);
        setDeviceInfo(prev => ({ ...prev, [event.flag]: event.command }));
      });

      dosmonoBle.addEventListener('onFileList', (event: FileListEvent) => {
        if (!isMountedRef.current) return;
        const fileCount = Array.isArray(event.files) ? event.files.length : 0;
        addLog(`File list received: ${fileCount} files`);
      });
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      addLog(`Error setting up event listeners: ${error}`);
    }
  }, [addLog]);

  const initializeSDK = useCallback(async () => {
    if (isInitializing || isInitialized) {
      console.log('SDK already initializing or initialized');
      return;
    }
    
    try {
      setIsInitializing(true);
      addLog('Initializing Dosmono SDK...');
      
      // Set up event listeners first
      setupEventListeners();
      
      const result = await dosmonoBle.initialize(ACCESS_KEY, SECRET_KEY);
      console.log('SDK initialization result:', result);
      
      if (!result) {
        throw new Error('SDK initialization failed');
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('SDK initialization error:', error);
      addLog(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsInitialized(false);
      Alert.alert('Error', 'Failed to initialize SDK');
    } finally {
      setIsInitializing(false);
    }
  }, [addLog, isInitializing, isInitialized, setupEventListeners]);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('App mounted, starting initialization...');
    
    // Initialize SDK
    initializeSDK();

    return () => {
      console.log('App unmounting, cleaning up...');
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup, initializeSDK]);

  const startScan = useCallback(async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'SDK not initialized');
      return;
    }

    if (isScanning) {
      addLog('Scan already in progress');
      return;
    }

    try {
      if (!dosmonoBle.isBluetoothEnabled()) {
        Alert.alert('Error', 'Bluetooth is not enabled');
        return;
      }

      if (!dosmonoBle.isGpsEnabled()) {
        Alert.alert('Error', 'GPS location is not enabled');
        return;
      }

      setDevices([]);
      await dosmonoBle.startDeviceSearch();
    } catch (error) {
      addLog(`Scan failed: ${error}`);
      Alert.alert('Error', 'Failed to start device scan');
      // Reset scanning state if there was an error
      setIsScanning(false);
    }
  }, [isInitialized, isScanning, addLog]);

  const stopScan = useCallback(() => {
    try {
      dosmonoBle.stopDeviceSearch();
    } catch (error) {
      addLog(`Stop scan failed: ${error}`);
    }
  }, [addLog]);

  const connectToDevice = useCallback(async (device: DosmonoDevice) => {
    if (!device?.mac) {
      Alert.alert('Error', 'Invalid device data');
      return;
    }

    if (isConnected) {
      Alert.alert('Info', 'Already connected to a device. Disconnect first.');
      return;
    }

    try {
      addLog(`Connecting to ${device.name || 'Unknown'} (${device.mac})...`);
      await dosmonoBle.connectDevice(device.mac);
    } catch (error) {
      addLog(`Connection failed: ${error}`);
      Alert.alert('Error', 'Failed to connect to device');
    }
  }, [isConnected, addLog]);

  const disconnect = useCallback(() => {
    try {
      dosmonoBle.disconnectDevice();
      // Don't immediately set state here - wait for the event
      addLog('Disconnecting device...');
    } catch (error) {
      addLog(`Disconnect failed: ${error}`);
      // Force state reset on error
      setIsConnected(false);
      setConnectedDevice(null);
      setDeviceInfo({});
    }
  }, [addLog]);

  const startRecording = useCallback(async () => {
    if (!isConnected) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    if (isRecording) {
      addLog('Recording already in progress');
      return;
    }

    try {
      await dosmonoBle.initializeRecording();
      await dosmonoBle.startRecording();
    } catch (error) {
      addLog(`Recording failed: ${error}`);
      Alert.alert('Error', 'Failed to start recording');
    }
  }, [isConnected, isRecording, addLog]);

  const stopRecording = useCallback(() => {
    try {
      dosmonoBle.stopRecording();
    } catch (error) {
      addLog(`Stop recording failed: ${error}`);
    }
  }, [addLog]);

  const getDeviceInfo = useCallback(async (command: string, flag: DosmonoCommand) => {
    if (!isConnected) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    try {
      addLog(`Requesting ${flag} info...`);
      await dosmonoBle.sendCommand(command, flag);
    } catch (error) {
      addLog(`Command failed: ${error}`);
      Alert.alert('Error', 'Failed to get device info');
    }
  }, [isConnected, addLog]);

  const renderDevice = useCallback(({ item }: { item: DosmonoDevice }) => (
    <TouchableOpacity 
      style={[
        styles.deviceItem,
        isConnected && styles.deviceItemDisabled
      ]}
      onPress={() => connectToDevice(item)}
      disabled={isConnected} // Disable if already connected
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceMac}>{item.mac}</Text>
        <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
      </View>
    </TouchableOpacity>
  ), [connectToDevice, isConnected]);

  const renderLog = useCallback(({ item }: { item: string }) => (
    <Text style={styles.logItem}>{item}</Text>
  ), []);
  
  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="auto" />
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BLE Audio Simulator</Text>
          <Text style={styles.subtitle}>
            {isInitializing ? 'Initializing...' : 
             isInitialized ? 'Ready' : 'Not Initialized'}
          </Text>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>SDK Initialized:</Text>
            <View 
              testID="status-indicator"
              style={[styles.statusIndicator, { backgroundColor: isInitialized ? '#4CAF50' : '#F44336' }]} 
            />
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connected:</Text>
            <View 
              testID="status-indicator"
              style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} 
            />
          </View>
          {connectedDevice && (
            <Text style={styles.connectedDevice}>Device: {connectedDevice}</Text>
          )}
        </View>

        {/* Device Scanning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Scanning</Text>
          <View style={styles.buttonContainer}>
            {isInitialized ? (
              <>
                <TouchableOpacity
                  style={[styles.button, isScanning && styles.buttonActive]}
                  onPress={isScanning ? stopScan : startScan}
                  disabled={!isInitialized}>
                  <Text style={styles.buttonText}>
                    {isScanning ? 'Stop Scan' : 'Start Scan'}
                  </Text>
                </TouchableOpacity>

                {isConnected && (
                  <TouchableOpacity
                    style={[styles.button, isRecording && styles.buttonActive]}
                    onPress={isRecording ? stopRecording : startRecording}>
                    <Text style={styles.buttonText}>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <ActivityIndicator size="large" color="#0000ff" />
            )}
          </View>

          {devices.length > 0 && (
            <View style={styles.devicesList}>
              <Text style={styles.devicesTitle}>Found Devices ({devices.length})</Text>
              <FlatList
                data={devices}
                keyExtractor={(item) => item.mac}
                renderItem={renderDevice}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        {/* Device Information */}
        {isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            <View style={styles.infoButtonRow}>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => getDeviceInfo('', 'ELECTRICITY')}
              >
                <Text style={styles.infoButtonText}>Battery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => getDeviceInfo('', 'MEMORY')}
              >
                <Text style={styles.infoButtonText}>Memory</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => getDeviceInfo('', 'VERSION')}
              >
                <Text style={styles.infoButtonText}>Version</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => getDeviceInfo('', 'FILE_LIST')}
              >
                <Text style={styles.infoButtonText}>Files</Text>
              </TouchableOpacity>
            </View>

            {Object.keys(deviceInfo).length > 0 && (
              <View style={styles.deviceInfoDisplay}>
                {Object.entries(deviceInfo).map(([key, value]) => (
                  <Text key={key} style={styles.deviceInfoItem}>
                    {key}: {value}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button]}
              onPress={disconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Activity Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <View style={styles.logContainer}>
            <FlatList
              data={logs}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderLog}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectedDevice: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devicesList: {
    marginTop: 15,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceItemDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
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
  infoButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  infoButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  infoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deviceInfoDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  deviceInfoItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  logContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 15,
    maxHeight: 200,
  },
  logItem: {
    fontSize: 12,
    color: '#00FF00',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
}); 