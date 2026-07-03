// MealSection.js — RN port of the web `MealSection` (web/screens.jsx): one
// meal's heading + running kcal total, its logged food rows (tap the minus to
// remove), and an add affordance. Empty meals show an "Add to <meal>" prompt.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { nutritionFor } from '@macro/core/data';
import { colors, fontSizes, fonts } from '@macro/core/theme';
import Icon from './Icon';

export default function MealSection({ meal, label, items, foods, onAdd, onRemove, readOnly = false }) {
  const total = items.reduce((s, it) => {
    const f = foods.find((x) => x.id === it.foodId);
    return f ? s + nutritionFor(f, it.grams).kcal : s;
  }, 0);

  return (
    <View style={styles.meal}>
      <View style={styles.head}>
        <View>
          <Text style={styles.eyebrow}>{label}</Text>
          <Text style={styles.name}>{meal[0].toUpperCase() + meal.slice(1)}</Text>
        </View>
        <View style={styles.totalWrap}>
          <Text style={styles.total}>{Math.round(total)}</Text>
          <Text style={styles.totalUnit}>kcal</Text>
        </View>
      </View>

      {items.length === 0 ? (
        readOnly ? (
          <Text style={styles.emptyReadOnly}>Nothing logged</Text>
        ) : (
          <Pressable style={styles.emptyAdd} onPress={onAdd}>
            <Icon name="plus" size={16} color={colors.ink3} />
            <Text style={styles.emptyAddText}>Add to {meal}</Text>
          </Pressable>
        )
      ) : (
        <>
          {items.map((it) => {
            const f = foods.find((x) => x.id === it.foodId);
            if (!f) return null;
            const n = nutritionFor(f, it.grams);
            const unit = f.units[it.unitIndex];
            const unitLabel = unit ? unit.label : `${Math.round(it.grams)}g`;
            return (
              <View key={it.id} style={styles.foodRow}>
                <Text style={styles.foodEmoji}>{f.emoji}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Text style={styles.foodMeta}>
                    {f.brand} · {unitLabel}
                  </Text>
                </View>
                <Text style={styles.foodKcal}>{Math.round(n.kcal)}</Text>
                {!readOnly && (
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => onRemove(it.id)}
                    hitSlop={8}
                  >
                    <Icon name="minus" size={14} color={colors.ink3} />
                  </Pressable>
                )}
              </View>
            );
          })}
          {!readOnly && (
            <Pressable style={styles.addMore} onPress={onAdd}>
              <Icon name="plus" size={14} color={colors.ink3} />
              <Text style={styles.addMoreText}>Add more</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  meal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 14,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.ink3,
  },
  name: { fontSize: fontSizes.lg, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 2 },
  totalWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  total: { fontSize: 22, fontFamily: fonts.serifMedium, color: colors.ink },
  totalUnit: { fontSize: 12, color: colors.ink3 },
  emptyAdd: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  emptyAddText: { fontSize: 14, color: colors.ink3 },
  emptyReadOnly: { fontSize: 14, color: colors.ink3, paddingVertical: 12 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  foodEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  foodMeta: { fontSize: 12, color: colors.ink3, marginTop: 1 },
  foodKcal: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  addMore: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  addMoreText: { fontSize: 13, color: colors.ink3 },
});
