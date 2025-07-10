import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useBluetooth } from '../hooks/useBluetooth';
import { ConnectedDeviceView } from './ConnectedDeviceView';

export const DeviceScanner: React.FC = () => {
  const { 
    startScan, 
    stopScan, 
    connectToDevice,
    disconnectFromDevice,
    startRecording,
    stopRecording,
    state: { 
      isScanning, 
      discoveredDevices, 
      connectedDevice,
      error,
      recordingState,
      batteryState,
    },
  } = useBluetooth();

  const handleConnect = async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectFromDevice();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  // If we have a connected device, show the ConnectedDeviceView
  if (connectedDevice) {
    return (
      <ConnectedDeviceView 
        device={connectedDevice}
        batteryState={batteryState}
        onDisconnect={handleDisconnect}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        isRecording={recordingState.isRecording}
      />
    );
  }

  // Otherwise show the scanning view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Devices</Text>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanningButton]}
          onPress={isScanning ? stopScan : startScan}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Stop Scan' : 'Start Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isScanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      )}

      <FlatList
        data={discoveredDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => handleConnect(item.id)}
          >
            <View>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceInfo}>
                Signal Strength: {item.rssi} dBm
              </Text>
            </View>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => handleConnect(item.id)}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No devices found. Tap 'Start Scan' to begin searching.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scanButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  scanningButton: {
    backgroundColor: '#e74c3c',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#e3f2fd',
    margin: 10,
    borderRadius: 8,
  },
  scanningText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#1976d2',
  },
  listContent: {
    padding: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  deviceInfo: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  connectButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
}); 