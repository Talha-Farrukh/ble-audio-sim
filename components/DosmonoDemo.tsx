import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DosmonoSDK, {
  DosmonoDevice
} from '../src/services/DosmonoSDK';

interface DosmonoDemoProps {
  onLog?: (message: string) => void;
}

export const DosmonoDemo: React.FC<DosmonoDemoProps> = ({ onLog }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<DosmonoDevice[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // SDK Configuration
  const [accessKey, setAccessKey] = useState('com.dosmono.lianying.sdk');
  const [secretKey, setSecretKey] = useState('473a4acaad6923b14f4d60bb0e6ecdcd8e9e2f76154505d91e5a05aba410ae96');

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev.slice(0, 99)]);
    onLog?.(logMessage);
    console.log('DosmonoSDK:', logMessage);
  };

  const handleInitialize = async () => {
    try {
      log('🚀 Requesting permissions...');
      const permissionsGranted = await DosmonoSDK.requestPermissions();
      
      if (!permissionsGranted) {
        Alert.alert('Permissions Required', 'Please grant all required permissions to use the SDK');
        return;
      }

      log('🔑 Initializing SDK...');
      const result = await DosmonoSDK.initialize(accessKey, secretKey);
      
      if (result.success) {
        setIsInitialized(true);
        log('✅ SDK initialized successfully');
      } else {
        log(`❌ SDK initialization failed: ${result.message}`);
        Alert.alert('Initialization Failed', result.message);
      }
    } catch (error) {
      log(`❌ Error during initialization: ${error}`);
      Alert.alert('Error', 'Failed to initialize SDK');
    }
  };

  const handleStartScan = async () => {
    try {
      setDevices([]);
      log('🔍 Starting device scan...');
      await DosmonoSDK.startDeviceScan(10000, 3);
    } catch (error) {
      log(`❌ Error starting scan: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dosmono SDK Demo</Text>

      {/* SDK Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SDK Configuration</Text>
        <TextInput
          style={styles.input}
          placeholder="Access Key"
          value={accessKey}
          onChangeText={setAccessKey}
          editable={!isInitialized}
        />
        <TextInput
          style={styles.input}
          placeholder="Secret Key"
          value={secretKey}
          onChangeText={setSecretKey}
          secureTextEntry={false}
          editable={!isInitialized}
        />
        <TouchableOpacity
          style={[styles.button, isInitialized && styles.buttonDisabled]}
          onPress={handleInitialize}
          disabled={isInitialized}
        >
          <Text style={styles.buttonText}>
            {isInitialized ? '✅ SDK Initialized' : '🚀 Initialize SDK'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Device Scanning */}
      {isInitialized && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Scanning</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleStartScan}
            disabled={isScanning}
          >
            <Text style={styles.buttonText}>
              {isScanning ? '🔍 Scanning...' : '🔍 Start Scan'}
            </Text>
          </TouchableOpacity>
          
          {devices.length > 0 && (
            <View style={styles.deviceList}>
              {devices.map((device) => (
                <View key={device.mac} style={styles.deviceItem}>
                  <Text style={styles.deviceName}>{device.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceMac}>{device.mac}</Text>
                  <Text style={styles.deviceRssi}>RSSI: {device.rssi} dBm</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Activity Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        <ScrollView style={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

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
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deviceList: {
    marginTop: 8,
  },
  deviceItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceMac: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  deviceRssi: {
    fontSize: 12,
    color: '#999',
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#000',
    borderRadius: 4,
    padding: 8,
  },
  logText: {
    fontSize: 12,
    color: '#00ff00',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default DosmonoDemo; 