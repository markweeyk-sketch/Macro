// TodayScreen — Phase 1 port of the web `TodayPage` (web/app.jsx): the core
// daily loop. Calorie ring + macro bars over today's totals, a quick-log strip
// of frequent foods, and the four meals with add/remove. All data comes from
// MacroData context (Firestore-backed, AsyncStorage-cached). Tapping the date
// opens the full day log (Log is a hidden route, not a tab).
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { auth } from '@macro/core/firebase';
import { colors, radii, spacing, fontSizes } from '@macro/core/theme';
import { useMacroData, mealNow } from '../state/MacroData';
import CalorieRing from '../components/charts/CalorieRing';
import MacroBars from '../components/charts/MacroBars';
import QuickLog from '../components/QuickLog';
import MealSection from '../components/MealSection';

const MEALS = [
  { key: 'breakfast', label: 'Morning' },
  { key: 'lunch', label: 'Midday' },
  { key: 'dinner', label: 'Evening' },
  { key: 'snack', label: 'Snacks' },
];

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function goalCaption(goal) {
  if (goal.mode === 'lose') return `Goal · Lose ${goal.rate}kg/wk`;
  if (goal.mode === 'gain') return `Goal · Gain ${goal.rate}kg/wk`;
  return 'Goal · Maintain';
}

export default function TodayScreen({ navigation }) {
  const { goal, totals, log, foods, frequent, addFood, removeLog, openAdd } =
    useMacroData();

  const user = auth.currentUser;
  const firstName =
    user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || null;
  const dateLabel = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => navigation.navigate('Log')} hitSlop={6}>
        <Text style={styles.eyebrow}>{dateLabel} ›</Text>
      </Pressable>
      <Text style={styles.greeting}>
        {firstName ? `${greetingWord()}, ` : "Today's "}
        <Text style={styles.greetingEm}>{firstName || 'progress'}</Text>.
      </Text>

      <View style={styles.card}>
        <View style={styles.ringWrap}>
          <CalorieRing consumed={totals.kcal} goal={goal.kcal} mode={goal.mode} />
        </View>
        <Text style={styles.goalCaption}>
          {goalCaption(goal)} · {goal.kcal} kcal
        </Text>
        <View style={styles.macroWrap}>
          <MacroBars totals={totals} goal={goal} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Quick log · recents</Text>
      <QuickLog
        foods={frequent}
        onAdd={(f) => addFood(f, f.units[0].g, 0, mealNow())}
      />

      <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Today's meals</Text>
      {MEALS.map((m) => (
        <MealSection
          key={m.key}
          meal={m.key}
          label={m.label}
          items={log.filter((x) => x.meal === m.key)}
          foods={foods}
          onAdd={() => openAdd(m.key)}
          onRemove={removeLog}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120, // clear the raised FAB + tab bar
  },
  eyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
  },
  greeting: {
    fontSize: fontSizes.display,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 6,
    marginBottom: spacing.xl,
  },
  greetingEm: { fontStyle: 'italic' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  ringWrap: { alignItems: 'center' },
  goalCaption: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: 16,
  },
  macroWrap: { marginTop: 20 },
  sectionLabel: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  sectionSpaced: { marginTop: spacing['2xl'] },
});
