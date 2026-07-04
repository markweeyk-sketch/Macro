// @macro/core — Firebase helpers (modular SDK v10, works in React Native + web)
//
// Imports target the SCOPED @firebase/* packages rather than the `firebase`
// umbrella. On React Native under Metro this is deliberate: the scoped packages
// all share the single hoisted @firebase/component instance, so the auth
// component registers in the same registry getAuth() reads from. Mixing the
// umbrella with a scoped require split that registry and caused
// "Component auth has not been registered yet". @firebase/auth's RN build is
// also the only build that exposes getReactNativePersistence (see initAuth).
import { initializeApp, getApps } from '@firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from '@firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from '@firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDiJQgRtfXfE2_QZcEsxAGr_dsf8GHjBJo',
  authDomain:        'macro-7f7d4.firebaseapp.com',
  projectId:         'macro-7f7d4',
  storageBucket:     'macro-7f7d4.firebasestorage.app',
  messagingSenderId: '717301516879',
  appId:             '1:717301516879:web:24cde33709631feb4f783a',
};

// `navigator.product === 'ReactNative'` is the canonical RN runtime probe and is
// false in every browser, so web bundles never enter the native branch below.
const isReactNative =
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ─── Auth init ─────────────────────────────────────────────────────────────
// On React Native, getAuth() does NOT persist the session across app restarts
// (and logs a warning). We must initializeAuth() with AsyncStorage-backed
// persistence. On web we keep plain getAuth().
//
// getReactNativePersistence is imported statically above from @firebase/auth's
// RN build (the only build exposing it). AsyncStorage is required lazily so the
// web bundle never pulls in the RN-only native module.
function initAuth() {
  if (!isReactNative) return getAuth(app);
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (typeof getReactNativePersistence === 'function') {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  } catch (e) {
    // Already-initialized (fast refresh) or RN persistence unavailable —
    // fall through to getAuth(), which returns the existing instance.
    console.warn('[macro/core] RN auth persistence unavailable:', e?.message);
  }
  return getAuth(app);
}

const auth = initAuth();
const db   = getFirestore(app);

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export function signInWithGoogle() {
  // Popup auth is web-only. The firebase RN build doesn't even ship
  // signInWithPopup, so this is wired via lazy require and refused on native.
  // Mobile v1 ships email/password; Google can arrive later via expo-auth-session.
  if (isReactNative) {
    return Promise.reject(
      new Error('Google sign-in is not available on this platform yet.')
    );
  }
  const { signInWithPopup, GoogleAuthProvider } = require('@firebase/auth');
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function signInWithEmail(email, pw) {
  return signInWithEmailAndPassword(auth, email, pw);
}
export async function signUpWithEmail(email, pw, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, pw);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred;
}
export function signOutUser() {
  return signOut(auth);
}
export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// ─── Firestore ───────────────────────────────────────────────────────────────
export async function loadUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
export function saveGoal(uid, goal) {
  return setDoc(doc(db, 'users', uid), { goal }, { merge: true });
}
export function saveRecipes(uid, recipes) {
  return setDoc(doc(db, 'users', uid), { recipes }, { merge: true });
}
export async function loadDayLog(uid, date) {
  const snap = await getDoc(doc(db, 'users', uid, 'logs', date));
  return snap.exists() ? (snap.data().entries ?? []) : null;
}
export function saveDayLog(uid, date, entries) {
  return setDoc(doc(db, 'users', uid, 'logs', date), { entries });
}
export function savePlan(uid, plan) {
  return setDoc(doc(db, 'users', uid), { weekPlan: plan }, { merge: true });
}
export function saveWeights(uid, weights) {
  return setDoc(doc(db, 'users', uid), { weights }, { merge: true });
}
// User-created foods (scanned or manual) — same shape as FOODS items, ids 'cf*',
// optionally carrying a `barcode`. Stored as an array so merge:true replaces the
// whole field (deletions propagate, unlike map fields which deep-merge).
export function saveCustomFoods(uid, customFoods) {
  return setDoc(doc(db, 'users', uid), { customFoods }, { merge: true });
}
// Per-user corrections to built-in FOODS entries ("fix everywhere"): an array of
// { id, ...patch } applied over the static database at load. Array for the same
// replace-not-merge reason as customFoods.
export function saveFoodOverrides(uid, foodOverrides) {
  return setDoc(doc(db, 'users', uid), { foodOverrides }, { merge: true });
}

export { auth, db };
