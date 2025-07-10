import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DeviceInfo } from '../hooks/useBluetooth';
import { MaterialIcons } from '@expo/vector-icons';

interface ConnectedDeviceViewProps {
  device: DeviceInfo;
  batteryState: {
    level: number;
    isCharging: boolean;
    lastUpdated: number;
  };
  onDisconnect: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
    isRecording: boolean;
}

export const ConnectedDeviceView: React.FC<ConnectedDeviceViewProps> = ({
  device,
  batteryState,
  onDisconnect,
  onStartRecording,
  onStopRecording,
  isRecording
}) => {
  // Get appropriate battery icon based on level and charging state
  const getBatteryIcon = () => {
    if (batteryState.isCharging) {
      return 'battery-charging-full';
    }
    if (batteryState.level >= 90) return 'battery-full';
    if (batteryState.level >= 60) return 'battery-6-bar';
    if (batteryState.level >= 30) return 'battery-3-bar';
    return 'battery-alert';
  };

  // Get battery color based on level
  const getBatteryColor = () => {
    if (batteryState.level >= 30) return '#4CAF50';
    if (batteryState.level >= 15) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceId}>ID: {device.id}</Text>
        </View>
        <View style={styles.batteryContainer}>
          <MaterialIcons 
            name={getBatteryIcon()} 
            size={24} 
            color={getBatteryColor()} 
          />
          <Text style={[styles.batteryText, { color: getBatteryColor() }]}>
            {batteryState.level}%
            {batteryState.isCharging && ' ⚡'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, isRecording ? styles.stopButton : styles.startButton]} 
          onPress={isRecording ? onStopRecording : onStartRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>

      <TouchableOpacity 
          style={[styles.button, styles.disconnectButton]} 
        onPress={onDisconnect}
      >
          <Text style={styles.buttonText}>Disconnect</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  batteryText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  disconnectButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 