import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeviceInfo } from '../hooks/useSmartwatchServices';

interface DeviceInfoDisplayProps {
  deviceInfo: DeviceInfo | null;
  deviceName: string;
  deviceId: string;
}

export const DeviceInfoDisplay: React.FC<DeviceInfoDisplayProps> = ({ 
  deviceInfo, 
  deviceName, 
  deviceId 
}) => {
  return (
    <View style={styles.deviceInfoSection}>
      <Text style={styles.sectionTitle}>📱 Device Information</Text>
      
      {/* Basic Connection Info */}
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName}>Connected to: {deviceName}</Text>
        <Text style={styles.connectionId}>ID: {deviceId}</Text>
      </View>
      
      {/* Detailed Device Info */}
      {deviceInfo ? (
        <View style={styles.detailsContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{deviceInfo.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model:</Text>
            <Text style={styles.infoValue}>{deviceInfo.model}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Manufacturer:</Text>
            <Text style={styles.infoValue}>{deviceInfo.manufacturer}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Firmware:</Text>
            <Text style={styles.infoValue}>{deviceInfo.firmware}</Text>
          </View>
          {deviceInfo.serial !== 'N/A' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serial:</Text>
              <Text style={styles.infoValue}>{deviceInfo.serial}</Text>
            </View>
          )}
          {deviceInfo.hardware !== 'N/A' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hardware:</Text>
              <Text style={styles.infoValue}>{deviceInfo.hardware}</Text>
            </View>
          )}
          {deviceInfo.software !== 'N/A' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Software:</Text>
              <Text style={styles.infoValue}>{deviceInfo.software}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⏳ Loading device information...</Text>
          <Text style={styles.loadingSubtext}>
            Reading device specifications from your BUZZ MAX watch
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deviceInfoSection: {
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
  connectionInfo: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  connectionId: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 10,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 15,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 