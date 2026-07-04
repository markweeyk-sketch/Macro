// ProfileScreen — Phase 6 (Profile & Settings). Consolidates the web
// ProfileSheet + GoalSheet + EditProfileSheet + the account/data parts of
// SettingsSheet into one native screen: signed-in identity, the current daily
// target (kcal + macros) and weight goal, a full profile/goal editor
// (EditProfileSheet, which recomputes via calcGoal), account settings (email,
// password reset), a destructive reset-all-data action, and sign-out through
// the app's own bottom-sheet confirm instead of the dated OS Alert.
//
// The web SettingsSheet's appearance/tweaks (theme, dashboard layout) are
// intentionally dropped on mobile; the multi-step OnboardingSheet is deferred —
// the editor here does first-run goal setup (a default goal works until then).
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { auth, signOutUser, sendPasswordReset } from '@macro/core/firebase';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import { useMacroData } from '../state/MacroData';
import Sheet from '../components/Sheet';
import EditProfileSheet from '../components/EditProfileSheet';
import Icon from '../components/Icon';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const { goal, weights, updateGoal, resetAccountData } = useMacroData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [resetStep, setResetStep] = useState(0); // 0 = idle, 1 = confirm

  const name = user?.displayName || user?.email || '';
  const initial = (name.trim()[0] || '?').toUpperCase();
  const isEmailUser = user?.providerData?.some((p) => p.providerId === 'password');

  const sendReset = async () => {
    try {
      await sendPasswordReset(user.email);
      setPwMsg('Reset email sent');
    } catch {
      setPwMsg('Could not send reset email');
    }
  };

  const handleReset = async () => {
    await resetAccountData();
    setResetStep(0);
  };

  const currentKg =
    weights && weights.length > 0 ? weights[weights.length - 1].weight : goal.currentKg;
  const modeLabel =
    goal.mode === 'lose' ? 'Losing' : goal.mode === 'gain' ? 'Gaining' : 'Maintaining';

  const macros = [
    { label: 'Protein', v: goal.protein, c: colors.pColor },
    { label: 'Carbs', v: goal.carbs, c: colors.cColor },
    { label: 'Fat', v: goal.fat, c: colors.fColor },
  ];

  // Save the edited goal, but re-anchor the "start" weight to the entered
  // current weight until there's real weigh-in history — otherwise Progress
  // measures change against the default start set when the account was created.
  const handleSaveGoal = (nextGoal) => {
    const startKg = weights && weights.length > 0 ? nextGoal.startKg : nextGoal.currentKg;
    updateGoal({ ...nextGoal, startKg });
  };

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
              <View style={styles.cardHd}>
                <Text style={styles.eyebrow}>Weight goal</Text>
                <View style={styles.modePill}>
                  <Text style={styles.modePillText}>{modeLabel}</Text>
                </View>
              </View>
              <View style={styles.weightRow}>
                <View>
                  <Text style={styles.weightNum}>{currentKg}</Text>
                  <Text style={styles.weightCap}>current kg</Text>
                </View>
                <Icon name="arrowR" size={18} color={colors.ink3} />
                <View>
                  <Text style={styles.weightNum}>{goal.weightKg}</Text>
                  <Text style={styles.weightCap}>target kg</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.editBtn} onPress={() => setEditOpen(true)}>
              <Icon name="scale" size={16} color={colors.bg} />
              <Text style={styles.editBtnText}>Edit profile & goal</Text>
            </Pressable>

            <Text style={styles.sectionEyebrow}>Account</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.flexShrink}>
                  <Text style={styles.settingLabel}>Email</Text>
                  <Text style={styles.settingSub} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>
              {isEmailUser && (
                <Pressable
                  style={[styles.settingRow, styles.settingRowDivider]}
                  onPress={sendReset}
                >
                  <View style={styles.flexShrink}>
                    <Text style={styles.settingLabel}>{pwMsg || 'Reset password'}</Text>
                    {!pwMsg && (
                      <Text style={styles.settingSub}>Send a reset link to your inbox</Text>
                    )}
                  </View>
                  {!pwMsg && <Icon name="arrowR" size={16} color={colors.ink3} />}
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionEyebrow}>Data</Text>
            <View style={styles.settingsCard}>
              {resetStep === 0 ? (
                <Pressable style={styles.settingRow} onPress={() => setResetStep(1)}>
                  <View style={styles.flexShrink}>
                    <Text style={[styles.settingLabel, { color: colors.warn }]}>
                      Reset account data
                    </Text>
                    <Text style={styles.settingSub}>
                      Delete all logs, plans, recipes & goal
                    </Text>
                  </View>
                  <Icon name="close" size={16} color={colors.warn} />
                </Pressable>
              ) : (
                <View style={styles.confirmInline}>
                  <Text style={styles.confirmTitle}>Are you sure?</Text>
                  <Text style={styles.confirmSub}>
                    This permanently deletes all your food logs, meal plans, recipes, and
                    goal data. This cannot be undone.
                  </Text>
                  <View style={styles.confirmRow}>
                    <Pressable
                      style={[styles.btn, styles.btnGhost]}
                      onPress={() => setResetStep(0)}
                    >
                      <Text style={styles.btnGhostText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleReset}>
                      <Text style={styles.btnDangerText}>Delete everything</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

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
        onSave={handleSaveGoal}
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
  kcal: { fontSize: 40, fontFamily: fonts.serifMedium, color: colors.ink, marginTop: 6 },
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
  weightNum: { fontSize: 28, fontFamily: fonts.serifMedium, color: colors.ink },
  weightCap: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
    marginTop: 2,
  },
  modePill: {
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

  sectionEyebrow: {
    fontSize: fontSizes.eyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.ink3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingHorizontal: 16,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
  },
  settingRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  settingLabel: { fontSize: fontSizes.base, fontWeight: '500', color: colors.ink },
  settingSub: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  confirmInline: { paddingVertical: 16 },
  confirmTitle: { fontSize: 14, fontWeight: '600', color: colors.warn, marginBottom: 6 },
  confirmSub: { fontSize: 12, color: colors.ink2, lineHeight: 19, marginBottom: 14 },
  confirmRow: { flexDirection: 'row', gap: 8 },

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
