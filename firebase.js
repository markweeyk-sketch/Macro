// firebase.js — Macro Firebase integration
// Cloud is authoritative for logged-in users. localStorage is a guest/offline cache.
(function () {
  if (typeof firebase === 'undefined') return;

  firebase.initializeApp({
    apiKey: "AIzaSyDiJQgRtfXfE2_QZcEsxAGr_dsf8GHjBJo",
    authDomain: "macro-7f7d4.firebaseapp.com",
    projectId: "macro-7f7d4",
    storageBucket: "macro-7f7d4.firebasestorage.app",
    messagingSenderId: "717301516879",
    appId: "1:717301516879:web:24cde33709631feb4f783a",
  });

  const auth = firebase.auth();
  const db   = firebase.firestore();

  // YYYY-MM-DD key for today's log document
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  function signInWithGoogle() {
    return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  function signInWithEmail(email, pw) {
    return auth.signInWithEmailAndPassword(email, pw);
  }
  async function signUpWithEmail(email, pw, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    if (displayName) await cred.user.updateProfile({ displayName });
    return cred;
  }
  function signOutUser() { return auth.signOut(); }

  // ─── Firestore ───────────────────────────────────────────────────────────
  async function loadUserData(uid) {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  }
  function saveGoal(uid, goal) {
    return db.collection('users').doc(uid).set({ goal }, { merge: true });
  }
  function saveRecipes(uid, recipes) {
    return db.collection('users').doc(uid).set({ recipes }, { merge: true });
  }
  async function loadDayLog(uid, date) {
    const snap = await db.collection('users').doc(uid)
                         .collection('logs').doc(date).get();
    return snap.exists ? (snap.data().entries || []) : null;
  }
  function saveDayLog(uid, date, entries) {
    return db.collection('users').doc(uid)
             .collection('logs').doc(date)
             .set({ entries });
  }

  window.MACRO_FIREBASE = {
    auth, todayKey,
    signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser,
    loadUserData, saveGoal, saveRecipes, loadDayLog, saveDayLog,
  };
})();
