import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeartRateData } from '../hooks/useSmartwatchServices';

interface HeartRateMonitorProps {
  heartRateData: HeartRateData[];
  isMonitoring: boolean;
}

export const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({ heartRateData, isMonitoring }) => {
  return (
    <View style={styles.heartRateSection}>
      <Text style={styles.sectionTitle}>❤️ Heart Rate Monitor</Text>
      <Text style={styles.heartRateStatus}>
        Status: {isMonitoring ? '📡 Active' : '❌ Inactive'}
      </Text>
      
      {heartRateData.length > 0 ? (
        <>
          <View style={styles.heartRateData}>
            <Text style={styles.currentHeartRate}>
              Current: {heartRateData[0].bpm} BPM
            </Text>
            <Text style={styles.heartRateTime}>
              Last reading: {heartRateData[0].timestamp}
            </Text>
            <Text style={styles.sensorLocation}>
              Sensor: {heartRateData[0].sensorLocation}
            </Text>
          </View>
          
          {heartRateData.length > 1 && (
            <View style={styles.heartRateHistorySection}>
              <Text style={styles.historyTitle}>📊 Recent Readings</Text>
              <View style={styles.historyContainer}>
                {heartRateData.slice(0, 5).map((item, index) => (
                  <View key={`${item.timestamp}-${index}`} style={styles.heartRateHistoryItem}>
                    <Text style={styles.heartRateHistoryBpm}>{item.bpm} BPM</Text>
                    <Text style={styles.heartRateHistoryTime}>{item.timestamp}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            {isMonitoring ? '⏳ Waiting for heart rate data...' : '💤 Heart rate monitoring not active'}
          </Text>
          <Text style={styles.noDataSubtext}>
            Make sure your BUZZ MAX watch has heart rate sensors enabled
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heartRateSection: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  heartRateStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  heartRateData: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  currentHeartRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  heartRateTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  sensorLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  heartRateHistorySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  historyContainer: {
    // Container for history items without FlatList
  },
  heartRateHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  heartRateHistoryBpm: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  heartRateHistoryTime: {
    fontSize: 11,
    color: '#666',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 