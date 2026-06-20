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
// With Metro package exports ON (the SDK 54 default), firebase v10 resolves its
// shared singletons (@firebase/component, @firebase/app) through both the ESM
// and CJS export conditions, producing TWO component registries: the umbrella
// `firebase/auth` registers the 'auth' component in one, while getAuth()/
// initializeAuth() read the other → "Component auth has not been registered yet".
//
// Turning package exports off *globally* fixes firebase but breaks Expo's own
// entry/runtime ("main" has not been registered). So disable package exports
// SURGICALLY — only for firebase/@firebase specifiers — via resolveRequest, and
// leave every other package on the modern resolver. This forces firebase down
// its legacy main/browser/react-native fields → single shared instances, and
// makes @firebase/auth resolve to its dist/rn build (with getReactNativePersistence).
const isFirebaseModule = (name) =>
  name === 'firebase' ||
  name.startsWith('firebase/') ||
  name.startsWith('@firebase/');

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = context.resolveRequest || defaultResolveRequest;
  if (isFirebaseModule(moduleName)) {
    return resolve(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    );
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
