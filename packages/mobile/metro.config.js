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

// firebase 10's getReactNativePersistence ships ONLY in the scoped
// @firebase/auth React Native build, which npm nests under firebase/ and does
// not hoist — so a bare `@firebase/auth` import can't be resolved from the core
// package. Resolve it dynamically (relative to firebase) and map the specifier
// so @macro/core/firebase can reach the RN persistence helper. With package
// exports disabled (below), this resolves to dist/rn/index.js.
const firebaseAuthDir = path.dirname(
  require.resolve('@firebase/auth/package.json', {
    paths: [path.dirname(require.resolve('firebase/package.json', { paths: [projectRoot, monorepoRoot] }))],
  })
);

config.resolver.extraNodeModules = {
  '@macro/core': path.resolve(monorepoRoot, 'packages/core'),
  '@firebase/auth': firebaseAuthDir,
};

// Firebase JS SDK compatibility (Expo SDK 53+). Metro's package-exports
// resolution (default-on in SDK 54) resolves Firebase's subpaths through
// multiple module instances, duplicating its internal @firebase/component
// registry — so the 'auth' component registers on one instance while getAuth()
// reads from another, throwing "Component auth has not been registered yet".
// Disabling package exports + allowing .cjs restores the single-instance
// resolution Firebase expects. See expo.fyi + firebase-js-sdk#7584.
config.resolver.unstable_enablePackageExports = false;
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;
