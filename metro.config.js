const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force Zustand to resolve to CJS builds instead of ESM (.mjs) builds.
// Zustand's ESM files use import.meta.env which Metro doesn't support.
const zustandRoot = path.resolve(__dirname, 'node_modules/zustand');
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect zustand ESM imports to CJS entry points
  if (moduleName === 'zustand') {
    return context.resolveRequest(context, zustandRoot + '/index.js', platform);
  }
  if (moduleName === 'zustand/middleware') {
    return context.resolveRequest(context, zustandRoot + '/middleware.js', platform);
  }
  if (moduleName === 'zustand/shallow') {
    return context.resolveRequest(context, zustandRoot + '/shallow.js', platform);
  }
  if (moduleName === 'zustand/vanilla') {
    return context.resolveRequest(context, zustandRoot + '/vanilla.js', platform);
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
