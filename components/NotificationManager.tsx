import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NotificationData, HeartRateData } from '../hooks/useSmartwatchServices';

interface NotificationManagerProps {
  notifications: NotificationData[];
  heartRateData: HeartRateData[];
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  notifications, 
  heartRateData 
}) => {
  return (
    <View style={styles.container}>
      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>🔔 Recent Notifications</Text>
          <View style={styles.notificationsContainer}>
            {notifications.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.notificationItem}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationType}>{item.type}</Text>
                  <Text style={styles.notificationTime}>{item.timestamp}</Text>
                </View>
                <Text style={styles.notificationContent}>{item.content}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Heart Rate Summary */}
      {heartRateData.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>📊 Heart Rate Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Readings</Text>
              <Text style={styles.summaryValue}>{heartRateData.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Latest</Text>
              <Text style={styles.summaryValue}>{heartRateData[0]?.bpm} BPM</Text>
            </View>
            {heartRateData.length > 1 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Last 5</Text>
                <Text style={styles.summaryValue}>
                  {Math.round(
                    heartRateData.slice(0, 5).reduce((sum, item) => sum + item.bpm, 0) / 
                    Math.min(5, heartRateData.length)
                  )} BPM
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* No Activity Message */}
      {notifications.length === 0 && heartRateData.length === 0 && (
        <View style={styles.noActivitySection}>
          <Text style={styles.noActivityTitle}>📱 Activity Center</Text>
          <Text style={styles.noActivityText}>
            No recent activity from your BUZZ MAX watch.
          </Text>
          <Text style={styles.noActivitySubtext}>
            Notifications and health data will appear here when available.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notificationsSection: {
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
  notificationsContainer: {
    // Container for notification items
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  notificationTime: {
    fontSize: 11,
    color: '#666',
  },
  notificationContent: {
    fontSize: 14,
    color: '#333',
  },
  summarySection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  noActivitySection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  noActivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noActivityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  noActivitySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 