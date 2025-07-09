import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DeviceScanner } from './components/DeviceScanner';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>BLE Audio Sim</Text>
        <Text style={styles.subtitle}>Wearable Voice Recording Device</Text>
      </View>
      
      <View style={styles.container}>
        <DeviceScanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 0,
  },
}); 