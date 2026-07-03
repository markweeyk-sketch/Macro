// LogWeightSheet — RN port of the web `LogWeightSheet` (web/screens.jsx): a
// stepper for today's weight (±0.1 kg) plus a numeric field, the delta since the
// last entry, and confirm actions. When the profile has the biometrics needed to
// recompute macros, it offers "Log & update goal"; otherwise just logs.
import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Text, TextInput } from '../ui/type';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import Sheet from './Sheet';
import Icon from './Icon';

export default function LogWeightSheet({ visible, onClose, goal, onConfirm }) {
  const [weight, setWeight] = useState('70');

  useEffect(() => {
    if (visible) setWeight(String(+(goal.currentKg || 70)));
  }, [visible, goal]);

  const num = weight === '' ? NaN : +weight;
  const valid = !Number.isNaN(num) && num >= 30 && num <= 300;
  const hasBio = goal.sex && goal.age && goal.heightCm && goal.activity;
  const diff = valid ? +(num - goal.currentKg).toFixed(1) : 0;

  const bump = (delta) =>
    setWeight((w) => {
      const base = w === '' || Number.isNaN(+w) ? goal.currentKg || 70 : +w;
      return String(Math.max(30, +(base + delta).toFixed(1)));
    });

  const confirm = (recalc) => {
    if (!valid) return;
    onConfirm(num, recalc);
    onClose();
  };

  const footer = hasBio ? (
    <View style={styles.footStack}>
      <Pressable
        style={[styles.btn, !valid && styles.btnOff]}
        onPress={() => confirm(true)}
        disabled={!valid}
      >
        <Text style={styles.btnText}>Log weight & update goal</Text>
      </Pressable>
      <Pressable style={styles.linkBtn} onPress={() => confirm(false)} disabled={!valid}>
        <Text style={styles.linkText}>Just log the weight</Text>
      </Pressable>
    </View>
  ) : (
    <Pressable
      style={[styles.btn, styles.btnFull, !valid && styles.btnOff]}
      onPress={() => confirm(false)}
      disabled={!valid}
    >
      <Text style={styles.btnText}>Log weight</Text>
    </Pressable>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Log weight" scroll={false} footer={footer}>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>Today's weight</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => bump(-0.1)} hitSlop={6}>
            <Icon name="minus" size={16} color={colors.ink} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={5}
          />
          <Pressable style={styles.stepBtn} onPress={() => bump(0.1)} hitSlop={6}>
            <Icon name="plus" size={16} color={colors.ink} />
          </Pressable>
        </View>
        <Text style={styles.unit}>kg</Text>
        {diff !== 0 && (
          <Text style={[styles.delta, { color: diff < 0 ? colors.accent : colors.warn }]}>
            {diff < 0
              ? `↓ ${Math.abs(diff)} kg since last entry`
              : `↑ ${diff} kg since last entry`}
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.md },
  eyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.ink3,
    marginBottom: spacing.lg,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 150,
    textAlign: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 44,
    fontFamily: fonts.serifMedium,
    color: colors.ink,
    letterSpacing: -1,
  },
  unit: { fontSize: 14, color: colors.ink3, marginTop: 8 },
  delta: { fontSize: 13, marginTop: 8 },
  footStack: { flex: 1, gap: 8 },
  btn: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: { flex: 1 },
  btnOff: { opacity: 0.4 },
  btnText: { color: colors.bg, fontSize: 15, fontWeight: '600' },
  linkBtn: { paddingVertical: 6, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.ink3 },
});
