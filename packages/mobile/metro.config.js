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
// so @macro/core/firebase can reach the RN persistence helper. Under firebase's
// (forced) legacy resolution below, this resolves to dist/rn/index.js.
const firebaseAuthDir = path.dirname(
  require.resolve('@firebase/auth/package.json', {
    paths: [path.dirname(require.resolve('firebase/package.json', { paths: [projectRoot, monorepoRoot] }))],
  })
);

config.resolver.extraNodeModules = {
  '@macro/core': path.resolve(monorepoRoot, 'packages/core'),
  '@firebase/auth': firebaseAuthDir,
};

if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Firebase JS SDK compatibility (Expo SDK 54).
//
// firebase v10 needs Metro package exports left ON: its umbrella entries have no
// `react-native` main field, so with exports off they fall back to the browser
// build and break on device. The earlier "Component auth has not been registered
// yet" crash came from loading firebase through TWO module instances (umbrella
// via `import` + scoped @firebase/auth via `require`), which splits the internal
// @firebase/component registry. @macro/core/firebase now imports the scoped
// @firebase/* packages consistently instead, so they all share the single
// hoisted @firebase/component. @firebase/auth is the only one npm nests rather
// than hoists, so map it here (its RN build is the one exposing
// getReactNativePersistence). No resolveRequest / package-exports override —
// those break Expo's own entry resolution ("main" has not been registered).

module.exports = config;
