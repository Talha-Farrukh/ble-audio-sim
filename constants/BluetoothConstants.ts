// Standard Smartwatch GATT Services and Characteristics
export const SMARTWATCH_SERVICES = {
  BATTERY_SERVICE: '180F',
  DEVICE_INFORMATION: '180A',
  HEART_RATE: '180D',
  CURRENT_TIME: '1805',
  ALERT_NOTIFICATION: '1811',
  IMMEDIATE_ALERT: '1802',
  GENERIC_ACCESS: '1800',
  GENERIC_ATTRIBUTE: '1801',
  // Da Fit app specific services for BUZZ MAX
  DA_FIT_SERVICE: 'FEE0',
  DA_FIT_DATA: 'FEE1',
  CUSTOM_SERVICE_1: 'FFF0',
  CUSTOM_SERVICE_2: 'FF00',
  // Additional services that BUZZ MAX might use
  UNKNOWN_SERVICE_1: '6E40',
  UNKNOWN_SERVICE_2: 'FFF3',
};

export const CHARACTERISTICS = {
  // Battery Service
  BATTERY_LEVEL: '2A19',
  BATTERY_POWER_STATE: '2A1A',
  
  // Device Information
  DEVICE_NAME: '2A00',
  MODEL_NUMBER: '2A24',
  SERIAL_NUMBER: '2A25',
  FIRMWARE_REVISION: '2A26',
  HARDWARE_REVISION: '2A27',
  SOFTWARE_REVISION: '2A28',
  MANUFACTURER_NAME: '2A29',
  
  // Heart Rate
  HEART_RATE_MEASUREMENT: '2A37',
  HEART_RATE_CONTROL_POINT: '2A39',
  BODY_SENSOR_LOCATION: '2A38',
  
  // Time Service
  CURRENT_TIME: '2A2B',
  LOCAL_TIME_INFO: '2A0F',
  
  // Alert Services
  ALERT_LEVEL: '2A06',
  NEW_ALERT: '2A46',
  ALERT_STATUS: '2A3F',
  ALERT_NOTIFICATION_CONTROL: '2A44',
  
  // Da Fit specific
  DA_FIT_WRITE: 'FEE1',
  DA_FIT_NOTIFY: 'FEE2',
  
  // Common characteristics that might be used
  WRITE_CHARACTERISTIC: 'FFF4',
  NOTIFY_CHARACTERISTIC: 'FFF5',
};

// Device filtering criteria for smartwatches
export const SMARTWATCH_FILTER_CRITERIA = {
  namePatterns: ['BUZZ MAX', 'BUZZ', 'Zero', 'Watch', 'Band', 'Fit', 'Da Fit', 'Smart', 'ZERO'],
  minRSSI: -75,
  requiredServices: Object.values(SMARTWATCH_SERVICES),
  manufacturerIds: [0x0059, 0x004C, 0x000F], // Nordic, Apple, Broadcom
};

// Alert levels for immediate alert service
export const ALERT_LEVELS = {
  NO_ALERT: 0x00,
  MILD_ALERT: 0x01,
  HIGH_ALERT: 0x02,
};

// Heart rate sensor locations
export const HEART_RATE_SENSOR_LOCATIONS = {
  OTHER: 0,
  CHEST: 1,
  WRIST: 2,
  FINGER: 3,
  HAND: 4,
  EAR_LOBE: 5,
  FOOT: 6,
}; 