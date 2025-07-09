import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useBluetooth } from '../hooks/useBluetooth';

export const DeviceScanner: React.FC = () => {
  const {
    isScanning,
    devices,
    connectedDevice,
    isConnecting,
    connectionError,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useBluetooth();

  const handleConnect = async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleRecordingControl = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    try {
      switch (action) {
        case 'start':
          await startRecording();
          break;
        case 'stop':
          await stopRecording();
          break;
        case 'pause':
          await pauseRecording();
          break;
        case 'resume':
          await resumeRecording();
          break;
      }
    } catch (error: any) {
      Alert.alert('Recording Error', error.message || 'Failed to control recording');
    }
  };

  const renderDeviceItem = ({ item }: { item: any }) => {
    const isVoiceRecorder = item.name.includes('🎙️');
    
    return (
      <View style={[styles.deviceItem, isVoiceRecorder && styles.voiceRecorderItem]}>
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, isVoiceRecorder && styles.voiceRecorderName]}>
            {item.name}
          </Text>
          <Text style={styles.deviceDetails}>
            ID: {item.id} | RSSI: {item.rssi}dBm
          </Text>
          {item.isConnected && (
            <Text style={styles.connectedIndicator}>✅ Connected</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.connectButton,
            item.isConnected && styles.disconnectButton,
            isVoiceRecorder && styles.voiceRecorderButton
          ]}
          onPress={() => item.isConnected ? disconnectDevice() : handleConnect(item.id)}
          disabled={isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? '...' : item.isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recorder Scanner</Text>
        <Text style={styles.subtitle}>
          Looking for devices with services: FFF9, FFF3, FFFC, FFF0
        </Text>
      </View>

      {/* Scanning Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanning]}
          onPress={isScanning ? stopScan : startScan}
          disabled={isConnecting}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? '🔄 Scanning...' : '🔍 Start Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Information */}
      {connectionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {connectionError}</Text>
        </View>
      )}

      {isScanning && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            🔄 Scanning for voice recording devices...
          </Text>
          <Text style={styles.statusSubtext}>
            Make sure your voice recorder is powered on and in pairing mode
          </Text>
        </View>
      )}

      {!isScanning && devices.length === 0 && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>🎙️ No voice recorders found</Text>
          <Text style={styles.statusSubtext}>
            • Ensure your device is powered on{'\n'}
            • Make sure it's in pairing mode{'\n'}
            • Try moving closer to the device{'\n'}
            • Some devices may need multiple scan attempts
          </Text>
        </View>
      )}

      {/* Device List */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDeviceItem}
        style={styles.deviceList}
        showsVerticalScrollIndicator={false}
      />

      {/* Recording Controls */}
      {connectedDevice && (
        <View style={styles.recordingControls}>
          <Text style={styles.recordingTitle}>
            🎙️ Recording Controls
          </Text>
          <Text style={styles.recordingStatus}>
            Status: {recordingState.isRecording 
              ? (recordingState.isPaused ? '⏸️ Paused' : '🔴 Recording') 
              : '⏹️ Stopped'}
          </Text>
          
          <View style={styles.recordingButtons}>
            {!recordingState.isRecording ? (
              <TouchableOpacity
                style={[styles.recordingButton, styles.startButton]}
                onPress={() => handleRecordingControl('start')}
              >
                <Text style={styles.recordingButtonText}>▶️ Start</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.recordingButton, styles.stopButton]}
                  onPress={() => handleRecordingControl('stop')}
                >
                  <Text style={styles.recordingButtonText}>⏹️ Stop</Text>
                </TouchableOpacity>
                
                {recordingState.isPaused ? (
                  <TouchableOpacity
                    style={[styles.recordingButton, styles.resumeButton]}
                    onPress={() => handleRecordingControl('resume')}
                  >
                    <Text style={styles.recordingButtonText}>▶️ Resume</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.recordingButton, styles.pauseButton]}
                    onPress={() => handleRecordingControl('pause')}
                  >
                    <Text style={styles.recordingButtonText}>⏸️ Pause</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    lineHeight: 20,
  },
  scanControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanningButton: {
    backgroundColor: '#FF9800',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceCount: {
    fontSize: 14,
    color: '#666',
  },
  connectedDeviceStatus: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  connectedDeviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  recordingControls: {
    marginTop: 10,
  },
  recordingStatus: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  recordingButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  recordingButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  recordingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  deviceDetails: {
    fontSize: 12,
    color: '#666',
  },
  connectedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: '#4CAF50',
  },
  connectingButton: {
    backgroundColor: '#FF9800',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanning: {
    backgroundColor: '#FF9800',
  },
  statusContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666',
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  voiceRecorderItem: {
    backgroundColor: '#f0f0f0',
  },
  voiceRecorderName: {
    fontWeight: 'bold',
  },
  connectedIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  voiceRecorderButton: {
    backgroundColor: '#FF9800',
  },
}); 