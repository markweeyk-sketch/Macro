// Macro — main app
// Composes the responsive shell, routes, and state.

const { useState, useEffect, useMemo, useRef } = React;

// Yield to the event loop so React flushes state before we read refs in effects.
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

// Blank goal for new users — onboarded:false triggers the onboarding sheet.
const DEFAULT_GOAL = {
  mode: 'maintain', kcal: 2000, protein: 150, carbs: 200, fat: 67,
  weightKg: 70, startKg: 70, currentKg: 70, streak: 0, stepsGoal: 8000,
  onboarded: false,
};

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────
function App() {
  const D = window.MACRO_DATA;
  const FB = window.MACRO_FIREBASE;
  const F = window.__FRAME || {};                   // URL-param overrides for canvas frames
  const persist = F.persist !== false;              // canvas frames disable persistence
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
  const pendingUserRef = useRef(null); // user awaiting migration decision
  const syncRef  = useRef(false);      // true → safe to write to Firestore
  const userRef  = useRef(null);       // mirrors user for use inside effects

  // ─── App state ─────────────────────────────────────────────────────────
  const [route, setRoute] = useState(F.route || 'today');
  const [log, setLog] = useStateOrPersist('macro.log.v2', []);
  const [goal, setGoal] = useStateOrPersist('macro.goal.v2', DEFAULT_GOAL);
  const [foods] = useState(D.FOODS);
  const [recipes, setRecipes] = useStateOrPersist('macro.recipes', D.RECIPES);
  const [sheet, setSheet] = useState(
    F.sheet === 'add'  ? { kind: 'add', meal: F.meal || 'lunch' } :
    F.sheet === 'goal' ? { kind: 'goal' } : null
  );
  const tweakDefaults = { ...TWEAK_DEFAULTS, ...(F.tweaks || {}) };
  const [tweaks, setTweak] = window.useTweaks(tweakDefaults);
  const themeScopeRef = useRef(null);

  // Apply theme: scope to local container when embedded (frame mode), otherwise <html>.
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
            // Cloud data exists — it wins.
            if (userData.goal)    setGoal(userData.goal);
            if (userData.recipes) setRecipes(userData.recipes);
            setLog(dayEntries ?? []);
            await tick(); // let React flush before enabling sync
            syncRef.current = true;
          } else {
            // New account — offer to migrate existing local data.
            const hasLocal =
              !!localStorage.getItem('macro.log.v2') ||
              !!localStorage.getItem('macro.goal.v2');
            if (hasLocal) {
              pendingUserRef.current = u;
              setUser(u);
              setShowMigrate(true);
              setAuthReady(true);
              return; // sync stays off until migration resolves
            }
            // Truly new — show onboarding before seeding cloud.
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

  // ─── Firestore sync (fires only once sync is enabled) ─────────────────
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

  // ─── Migration handler ─────────────────────────────────────────────────
  const handleMigrate = async (doMigrate) => {
    const u = pendingUserRef.current;
    pendingUserRef.current = null;
    const today = FB.todayKey();
    if (doMigrate) {
      // Upload current local state, mark as onboarded.
      const migratedGoal = { ...goal, onboarded: true };
      setGoal(migratedGoal);
      await tick();
      await Promise.all([
        FB.saveGoal(u.uid, migratedGoal),
        FB.saveRecipes(u.uid, recipes),
        FB.saveDayLog(u.uid, today, log),
      ]);
      syncRef.current = true;
    } else {
      // Start fresh — onboarding will run once migration sheet closes.
      setLog([]); setGoal(DEFAULT_GOAL); setRecipes(D.RECIPES);
      pendingUserRef.current = u; // keep ref so handleOnboarding can seed Firebase
      await tick();
      // Seed a placeholder so the account exists in Firestore
      await Promise.all([
        FB.saveGoal(u.uid, DEFAULT_GOAL),
        FB.saveRecipes(u.uid, D.RECIPES),
        FB.saveDayLog(u.uid, today, []),
      ]);
      // Leave syncRef false — handleOnboarding enables it after goal is set
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
    if (!u) return; // guest — usePersistent handles persistence
    pendingUserRef.current = null;
    const today = FB?.todayKey();
    await tick();
    await Promise.all([
      FB.saveGoal(u.uid, goalWithFlag),
      FB.saveRecipes(u.uid, D.RECIPES),
      FB.saveDayLog(u.uid, today, []),
    ]);
    syncRef.current = true;
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
  
  // Onboarding fires for any user (guest or signed-in) whose goal.onboarded is
  // strictly false — meaning they used DEFAULT_GOAL, not old data lacking the field.
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
    foods, log, goal, totals, recipes, frequent,
    setLog, setGoal, setRecipes,
    addFood, removeLog,
    openAdd: (meal) => setSheet({ kind: 'add', meal }),
    openGoal: () => setSheet({ kind: 'goal' }),
    tweaks, user,
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
      />
      <ProfileSheet
        open={showProfile} onClose={() => setShowProfile(false)}
        user={user} goal={goal}
        onOpenGoal={() => { setShowProfile(false); setSheet({ kind: 'goal' }); }}
        onSignOut={() => { setShowProfile(false); handleSignOut(); }}
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

      {/* Hero card: ring + macros */}
      <section className="card padded-md" style={{ padding: 24 }}>
        {tweaks.dashboardLayout === 'rings' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 28,
            alignItems: 'center',
          }}>
            <CalorieRing consumed={totals.kcal} goal={goal.kcal} mode={goal.mode} onClick={openGoal}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: 16 }}>
                <div className="eyebrow">Goal · {goal.mode === 'lose' ? 'Lose 0.5kg/wk' : goal.mode === 'gain' ? 'Gain 0.4kg/wk' : 'Maintain'}</div>
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

      {/* Quick log strip */}
      <section className="padded">
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="eyebrow">Quick log · recents</div>
          <button onClick={() => openAdd()} className="row" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            See all <Icon name="chevron" size={12}/>
          </button>
        </div>
        <QuickLog foods={frequent} onAdd={(f) => addFood(f, f.units[0].g, 0, mealNow())}/>
      </section>

      {/* Today's meals */}
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

      {/* Secondary metrics */}
      <section className="grid-2 padded">
        {props.tweaks.showSteps && (
          <div className="card">
            <div className="card-hd">
              <div>
                <div className="eyebrow">Activity</div>
                <div className="card-title">{window.MACRO_DATA.STEP_HISTORY.at(-1).toLocaleString()} steps</div>
              </div>
              <div className="chip dot">+{Math.round((window.MACRO_DATA.STEP_HISTORY.at(-1) / goal.stepsGoal) * 100)}%</div>
            </div>
            <StepBars data={window.MACRO_DATA.STEP_HISTORY} goal={goal.stepsGoal}/>
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
  const { goal, recipes } = props;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  // demo plan
  const plan = useMemo(() => days.map((d, i) => ({
    day: d,
    isToday: i === today,
    meals: {
      breakfast: i % 2 === 0 ? recipes[0] : null,
      lunch:     recipes[1],
      dinner:    i < 3 ? recipes[2] : null,
      snack:     i % 3 === 0 ? recipes[3] : null,
    },
  })), [recipes, today]);
  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">This week</div>
          <h1 className="page-title">Meal <em>plan</em></h1>
        </div>
        <button className="btn ghost">
          <Icon name="plus" size={14}/> Auto-plan
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
          {plan.map((d) => (
            <div key={d.day} className="card" style={{
              padding: 14,
              outline: d.isToday ? '2px solid var(--ink)' : 'none',
              outlineOffset: -2,
              minHeight: 360,
            }}>
              <div className="between" style={{ marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
                    {d.day}
                  </div>
                  <div className="serif" style={{ fontSize: 18 }}>
                    {d.isToday ? 'Today' : ''}
                  </div>
                </div>
                <div className="numeric tabular" style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                  {plannedKcal(d.meals)}
                </div>
              </div>
              {['breakfast','lunch','dinner','snack'].map((slot) => (
                <PlanSlot key={slot} slot={slot} recipe={d.meals[slot]}/>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="padded">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Shopping list</div>
            <button className="chip">14 items</button>
          </div>
          <div className="grid-3">
            {props.foods.slice(0, 9).map((f) => (
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
        </div>
      </div>
    </div>
  );
}

function plannedKcal(meals) {
  // approximate kcal per recipe slot
  let s = 0;
  Object.values(meals).forEach((r) => { if (r) s += 420; });
  return s + ' kcal';
}

function PlanSlot({ slot, recipe }) {
  if (!recipe) return (
    <button style={{
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
      <div className="row" style={{ marginTop: 4 }}>
        <span style={{ fontSize: 16 }}>{recipe.emoji}</span>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{recipe.name}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recipes page
// ─────────────────────────────────────────────────────────────
function RecipesPage(props) {
  const { recipes, foods } = props;
  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Saved meals</div>
          <h1 className="page-title">Recipes &<br/><em>quick meals</em></h1>
        </div>
        <button className="btn">
          <Icon name="plus" size={14}/> New recipe
        </button>
      </header>
      <div className="padded grid-2">
        {recipes.map((r) => {
          const items = r.items.map((id) => foods.find((f) => f.id === id)).filter(Boolean);
          const totals = items.reduce((s, f) => {
            const n = window.MACRO_DATA.nutritionFor(f, f.units[0].g);
            return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
          }, { kcal: 0, p: 0, c: 0, f: 0 });
          return (
            <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                }}>
                  {[
                    { l: 'kcal', v: Math.round(totals.kcal), c: 'var(--ink)' },
                    { l: 'P',    v: Math.round(totals.p) + 'g', c: 'var(--p-color)' },
                    { l: 'C',    v: Math.round(totals.c) + 'g', c: 'var(--c-color)' },
                    { l: 'F',    v: Math.round(totals.f) + 'g', c: 'var(--f-color)' },
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
                  {items.slice(0, 4).map((f) => (
                    <span key={f.id} className="chip" style={{ background: 'var(--surface-2)', fontSize: 11 }}>
                      {f.emoji} {f.name}
                    </span>
                  ))}
                  {items.length > 4 && (
                    <span className="chip" style={{ background: 'var(--surface-2)', fontSize: 11 }}>
                      +{items.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* New recipe placeholder */}
        <button className="card" style={{
          minHeight: 280,
          border: '2px dashed var(--line-2)',
          background: 'transparent', boxShadow: 'none',
          display: 'grid', placeItems: 'center',
          color: 'var(--ink-3)',
          cursor: 'pointer',
        }}>
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress page
// ─────────────────────────────────────────────────────────────
function ProgressPage(props) {
  const { goal } = props;
  const D = window.MACRO_DATA;
  const delta = +(goal.startKg - goal.currentKg).toFixed(1);
  const toGo = +(goal.currentKg - goal.weightKg).toFixed(1);
  return (
    <div className="stack" style={{ paddingTop: 8 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Last 14 days</div>
          <h1 className="page-title">Your <em>progress</em></h1>
        </div>
        <div className="chip dot">On track</div>
      </header>

      <section className="padded grid-2">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-hd">
            <div>
              <div className="eyebrow">Weight</div>
              <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
                <span className="numeric" style={{ fontSize: 44 }}>{goal.currentKg}</span>
                <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>kg</span>
                <span className="chip" style={{ background: 'transparent', color: 'var(--accent)', padding: 0 }}>
                  ↓ {delta} kg
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow">To goal</div>
              <div className="numeric" style={{ fontSize: 22 }}>{toGo} kg</div>
            </div>
          </div>
          <WeightChart data={D.WEIGHT_HISTORY} goalKg={goal.weightKg} startKg={goal.startKg}/>
        </div>

        <div className="card">
          <div className="eyebrow">Avg calories · 7d</div>
          <div className="numeric" style={{ fontSize: 36 }}>2,148</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            52 under your daily goal
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 18, alignItems: 'end', height: 60,
          }}>
            {[2200, 1980, 2310, 2050, 2240, 2090, 2160].map((v, i) => (
              <div key={i} style={{
                height: ((v - 1800) / 600) * 60,
                background: 'var(--ink)', borderRadius: 3, opacity: 0.7,
              }}/>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">Macro adherence · 7d</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {[
              { l: 'Protein', v: 92, c: 'var(--p-color)' },
              { l: 'Carbs',   v: 78, c: 'var(--c-color)' },
              { l: 'Fat',     v: 84, c: 'var(--f-color)' },
            ].map((m) => (
              <div key={m.l}>
                <div className="between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.l}</span>
                  <span style={{ fontSize: 12 }} className="tabular">{m.v}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.v}%`, background: m.c }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="padded">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Insights</div>
            <span className="chip">3 new</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { i: 'bolt',  t: 'Protein up 18% this week', s: 'You\u2019re hitting target on 5 of 7 days — best yet.' },
              { i: 'flame', t: '12-day streak is your second-longest', s: '16 more matches your record from March.' },
              { i: 'foot',  t: 'Step average climbing', s: 'Up 1,200 from last week. Calorie burn matches +0.2kg/wk loss.' },
            ].map((x, i) => (
              <div key={i} className="row" style={{
                padding: 14, background: 'var(--surface-2)', borderRadius: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'var(--surface)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name={x.i} size={16}/>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{x.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{x.s}</div>
                </div>
              </div>
            ))}
          </div>
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

// Mount only when not embedded in a multi-root canvas.
if (!window.__SKIP_AUTOMOUNT) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
}
window.MacroApp = App;
