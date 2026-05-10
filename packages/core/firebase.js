// @macro/core — Firebase helpers (modular SDK v10, works in React Native + web)
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDiJQgRtfXfE2_QZcEsxAGr_dsf8GHjBJo',
  authDomain:        'macro-7f7d4.firebaseapp.com',
  projectId:         'macro-7f7d4',
  storageBucket:     'macro-7f7d4.firebasestorage.app',
  messagingSenderId: '717301516879',
  appId:             '1:717301516879:web:24cde33709631feb4f783a',
};

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db   = getFirestore(app);

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

import { updateProfile } from 'firebase/auth';

// ─── Auth ────────────────────────────────────────────────────────────────────
export function signInWithGoogle() {
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

export { auth, db };
