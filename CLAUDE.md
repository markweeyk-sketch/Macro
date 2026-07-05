# Macro

A calorie/macro tracking app ("Macro — Calorie Counter"): food logging, goal/weight
tracking, weekly meal planning, recipes, and progress charts, with Firebase auth +
Firestore sync (localStorage / AsyncStorage as the guest/offline cache). There are two
front-ends that share `@macro/core`: a shipping **web** app and an **Expo mobile** app.

**Status: maintenance.** The web→mobile migration is finished; both apps are feature-shipped.
Ongoing work is bug fixes and UI tweaks, not new architecture. Prefer the smallest change
that fixes the issue; match the surrounding code's style, and keep both apps runnable.

---

## Layout — read this first

npm workspaces monorepo (`packages/*`), but **the repo root also holds a second,
near-duplicate copy of the web app**:

- `/` (root) — `app.jsx`, `screens.jsx`, `auth.jsx`, `data.js`, `firebase.js`, `styles.css`,
  `index.html`, `tweaks-panel.jsx`, `sw.js`, plus prototype-only files `canvas.html`,
  `design-canvas.jsx`, `ios-frame.jsx` (not used by the shipped app).
- `packages/web/` — same file set (minus the prototype-only ones), deployed by Vercel.
  `vercel.json` rewrites all routes to `/packages/web/$1`, so **`packages/web` is what ships**.
- `packages/core/` — `@macro/core`. Exports `./data` (the `FOODS` database + macro helpers),
  `./firebase` (auth + Firestore helpers), and `./theme` (design tokens + palettes).
  **Consumed by both web and mobile. Reuse it; don't fork it.**
- `packages/mobile/` — the Expo/React Native app (see the Mobile section below).

The root copy and `packages/web` copy **drift** (`app.jsx`, `data.js`, `firebase.js`,
`styles.css` differ). No build step or sync script — alignment is manual.

**When editing the web app, ask which copy the user wants changed, or check both.** A fix
that must ship has to land in `packages/web/` (that's what Vercel serves).

---

## Web app

No bundler — `index.html` loads React 18 + Babel Standalone from unpkg CDN and the Firebase
compat SDK from gstatic, then loads `.jsx` files as `<script type="text/babel">` tags
(in-browser JSX transform). **Script load order in `index.html` matters:**
`data.js` → `firebase.js` → `tweaks-panel.jsx` → `screens.jsx` → `auth.jsx` → `app.jsx`.

The web UI is **not importable as components** (no module system — CDN + runtime Babel).
`app.jsx` holds the root `App`, all top-level state, and page components; `screens.jsx` holds
reusable UI + the inline `Icon` set; `styles.css` is the design system.

- `TWEAK_DEFAULTS` in `app.jsx` is wrapped in `/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` markers
  (machine-edited via `tweaks-panel.jsx`) — **preserve those markers exactly**. The tweaks
  panel is web-only; it was intentionally not ported to mobile.

---

## Mobile app (`packages/mobile`)

Expo SDK 54 · React Native 0.81 · React 19 · `@react-navigation` (native + bottom-tabs).
Charts and icons are hand-drawn with **`react-native-svg`** (there is no `victory-native`).
Fonts via `expo-font` (`@expo-google-fonts/{fraunces,inter,jetbrains-mono}`). Barcode lookup
uses `expo-camera`'s built-in scanner (the deprecated `expo-barcode-scanner` won't compile on
SDK 54). OTA updates via `expo-updates`. **Use `npx expo install <pkg>`** for new native deps.

**Structure:**
- `index.js` — entry point + theme boot (see invariants below). `App.js` — auth gate +
  `TabNavigator`.
- `src/screens/*Screen.js` — Today, Log, Plan, Recipes, Progress, Profile.
- `src/components/*` — `Sheet`, `Icon`, `FoodMonogram`, `AddFoodSheet`, `FoodEditorSheet`,
  `RecipeEditorSheet`, `BarcodeScannerSheet`, `MealSection`, `QuickLog`, `EditProfileSheet`,
  `LogWeightSheet`, and the SVG charts.
- `src/state/MacroData.js` — React context holding `foods`/`log`/`goal`/`recipes`/`plan`/
  `weights` + all mutators; wraps `@macro/core` + the AsyncStorage cache. Also exports
  `getRecipeItems`.
- `src/lib/storage.js` — AsyncStorage cache (`KEYS`, `getJSON`/`setJSON`, `usePersistentState`),
  mirroring the web `persist` semantics.
- `src/ui/type.js` — `<Text>`/`<TextInput>` wrappers that apply the themed font families;
  `src/ui/fonts.js` loads the faces. Screens build their `StyleSheet` from `@macro/core/theme`.

### Boot invariants — the app won't start if these break

1. **Entry registration.** `package.json` `main` → `index.js`, which calls
   `registerRootComponent`. Never point `main` at `App.js` (nothing registers `"main"` →
   crash) and never use `expo/AppEntry.js` (expo is hoisted to the monorepo root, so its
   `import App from '../../App'` resolves to the repo-root **web** `app.jsx` on
   case-insensitive Windows).
2. **Firebase single registry.** `metro.config.js` adds `'require'` to
   `resolver.unstable_conditionNames` so `@firebase/app` + `@firebase/component` collapse to
   one CJS instance (otherwise: "Component auth has not been registered yet"). It also maps
   `@firebase/auth` → its nested `dist/rn` build (for `getReactNativePersistence`). **Never**
   use a `resolveRequest` override — it clobbers Expo's entry resolution.
3. **Theme boot (reload-based).** Every screen reads `@macro/core/theme`'s shared `colors`
   object at module-eval time, so the persisted theme must be applied to `colors` *before*
   any screen evaluates. `index.js` registers a tiny `Root` synchronously, then in an effect
   reads the saved theme (`AsyncStorage 'macro.theme'`), calls `applyTheme(key)`, and only
   THEN `require('./App')` (the lazy require is what first evaluates the screens). **Never
   statically `import App` (or any screen) at the top of `index.js`** — that would build
   StyleSheets before the theme is applied.

### Theming

`@macro/core/theme` exports `themes` (4 palettes — bone/graphite/citrus/marine; two light,
two dark), `colors` (the **live** palette every component imports), `applyTheme`, `getTheme`,
`themeKeys`, `themeSwatches`, `defaultThemeKey` (`'bone'`), `radii`, `spacing`, `fontSizes`,
`fontWeights`, `fonts`.

- `colors` is a **copy** of the default palette (`{ ...themes[defaultThemeKey] }`), never a
  reference to a `themes` entry — `applyTheme` does `Object.assign(colors, getTheme(key))`,
  which would corrupt the source palette otherwise.
- Because StyleSheets are built once from `colors`, live switching would need a ~20-file
  refactor. Instead, changing the theme (Profile → Appearance) persists the key and **reboots
  the JS** — `Updates.reloadAsync()` in prod, `DevSettings.reload()` in dev — which re-runs
  `index.js` and rebuilds every StyleSheet against the new palette.

### Food/recipe icons

Foods and recipes are shown with **`FoodMonogram`** (`src/components/FoodMonogram.js`): a
colored initial-letter tile tinted by the food's dominant macro (using the theme's
`pColor`/`cColor`/`fColor`), so icons re-tint with the theme. This replaced hand-typed emoji.
Legacy foods/recipes may still carry an `emoji` field — it's unused; don't reintroduce an
emoji picker or write new `emoji` values.

### Verify & ship (mobile)

- **Verify any change** by exporting the bundle from `packages/mobile`:
  `npx expo export --platform android`. A clean run is ~970 modules with no errors. Do this
  before shipping — it catches import/JSX mistakes without a device.
- **JS-only changes ship OTA:** `eas update --branch preview --message "…"` (runtime version
  `1.0.0`). The user force-closes and reopens the app twice to receive it.
- **Native/dependency/app-config changes need a new EAS build**, not an OTA.
- The user tests on a **physical Android device**, developing on **Windows** (PowerShell is
  the primary shell; a Bash tool is also available).

### Traps

- **EAS build runtime.** The build uses an explicit `runtimeVersion` `"1.0.0"` (not a
  fingerprint policy). `expo prebuild` makes EAS hash the project as a bare app → a
  fingerprint mismatch. Keep OTA `--branch preview` on runtime `1.0.0`.
- **OneDrive + node_modules.** The repo lives under OneDrive, which can make workspace
  junctions/symlinks vanish. If `npm ls` reports packages as "extraneous" or Metro can't
  resolve `@macro/core`, reinstall (`npm install`) before debugging anything else.

---

## Firebase

Project `macro-7f7d4`. Cloud Firestore is authoritative for signed-in users; the local cache
(localStorage on web, AsyncStorage on mobile) is the guest/offline fallback.

- `users/{uid}` doc: `goal`, `recipes`, `weekPlan`, `weights`.
- `users/{uid}/logs/{date}` subcollection: `{ entries: [...] }`, keyed `YYYY-MM-DD`
  (`todayKey()` from core).
- `@macro/core/firebase` is platform-aware: native initializes auth with
  `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` so sessions
  survive restarts; web uses `getAuth`. Core exports `auth`, `loadUserData`, `saveGoal`,
  `saveRecipes`, `loadDayLog`, `saveDayLog`, `savePlan`, `saveWeights`, `todayKey`, and the
  auth helpers — **call these; don't write parallel Firestore code.**
- Auth: email/password on both platforms; Google via `signInWithPopup` is **web-only**
  (not available on native).
- Firebase config/keys are checked into `firebase.js` directly — a **public client-side web
  API key**, expected to be public. **Not a secret to scrub.**

---

## Data model & conventions

- **Food** (`@macro/core/data`): `per100` macros `{ kcal, p, c, f }` + a `units` list of common
  serving sizes. Follow this shape when adding foods. On mobile, users can save custom foods
  and per-user overrides of built-ins (see `MacroData.saveFood`).
- **Recipe** items support BOTH legacy `string[]` (food IDs) and newer
  `{ foodId, grams, unitIndex }[]`. `getRecipeItems()` normalizes both — **never drop
  backward compatibility** for saved recipes.
- **Goal / `calcGoal`.** `calcGoal({ sex, age, heightCm, currentKg, targetKg, activity, mode,
  rate })` returns **only** the derived fields `{ mode, rate, kcal, protein, carbs, fat,
  weightKg, startKg, currentKg }` — it does **not** echo back the biometric inputs. When
  saving edited profile/goal, carry `sex`/`age`/`heightCm`/`activity` through explicitly, or
  they revert to the old values on the next open.
