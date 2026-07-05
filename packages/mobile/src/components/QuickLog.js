// QuickLog.js — RN port of the web `QuickLog` chip strip (web/screens.jsx): a
// horizontally scrolling row of frequent foods; tapping one logs its default
// serving straight away.
import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { nutritionFor } from '@macro/core/data';
import { colors, radii } from '@macro/core/theme';
import FoodMonogram from './FoodMonogram';

export default function QuickLog({ foods, onAdd }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {foods.map((f) => (
        <Pressable key={f.id} style={styles.chip} onPress={() => onAdd(f)}>
          <FoodMonogram food={f} size={28} />
          <Text style={styles.name}>{f.name}</Text>
          <Text style={styles.kcal}>
            {Math.round(nutritionFor(f, f.units[0].g).kcal)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  name: { fontSize: 13, fontWeight: '500', color: colors.ink },
  kcal: { fontSize: 12, color: colors.ink3 },
});
