import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface StatusDisplayProps {
  bluetoothState: string;
  isPermissionGranted: boolean;
  connectionStatus: string;
  onRequestPermissions: () => void;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  bluetoothState,
  isPermissionGranted,
  connectionStatus,
  onRequestPermissions,
}) => {
  return (
    <View style={styles.container}>
      {/* Status Section */}
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Bluetooth:</Text>
          <Text style={[styles.statusValue, { color: bluetoothState === 'PoweredOn' ? '#4CAF50' : '#F44336' }]}>
            {bluetoothState}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permissions:</Text>
          <Text style={[styles.statusValue, { color: isPermissionGranted ? '#4CAF50' : '#F44336' }]}>
            {isPermissionGranted ? 'Granted' : 'Not Granted'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection:</Text>
          <Text style={[styles.statusValue, { color: connectionStatus === 'Connected' ? '#4CAF50' : '#666' }]}>
            {connectionStatus}
          </Text>
        </View>
      </View>

      {/* Permission Button */}
      {!isPermissionGranted && (
        <View style={styles.buttonSection}>
          <Button 
            title="Request Permissions" 
            onPress={onRequestPermissions}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  statusSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: 10,
  },
}); 