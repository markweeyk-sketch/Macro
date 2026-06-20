# Macro

A calorie/macro tracking app ("Macro — Calorie Counter"): food logging, goal/weight tracking, weekly meal planning, recipes, and progress charts, with Firebase auth + Firestore sync (localStorage as guest/offline cache).

## Layout — this is the important part

This is an npm workspaces monorepo (`packages/*`), but **the repo root also contains a second, near-duplicate copy of the web app**:

- `/` (root) — `app.jsx`, `screens.jsx`, `auth.jsx`, `data.js`, `firebase.js`, `styles.css`, `index.html`, `tweaks-panel.jsx`, `sw.js`, plus prototype-only files `canvas.html`, `design-canvas.jsx`, `ios-frame.jsx` (not used by the shipped app).
- `packages/web/` — same file set (minus the prototype-only ones), deployed by Vercel. `vercel.json` at root rewrites all routes to `/packages/web/$1`, so **`packages/web` is what actually ships**.
- `packages/core/` — `@macro/core`, shared `data.js` (food database) and `firebase.js`, consumed by the mobile app via `@macro/core/firebase` / `@macro/core/data`.
- `packages/mobile/` — Expo/React Native app (`App.js`, `src/screens/*`, `src/navigation/TabNavigator.js`).

The root copy and `packages/web` copy **drift** — `app.jsx`, `data.js`, `firebase.js`, and `styles.css` currently differ between the two. There is no build step or sync script; keeping them aligned is manual.

**When editing the web app, ask which copy the user wants changed, or check both.** If a fix is meant to ship, it must land in `packages/web/` (or be copied there) since that's what Vercel serves.

## Stack

No bundler for the web app — plain `index.html` loads React 18 + Babel Standalone from unpkg CDN, and Firebase compat SDK from gstatic, then loads `.jsx` files as `<script type="text/babel">` tags (in-browser JSX transform). Script load order in `index.html` matters: `data.js` → `firebase.js` → `tweaks-panel.jsx` → `screens.jsx` → `auth.jsx` → `app.jsx`.

Mobile is Expo (`expo` ^54, React Native 0.81, React 19), using `@react-navigation` for tabs/stack and `victory-native` for charts.

## Firebase

Project `macro-7f7d4`. Cloud Firestore is authoritative for signed-in users (`users/{uid}` doc with `goal`, `recipes`, `weekPlan`, `weights`, and a `logs/{date}` subcollection for daily entries); `localStorage` is the guest/offline fallback. Auth supports Google popup and email/password. Firebase config/keys are checked into `firebase.js` directly (no env vars) — this is a client-side Firebase web API key, expected to be public, not a secret to scrub.

## Conventions seen in the code

- Tweakable UI defaults live in `TWEAK_DEFAULTS` in `app.jsx`, wrapped in `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/` markers — likely machine-editable via the `tweaks-panel.jsx` editor; preserve those markers exactly when touching that block.
- `data.js` / `@macro/core/data.js` food items use `per100` macros (kcal/p/c/f) plus a `units` list of common serving sizes — follow this shape when adding foods.
- Recipe items support both legacy `string[]` (food IDs) and newer `{ foodId, grams, unitIndex }[]` formats — `getRecipeItems()` in `app.jsx` normalizes both; don't drop backward compatibility for existing saved recipes.
