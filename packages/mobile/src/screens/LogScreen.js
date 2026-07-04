// LogScreen — Phase 2. The web LogPage is today-only; on mobile the Log route
// (reached from the Today date tap, no tab of its own) adds day-by-day history:
// a prev/next day navigator (capped at today), that day's calorie/macro summary,
// and its meal-by-meal breakdown.
//
// Today delegates to the shared MacroData context so edits stay in sync with the
// Today screen; past days load their own entries from Firestore and are shown
// read-only for now (editing arbitrary days is a fast-follow — see MealSection
// readOnly).
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Text } from '../ui/type';
import { auth, todayKey, loadDayLog } from '@macro/core/firebase';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import { useMacroData, computeTotals } from '../state/MacroData';
import MacroBars from '../components/charts/MacroBars';
import MealSection from '../components/MealSection';
import Icon from '../components/Icon';

const MEALS = [
  { key: 'breakfast', label: 'Morning' },
  { key: 'lunch', label: 'Midday' },
  { key: 'dinner', label: 'Evening' },
  { key: 'snack', label: 'Snacks' },
];

// Shift a YYYY-MM-DD key by whole days in UTC, matching how todayKey() derives
// the key (UTC slice) so navigation never drifts across a timezone boundary.
function shiftDate(key, delta) {
  const d = new Date(key + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function dayLabel(key) {
  const t = todayKey();
  if (key === t) return 'Today';
  if (key === shiftDate(t, -1)) return 'Yesterday';
  return new Date(key + 'T00:00:00Z').toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function LogScreen() {
  const { goal, log, foods, removeLog, openAdd } = useMacroData();
  const [date, setDate] = useState(todayKey());
  const isToday = date === todayKey();

  const [pastEntries, setPastEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load a past day's entries from Firestore; today comes from context (live).
  useEffect(() => {
    if (isToday) return;
    let alive = true;
    setLoading(true);
    const uid = auth.currentUser?.uid;
    (async () => {
      let entries = [];
      if (uid) {
        try {
          entries = (await loadDayLog(uid, date)) ?? [];
        } catch {
          entries = [];
        }
      }
      if (!alive) return;
      setPastEntries(entries);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [date, isToday]);

  const entries = isToday ? log : pastEntries;
  const totals = useMemo(() => computeTotals(entries, foods), [entries, foods]);
  const remaining = Math.round(goal.kcal - totals.kcal);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dayNav}>
        <Pressable
          style={styles.arrow}
          onPress={() => setDate(shiftDate(date, -1))}
          hitSlop={8}
        >
          <View style={styles.flip}>
            <Icon name="chevron" size={18} color={colors.ink} />
          </View>
        </Pressable>
        <Text style={styles.dayLabel}>{dayLabel(date)}</Text>
        <Pressable
          style={[styles.arrow, isToday && styles.arrowOff]}
          onPress={() => !isToday && setDate(shiftDate(date, 1))}
          disabled={isToday}
          hitSlop={8}
        >
          <Icon name="chevron" size={18} color={isToday ? colors.ink3 : colors.ink} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.eyebrow}>Calories</Text>
            <Text style={styles.kcalNum}>
              {Math.round(totals.kcal)}
              <Text style={styles.kcalGoal}> / {goal.kcal}</Text>
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.eyebrow}>{remaining >= 0 ? 'Remaining' : 'Over'}</Text>
            <Text style={styles.remainNum}>{Math.abs(remaining)}</Text>
          </View>
        </View>
        <View style={styles.macroWrap}>
          <MacroBars totals={totals} goal={goal} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      ) : (
        <View style={styles.meals}>
          {MEALS.map((m) => (
            <MealSection
              key={m.key}
              meal={m.key}
              label={m.label}
              items={entries.filter((x) => x.meal === m.key)}
              foods={foods}
              readOnly={!isToday}
              onAdd={() => openAdd(m.key)}
              onRemove={removeLog}
            />
          ))}
        </View>
      )}

      {!isToday && (
        <Text style={styles.note}>
          Viewing a past day — historical entries are read-only for now.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { opacity: 0.4 },
  flip: { transform: [{ scaleX: -1 }] },
  dayLabel: { fontSize: fontSizes.title, fontFamily: fonts.serifMedium, color: colors.ink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryRight: { alignItems: 'flex-end' },
  eyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
  },
  kcalNum: { fontSize: 40, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 4 },
  kcalGoal: { fontSize: 16, fontWeight: '400', color: colors.ink3 },
  remainNum: { fontSize: 28, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 4 },
  macroWrap: { marginTop: 18 },
  loading: { marginTop: 40 },
  meals: { marginTop: spacing.sm },
  note: {
    fontSize: fontSizes.caption,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
