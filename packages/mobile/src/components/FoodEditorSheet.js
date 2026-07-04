// FoodEditorSheet — create or edit a food's nutritional values. Mobile-only
// surface (the web app's FOODS database is read-only): used by the add-food
// flow's "New food" tile, the barcode-scan flow (prefilled from Open Food
// Facts), and the edit pencil on a picked food.
//
// Saving goes through MacroData.saveFood: a built-in FOODS id becomes a
// per-user override ("fix everywhere"), anything else is upserted into the
// user's customFoods. Deleting a custom food removes it; "deleting" an
// overridden built-in resets it to the shipped values.
import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, TextInput } from '../ui/type';
import { FOODS } from '@macro/core/data';
import { colors, radii, fontSizes, fonts } from '@macro/core/theme';
import Sheet from './Sheet';
import Icon from './Icon';

const num = (s) => Math.max(0, +String(s).replace(/[^0-9.]/g, '') || 0);

export default function FoodEditorSheet({
  visible,
  onClose,
  food = null, // existing food being edited (built-in or custom), or null
  initial = null, // prefill for a new food (barcode scan): { name, brand, per100, units, barcode }
  onSave,
  onDelete,
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [units, setUnits] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newGrams, setNewGrams] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isBuiltIn = !!food && FOODS.some((x) => x.id === food.id);
  const isEdit = !!food;

  useEffect(() => {
    if (!visible) return;
    const src = food || initial;
    setName(src?.name || '');
    setBrand(src?.brand || '');
    setEmoji(src?.emoji || (initial?.barcode ? '📦' : '🍽️'));
    setKcal(src?.per100 ? String(src.per100.kcal) : '');
    setP(src?.per100 ? String(src.per100.p) : '');
    setC(src?.per100 ? String(src.per100.c) : '');
    setF(src?.per100 ? String(src.per100.f) : '');
    setUnits(src?.units ? src.units.map((u) => ({ ...u })) : []);
    setNewLabel('');
    setNewGrams('');
    setConfirmDelete(false);
  }, [visible, food, initial]);

  const canSave = name.trim().length > 0 && String(kcal).trim().length > 0;

  const addUnit = () => {
    const g = num(newGrams);
    if (!newLabel.trim() || g <= 0) return;
    setUnits((cur) => [...cur, { label: newLabel.trim(), g }]);
    setNewLabel('');
    setNewGrams('');
  };

  const save = () => {
    if (!canSave) return;
    const saved = {
      ...(food?.barcode || initial?.barcode
        ? { barcode: food?.barcode || initial.barcode }
        : {}),
      id: food?.id || 'cf' + Date.now(),
      name: name.trim(),
      brand: brand.trim() || 'Custom',
      emoji: emoji.trim() || '🍽️',
      per100: { kcal: num(kcal), p: num(p), c: num(c), f: num(f) },
      units: units.length ? units : [{ label: '100 g', g: 100 }],
    };
    onSave(saved);
    onClose();
  };

  const footer = (
    <>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
        <Text style={styles.btnGhostText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnPrimary, styles.btnFlex, !canSave && styles.btnOff]}
        disabled={!canSave}
        onPress={save}
      >
        <Icon name="check" size={14} color={colors.bg} />
        <Text style={styles.btnPrimaryText}>{isEdit ? 'Save changes' : 'Save food'}</Text>
      </Pressable>
    </>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit food' : 'New food'}
      footer={footer}
      fullScreen
    >
      {isBuiltIn && (
        <Text style={styles.note}>
          Editing a built-in food — your changes apply everywhere it appears,
          including past days and recipes.
        </Text>
      )}

      {/* Icon + name */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Icon</Text>
          <TextInput
            value={emoji}
            onChangeText={(t) => setEmoji(t.slice(-4))}
            style={styles.emojiInput}
            textAlign="center"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Food name…"
            placeholderTextColor={colors.ink3}
            style={styles.nameInput}
          />
        </View>
      </View>

      <Text style={styles.label}>Brand / note (optional)</Text>
      <TextInput
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g. FairPrice, homemade…"
        placeholderTextColor={colors.ink3}
        style={styles.input}
      />

      {/* Per-100g macros */}
      <Text style={[styles.label, { marginTop: 18 }]}>Nutrition per 100 g</Text>
      <View style={styles.macroRow}>
        {[
          { l: 'kcal', v: kcal, set: setKcal, c: colors.ink },
          { l: 'Protein g', v: p, set: setP, c: colors.pColor },
          { l: 'Carbs g', v: c, set: setC, c: colors.cColor },
          { l: 'Fat g', v: f, set: setF, c: colors.fColor },
        ].map((m) => (
          <View key={m.l} style={styles.macroCell}>
            <TextInput
              value={m.v}
              onChangeText={(t) => m.set(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.ink3}
              style={[styles.macroInput, { color: m.c }]}
              textAlign="center"
            />
            <Text style={styles.macroCellLabel}>{m.l}</Text>
          </View>
        ))}
      </View>

      {/* Serving sizes */}
      <Text style={[styles.label, { marginTop: 18 }]}>Serving sizes</Text>
      {units.map((u, i) => (
        <View key={i} style={styles.unitRow}>
          <Text style={styles.unitLabel}>{u.label}</Text>
          <Text style={styles.unitGrams}>{u.g} g</Text>
          <Pressable
            onPress={() => setUnits((cur) => cur.filter((_, j) => j !== i))}
            hitSlop={6}
            style={styles.unitRemove}
          >
            <Icon name="minus" size={14} color={colors.warn} />
          </Pressable>
        </View>
      ))}
      <View style={styles.newUnitRow}>
        <TextInput
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder="e.g. 1 bowl"
          placeholderTextColor={colors.ink3}
          style={[styles.input, styles.flex1, styles.newUnitInput]}
        />
        <TextInput
          value={newGrams}
          onChangeText={(t) => setNewGrams(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="grams"
          placeholderTextColor={colors.ink3}
          style={[styles.input, styles.newUnitGrams]}
          textAlign="center"
        />
        <Pressable style={styles.addUnitBtn} onPress={addUnit} hitSlop={6}>
          <Icon name="plus" size={16} color={colors.bg} />
        </Pressable>
      </View>
      {units.length === 0 && (
        <Text style={styles.hint}>No serving sizes yet — "100 g" is used by default.</Text>
      )}

      {/* Delete / reset */}
      {isEdit && (onDelete || isBuiltIn) && (
        <View style={styles.dangerWrap}>
          {!confirmDelete ? (
            <Pressable onPress={() => setConfirmDelete(true)}>
              <Text style={styles.dangerText}>
                {isBuiltIn ? 'Reset to original values' : 'Delete this food'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>
                {isBuiltIn ? 'Reset this food?' : 'Delete permanently?'}
              </Text>
              <Pressable
                style={[styles.btn, styles.btnGhost, styles.btnSmall]}
                onPress={() => setConfirmDelete(false)}
              >
                <Text style={styles.btnGhostText}>Keep</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnDanger, styles.btnSmall]}
                onPress={() => {
                  onDelete?.(food.id);
                  onClose();
                }}
              >
                <Text style={styles.btnPrimaryText}>
                  {isBuiltIn ? 'Reset' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  note: {
    fontSize: 12,
    color: colors.ink3,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 16,
    lineHeight: 17,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.ink3,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 14 },
  emojiInput: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    fontSize: 26,
    color: colors.ink,
    padding: 0,
  },
  nameInput: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontSize: 18,
    fontFamily: fonts.serifMedium,
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroCell: { flex: 1 },
  macroInput: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: fonts.serifMedium,
  },
  macroCellLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: 4,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  unitLabel: { flex: 1, fontSize: 13, color: colors.ink, fontWeight: '500' },
  unitGrams: { fontSize: 12, color: colors.ink3 },
  unitRemove: { padding: 4 },
  newUnitRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  newUnitInput: {},
  newUnitGrams: { width: 84 },
  addUnitBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12, color: colors.ink3, marginTop: 8 },

  dangerWrap: { marginTop: 26, alignItems: 'center' },
  dangerText: { color: colors.warn, fontSize: 13, fontWeight: '500', padding: 8 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmText: { fontSize: 13, color: colors.ink2, marginRight: 4 },

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
  btnSmall: { paddingVertical: 9, paddingHorizontal: 16, minHeight: 38 },
  btnOff: { opacity: 0.5 },
  btnPrimary: { backgroundColor: colors.ink },
  btnDanger: { backgroundColor: colors.warn },
  btnPrimaryText: { color: colors.bg, fontWeight: '600', fontSize: fontSizes.base },
  btnGhost: { backgroundColor: colors.surface2 },
  btnGhostText: { color: colors.ink2, fontWeight: '500', fontSize: fontSizes.base },
});
