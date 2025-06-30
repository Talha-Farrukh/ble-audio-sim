import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ActivityLogProps {
  log: string[];
  maxItems?: number;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ log, maxItems = 100 }) => {
  const displayLog = log.slice(0, maxItems);

  return (
    <View style={styles.logSection}>
      <Text style={styles.sectionTitle}>📋 Activity Log</Text>
      <View style={styles.logContainer}>
        {displayLog.map((item, index) => (
          <Text key={`${index}-${item.substring(0, 20)}`} style={styles.logItem}>
            {item}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logContainer: {
  },
  logItem: {
    fontSize: 12,
    marginVertical: 2,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 16,
    paddingVertical: 1,
  },
}); 