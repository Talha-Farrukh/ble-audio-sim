import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';
import { dosmonoBle } from '../modules/expo-dosmono-ble';

// Mock react-native Alert
const mockAlert = Alert as jest.Mocked<typeof Alert>;

describe('App Component', () => {
  const mockDosmonoBle = dosmonoBle as jest.Mocked<typeof dosmonoBle>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDosmonoBle.isBluetoothEnabled.mockReturnValue(true);
    mockDosmonoBle.isGpsEnabled.mockReturnValue(true);
    mockDosmonoBle.getConnectionStatus.mockReturnValue({
      isConnected: false,
      connectedDevice: null,
    });
  });

  describe('Initial Render', () => {
    it('renders main UI elements correctly', () => {
      render(<App />);
      
      expect(screen.getByText('BLE Audio Sim')).toBeOnTheScreen();
      expect(screen.getByText('Dosmono Wearable Control')).toBeOnTheScreen();
      expect(screen.getByText('SDK Initialized:')).toBeOnTheScreen();
      expect(screen.getByText('Connected:')).toBeOnTheScreen();
      expect(screen.getByText('Device Scanning')).toBeOnTheScreen();
      expect(screen.getByText('Activity Log')).toBeOnTheScreen();
    });

    it('shows correct initial status indicators', () => {
      render(<App />);
      
      // Should have red indicators for not initialized and not connected
      const statusIndicators = screen.getAllByTestId('status-indicator');
      expect(statusIndicators).toHaveLength(2);
    });

    it('initializes SDK on mount', () => {
      render(<App />);
      
      expect(mockDosmonoBle.initialize).toHaveBeenCalledWith(
        'com.dosmono.lianying.sdk',
        '473a4acaad6923b14f4d60bb0e6ecdcd8e9e2f76154505d91e5a05aba410ae96'
      );
    });
  });

  describe('SDK Initialization', () => {
    it('handles successful initialization', async () => {
      mockDosmonoBle.initialize.mockResolvedValue(true);
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockDosmonoBle.initialize).toHaveBeenCalled();
      });
    });

    it('handles initialization failure', async () => {
      const errorMessage = 'Initialization failed';
      mockDosmonoBle.initialize.mockRejectedValue(new Error(errorMessage));
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'Failed to initialize SDK');
      });
    });
  });

  describe('Device Scanning', () => {
    it('renders scan buttons correctly', () => {
      render(<App />);
      
      expect(screen.getByText('Start Scan')).toBeOnTheScreen();
      expect(screen.getByText('Stop Scan')).toBeOnTheScreen();
    });

    it('starts device scan when Start Scan button is pressed', async () => {
      mockDosmonoBle.startDeviceSearch.mockResolvedValue(true);
      render(<App />);
      // Simulate successful initialization first
      const initializeCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onAuthResult'
      )?.[1];
      await act(async () => {
        initializeCallback?.({ success: true, message: 'Success' });
      });
      const startScanButton = screen.getByText('Start Scan');
      await act(async () => {
        fireEvent.press(startScanButton);
      });
      expect(mockDosmonoBle.startDeviceSearch).toHaveBeenCalled();
    });

    it('shows error when trying to scan without SDK initialization', async () => {
      render(<App />);
      const startScanButton = screen.getByText('Start Scan');
      await act(async () => {
        fireEvent.press(startScanButton);
      });
      expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'SDK not initialized');
    });

    it('shows error when Bluetooth is disabled', async () => {
      mockDosmonoBle.isBluetoothEnabled.mockReturnValue(false);
      render(<App />);
      // Simulate successful initialization
      const initializeCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onAuthResult'
      )?.[1];
      await act(async () => {
        initializeCallback?.({ success: true, message: 'Success' });
      });
      const startScanButton = screen.getByText('Start Scan');
      await act(async () => {
        fireEvent.press(startScanButton);
      });
      expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'Bluetooth is not enabled');
    });

    it('shows error when GPS is disabled', async () => {
      mockDosmonoBle.isGpsEnabled.mockReturnValue(false);
      render(<App />);
      // Simulate successful initialization
      const initializeCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onAuthResult'
      )?.[1];
      await act(async () => {
        initializeCallback?.({ success: true, message: 'Success' });
      });
      const startScanButton = screen.getByText('Start Scan');
      await act(async () => {
        fireEvent.press(startScanButton);
      });
      expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'GPS location is not enabled');
    });

    it('stops device scan when Stop Scan button is pressed', async () => {
      render(<App />);
      // Simulate scan started
      const searchStartCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onSearchStart'
      )?.[1];
      await act(async () => {
        searchStartCallback?.({});
      });
      const stopScanButton = screen.getByText('Stop Scan');
      await act(async () => {
        fireEvent.press(stopScanButton);
      });
      expect(mockDosmonoBle.stopDeviceSearch).toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    it('sets up all required event listeners', () => {
      render(<App />);
      
      const expectedEvents = [
        'onAuthResult',
        'onSearchStart',
        'onDevicesFound',
        'onSearchStop',
        'onConnectStatus',
        'onConnectSuccess',
        'onConnectFail',
        'onRecordStart',
        'onRecordStop',
        'onCmdReceive',
        'onFileList',
      ];
      
      expectedEvents.forEach(event => {
        expect(mockDosmonoBle.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });
    });

    it('handles onDevicesFound event correctly', async () => {
      render(<App />);
      
      const onDevicesFoundCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onDevicesFound'
      )?.[1];
      
      const mockDevices = [
        { name: 'Test Device 1', mac: '00:11:22:33:44:55', rssi: -45 },
        { name: 'Test Device 2', mac: '11:22:33:44:55:66', rssi: -60 },
      ];
      
      await act(async () => {
        onDevicesFoundCallback?.({ devices: mockDevices });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Found Devices (2)')).toBeOnTheScreen();
        expect(screen.getByText('Test Device 1')).toBeOnTheScreen();
        expect(screen.getByText('Test Device 2')).toBeOnTheScreen();
      });
    });

    it('handles device connection event correctly', async () => {
      render(<App />);
      
      const onConnectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onConnectSuccess'
      )?.[1];
      
      await act(async () => {
        onConnectSuccessCallback?.({ mac: '00:11:22:33:44:55' });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Device: 00:11:22:33:44:55')).toBeOnTheScreen();
        expect(screen.getByText('Recording Controls')).toBeOnTheScreen();
        expect(screen.getByText('Device Information')).toBeOnTheScreen();
      });
    });
  });

  describe('Device Connection', () => {
    it('connects to device when device item is pressed', async () => {
      mockDosmonoBle.connectDevice.mockResolvedValue('00:11:22:33:44:55');
      
      render(<App />);
      
      // First add devices to the list
      const onDevicesFoundCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onDevicesFound'
      )?.[1];
      
      await act(async () => {
        onDevicesFoundCallback?.({ 
          devices: [{ name: 'Test Device', mac: '00:11:22:33:44:55', rssi: -45 }] 
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Device')).toBeOnTheScreen();
      });

      const deviceButton = screen.getByText('Test Device');
      fireEvent.press(deviceButton);
      
      expect(mockDosmonoBle.connectDevice).toHaveBeenCalledWith('00:11:22:33:44:55');
    });

    it('disconnects device when Disconnect button is pressed', async () => {
      render(<App />);
      
      // Simulate connected state
      const onConnectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onConnectSuccess'
      )?.[1];
      await act(async () => {
        onConnectSuccessCallback?.({ mac: '00:11:22:33:44:55' });
      });

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeOnTheScreen();
      });

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.press(disconnectButton);
      
      expect(mockDosmonoBle.disconnectDevice).toHaveBeenCalled();
    });
  });

  describe('Recording Functionality', () => {
    beforeEach(async () => {
      // Setup connected state for recording tests
      render(<App />);
      
      const onConnectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onConnectSuccess'
      )?.[1];
      await act(async () => {
        onConnectSuccessCallback?.({ mac: '00:11:22:33:44:55' });
      });

      await waitFor(() => {
        expect(screen.getByText('Recording Controls')).toBeOnTheScreen();
      });
    });

    it('starts recording when Start Recording button is pressed', async () => {
      mockDosmonoBle.initializeRecording.mockResolvedValue(true);
      mockDosmonoBle.startRecording.mockResolvedValue(true);
      const startRecordingButton = screen.getByText('Start Recording');
      await act(async () => {
        fireEvent.press(startRecordingButton);
      });
      expect(mockDosmonoBle.initializeRecording).toHaveBeenCalled();
      expect(mockDosmonoBle.startRecording).toHaveBeenCalled();
    });

    it('shows error when trying to record without connection', async () => {
      render(<App />);
      // Don't simulate connection
      const startRecordingButton = screen.getByText('Start Recording');
      await act(async () => {
        fireEvent.press(startRecordingButton);
      });
      expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'No device connected');
    });

    it('stops recording when Stop Recording button is pressed during recording', async () => {
      // Simulate recording state
      const onRecordStartCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onRecordStart'
      )?.[1];
      await act(async () => {
        onRecordStartCallback?.({
          fileName: 'test.wav',
          path: '/test/',
          fileType: 1,
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeOnTheScreen();
      });

      const stopRecordingButton = screen.getByText('Stop Recording');
      fireEvent.press(stopRecordingButton);
      
      expect(mockDosmonoBle.stopRecording).toHaveBeenCalled();
    });
  });

  describe('Device Information Commands', () => {
    beforeEach(async () => {
      // Setup connected state for device info tests
      render(<App />);
      
      const onConnectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onConnectSuccess'
      )?.[1];
      await act(async () => {
        onConnectSuccessCallback?.({ mac: '00:11:22:33:44:55' });
      });

      await waitFor(() => {
        expect(screen.getByText('Device Information')).toBeOnTheScreen();
      });
    });

    it('sends battery command when Battery button is pressed', async () => {
      const batteryButton = screen.getByText('Battery');
      fireEvent.press(batteryButton);
      
      expect(mockDosmonoBle.sendCommand).toHaveBeenCalledWith('', 'ELECTRICITY');
    });

    it('sends memory command when Memory button is pressed', async () => {
      const memoryButton = screen.getByText('Memory');
      fireEvent.press(memoryButton);
      
      expect(mockDosmonoBle.sendCommand).toHaveBeenCalledWith('', 'MEMORY');
    });

    it('sends version command when Version button is pressed', async () => {
      const versionButton = screen.getByText('Version');
      fireEvent.press(versionButton);
      
      expect(mockDosmonoBle.sendCommand).toHaveBeenCalledWith('', 'VERSION');
    });

    it('sends file list command when Files button is pressed', async () => {
      const filesButton = screen.getByText('Files');
      fireEvent.press(filesButton);
      
      expect(mockDosmonoBle.sendCommand).toHaveBeenCalledWith('', 'FILE_LIST');
    });
  });

  describe('Activity Log', () => {
    it('adds log entry when authentication succeeds', async () => {
      render(<App />);
      
      const onAuthResultCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onAuthResult'
      )?.[1];
      
      await act(async () => {
        onAuthResultCallback?.({ success: true, message: 'Authentication successful' });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Auth: Success - Authentication successful/)).toBeOnTheScreen();
      });
    });

    it('adds log entry when device scan starts', async () => {
      render(<App />);
      
      const onSearchStartCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onSearchStart'
      )?.[1];
      
      await act(async () => {
        onSearchStartCallback?.({});
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Device scan started/)).toBeOnTheScreen();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles scan error gracefully', async () => {
      mockDosmonoBle.startDeviceSearch.mockRejectedValue(new Error('Scan failed'));
      render(<App />);
      // Initialize first
      const authCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onAuthResult'
      )?.[1];
      await act(async () => {
        authCallback?.({ success: true, message: 'Success' });
      });
      const startScanButton = screen.getByText('Start Scan');
      await act(async () => {
        fireEvent.press(startScanButton);
      });
      await waitFor(() => {
        expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'Failed to start device scan');
      });
    });

    it('handles recording error gracefully', async () => {
      mockDosmonoBle.initializeRecording.mockRejectedValue(new Error('Recording failed'));
      
      render(<App />);
      
      // Setup connected state
      const onConnectSuccessCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onConnectSuccess'
      )?.[1];
      onConnectSuccessCallback?.({ mac: '00:11:22:33:44:55' });

      await waitFor(() => {
        expect(screen.getByText('Start Recording')).toBeOnTheScreen();
      });

      const startRecordingButton = screen.getByText('Start Recording');
      fireEvent.press(startRecordingButton);
      
      await waitFor(() => {
        expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'Failed to start recording');
      });
    });

    it('handles device connection error gracefully', async () => {
      mockDosmonoBle.connectDevice.mockRejectedValue(new Error('Connection failed'));
      
      render(<App />);
      
      // Add devices to the list
      const onDevicesFoundCallback = mockDosmonoBle.addEventListener.mock.calls.find(
        call => call[0] === 'onDevicesFound'
      )?.[1];
      await act(async () => {
        onDevicesFoundCallback?.({ 
          devices: [{ name: 'Test Device', mac: '00:11:22:33:44:55', rssi: -45 }] 
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Device')).toBeOnTheScreen();
      });

      // Try to connect to the device
      const deviceItem = screen.getByText('Test Device');
      fireEvent.press(deviceItem);
      
      await waitFor(() => {
        expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'Failed to connect to device');
      });
    });
  });
}); 