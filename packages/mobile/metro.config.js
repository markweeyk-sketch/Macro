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

// getReactNativePersistence ships ONLY in the scoped @firebase/auth React Native
// build, which npm nests under firebase/ and does not hoist — so a bare
// `@firebase/auth` import can't be resolved from the core package. Map the
// specifier to that nested package (its RN export condition → dist/rn, which
// exposes getReactNativePersistence).
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

// Firebase JS SDK compatibility (Expo SDK 54) — fixes "Component auth has not
// been registered yet".
//
// firebase's component registry lives in @firebase/component (+ @firebase/app).
// Its `exports` map only offers { require: <cjs>, default: <esm> } with NO
// react-native condition, so under Metro package exports it loads as the CJS
// build for require() callers and the ESM build for import callers — two module
// instances, two registries: 'auth' registers in one, getAuth() reads the other
// (firebase-js-sdk#7584; firebase v10 and v11 both ship this way).
//
// Adding "require" to the resolver condition set makes any package whose exports
// list `require` before `default` resolve to its CJS build for BOTH import and
// require callers, collapsing @firebase/component to a single instance. Packages
// that expose a react-native condition (e.g. @firebase/auth -> dist/rn, which is
// where getReactNativePersistence lives) still win on react-native, which Expo
// already injects for ios/android. This is a resolver *condition* (not a
// resolveRequest override, which clobbers Expo's own entry resolution and breaks
// app registration).
config.resolver.unstable_conditionNames = [
  ...(config.resolver.unstable_conditionNames ?? []),
  'require',
];

module.exports = config;
