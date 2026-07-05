// EditProfileSheet — RN port of the web `EditProfileSheet` (web/screens.jsx):
// capture body stats + goal (sex, age, height, current/target weight, activity,
// mode, rate), preview the calculated daily target with @macro/core calcGoal,
// and save the recomputed goal. Also serves as first-run goal setup.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, TextInput } from '../ui/type';
import { calcGoal } from '@macro/core/data';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import Sheet from './Sheet';
import Icon from './Icon';

const ACTIVITY = [
  { v: 'sedentary', l: 'Sedentary', s: 'Desk job, little exercise' },
  { v: 'light', l: 'Light', s: '1–3 workouts / week' },
  { v: 'moderate', l: 'Moderate', s: '3–5 workouts / week' },
  { v: 'active', l: 'Active', s: '6–7 workouts / week' },
  { v: 'very-active', l: 'Very active', s: 'Hard exercise or physical job' },
];

const MODES = [
  { id: 'lose', label: 'Lose', hint: 'weight' },
  { id: 'maintain', label: 'Maintain', hint: 'steady' },
  { id: 'gain', label: 'Gain', hint: 'weight' },
];

function NumField({ label, value, suffix, onChange }) {
  const [str, setStr] = useState(String(value ?? ''));
  useEffect(() => {
    setStr(String(value ?? ''));
  }, [value]);
  return (
    <View style={styles.numField}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numInputRow}>
        <TextInput
          value={str}
          onChangeText={(s) => {
            const clean = s.replace(/[^0-9.]/g, '');
            setStr(clean);
            const n = parseFloat(clean);
            if (Number.isFinite(n) && n > 0) onChange(n);
          }}
          keyboardType="decimal-pad"
          style={styles.numInput}
        />
        <Text style={styles.numSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

export default function EditProfileSheet({ visible, onClose, goal, onSave }) {
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState(28);
  const [heightCm, setHeightCm] = useState(175);
  const [currentKg, setCurrentKg] = useState(75);
  const [targetKg, setTargetKg] = useState(70);
  const [activity, setActivity] = useState('moderate');
  const [mode, setMode] = useState('maintain');
  const [rate, setRate] = useState(0.5);

  useEffect(() => {
    if (!visible) return;
    setSex(goal.sex || 'male');
    setAge(goal.age || 28);
    setHeightCm(goal.heightCm || 175);
    setCurrentKg(goal.currentKg || 75);
    setTargetKg(goal.weightKg || 70);
    setActivity(goal.activity || 'moderate');
    setMode(goal.mode || 'maintain');
    setRate(goal.rate || 0.5);
  }, [visible, goal]);

  const calculated = useMemo(
    () =>
      calcGoal({
        sex,
        age: +age,
        heightCm: +heightCm,
        currentKg: +currentKg,
        targetKg: +targetKg,
        activity,
        mode,
        rate,
      }),
    [sex, age, heightCm, currentKg, targetKg, activity, mode, rate]
  );

  const footer = (
    <>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
        <Text style={styles.btnGhostText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnPrimary, styles.btnFlex]}
        onPress={() => {
          onSave({
            ...goal,
            ...calculated,
            // calcGoal only returns the derived targets (kcal/macros) plus
            // weight fields — it does NOT echo back the biometric inputs, so
            // carry the edited ones through explicitly or they revert to the
            // previous goal's values on the next open.
            sex,
            age: +age,
            heightCm: +heightCm,
            activity,
            startKg: goal.startKg,
            streak: goal.streak,
            onboarded: true,
          });
          onClose();
        }}
      >
        <Text style={styles.btnPrimaryText}>Save changes</Text>
      </Pressable>
    </>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Edit profile" footer={footer}>
      <Text style={styles.eyebrow}>Sex</Text>
      <View style={styles.sexRow}>
        {['male', 'female'].map((s) => {
          const on = sex === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSex(s)}
              style={[styles.sexChip, on ? styles.chipOn : styles.chipOff]}
            >
              <Text style={on ? styles.chipOnText : styles.chipOffText}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.pairRow}>
        <NumField label="Age" value={age} suffix="yrs" onChange={setAge} />
        <NumField label="Height" value={heightCm} suffix="cm" onChange={setHeightCm} />
      </View>
      <View style={styles.pairRow}>
        <NumField label="Current weight" value={currentKg} suffix="kg" onChange={setCurrentKg} />
        <NumField label="Target weight" value={targetKg} suffix="kg" onChange={setTargetKg} />
      </View>

      <Text style={styles.eyebrow}>Activity level</Text>
      <View style={styles.activityWrap}>
        {ACTIVITY.map(({ v, l, s }) => {
          const on = activity === v;
          return (
            <Pressable
              key={v}
              onPress={() => setActivity(v)}
              style={[styles.activityRow, on ? styles.activityOn : styles.activityOff]}
            >
              <View style={styles.flex1}>
                <Text style={[styles.activityLabel, on && styles.onText]}>{l}</Text>
                <Text style={[styles.activitySub, on && styles.onSubText]}>{s}</Text>
              </View>
              {on && <Icon name="check" size={15} color={colors.bg} />}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.eyebrow}>Goal</Text>
      <View style={styles.modeRow}>
        {MODES.map((m) => {
          const on = mode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setMode(m.id)}
              style={[styles.modeChip, on ? styles.chipOn : styles.chipOff]}
            >
              <Text style={[styles.modeLabel, on && styles.onText]}>{m.label}</Text>
              <Text style={[styles.modeHint, on && styles.onSubText]}>{m.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode !== 'maintain' && (
        <>
          <Text style={styles.eyebrow}>Rate of change</Text>
          <View style={styles.rateRow}>
            {[0.25, 0.5, 0.75, 1.0].map((r) => {
              const on = rate === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRate(r)}
                  style={[styles.rateChip, on ? styles.chipOn : styles.chipOff]}
                >
                  <Text style={[styles.rateVal, on && styles.onText]}>{r}</Text>
                  <Text style={[styles.rateUnit, on && styles.onSubText]}>kg/wk</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.rateNote}>
            ≈ {Math.round(rate * 7700 / 7)} kcal/day {mode === 'lose' ? 'deficit' : 'surplus'}
          </Text>
        </>
      )}

      <View style={styles.previewCard}>
        <Text style={styles.eyebrow}>New daily target</Text>
        <Text style={styles.previewKcal}>{calculated.kcal}</Text>
        <Text style={styles.previewUnit}>kcal / day</Text>
        <View style={styles.previewMacros}>
          {[
            { label: 'Protein', v: calculated.protein, c: colors.pColor },
            { label: 'Carbs', v: calculated.carbs, c: colors.cColor },
            { label: 'Fat', v: calculated.fat, c: colors.fColor },
          ].map((m) => (
            <View key={m.label} style={styles.previewTile}>
              <Text style={[styles.previewTileVal, { color: m.c }]}>{m.v}g</Text>
              <Text style={styles.previewTileLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.ink3,
    marginBottom: 8,
  },
  sexRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  sexChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radii.pill,
  },
  chipOn: { backgroundColor: colors.ink },
  chipOff: { backgroundColor: colors.surface2 },
  chipOnText: { color: colors.bg, fontSize: 13, textTransform: 'capitalize' },
  chipOffText: { color: colors.ink2, fontSize: 13, textTransform: 'capitalize' },
  onText: { color: colors.bg },
  onSubText: { color: colors.bg, opacity: 0.7 },

  pairRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  numField: { flex: 1, backgroundColor: colors.surface2, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  numLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginBottom: 4,
  },
  numInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  numInput: { flex: 1, fontSize: 24, fontFamily: fonts.serifMedium, color: colors.ink, padding: 0 },
  numSuffix: { fontSize: 13, color: colors.ink3 },

  activityWrap: { gap: 6, marginBottom: 18 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  activityOn: { backgroundColor: colors.ink },
  activityOff: { backgroundColor: colors.surface2 },
  activityLabel: { fontSize: 14, fontWeight: '500', color: colors.ink },
  activitySub: { fontSize: 12, color: colors.ink3, marginTop: 1 },

  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
  modeLabel: { fontSize: 18, fontWeight: '600', color: colors.ink },
  modeHint: { fontSize: 11, color: colors.ink3, marginTop: 2 },

  rateRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rateChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14 },
  rateVal: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rateUnit: { fontSize: 10, color: colors.ink3, marginTop: 2 },
  rateNote: { fontSize: 12, color: colors.ink3, marginBottom: 18 },

  previewCard: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
  },
  previewKcal: { fontSize: 42, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 4 },
  previewUnit: { fontSize: 12, color: colors.ink3, marginTop: 2, marginBottom: 14 },
  previewMacros: { flexDirection: 'row', gap: 10 },
  previewTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  previewTileVal: { fontSize: 22, fontWeight: '600' },
  previewTileLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },

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
