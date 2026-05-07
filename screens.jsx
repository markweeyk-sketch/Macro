// Macro — screen components
// Loaded into window so app.jsx can reference them across babel script files.

const { useState, useMemo, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG, stroke-based, monoline)
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, stroke = 1.6 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  const map = {
    home:    <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"/>,
    plus:    <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    search:  <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
    book:    <path d="M4 4h11a4 4 0 0 1 4 4v12H7a3 3 0 0 1-3-3V4z M4 17h15"/>,
    chart:   <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>,
    user:    <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.9l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    barcode: <><path d="M3 5v14"/><path d="M7 5v14"/><path d="M11 5v14"/><path d="M15 5v14"/><path d="M19 5v14"/><path d="M21 5v14"/></>,
    camera:  <><path d="M3 7h4l2-3h6l2 3h4v12H3V7z"/><circle cx="12" cy="13" r="4"/></>,
    close:   <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    chevron: <path d="M9 6l6 6-6 6"/>,
    flame:   <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C7.5 11 8 13.5 8 14a4 4 0 0 0 4 4 4 4 0 0 0 4-4c0-3-2-5-4-7-1-1-1-2 0-4z"/>,
    bolt:    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>,
    target:  <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></>,
    check:   <path d="M5 13l4 4L19 7"/>,
    minus:   <path d="M5 12h14"/>,
    arrowR:  <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    star:    <path d="M12 3l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-6.5L3 10l6-1z"/>,
    drop:    <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>,
    foot:    <><path d="M7 16c0 2 2 4 4 4s4-2 4-4c0-1-1-2-2-3-1-1-2-2-2-4 0-2-1-4-3-4S5 7 5 10c0 2 2 4 2 6z"/></>,
    scale:   <><path d="M3 7h18l-2 13H5L3 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></>,
  };
  return <svg {...props}>{map[name]}</svg>;
};

// ─────────────────────────────────────────────────────────────
// Calorie ring
// ─────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal, size = 220, thickness = 14, mode = 'lose' }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(consumed / goal, 1.15));
  const remaining = goal - consumed;
  const overGoal = mode === 'lose' && remaining < 0;
  return (
    <div className="ring" style={{ '--size': `${size}px`, '--thickness': `${thickness}px` }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={thickness}
                className="track" strokeLinecap="round"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={thickness}
                className="fill" strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c - c * pct}
                style={{ stroke: overGoal ? 'var(--warn)' : 'var(--ink)' }}/>
      </svg>
      <div className="ring-center">
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
            {remaining >= 0 ? 'Remaining' : 'Over'}
          </div>
          <div className="numeric" style={{ fontSize: 56, lineHeight: 1, marginTop: 4 }}>
            {Math.abs(Math.round(remaining))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            {Math.round(consumed)} / {goal} kcal
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Macro bars
// ─────────────────────────────────────────────────────────────
function MacroBars({ totals, goal }) {
  const items = [
    { key: 'p', label: 'Protein', cur: totals.p, goal: goal.protein, color: 'var(--p-color)', unit: 'g' },
    { key: 'c', label: 'Carbs',   cur: totals.c, goal: goal.carbs,   color: 'var(--c-color)', unit: 'g' },
    { key: 'f', label: 'Fat',     cur: totals.f, goal: goal.fat,     color: 'var(--f-color)', unit: 'g' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((m) => {
        const pct = Math.min(m.cur / m.goal, 1) * 100;
        return (
          <div key={m.key} className="macro-row">
            <div className="macro-label">{m.label}</div>
            <div className="macro-track">
              <div className="macro-fill" style={{ width: `${pct}%`, background: m.color }}/>
            </div>
            <div className="macro-vals">
              <strong>{Math.round(m.cur)}</strong> / {m.goal}{m.unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Macro donut (alt layout)
// ─────────────────────────────────────────────────────────────
function MacroDonut({ totals, goal }) {
  const macros = [
    { key: 'p', cur: totals.p * 4, goal: goal.protein * 4, color: 'var(--p-color)', label: 'Protein', g: totals.p, gGoal: goal.protein },
    { key: 'c', cur: totals.c * 4, goal: goal.carbs   * 4, color: 'var(--c-color)', label: 'Carbs',   g: totals.c, gGoal: goal.carbs },
    { key: 'f', cur: totals.f * 9, goal: goal.fat     * 9, color: 'var(--f-color)', label: 'Fat',     g: totals.f, gGoal: goal.fat },
  ];
  return (
    <div style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
      {macros.map((m) => {
        const size = 84, thick = 8;
        const r = (size - thick) / 2, c = 2 * Math.PI * r;
        const pct = Math.min(m.cur / m.goal, 1);
        return (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
              <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={thick}
                        stroke="var(--surface-2)"/>
                <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={thick}
                        stroke={m.color} strokeLinecap="round"
                        strokeDasharray={c} strokeDashoffset={c - c * pct}/>
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.02em',
              }}>{Math.round(m.g)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
                {m.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }} className="tabular">
                of {m.gGoal}g
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sparkline / weight chart
// ─────────────────────────────────────────────────────────────
function WeightChart({ data, goalKg, startKg, height = 140 }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padding = { l: 30, r: 16, t: 16, b: 24 };
  const min = Math.min(...data, goalKg) - 0.5;
  const max = Math.max(...data, startKg) + 0.5;
  const sx = (i) => padding.l + (i / (data.length - 1)) * (w - padding.l - padding.r);
  const sy = (v) => padding.t + (1 - (v - min) / (max - min)) * (height - padding.t - padding.b);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
  const area = `${path} L ${sx(data.length-1)} ${height - padding.b} L ${sx(0)} ${height - padding.b} Z`;
  const goalY = sy(goalKg);
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={height}>
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--ink)" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* goal line */}
        <line x1={padding.l} x2={w - padding.r} y1={goalY} y2={goalY}
              stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 4" opacity="0.7"/>
        <text x={w - padding.r} y={goalY - 4} textAnchor="end"
              fontSize="10" fill="var(--accent)" fontFamily="var(--mono)">
          GOAL {goalKg}kg
        </text>
        {/* area */}
        <path d={area} fill="url(#wgrad)"/>
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
        {/* dots */}
        {data.map((v, i) => (
          <circle key={i} cx={sx(i)} cy={sy(v)} r={i === data.length - 1 ? 4 : 0}
                  fill="var(--ink)" stroke="var(--bg)" strokeWidth="2"/>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step bars
// ─────────────────────────────────────────────────────────────
function StepBars({ data, goal }) {
  const max = Math.max(...data, goal);
  const days = ['M','T','W','T','F','S','S'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, alignItems: 'end', height: 80 }}>
      {data.map((v, i) => {
        const h = (v / max) * 60 + 6;
        const hit = v >= goal;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', maxWidth: 18,
              height: h, borderRadius: 4,
              background: hit ? 'var(--ink)' : 'var(--surface-2)',
              transition: 'height 600ms cubic-bezier(.4,0,.2,1)',
            }}/>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{days[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quick-log chip strip
// ─────────────────────────────────────────────────────────────
function QuickLog({ foods, onAdd }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginRight: -20, paddingRight: 20 }}>
      {foods.map((f) => (
        <button key={f.id} onClick={() => onAdd(f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px 8px 8px',
            borderRadius: 999,
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            transition: 'transform 120ms',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = ''}
        >
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--surface-2)',
            display: 'grid', placeItems: 'center', fontSize: 14,
          }}>{f.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="tabular">{Math.round(window.MACRO_DATA.nutritionFor(f, f.units[0].g).kcal)}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Meal section
// ─────────────────────────────────────────────────────────────
function MealSection({ meal, label, items, foods, onAdd, onRemove, onOpen }) {
  const total = items.reduce((s, it) => {
    const f = foods.find((x) => x.id === it.foodId);
    if (!f) return s;
    return s + window.MACRO_DATA.nutritionFor(f, it.grams).kcal;
  }, 0);
  return (
    <div className="meal">
      <div className="meal-hd">
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
            {label}
          </div>
          <div className="meal-name">{meal[0].toUpperCase() + meal.slice(1)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div className="meal-cal numeric" style={{ fontSize: 22 }}>{Math.round(total)}</div>
          <div className="meal-cal">kcal</div>
        </div>
      </div>
      {items.length === 0 && (
        <button onClick={() => onOpen(meal)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 0',
          color: 'var(--ink-3)', fontSize: 14,
        }}>
          <Icon name="plus" size={16}/> Add to {meal}
        </button>
      )}
      {items.map((it) => {
        const f = foods.find((x) => x.id === it.foodId);
        if (!f) return null;
        const n = window.MACRO_DATA.nutritionFor(f, it.grams);
        const unit = f.units[it.unitIndex];
        const label = unit ? unit.label : `${Math.round(it.grams)}g`;
        return (
          <div key={it.id} className="food-row">
            <div className="food-emoji">{f.emoji}</div>
            <div>
              <div className="food-name">{f.name}</div>
              <div className="food-meta">{f.brand} · {label}</div>
            </div>
            <div className="food-kcal">{Math.round(n.kcal)}</div>
            <button className="food-add" onClick={() => onRemove(it.id)} title="Remove">
              <Icon name="minus" size={14}/>
            </button>
          </div>
        );
      })}
      {items.length > 0 && (
        <button onClick={() => onOpen(meal)} style={{
          marginTop: 10, fontSize: 13, color: 'var(--ink-3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="plus" size={14}/> Add more
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add-food sheet
// ─────────────────────────────────────────────────────────────
function AddFoodSheet({ open, onClose, foods, frequent, defaultMeal, onConfirm }) {
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState(defaultMeal || 'breakfast');
  const [picked, setPicked] = useState(null);
  const [unitIndex, setUnitIndex] = useState(0);  // -1 = custom grams, -2 = custom oz
  const [amount, setAmount] = useState(1);        // multiplier on the chosen unit OR raw value for custom
  useEffect(() => {
    if (open) {
      setQ(''); setPicked(null); setUnitIndex(0); setAmount(1);
      setMeal(defaultMeal || 'breakfast');
    }
  }, [open, defaultMeal]);
  useEffect(() => {
    // reset amount when picking a new food
    if (picked) { setUnitIndex(0); setAmount(1); }
  }, [picked]);
  if (!open) return null;
  const filtered = q
    ? foods.filter((f) => (f.name + ' ' + f.brand).toLowerCase().includes(q.toLowerCase()))
    : null;
  const showFreq = !q && !picked;
  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
              Log to
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {['breakfast','lunch','dinner','snack'].map((m) => (
                <button key={m} onClick={() => setMeal(m)}
                  className="chip"
                  style={{
                    background: meal === m ? 'var(--ink)' : 'var(--surface-2)',
                    color: meal === m ? 'var(--bg)' : 'var(--ink-2)',
                    textTransform: 'capitalize',
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">
          {!picked && (
            <>
              <div className="search" style={{ marginBottom: 16, boxShadow: 'inset 0 0 0 1px var(--line-2)' }}>
                <Icon name="search" size={16}/>
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                       placeholder="Search foods, brands, or scan a barcode..."/>
                <button className="icon-btn" style={{ width: 30, height: 30, boxShadow: 'none', background: 'var(--surface-2)' }}>
                  <Icon name="barcode" size={14}/>
                </button>
              </div>
              {showFreq && (
                <>
                  <div style={{
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em',
                    color: 'var(--ink-3)', marginBottom: 8,
                  }}>Frequent</div>
                  <div style={{ marginBottom: 18 }}>
                    {frequent.map((f) => {
                      const n = window.MACRO_DATA.nutritionFor(f, f.units[0].g);
                      return (
                        <button key={f.id} onClick={() => setPicked(f)} style={{
                          display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, alignItems: 'center',
                          padding: '10px 0', borderTop: '1px solid var(--line)', width: '100%', textAlign: 'left',
                        }}>
                          <div className="food-emoji">{f.emoji}</div>
                          <div>
                            <div className="food-name">{f.name}</div>
                            <div className="food-meta">{f.brand} · {f.units[0].label}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="food-kcal">{Math.round(n.kcal)} kcal</div>
                            <Icon name="plus" size={16}/>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {filtered && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                    {filtered.length} result{filtered.length === 1 ? '' : 's'}
                  </div>
                  {filtered.map((f) => {
                    const n = window.MACRO_DATA.nutritionFor(f, f.units[0].g);
                    return (
                      <button key={f.id} onClick={() => setPicked(f)} style={{
                        display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, alignItems: 'center',
                        padding: '10px 0', borderTop: '1px solid var(--line)', width: '100%', textAlign: 'left',
                      }}>
                        <div className="food-emoji">{f.emoji}</div>
                        <div>
                          <div className="food-name">{f.name}</div>
                          <div className="food-meta">{f.brand} · {f.units[0].label}</div>
                        </div>
                        <div className="food-kcal">{Math.round(n.kcal)} kcal</div>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
                      No matches. <span style={{ color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer' }}>Create a custom food</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {picked && (() => {
            // Compute current grams from unit selection + amount
            const isCustomG  = unitIndex === -1;
            const isCustomOz = unitIndex === -2;
            const grams = isCustomG  ? Math.max(0, +amount)
                        : isCustomOz ? Math.max(0, +amount) * 28.3495
                        : Math.max(0, +amount) * picked.units[unitIndex].g;
            const n = window.MACRO_DATA.nutritionFor(picked, grams);
            const allUnits = [
              ...picked.units.map((u, i) => ({ idx: i, label: u.label })),
              { idx: -1, label: 'grams' },
              { idx: -2, label: 'ounces' },
            ];
            return (
              <div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 16,
                    background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 32,
                  }}>{picked.emoji}</div>
                  <div>
                    <div className="serif" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>{picked.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {picked.brand} · {picked.per100.kcal} kcal / 100g
                    </div>
                  </div>
                </div>

                {/* Unit picker — pill row */}
                <div style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'var(--ink-3)', marginBottom: 8,
                }}>Unit</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {allUnits.map((u) => (
                    <button key={u.idx} onClick={() => { setUnitIndex(u.idx); setAmount(u.idx < 0 ? (u.idx === -1 ? 100 : 4) : 1); }}
                      className="chip"
                      style={{
                        background: unitIndex === u.idx ? 'var(--ink)' : 'var(--surface-2)',
                        color: unitIndex === u.idx ? 'var(--bg)' : 'var(--ink-2)',
                      }}>
                      {u.label}
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 14, background: 'var(--surface-2)',
                }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
                      {isCustomG ? 'Grams' : isCustomOz ? 'Ounces' : 'Servings'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                      = {grams.toFixed(grams < 10 ? 1 : 0)} g
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="icon-btn" style={{ width: 32, height: 32 }}
                            onClick={() => setAmount((a) => {
                              const step = isCustomG ? 10 : isCustomOz ? 0.5 : 0.25;
                              return Math.max(0, +(+a - step).toFixed(2));
                            })}>
                      <Icon name="minus" size={14}/>
                    </button>
                    <input type="number" value={amount} step={isCustomG ? 5 : isCustomOz ? 0.5 : 0.25} min="0"
                      onChange={(e) => setAmount(e.target.value === '' ? '' : +e.target.value)}
                      style={{
                        background: 'var(--surface)', border: 0, outline: 0,
                        borderRadius: 10, padding: '8px 10px',
                        fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.02em',
                        width: 80, textAlign: 'center',
                      }}/>
                    <button className="icon-btn" style={{ width: 32, height: 32 }}
                            onClick={() => setAmount((a) => {
                              const step = isCustomG ? 10 : isCustomOz ? 0.5 : 0.25;
                              return +(+a + step).toFixed(2);
                            })}>
                      <Icon name="plus" size={14}/>
                    </button>
                  </div>
                </div>

                {/* Live nutrition */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8, marginTop: 16,
                }}>
                  {[
                    { label: 'kcal', v: Math.round(n.kcal),         c: 'var(--ink)' },
                    { label: 'P',    v: Math.round(n.p) + 'g',      c: 'var(--p-color)' },
                    { label: 'C',    v: Math.round(n.c) + 'g',      c: 'var(--c-color)' },
                    { label: 'F',    v: Math.round(n.f) + 'g',      c: 'var(--f-color)' },
                  ].map((m) => (
                    <div key={m.label} style={{
                      background: 'var(--surface-2)', borderRadius: 14,
                      padding: '12px 10px', textAlign: 'center',
                    }}>
                      <div className="numeric" style={{ fontSize: 22, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 2 }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick amount presets */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                  {(isCustomG ? [50,100,150,200,250] : isCustomOz ? [2,3,4,6,8] : [0.5,1,1.5,2]).map((v) => (
                    <button key={v} onClick={() => setAmount(v)}
                      className="chip"
                      style={{
                        background: 'transparent',
                        boxShadow: 'inset 0 0 0 1px var(--line-2)',
                        color: 'var(--ink-2)',
                      }}>
                      {v}{isCustomG ? 'g' : isCustomOz ? 'oz' : '×'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="sheet-foot">
          {!picked && <button className="btn ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>}
          {picked && (
            <>
              <button className="btn ghost" onClick={() => setPicked(null)}>Back</button>
              <button className="btn" style={{ flex: 1 }}
                      onClick={() => {
                        const isCustomG  = unitIndex === -1;
                        const isCustomOz = unitIndex === -2;
                        const grams = isCustomG  ? Math.max(0, +amount)
                                    : isCustomOz ? Math.max(0, +amount) * 28.3495
                                    : Math.max(0, +amount) * picked.units[unitIndex].g;
                        // Persist unitIndex >= 0 for display; for custom, store -1 (raw grams).
                        const storedIdx = unitIndex < 0 ? -1 : unitIndex;
                        onConfirm(picked, grams, storedIdx, meal);
                        onClose();
                      }}>
                <Icon name="check" size={14}/> Add to {meal}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Goal-setup sheet
// ─────────────────────────────────────────────────────────────
function GoalSheet({ open, onClose, goal, onSave }) {
  const [draft, setDraft] = useState(goal);
  useEffect(() => { if (open) setDraft(goal); }, [open, goal]);
  if (!open) return null;
  const recompute = (mode) => {
    const base = 2400;
    const kcal = mode === 'lose' ? base - 200 : mode === 'gain' ? base + 400 : base;
    const protein = Math.round(goal.currentKg * (mode === 'gain' ? 2 : 1.8));
    const fat = Math.round((kcal * 0.3) / 9);
    const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
    return { ...draft, mode, kcal, protein, carbs, fat };
  };
  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div className="serif" style={{ fontSize: 24 }}>Daily goal</div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 10 }}>
            I want to
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 22 }}>
            {[
              { id: 'lose',     label: 'Lose',     hint: '−0.5 kg/wk' },
              { id: 'maintain', label: 'Maintain', hint: 'steady' },
              { id: 'gain',     label: 'Gain',     hint: '+0.4 kg/wk' },
            ].map((m) => (
              <button key={m.id}
                onClick={() => setDraft(recompute(m.id))}
                style={{
                  padding: '14px 10px',
                  borderRadius: 16,
                  background: draft.mode === m.id ? 'var(--ink)' : 'var(--surface-2)',
                  color: draft.mode === m.id ? 'var(--bg)' : 'var(--ink)',
                  textAlign: 'center',
                }}>
                <div className="serif" style={{ fontSize: 18 }}>{m.label}</div>
                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{m.hint}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <NumField label="Current weight" value={draft.currentKg} suffix="kg"
                      onChange={(v) => setDraft({ ...draft, currentKg: v })}/>
            <NumField label="Target weight" value={draft.weightKg} suffix="kg"
                      onChange={(v) => setDraft({ ...draft, weightKg: v })}/>
          </div>

          <div style={{
            background: 'var(--surface-2)',
            borderRadius: 16, padding: 18, marginBottom: 6,
          }}>
            <div className="between" style={{ marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
                  Calories
                </div>
                <div className="numeric" style={{ fontSize: 36 }}>{draft.kcal}</div>
              </div>
              <div className="muted" style={{ fontSize: 12, textAlign: 'right', maxWidth: 160 }}>
                Calculated from your weight, goal, and activity level.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Protein', v: draft.protein, c: 'var(--p-color)' },
                { label: 'Carbs',   v: draft.carbs,   c: 'var(--c-color)' },
                { label: 'Fat',     v: draft.fat,     c: 'var(--f-color)' },
              ].map((m) => (
                <div key={m.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
                  <div className="numeric" style={{ fontSize: 22, color: m.c }}>{m.v}g</div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 2 }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sheet-foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ flex: 1 }} onClick={() => { onSave(draft); onClose(); }}>
            Save goal
          </button>
        </div>
      </div>
    </>
  );
}

function NumField({ label, value, suffix, onChange }) {
  return (
    <label style={{
      display: 'block', background: 'var(--surface-2)', borderRadius: 14, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <input type="number" value={value} onChange={(e) => onChange(+e.target.value)}
               style={{
                 background: 'transparent', border: 0, outline: 0, padding: 0,
                 fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.02em', width: '100%',
               }}/>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
    </label>
  );
}

// Export to window
Object.assign(window, {
  Icon, CalorieRing, MacroBars, MacroDonut, WeightChart, StepBars,
  QuickLog, MealSection, AddFoodSheet, GoalSheet,
});
