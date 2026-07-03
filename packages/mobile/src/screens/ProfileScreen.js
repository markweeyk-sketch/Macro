// ProfileScreen — Phase 6 (Profile). Consolidates the web ProfileSheet +
// GoalSheet + EditProfileSheet into one native screen: signed-in identity, the
// current daily target (kcal + macros) and weight goal, a full profile/goal
// editor (EditProfileSheet, which recomputes via calcGoal), and sign-out
// through the app's own bottom-sheet confirm instead of the dated OS Alert.
//
// Theme/tweaks (web SettingsSheet) are intentionally dropped on mobile, and the
// multi-step OnboardingSheet is deferred — the editor here does first-run goal
// setup (a default goal works until then).
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { auth, signOutUser } from '@macro/core/firebase';
import { colors, radii, spacing, fontSizes } from '@macro/core/theme';
import { useMacroData } from '../state/MacroData';
import Sheet from '../components/Sheet';
import EditProfileSheet from '../components/EditProfileSheet';
import Icon from '../components/Icon';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const { goal, weights, updateGoal } = useMacroData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const name = user?.displayName || user?.email || '';
  const initial = (name.trim()[0] || '?').toUpperCase();

  const currentKg =
    weights && weights.length > 0 ? weights[weights.length - 1].weight : goal.currentKg;
  const modeLabel =
    goal.mode === 'lose' ? 'Losing' : goal.mode === 'gain' ? 'Gaining' : 'Maintaining';

  const macros = [
    { label: 'Protein', v: goal.protein, c: colors.pColor },
    { label: 'Carbs', v: goal.carbs, c: colors.cColor },
    { label: 'Fat', v: goal.fat, c: colors.fColor },
  ];

  const confirmFooter = (
    <>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setConfirmOpen(false)}>
        <Text style={styles.btnGhostText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.btnDanger]}
        onPress={() => {
          setConfirmOpen(false);
          signOutUser();
        }}
      >
        <Text style={styles.btnDangerText}>Sign out</Text>
      </Pressable>
    </>
  );

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.flexShrink}>
                {user.displayName ? <Text style={styles.name}>{user.displayName}</Text> : null}
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHd}>
                <Text style={styles.eyebrow}>Daily target</Text>
                {!goal.onboarded && <Text style={styles.estimate}>Estimated</Text>}
              </View>
              <Text style={styles.kcal}>
                {goal.kcal}
                <Text style={styles.kcalUnit}> kcal</Text>
              </Text>
              <View style={styles.macroRow}>
                {macros.map((m) => (
                  <View key={m.label} style={styles.macroTile}>
                    <Text style={[styles.macroVal, { color: m.c }]}>{m.v}g</Text>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>Weight goal</Text>
              <View style={styles.weightRow}>
                <View>
                  <Text style={styles.weightNum}>{currentKg}</Text>
                  <Text style={styles.weightCap}>current kg</Text>
                </View>
                <Icon name="arrowR" size={18} color={colors.ink3} />
                <View style={styles.alignEnd}>
                  <Text style={styles.weightNum}>{goal.weightKg}</Text>
                  <Text style={styles.weightCap}>target kg</Text>
                </View>
                <View style={styles.modePill}>
                  <Text style={styles.modePillText}>{modeLabel}</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.editBtn} onPress={() => setEditOpen(true)}>
              <Icon name="scale" size={16} color={colors.bg} />
              <Text style={styles.editBtnText}>Edit profile & goal</Text>
            </Pressable>

            <Pressable style={styles.signOut} onPress={() => setConfirmOpen(true)}>
              <Icon name="arrowR" size={16} color={colors.warn} />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.placeholder}>Not signed in.</Text>
        )}
      </ScrollView>

      <EditProfileSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        goal={goal}
        onSave={updateGoal}
      />

      <Sheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out?"
        scroll={false}
        footer={confirmFooter}
      >
        <Text style={styles.confirmBody}>
          You'll need to sign back in to sync your logs, goals, and weight history.
        </Text>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing['2xl'], paddingBottom: 120 },
  flexShrink: { flexShrink: 1 },
  alignEnd: { alignItems: 'flex-end' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.xl },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '600', color: colors.ink },
  name: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.ink },
  email: { fontSize: fontSizes.body, color: colors.ink3, marginTop: 2 },
  placeholder: { fontSize: fontSizes.body, color: colors.ink3 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  cardHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
  },
  estimate: { fontSize: 11, color: colors.warn },
  kcal: { fontSize: 40, fontWeight: '600', color: colors.ink, marginTop: 6 },
  kcalUnit: { fontSize: 16, fontWeight: '400', color: colors.ink3 },
  macroRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  macroTile: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  macroVal: { fontSize: 20, fontWeight: '600' },
  macroLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  weightNum: { fontSize: 28, fontWeight: '600', color: colors.ink },
  weightCap: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },
  modePill: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
  },
  modePillText: { fontSize: 12, fontWeight: '500', color: colors.ink2 },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    marginBottom: spacing.md,
  },
  editBtnText: { fontSize: fontSizes.base, fontWeight: '600', color: colors.bg },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
    backgroundColor: colors.surface,
  },
  signOutText: { fontSize: fontSizes.base, fontWeight: '500', color: colors.warn },
  confirmBody: {
    fontSize: fontSizes.base,
    color: colors.ink2,
    lineHeight: 22,
    paddingVertical: spacing.sm,
  },
  btn: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: { backgroundColor: colors.surface2 },
  btnGhostText: { color: colors.ink2, fontWeight: '500', fontSize: fontSizes.base },
  btnDanger: { backgroundColor: colors.warn },
  btnDangerText: { color: '#fff', fontWeight: '600', fontSize: fontSizes.base },
});
