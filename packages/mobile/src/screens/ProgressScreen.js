// ProgressScreen — Phase 5 (Progress). RN port of the web `ProgressPage`
// (app.jsx): the weight card (current weight, delta from start, distance to goal,
// range-filtered WeightChart), placeholder trend cards, and computed insights.
// "Log weight" opens the LogWeightSheet, which writes through MacroData.logWeight.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import { useMacroData } from '../state/MacroData';
import WeightChart from '../components/charts/WeightChart';
import LogWeightSheet from '../components/LogWeightSheet';
import Icon from '../components/Icon';

const RANGES = ['7d', '30d', '3m', 'all'];

export default function ProgressScreen() {
  const { goal, weights, logWeight } = useMacroData();
  const [range, setRange] = useState('30d');
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayEntries = useMemo(() => {
    if (!weights || weights.length === 0) return [];
    const now = new Date();
    const day = 86400000;
    const cutoff =
      range === '7d'
        ? new Date(now - 7 * day).toISOString().slice(0, 10)
        : range === '30d'
        ? new Date(now - 30 * day).toISOString().slice(0, 10)
        : range === '3m'
        ? new Date(now - 90 * day).toISOString().slice(0, 10)
        : '0000-00-00';
    return weights.filter((e) => e.date >= cutoff);
  }, [weights, range]);

  const currentKg =
    weights && weights.length > 0 ? weights[weights.length - 1].weight : goal.currentKg;
  const delta = +(goal.startKg - currentKg).toFixed(1);
  const toGo = +(currentKg - goal.weightKg).toFixed(1);

  const insights = useMemo(() => {
    const list = [];
    if (goal.streak >= 3) {
      list.push({
        i: 'flame',
        t: `${goal.streak}-day streak`,
        s: 'Consistent logging builds habits — keep it up.',
      });
    }
    if (weights && weights.length >= 2) {
      const first = weights[0].weight;
      const last = weights[weights.length - 1].weight;
      const diff = +(last - first).toFixed(1);
      if (diff < 0)
        list.push({
          i: 'bolt',
          t: `Down ${Math.abs(diff)} kg total`,
          s: `From ${first} kg to ${last} kg. You're making real progress.`,
        });
      else if (diff > 0)
        list.push({
          i: 'bolt',
          t: `Up ${diff} kg total`,
          s: `From ${first} kg to ${last} kg since you started tracking.`,
        });
    }
    const left = Math.abs(toGo);
    if (left > 0 && goal.mode !== 'maintain' && goal.rate) {
      const weeksLeft = Math.ceil(left / goal.rate);
      list.push({
        i: 'target',
        t: `${left} kg to goal`,
        s: `At ${goal.rate} kg/wk, you could reach your goal in ~${weeksLeft} week${
          weeksLeft !== 1 ? 's' : ''
        }.`,
      });
    }
    return list;
  }, [goal, weights, toGo]);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View>
            <Text style={styles.eyebrow}>Your journey</Text>
            <Text style={styles.title}>
              Your <Text style={styles.titleEm}>progress</Text>
            </Text>
          </View>
          <Pressable style={styles.logBtn} onPress={() => setSheetOpen(true)}>
            <Icon name="scale" size={14} color={colors.ink} />
            <Text style={styles.logBtnText}>Log weight</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHd}>
            <View style={styles.flexShrink}>
              <Text style={styles.eyebrow}>Weight</Text>
              <View style={styles.weightRow}>
                <Text style={styles.weightNum}>{currentKg}</Text>
                <Text style={styles.weightUnit}>kg</Text>
                {delta !== 0 && (
                  <Text style={styles.weightChip}>
                    {delta > 0 ? '↓' : '↑'} {Math.abs(delta)} kg
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.headRight}>
              <View style={styles.toGoWrap}>
                <Text style={styles.eyebrow}>To goal</Text>
                <Text style={styles.toGoNum}>{toGo} kg</Text>
              </View>
              <View style={styles.rangeRow}>
                {RANGES.map((r) => {
                  const on = range === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRange(r)}
                      style={[styles.rangeChip, on && styles.rangeChipOn]}
                    >
                      <Text style={[styles.rangeText, on && styles.rangeTextOn]}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          <View style={styles.chartWrap}>
            <WeightChart entries={displayEntries} goalKg={goal.weightKg} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrowMb}>Avg calories · 7d</Text>
          <Text style={styles.emptyCard}>
            No calorie history yet.{'\n'}Log meals daily to see your trends.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.eyebrowMb}>Macro adherence</Text>
          <Text style={styles.emptyCard}>
            No macro history yet.{'\n'}Track meals to see adherence.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Insights</Text>
            {insights.length > 0 && (
              <View style={styles.countChip}>
                <Text style={styles.countChipText}>{insights.length}</Text>
              </View>
            )}
          </View>
          {insights.length === 0 ? (
            <Text style={styles.emptyCard}>
              Start logging meals and weight{'\n'}to unlock personal insights.
            </Text>
          ) : (
            <View style={styles.insightList}>
              {insights.map((x, i) => (
                <View key={i} style={styles.insight}>
                  <View style={styles.insightIcon}>
                    <Icon name={x.i} size={16} color={colors.ink} />
                  </View>
                  <View style={styles.flexShrink}>
                    <Text style={styles.insightTitle}>{x.t}</Text>
                    <Text style={styles.insightSub}>{x.s}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <LogWeightSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        goal={goal}
        onConfirm={logWeight}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
  },
  eyebrowMb: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
    marginBottom: spacing.sm,
  },
  title: { fontSize: 28, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 2 },
  titleEm: { fontFamily: fonts.serifItalic, color: colors.ink },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
    backgroundColor: colors.surface,
  },
  logBtnText: { fontSize: 13, fontWeight: '500', color: colors.ink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  cardHd: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  flexShrink: { flexShrink: 1 },
  weightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginTop: 2 },
  weightNum: { fontSize: 44, fontFamily: fonts.serifMedium, color: colors.ink },
  weightUnit: { fontSize: 14, color: colors.ink3 },
  weightChip: { fontSize: 13, color: colors.accent },
  headRight: { alignItems: 'flex-end', gap: 8 },
  toGoWrap: { alignItems: 'flex-end' },
  toGoNum: { fontSize: 22, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 2 },
  rangeRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
  },
  rangeChipOn: { backgroundColor: colors.ink },
  rangeText: { fontSize: 11, color: colors.ink2 },
  rangeTextOn: { color: colors.bg },
  chartWrap: { marginTop: spacing.md },
  emptyCard: {
    paddingVertical: 16,
    textAlign: 'center',
    color: colors.ink3,
    fontSize: fontSizes.body,
    lineHeight: 21,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.ink },
  countChip: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: { fontSize: 11, color: colors.ink2, fontWeight: '600' },
  insightList: { gap: 10 },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface2,
    borderRadius: 14,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: { fontSize: 13, fontWeight: '500', color: colors.ink },
  insightSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
});
