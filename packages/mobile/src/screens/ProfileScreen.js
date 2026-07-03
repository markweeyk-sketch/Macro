// ProfileScreen — placeholder until the full Phase 6 migration (ProfileSheet,
// EditProfileSheet, GoalSheet, SettingsSheet, Onboarding). For now it shows the
// signed-in identity and a sign-out action. Sign-out confirms through the app's
// own bottom-sheet (Sheet primitive) rather than the OS Alert, so it matches the
// rest of the UI instead of the dated native dialog.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { auth, signOutUser } from '@macro/core/firebase';
import { colors, radii, spacing, fontSizes } from '@macro/core/theme';
import Sheet from '../components/Sheet';
import Icon from '../components/Icon';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const name = user?.displayName || user?.email || '';
  const initial = (name.trim()[0] || '?').toUpperCase();

  const confirmFooter = (
    <>
      <Pressable
        style={[styles.btn, styles.btnGhost]}
        onPress={() => setConfirmOpen(false)}
      >
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
    <View style={styles.container}>
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

          <Text style={styles.note}>
            Full profile, goals, and settings are coming as this screen finishes
            migrating from web.
          </Text>

          <Pressable style={styles.signOut} onPress={() => setConfirmOpen(true)}>
            <Icon name="arrowR" size={16} color={colors.warn} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.placeholder}>Not signed in.</Text>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing['2xl'] },
  flexShrink: { flexShrink: 1 },
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
  note: {
    fontSize: fontSizes.body,
    color: colors.ink3,
    lineHeight: 20,
    marginBottom: spacing['2xl'],
  },
  placeholder: { fontSize: fontSizes.body, color: colors.ink3 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
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
