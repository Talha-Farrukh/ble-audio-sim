import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BatteryInfo } from '../hooks/useSmartwatchServices';

interface BatteryMonitorProps {
  batteryInfo: BatteryInfo | null;
}

export const BatteryMonitor: React.FC<BatteryMonitorProps> = ({ batteryInfo }) => {
  if (!batteryInfo) {
    return (
      <View style={styles.batterySection}>
        <Text style={styles.sectionTitle}>🔋 Battery Status</Text>
        <Text style={styles.batteryStatus}>⚠️ Battery information not available</Text>
      </View>
    );
  }


  return (
    <View style={batteryInfo.isCharging ? styles.chargingSection : styles.batterySection}>
      <Text style={styles.sectionTitle}>
        {batteryInfo.level === 101 ? '🔌 Battery Status (Charging)' : '🔋 Battery Status'}
      </Text>
      <View style={styles.batteryContainer}>
        <Text style={styles.batteryLevel}>{batteryInfo.level === 101 ? '100' : batteryInfo.level}%</Text>
        <View style={styles.batteryBar}>
          <View 
            style={[
              styles.batteryFill, 
              { 
                width: `${batteryInfo.level}%`,
                backgroundColor: batteryInfo.isCharging 
                  ? '#4CAF50' // Green when charging
                  : batteryInfo.level > 30 ? '#4CAF50' : batteryInfo.level > 15 ? '#FF9800' : '#F44336'
              }
            ]} 
          />
        </View>
      </View>
      <Text style={styles.batteryStatus}>
        {batteryInfo.level === 101 ? '🔌 Charging' : '🔋 On Battery'}
      </Text>
      <Text style={styles.powerState}>
        Power State: {batteryInfo.isCharging || batteryInfo.level === 101 ? 'Charging' : batteryInfo.powerState}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  batterySection: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  chargingSection: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  batteryLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
    minWidth: 60,
  },
  batteryBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 10,
  },
  batteryStatus: {
    fontSize: 14,
    color: '#666',
  },
  powerState: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
}); 