// RecipeEditorSheet — RN port of the web `RecipeEditorSheet` (web/screens.jsx):
// create or edit a recipe. Name + emoji, a serves stepper, live totals, an
// ingredient list (remove), and an inline add-ingredient flow (search → pick a
// unit + amount, preview macros, confirm). Saves items in the newer
// {foodId,grams,unitIndex}[] shape; loads either legacy or new shape.
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const OZ_TO_G = 28.3495;

function MacroTiles({ n, big }) {
  const tiles = [
    { l: 'kcal', v: Math.round(n.kcal), c: colors.ink },
    { l: 'P', v: Math.round(n.p) + 'g', c: colors.pColor },
    { l: 'C', v: Math.round(n.c) + 'g', c: colors.cColor },
    { l: 'F', v: Math.round(n.f) + 'g', c: colors.fColor },
  ];
  return (
    <View style={styles.tileRow}>
      {tiles.map((m) => (
        <View key={m.l} style={styles.tile}>
          <Text style={[styles.tileVal, big && styles.tileValBig, { color: m.c }]}>{m.v}</Text>
          <Text style={styles.tileLabel}>{m.l}</Text>
        </View>
      ))}
    </View>
  );
}

export default function RecipeEditorSheet({ visible, onClose, recipe, foods, onSave }) {
  const [name, setName] = useState('');
  const [serves, setServes] = useState(1);
  const [items, setItems] = useState([]); // [{ food, grams, unitIndex }]
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(null); // food being added
  const [addUnitIdx, setAddUnitIdx] = useState(0);
  const [addAmount, setAddAmount] = useState('1');

  // Scroll the ingredient search to the top of the sheet when focused so the
  // keyboard never hides the first results.
  const scrollRef = useRef(null);
  const searchY = useRef(0);

  useEffect(() => {
    if (!visible) return;
    if (recipe) {
      setName(recipe.name || '');
      setServes(recipe.serves || 1);
      const loaded = (recipe.items || [])
        .map((item) => {
          const foodId = typeof item === 'string' ? item : item.foodId;
          const food = foods.find((f) => f.id === foodId);
          if (!food) return null;
          const grams = typeof item === 'string' ? food.units[0].g : item.grams;
          const unitIndex = typeof item === 'string' ? 0 : item.unitIndex || 0;
          return { food, grams, unitIndex };
        })
        .filter(Boolean);
      setItems(loaded);
    } else {
      setName('');
      setServes(1);
      setItems([]);
    }
    setQ('');
    setAdding(null);
  }, [visible, recipe, foods]);

  const filtered = useMemo(
    () =>
      q
        ? foods.filter((f) => (f.name + ' ' + f.brand).toLowerCase().includes(q.toLowerCase()))
        : null,
    [q, foods]
  );

  // The recipe icon is derived from its first ingredient rather than picked by
  // hand — one less redundant step. Falls back to a saved emoji or a plate.
  const emoji = items[0]?.food.emoji || recipe?.emoji || '🍽️';

  const totals = items.reduce(
    (s, { food, grams }) => {
      const n = nutritionFor(food, grams);
      return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  const startAdding = (food) => {
    setAdding(food);
    setAddUnitIdx(0);
    setAddAmount('1');
    setQ('');
  };

  const isG = addUnitIdx === -1;
  const isOz = addUnitIdx === -2;
  const addGrams = adding
    ? isG
      ? Math.max(0, +addAmount || 0)
      : isOz
      ? Math.max(0, +addAmount || 0) * OZ_TO_G
      : Math.max(0, +addAmount || 0) * (adding.units[Math.max(0, addUnitIdx)]?.g || 100)
    : 0;

  const confirmAdd = () => {
    const g = Math.max(1, addGrams);
    setItems((cur) => [
      ...cur,
      { food: adding, grams: g, unitIndex: addUnitIdx < 0 ? -1 : addUnitIdx },
    ]);
    setAdding(null);
  };

  const allUnits = adding
    ? [
        ...adding.units.map((u, i) => ({ idx: i, label: u.label })),
        { idx: -1, label: 'grams' },
        { idx: -2, label: 'ounces' },
      ]
    : [];

  const canSave = name.trim() && items.length > 0;

  const footer = (
    <>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
        <Text style={styles.btnGhostText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnPrimary, styles.btnFlex, !canSave && styles.btnOff]}
        disabled={!canSave}
        onPress={() => {
          if (!canSave) return;
          onSave({
            id: recipe?.id || 'r' + Date.now(),
            name: name.trim(),
            emoji,
            serves,
            items: items.map(({ food, grams, unitIndex }) => ({
              foodId: food.id,
              grams,
              unitIndex,
            })),
          });
          onClose();
        }}
      >
        <Icon name="check" size={14} color={colors.bg} />
        <Text style={styles.btnPrimaryText}>{recipe ? 'Save changes' : 'Create recipe'}</Text>
      </Pressable>
    </>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={recipe ? 'Edit recipe' : 'New recipe'}
      footer={footer}
      fullScreen
      scrollRef={scrollRef}
    >
      {/* Name — the icon is auto-derived from the first ingredient */}
      <View style={styles.nameRow}>
        <View>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconPreview}>
            <Text style={styles.iconPreviewText}>{emoji}</Text>
          </View>
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Recipe name…"
            placeholderTextColor={colors.ink3}
            style={styles.nameInput}
          />
        </View>
      </View>

      <View style={styles.servesRow}>
        <Text style={styles.servesLabel}>Serves</Text>
        <Pressable
          style={styles.miniBtn}
          onPress={() => setServes((s) => Math.max(1, s - 1))}
          hitSlop={6}
        >
          <Icon name="minus" size={12} color={colors.ink} />
        </Pressable>
        <Text style={styles.servesNum}>{serves}</Text>
        <Pressable style={styles.miniBtn} onPress={() => setServes((s) => s + 1)} hitSlop={6}>
          <Icon name="plus" size={12} color={colors.ink} />
        </Pressable>
      </View>

      {items.length > 0 && (
        <View style={styles.totalsWrap}>
          <MacroTiles n={totals} />
        </View>
      )}

      <Text style={styles.label}>Ingredients ({items.length})</Text>
      {items.map(({ food, grams, unitIndex }, i) => {
        const unit = unitIndex >= 0 && food.units[unitIndex] ? food.units[unitIndex] : null;
        const unitLabel = unit ? unit.label : `${Math.round(grams)}g`;
        const n = nutritionFor(food, grams);
        return (
          <View key={i} style={styles.ingRow}>
            <Text style={styles.ingEmoji}>{food.emoji}</Text>
            <View style={styles.flex1}>
              <Text style={styles.ingName}>{food.name}</Text>
              <Text style={styles.ingMeta}>
                {unitLabel} · {Math.round(n.kcal)} kcal
              </Text>
            </View>
            <Pressable
              onPress={() => setItems((cur) => cur.filter((_, j) => j !== i))}
              hitSlop={6}
              style={styles.ingRemove}
            >
              <Icon name="minus" size={14} color={colors.warn} />
            </Pressable>
          </View>
        );
      })}

      {!adding ? (
        <View
          style={styles.addWrap}
          onLayout={(e) => {
            searchY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.search}>
            <Icon name="search" size={16} color={colors.ink3} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search ingredients…"
              placeholderTextColor={colors.ink3}
              autoCapitalize="none"
              style={styles.searchInput}
              onFocus={() =>
                scrollRef.current?.scrollTo({
                  y: Math.max(0, searchY.current + 4),
                  animated: true,
                })
              }
            />
          </View>
          {filtered && filtered.length === 0 && (
            <Text style={styles.noMatch}>No matches</Text>
          )}
          {filtered &&
            filtered.map((f) => (
              <Pressable key={f.id} style={styles.searchRow} onPress={() => startAdding(f)}>
                <Text style={styles.ingEmoji}>{f.emoji}</Text>
                <View style={styles.flex1}>
                  <Text style={styles.ingName}>{f.name}</Text>
                  <Text style={styles.ingMeta}>{f.brand}</Text>
                </View>
                <Icon name="plus" size={16} color={colors.ink3} />
              </Pressable>
            ))}
        </View>
      ) : (
        <View style={styles.addWrap}>
          <View style={styles.addingHead}>
            <View style={styles.addingEmojiWrap}>
              <Text style={styles.addingEmoji}>{adding.emoji}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.addingName}>{adding.name}</Text>
              <Text style={styles.ingMeta}>{adding.brand}</Text>
            </View>
          </View>

          <View style={styles.chipWrap}>
            {allUnits.map((u) => {
              const on = addUnitIdx === u.idx;
              return (
                <Pressable
                  key={u.idx}
                  onPress={() => {
                    setAddUnitIdx(u.idx);
                    setAddAmount(u.idx === -1 ? '100' : u.idx === -2 ? '4' : '1');
                  }}
                  style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                >
                  <Text style={on ? styles.chipOnText : styles.chipOffText}>{u.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountG}>{addGrams.toFixed(0)} g</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.miniBtn}
                onPress={() =>
                  setAddAmount((a) =>
                    String(Math.max(0, +(+(a || 0) - (isG ? 10 : 0.5)).toFixed(1)))
                  )
                }
                hitSlop={6}
              >
                <Icon name="minus" size={12} color={colors.ink} />
              </Pressable>
              <TextInput
                value={String(addAmount)}
                onChangeText={(t) => setAddAmount(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
              <Pressable
                style={styles.miniBtn}
                onPress={() =>
                  setAddAmount((a) => String(+(+(a || 0) + (isG ? 10 : 0.5)).toFixed(1)))
                }
                hitSlop={6}
              >
                <Icon name="plus" size={12} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.totalsWrap}>
            <MacroTiles n={nutritionFor(adding, addGrams)} />
          </View>

          <View style={styles.addBtnRow}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setAdding(null)}>
              <Text style={styles.btnGhostText}>Back</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, styles.btnFlex]}
              onPress={confirmAdd}
            >
              <Icon name="plus" size={14} color={colors.bg} />
              <Text style={styles.btnPrimaryText}>Add ingredient</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.ink3,
    marginBottom: 6,
  },
  nameRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 14 },
  iconPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPreviewText: { fontSize: 28 },
  nameInput: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontSize: 18,
    fontFamily: fonts.serifMedium,
    color: colors.ink,
  },
  servesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  servesLabel: { fontSize: 13, color: colors.ink3, flex: 1 },
  servesNum: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 24,
    textAlign: 'center',
  },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsWrap: { marginBottom: 18 },
  tileRow: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tileVal: { fontSize: 18, fontFamily: fonts.serifMedium },
  tileValBig: { fontSize: 22 },
  tileLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  ingEmoji: { fontSize: 20, width: 36, textAlign: 'center' },
  ingName: { fontSize: 13, fontWeight: '500', color: colors.ink },
  ingMeta: { fontSize: 11, color: colors.ink3, marginTop: 1 },
  ingRemove: { padding: 4 },

  addWrap: { marginTop: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
  },
  searchInput: { flex: 1, fontSize: fontSizes.base, color: colors.ink, padding: 0 },
  noMatch: { paddingVertical: 20, textAlign: 'center', color: colors.ink3, fontSize: 13 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },

  addingHead: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14 },
  addingEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addingEmoji: { fontSize: 26 },
  addingName: { fontSize: 18, fontFamily: fonts.serifMedium, color: colors.ink },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.pill },
  chipOn: { backgroundColor: colors.ink },
  chipOff: { backgroundColor: colors.surface2 },
  chipOnText: { color: colors.bg, fontSize: 13 },
  chipOffText: { color: colors.ink2, fontSize: 13 },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    marginBottom: 12,
  },
  amountG: { fontSize: 12, color: colors.ink3 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountInput: {
    width: 64,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 20,
    fontFamily: fonts.serifMedium,
    color: colors.ink,
  },
  addBtnRow: { flexDirection: 'row', gap: 8 },

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
  btnOff: { opacity: 0.5 },
  btnPrimary: { backgroundColor: colors.ink },
  btnPrimaryText: { color: colors.bg, fontWeight: '600', fontSize: fontSizes.base },
  btnGhost: { backgroundColor: colors.surface2 },
  btnGhostText: { color: colors.ink2, fontWeight: '500', fontSize: fontSizes.base },
});
