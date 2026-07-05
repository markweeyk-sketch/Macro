// PlanScreen — Phase 3 (Plan). RN port of the web `PlanPage` (app.jsx): a
// week of day cards (Mon–Sun, today highlighted) each with four meal slots you
// fill from your saved recipes, an auto-plan shortcut, and a generated shopping
// list. The week scrolls horizontally like the web's mobile rendering.
//
// Reads recipes + weekPlan from MacroData and writes the whole plan back through
// updatePlan (cache + Firestore savePlan). Recipes are created on the Recipes
// screen (Phase 4) — until then the picker shows the "no recipes" empty state.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { nutritionFor } from '@macro/core/data';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import { useMacroData, getRecipeItems } from '../state/MacroData';
import Sheet from '../components/Sheet';
import Icon from '../components/Icon';
import FoodMonogram from '../components/FoodMonogram';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

function todayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function PlanScreen() {
  const { recipes, weekPlan, updatePlan, foods } = useMacroData();
  const today = todayIndex();
  const [picking, setPicking] = useState(null); // { dayIndex, slot } | null

  const setPlanSlot = (dayIndex, slot, recipeId) => {
    updatePlan(
      weekPlan.map((d, i) => (i === dayIndex ? { ...d, [slot]: recipeId } : d))
    );
    setPicking(null);
  };

  const removePlanSlot = (dayIndex, slot) => {
    updatePlan(weekPlan.map((d, i) => (i === dayIndex ? { ...d, [slot]: null } : d)));
  };

  const autoPlan = () => {
    if (!recipes.length) return;
    updatePlan(
      Array.from({ length: 7 }, (_, i) => {
        const day = {};
        SLOTS.forEach((slot, si) => {
          day[slot] = recipes[(i + si) % recipes.length].id;
        });
        return day;
      })
    );
  };

  const dayKcal = (dayPlan) => {
    let total = 0;
    Object.values(dayPlan).forEach((recipeId) => {
      if (!recipeId) return;
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;
      getRecipeItems(recipe, foods).forEach(({ food, grams }) => {
        total += nutritionFor(food, grams).kcal;
      });
    });
    return Math.round(total);
  };

  const shoppingItems = useMemo(() => {
    const foodIds = new Set();
    weekPlan.forEach((day) => {
      Object.values(day).forEach((recipeId) => {
        if (!recipeId) return;
        const recipe = recipes.find((r) => r.id === recipeId);
        if (!recipe) return;
        getRecipeItems(recipe, foods).forEach(({ food }) => foodIds.add(food.id));
      });
    });
    return [...foodIds].map((id) => foods.find((f) => f.id === id)).filter(Boolean);
  }, [weekPlan, recipes, foods]);

  const pickingCurrentId =
    picking != null ? weekPlan[picking.dayIndex][picking.slot] : null;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View>
            <Text style={styles.eyebrow}>This week</Text>
            <Text style={styles.title}>
              Meal <Text style={styles.titleEm}>plan</Text>
            </Text>
          </View>
          <Pressable
            style={[styles.autoBtn, !recipes.length && styles.autoBtnOff]}
            onPress={autoPlan}
            disabled={!recipes.length}
          >
            <Icon name="bolt" size={14} color={colors.ink} />
            <Text style={styles.autoBtnText}>Auto-plan</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {weekPlan.map((dayPlan, i) => {
            const kcal = dayKcal(dayPlan);
            const isToday = i === today;
            return (
              <View key={DAYS[i]} style={[styles.dayCard, isToday && styles.dayCardToday]}>
                <View style={styles.dayHd}>
                  <View>
                    <Text style={styles.dayLabel}>{DAYS[i]}</Text>
                    {isToday && <Text style={styles.dayToday}>Today</Text>}
                  </View>
                  {kcal > 0 && <Text style={styles.dayKcal}>{kcal} kcal</Text>}
                </View>
                {SLOTS.map((slot) => (
                  <PlanSlot
                    key={slot}
                    slot={slot}
                    recipe={dayPlan[slot] ? recipes.find((r) => r.id === dayPlan[slot]) : null}
                    onPick={() => setPicking({ dayIndex: i, slot })}
                    onRemove={() => removePlanSlot(i, slot)}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.card}>
          <View style={styles.cardHd}>
            <Text style={styles.cardTitle}>Shopping list</Text>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{shoppingItems.length} items</Text>
            </View>
          </View>
          {shoppingItems.length === 0 ? (
            <Text style={styles.emptyCard}>
              Add meals to your plan to generate a shopping list.
            </Text>
          ) : (
            <View style={styles.shopGrid}>
              {shoppingItems.map((f) => (
                <View key={f.id} style={styles.shopItem}>
                  <FoodMonogram food={f} size={30} />
                  <View style={styles.flexShrink}>
                    <Text style={styles.shopName} numberOfLines={1}>
                      {f.name}
                    </Text>
                    <Text style={styles.shopUnit}>{f.units[0].label}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Sheet
        visible={picking != null}
        onClose={() => setPicking(null)}
        title={picking ? picking.slot[0].toUpperCase() + picking.slot.slice(1) : ''}
      >
        {pickingCurrentId && (
          <Pressable
            style={styles.removeRow}
            onPress={() => setPlanSlot(picking.dayIndex, picking.slot, null)}
          >
            <Icon name="minus" size={16} color={colors.warn} />
            <Text style={styles.removeText}>Remove slot</Text>
          </Pressable>
        )}
        {recipes.length === 0 && (
          <Text style={styles.pickerEmpty}>No recipes yet. Add some in Recipes.</Text>
        )}
        {recipes.map((r) => {
          const on = pickingCurrentId === r.id;
          return (
            <Pressable
              key={r.id}
              style={styles.recipeRow}
              onPress={() => picking && setPlanSlot(picking.dayIndex, picking.slot, r.id)}
            >
              <FoodMonogram label={r.name} color={colors.accent} size={40} />
              <View style={styles.flexShrink}>
                <Text style={styles.recipeName}>{r.name}</Text>
                <Text style={styles.recipeMeta}>
                  {(r.items || []).length} ingredients · serves {r.serves}
                </Text>
              </View>
              {on && <Icon name="check" size={16} color={colors.ink} />}
            </Pressable>
          );
        })}
      </Sheet>
    </>
  );
}

function PlanSlot({ slot, recipe, onPick, onRemove }) {
  if (!recipe) {
    return (
      <Pressable style={styles.slotEmpty} onPress={onPick}>
        <Icon name="plus" size={12} color={colors.ink3} />
        <Text style={styles.slotEmptyText}>{slot}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.slotFilled}>
      <Text style={styles.slotLabel}>{slot}</Text>
      <View style={styles.slotBody}>
        <FoodMonogram label={recipe.name} color={colors.accent} size={22} />
        <Text style={styles.slotName} numberOfLines={1}>
          {recipe.name}
        </Text>
        <Pressable onPress={onPick} hitSlop={6} style={styles.slotBtn}>
          <Icon name="arrowR" size={12} color={colors.ink3} />
        </Pressable>
        <Pressable onPress={onRemove} hitSlop={6} style={styles.slotBtn}>
          <Icon name="minus" size={12} color={colors.ink3} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: spacing.md, paddingBottom: 120 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
  },
  title: { fontSize: 28, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 2 },
  titleEm: { fontFamily: fonts.serifItalic },
  autoBtn: {
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
  autoBtnOff: { opacity: 0.4 },
  autoBtnText: { fontSize: 13, fontWeight: '500', color: colors.ink },

  weekRow: { paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.sm },
  dayCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  dayCardToday: { borderWidth: 2, borderColor: colors.ink },
  dayHd: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    minHeight: 34,
  },
  dayLabel: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.ink3,
  },
  dayToday: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.ink, marginTop: 2 },
  dayKcal: { fontSize: 13, color: colors.ink3 },

  slotEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line2,
    borderRadius: 10,
  },
  slotEmptyText: { fontSize: 12, color: colors.ink3, textTransform: 'capitalize' },
  slotFilled: { padding: 10, marginTop: 6, backgroundColor: colors.surface2, borderRadius: 10 },
  slotLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
  },
  slotBody: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  slotName: { fontSize: 12, fontWeight: '500', color: colors.ink, flex: 1 },
  slotBtn: { padding: 3 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cardHd: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.ink },
  countChip: {
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: { fontSize: 11, color: colors.ink2, fontWeight: '600' },
  emptyCard: {
    paddingVertical: 20,
    textAlign: 'center',
    color: colors.ink3,
    fontSize: fontSizes.body,
  },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    width: '48%',
  },
  flexShrink: { flexShrink: 1, minWidth: 0 },
  shopName: { fontSize: 13, fontWeight: '500', color: colors.ink },
  shopUnit: { fontSize: 11, color: colors.ink3 },

  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  removeText: { color: colors.warn, fontSize: fontSizes.base },
  pickerEmpty: { paddingVertical: 32, textAlign: 'center', color: colors.ink3 },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  recipeName: { fontSize: 14, fontWeight: '500', color: colors.ink },
  recipeMeta: { fontSize: 12, color: colors.ink3, marginTop: 1 },
});
