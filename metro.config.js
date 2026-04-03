const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure the config works with Expo Go
config.resolver.assetExts = config.resolver.assetExts || [];
config.resolver.sourceExts = config.resolver.sourceExts || ['js', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

module.exports = config;
