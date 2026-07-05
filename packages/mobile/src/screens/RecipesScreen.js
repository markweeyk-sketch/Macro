// RecipesScreen — Phase 4 (Recipes). RN port of the web `RecipesPage`
// (app.jsx): a grid of recipe cards (emoji, name, macro totals, ingredient
// chips), a "build a recipe" tile, a detail sheet (view ingredients, edit,
// two-step delete), and the RecipeEditorSheet for create/edit.
//
// Reads recipes from MacroData and writes through saveRecipe / deleteRecipe
// (cache + Firestore saveRecipes). Recipe items keep the dual-format support.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { nutritionFor } from '@macro/core/data';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import { useMacroData, getRecipeItems } from '../state/MacroData';
import Sheet from '../components/Sheet';
import RecipeEditorSheet from '../components/RecipeEditorSheet';
import Icon from '../components/Icon';

function recipeTotals(items) {
  return items.reduce(
    (s, { food, grams }) => {
      const n = nutritionFor(food, grams);
      return { kcal: s.kcal + n.kcal, p: s.p + n.p, c: s.c + n.c, f: s.f + n.f };
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
}

function MacroTiles({ n, big }) {
  const tiles = [
    { l: 'kcal', v: Math.round(n.kcal), c: colors.ink },
    { l: 'P', v: Math.round(n.p) + 'g', c: colors.pColor },
    { l: 'C', v: Math.round(n.c) + 'g', c: colors.cColor },
    { l: 'F', v: Math.round(n.f) + 'g', c: colors.fColor },
  ];
  return (
    <View style={styles.tileRow}>
      {tiles.map((m) => (
        <View key={m.l} style={styles.tile}>
          <Text
            style={[styles.tileVal, big && styles.tileValBig, { color: m.c }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {m.v}
          </Text>
          <Text style={styles.tileLabel}>{m.l}</Text>
        </View>
      ))}
    </View>
  );
}

export default function RecipesScreen() {
  const { recipes, foods, saveRecipe, deleteRecipe } = useMacroData();
  const [editorState, setEditorState] = useState(null); // null | { recipe: null|{} }
  const [viewId, setViewId] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);

  const openCreate = () => setEditorState({ recipe: null });
  const openEdit = (r) => {
    setViewId(null);
    setEditorState({ recipe: r });
  };
  const openView = (r) => {
    setViewId(r.id);
    setDeleteStep(0);
  };
  const closeView = () => {
    setViewId(null);
    setDeleteStep(0);
  };

  const handleSave = (r) => {
    saveRecipe(r);
    setEditorState(null);
    setViewId(r.id);
  };
  const handleDelete = (id) => {
    deleteRecipe(id);
    closeView();
  };

  const viewRecipe = viewId ? recipes.find((r) => r.id === viewId) : null;
  const viewItems = viewRecipe ? getRecipeItems(viewRecipe, foods) : [];
  const viewTotals = recipeTotals(viewItems);

  const viewFooter = viewRecipe ? (
    deleteStep === 0 ? (
      <>
        <Pressable
          style={[styles.btn, styles.btnGhost, styles.btnFlex]}
          onPress={() => openEdit(viewRecipe)}
        >
          <Icon name="scale" size={14} color={colors.ink2} />
          <Text style={styles.btnGhostText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnGhost, styles.btnFlex]}
          onPress={() => setDeleteStep(1)}
        >
          <Icon name="minus" size={14} color={colors.warn} />
          <Text style={[styles.btnGhostText, { color: colors.warn }]}>Delete</Text>
        </Pressable>
      </>
    ) : (
      <View style={styles.confirmBox}>
        <Text style={styles.confirmText}>
          Delete <Text style={styles.bold}>{viewRecipe.name}</Text>? This cannot be undone.
        </Text>
        <View style={styles.confirmBtns}>
          <Pressable
            style={[styles.btn, styles.btnGhost, styles.btnFlex]}
            onPress={() => setDeleteStep(0)}
          >
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnDanger, styles.btnFlex]}
            onPress={() => handleDelete(viewRecipe.id)}
          >
            <Text style={styles.btnDangerText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    )
  ) : null;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View>
            <Text style={styles.eyebrow}>Saved meals</Text>
            <Text style={styles.title}>
              Recipes & <Text style={styles.titleEm}>quick meals</Text>
            </Text>
          </View>
          <Pressable style={styles.newBtn} onPress={openCreate}>
            <Icon name="plus" size={14} color={colors.bg} />
            <Text style={styles.newBtnText}>New</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {recipes.map((r) => {
            const items = getRecipeItems(r, foods);
            const tot = recipeTotals(items);
            return (
              <Pressable key={r.id} style={styles.recipeCard} onPress={() => openView(r)}>
                <View style={styles.cardThumb}>
                  <Text style={styles.cardThumbEmoji}>{r.emoji}</Text>
                </View>
                {/* Full-width row: title + meta + macros on the left, the
                    calorie total on the right. Roomy enough that nothing wraps. */}
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {items.length} ingredients · serves {r.serves}
                  </Text>
                  <Text style={styles.cardMacroLine} numberOfLines={1}>
                    <Text style={{ color: colors.pColor }}>P {Math.round(tot.p)}g</Text>
                    <Text style={styles.cardMacroDot}>  ·  </Text>
                    <Text style={{ color: colors.cColor }}>C {Math.round(tot.c)}g</Text>
                    <Text style={styles.cardMacroDot}>  ·  </Text>
                    <Text style={{ color: colors.fColor }}>F {Math.round(tot.f)}g</Text>
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardKcal}>{Math.round(tot.kcal)}</Text>
                  <Text style={styles.cardKcalUnit}>kcal</Text>
                </View>
              </Pressable>
            );
          })}

          <Pressable style={styles.buildCard} onPress={openCreate}>
            <View style={styles.buildIcon}>
              <Icon name="plus" size={20} color={colors.ink} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.buildTitle}>Build a recipe</Text>
              <Text style={styles.buildSub}>Combine foods you eat together</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Recipe detail sheet */}
      <Sheet
        visible={!!viewRecipe}
        onClose={closeView}
        title={viewRecipe ? `${viewRecipe.emoji}  ${viewRecipe.name}` : ''}
        footer={viewFooter}
      >
        {viewRecipe && (
          <>
            <Text style={styles.detailMeta}>
              {viewItems.length} ingredients · serves {viewRecipe.serves}
            </Text>
            <View style={styles.detailTiles}>
              <MacroTiles n={viewTotals} big />
            </View>
            <Text style={styles.sectionLabel}>Ingredients</Text>
            {viewItems.map(({ food, grams, unitIndex }) => {
              const n = nutritionFor(food, grams);
              const unit = food.units[unitIndex] || food.units[0];
              return (
                <View key={food.id} style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>{food.emoji}</Text>
                  <View style={styles.flex1}>
                    <Text style={styles.detailName}>{food.name}</Text>
                    <Text style={styles.detailUnit}>{unit.label}</Text>
                  </View>
                  <Text style={styles.detailKcal}>{Math.round(n.kcal)} kcal</Text>
                </View>
              );
            })}
          </>
        )}
      </Sheet>

      <RecipeEditorSheet
        visible={!!editorState}
        onClose={() => setEditorState(null)}
        recipe={editorState?.recipe}
        foods={foods}
        onSave={handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 120 },
  flex1: { flex: 1, minWidth: 0 },
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
  title: { fontSize: 28, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 2, maxWidth: 220 },
  titleEm: { fontFamily: fonts.serifItalic },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
  },
  newBtnText: { fontSize: 13, fontWeight: '600', color: colors.bg },

  list: { gap: spacing.md },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: 14,
  },
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumbEmoji: { fontSize: 30 },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: fontSizes.base, fontWeight: '600', color: colors.ink },
  cardMeta: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  cardMacroLine: { fontSize: 12, fontWeight: '500', marginTop: 6 },
  cardMacroDot: { color: colors.line2 },
  cardRight: { alignItems: 'flex-end', paddingLeft: 6 },
  cardKcal: { fontSize: 24, fontFamily: fonts.serifMedium, color: colors.ink },
  cardKcalUnit: { fontSize: 11, color: colors.ink3, marginTop: -2 },

  buildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line2,
    padding: 14,
    marginTop: spacing.xs,
  },
  buildIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildTitle: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.ink },
  buildSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },

  // Shared macro tiles
  tileRow: { flexDirection: 'row', gap: 6 },
  tile: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileVal: { fontSize: 16, fontFamily: fonts.serifMedium },
  tileValBig: { fontSize: 22 },
  tileLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },

  // Detail sheet
  detailMeta: { fontSize: 12, color: colors.ink3, marginBottom: 16 },
  detailTiles: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.ink3,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  detailEmoji: { fontSize: 20, width: 36, textAlign: 'center' },
  detailName: { fontSize: 14, fontWeight: '500', color: colors.ink },
  detailUnit: { fontSize: 12, color: colors.ink3, marginTop: 1 },
  detailKcal: { fontSize: 13, color: colors.ink2 },

  // Buttons
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingVertical: 13,
    minHeight: 48,
  },
  btnFlex: { flex: 1 },
  btnGhost: { backgroundColor: colors.surface2 },
  btnGhostText: { color: colors.ink2, fontWeight: '500', fontSize: fontSizes.base },
  btnDanger: { backgroundColor: colors.warn },
  btnDangerText: { color: '#fff', fontWeight: '600', fontSize: fontSizes.base },
  confirmBox: {
    flex: 1,
    backgroundColor: 'rgba(198,106,58,0.08)',
    borderRadius: 12,
    padding: 14,
  },
  confirmText: { fontSize: 13, color: colors.ink2, marginBottom: 12 },
  bold: { fontWeight: '700' },
  confirmBtns: { flexDirection: 'row', gap: 8 },
});
