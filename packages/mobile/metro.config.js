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
// firebase's component registry lives in @firebase/app (+ @firebase/component).
// Under Metro package exports, those shared singletons get loaded as BOTH an ESM
// and a CJS module instance (different firebase sub-builds import them via
// `import` vs `require`), producing two registries: 'auth' registers in one,
// getAuth() reads the other. firebase v10/v11 both ship this way
// (firebase-js-sdk#7584).
//
// Pin ONLY those two registry-critical singletons to their single CJS build so
// every firebase sub-package shares one instance. We deliberately do NOT disable
// package exports (that drops firebase to its browser build, breaking on device)
// and do NOT touch any non-firebase module (so Expo's own entry still resolves).
// @firebase/util is left alone — its CJS main is a Node-specific build unsafe on RN.
const PINNED_FIREBASE_CJS = {};
for (const name of ['@firebase/app', '@firebase/component']) {
  const pkgPath = require.resolve(`${name}/package.json`, {
    paths: [projectRoot, monorepoRoot],
  });
  PINNED_FIREBASE_CJS[name] = path.resolve(path.dirname(pkgPath), require(pkgPath).main);
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (Object.prototype.hasOwnProperty.call(PINNED_FIREBASE_CJS, moduleName)) {
    return { type: 'sourceFile', filePath: PINNED_FIREBASE_CJS[moduleName] };
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
