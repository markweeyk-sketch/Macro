// Macro — main app
// Composes the responsive shell, routes, and state.

const { useState, useEffect, useMemo, useRef } = React;

const tick = () => new Promise(r => setTimeout(r, 50));

// ─────────────────────────────────────────────────────────────
// Persistent state hook (localStorage)
// ─────────────────────────────────────────────────────────────
function usePersistent(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV];
}

// ─────────────────────────────────────────────────────────────
// Tweakable defaults — see TweaksPanel below
// ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "bone",
  "dashboardLayout": "rings",
  "showStreak": true,
  "showSteps": true
}/*EDITMODE-END*/;

const THEMES = {
  bone:     { attr: undefined,  swatch: ['#F7F4EE','#1A1916','#5C7A3E'] },
  graphite: { attr: 'graphite', swatch: ['#161513','#F2EFE8','#A8C97F'] },
  citrus:   { attr: 'citrus',   swatch: ['#FBF7EF','#2A1F12','#D9633A'] },
  marine:   { attr: 'marine',   swatch: ['#EFF1F2','#1A2228','#1F6B6B'] },
};
const THEME_KEYS = ['bone','graphite','citrus','marine'];
const THEME_PALETTES = THEME_KEYS.map((k) => THEMES[k].swatch);

const DEFAULT_GOAL = {
  mode: 'maintain', rate: 0.5, kcal: 2000, protein: 150, carbs: 200, fat: 67,
  weightKg: 70, startKg: 70, currentKg: 70, streak: 0, stepsGoal: 8000,
  onboarded: false,
};

const EMPTY_WEEK_PLAN = Array.from({ length: 7 }, () => ({
  breakfast: null, lunch: null, dinner: null, snack: null,
}));

const SEEDED_RECIPE_IDS = new Set(['r1','r2','r3','r4']);

// Normalize recipe.items to [{ food, grams, unitIndex }], handling both old string[] and new object[] formats.
function getRecipeItems(recipe, foods) {
  return (recipe.items || []).map((item) => {
    const foodId = typeof item === 'string' ? item : item.foodId;
    const food   = foods.find((f) => f.id === foodId);
    if (!food) return null;
    const grams  = typeof item === 'string' ? food.units[0].g : item.grams;
    const unitIndex = typeof item === 'string' ? 0 : (item.unitIndex || 0);
    return { food, grams, unitIndex };
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────
function App() {
  const D = window.MACRO_DATA;
  const FB = window.MACRO_FIREBASE;
  const F = window.__FRAME || {};
  const persist = F.persist !== false;
  const useStateOrPersist = (k, init) => persist
    ? usePersistent(k, init)
    : useState(init);

  // ─── Auth ──────────────────────────────────────────────────────────────
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(!FB || !persist);
  const [showAuth, setShowAuth]   = useState(false);
  const [showMigrate, setShowMigrate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const pendingUserRef = useRef(null);
  const syncRef  = useRef(false);
  const userRef  = useRef(null);

  // ─── App state ─────────────────────────────────────────────────────────
  const [route, setRoute] = useState(F.route || 'today');
  const [log, setLog] = useStateOrPersist('macro.log.v2', []);
  const [goal, setGoal] = useStateOrPersist('macro.goal.v2', DEFAULT_GOAL);
  const [foods] = useState(D.FOODS);
  const [recipes, setRecipes] = useStateOrPersist('macro.recipes', []);
  const [weekPlan, setWeekPlan] = useStateOrPersist('macro.plan.v1', EMPTY_WEEK_PLAN);
  const [weights, setWeights] = useStateOrPersist('macro.weights', []);
  const [sheet, setSheet] = useState(
    F.sheet === 'add'  ? { kind: 'add', meal: F.meal || 'lunch' } :
    F.sheet === 'goal' ? { kind: 'goal' } : null
  );
  const tweakDefaults = { ...TWEAK_DEFAULTS, ...(F.tweaks || {}) };
  const [tweaks, setTweak] = window.useTweaks(tweakDefaults);
  const themeScopeRef = useRef(null);

  useEffect(() => {
    const attr = THEMES[tweaks.theme]?.attr;
    const target = F.scopeTheme && themeScopeRef.current
      ? themeScopeRef.current
      : document.documentElement;
    if (attr) target.setAttribute('data-theme', attr);
    else target.removeAttribute('data-theme');
  }, [tweaks.theme]);

  // ─── Firebase auth listener ────────────────────────────────────────────
  useEffect(() => {
    if (!FB || !persist) return;
    const today = FB.todayKey();
    return FB.auth.onAuthStateChanged(async (u) => {
      userRef.current = u;
      if (u) {
        syncRef.current = false;
        try {
          const [userData, dayEntries] = await Promise.all([
            FB.loadUserData(u.uid),
            FB.loadDayLog(u.uid, today),
          ]);
          if (userData) {
            if (userData.goal)     setGoal(userData.goal);
            if (userData.recipes)  setRecipes(userData.recipes.filter((r) => !SEEDED_RECIPE_IDS.has(r.id)));
            if (userData.weekPlan) setWeekPlan(userData.weekPlan);
            if (userData.weights)  setWeights(userData.weights);
            setLog(dayEntries ?? []);
            await tick();
            syncRef.current = true;
          } else {
            const hasLocal =
              !!localStorage.getItem('macro.log.v2') ||
              !!localStorage.getItem('macro.goal.v2');
            if (hasLocal) {
              pendingUserRef.current = u;
              setUser(u);
              setShowMigrate(true);
              setAuthReady(true);
              return;
            }
            pendingUserRef.current = u;
          }
        } catch (e) {
          console.error('[Macro] Firebase load error:', e);
          syncRef.current = true;
        }
        setUser(u);
      } else {
        syncRef.current = false;
        userRef.current = null;
        setUser(null);
      }
      setAuthReady(true);
    });
  }, []);

  // ─── Firestore sync ────────────────────────────────────────────────────
  useEffect(() => {
    const uid = userRef.current?.uid;
    if (!syncRef.current || !uid) return;
    FB.saveDayLog(uid, FB.todayKey(), log).catch(() => {});
  }, [log]);

  useEffect(() => {
    const uid = userRef.current?.uid;
    if (!syncRef.current || !uid) return;
    FB.saveGoal(uid, goal).catch(() => {});
  }, [goal]);

  useEffect(() => {
    const uid = userRef.current?.uid;
    if (!syncRef.current || !uid) return;
    FB.saveRecipes(uid, recipes).catch(() => {});
  }, [recipes]);

  useEffect(() => {
    const uid = userRef.current?.uid;
    if (!syncRef.current || !uid) return;
    FB.savePlan(uid, weekPlan).catch(() => {});
  }, [weekPlan]);

  useEffect(() => {
    const uid = userRef.current?.uid;
    if (!syncRef.current || !uid) return;
    FB.saveWeights(uid, weights).catch(() => {});
  }, [weights]);

  // One-time cleanup: strip seeded demo data from localStorage.
  useEffect(() => {
    if (!authReady) return;
    if (localStorage.getItem('macro.cleaned.v2')) return;
    setRecipes((rs) => rs.filter((r) => !SEEDED_RECIPE_IDS.has(r.id)));
    setLog((ls) => ls.filter((e) => !e.id.startsWith('l_')));
    localStorage.setItem('macro.cleaned.v2', '1');
  }, [authReady]);

  // ─── Migration handler ─────────────────────────────────────────────────
  const handleMigrate = async (doMigrate) => {
    const u = pendingUserRef.current;
    pendingUserRef.current = null;
    const today = FB.todayKey();
    if (doMigrate) {
      const migratedGoal = { ...goal, onboarded: true };
      const cleanRecipes = recipes.filter((r) => !SEEDED_RECIPE_IDS.has(r.id));
      setGoal(migratedGoal);
      setRecipes(cleanRecipes);
      await tick();
      await Promise.all([
        FB.saveGoal(u.uid, migratedGoal),
        FB.saveRecipes(u.uid, cleanRecipes),
        FB.saveDayLog(u.uid, today, log),
        FB.savePlan(u.uid, weekPlan),
        FB.saveWeights(u.uid, weights),
      ]);
      syncRef.current = true;
    } else {
      setLog([]); setGoal(DEFAULT_GOAL); setRecipes([]); setWeekPlan(EMPTY_WEEK_PLAN); setWeights([]);
      pendingUserRef.current = u;
      await tick();
      await Promise.all([
        FB.saveGoal(u.uid, DEFAULT_GOAL),
        FB.saveRecipes(u.uid, []),
        FB.saveDayLog(u.uid, today, []),
        FB.savePlan(u.uid, EMPTY_WEEK_PLAN),
        FB.saveWeights(u.uid, []),
      ]);
    }
    setShowMigrate(false);
  };

  const handleSignOut = () => {
    syncRef.current = false;
    FB.signOutUser();
  };

  // ─── Onboarding handler ────────────────────────────────────────────────
  const handleOnboarding = async (calculatedGoal) => {
    const goalWithFlag = calculatedGoal
      ? { ...calculatedGoal, onboarded: true }
      : { ...DEFAULT_GOAL,   onboarded: true };
    setGoal(goalWithFlag);
    setLog([]);
    const u = pendingUserRef.current;
    if (!u) return;
    pendingUserRef.current = null;
    const today = FB?.todayKey();
    await tick();
    await Promise.all([
      FB.saveGoal(u.uid, goalWithFlag),
      FB.saveRecipes(u.uid, []),
      FB.saveDayLog(u.uid, today, []),
      FB.savePlan(u.uid, EMPTY_WEEK_PLAN),
      FB.saveWeights(u.uid, []),
    ]);
    syncRef.current = true;
  };

  // ─── New handlers ──────────────────────────────────────────────────────
  const handleLogWeight = (weight, recalculate) => {
    const today = FB?.todayKey() || new Date().toISOString().slice(0, 10);
    setWeights((ws) => {
      const filtered = ws.filter((e) => e.date !== today);
      return [...filtered, { date: today, weight }].sort((a, b) => a.date.localeCompare(b.date));
    });
    setGoal((g) => {
      const updated = { ...g, currentKg: weight };
      if (recalculate && g.sex && g.age && g.heightCm && g.activity) {
        const calc = window.calcGoal({
          sex: g.sex, age: +g.age, heightCm: +g.heightCm,
          currentKg: weight, targetKg: +(g.weightKg || weight),
          activity: g.activity, mode: g.mode, rate: g.rate,
        });
        return { ...updated, kcal: calc.kcal, protein: calc.protein, carbs: calc.carbs, fat: calc.fat };
      }
      return updated;
    });
  };

  const handleEditProfile = (updatedGoal) => {
    setGoal(updatedGoal);
    setShowEditProfile(false);
  };

  const handleReset = async () => {
    syncRef.current = false;
    const u = userRef.current;
    setLog([]); setGoal(DEFAULT_GOAL); setRecipes([]); setWeekPlan(EMPTY_WEEK_PLAN); setWeights([]);
    if (u) {
      pendingUserRef.current = u;
      const today = FB?.todayKey();
      await Promise.all([
        FB.saveGoal(u.uid, DEFAULT_GOAL),
        FB.saveRecipes(u.uid, []),
        FB.saveDayLog(u.uid, today, []),
        FB.savePlan(u.uid, EMPTY_WEEK_PLAN),
        FB.saveWeights(u.uid, []),
      ]).catch(() => {});
    }
  };

  const totals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, f = 0;
    log.forEach((it) => {
      const food = foods.find((x) => x.id === it.foodId);
      if (!food) return;
      const n = window.MACRO_DATA.nutritionFor(food, it.grams);
      kcal += n.kcal; p += n.p; c += n.c; f += n.f;
    });
    return { kcal, p, c, f };
  }, [log, foods]);

  const needsOnboarding = goal.onboarded === false && !showMigrate;

  // ─── Loading screen ────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div style={{ height: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 14px', width: 40, height: 40, fontSize: 24 }}>M</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Loading…</div>
        </div>
      </div>
    );
  }

  const addFood = (food, grams, unitIndex, meal) => {
    setLog((cur) => [
      ...cur,
      {
        id: 'l' + Date.now(),
        foodId: food.id, meal, grams, unitIndex,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      },
    ]);
  };
  const removeLog = (id) => setLog((cur) => cur.filter((x) => x.id !== id));

  const frequent = D.FREQUENT_IDS.map((id) => foods.find((f) => f.id === id)).filter(Boolean);

  const props = {
    foods, log, goal, totals, recipes, frequent, weights,
    setLog, setGoal, setRecipes, setWeights,
    addFood, removeLog,
    openAdd: (meal) => setSheet({ kind: 'add', meal }),
    openGoal: () => setSheet({ kind: 'goal' }),
    tweaks, user,
    weekPlan, setWeekPlan,
    onLogWeight: () => setShowLogWeight(true),
  };

  return (
    <div className="app" ref={themeScopeRef}>
      <Sidebar route={route} setRoute={setRoute} goal={goal} totals={totals}
               user={user} onSignIn={() => setShowAuth(true)} onSignOut={handleSignOut}
               onOpenSettings={() => setShowSettings(true)}
               onOpenProfile={() => setShowProfile(true)}/>
      <TopBar setRoute={setRoute} route={route}
              user={user} onSignIn={() => setShowAuth(true)}
              onOpenSettings={() => setShowSettings(true)}/>
      <main className="content">
        {route === 'today'    && <TodayPage {...props}/>}
        {route === 'log'      && <LogPage {...props}/>}
        {route === 'plan'     && <PlanPage {...props}/>}
        {route === 'recipes'  && <RecipesPage {...props}/>}
        {route === 'progress' && <ProgressPage {...props}/>}
      </main>
      <RightRail {...props} setRoute={setRoute}/>
      <BottomNav route={route} setRoute={setRoute} onAdd={() => setSheet({ kind: 'add' })}/>

      <AddFoodSheet
        open={sheet?.kind === 'add'} onClose={() => setSheet(null)}
        foods={foods} frequent={frequent} defaultMeal={sheet?.meal || mealNow()}
        onConfirm={addFood}
      />
      <GoalSheet
        open={sheet?.kind === 'goal'} onClose={() => setSheet(null)}
        goal={goal} onSave={setGoal}
        latestKg={weights && weights.length > 0 ? weights[weights.length - 1].weight : null}
      />
      <AuthSheet open={showAuth} onClose={() => setShowAuth(false)}/>
      <MigrateSheet
        open={showMigrate}
        onMigrate={() => handleMigrate(true)}
        onSkip={() => handleMigrate(false)}
      />
      <SettingsSheet
        open={showSettings} onClose={() => setShowSettings(false)}
        tweaks={tweaks} setTweak={setTweak}
        user={user} goal={goal}
        onSignIn={() => { setShowSettings(false); setShowAuth(true); }}
        onSignOut={() => { setShowSettings(false); handleSignOut(); }}
        onOpenProfile={() => { setShowSettings(false); setShowProfile(true); }}
        onOpenGoal={() => { setShowSettings(false); setSheet({ kind: 'goal' }); }}
        onEditProfile={() => { setShowSettings(false); setShowEditProfile(true); }}
      />
      <ProfileSheet
        open={showProfile} onClose={() => setShowProfile(false)}
        user={user} goal={goal} weights={weights}
        onOpenGoal={() => { setShowProfile(false); setSheet({ kind: 'goal' }); }}
        onSignOut={() => { setShowProfile(false); handleSignOut(); }}
        onEditProfile={() => { setShowProfile(false); setShowEditProfile(true); }}
        onLogWeight={() => { setShowProfile(false); setShowLogWeight(true); }}
        onReset={() => { setShowProfile(false); handleReset(); }}
      />
      <EditProfileSheet
        open={showEditProfile} onClose={() => setShowEditProfile(false)}
        goal={goal} onSave={handleEditProfile}
      />
      <LogWeightSheet
        open={showLogWeight} onClose={() => setShowLogWeight(false)}
        goal={goal} onConfirm={(w, recalc) => { handleLogWeight(w, recalc); setShowLogWeight(false); }}
      />
      <OnboardingSheet
        open={needsOnboarding}
        onComplete={handleOnboarding}
      />

      {!F.hideTweaks && <TweaksPanelUI tweaks={tweaks} setTweak={setTweak}/>}
    </div>
  );
}

function mealNow() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

// ─────────────────────────────────────────────────────────────
// Sidebar (desktop)
// ─────────────────────────────────────────────────────────────
function Sidebar({ route, setRoute, goal, totals, user, onSignIn, onSignOut, onOpenSettings, onOpenProfile }) {
  const items = [
    { id: 'today',    label: 'Today',     icon: 'home' },
    { id: 'log',      label: 'Food log',  icon: 'book' },
    { id: 'plan',     label: 'Meal plan', icon: 'target' },
    { id: 'recipes',  label: 'Recipes',   icon: 'star' },
    { id: 'progress', label: 'Progress',  icon: 'chart' },
  ];
  const remaining = Math.round(goal.kcal - totals.kcal);
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div className="brand-name">M<em>acro</em></div>
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        padding: 12, marginBottom: 18, boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
          Today
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span className="numeric" style={{ fontSize: 22 }}>{remaining}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>kcal left</span>
        </div>
        <div style={{
          height: 4, borderRadius: 2, background: 'var(--surface-2)', marginTop: 8, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(totals.kcal / goal.kcal, 1) * 100}%`,
            background: 'var(--ink)',
          }}/>
        </div>
      </div>

      <div className="nav-group-label">Tracking</div>
      {items.map((it) => (
        <button key={it.id}
                className={'nav-item' + (route === it.id ? ' active' : '')}
                onClick={() => setRoute(it.id)}>
          <span className="ico"><Icon name={it.icon} size={16}/></span>
          {it.label}
        </button>
      ))}

      <div className="nav-group-label">Account</div>
      <button className="nav-item" onClick={onOpenProfile}>
        <span className="ico"><Icon name="user" size={16}/></span>
        Profile
      </button>
      <button className="nav-item" onClick={onOpenSettings}>
        <span className="ico"><Icon name="settings" size={16}/></span>
        Settings
      </button>

      <div className="sidebar-foot">
        <div className="avatar">
          {user
            ? (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()
            : '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user ? (user.displayName || user.email) : 'Guest'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {user ? `Pro · Day ${goal.streak}` : 'Not signed in'}
          </div>
        </div>
        {user
          ? (
            <button className="icon-btn" onClick={onSignOut} title="Sign out"
                    style={{ width: 30, height: 30, boxShadow: 'none', flexShrink: 0 }}>
              <Icon name="arrowR" size={14}/>
            </button>
          ) : (
            <button className="btn sm" onClick={onSignIn}>Sign in</button>
          )
        }
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Top bar (mobile only)
// ─────────────────────────────────────────────────────────────
function TopBar({ route, setRoute, user, onSignIn, onOpenSettings }) {
  const titles = {
    today: 'Today', log: 'Food log', plan: 'Meal plan', recipes: 'Recipes', progress: 'Progress',
  };
  return (
    <div className="topbar">
      <div className="row" style={{ gap: 8 }}>
        <div className="brand-mark">M</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.01em' }}>
          {titles[route]}
        </div>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn"><Icon name="search" size={16}/></button>
        {user
          ? <button className="icon-btn" onClick={onOpenSettings}><Icon name="user" size={16}/></button>
          : <button className="btn sm" onClick={onSignIn}>Sign in</button>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom nav (mobile only)
// ─────────────────────────────────────────────────────────────
function BottomNav({ route, setRoute, onAdd }) {
  const items = [
    { id: 'today',    label: 'Today',    icon: 'home' },
    { id: 'log',      label: 'Log',      icon: 'book' },
    { id: 'add',      label: '',         icon: 'plus', fab: true },
    { id: 'plan',     label: 'Plan',     icon: 'target' },
    { id: 'progress', label: 'Progress', icon: 'chart' },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((it) =>
        it.fab ? (
          <button key={it.id} className="bnav-fab" onClick={onAdd} aria-label="Add food">
            <Icon name={it.icon} size={22} stroke={2}/>
          </button>
        ) : (
          <button key={it.id}
                  className={'bnav-item' + (route === it.id ? ' active' : '')}
                  onClick={() => setRoute(it.id)}>
            <Icon name={it.icon} size={20}/>
            <span>{it.label}</span>
          </button>
        )
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Right rail (desktop ≥1280px)
// ─────────────────────────────────────────────────────────────
function RightRail({ goal, totals, log, foods, openAdd, frequent, addFood, setRoute }) {
  return (
    <aside className="rail">
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 14 }}>
        Quick log
      </div>
      <div className="search" style={{ marginBottom: 18, boxShadow: 'inset 0 0 0 1px var(--line-2)', background: 'transparent' }}>
        <Icon name="search" size={16}/>
        <input placeholder="Search foods..." onFocus={() => openAdd()}/>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--ink-3)', marginBottom: 10,
        }}>Recent</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {frequent.slice(0, 6).map((f) => (
            <button key={f.id}
              onClick={() => addFood(f, f.units[0].g, 0, mealNow())}
              style={{
                display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 10, alignItems: 'center',
                padding: '8px 10px', borderRadius: 12, textAlign: 'left', width: '100%',
                transition: 'background 100ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}>
              <div className="food-emoji" style={{ width: 32, height: 32, fontSize: 16 }}>{f.emoji}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{f.units[0].label}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }} className="tabular">{Math.round(window.MACRO_DATA.nutritionFor(f, f.units[0].g).kcal)}</div>
              <Icon name="plus" size={14}/>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginBottom: 18 }}>
        <div style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--ink-3)', marginBottom: 8,
        }}>Today's macros</div>
        <MacroBars totals={totals} goal={goal}/>
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 16,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Icon name="flame" size={16}/>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Streak · {goal.streak} days</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          You've logged every meal for {goal.streak} days running. Keep it up to unlock weekly insights.
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Today page (dashboard)
// ─────────────────────────────────────────────────────────────
function TodayPage(props) {
  const { goal, totals, log, foods, frequent, addFood, removeLog, openAdd, openGoal, tweaks, user } = props;
  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || null;

  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">{today}</div>
          <h1 className="page-title">
            {firstName ? <>Good morning,<br/><em>{firstName}</em>.</> : <>Today's<br/><em>progress</em>.</>}
          </h1>
        </div>
        <div style={{ display: 'none' }} className="desktop-only-flex">
          <button className="btn ghost" onClick={openGoal}>
            <Icon name="target" size={14}/> Goal
          </button>
        </div>
      </header>

      <section className="card padded-md" style={{ padding: 24 }}>
        {tweaks.dashboardLayout === 'rings' && (
          <div className="hero-grid">
            <CalorieRing consumed={totals.kcal} goal={goal.kcal} mode={goal.mode} onClick={openGoal}/>
            <div style={{ width: '100%', minWidth: 0 }}>
              <div style={{ marginBottom: 16 }}>
                <div className="eyebrow">Goal · {goal.mode === 'lose' ? `Lose ${goal.rate || 0.5}kg/wk` : goal.mode === 'gain' ? `Gain ${goal.rate || 0.5}kg/wk` : 'Maintain'}</div>
                <div className="between">
                  <div className="serif" style={{ fontSize: 22 }}>{goal.kcal} kcal</div>
                  <button onClick={openGoal} style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Edit goal <Icon name="chevron" size={11}/>
                  </button>
                </div>
              </div>
              <MacroBars totals={totals} goal={goal}/>
            </div>
          </div>
        )}

        {tweaks.dashboardLayout === 'bars' && (
          <div>
            <div className="between" style={{ marginBottom: 18 }}>
              <div>
                <div className="eyebrow">Calories</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="numeric" style={{ fontSize: 56, lineHeight: 1 }}>
                    {Math.round(totals.kcal)}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--ink-3)' }}>/ {goal.kcal}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow">Remaining</div>
                <div className="numeric" style={{ fontSize: 32 }}>
                  {Math.max(0, Math.round(goal.kcal - totals.kcal))}
                </div>
                <button onClick={openGoal} style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                  Edit goal <Icon name="chevron" size={11}/>
                </button>
              </div>
            </div>
            <div style={{
              height: 14, borderRadius: 7, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 22,
            }}>
              <div style={{
                height: '100%', borderRadius: 7,
                width: `${Math.min(totals.kcal / goal.kcal, 1) * 100}%`,
                background: 'var(--ink)',
                transition: 'width 600ms cubic-bezier(.4,0,.2,1)',
              }}/>
            </div>
            <MacroBars totals={totals} goal={goal}/>
          </div>
        )}

        {tweaks.dashboardLayout === 'minimal' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {Math.round(goal.kcal - totals.kcal) >= 0 ? 'Remaining today' : 'Over goal by'}
            </div>
            <div className="numeric" onClick={openGoal} style={{
              fontSize: 'clamp(80px, 14vw, 140px)',
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              cursor: 'pointer',
            }}>
              {Math.abs(Math.round(goal.kcal - totals.kcal))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                of {goal.kcal} kcal · {Math.round(totals.kcal)} consumed
              </span>
              <button onClick={openGoal} style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                Edit <Icon name="chevron" size={11}/>
              </button>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <MacroDonut totals={totals} goal={goal}/>
            </div>
          </div>
        )}
      </section>

      <section className="padded">
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="eyebrow">Quick log · recents</div>
          <button onClick={() => openAdd()} className="row" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            See all <Icon name="chevron" size={12}/>
          </button>
        </div>
        <QuickLog foods={frequent} onAdd={(f) => addFood(f, f.units[0].g, 0, mealNow())}/>
      </section>

      <section className="padded">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Today's meals</div>
        {['breakfast','lunch','dinner','snack'].map((m) => (
          <MealSection
            key={m}
            meal={m}
            label={mealLabel(m)}
            items={log.filter((x) => x.meal === m)}
            foods={foods}
            onAdd={() => openAdd(m)}
            onRemove={removeLog}
            onOpen={openAdd}
          />
        ))}
      </section>

      <section className="grid-2 padded">
        {props.tweaks.showSteps && (
          <div className="card">
            <div className="card-hd">
              <div>
                <div className="eyebrow">Activity</div>
                <div className="card-title">Steps</div>
              </div>
              <Icon name="foot" size={20}/>
            </div>
            <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
              No step data yet.<br/>Connect a fitness tracker to see steps.
            </div>
          </div>
        )}
        {props.tweaks.showStreak && (
          <div className="card">
            <div className="card-hd">
              <div>
                <div className="eyebrow">Streak</div>
                <div className="card-title">{goal.streak} days strong</div>
              </div>
              <Icon name="flame" size={20}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, marginTop: 12 }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  height: 28, borderRadius: 4,
                  background: i < goal.streak ? 'var(--ink)' : 'var(--surface-2)',
                  opacity: i < goal.streak ? 0.4 + (i / 14) * 0.6 : 1,
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 12 }}>
              Best streak · 28 days. You're 16 away.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function mealLabel(m) {
  return ({ breakfast: 'Morning', lunch: 'Midday', dinner: 'Evening', snack: 'Snacks' })[m];
}

// ─────────────────────────────────────────────────────────────
// Log page — full timeline
// ─────────────────────────────────────────────────────────────
function LogPage(props) {
  const { foods, log, removeLog, openAdd } = props;
  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Today's log</div>
          <h1 className="page-title">Food <em>log</em></h1>
        </div>
        <button className="btn" onClick={() => openAdd()}>
          <Icon name="plus" size={14}/> Add food
        </button>
      </header>
      <div className="padded">
        {['breakfast','lunch','dinner','snack'].map((m) => (
          <MealSection
            key={m}
            meal={m}
            label={mealLabel(m)}
            items={log.filter((x) => x.meal === m)}
            foods={foods}
            onAdd={() => openAdd(m)}
            onRemove={removeLog}
            onOpen={openAdd}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Plan page — week view
// ─────────────────────────────────────────────────────────────
function PlanPage(props) {
  const { recipes, foods, weekPlan, setWeekPlan } = props;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [picking, setPicking] = useState(null);

  const setPlanSlot = (dayIndex, slot, recipeId) => {
    setWeekPlan((plan) => plan.map((d, i) =>
      i === dayIndex ? { ...d, [slot]: recipeId } : d
    ));
    setPicking(null);
  };

  const removePlanSlot = (dayIndex, slot) => {
    setWeekPlan((plan) => plan.map((d, i) =>
      i === dayIndex ? { ...d, [slot]: null } : d
    ));
  };

  const autoPlan = () => {
    if (!recipes.length) return;
    const slots = ['breakfast', 'lunch', 'dinner', 'snack'];
    setWeekPlan(Array.from({ length: 7 }, (_, i) => {
      const day = {};
      slots.forEach((slot, si) => { day[slot] = recipes[(i + si) % recipes.length].id; });
      return day;
    }));
  };

  const shoppingItems = useMemo(() => {
    const foodIds = new Set();
    weekPlan.forEach((day) => {
      Object.values(day).forEach((recipeId) => {
        if (!recipeId) return;
        const recipe = recipes.find((r) => r.id === recipeId);
        if (!recipe) return;
        getRecipeItems(recipe, foods).forEach(({ food }) => foodIds.add(food.id));
      });
    });
    return [...foodIds].map((id) => foods.find((f) => f.id === id)).filter(Boolean);
  }, [weekPlan, recipes, foods]);

  const dayKcal = (dayPlan) => {
    let total = 0;
    Object.values(dayPlan).forEach((recipeId) => {
      if (!recipeId) return;
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;
      getRecipeItems(recipe, foods).forEach(({ food, grams }) => {
        total += window.MACRO_DATA.nutritionFor(food, grams).kcal;
      });
    });
    return Math.round(total);
  };

  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">This week</div>
          <h1 className="page-title">Meal <em>plan</em></h1>
        </div>
        <button className="btn ghost" onClick={autoPlan}>
          <Icon name="bolt" size={14}/> Auto-plan
        </button>
      </header>
      <div className="padded">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(170px, 1fr))',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {weekPlan.map((dayPlan, i) => {
            const kcal = dayKcal(dayPlan);
            return (
              <div key={days[i]} className="card" style={{
                padding: 14,
                outline: i === today ? '2px solid var(--ink)' : 'none',
                outlineOffset: -2,
                minHeight: 360,
              }}>
                <div className="between" style={{ marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
                      {days[i]}
                    </div>
                    <div className="serif" style={{ fontSize: 18 }}>
                      {i === today ? 'Today' : ''}
                    </div>
                  </div>
                  {kcal > 0 && (
                    <div className="numeric tabular" style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                      {kcal} kcal
                    </div>
                  )}
                </div>
                {['breakfast','lunch','dinner','snack'].map((slot) => (
                  <PlanSlot
                    key={slot}
                    slot={slot}
                    recipeId={dayPlan[slot]}
                    recipes={recipes}
                    onPick={() => setPicking({ dayIndex: i, slot })}
                    onRemove={() => removePlanSlot(i, slot)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {picking && (() => {
        const currentId = weekPlan[picking.dayIndex][picking.slot];
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPicking(null)}/>
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              background: 'var(--surface)', borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
              maxHeight: '60vh', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div className="serif" style={{ fontSize: 18, textTransform: 'capitalize' }}>
                  {picking.slot}
                </div>
                <button className="icon-btn" onClick={() => setPicking(null)}>
                  <Icon name="close" size={16}/>
                </button>
              </div>
              <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
                {currentId && (
                  <button onClick={() => setPlanSlot(picking.dayIndex, picking.slot, null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '14px 0',
                      borderBottom: '1px solid var(--line)',
                      color: 'var(--warn)',
                    }}>
                    <Icon name="minus" size={16}/> Remove slot
                  </button>
                )}
                {recipes.length === 0 && (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
                    No recipes yet. Add some in Recipes.
                  </div>
                )}
                {recipes.map((r) => (
                  <button key={r.id}
                    onClick={() => setPlanSlot(picking.dayIndex, picking.slot, r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      width: '100%', padding: '14px 0',
                      borderBottom: '1px solid var(--line)',
                      textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{r.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                        {(r.items || []).length} ingredients · serves {r.serves}
                      </div>
                    </div>
                    {currentId === r.id && <Icon name="check" size={16}/>}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      <div className="padded">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Shopping list</div>
            <span className="chip">{shoppingItems.length} items</span>
          </div>
          {shoppingItems.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              Add meals to your plan to generate a shopping list.
            </div>
          ) : (
            <div className="grid-3">
              {shoppingItems.map((f) => (
                <div key={f.id} className="row" style={{
                  padding: 8, borderRadius: 12, background: 'var(--surface-2)',
                }}>
                  <div className="food-emoji">{f.emoji}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{f.units[0].label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanSlot({ slot, recipeId, recipes, onPick, onRemove }) {
  const recipe = recipeId ? recipes.find((r) => r.id === recipeId) : null;
  if (!recipe) return (
    <button onClick={onPick} style={{
      width: '100%', textAlign: 'left',
      padding: '10px 12px', marginTop: 6,
      border: '1px dashed var(--line-2)', borderRadius: 10,
      color: 'var(--ink-3)', fontSize: 12,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <Icon name="plus" size={12}/> {slot}
    </button>
  );
  return (
    <div style={{
      padding: 10, marginTop: 6,
      background: 'var(--surface-2)', borderRadius: 10,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>
        {slot}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{recipe.emoji}</span>
        <div style={{ fontSize: 12, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {recipe.name}
        </div>
        <button onClick={onPick} title="Swap"
                style={{ padding: 3, color: 'var(--ink-3)', flexShrink: 0 }}>
          <Icon name="arrowR" size={11}/>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove"
                style={{ padding: 3, color: 'var(--ink-3)', flexShrink: 0 }}>
          <Icon name="minus" size={11}/>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recipes page — full CRUD
// ─────────────────────────────────────────────────────────────
function RecipesPage(props) {
  const { recipes, setRecipes, foods } = props;
  const [editorState, setEditorState] = useState(null); // null | { recipe: null } | { recipe: {...} }
  const [viewRecipe, setViewRecipe] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);

  const openCreate = () => { setEditorState({ recipe: null }); };
  const openEdit   = (r) => { setViewRecipe(null); setEditorState({ recipe: r }); };
  const closeEditor = () => setEditorState(null);

  const saveRecipe = (r) => {
    setRecipes((rs) => {
      const idx = rs.findIndex((x) => x.id === r.id);
      return idx >= 0 ? rs.map((x) => x.id === r.id ? r : x) : [...rs, r];
    });
    setEditorState(null);
    setViewRecipe(r);
  };

  const deleteRecipe = (r) => {
    setRecipes((rs) => rs.filter((x) => x.id !== r.id));
    setViewRecipe(null);
    setDeleteStep(0);
  };

  const openView = (r) => { setViewRecipe(r); setDeleteStep(0); };
  const closeView = () => { setViewRecipe(null); setDeleteStep(0); };

  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Saved meals</div>
          <h1 className="page-title">Recipes &<br/><em>quick meals</em></h1>
        </div>
        <button className="btn" onClick={openCreate}>
          <Icon name="plus" size={14}/> New recipe
        </button>
      </header>
      <div className="padded grid-2">
        {recipes.map((r) => {
          const items = getRecipeItems(r, foods);
          const tot = items.reduce((s, { food, grams }) => {
            const n = window.MACRO_DATA.nutritionFor(food, grams);
            return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
          }, { kcal: 0, p: 0, c: 0, f: 0 });
          return (
            <button key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => openView(r)}>
              <div style={{
                height: 120,
                background: `linear-gradient(135deg, var(--surface-2), var(--bg))`,
                display: 'grid', placeItems: 'center', fontSize: 56,
              }}>{r.emoji}</div>
              <div style={{ padding: 18 }}>
                <div className="card-title" style={{ marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
                  {items.length} ingredients · serves {r.serves}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { l: 'kcal', v: Math.round(tot.kcal), c: 'var(--ink)' },
                    { l: 'P',    v: Math.round(tot.p) + 'g', c: 'var(--p-color)' },
                    { l: 'C',    v: Math.round(tot.c) + 'g', c: 'var(--c-color)' },
                    { l: 'F',    v: Math.round(tot.f) + 'g', c: 'var(--f-color)' },
                  ].map((m) => (
                    <div key={m.l} style={{
                      background: 'var(--surface-2)', borderRadius: 10, padding: '8px 6px', textAlign: 'center',
                    }}>
                      <div className="numeric" style={{ fontSize: 18, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>
                        {m.l}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {items.slice(0, 4).map(({ food }) => (
                    <span key={food.id} className="chip" style={{ background: 'var(--surface-2)', fontSize: 11 }}>
                      {food.emoji} {food.name}
                    </span>
                  ))}
                  {items.length > 4 && (
                    <span className="chip" style={{ background: 'var(--surface-2)', fontSize: 11 }}>
                      +{items.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        <button className="card" style={{
          minHeight: 280,
          border: '2px dashed var(--line-2)',
          background: 'transparent', boxShadow: 'none',
          display: 'grid', placeItems: 'center',
          color: 'var(--ink-3)',
          cursor: 'pointer',
        }} onClick={openCreate}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 50, background: 'var(--surface-2)',
              display: 'grid', placeItems: 'center', margin: '0 auto 10px',
            }}>
              <Icon name="plus" size={20}/>
            </div>
            <div className="serif" style={{ fontSize: 18, color: 'var(--ink)' }}>Build a recipe</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Combine foods you eat together</div>
          </div>
        </button>
      </div>

      {/* Recipe detail sheet */}
      {viewRecipe && (() => {
        const r = recipes.find((x) => x.id === viewRecipe.id) || viewRecipe;
        const items = getRecipeItems(r, foods);
        const tot = items.reduce((s, { food, grams }) => {
          const n = window.MACRO_DATA.nutritionFor(food, grams);
          return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
        }, { kcal: 0, p: 0, c: 0, f: 0 });
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.3)' }} onClick={closeView}/>
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              background: 'var(--surface)', borderRadius: '20px 20px 0 0',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
            }}>
              <div style={{
                padding: '16px 20px 12px', borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              }}>
                <span style={{ fontSize: 32 }}>{r.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 20 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{items.length} ingredients · serves {r.serves}</div>
                </div>
                <button className="icon-btn" onClick={closeView}><Icon name="close" size={16}/></button>
              </div>
              <div style={{ overflowY: 'auto', padding: '16px 20px 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                  {[
                    { l: 'kcal', v: Math.round(tot.kcal), c: 'var(--ink)' },
                    { l: 'P',    v: Math.round(tot.p) + 'g', c: 'var(--p-color)' },
                    { l: 'C',    v: Math.round(tot.c) + 'g', c: 'var(--c-color)' },
                    { l: 'F',    v: Math.round(tot.f) + 'g', c: 'var(--f-color)' },
                  ].map((m) => (
                    <div key={m.l} style={{
                      background: 'var(--surface-2)', borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                    }}>
                      <div className="numeric" style={{ fontSize: 22, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 10 }}>
                  Ingredients
                </div>
                {items.map(({ food, grams, unitIndex }) => {
                  const n = window.MACRO_DATA.nutritionFor(food, grams);
                  const unit = food.units[unitIndex] || food.units[0];
                  return (
                    <div key={food.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0', borderBottom: '1px solid var(--line)',
                    }}>
                      <div className="food-emoji" style={{ width: 36, height: 36, fontSize: 18, flexShrink: 0 }}>{food.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{food.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{unit.label}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'right' }} className="tabular">
                        {Math.round(n.kcal)} kcal
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 20px 32px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
                {deleteStep === 0 ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn ghost" style={{ flex: 1 }} onClick={() => openEdit(r)}>
                      <Icon name="scale" size={14}/> Edit
                    </button>
                    <button className="btn ghost" style={{ flex: 1, color: 'var(--warn)' }}
                            onClick={() => setDeleteStep(1)}>
                      <Icon name="minus" size={14}/> Delete
                    </button>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(198,106,58,0.08)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 12 }}>
                      Delete <strong>{r.name}</strong>? This cannot be undone.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn ghost" style={{ flex: 1, fontSize: 13 }} onClick={() => setDeleteStep(0)}>Cancel</button>
                      <button className="btn" onClick={() => deleteRecipe(r)}
                              style={{ flex: 1, fontSize: 13, background: 'var(--warn)', boxShadow: 'none' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      <RecipeEditorSheet
        open={!!editorState}
        onClose={closeEditor}
        recipe={editorState?.recipe}
        foods={foods}
        onSave={saveRecipe}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress page
// ─────────────────────────────────────────────────────────────
function ProgressPage(props) {
  const { goal, weights, onLogWeight } = props;
  const [range, setRange] = useState('30d');

  const displayEntries = useMemo(() => {
    if (!weights || weights.length === 0) return [];
    const now = new Date();
    const day = 86400000;
    const cutoff = range === '7d'  ? new Date(now - 7  * day).toISOString().slice(0, 10)
                 : range === '30d' ? new Date(now - 30 * day).toISOString().slice(0, 10)
                 : range === '3m'  ? new Date(now - 90 * day).toISOString().slice(0, 10)
                 : '0000-00-00';
    return weights.filter((e) => e.date >= cutoff);
  }, [weights, range]);

  const currentKg = weights && weights.length > 0
    ? weights[weights.length - 1].weight
    : goal.currentKg;
  const delta = +(goal.startKg - currentKg).toFixed(1);
  const toGo  = +(currentKg - goal.weightKg).toFixed(1);

  const insights = useMemo(() => {
    const list = [];
    if (goal.streak >= 3) {
      list.push({ i: 'flame', t: `${goal.streak}-day streak`, s: "Consistent logging builds habits — keep it up." });
    }
    if (weights && weights.length >= 2) {
      const first = weights[0].weight;
      const last  = weights[weights.length - 1].weight;
      const diff  = +(last - first).toFixed(1);
      if (diff < 0) list.push({ i: 'bolt', t: `Down ${Math.abs(diff)} kg total`, s: `From ${first} kg to ${last} kg. You're making real progress.` });
      else if (diff > 0) list.push({ i: 'bolt', t: `Up ${diff} kg total`, s: `From ${first} kg to ${last} kg since you started tracking.` });
    }
    const left = Math.abs(toGo);
    if (left > 0 && goal.mode !== 'maintain' && goal.rate) {
      const weeksLeft = Math.ceil(left / goal.rate);
      list.push({ i: 'target', t: `${left} kg to goal`, s: `At ${goal.rate} kg/wk, you could reach your goal in ~${weeksLeft} week${weeksLeft !== 1 ? 's' : ''}.` });
    }
    return list;
  }, [goal, weights, toGo]);

  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Your journey</div>
          <h1 className="page-title">Your <em>progress</em></h1>
        </div>
        <button className="btn" onClick={onLogWeight}>
          <Icon name="scale" size={14}/> Log weight
        </button>
      </header>

      <section className="padded grid-2">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-hd" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="eyebrow">Weight</div>
              <div className="row" style={{ alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span className="numeric" style={{ fontSize: 44 }}>{currentKg}</span>
                <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>kg</span>
                {delta !== 0 && (
                  <span className="chip" style={{ background: 'transparent', color: 'var(--accent)', padding: 0 }}>
                    {delta > 0 ? '↓' : '↑'} {Math.abs(delta)} kg
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow">To goal</div>
                <div className="numeric" style={{ fontSize: 22 }}>{toGo} kg</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {['7d','30d','3m','all'].map((r) => (
                  <button key={r} onClick={() => setRange(r)} className="chip"
                    style={{
                      fontSize: 11, cursor: 'pointer',
                      background: range === r ? 'var(--ink)' : 'var(--surface-2)',
                      color:      range === r ? 'var(--bg)'  : 'var(--ink-2)',
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <WeightChart entries={displayEntries} goalKg={goal.weightKg}/>
        </div>

        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Avg calories · 7d</div>
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
            No calorie history yet.<br/>Log meals daily to see your trends.
          </div>
        </div>

        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Macro adherence</div>
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
            No macro history yet.<br/>Track meals to see adherence.
          </div>
        </div>
      </section>

      <section className="padded">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Insights</div>
            {insights.length > 0 && <span className="chip">{insights.length}</span>}
          </div>
          {insights.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>
              Start logging meals and weight<br/>to unlock personal insights.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((x, i) => (
                <div key={i} className="row" style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--surface)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Icon name={x.i} size={16}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{x.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{x.s}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tweaks panel
// ─────────────────────────────────────────────────────────────
function TweaksPanelUI({ tweaks, setTweak }) {
  const curPalette = THEME_PALETTES[THEME_KEYS.indexOf(tweaks.theme)] || THEME_PALETTES[0];
  return (
    <window.TweaksPanel title="Tweaks">
      <window.TweakSection label="Theme">
        <window.TweakColor
          label="Palette"
          value={curPalette}
          options={THEME_PALETTES}
          onChange={(p) => {
            const idx = THEME_PALETTES.findIndex((x) => JSON.stringify(x) === JSON.stringify(p));
            if (idx >= 0) setTweak('theme', THEME_KEYS[idx]);
          }}
        />
      </window.TweakSection>
      <window.TweakSection label="Dashboard layout">
        <window.TweakRadio
          label="Style"
          options={[
            { value: 'rings',   label: 'Ring' },
            { value: 'bars',    label: 'Bars' },
            { value: 'minimal', label: 'Minimal' },
          ]}
          value={tweaks.dashboardLayout}
          onChange={(v) => setTweak('dashboardLayout', v)}
        />
      </window.TweakSection>
      <window.TweakSection label="Cards">
        <window.TweakToggle label="Show streak" value={tweaks.showStreak} onChange={(v) => setTweak('showStreak', v)}/>
        <window.TweakToggle label="Show steps"  value={tweaks.showSteps}  onChange={(v) => setTweak('showSteps', v)}/>
      </window.TweakSection>
    </window.TweaksPanel>
  );
}

if (!window.__SKIP_AUTOMOUNT) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
}
window.MacroApp = App;
