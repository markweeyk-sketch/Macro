// Expo entry point. package.json "main" points here.
//
// We can't use the default expo/AppEntry.js: expo is hoisted to the monorepo
// root, so AppEntry's `import App from '../../App'` would resolve to the repo
// root's WEB app.jsx copy (Windows is case-insensitive), not this app. And
// pointing "main" straight at App.js boots nothing — App.js only exports a
// component, so AppRegistry never registers "main" and the app crashes with
// '"main" has not been registered'. This file is the required registration.
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
