// AddFoodSheet.js — RN port of the web `AddFoodSheet` (web/screens.jsx). Two
// stages inside one bottom sheet: (1) pick a food (frequent list or search),
// (2) choose a unit + amount and confirm. Grams math and the -1/-2 custom
// grams/ounces unit codes match the web exactly so logged entries are portable.
//
// Reads/writes through MacroData context: it's rendered once, globally, and
// driven by `addOpen`/`addMeal` (opened by the tab-bar FAB or a meal's "add").
// Barcode scanning is a fast-follow (expo-camera) — search only for now.
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Text, TextInput } from '../ui/type';
import { nutritionFor } from '@macro/core/data';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import Sheet from './Sheet';
import Icon from './Icon';
import { useMacroData, getRecipeItems } from '../state/MacroData';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const OZ_TO_G = 28.3495;

function recipeTotals(items) {
  return items.reduce(
    (s, { food, grams }) => {
      const n = nutritionFor(food, grams);
      return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
}

function gramsFor(picked, unitIndex, amount) {
  const a = Math.max(0, +amount || 0);
  if (unitIndex === -1) return a; // custom grams
  if (unitIndex === -2) return a * OZ_TO_G; // custom ounces
  return a * picked.units[unitIndex].g;
}

export default function AddFoodSheet() {
  const { addOpen, addMeal, closeAdd, addFood, logRecipe, foods, frequent, recipes } =
    useMacroData();

  const [q, setQ] = useState('');
  const [tab, setTab] = useState('foods'); // 'foods' | 'recipes'
  const [meal, setMeal] = useState('breakfast');
  const [picked, setPicked] = useState(null);
  const [unitIndex, setUnitIndex] = useState(0); // -1 = grams, -2 = ounces
  const [amount, setAmount] = useState('1');

  // Reset every time the sheet opens.
  useEffect(() => {
    if (addOpen) {
      setQ('');
      setTab('foods');
      setPicked(null);
      setUnitIndex(0);
      setAmount('1');
      setMeal(addMeal || 'breakfast');
    }
  }, [addOpen, addMeal]);

  // Reset the amount when a new food is picked.
  useEffect(() => {
    if (picked) {
      setUnitIndex(0);
      setAmount('1');
    }
  }, [picked]);

  const filtered = useMemo(() => {
    if (!q) return null;
    const needle = q.toLowerCase();
    return foods.filter((f) =>
      (f.name + ' ' + f.brand).toLowerCase().includes(needle)
    );
  }, [q, foods]);

  const confirm = () => {
    const grams = gramsFor(picked, unitIndex, amount);
    const storedIdx = unitIndex < 0 ? -1 : unitIndex;
    addFood(picked, grams, storedIdx, meal);
    closeAdd();
  };

  const logThisRecipe = (recipe) => {
    logRecipe(recipe, meal);
    closeAdd();
  };

  const footer = picked ? (
    <>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setPicked(null)}>
        <Text style={styles.btnGhostText}>Back</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnPrimary, styles.btnFlex]} onPress={confirm}>
        <Icon name="check" size={14} color={colors.bg} />
        <Text style={styles.btnPrimaryText}>Add to {meal}</Text>
      </Pressable>
    </>
  ) : (
    <Pressable style={[styles.btn, styles.btnGhost, styles.btnFlex]} onPress={closeAdd}>
      <Text style={styles.btnGhostText}>Cancel</Text>
    </Pressable>
  );

  return (
    <Sheet visible={addOpen} onClose={closeAdd} title="Add food" footer={footer}>
      {/* Meal selector */}
      <Text style={styles.eyebrow}>Log to</Text>
      <View style={styles.chipRow}>
        {MEALS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setMeal(m)}
            style={[styles.chip, meal === m ? styles.chipOn : styles.chipOff]}
          >
            <Text style={meal === m ? styles.chipOnText : styles.chipOffText}>{m}</Text>
          </Pressable>
        ))}
      </View>

      {/* Foods / Recipes toggle */}
      {!picked && (
        <View style={styles.segmented}>
          {[
            { k: 'foods', label: 'Foods' },
            { k: 'recipes', label: 'Recipes' },
          ].map((t) => (
            <Pressable
              key={t.k}
              onPress={() => setTab(t.k)}
              style={[styles.segment, tab === t.k && styles.segmentOn]}
            >
              <Text style={tab === t.k ? styles.segmentOnText : styles.segmentText}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {picked ? (
        <PickedFood
          picked={picked}
          unitIndex={unitIndex}
          setUnitIndex={setUnitIndex}
          amount={amount}
          setAmount={setAmount}
        />
      ) : tab === 'foods' ? (
        <>
          <View style={styles.search}>
            <Icon name="search" size={16} color={colors.ink3} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search foods or brands…"
              placeholderTextColor={colors.ink3}
              autoCapitalize="none"
              style={styles.searchInput}
            />
          </View>

          {!q && <Text style={styles.eyebrow}>Frequent</Text>}
          {(filtered ?? frequent).map((f) => {
            const n = nutritionFor(f, f.units[0].g);
            return (
              <Pressable key={f.id} style={styles.foodRow} onPress={() => setPicked(f)}>
                <Text style={styles.foodEmoji}>{f.emoji}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Text style={styles.foodMeta}>
                    {f.brand} · {f.units[0].label}
                  </Text>
                </View>
                <Text style={styles.foodKcal}>{Math.round(n.kcal)} kcal</Text>
                <Icon name="plus" size={16} color={colors.ink3} />
              </Pressable>
            );
          })}
          {filtered && filtered.length === 0 && (
            <Text style={styles.empty}>No matches for “{q}”.</Text>
          )}
        </>
      ) : recipes.length === 0 ? (
        <Text style={styles.empty}>
          No recipes yet. Build one in the Recipes tab, then log it here in a tap.
        </Text>
      ) : (
        recipes.map((r) => {
          const items = getRecipeItems(r, foods);
          const tot = recipeTotals(items);
          return (
            <Pressable key={r.id} style={styles.foodRow} onPress={() => logThisRecipe(r)}>
              <Text style={styles.foodEmoji}>{r.emoji}</Text>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={styles.foodMeta} numberOfLines={1}>
                  {items.length} ingredients · serves {r.serves}
                </Text>
              </View>
              <Text style={styles.foodKcal}>{Math.round(tot.kcal)} kcal</Text>
              <Icon name="plus" size={16} color={colors.ink3} />
            </Pressable>
          );
        })
      )}
    </Sheet>
  );
}

function PickedFood({ picked, unitIndex, setUnitIndex, amount, setAmount }) {
  const isCustomG = unitIndex === -1;
  const isCustomOz = unitIndex === -2;
  const grams = gramsFor(picked, unitIndex, amount);
  const n = nutritionFor(picked, grams);
  const step = isCustomG ? 10 : isCustomOz ? 0.5 : 0.25;

  const allUnits = [
    ...picked.units.map((u, i) => ({ idx: i, label: u.label })),
    { idx: -1, label: 'grams' },
    { idx: -2, label: 'ounces' },
  ];
  const presets = isCustomG ? [50, 100, 150, 200, 250] : isCustomOz ? [2, 3, 4, 6, 8] : [0.5, 1, 1.5, 2];

  const bump = (delta) =>
    setAmount((a) => String(Math.max(0, +(+(a || 0) + delta).toFixed(2))));

  const macroTiles = [
    { label: 'kcal', v: Math.round(n.kcal), color: colors.ink },
    { label: 'P', v: `${Math.round(n.p)}g`, color: colors.pColor },
    { label: 'C', v: `${Math.round(n.c)}g`, color: colors.cColor },
    { label: 'F', v: `${Math.round(n.f)}g`, color: colors.fColor },
  ];

  return (
    <View>
      <View style={styles.pickedHead}>
        <View style={styles.pickedEmojiWrap}>
          <Text style={styles.pickedEmoji}>{picked.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pickedName}>{picked.name}</Text>
          <Text style={styles.pickedMeta}>
            {picked.brand} · {picked.per100.kcal} kcal / 100g
          </Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>Unit</Text>
      <View style={styles.chipRow}>
        {allUnits.map((u) => (
          <Pressable
            key={u.idx}
            onPress={() => {
              setUnitIndex(u.idx);
              setAmount(u.idx === -1 ? '100' : u.idx === -2 ? '4' : '1');
            }}
            style={[styles.chip, unitIndex === u.idx ? styles.chipOn : styles.chipOff]}
          >
            <Text style={unitIndex === u.idx ? styles.chipOnText : styles.chipOffText}>
              {u.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.amountBox}>
        <View>
          <Text style={styles.eyebrow}>
            {isCustomG ? 'Grams' : isCustomOz ? 'Ounces' : 'Servings'}
          </Text>
          <Text style={styles.amountSub}>= {grams.toFixed(grams < 10 ? 1 : 0)} g</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => bump(-step)} hitSlop={6}>
            <Icon name="minus" size={14} color={colors.ink} />
          </Pressable>
          <TextInput
            value={String(amount)}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
          <Pressable style={styles.stepBtn} onPress={() => bump(step)} hitSlop={6}>
            <Icon name="plus" size={14} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.macroGrid}>
        {macroTiles.map((m) => (
          <View key={m.label} style={styles.macroTile}>
            <Text style={[styles.macroValue, { color: m.color }]}>{m.v}</Text>
            <Text style={styles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.presetRow}>
        {presets.map((v) => (
          <Pressable key={v} style={styles.preset} onPress={() => setAmount(String(v))}>
            <Text style={styles.presetText}>
              {v}
              {isCustomG ? 'g' : isCustomOz ? 'oz' : '×'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.ink3,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },

  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  segmentOn: { backgroundColor: colors.surface },
  segmentText: { fontSize: 13, color: colors.ink3, fontWeight: '500' },
  segmentOnText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.pill },
  chipOn: { backgroundColor: colors.ink },
  chipOff: { backgroundColor: colors.surface2 },
  chipOnText: { color: colors.bg, fontSize: 13, textTransform: 'capitalize' },
  chipOffText: { color: colors.ink2, fontSize: 13, textTransform: 'capitalize' },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: fontSizes.base, color: colors.ink, padding: 0 },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  foodEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  foodMeta: { fontSize: 12, color: colors.ink3, marginTop: 1 },
  foodKcal: { fontSize: 13, color: colors.ink3 },
  empty: { paddingVertical: 40, textAlign: 'center', color: colors.ink3 },

  pickedHead: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 18 },
  pickedEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedEmoji: { fontSize: 32 },
  pickedName: { fontSize: 22, fontFamily: fonts.serifMedium, color: colors.ink },
  pickedMeta: { fontSize: 13, color: colors.ink3, marginTop: 2 },

  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
  },
  amountSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    minWidth: 64,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 22,
    fontFamily: fonts.serifMedium,
    color: colors.ink,
  },

  macroGrid: { flexDirection: 'row', gap: 8, marginTop: 16 },
  macroTile: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  macroValue: { fontSize: 22, fontFamily: fonts.serifMedium },
  macroLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  preset: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
  },
  presetText: { color: colors.ink2, fontSize: 13 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingVertical: 13,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  btnFlex: { flex: 1 },
  btnPrimary: { backgroundColor: colors.ink },
  btnPrimaryText: { color: colors.bg, fontWeight: '600', fontSize: fontSizes.base },
  btnGhost: { backgroundColor: colors.surface2 },
  btnGhostText: { color: colors.ink2, fontWeight: '500', fontSize: fontSizes.base },
});
