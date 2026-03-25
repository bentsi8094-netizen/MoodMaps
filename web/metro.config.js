const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for SDK 55 / RN 0.81+ import.meta SyntaxError
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
