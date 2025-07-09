const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Buffer polyfill for Bluetooth functionality
config.resolver.alias = {
  buffer: 'buffer',
};

config.resolver.fallback = {
  buffer: 'buffer',
};

module.exports = config; 