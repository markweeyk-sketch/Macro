// QuickLog.js — RN port of the web `QuickLog` chip strip (web/screens.jsx): a
// horizontally scrolling row of frequent foods; tapping one logs its default
// serving straight away.
import React from 'react';
import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { nutritionFor } from '@macro/core/data';
import { colors, radii } from '@macro/core/theme';

export default function QuickLog({ foods, onAdd }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {foods.map((f) => (
        <Pressable key={f.id} style={styles.chip} onPress={() => onAdd(f)}>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{f.emoji}</Text>
          </View>
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
  emojiWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 14 },
  name: { fontSize: 13, fontWeight: '500', color: colors.ink },
  kcal: { fontSize: 12, color: colors.ink3 },
});
