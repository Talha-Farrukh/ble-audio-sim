import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { DosmonoDevice, FileInfo, RecordingInfo } from '../../modules/expo-dosmono-ble/src/ExpoDosmonoBle.types';

// Re-export everything from React Native Testing Library
export * from '@testing-library/react-native';

// Custom render function with common providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add any global providers here if needed in the future
    // For now, just return children directly
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock data factories
export const createMockDevice = (overrides: Partial<DosmonoDevice> = {}): DosmonoDevice => ({
  name: 'Test Device',
  mac: '00:11:22:33:44:55',
  rssi: -45,
  ...overrides,
});

export const createMockDevices = (count: number = 2): DosmonoDevice[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockDevice({
      name: `Test Device ${index + 1}`,
      mac: `00:11:22:33:44:${(55 + index).toString(16).padStart(2, '0')}`,
      rssi: -45 - (index * 5),
    })
  );
};

export const createMockFileInfo = (overrides: Partial<FileInfo> = {}): FileInfo => ({
  fileName: 'test_recording.wav',
  fileSize: 1024000, // 1MB
  createTime: '2023-12-01T12:00:00Z',
  ...overrides,
});

export const createMockRecordingInfo = (overrides: Partial<RecordingInfo> = {}): RecordingInfo => ({
  fileName: 'recording_20231201_120000.wav',
  path: '/storage/recordings/',
  fileType: 1,
  ...overrides,
});

// Event simulation helpers
export function simulateBleEvent(mockBle: any, eventName: string, data: any) {
  const callback = mockBle.addEventListener.mock.calls.find(
    (call: any) => call[0] === eventName
  )?.[1];
  
  if (callback) {
    callback(data);
  } else {
    console.warn(`No listener found for event: ${eventName}`);
  }
}

// Common test scenarios
export class BleTestScenarios {
  constructor(private mockBle: any) {}

  // Simulate successful SDK initialization
  initializeSDK(success: boolean = true, message: string = 'SDK Initialized') {
    simulateBleEvent(this.mockBle, 'onAuthResult', { 
      success, 
      message 
    });
  }

  // Simulate device scan workflow
  startDeviceScan(devices: DosmonoDevice[] = createMockDevices()) {
    // Start scan
    simulateBleEvent(this.mockBle, 'onSearchStart', {});
    
    // Found devices
    setTimeout(() => {
      simulateBleEvent(this.mockBle, 'onDevicesFound', { devices });
    }, 100);
    
    return devices;
  }

  // Simulate device connection
  connectToDevice(deviceMac: string = '00:11:22:33:44:55') {
    simulateBleEvent(this.mockBle, 'onConnectStatus', { 
      mac: deviceMac, 
      connected: true 
    });
    
    simulateBleEvent(this.mockBle, 'onConnectSuccess', { 
      mac: deviceMac 
    });
  }

  // Simulate recording workflow
  startRecording(recordingInfo: RecordingInfo = createMockRecordingInfo()) {
    simulateBleEvent(this.mockBle, 'onRecordStart', recordingInfo);
  }

  stopRecording() {
    simulateBleEvent(this.mockBle, 'onRecordStop', {});
  }

  // Simulate device command responses
  respondToCommand(command: string, flag: string) {
    simulateBleEvent(this.mockBle, 'onCmdReceive', { command, flag });
  }

  // Simulate file list response
  sendFileList(files: FileInfo[] = [createMockFileInfo()]) {
    simulateBleEvent(this.mockBle, 'onFileList', { files });
  }

  // Simulate connection failure
  failConnection() {
    simulateBleEvent(this.mockBle, 'onConnectFail', {});
  }

  // Simulate disconnection
  disconnect(deviceMac: string = '00:11:22:33:44:55') {
    simulateBleEvent(this.mockBle, 'onConnectStatus', { 
      mac: deviceMac, 
      connected: false 
    });
  }
}

// Test state management helpers
export class TestStateManager {
  private state: any = {};

  setState(key: string, value: any) {
    this.state[key] = value;
  }

  getState(key: string) {
    return this.state[key];
  }

  clearState() {
    this.state = {};
  }

  // Common state presets
  setConnectedState(deviceMac: string = '00:11:22:33:44:55') {
    this.setState('isConnected', true);
    this.setState('connectedDevice', deviceMac);
    this.setState('isInitialized', true);
  }

  setDisconnectedState() {
    this.setState('isConnected', false);
    this.setState('connectedDevice', null);
  }

  setRecordingState(isRecording: boolean = true) {
    this.setState('isRecording', isRecording);
  }

  setScanningState(isScanning: boolean = true) {
    this.setState('isScanning', isScanning);
  }
}

// Assertion helpers
export const assertions = {
  // Check if element has correct accessibility properties
  toBeAccessible: (element: any) => {
    expect(element).toHaveProp('accessible', true);
    expect(element).toHaveProp('accessibilityRole');
  },

  // Check device list rendering
  deviceListToContain: (devices: DosmonoDevice[]) => {
    devices.forEach(device => {
      expect(screen.getByText(device.name)).toBeOnTheScreen();
      expect(screen.getByText(device.mac)).toBeOnTheScreen();
      expect(screen.getByText(`RSSI: ${device.rssi} dBm`)).toBeOnTheScreen();
    });
  },

  // Check log entries
  logToContain: (message: string) => {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeOnTheScreen();
  },

  // Check button states
  buttonToBeEnabled: (buttonText: string) => {
    const button = screen.getByText(buttonText);
    expect(button).toBeEnabled();
  },

  buttonToBeDisabled: (buttonText: string) => {
    const button = screen.getByText(buttonText);
    expect(button).toBeDisabled();
  },
};

// Performance testing helpers
export class PerformanceTestUtils {
  static measureRenderTime = (renderFn: () => void): number => {
    const start = performance.now();
    renderFn();
    return performance.now() - start;
  };

  static expectRenderTimeToBeLessThan = (renderFn: () => void, maxTime: number) => {
    const renderTime = PerformanceTestUtils.measureRenderTime(renderFn);
    expect(renderTime).toBeLessThan(maxTime);
  };
}

// Memory leak detection helpers
export class MemoryTestUtils {
  private static eventListeners: any[] = [];

  static trackEventListener = (listener: any) => {
    MemoryTestUtils.eventListeners.push(listener);
  };

  static verifyNoLeakedListeners = () => {
    expect(MemoryTestUtils.eventListeners).toHaveLength(0);
  };

  static clearTrackedListeners = () => {
    MemoryTestUtils.eventListeners = [];
  };
}

// Wait helpers for common patterns
export const waitHelpers = {
  forInitialization: () => 
    waitFor(() => expect(screen.getByText(/SDK Initialized/)).toBeOnTheScreen()),
  
  forConnection: () =>
    waitFor(() => expect(screen.getByText(/Connected:/)).toBeOnTheScreen()),
  
  forDisconnection: () =>
    waitFor(() => expect(screen.queryByText(/Device:/)).not.toBeOnTheScreen()),
  
  forDevicesFound: (count: number) =>
    waitFor(() => expect(screen.getByText(`Found Devices (${count})`)).toBeOnTheScreen()),
  
  forRecordingStart: () =>
    waitFor(() => expect(screen.getByText('Stop Recording')).toBeOnTheScreen()),
  
  forRecordingStop: () =>
    waitFor(() => expect(screen.getByText('Start Recording')).toBeOnTheScreen()),
  
  forError: (errorMessage: string) =>
    waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', errorMessage)),
};

// Test data generators
export const generators = {
  randomMacAddress: (): string => {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join(':');
  },

  randomDeviceName: (): string => {
    const prefixes = ['Dosmono', 'Device', 'Sensor', 'Monitor'];
    const suffixes = ['Pro', 'Mini', 'Max', 'Lite'];
    const numbers = Math.floor(Math.random() * 1000);
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]} ${numbers}`;
  },

  randomRSSI: (): number => {
    return Math.floor(Math.random() * 60) - 100; // -100 to -40 dBm
  },

  timestamp: (): string => {
    return new Date().toISOString();
  },
};

// Custom matchers (extend Jest)
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(min: number, max: number): R;
      toHaveValidMacAddress(): R;
    }
  }
}

// Export default render for convenience
export { renderWithProviders as render };

// Import assertions for global use in tests
import { screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native'; 