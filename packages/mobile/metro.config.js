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

// Firebase JS SDK compatibility (Expo SDK 54). The "Component auth has not been
// registered yet" crash came from @macro/core/firebase mixing `import` and
// `require` of the SAME `firebase/auth` specifier, which package-exports
// resolution split into two umbrella module instances (and two component
// registries). That is fixed in core by importing the umbrella once and only
// touching the scoped @firebase/auth (mapped above) for getReactNativePersistence.
//
// NOTE: do NOT set `unstable_enablePackageExports = false` here — Expo SDK 54's
// own entry/runtime modules resolve via package exports, and disabling it breaks
// app registration ("main" has not been registered). Allowing .cjs is safe and
// helps firebase's CJS files resolve.
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;
