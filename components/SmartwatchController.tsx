import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { BatteryInfo, DeviceInfo, HeartRateData, NotificationData } from '../hooks/useSmartwatchServices';
import { DeviceInfoDisplay } from './DeviceInfoDisplay';
import { BatteryMonitor } from './BatteryMonitor';
import { HeartRateMonitor } from './HeartRateMonitor';
import { TimeSync } from './TimeSync';
import { NotificationManager } from './NotificationManager';

interface SmartwatchControllerProps {
  device: Device;
  batteryInfo: BatteryInfo | null;
  deviceInfo: DeviceInfo | null;
  heartRateData: HeartRateData | null;
  heartRateHistory: HeartRateData[];
  notifications: NotificationData[];
  isHeartRateMonitoring: boolean;
  currentTime: string;
  onSendNotification: (message: string) => Promise<boolean>;
  onSyncTime: () => Promise<boolean>;
  onFindMyPhone: () => Promise<boolean>;
  onCallAlert: () => Promise<boolean>;
  onMessageAlert: () => Promise<boolean>;
  onStartWorkout: () => Promise<boolean>;
  onRequestHeartRate: () => Promise<boolean>;
  onDisconnect: () => void;
  onLog: (message: string) => void;
}

export const SmartwatchController: React.FC<SmartwatchControllerProps> = ({
  device,
  batteryInfo,
  deviceInfo,
  heartRateData,
  heartRateHistory,
  notifications,
  isHeartRateMonitoring,
  currentTime,
  onSendNotification,
  onSyncTime,
  onFindMyPhone,
  onCallAlert,
  onMessageAlert,
  onStartWorkout,
  onRequestHeartRate,
  onDisconnect,
  onLog,
}) => {
  const handleSendTestAlert = async () => {
    const success = await onSendNotification('Test notification from app');
    if (success) {
      Alert.alert('Success', 'Test alert sent to your BUZZ MAX watch!');
    } else {
      Alert.alert('Failed', 'Could not send alert to watch. Please try again.');
    }
  };

  const handleFindMyPhone = async () => {
    const success = await onFindMyPhone();
    if (success) {
      Alert.alert('Success', 'Find my phone command sent to your BUZZ MAX watch!');
    } else {
      Alert.alert('Info', 'Find phone command attempted. Check activity log for details.');
    }
  };

  const handleCallAlert = async () => {
    const success = await onCallAlert();
    if (success) {
      Alert.alert('Success', 'Call alert sent to your BUZZ MAX watch!');
    } else {
      Alert.alert('Info', 'Call alert attempted. Check activity log for details.');
    }
  };

  const handleMessageAlert = async () => {
    const success = await onMessageAlert();
    if (success) {
      Alert.alert('Success', 'Message alert sent to your BUZZ MAX watch!');
    } else {
      Alert.alert('Info', 'Message alert attempted. Check activity log for details.');
    }
  };

  const handleStartWorkout = async () => {
    const success = await onStartWorkout();
    if (success) {
      Alert.alert('Success', 'Workout session started on your BUZZ MAX watch!');
    } else {
      Alert.alert('Info', 'Workout start attempted. Check activity log for details.');
    }
  };

  const handleRequestHeartRate = async () => {
    const success = await onRequestHeartRate();
    if (success) {
      Alert.alert('Success', 'Heart rate measurement requested from your BUZZ MAX watch!');
    } else {
      Alert.alert('Info', 'Heart rate request attempted. Check activity log for details.');
    }
  };

  const handleSyncTime = async () => {
    const success = await onSyncTime();
    if (success) {
      Alert.alert('Success', 'Time synchronized with your BUZZ MAX watch!');
    } else {
      Alert.alert('Info', 'Time sync attempted. Check activity log for details.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from your BUZZ MAX watch?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: onDisconnect },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⌚ BUZZ MAX Controller</Text>
      
      {/* Device Information */}
      <DeviceInfoDisplay 
        deviceInfo={deviceInfo}
        deviceName={device.name || 'BUZZ MAX'}
        deviceId={device.id}
      />

      {/* Battery Status */}
      <BatteryMonitor batteryInfo={batteryInfo} />

      {/* Heart Rate Monitor */}
      <HeartRateMonitor 
        heartRateData={heartRateHistory}
        isMonitoring={isHeartRateMonitoring}
      />

      {/* Time Sync */}
      <TimeSync 
        currentTime={currentTime}
        onSyncTime={handleSyncTime}
      />

      {/* Controls */}
      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>🎛️ BUZZ MAX Controls</Text>
        
        {/* Primary Actions */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleSendTestAlert}
          >
            <Text style={styles.controlButtonText}>📱 Test Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleFindMyPhone}
          >
            <Text style={styles.controlButtonText}>🔍 Find Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Communication Alerts */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleCallAlert}
          >
            <Text style={styles.controlButtonText}>📞 Call Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleMessageAlert}
          >
            <Text style={styles.controlButtonText}>💬 Message Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Health & Fitness */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleStartWorkout}
          >
            <Text style={styles.controlButtonText}>🏃 Start Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleRequestHeartRate}
          >
            <Text style={styles.controlButtonText}>❤️ Check Heart Rate</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Text style={styles.disconnectButtonText}>Disconnect from BUZZ MAX</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <NotificationManager 
        notifications={notifications}
        heartRateData={heartRateHistory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  controlsSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  disconnectButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 