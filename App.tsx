import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Device, Subscription } from 'react-native-ble-plx';

// Hooks
import { useBluetooth } from './hooks/useBluetooth';
import { useSmartwatchServices } from './hooks/useSmartwatchServices';

// Components
import { SmartwatchScanner } from './components/SmartwatchScanner';
import { SmartwatchController } from './components/SmartwatchController';
import { StatusDisplay } from './components/StatusDisplay';
import { ActivityLog } from './components/ActivityLog';

export default function App() {
  // Bluetooth hook
  const { manager, isPermissionGranted, bluetoothState, requestPermissions } = useBluetooth();
  
  // State management
  const [device, setDevice] = useState<Device | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [connectionSubscription, setConnectionSubscription] = useState<Subscription | null>(null);

  // Logging function
  const logMsg = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 199)]);
  };

  // Smartwatch services hook
  const {
    batteryInfo,
    deviceInfo,
    heartRateData,
    heartRateHistory,
    notifications,
    availableServices,
    isDiscovering,
    initializeAllServices,
    sendTimeSync,
    sendTestAlert,
    sendFindMyPhone,
    sendCallAlert,
    sendMessageAlert,
    startWorkout,
    requestHeartRateReading,
    cleanup,
  } = useSmartwatchServices(device, logMsg);

  // Initialize app
  useEffect(() => {
    logMsg('🎯 BUZZ MAX Smartwatch Controller');
    logMsg('📱 Compatible with Da Fit app ecosystem');
    logMsg('🔋 Features: Battery monitoring, Heart rate, Notifications, Time sync');
  }, []);

  // Handle device disconnection
  const handleDisconnection = () => {
    setDevice(null);
    setConnectionStatus('Disconnected');
    
    // Cleanup connection subscription
    if (connectionSubscription) {
      connectionSubscription.remove();
      setConnectionSubscription(null);
    }
    
    // Cleanup smartwatch services
    cleanup();
    
    logMsg('⌚ BUZZ MAX disconnected - returning to scan mode');
  };

  // Connect to device
  const connectToDevice = async (deviceId: string) => {
    try {
      setConnectionStatus('Connecting...');
      logMsg(`🔗 Connecting to BUZZ MAX: ${deviceId}`);
      
      const connectedDevice = await manager.connectToDevice(deviceId, { 
        timeout: 10000,
        requestMTU: 247 
      });
      
      logMsg(`📡 Connected! Discovering services...`);
      
      // Set up real-time connection monitoring
      const connSub = connectedDevice.onDisconnected((error, device) => {
        if (error) {
          logMsg(`❌ BUZZ MAX disconnected with error: ${error.message}`);
        } else {
          logMsg(`⌚ BUZZ MAX disconnected normally`);
        }
        handleDisconnection();
      });
      setConnectionSubscription(connSub);
      
      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Discover services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      logMsg(`🔧 Service discovery complete, setting up features...`);
      
      setDevice(connectedDevice);
      setConnectionStatus('Connected');
      logMsg(`✅ Successfully connected to ${connectedDevice.name || 'BUZZ MAX'}`);
      
      // Wait another moment before initializing services
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Initialize smartwatch services
      logMsg('🔧 About to initialize services...');
      try {
        await initializeAllServices();
        logMsg('✅ Service initialization completed');
      } catch (error) {
        logMsg(`❌ Service initialization failed: ${error}`);
      }
      
    } catch (error) {
      setConnectionStatus('Failed');
      logMsg(`❌ Connection failed: ${error}`);
      console.error('Connection error:', error);
      handleDisconnection();
      
      Alert.alert(
        'Connection Failed',
        'Could not connect to your BUZZ MAX watch. Please ensure:\n\n• Watch is powered on\n• Watch is in pairing mode\n• You\'re close to the watch\n• Try restarting the watch',
        [{ text: 'OK' }]
      );
    }
  };

  // Disconnect from device
  const disconnect = async () => {
    if (device) {
      try {
        await device.cancelConnection();
      } catch (error) {
        logMsg(`❌ Disconnect error: ${error}`);
        handleDisconnection();
      }
    }
  };

  // Enhanced send notification with better error handling
  const handleSendNotification = async (message: string): Promise<boolean> => {
    try {
      const success = await sendTestAlert();
      if (success) {
        logMsg(`📤 Successfully sent test alert to BUZZ MAX`);
      } else {
        logMsg(`❌ Failed to send test alert`);
      }
      return success;
    } catch (error) {
      logMsg(`❌ Error sending notification: ${error}`);
      return false;
    }
  };

  // Enhanced time sync with better error handling
  const handleSyncTime = async (): Promise<boolean> => {
    try {
      const success = await sendTimeSync();
      if (success) {
        logMsg(`🕐 Time sync successful`);
      } else {
        logMsg(`⚠️ Time sync attempted but may not have succeeded`);
      }
      return success;
    } catch (error) {
      logMsg(`❌ Error syncing time: ${error}`);
      return false;
    }
  };

  console.log(log)

  // Show connected view
  if (device && connectionStatus === 'Connected') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <SmartwatchController
            device={device}
            batteryInfo={batteryInfo}
            deviceInfo={deviceInfo}
            heartRateData={heartRateData}
            heartRateHistory={heartRateHistory}
            notifications={notifications}
            isHeartRateMonitoring={!!heartRateData}
            currentTime={new Date().toLocaleTimeString()}
            onSendNotification={handleSendNotification}
            onSyncTime={handleSyncTime}
            onFindMyPhone={sendFindMyPhone}
            onCallAlert={sendCallAlert}
            onMessageAlert={sendMessageAlert}
            onStartWorkout={startWorkout}
            onRequestHeartRate={requestHeartRateReading}
            onDisconnect={disconnect}
            onLog={logMsg}
          />
          
          {/* Activity Log */}
          <ActivityLog log={log} maxItems={50} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show scanning/disconnected view
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <StatusDisplay
          bluetoothState={bluetoothState}
          isPermissionGranted={isPermissionGranted}
          connectionStatus={connectionStatus}
          onRequestPermissions={requestPermissions}
        />

        <SmartwatchScanner
          manager={manager}
          isPermissionGranted={isPermissionGranted}
          bluetoothState={bluetoothState}
          onDeviceSelect={connectToDevice}
          onLog={logMsg}
          isConnecting={connectionStatus === 'Connecting...'}
        />

        {/* Activity Log */}
        <ActivityLog log={log} maxItems={100} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40, // Extra bottom padding to ensure all content is accessible
  },
}); 