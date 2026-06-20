const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Extend (don't replace) Expo's default watchFolders so the monorepo root is
// watched without dropping any defaults expo/metro-config provides.
config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];

// Force all RN-related modules to resolve from mobile's node_modules,
// preventing conflicts with any hoisted root copies.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@macro/core': path.resolve(monorepoRoot, 'packages/core'),
};

module.exports = config;
