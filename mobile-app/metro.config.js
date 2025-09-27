const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Expo Metro config
const config = getDefaultConfig(__dirname);

// Add resolver alias for the monorepo structure
config.resolver.alias = {
  '@client': path.resolve(__dirname, '../client/src'),
  '@shared': path.resolve(__dirname, '../shared'),
  '@mobile': path.resolve(__dirname, './'),
};

// Watch additional folders for changes
config.watchFolders = [
  path.resolve(__dirname, '../client'),
  path.resolve(__dirname, '../shared'),
];

module.exports = config;