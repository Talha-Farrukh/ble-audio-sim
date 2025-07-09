// Bluetooth Low Energy Constants for Voice Recorder Device
// Based on Voice Recorder Protocol Specification v1.0.2

export const BLE_CONSTANTS = {
  // Main services from the protocol specification
  SERVICES: {
    // Command service for control operations
    COMMAND: "FFF9",
    
    // Audio stream service for real-time recording
    AUDIO_STREAM: "FFF3",
    
    // File stream service for offline file operations
    FILE_STREAM: "FFFC",
    
    // OTA stream service for firmware updates
    OTA_STREAM: "FFF0",
  },

  // Characteristics for each service
  CHARACTERISTICS: {
    // Command service characteristics
    COMMAND_WRITE: "FFFA",
    COMMAND_NOTIFY: "FFFB",
    
    // Audio stream characteristics
    AUDIO_STREAM_NOTIFY: "FFF5",
    AUDIO_STREAM_WRITE: "FFF4",
    
    // File stream characteristics
    FILE_STREAM_NOTIFY: "FFFE",
    FILE_STREAM_WRITE: "FFFD",
    
    // OTA stream characteristics
    OTA_STREAM_NOTIFY: "FFF2",
    OTA_STREAM_WRITE: "FFF1",
  },
};

// Protocol frame structure constants
export const PROTOCOL_CONSTANTS = {
  // Protocol version (2 bytes)
  PROTOCOL_VERSION: [0x01, 0x00], // Version 1.0
  
  // Header identifier (6 bytes): fixed value 0x61696d742d30
  HEADER_IDENTIFIER: [0x61, 0x69, 0x6d, 0x74, 0x2d, 0x30],
  
  // Tail identifier (6 bytes): fixed value 0x61696d742d31 (response only)
  TAIL_IDENTIFIER: [0x61, 0x69, 0x6d, 0x74, 0x2d, 0x31],
  
  // Error codes
  ERROR_CODES: {
    SUCCESS: 0x00,
    ERROR: 0x12,
  },
};

// Recording control commands (Software to Device)
export const RECORDING_COMMANDS = {
  // Basic recording control
  START_RECORDING: 0x61,           // Start real-time recording
  END_RECORDING: 0x62,             // End real-time recording
  PAUSE_RECORDING: 0x7F,           // Pause recording
  RESUME_RECORDING: 0x7E,          // Resume recording
  
  // File operations
  GET_FILE_LIST: 0x63,             // Get file list
  SYNC_FILE_BY_ID: 0x64,           // Sync file by ID
  SYNC_FILE_BY_NAME: 0x72,         // Sync file by filename
  STOP_SYNC_BY_ID: 0x65,           // Stop sync by ID
  STOP_SYNC_BY_NAME: 0x73,         // Stop sync by filename
  DELETE_FILE_BY_ID: 0x66,         // Delete file by ID
  DELETE_FILE_BY_NAME: 0x74,       // Delete file by filename
  
  // Device information
  GET_REMAINING_CAPACITY: 0x67,    // Get remaining storage capacity
  GET_TIME_TIMEZONE: 0x68,         // Get time and timezone
  SYNC_TIME_TIMEZONE: 0x69,        // Sync time and timezone
  GET_FIRMWARE_VERSION: 0x6B,      // Get firmware version
  GET_USER_INFO: 0x6D,             // Get user info
  GET_BATTERY_LEVEL: 0x6E,         // Get battery level
  GET_DEVICE_STATUS: 0x71,         // Get device status
  GET_DEVICE_REALTIME_STATUS: 0x76, // Get real-time status
  GET_DEVICE_UNIQUE_ID: 0xa4,      // Get device unique identifier
  
  // Device settings
  FACTORY_RESET: 0x6A,             // Factory reset
  SET_USB_MODE: 0x6C,              // Set USB mode
  USER_BINDING: 0x6F,              // User binding
  UNBIND: 0x70,                    // Unbind user
  SET_PRIVACY_MODE: 0x75,          // Set privacy mode
  SET_NOISE_REDUCTION: 0xa0,       // Set noise reduction level
  GET_NOISE_REDUCTION: 0xa1,       // Query noise reduction level
  SET_GAIN_LEVEL: 0xa2,            // Set gain level
  GET_GAIN_LEVEL: 0xa3,            // Query gain level
  
  // Authorization
  SET_AUTH_CODE: 0x90,             // Set authorization code
  GET_AUTH_CODE: 0x91,             // Get authorization code
  
  // Channel version
  SET_CHANNEL_VERSION: 0x7A,       // Set channel version
  GET_CHANNEL_VERSION: 0x7B,       // Get channel version
} as const;

// Device to Software notification commands
export const DEVICE_NOTIFICATIONS = {
  RECORDING_ENDED: 0x77,           // Device actively ends recording
  RECORDING_STARTED: 0x78,         // Device actively starts recording
  DEVICE_UNBOUND: 0x79,            // Device actively unbinds
  RECORDING_PAUSED: 0x7D,          // Device actively pauses recording
  RECORDING_RESUMED: 0x7C,         // Device actively resumes recording
  LOW_BATTERY: 0xaa,               // Device low battery broadcast
} as const;

// Device status codes for real-time status
export const DEVICE_STATUS_CODES = {
  NOT_RECORDING: 0,
  RECORDING: 1,
  PLAYING: 2,
  NOT_CHARGING: 0,
  CHARGING: 1,
  UNBOUND: 0,
  BOUND: 1,
  PRIVACY_OFF: 0,
  PRIVACY_ON: 1,
  USB_DISK_OFF: 0,
  USB_DISK_ON: 1,
} as const;

// Recording save flags
export const SAVE_FLAGS = {
  SAVE: 0,
  DONT_SAVE: 1,
} as const;

// USB mode settings
export const USB_MODE = {
  DISABLE: 0,
  ENABLE: 1,
} as const;

// Privacy mode settings
export const PRIVACY_MODE = {
  DISABLE: 0,
  ENABLE: 1,
} as const;

// Noise reduction levels
export const NOISE_REDUCTION_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

// Gain levels
export const GAIN_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

// Connection settings
export const CONNECTION_CONFIG = {
  SCAN_DURATION: 10000,            // 10 seconds
  CONNECTION_TIMEOUT: 15000,       // 15 seconds
  SERVICE_DISCOVERY_TIMEOUT: 5000, // 5 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RECONNECTION_INTERVAL: 2000,     // 2 seconds
  DEFAULT_MTU: 20,                 // Default MTU size
  MAX_MTU: 160,                    // Maximum MTU size in practice
};

// Data transfer settings
export const TRANSFER_CONFIG = {
  MAX_CHUNK_SIZE: 512,             // bytes
  ACK_TIMEOUT: 5000,               // 5 seconds
  MAX_TRANSFER_RETRIES: 3,
  FILE_OFFSET_BYTES: 6,            // Offset field size
  FILE_ID_BYTES: 4,                // File ID field size
};

// Helper functions for protocol frame construction
export const ProtocolHelpers = {
  // Create command frame header
  createCommandHeader: (command: number): number[] => {
    return [
      ...PROTOCOL_CONSTANTS.PROTOCOL_VERSION,
      ...PROTOCOL_CONSTANTS.HEADER_IDENTIFIER,
      command,
    ];
  },

  // Create command frame with data
  createCommandFrame: (command: number, data: number[] = []): number[] => {
    return [
      ...ProtocolHelpers.createCommandHeader(command),
      0x00, // Error code placeholder
      ...data,
    ];
  },

  // Convert Unix timestamp to 4-byte array
  timestampToBytes: (timestamp: number): number[] => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, timestamp, true); // Little endian
    return Array.from(new Uint8Array(buffer));
  },

  // Convert 4-byte array to Unix timestamp
  bytesToTimestamp: (bytes: number[]): number => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return new DataView(buffer).getUint32(0, true);
  },

  // Convert number to 6-byte offset array
  offsetToBytes: (offset: number): number[] => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(offset), true);
    return Array.from(new Uint8Array(buffer)).slice(0, 6);
  },

  // Convert 6-byte array to offset number
  bytesToOffset: (bytes: number[]): number => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    view.set([0, 0], 6); // Pad with zeros
    return Number(new DataView(buffer).getBigUint64(0, true));
  },

  // Check if response has correct header
  isValidResponse: (data: number[]): boolean => {
    if (data.length < 9) return false;
    
    // Check protocol version and header
    const protocolMatch = data.slice(0, 2).every((byte, index) => 
      byte === PROTOCOL_CONSTANTS.PROTOCOL_VERSION[index]
    );
    const headerMatch = data.slice(2, 8).every((byte, index) => 
      byte === PROTOCOL_CONSTANTS.HEADER_IDENTIFIER[index]
    );
    
    return protocolMatch && headerMatch;
  },

  // Extract command and error code from response
  parseResponse: (data: number[]): { command: number; errorCode: number; payload: number[] } | null => {
    if (!ProtocolHelpers.isValidResponse(data)) return null;
    
    const command = data[8];
    const errorCode = data[9];
    const payload = data.slice(10);
    
    return { command, errorCode, payload };
  },
};

// Type definitions
export type RecordingCommand = typeof RECORDING_COMMANDS[keyof typeof RECORDING_COMMANDS];
export type DeviceNotification = typeof DEVICE_NOTIFICATIONS[keyof typeof DEVICE_NOTIFICATIONS];
export type DeviceStatusCode = typeof DEVICE_STATUS_CODES[keyof typeof DEVICE_STATUS_CODES];
export type NoiseReductionLevel = typeof NOISE_REDUCTION_LEVELS[keyof typeof NOISE_REDUCTION_LEVELS];
export type GainLevel = typeof GAIN_LEVELS[keyof typeof GAIN_LEVELS];

// Interface for device file information
export interface DeviceFile {
  name?: string;
  size: number;        // Size in KB
  id: number;          // Unix timestamp
  sn?: string;         // Serial number
  duration?: number;   // Duration in milliseconds
}

// Interface for device status JSON response
export interface DeviceStatus {
  battery: number;                    // 0-100
  bound: number;                      // 0=unbound, 1=bound
  charging: number;                   // 0=not charging, 1=charging
  storage: number;                    // Total storage (KB)
  available_storage: number;          // Available storage (KB)
  available_record_time: number;      // Estimated recording time (ms)
  support_wifi_p2p: number;          // 0=no Wi-Fi direct, 1=support
  time: number;                       // Unix timestamp (ms)
  audio_channel: number;              // Audio channels
  del_after_sync: number;             // 0=don't delete, 1=delete after sync
  usb_mode: number;                   // 0=USB disk off, 1=on
  recording: number;                  // 0=not recording, 1=recording
  ble_protocol_ver: number;           // BLE protocol version
  sn: string;                         // Device serial number
  firm_ver: string;                   // Firmware version
  privacy: number;                    // 0=privacy off, 1=on
} 