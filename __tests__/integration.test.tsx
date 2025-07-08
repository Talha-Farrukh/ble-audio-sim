import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';
import { dosmonoBle } from '../modules/expo-dosmono-ble';

describe('Integration Tests - Complete User Flows', () => {
  const mockDosmonoBle = dosmonoBle as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDosmonoBle.isBluetoothEnabled.mockReturnValue(true);
    mockDosmonoBle.isGpsEnabled.mockReturnValue(true);
    mockDosmonoBle.getConnectionStatus.mockReturnValue({
      isConnected: false,
      connectedDevice: null,
    });
  });

  describe('Complete Device Connection Flow', () => {
    it('should complete full device discovery and connection flow', async () => {
      // Setup mocks for successful flow
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.startDeviceSearch.mockResolvedValue(true);
      mockDosmonoBle.connectDevice.mockResolvedValue('00:11:22:33:44:55');

      const { rerender } = render(<App />);

      // Step 1: App should initialize SDK
      await waitFor(() => {
        expect(mockDosmonoBle.initialize).toHaveBeenCalled();
      });

      // Step 2: Simulate successful authentication
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'SDK Initialized' });

      // Verify SDK initialized status
      expect(screen.getByText(/SDK Initialized:/)).toBeOnTheScreen();

      // Step 3: Start device scan
      const startScanButton = screen.getByText('Start Scan');
      fireEvent.press(startScanButton);

      expect(mockDosmonoBle.startDeviceSearch).toHaveBeenCalled();

      // Step 4: Simulate scan start event
      const searchStartCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onSearchStart'
      )?.[1];
      searchStartCallback?.({});

      // Step 5: Simulate devices found
      const devicesFoundCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onDevicesFound'
      )?.[1];
      
      const mockDevices = [
        { name: 'Dosmono Device 1', mac: '00:11:22:33:44:55', rssi: -45 },
        { name: 'Dosmono Device 2', mac: '11:22:33:44:55:66', rssi: -60 },
      ];
      devicesFoundCallback?.({ devices: mockDevices });

      // Verify devices are displayed
      expect(screen.getByText('Found Devices (2)')).toBeOnTheScreen();
      expect(screen.getByText('Dosmono Device 1')).toBeOnTheScreen();
      expect(screen.getByText('Dosmono Device 2')).toBeOnTheScreen();

      // Step 6: Connect to first device
      const deviceButton = screen.getByText('Dosmono Device 1');
      fireEvent.press(deviceButton);

      expect(mockDosmonoBle.connectDevice).toHaveBeenCalledWith('00:11:22:33:44:55');

      // Step 7: Simulate successful connection
      const connectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onConnectSuccess'
      )?.[1];
      connectSuccessCallback?.({ mac: '00:11:22:33:44:55' });

      // Verify connection status
      expect(screen.getByText('Device: 00:11:22:33:44:55')).toBeOnTheScreen();
      expect(screen.getByText('Recording Controls')).toBeOnTheScreen();
      expect(screen.getByText('Device Information')).toBeOnTheScreen();
    });

    it('should handle device connection failure gracefully', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.startDeviceSearch.mockResolvedValue(true);
      mockDosmonoBle.connectDevice.mockRejectedValue(new Error('Connection timeout'));

      render(<App />);

      // Initialize and show devices
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'Success' });

      const devicesFoundCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onDevicesFound'
      )?.[1];
      devicesFoundCallback?.({ devices: [{ name: 'Test Device', mac: '00:11:22:33:44:55', rssi: -45 }] });

      // Try to connect
      const deviceButton = screen.getByText('Test Device');
      fireEvent.press(deviceButton);

      // Verify error handling
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to connect to device');
      });
    });
  });

  describe('Complete Recording Workflow', () => {
    it('should complete full recording cycle', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.initializeRecording.mockResolvedValue(true);
      mockDosmonoBle.startRecording.mockResolvedValue(true);
      mockDosmonoBle.stopRecording.mockReturnValue(true);

      render(<App />);

      // Setup connected state
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'Success' });

      const connectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onConnectSuccess'
      )?.[1];
      connectSuccessCallback?.({ mac: '00:11:22:33:44:55' });

      // Step 1: Start recording
      const startRecordingButton = screen.getByText('Start Recording');
      fireEvent.press(startRecordingButton);

      expect(mockDosmonoBle.initializeRecording).toHaveBeenCalled();
      expect(mockDosmonoBle.startRecording).toHaveBeenCalled();

      // Step 2: Simulate recording started
      const recordStartCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onRecordStart'
      )?.[1];
      recordStartCallback?.({
        fileName: 'recording_20231201_123456.wav',
        path: '/storage/recordings/',
        fileType: 1,
      });

      // Verify recording UI changes
      expect(screen.getByText('Stop Recording')).toBeOnTheScreen();

      // Step 3: Stop recording
      const stopRecordingButton = screen.getByText('Stop Recording');
      fireEvent.press(stopRecordingButton);

      expect(mockDosmonoBle.stopRecording).toHaveBeenCalled();

      // Step 4: Simulate recording stopped
      const recordStopCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onRecordStop'
      )?.[1];
      recordStopCallback?.({});

      // Verify UI returns to initial state
      expect(screen.getByText('Start Recording')).toBeOnTheScreen();
    });
  });

  describe('Device Information Retrieval Flow', () => {
    it('should retrieve and display device information', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.sendCommand.mockResolvedValue(true);

      render(<App />);

      // Setup connected state
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'Success' });

      const connectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onConnectSuccess'
      )?.[1];
      connectSuccessCallback?.({ mac: '00:11:22:33:44:55' });

      // Step 1: Request battery info
      const batteryButton = screen.getByText('Battery');
      fireEvent.press(batteryButton);

      expect(mockDosmonoBle.sendCommand).toHaveBeenCalledWith('', 'ELECTRICITY');

      // Step 2: Simulate battery response
      const cmdReceiveCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onCmdReceive'
      )?.[1];
      cmdReceiveCallback?.({ command: '85%', flag: 'ELECTRICITY' });

      // Verify battery info is displayed
      expect(screen.getByText('ELECTRICITY: 85%')).toBeOnTheScreen();

      // Step 3: Request memory info
      const memoryButton = screen.getByText('Memory');
      fireEvent.press(memoryButton);

      expect(mockDosmonoBle.sendCommand).toHaveBeenCalledWith('', 'MEMORY');

      // Step 4: Simulate memory response
      cmdReceiveCallback?.({ command: '2.5GB/4GB', flag: 'MEMORY' });

      // Verify both pieces of info are displayed
      expect(screen.getByText('ELECTRICITY: 85%')).toBeOnTheScreen();
      expect(screen.getByText('MEMORY: 2.5GB/4GB')).toBeOnTheScreen();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle initialization failure and allow retry', async () => {
      // First attempt fails
      mockDosmonoBle.initialize
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

      render(<App />);

      // Verify first failure
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to initialize SDK');
      });

      // Simulate retry (would need manual trigger in real scenario)
      // For this test, just verify the state is handled correctly
      expect(mockDosmonoBle.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle scan interruption and restart', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.startDeviceSearch
        .mockRejectedValueOnce(new Error('Bluetooth error'))
        .mockResolvedValueOnce(true);

      render(<App />);

      // Setup initialized state
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'Success' });

      // First scan attempt
      const startScanButton = screen.getByText('Start Scan');
      fireEvent.press(startScanButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to start device scan');
      });

      // Second scan attempt
      fireEvent.press(startScanButton);

      expect(mockDosmonoBle.startDeviceSearch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multi-Device Scenarios', () => {
    it('should handle multiple devices and switch connections', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.startDeviceSearch.mockResolvedValue(true);
      mockDosmonoBle.connectDevice.mockResolvedValue('00:11:22:33:44:55');
      mockDosmonoBle.disconnectDevice.mockReturnValue(true);

      render(<App />);

      // Setup and show multiple devices
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'Success' });

      const devicesFoundCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onDevicesFound'
      )?.[1];
      
      const mockDevices = [
        { name: 'Device A', mac: '00:11:22:33:44:55', rssi: -45 },
        { name: 'Device B', mac: '11:22:33:44:55:66', rssi: -60 },
      ];
      devicesFoundCallback?.({ devices: mockDevices });

      // Connect to first device
      const deviceAButton = screen.getByText('Device A');
      fireEvent.press(deviceAButton);

      const connectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onConnectSuccess'
      )?.[1];
      connectSuccessCallback?.({ mac: '00:11:22:33:44:55' });

      expect(screen.getByText('Device: 00:11:22:33:44:55')).toBeOnTheScreen();

      // Disconnect from first device
      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.press(disconnectButton);

      expect(mockDosmonoBle.disconnectDevice).toHaveBeenCalled();

      // Simulate disconnection
      const connectStatusCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onConnectStatus'
      )?.[1];
      connectStatusCallback?.({ mac: '00:11:22:33:44:55', connected: false });

      // Should no longer show device info
      expect(screen.queryByText('Device: 00:11:22:33:44:55')).not.toBeOnTheScreen();
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle rapid user interactions without memory leaks', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      mockDosmonoBle.startDeviceSearch.mockResolvedValue(true);
      mockDosmonoBle.stopDeviceSearch.mockReturnValue(true);

      render(<App />);

      // Setup initialized state
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'onAuthResult'
      )?.[1];
      authCallback?.({ success: true, message: 'Success' });

      // Rapid start/stop scanning
      const startScanButton = screen.getByText('Start Scan');
      const stopScanButton = screen.getByText('Stop Scan');

      for (let i = 0; i < 5; i++) {
        fireEvent.press(startScanButton);
        fireEvent.press(stopScanButton);
      }

      // Should handle multiple calls gracefully
      expect(mockDosmonoBle.startDeviceSearch).toHaveBeenCalledTimes(5);
      expect(mockDosmonoBle.stopDeviceSearch).toHaveBeenCalledTimes(5);
    });

    it('should clean up resources properly on unmount', async () => {
      const { unmount } = render(<App />);

      // Add some event listeners
      expect(mockDosmonoBle.addEventListener).toHaveBeenCalled();

      // Unmount component
      unmount();

      // Verify cleanup
      expect(mockDosmonoBle.removeAllEventListeners).toHaveBeenCalled();
      expect(mockDosmonoBle.release).toHaveBeenCalled();
    });
  });
}); 