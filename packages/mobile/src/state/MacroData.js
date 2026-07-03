// MacroData.js — app-wide daily-tracking state, the RN equivalent of the
// top-level state the web `App` component holds in app.jsx (goal, log, totals,
// addFood/removeLog). Lives above the tab navigator so both the global add-food
// FAB (in the tab bar) and the Today screen read/write the same data.
//
// Persistence mirrors the web app: Firestore is authoritative for a signed-in
// user (goal on the user doc, today's entries in logs/{date}); AsyncStorage is
// a cache for instant paint / offline. Numbers are crunched with the shared
// @macro/core helpers so they match the web exactly.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FOODS, FREQUENT_IDS, nutritionFor } from '@macro/core/data';
import {
  auth,
  todayKey,
  loadUserData,
  loadDayLog,
  saveDayLog,
  saveGoal,
} from '@macro/core/firebase';
import { KEYS, getJSON, setJSON } from '../lib/storage';

// Mirrors DEFAULT_GOAL in web/app.jsx — used until onboarding (Phase 6) or a
// saved goal replaces it.
export const DEFAULT_GOAL = {
  mode: 'maintain',
  rate: 0.5,
  kcal: 2000,
  protein: 150,
  carbs: 200,
  fat: 67,
  weightKg: 70,
  startKg: 70,
  currentKg: 70,
  streak: 0,
  lastLogDate: null,
  stepsGoal: 8000,
  onboarded: false,
};

// Which meal a "quick add" defaults to, by time of day (web/app.jsx mealNow).
export function mealNow() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

// Sum a day's entries into { kcal, p, c, f } — same reduction the web `totals`
// memo does. Shared so today's live log and any past day (Log screen) match.
export function computeTotals(entries) {
  let kcal = 0,
    p = 0,
    c = 0,
    f = 0;
  (entries || []).forEach((it) => {
    const food = FOODS.find((x) => x.id === it.foodId);
    if (!food) return;
    const n = nutritionFor(food, it.grams);
    kcal += n.kcal;
    p += n.p;
    c += n.c;
    f += n.f;
  });
  return { kcal, p, c, f };
}

const MacroContext = createContext(null);

export function useMacroData() {
  const ctx = useContext(MacroContext);
  if (!ctx) throw new Error('useMacroData must be used within <MacroDataProvider>');
  return ctx;
}

export function MacroDataProvider({ children }) {
  const uid = auth.currentUser?.uid || null;
  const date = todayKey();

  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [log, setLog] = useState([]);
  const [ready, setReady] = useState(false);

  // Global add-food sheet control (opened by the tab-bar FAB or a meal's "add").
  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState('breakfast');

  // Load goal + today's log: cache first for an instant first paint, then
  // reconcile against Firestore (which is authoritative, so it also clears a
  // stale cache left over from a previous day).
  useEffect(() => {
    let alive = true;
    (async () => {
      const [cachedGoal, cachedLog] = await Promise.all([
        getJSON(KEYS.goal, null),
        getJSON(KEYS.log, null),
      ]);
      if (alive) {
        if (cachedGoal) setGoal((g) => ({ ...g, ...cachedGoal }));
        if (Array.isArray(cachedLog)) setLog(cachedLog);
      }
      if (uid) {
        try {
          const [data, dayEntries] = await Promise.all([
            loadUserData(uid),
            loadDayLog(uid, date),
          ]);
          if (!alive) return;
          if (data?.goal) setGoal({ ...DEFAULT_GOAL, ...data.goal });
          setLog(dayEntries ?? []); // authoritative: empty means empty today
        } catch {
          // offline / permission error — keep the cached values
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [uid, date]);

  const totals = useMemo(() => computeTotals(log), [log]);

  const frequent = useMemo(
    () => FREQUENT_IDS.map((id) => FOODS.find((f) => f.id === id)).filter(Boolean),
    []
  );

  const persistLog = useCallback(
    (entries) => {
      setJSON(KEYS.log, entries);
      if (uid) saveDayLog(uid, date, entries).catch(() => {});
    },
    [uid, date]
  );

  const addFood = useCallback(
    (food, grams, unitIndex, meal) => {
      setLog((cur) => {
        const next = [
          ...cur,
          {
            id: 'l' + Date.now(),
            foodId: food.id,
            meal,
            grams,
            unitIndex,
            time: new Date().toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            }),
          },
        ];
        persistLog(next);
        return next;
      });
      // Streak bump — same logic as web addFood.
      setGoal((g) => {
        if (g.lastLogDate === date) return g;
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);
        const streak = g.lastLogDate === yesterday ? (g.streak || 0) + 1 : 1;
        const next = { ...g, streak, lastLogDate: date };
        setJSON(KEYS.goal, next);
        if (uid) saveGoal(uid, next).catch(() => {});
        return next;
      });
    },
    [date, uid, persistLog]
  );

  const removeLog = useCallback(
    (id) => {
      setLog((cur) => {
        const next = cur.filter((x) => x.id !== id);
        persistLog(next);
        return next;
      });
    },
    [persistLog]
  );

  const openAdd = useCallback((meal) => {
    setAddMeal(meal || mealNow());
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const value = useMemo(
    () => ({
      foods: FOODS,
      goal,
      log,
      totals,
      frequent,
      ready,
      addFood,
      removeLog,
      addOpen,
      addMeal,
      openAdd,
      closeAdd,
    }),
    [goal, log, totals, frequent, ready, addFood, removeLog, addOpen, addMeal, openAdd, closeAdd]
  );

  return <MacroContext.Provider value={value}>{children}</MacroContext.Provider>;
}
