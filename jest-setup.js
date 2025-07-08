// Jest setup file for React Native Testing Library
import '@testing-library/react-native/extend-expect';

// Mock React Native modules that don't work well in Jest
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

// Mock our custom BLE module and its native dependencies
jest.mock('./modules/expo-dosmono-ble/src/ExpoDosmonoBle', () => ({
  requireNativeModule: jest.fn(() => ({
    initSDK: jest.fn(),
    isBluetoothEnabled: jest.fn(),
    isGpsEnabled: jest.fn(),
    startScan: jest.fn(),
    stopScan: jest.fn(),
    connectDevice: jest.fn(),
    disconnectDevice: jest.fn(),
    sendCommand: jest.fn(),
    startRecord: jest.fn(),
    stopRecord: jest.fn(),
    deleteFile: jest.fn(),
    downloadFile: jest.fn(),
    setBleRecordCallback: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  EventEmitter: jest.fn(() => ({
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
  })),
}));

// Mock our custom BLE module with better async handling
let mockEventListeners = {};

jest.mock('./modules/expo-dosmono-ble', () => ({
  dosmonoBle: {
    initialize: jest.fn(),
    isBluetoothEnabled: jest.fn(),
    isGpsEnabled: jest.fn(),
    startDeviceSearch: jest.fn(),
    stopDeviceSearch: jest.fn(),
    connectDevice: jest.fn(),
    disconnectDevice: jest.fn(),
    sendCommand: jest.fn(),
    initializeRecording: jest.fn(),
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    getConnectionStatus: jest.fn(),
    addEventListener: jest.fn((eventName, callback) => {
      if (!mockEventListeners[eventName]) {
        mockEventListeners[eventName] = [];
      }
      mockEventListeners[eventName].push(callback);
    }),
    removeAllEventListeners: jest.fn(() => {
      mockEventListeners = {};
    }),
    release: jest.fn(),
    // Helper for tests to trigger events
    _triggerEvent: (eventName, data) => {
      if (mockEventListeners[eventName]) {
        mockEventListeners[eventName].forEach(callback => {
          callback(data);
        });
      }
    },
  },
}));

// Mock React Native components that cause issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return Object.setPrototypeOf({
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((specifics) => specifics.ios || specifics.default),
    },
  }, RN);
});

// Console error suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Setup fake timers for user events
jest.useFakeTimers();

// Global test timeout
jest.setTimeout(10000); 