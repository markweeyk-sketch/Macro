// MacroBars.js — RN port of the web `MacroBars` (web/screens.jsx): three
// horizontal progress bars (protein / carbs / fat) coloured from the shared
// theme, each capped at 100% fill with "current / goal g" on the right.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../ui/type';
import { colors } from '@macro/core/theme';

export default function MacroBars({ totals, goal }) {
  const items = [
    { key: 'p', label: 'Protein', cur: totals.p, goal: goal.protein, color: colors.pColor },
    { key: 'c', label: 'Carbs', cur: totals.c, goal: goal.carbs, color: colors.cColor },
    { key: 'f', label: 'Fat', cur: totals.f, goal: goal.fat, color: colors.fColor },
  ];
  return (
    <View style={styles.list}>
      {items.map((m) => {
        const pct = Math.min(m.cur / m.goal, 1) * 100;
        return (
          <View key={m.key} style={styles.row}>
            <Text style={styles.label}>{m.label}</Text>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${pct}%`, backgroundColor: m.color }]}
              />
            </View>
            <Text style={styles.vals}>
              <Text style={styles.valStrong}>{Math.round(m.cur)}</Text>
              {` / ${m.goal}g`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { width: 56, fontSize: 13, color: colors.ink2 },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  vals: { width: 78, textAlign: 'right', fontSize: 12, color: colors.ink3 },
  valStrong: { color: colors.ink, fontWeight: '600' },
});
