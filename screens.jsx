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
function CalorieRing({ consumed, goal, size = 220, thickness = 14, mode = 'lose', onClick }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(consumed / goal, 1.15));
  const remaining = goal - consumed;
  const overGoal = mode === 'lose' && remaining < 0;
  return (
    <div className="ring" onClick={onClick}
         style={{ '--size': `${size}px`, '--thickness': `${thickness}px`, cursor: onClick ? 'pointer' : undefined }}>
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
// Weight line chart — accepts entries: [{date, weight}]
// ─────────────────────────────────────────────────────────────
function WeightChart({ entries, goalKg, height = 180 }) {
  const ref = useRef(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((es) => {
      for (const e of es) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!entries || entries.length < 2) {
    return (
      <div ref={ref} style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-3)', fontSize: 13, textAlign: 'center', lineHeight: 1.6,
      }}>
        Log at least 2 weight entries to see your trend.
      </div>
    );
  }

  const pad = { l: w < 280 ? 28 : 36, r: 12, t: 16, b: 32 };
  const vals = entries.map((e) => e.weight);
  const mn = Math.min(...vals, goalKg) - 0.5;
  const mx = Math.max(...vals) + 0.5;
  const n = entries.length;
  const sx = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - (v - mn) / (mx - mn)) * (height - pad.t - pad.b);
  const linePath = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(e.weight).toFixed(1)}`).join(' ');
  const area = `${linePath} L${sx(n-1).toFixed(1)},${(height-pad.b).toFixed(1)} L${sx(0).toFixed(1)},${(height-pad.b).toFixed(1)}Z`;
  const goalY = sy(goalKg);
  const range = mx - mn;
  const step = range <= 1 ? 0.25 : range <= 3 ? 0.5 : range <= 8 ? 1 : 2;
  const yLabels = [];
  for (let v = Math.ceil(mn / step) * step; v <= mx; v = +(v + step).toFixed(2)) yLabels.push(v);
  const xIndices = n <= 3 ? entries.map((_, i) => i)
    : n <= 7 ? [0, Math.floor(n/2), n-1]
    : [0, Math.floor(n/3), Math.floor(2*n/3), n-1];
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div ref={ref} style={{ width: '100%', overflow: 'hidden' }}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'hidden' }}>
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--ink)" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {yLabels.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" strokeWidth={1}/>
            <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={10} fill="var(--ink-3)" fontFamily="var(--mono)">{v}</text>
          </g>
        ))}
        {goalKg >= mn && goalKg <= mx && (
          <g>
            <line x1={pad.l} x2={w - pad.r} y1={goalY} y2={goalY}
                  stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.8}/>
            <text x={w - pad.r - 2} y={goalY - 5} textAnchor="end" fontSize={10} fill="var(--accent)" fontFamily="var(--mono)">goal</text>
          </g>
        )}
        <path d={area} fill="url(#wgrad)"/>
        <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        {entries.map((e, i) => (
          <circle key={i} cx={sx(i)} cy={sy(e.weight)} r={i === n-1 ? 4.5 : 2.5}
                  fill="var(--ink)" stroke="var(--surface)" strokeWidth={2}/>
        ))}
        {xIndices.map((i) => (
          <text key={i} x={sx(i)} y={height - 4} textAnchor="middle" fontSize={10} fill="var(--ink-3)" fontFamily="var(--mono)">
            {fmt(entries[i].date)}
          </text>
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
function GoalSheet({ open, onClose, goal, latestKg, onSave }) {
  const [draft, setDraft] = useState(goal);
  useEffect(() => {
    if (open) {
      const base = { ...goal, currentKg: latestKg ?? goal.currentKg };
      if (base.sex && base.age && base.heightCm && base.activity) {
        const calc = window.calcGoal({
          sex: base.sex, age: +base.age, heightCm: +base.heightCm,
          currentKg: +base.currentKg, targetKg: +base.weightKg,
          activity: base.activity, mode: base.mode, rate: base.rate,
        });
        setDraft({ ...base, kcal: calc.kcal, protein: calc.protein, carbs: calc.carbs, fat: calc.fat });
      } else {
        setDraft(base);
      }
    }
  }, [open]);
  if (!open) return null;

  const recompute = (next) => {
    if (next.sex && next.age && next.heightCm && next.activity) {
      const calc = window.calcGoal({
        sex: next.sex, age: +next.age, heightCm: +next.heightCm,
        currentKg: +next.currentKg, targetKg: +next.weightKg,
        activity: next.activity, mode: next.mode, rate: next.rate,
      });
      return { ...next, kcal: calc.kcal, protein: calc.protein, carbs: calc.carbs, fat: calc.fat };
    }
    const r = next.rate || 0.5;
    const rKcal = Math.round(r * 7700 / 7);
    const base = 2000 + (next.mode === 'lose' ? -rKcal : next.mode === 'gain' ? rKcal : 0);
    const kcal = Math.max(1200, base);
    return { ...next, kcal, protein: Math.round(kcal * 0.30 / 4), carbs: Math.round(kcal * 0.40 / 4), fat: Math.round(kcal * 0.30 / 9) };
  };

  const setField = (changes) => setDraft((d) => recompute({ ...d, ...changes }));

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
              { id: 'lose',     label: 'Lose',     hint: `−${draft.rate || 0.5} kg/wk` },
              { id: 'maintain', label: 'Maintain', hint: 'steady' },
              { id: 'gain',     label: 'Gain',     hint: `+${draft.rate || 0.5} kg/wk` },
            ].map((m) => (
              <button key={m.id}
                onClick={() => setField({ mode: m.id })}
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
                      onChange={(v) => setField({ currentKg: v })}/>
            <NumField label="Target weight" value={draft.weightKg} suffix="kg"
                      onChange={(v) => setField({ weightKg: v })}/>
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
                {draft.sex ? 'Recalculated from your body stats.' : 'Estimated. Complete onboarding for a precise target.'}
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
          <button className="btn" style={{ flex: 1 }} onClick={() => { onSave({ ...draft, onboarded: true }); onClose(); }}>
            Save goal
          </button>
        </div>
      </div>
    </>
  );
}

function NumField({ label, value, suffix, onChange }) {
  const [str, setStr] = useState(value != null ? String(value) : '');
  const dirty = useRef(false);
  useEffect(() => { if (!dirty.current) setStr(value != null ? String(value) : ''); }, [value]);
  return (
    <label style={{
      display: 'block', background: 'var(--surface-2)', borderRadius: 14, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <input type="text" inputMode="decimal" value={str}
               onChange={(e) => {
                 dirty.current = true;
                 const s = e.target.value;
                 setStr(s);
                 const n = parseFloat(s);
                 if (Number.isFinite(n) && n > 0) onChange(n);
               }}
               onBlur={() => {
                 dirty.current = false;
                 const n = parseFloat(str);
                 if (Number.isFinite(n) && n > 0) { setStr(String(n)); }
                 else { setStr(value != null ? String(value) : ''); }
               }}
               style={{
                 background: 'transparent', border: 0, outline: 0, padding: 0,
                 fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.02em', width: '100%',
               }}/>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Goal calculation (Mifflin-St Jeor + TDEE)
// ─────────────────────────────────────────────────────────────
function calcGoal({ sex, age, heightCm, currentKg, targetKg, activity, mode, rate }) {
  const bmr = sex === 'male'
    ? 10 * currentKg + 6.25 * heightCm - 5 * age + 5
    : 10 * currentKg + 6.25 * heightCm - 5 * age - 161;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, 'very-active': 1.9 };
  const tdee = bmr * (multipliers[activity] || 1.55);
  // 1 kg ≈ 7700 kcal; rate in kg/wk → kcal/day deficit or surplus
  const effectiveRate = (mode !== 'maintain' && rate) ? rate : 0.5;
  const rateKcal = Math.round(effectiveRate * 7700 / 7);
  const offset = mode === 'lose' ? -rateKcal : mode === 'gain' ? rateKcal : 0;
  const kcal = Math.max(1200, Math.round(tdee + offset));
  const protein = Math.round((kcal * 0.30) / 4);
  const carbs   = Math.round((kcal * 0.40) / 4);
  const fat     = Math.round((kcal * 0.30) / 9);
  return {
    mode, rate: effectiveRate, kcal, protein, carbs, fat,
    weightKg: mode === 'maintain' ? currentKg : (targetKg || currentKg),
    startKg: currentKg, currentKg,
    streak: 0, stepsGoal: 8000, onboarded: true,
    sex, age: +age, heightCm: +heightCm, activity,
  };
}

// ─────────────────────────────────────────────────────────────
// Onboarding sheet — first-run goal setup
// ─────────────────────────────────────────────────────────────
function OnboardingSheet({ open, onComplete }) {
  const [sex,       setSex]       = useState('male');
  const [age,       setAge]       = useState(28);
  const [heightCm,  setHeightCm]  = useState(175);
  const [currentKg, setCurrentKg] = useState(75);
  const [targetKg,  setTargetKg]  = useState(70);
  const [activity,  setActivity]  = useState('moderate');
  const [mode,      setMode]      = useState('lose');
  const [rate,      setRate]      = useState(0.5);

  if (!open) return null;

  const calculated = calcGoal({ sex, age: +age, heightCm: +heightCm, currentKg: +currentKg, targetKg: +targetKg, activity, mode, rate });

  const activityOptions = [
    { v: 'sedentary',   l: 'Sedentary',   s: 'Desk job, little exercise' },
    { v: 'light',       l: 'Light',        s: '1–3 workouts / week' },
    { v: 'moderate',    l: 'Moderate',     s: '3–5 workouts / week' },
    { v: 'active',      l: 'Active',       s: '6–7 workouts / week' },
    { v: 'very-active', l: 'Very active',  s: 'Hard exercise or physical job' },
  ];

  return (
    <>
      <div className="sheet-bg"/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
              Welcome to Macro
            </div>
            <div className="serif" style={{ fontSize: 24 }}>Set up your goal</div>
          </div>
        </div>
        <div className="sheet-body">

          {/* Sex */}
          <div style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Sex</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['male','female'].map((s) => (
                <button key={s} onClick={() => setSex(s)} className="chip"
                  style={{
                    flex: 1, justifyContent: 'center', padding: '10px 0',
                    textTransform: 'capitalize',
                    background: sex === s ? 'var(--ink)' : 'var(--surface-2)',
                    color:      sex === s ? 'var(--bg)'  : 'var(--ink-2)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Age + Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <NumField label="Age" value={age} suffix="yrs" onChange={setAge}/>
            <NumField label="Height" value={heightCm} suffix="cm" onChange={setHeightCm}/>
          </div>

          {/* Weights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <NumField label="Current weight" value={currentKg} suffix="kg" onChange={setCurrentKg}/>
            <NumField label="Target weight"  value={targetKg}  suffix="kg" onChange={setTargetKg}/>
          </div>

          {/* Activity level */}
          <div style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Activity level</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activityOptions.map(({ v, l, s }) => (
                <button key={v} onClick={() => setActivity(v)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 12, textAlign: 'left',
                  background: activity === v ? 'var(--ink)' : 'var(--surface-2)',
                  color:      activity === v ? 'var(--bg)'  : 'var(--ink)',
                  transition: 'background 100ms',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{l}</div>
                    <div style={{ fontSize: 12, opacity: 0.65, marginTop: 1 }}>{s}</div>
                  </div>
                  {activity === v && <Icon name="check" size={15}/>}
                </button>
              ))}
            </div>
          </div>

          {/* Goal mode */}
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Goal</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'lose',     label: 'Lose',     hint: 'weight' },
                { id: 'maintain', label: 'Maintain', hint: 'steady' },
                { id: 'gain',     label: 'Gain',     hint: 'weight' },
              ].map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '14px 10px', borderRadius: 16, textAlign: 'center',
                  background: mode === m.id ? 'var(--ink)' : 'var(--surface-2)',
                  color:      mode === m.id ? 'var(--bg)'  : 'var(--ink)',
                  transition: 'background 100ms',
                }}>
                  <div className="serif" style={{ fontSize: 18 }}>{m.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{m.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rate of change — hidden for maintain */}
          {mode !== 'maintain' && (
            <div style={{ marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Rate of change</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[0.25, 0.5, 0.75, 1.0].map((r) => (
                  <button key={r} onClick={() => setRate(r)} style={{
                    padding: '12px 4px', borderRadius: 14, textAlign: 'center',
                    background: rate === r ? 'var(--ink)' : 'var(--surface-2)',
                    color:      rate === r ? 'var(--bg)'  : 'var(--ink)',
                    transition: 'background 100ms',
                  }}>
                    <div className="numeric" style={{ fontSize: 16 }}>{r}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>kg/wk</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
                ≈ {Math.round(rate * 7700 / 7)} kcal/day {mode === 'lose' ? 'deficit' : 'surplus'}
              </div>
            </div>
          )}

          {/* Live calculation preview */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 18 }}>
            <div className="between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Your daily target</div>
                <div className="numeric" style={{ fontSize: 42 }}>{calculated.kcal}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>kcal / day</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'right', maxWidth: 130, lineHeight: 1.5 }}>
                Based on your stats &amp; activity
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Protein', v: calculated.protein, c: 'var(--p-color)' },
                { label: 'Carbs',   v: calculated.carbs,   c: 'var(--c-color)' },
                { label: 'Fat',     v: calculated.fat,     c: 'var(--f-color)' },
              ].map((m) => (
                <div key={m.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
                  <div className="numeric" style={{ fontSize: 22, color: m.c }}>{m.v}g</div>
                  <div style={{
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: 'var(--ink-3)', marginTop: 2,
                  }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
        <div className="sheet-foot" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn" style={{ width: '100%' }} onClick={() => onComplete(calculated)}>
            Create my plan
          </button>
          <button style={{ fontSize: 13, color: 'var(--ink-3)', padding: '6px 0', textAlign: 'center' }}
                  onClick={() => onComplete(null)}>
            Skip for now
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings sheet helpers
// ─────────────────────────────────────────────────────────────
function SettingsGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {label && (
        <div style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--ink-3)', marginBottom: 8, paddingLeft: 4,
        }}>{label}</div>
      )}
      <div className="settings-card">{children}</div>
    </div>
  );
}

function SettingsRow({ label, sub, children }) {
  return (
    <div className="settings-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="settings-row-label">{label}</div>
        {sub && <div className="settings-row-sub">{sub}</div>}
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

function SettingsRowBtn({ label, sub, icon, onClick, danger }) {
  return (
    <button className="settings-row-btn" onClick={onClick}
            style={{ color: danger ? 'var(--warn)' : undefined }}>
      {icon && (
        <span style={{ color: danger ? 'var(--warn)' : 'var(--ink-3)', flexShrink: 0 }}>
          <Icon name={icon} size={16}/>
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div className="settings-row-label" style={{ color: danger ? 'var(--warn)' : undefined }}>
          {label}
        </div>
        {sub && <div className="settings-row-sub">{sub}</div>}
      </div>
      <Icon name="chevron" size={14} stroke={1.5}/>
    </button>
  );
}

function SettingsToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 26, borderRadius: 13, padding: 0,
      background: value ? 'var(--ink)' : 'var(--surface-2)',
      border: '1px solid var(--line-2)',
      position: 'relative', flexShrink: 0,
      transition: 'background 200ms',
    }}>
      <div style={{
        position: 'absolute',
        top: 2, left: value ? 19 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: value ? 'var(--bg)' : 'var(--surface)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left 200ms cubic-bezier(.4,0,.2,1)',
      }}/>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings sheet
// ─────────────────────────────────────────────────────────────
function SettingsSheet({ open, onClose, tweaks, setTweak, user, goal, onSignIn, onSignOut, onOpenProfile, onOpenGoal, onEditProfile }) {
  if (!open) return null;

  const isDark = tweaks.theme === 'graphite';
  const lightThemes = [
    { key: 'bone',   bg: '#F7F4EE', label: 'Natural' },
    { key: 'citrus', bg: '#FBF7EF', label: 'Citrus' },
    { key: 'marine', bg: '#EFF1F2', label: 'Marine' },
  ];

  const toggleDark = () => {
    if (isDark) {
      setTweak('theme', tweaks._lastLight || 'bone');
    } else {
      setTweak({ _lastLight: tweaks.theme, theme: 'graphite' });
    }
  };

  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div className="serif" style={{ fontSize: 24 }}>Settings</div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">

          <SettingsGroup label="Appearance">
            <SettingsRow label="Dark mode" sub="Switch to Graphite theme">
              <SettingsToggle value={isDark} onChange={toggleDark}/>
            </SettingsRow>
            {!isDark && (
              <SettingsRow label="Colour theme">
                <div style={{ display: 'flex', gap: 8 }}>
                  {lightThemes.map((t) => (
                    <button key={t.key} title={t.label}
                      onClick={() => setTweak('theme', t.key)}
                      style={{
                        width: 26, height: 26, borderRadius: '50%', padding: 0,
                        background: t.bg,
                        outline: tweaks.theme === t.key
                          ? '2px solid var(--ink)' : '1px solid var(--line-2)',
                        outlineOffset: 2, flexShrink: 0, transition: 'outline 150ms',
                      }}/>
                  ))}
                </div>
              </SettingsRow>
            )}
          </SettingsGroup>

          <SettingsGroup label="Dashboard">
            <SettingsRow label="Layout">
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { v: 'rings',   l: 'Ring' },
                  { v: 'bars',    l: 'Bars' },
                  { v: 'minimal', l: 'Min'  },
                ].map(({ v, l }) => (
                  <button key={v} className="chip"
                    onClick={() => setTweak('dashboardLayout', v)}
                    style={{
                      background: tweaks.dashboardLayout === v ? 'var(--ink)' : 'var(--surface-2)',
                      color:      tweaks.dashboardLayout === v ? 'var(--bg)'  : 'var(--ink-2)',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </SettingsRow>
            <SettingsRow label="Streak card">
              <SettingsToggle value={tweaks.showStreak} onChange={(v) => setTweak('showStreak', v)}/>
            </SettingsRow>
            <SettingsRow label="Steps card">
              <SettingsToggle value={tweaks.showSteps} onChange={(v) => setTweak('showSteps', v)}/>
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup label="Account">
            {user ? (
              <>
                <SettingsRowBtn
                  label={user.displayName || 'Profile'} sub={user.email}
                  icon="user" onClick={onOpenProfile}/>
                {goal && onEditProfile && (
                  <SettingsRowBtn
                    label="Edit profile" sub="Update stats & recalculate goal"
                    icon="scale" onClick={onEditProfile}/>
                )}
                {goal && (
                  <SettingsRowBtn
                    label="Daily goal" sub={`${goal.kcal} kcal · ${goal.mode}`}
                    icon="target" onClick={onOpenGoal}/>
                )}
                <SettingsRowBtn label="Sign out" icon="arrowR" onClick={onSignOut} danger/>
              </>
            ) : (
              <SettingsRowBtn
                label="Sign in or create account"
                icon="user" onClick={onSignIn}/>
            )}
          </SettingsGroup>

        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile sheet
// ─────────────────────────────────────────────────────────────
function ProfileSheet({ open, onClose, user, goal, weights, onOpenGoal, onSignOut, onEditProfile, onReset, onLogWeight }) {
  const [pwMsg, setPwMsg] = useState('');
  const [resetStep, setResetStep] = useState(0); // 0=normal, 1=confirm
  useEffect(() => { if (!open) { setResetStep(0); setPwMsg(''); } }, [open]);
  if (!open || !user) return null;

  const FB = window.MACRO_FIREBASE;
  const initials = user.displayName
    ? user.displayName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user.email?.[0] || '?').toUpperCase();

  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString([], { month: 'long', year: 'numeric' })
    : null;

  const isEmailUser = user.providerData?.some((p) => p.providerId === 'password');

  const sendReset = async () => {
    try {
      await FB.auth.sendPasswordResetEmail(user.email);
      setPwMsg('Reset email sent!');
    } catch {
      setPwMsg('Could not send reset email.');
    }
  };

  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div className="serif" style={{ fontSize: 24 }}>Profile</div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">

          {/* Avatar + name */}
          <div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 8 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-soft), var(--accent))',
              color: 'var(--bg)', display: 'grid', placeItems: 'center',
              fontSize: 30, fontWeight: 600, margin: '0 auto 12px',
            }}>{initials}</div>
            <div className="serif" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>
              {user.displayName || 'Account'}
            </div>
            {memberSince && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                Member since {memberSince}
              </div>
            )}
          </div>

          {/* Stats grid */}
          {goal && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10, marginBottom: 24,
            }}>
              {(() => {
                const latestKg = weights && weights.length > 0 ? weights[weights.length - 1].weight : goal.currentKg;
                const firstKg  = weights && weights.length > 0 ? weights[0].weight : goal.startKg;
                const delta    = +(latestKg - firstKg).toFixed(1);
                const toGoRaw  = +(latestKg - goal.weightKg).toFixed(1);
                const gained   = goal.mode === 'gain' ? delta >= 0 : delta < 0;
                return [
                { label: 'Streak',  value: `${goal.streak}d` },
                { label: gained ? (goal.mode === 'gain' ? 'Gained' : 'Lost') : (goal.mode === 'gain' ? 'To gain' : 'To lose'),
                  value: weights && weights.length > 1 ? `${Math.abs(delta)}kg` : '—' },
                { label: 'To goal', value: `${Math.max(0, Math.abs(toGoRaw))}kg` },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'var(--surface-2)', borderRadius: 14,
                  padding: '14px 10px', textAlign: 'center',
                }}>
                  <div className="numeric" style={{ fontSize: 24 }}>{s.value}</div>
                  <div style={{
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: 'var(--ink-3)', marginTop: 2,
                  }}>{s.label}</div>
                </div>
              ));
              })()}
            </div>
          )}

          <SettingsGroup label="Account details">
            <SettingsRow label="Email">
              <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </SettingsRow>
            {isEmailUser && (
              <SettingsRowBtn
                label={pwMsg || 'Reset password'}
                sub={pwMsg ? '' : 'Send a reset link to your inbox'}
                icon="arrowR" onClick={sendReset}/>
            )}
          </SettingsGroup>

          {goal && (
            <SettingsGroup label="Nutrition">
              {onEditProfile && (
                <SettingsRowBtn label="Edit profile" sub="Update stats & recalculate goal"
                  icon="scale" onClick={onEditProfile}/>
              )}
              {onLogWeight && (
                <SettingsRowBtn label="Log weight" sub={`Current: ${goal.currentKg} kg`}
                  icon="drop" onClick={onLogWeight}/>
              )}
              <SettingsRowBtn
                label="Daily goal" sub={`${goal.kcal} kcal · ${goal.mode}`}
                icon="target" onClick={onOpenGoal}/>
            </SettingsGroup>
          )}

          <SettingsGroup label="Data">
            {resetStep === 0 ? (
              <SettingsRowBtn label="Reset account data"
                sub="Delete all logs, plans, recipes, and goal"
                icon="close" onClick={() => setResetStep(1)} danger/>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(198,106,58,0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)', marginBottom: 6 }}>
                  Are you sure?
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 14 }}>
                  This will permanently delete all your food logs, meal plans, recipes, and goal data. This cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn ghost" style={{ flex: 1, fontSize: 13 }}
                          onClick={() => setResetStep(0)}>Cancel</button>
                  <button className="btn" onClick={onReset}
                          style={{ flex: 1, fontSize: 13, background: 'var(--warn)', boxShadow: 'none' }}>
                    Delete everything
                  </button>
                </div>
              </div>
            )}
          </SettingsGroup>

        </div>
        <div className="sheet-foot" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn ghost"
                  style={{ width: '100%', color: 'var(--warn)', boxShadow: 'inset 0 0 0 1px rgba(198,106,58,0.3)' }}
                  onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Edit-profile sheet — same fields as onboarding, pre-filled,
// recalculates goal without touching logs/plan/recipes
// ─────────────────────────────────────────────────────────────
function EditProfileSheet({ open, onClose, goal, onSave }) {
  const [sex,       setSex]       = useState('male');
  const [age,       setAge]       = useState(28);
  const [heightCm,  setHeightCm]  = useState(175);
  const [currentKg, setCurrentKg] = useState(75);
  const [targetKg,  setTargetKg]  = useState(70);
  const [activity,  setActivity]  = useState('moderate');
  const [mode,      setMode]      = useState('maintain');
  const [rate,      setRate]      = useState(0.5);

  useEffect(() => {
    if (open) {
      setSex(goal.sex || 'male');
      setAge(goal.age || 28);
      setHeightCm(goal.heightCm || 175);
      setCurrentKg(goal.currentKg || 75);
      setTargetKg(goal.weightKg || 70);
      setActivity(goal.activity || 'moderate');
      setMode(goal.mode || 'maintain');
      setRate(goal.rate || 0.5);
    }
  }, [open, goal]);

  if (!open) return null;

  const calculated = calcGoal({
    sex, age: +age, heightCm: +heightCm,
    currentKg: +currentKg, targetKg: +targetKg, activity, mode, rate,
  });

  const activityOptions = [
    { v: 'sedentary',   l: 'Sedentary',   s: 'Desk job, little exercise' },
    { v: 'light',       l: 'Light',        s: '1–3 workouts / week' },
    { v: 'moderate',    l: 'Moderate',     s: '3–5 workouts / week' },
    { v: 'active',      l: 'Active',       s: '6–7 workouts / week' },
    { v: 'very-active', l: 'Very active',  s: 'Hard exercise or physical job' },
  ];

  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
              Update your details
            </div>
            <div className="serif" style={{ fontSize: 24 }}>Edit profile</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">
          <div style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Sex</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['male','female'].map((s) => (
                <button key={s} onClick={() => setSex(s)} className="chip"
                  style={{
                    flex: 1, justifyContent: 'center', padding: '10px 0', textTransform: 'capitalize',
                    background: sex === s ? 'var(--ink)' : 'var(--surface-2)',
                    color:      sex === s ? 'var(--bg)'  : 'var(--ink-2)',
                  }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <NumField label="Age" value={age} suffix="yrs" onChange={setAge}/>
            <NumField label="Height" value={heightCm} suffix="cm" onChange={setHeightCm}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <NumField label="Current weight" value={currentKg} suffix="kg" onChange={setCurrentKg}/>
            <NumField label="Target weight"  value={targetKg}  suffix="kg" onChange={setTargetKg}/>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Activity level</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activityOptions.map(({ v, l, s }) => (
                <button key={v} onClick={() => setActivity(v)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 12, textAlign: 'left',
                  background: activity === v ? 'var(--ink)' : 'var(--surface-2)',
                  color:      activity === v ? 'var(--bg)'  : 'var(--ink)',
                  transition: 'background 100ms',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{l}</div>
                    <div style={{ fontSize: 12, opacity: 0.65, marginTop: 1 }}>{s}</div>
                  </div>
                  {activity === v && <Icon name="check" size={15}/>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Goal</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'lose',     label: 'Lose',     hint: 'weight' },
                { id: 'maintain', label: 'Maintain', hint: 'steady' },
                { id: 'gain',     label: 'Gain',     hint: 'weight' },
              ].map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '14px 10px', borderRadius: 16, textAlign: 'center',
                  background: mode === m.id ? 'var(--ink)' : 'var(--surface-2)',
                  color:      mode === m.id ? 'var(--bg)'  : 'var(--ink)',
                  transition: 'background 100ms',
                }}>
                  <div className="serif" style={{ fontSize: 18 }}>{m.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{m.hint}</div>
                </button>
              ))}
            </div>
          </div>
          {mode !== 'maintain' && (
            <div style={{ marginBottom: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Rate of change</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[0.25, 0.5, 0.75, 1.0].map((r) => (
                  <button key={r} onClick={() => setRate(r)} style={{
                    padding: '12px 4px', borderRadius: 14, textAlign: 'center',
                    background: rate === r ? 'var(--ink)' : 'var(--surface-2)',
                    color:      rate === r ? 'var(--bg)'  : 'var(--ink)',
                    transition: 'background 100ms',
                  }}>
                    <div className="numeric" style={{ fontSize: 16 }}>{r}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>kg/wk</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
                ≈ {Math.round(rate * 7700 / 7)} kcal/day {mode === 'lose' ? 'deficit' : 'surplus'}
              </div>
            </div>
          )}
          <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 18 }}>
            <div className="between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">New daily target</div>
                <div className="numeric" style={{ fontSize: 42 }}>{calculated.kcal}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>kcal / day</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Protein', v: calculated.protein, c: 'var(--p-color)' },
                { label: 'Carbs',   v: calculated.carbs,   c: 'var(--c-color)' },
                { label: 'Fat',     v: calculated.fat,     c: 'var(--f-color)' },
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
          <button className="btn" style={{ flex: 1 }} onClick={() => {
            onSave({
              ...goal,
              ...calculated,
              startKg: goal.startKg,
              streak: goal.streak,
              onboarded: true,
            });
            onClose();
          }}>
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Recipe editor sheet — create or edit a recipe
// ─────────────────────────────────────────────────────────────
function RecipeEditorSheet({ open, onClose, recipe, foods, onSave }) {
  const [name,         setName]         = useState('');
  const [emoji,        setEmoji]        = useState('🍽️');
  const [serves,       setServes]       = useState(1);
  const [items,        setItems]        = useState([]); // [{food, grams, unitIndex}]
  const [q,            setQ]            = useState('');
  const [adding,       setAdding]       = useState(null);
  const [addUnitIdx,   setAddUnitIdx]   = useState(0);
  const [addAmount,    setAddAmount]    = useState(1);

  useEffect(() => {
    if (!open) return;
    if (recipe) {
      setName(recipe.name || '');
      setEmoji(recipe.emoji || '🍽️');
      setServes(recipe.serves || 1);
      const loaded = (recipe.items || []).map((item) => {
        const foodId = typeof item === 'string' ? item : item.foodId;
        const grams  = typeof item === 'string'
          ? (foods.find((f) => f.id === item)?.units[0].g ?? 100) : item.grams;
        const food   = foods.find((f) => f.id === foodId);
        return food ? { food, grams, unitIndex: typeof item === 'string' ? 0 : (item.unitIndex || 0) } : null;
      }).filter(Boolean);
      setItems(loaded);
    } else {
      setName(''); setEmoji('🍽️'); setServes(1); setItems([]);
    }
    setQ(''); setAdding(null);
  }, [open, recipe]);

  if (!open) return null;

  const EMOJIS = ['🍽️','🥣','🥗','🍱','🥘','🍲','🥙','🌮','🌯','🥪','🍳','🥚','🍗','🐟','🥩','🥦','🥕','🍠','🍚','🥑','🥤','🧃','🍵','☕'];

  const filtered = q ? foods.filter((f) => (f.name + ' ' + f.brand).toLowerCase().includes(q.toLowerCase())) : null;

  const totals = items.reduce((s, { food, grams }) => {
    const n = window.MACRO_DATA.nutritionFor(food, grams);
    return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
  }, { kcal: 0, p: 0, c: 0, f: 0 });

  const startAdding = (food) => { setAdding(food); setAddUnitIdx(0); setAddAmount(1); setQ(''); };

  const confirmAdd = () => {
    const g = addUnitIdx === -1 ? Math.max(1, +addAmount)
            : addUnitIdx === -2 ? Math.max(1, +addAmount) * 28.3495
            : Math.max(1, +addAmount) * (adding.units[addUnitIdx]?.g || 100);
    setItems((cur) => [...cur, { food: adding, grams: g, unitIndex: addUnitIdx < 0 ? -1 : addUnitIdx }]);
    setAdding(null);
  };

  const allUnits = adding ? [
    ...adding.units.map((u, i) => ({ idx: i, label: u.label })),
    { idx: -1, label: 'grams' },
    { idx: -2, label: 'ounces' },
  ] : [];

  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
              {recipe ? 'Edit' : 'New'} recipe
            </div>
            <div className="serif" style={{ fontSize: 24 }}>{name || 'Untitled'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">
          {/* Name + emoji */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, marginBottom: 14, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 6 }}>Icon</div>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)',
                display: 'grid', placeItems: 'center', fontSize: 28,
              }}>{emoji}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 6 }}>Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Recipe name..."
                style={{
                  width: '100%', background: 'var(--surface-2)', border: 0, outline: 0,
                  borderRadius: 12, padding: '13px 12px',
                  fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.01em',
                }}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} style={{
                width: 34, height: 34, borderRadius: 9, fontSize: 18,
                background: emoji === e ? 'var(--ink)' : 'var(--surface-2)',
              }}>{e}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', flex: 1 }}>Serves</span>
            <button className="icon-btn" style={{ width: 28, height: 28 }}
                    onClick={() => setServes((s) => Math.max(1, s - 1))}><Icon name="minus" size={12}/></button>
            <span className="numeric" style={{ fontSize: 22, minWidth: 24, textAlign: 'center' }}>{serves}</span>
            <button className="icon-btn" style={{ width: 28, height: 28 }}
                    onClick={() => setServes((s) => s + 1)}><Icon name="plus" size={12}/></button>
          </div>

          {items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
              {[
                { l: 'kcal', v: Math.round(totals.kcal), c: 'var(--ink)' },
                { l: 'P', v: Math.round(totals.p)+'g', c: 'var(--p-color)' },
                { l: 'C', v: Math.round(totals.c)+'g', c: 'var(--c-color)' },
                { l: 'F', v: Math.round(totals.f)+'g', c: 'var(--f-color)' },
              ].map((m) => (
                <div key={m.l} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                  <div className="numeric" style={{ fontSize: 18, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{m.l}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 8 }}>
            Ingredients ({items.length})
          </div>
          {items.map(({ food, grams, unitIndex }, i) => {
            const unit = unitIndex >= 0 && food.units[unitIndex] ? food.units[unitIndex] : null;
            const label = unit ? unit.label : `${Math.round(grams)}g`;
            const n = window.MACRO_DATA.nutritionFor(food, grams);
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div className="food-emoji">{food.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{food.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label} · {Math.round(n.kcal)} kcal</div>
                </div>
                <button onClick={() => setItems((cur) => cur.filter((_, j) => j !== i))}
                        style={{ color: 'var(--warn)', padding: 4 }}>
                  <Icon name="minus" size={14}/>
                </button>
              </div>
            );
          })}

          {!adding && (
            <div style={{ marginTop: 14 }}>
              <div className="search" style={{ boxShadow: 'inset 0 0 0 1px var(--line-2)' }}>
                <Icon name="search" size={16}/>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ingredients..."/>
              </div>
              {filtered && filtered.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No matches</div>
              )}
              {filtered && filtered.map((f) => (
                <button key={f.id} onClick={() => startAdding(f)} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'left',
                }}>
                  <div className="food-emoji">{f.emoji}</div>
                  <div>
                    <div className="food-name">{f.name}</div>
                    <div className="food-meta">{f.brand}</div>
                  </div>
                  <Icon name="plus" size={16}/>
                </button>
              ))}
            </div>
          )}

          {adding && (() => {
            const isG  = addUnitIdx === -1;
            const isOz = addUnitIdx === -2;
            const grams = isG  ? Math.max(0, +addAmount)
                        : isOz ? Math.max(0, +addAmount) * 28.3495
                        : Math.max(0, +addAmount) * (adding.units[Math.max(0, addUnitIdx)]?.g || 100);
            const n = window.MACRO_DATA.nutritionFor(adding, grams);
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: 'var(--surface-2)',
                    display: 'grid', placeItems: 'center', fontSize: 26,
                  }}>{adding.emoji}</div>
                  <div>
                    <div className="serif" style={{ fontSize: 18 }}>{adding.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{adding.brand}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {allUnits.map((u) => (
                    <button key={u.idx} className="chip"
                      onClick={() => { setAddUnitIdx(u.idx); setAddAmount(u.idx < 0 ? (u.idx === -1 ? 100 : 4) : 1); }}
                      style={{
                        background: addUnitIdx === u.idx ? 'var(--ink)' : 'var(--surface-2)',
                        color: addUnitIdx === u.idx ? 'var(--bg)' : 'var(--ink-2)',
                      }}>
                      {u.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'var(--surface-2)', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{grams.toFixed(0)} g</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="icon-btn" style={{ width: 28, height: 28 }}
                            onClick={() => setAddAmount((a) => Math.max(0, +(+a - (isG ? 10 : 0.5)).toFixed(1)))}>
                      <Icon name="minus" size={12}/>
                    </button>
                    <input type="number" value={addAmount} min="0"
                      onChange={(e) => setAddAmount(e.target.value === '' ? '' : +e.target.value)}
                      style={{
                        width: 64, textAlign: 'center', background: 'var(--surface)', border: 0, outline: 0,
                        borderRadius: 8, padding: '6px 8px', fontFamily: 'var(--serif)', fontSize: 20,
                      }}/>
                    <button className="icon-btn" style={{ width: 28, height: 28 }}
                            onClick={() => setAddAmount((a) => +(+a + (isG ? 10 : 0.5)).toFixed(1))}>
                      <Icon name="plus" size={12}/>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
                  {[
                    { l: 'kcal', v: Math.round(n.kcal), c: 'var(--ink)' },
                    { l: 'P', v: Math.round(n.p)+'g', c: 'var(--p-color)' },
                    { l: 'C', v: Math.round(n.c)+'g', c: 'var(--c-color)' },
                    { l: 'F', v: Math.round(n.f)+'g', c: 'var(--f-color)' },
                  ].map((m) => (
                    <div key={m.l} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                      <div className="numeric" style={{ fontSize: 16, color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--ink-3)' }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn ghost" onClick={() => setAdding(null)}>Back</button>
                  <button className="btn" style={{ flex: 1 }} onClick={confirmAdd}>
                    <Icon name="plus" size={14}/> Add ingredient
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="sheet-foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ flex: 1, opacity: (!name.trim() || items.length === 0) ? 0.5 : 1 }}
                  onClick={() => {
                    if (!name.trim() || items.length === 0) return;
                    onSave({
                      id: recipe?.id || ('r' + Date.now()),
                      name: name.trim(), emoji, serves,
                      items: items.map(({ food, grams, unitIndex }) => ({ foodId: food.id, grams, unitIndex })),
                    });
                    onClose();
                  }}>
            <Icon name="check" size={14}/> {recipe ? 'Save changes' : 'Create recipe'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Log-weight sheet
// ─────────────────────────────────────────────────────────────
function LogWeightSheet({ open, onClose, goal, onConfirm }) {
  const [weight, setWeight] = useState(70);
  useEffect(() => { if (open) setWeight(+(goal.currentKg || 70)); }, [open, goal]);
  if (!open) return null;

  const hasBio = goal.sex && goal.age && goal.heightCm && goal.activity;
  const diff   = +(+weight - goal.currentKg).toFixed(1);

  return (
    <>
      <div className="sheet-bg" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-grab"/>
        <div className="sheet-hd">
          <div className="serif" style={{ fontSize: 24 }}>Log weight</div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="sheet-body">
          <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 20 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 16 }}>
              Today's weight
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
              <button className="icon-btn" style={{ width: 40, height: 40 }}
                      onClick={() => setWeight((w) => Math.max(30, +(+w - 0.1).toFixed(1)))}>
                <Icon name="minus" size={16}/>
              </button>
              <input type="number" value={weight} step="0.1" min="30" max="300"
                onChange={(e) => setWeight(e.target.value === '' ? '' : +e.target.value)}
                style={{
                  width: 150, textAlign: 'center', background: 'var(--surface-2)', border: 0, outline: 0,
                  borderRadius: 16, padding: '16px 20px',
                  fontFamily: 'var(--serif)', fontSize: 48, letterSpacing: '-0.03em',
                }}/>
              <button className="icon-btn" style={{ width: 40, height: 40 }}
                      onClick={() => setWeight((w) => +(+w + 0.1).toFixed(1))}>
                <Icon name="plus" size={16}/>
              </button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8 }}>kg</div>
            {diff !== 0 && (
              <div style={{ fontSize: 13, color: diff < 0 ? 'var(--accent)' : 'var(--warn)', marginTop: 8 }}>
                {diff < 0 ? `↓ ${Math.abs(diff)} kg since last entry` : `↑ ${diff} kg since last entry`}
              </div>
            )}
          </div>
        </div>
        <div className="sheet-foot" style={{ flexDirection: 'column', gap: 8 }}>
          {hasBio ? (
            <>
              <button className="btn" style={{ width: '100%' }}
                      onClick={() => { onConfirm(+weight, true); onClose(); }}>
                Log weight & update goal
              </button>
              <button style={{ fontSize: 13, color: 'var(--ink-3)', padding: '4px 0', textAlign: 'center' }}
                      onClick={() => { onConfirm(+weight, false); onClose(); }}>
                Just log the weight
              </button>
            </>
          ) : (
            <button className="btn" style={{ width: '100%' }}
                    onClick={() => { onConfirm(+weight, false); onClose(); }}>
              Log weight
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Export to window
Object.assign(window, {
  Icon, CalorieRing, MacroBars, MacroDonut, WeightChart, StepBars,
  QuickLog, MealSection, AddFoodSheet, GoalSheet,
  SettingsSheet, ProfileSheet, OnboardingSheet, calcGoal,
  EditProfileSheet, RecipeEditorSheet, LogWeightSheet,
});
