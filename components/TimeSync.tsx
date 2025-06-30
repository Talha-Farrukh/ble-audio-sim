import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimeSyncProps {
  currentTime: string;
  onSyncTime: () => void;
}

export const TimeSync: React.FC<TimeSyncProps> = ({ currentTime, onSyncTime }) => {
  return (
    <View style={styles.timeSection}>
      <Text style={styles.sectionTitle}>🕐 Time Synchronization</Text>
      <View style={styles.timeContainer}>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeLabel}>Current Time:</Text>
          <Text style={styles.currentTime}>{currentTime || new Date().toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={onSyncTime}>
          <Text style={styles.syncButtonText}>🔄 Sync Time</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.syncDescription}>
        Synchronize your BUZZ MAX watch time with your phone's current time
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timeSection: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeDisplay: {
    flex: 1,
    marginRight: 15,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  currentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  syncDescription: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
}); 