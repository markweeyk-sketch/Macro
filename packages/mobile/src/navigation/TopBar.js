// TopBar.js — custom navigator header, the RN port of the web mobile `TopBar`
// (web/app.jsx + .topbar/.brand-mark/.icon-btn in web/styles.css): brand mark +
// serif page title on the left, profile button on the right. On the routes the
// bottom bar doesn't show (Profile, Log) the right button becomes a close
// that returns to Today.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes } from '@macro/core/theme';
import Icon from '../components/Icon';

// Mirrors the web TopBar `titles` map.
const TITLES = {
  Today:    'Today',
  Log:      'Food log',
  Plan:     'Meal plan',
  Recipes:  'Recipes',
  Progress: 'Progress',
  Profile:  'Profile',
};

const serif = Platform.select({ ios: 'Georgia', default: 'serif' });

export default function TopBar({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const offBarRoute = route.name === 'Profile' || route.name === 'Log';

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>M</Text>
        </View>
        <Text style={styles.title}>{TITLES[route.name] ?? route.name}</Text>
      </View>
      <Pressable
        style={styles.iconBtn}
        onPress={() =>
          offBarRoute ? navigation.navigate('Today') : navigation.navigate('Profile')
        }
        accessibilityRole="button"
        accessibilityLabel={offBarRoute ? 'Close' : 'Profile'}
        hitSlop={8}
      >
        <Icon name={offBarRoute ? 'close' : 'user'} size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: colors.bg,
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 18,
  },
  title: {
    fontFamily: serif,
    fontSize: fontSizes.lg,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
});
