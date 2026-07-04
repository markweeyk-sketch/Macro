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
import {
  FOODS,
  FREQUENT_IDS,
  SEEDED_RECIPE_IDS,
  nutritionFor,
  calcGoal,
} from '@macro/core/data';
import {
  auth,
  todayKey,
  loadUserData,
  loadDayLog,
  saveDayLog,
  saveGoal,
  saveWeights,
  savePlan,
  saveRecipes,
  saveCustomFoods,
  saveFoodOverrides,
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

// Empty weekly meal plan: 7 days, each with four empty slots (web EMPTY_WEEK_PLAN).
export const EMPTY_WEEK_PLAN = Array.from({ length: 7 }, () => ({
  breakfast: null,
  lunch: null,
  dinner: null,
  snack: null,
}));

// Normalize a recipe's ingredients into { food, grams, unitIndex }, supporting
// BOTH the legacy string[] (food IDs) and the newer {foodId,grams,unitIndex}[]
// formats — mirrors web getRecipeItems (app.jsx). Never drop either format.
export function getRecipeItems(recipe, foods = FOODS) {
  return (recipe.items || [])
    .map((item) => {
      const foodId = typeof item === 'string' ? item : item.foodId;
      const food = foods.find((f) => f.id === foodId);
      if (!food) return null;
      const grams = typeof item === 'string' ? food.units[0].g : item.grams;
      const unitIndex = typeof item === 'string' ? 0 : item.unitIndex || 0;
      return { food, grams, unitIndex };
    })
    .filter(Boolean);
}

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
// Pass the context's merged `foods` so custom foods and overrides count; the
// FOODS default keeps standalone callers working.
export function computeTotals(entries, foods = FOODS) {
  let kcal = 0,
    p = 0,
    c = 0,
    f = 0;
  (entries || []).forEach((it) => {
    const food = foods.find((x) => x.id === it.foodId);
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
  const [weights, setWeights] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [weekPlan, setWeekPlan] = useState(EMPTY_WEEK_PLAN);
  // User-created foods (scanned/manual, ids 'cf*') and per-user corrections to
  // built-in FOODS entries ([{ id, ...patch }], applied over the static DB).
  const [customFoods, setCustomFoods] = useState([]);
  const [foodOverrides, setFoodOverrides] = useState([]);
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
      const [cachedGoal, cachedLog, cachedWeights, cachedRecipes, cachedPlan, cachedFoods, cachedOverrides] =
        await Promise.all([
          getJSON(KEYS.goal, null),
          getJSON(KEYS.log, null),
          getJSON(KEYS.weights, null),
          getJSON(KEYS.recipes, null),
          getJSON(KEYS.plan, null),
          getJSON(KEYS.customFoods, null),
          getJSON(KEYS.overrides, null),
        ]);
      if (alive) {
        if (cachedGoal) setGoal((g) => ({ ...g, ...cachedGoal }));
        if (Array.isArray(cachedLog)) setLog(cachedLog);
        if (Array.isArray(cachedWeights)) setWeights(cachedWeights);
        if (Array.isArray(cachedRecipes)) setRecipes(cachedRecipes);
        if (Array.isArray(cachedPlan)) setWeekPlan(cachedPlan);
        if (Array.isArray(cachedFoods)) setCustomFoods(cachedFoods);
        if (Array.isArray(cachedOverrides)) setFoodOverrides(cachedOverrides);
      }
      if (uid) {
        try {
          const [data, dayEntries] = await Promise.all([
            loadUserData(uid),
            loadDayLog(uid, date),
          ]);
          if (!alive) return;
          if (data?.goal) setGoal({ ...DEFAULT_GOAL, ...data.goal });
          if (Array.isArray(data?.weights)) setWeights(data.weights);
          // Strip legacy seeded recipes on load, matching the web app.
          if (Array.isArray(data?.recipes))
            setRecipes(data.recipes.filter((r) => !SEEDED_RECIPE_IDS.has(r.id)));
          if (Array.isArray(data?.weekPlan)) setWeekPlan(data.weekPlan);
          if (Array.isArray(data?.customFoods)) setCustomFoods(data.customFoods);
          if (Array.isArray(data?.foodOverrides)) setFoodOverrides(data.foodOverrides);
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

  // The food database the app actually sees: built-ins with any per-user
  // corrections applied ("fix everywhere" — past logs and recipes referencing
  // the id pick the corrected values up automatically), plus the user's own
  // created/scanned foods appended.
  const foods = useMemo(() => {
    const base = foodOverrides.length
      ? FOODS.map((f) => {
          const o = foodOverrides.find((x) => x.id === f.id);
          return o ? { ...f, ...o } : f;
        })
      : FOODS;
    return customFoods.length ? [...base, ...customFoods] : base;
  }, [customFoods, foodOverrides]);

  const totals = useMemo(() => computeTotals(log, foods), [log, foods]);

  const frequent = useMemo(
    () => FREQUENT_IDS.map((id) => foods.find((f) => f.id === id)).filter(Boolean),
    [foods]
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

  // Log every ingredient of a recipe into one meal in a single write — the
  // native "quick meal" the web app doesn't have. Grams/units come straight from
  // the recipe items so the kcal added matches the total shown on the card.
  const logRecipe = useCallback(
    (recipe, meal) => {
      const items = getRecipeItems(recipe, foods);
      if (!items.length) return;
      const time = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
      const base = Date.now();
      setLog((cur) => {
        const next = [
          ...cur,
          ...items.map(({ food, grams, unitIndex }, i) => ({
            id: 'l' + base + '-' + i,
            foodId: food.id,
            meal,
            grams,
            unitIndex,
            time,
          })),
        ];
        persistLog(next);
        return next;
      });
      // Streak bump — same logic as addFood, once for the whole recipe.
      setGoal((g) => {
        if (g.lastLogDate === date) return g;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const streak = g.lastLogDate === yesterday ? (g.streak || 0) + 1 : 1;
        const next = { ...g, streak, lastLogDate: date };
        setJSON(KEYS.goal, next);
        if (uid) saveGoal(uid, next).catch(() => {});
        return next;
      });
    },
    [date, uid, persistLog, foods]
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

  // Record today's weight (one entry per day, deduped) and update the goal's
  // currentKg — recalculating macros if the profile has the biometrics for it.
  // Mirrors web handleLogWeight (app.jsx).
  const logWeight = useCallback(
    (weight, recalculate) => {
      setWeights((cur) => {
        const filtered = cur.filter((e) => e.date !== date);
        const next = [...filtered, { date, weight }].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        setJSON(KEYS.weights, next);
        if (uid) saveWeights(uid, next).catch(() => {});
        return next;
      });
      setGoal((g) => {
        let next = { ...g, currentKg: weight };
        if (recalculate && g.sex && g.age && g.heightCm && g.activity) {
          const calc = calcGoal({
            sex: g.sex,
            age: +g.age,
            heightCm: +g.heightCm,
            currentKg: weight,
            targetKg: +(g.weightKg || weight),
            activity: g.activity,
            mode: g.mode,
            rate: g.rate,
          });
          next = {
            ...next,
            kcal: calc.kcal,
            protein: calc.protein,
            carbs: calc.carbs,
            fat: calc.fat,
          };
        }
        setJSON(KEYS.goal, next);
        if (uid) saveGoal(uid, next).catch(() => {});
        return next;
      });
    },
    [date, uid]
  );

  // Replace the whole goal (from the profile/goal editor) and persist. Mirrors
  // the web app's setGoal + Firestore sync.
  const updateGoal = useCallback(
    (nextGoal) => {
      setGoal(nextGoal);
      setJSON(KEYS.goal, nextGoal);
      if (uid) saveGoal(uid, nextGoal).catch(() => {});
    },
    [uid]
  );

  // Upsert a recipe (create or replace by id) and persist. Mirrors web saveRecipe.
  const saveRecipe = useCallback(
    (recipe) => {
      setRecipes((cur) => {
        const idx = cur.findIndex((x) => x.id === recipe.id);
        const next = idx >= 0 ? cur.map((x) => (x.id === recipe.id ? recipe : x)) : [...cur, recipe];
        setJSON(KEYS.recipes, next);
        if (uid) saveRecipes(uid, next).catch(() => {});
        return next;
      });
    },
    [uid]
  );

  // Delete a recipe by id and persist. Mirrors web deleteRecipe.
  const deleteRecipe = useCallback(
    (id) => {
      setRecipes((cur) => {
        const next = cur.filter((x) => x.id !== id);
        setJSON(KEYS.recipes, next);
        if (uid) saveRecipes(uid, next).catch(() => {});
        return next;
      });
    },
    [uid]
  );

  // Save a food from the food editor. Built-in FOODS ids become a per-user
  // override patch ("fix everywhere" — every log/recipe referencing the id sees
  // the corrected values); anything else upserts into customFoods.
  const saveFood = useCallback(
    (food) => {
      if (FOODS.some((f) => f.id === food.id)) {
        setFoodOverrides((cur) => {
          const rest = cur.filter((x) => x.id !== food.id);
          const next = [...rest, food];
          setJSON(KEYS.overrides, next);
          if (uid) saveFoodOverrides(uid, next).catch(() => {});
          return next;
        });
      } else {
        setCustomFoods((cur) => {
          const idx = cur.findIndex((x) => x.id === food.id);
          const next = idx >= 0 ? cur.map((x) => (x.id === food.id ? food : x)) : [...cur, food];
          setJSON(KEYS.customFoods, next);
          if (uid) saveCustomFoods(uid, next).catch(() => {});
          return next;
        });
      }
    },
    [uid]
  );

  // Delete by id: for a built-in food this clears the override (reverting to
  // the shipped values); for a custom food it removes it entirely. Old log
  // entries referencing a deleted custom food are skipped by computeTotals.
  const deleteFood = useCallback(
    (id) => {
      if (FOODS.some((f) => f.id === id)) {
        setFoodOverrides((cur) => {
          const next = cur.filter((x) => x.id !== id);
          setJSON(KEYS.overrides, next);
          if (uid) saveFoodOverrides(uid, next).catch(() => {});
          return next;
        });
      } else {
        setCustomFoods((cur) => {
          const next = cur.filter((x) => x.id !== id);
          setJSON(KEYS.customFoods, next);
          if (uid) saveCustomFoods(uid, next).catch(() => {});
          return next;
        });
      }
    },
    [uid]
  );

  // Replace the weekly plan (whole array) and persist. The Plan screen computes
  // the next plan (set/remove a slot, auto-plan) and hands it here.
  const updatePlan = useCallback(
    (nextPlan) => {
      setWeekPlan(nextPlan);
      setJSON(KEYS.plan, nextPlan);
      if (uid) savePlan(uid, nextPlan).catch(() => {});
    },
    [uid]
  );

  // Wipe all account data back to defaults — logs, goal, recipes, plan, and
  // weights — in both the cache and Firestore. Mirrors the web app's reset.
  const resetAccountData = useCallback(async () => {
    setLog([]);
    setGoal(DEFAULT_GOAL);
    setRecipes([]);
    setWeekPlan(EMPTY_WEEK_PLAN);
    setWeights([]);
    setCustomFoods([]);
    setFoodOverrides([]);
    await Promise.all([
      setJSON(KEYS.log, []),
      setJSON(KEYS.goal, DEFAULT_GOAL),
      setJSON(KEYS.recipes, []),
      setJSON(KEYS.plan, EMPTY_WEEK_PLAN),
      setJSON(KEYS.weights, []),
      setJSON(KEYS.customFoods, []),
      setJSON(KEYS.overrides, []),
    ]);
    if (uid) {
      await Promise.all([
        saveDayLog(uid, date, []),
        saveGoal(uid, DEFAULT_GOAL),
        saveRecipes(uid, []),
        savePlan(uid, EMPTY_WEEK_PLAN),
        saveWeights(uid, []),
        saveCustomFoods(uid, []),
        saveFoodOverrides(uid, []),
      ]).catch(() => {});
    }
  }, [uid, date]);

  const openAdd = useCallback((meal) => {
    setAddMeal(meal || mealNow());
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const value = useMemo(
    () => ({
      foods,
      customFoods,
      foodOverrides,
      goal,
      log,
      weights,
      recipes,
      weekPlan,
      totals,
      frequent,
      ready,
      addFood,
      logRecipe,
      removeLog,
      logWeight,
      updateGoal,
      updatePlan,
      saveRecipe,
      deleteRecipe,
      saveFood,
      deleteFood,
      resetAccountData,
      addOpen,
      addMeal,
      openAdd,
      closeAdd,
    }),
    [foods, customFoods, foodOverrides, goal, log, weights, recipes, weekPlan, totals, frequent, ready, addFood, logRecipe, removeLog, logWeight, updateGoal, updatePlan, saveRecipe, deleteRecipe, saveFood, deleteFood, resetAccountData, addOpen, addMeal, openAdd, closeAdd]
  );

  return <MacroContext.Provider value={value}>{children}</MacroContext.Provider>;
}
