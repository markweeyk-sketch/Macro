// Expo entry point. package.json "main" points here.
//
// We can't use the default expo/AppEntry.js: expo is hoisted to the monorepo
// root, so AppEntry's `import App from '../../App'` would resolve to the repo
// root's WEB app.jsx copy (Windows is case-insensitive), not this app. And
// pointing "main" straight at App.js boots nothing — App.js only exports a
// component, so AppRegistry never registers "main" and the app crashes with
// '"main" has not been registered'. This file is the required registration.
//
// Theme boot: the app's screens build their StyleSheets from the shared
// `colors` palette at module-evaluation time, so the persisted theme must be
// applied to `colors` BEFORE any screen module is evaluated. We therefore
// register a tiny Root synchronously (so "main" is registered with no boot
// race), read the saved theme asynchronously, applyTheme(), and only then
// lazily require('./App') — that first require is what evaluates the screens,
// now against the mutated palette. Changing the theme re-boots the JS (see
// ProfileScreen), which re-runs this and rebuilds every StyleSheet.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme, colors } from '@macro/core/theme';

function Root() {
  const [App, setApp] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('macro.theme');
        if (raw) applyTheme(JSON.parse(raw));
      } catch {
        // no saved theme / bad value — keep the default palette
      }
      // Lazy require AFTER applyTheme so App and every screen it imports
      // evaluate their StyleSheets against the applied palette.
      const mod = require('./App');
      if (alive) setApp(() => mod.default);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Brief hold on a palette-colored background until the theme is applied and
  // the app tree is required (a few ms).
  if (!App) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <App />;
}

registerRootComponent(Root);
