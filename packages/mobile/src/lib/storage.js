// storage.js — AsyncStorage cache layer for mobile.
//
// Mirrors the web app's localStorage `usePersistent` semantics (see web/app.jsx):
// the web hook seeds state from a key, then writes JSON on every change. RN's
// AsyncStorage is asynchronous, so the hook here loads on mount and exposes a
// `ready` flag; callers that need to avoid persisting a half-loaded value should
// gate on it. The same logical keys ('macro.log.v2', etc.) are reused so the
// mental model matches the web app.
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Shared key names with the web app's localStorage cache.
export const KEYS = {
  log:         'macro.log.v2',
  goal:        'macro.goal.v2',
  recipes:     'macro.recipes',
  plan:        'macro.plan.v1',
  weights:     'macro.weights',
  customFoods: 'macro.customFoods',
  overrides:   'macro.foodOverrides',
};

// ─── Imperative JSON helpers ─────────────────────────────────────────────────
export async function getJSON(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort cache; ignore write failures
  }
}

export async function removeKey(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

// Whether any cached app data exists — used to decide guest-data migration,
// mirroring the web `hasLocal` check.
export async function hasLocalData() {
  try {
    const [log, goal] = await AsyncStorage.multiGet([KEYS.log, KEYS.goal]);
    return log[1] != null || goal[1] != null;
  } catch {
    return false;
  }
}

// ─── Persistent state hook (async equivalent of web usePersistent) ───────────
// Returns [value, setValue, ready]. `value` starts at `initial`, is replaced by
// the cached value once loaded, and is written back to AsyncStorage on change
// (but only after the initial load completes, so we never clobber the cache with
// the seed value).
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setReady(false);
    getJSON(key, undefined).then((stored) => {
      if (!mounted.current) return;
      if (stored !== undefined) setValue(stored);
      setReady(true);
    });
    return () => {
      mounted.current = false;
    };
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    setJSON(key, value);
  }, [key, value, ready]);

  const reset = useCallback(() => removeKey(key), [key]);

  return [value, setValue, ready, reset];
}
