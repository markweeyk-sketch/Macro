// BottomNav.js — custom tab bar, the RN port of the web `BottomNav`
// (web/app.jsx + .bottom-nav/.bnav-item/.bnav-fab in web/styles.css):
// four labeled tabs with a 2px active indicator on top, and a raised circular
// "add" FAB in the center slot that opens the Add sheet instead of navigating.
// Hidden routes (Profile, Log) stay registered on the navigator but get no
// button here: Profile opens from the TopBar user icon, and Log — whose web
// page is a today-only meal breakdown, with no past-day navigation anywhere in
// the web app — opens from the date on the Today screen. A standalone Log tab
// would be redundant next to Today's quick-log and the add FAB, so its slot
// goes to Recipes (icon per the web sidebar).
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontWeights } from '@macro/core/theme';
import Icon from '../components/Icon';

const BAR_ITEMS = [
  { route: 'Today',    label: 'Today',    icon: 'home' },
  { route: 'Recipes',  label: 'Recipes',  icon: 'star' },
  { fab: true },
  { route: 'Plan',     label: 'Plan',     icon: 'target' },
  { route: 'Progress', label: 'Progress', icon: 'chart' },
];

export default function BottomNav({ state, navigation, onAdd }) {
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { paddingBottom: spacing.sm + insets.bottom }]}>
      {BAR_ITEMS.map((item, i) => {
        if (item.fab) {
          return (
            <Pressable
              key="fab"
              style={styles.fab}
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel="Add food"
            >
              <Icon name="plus" size={22} stroke={2} color={colors.bg} />
            </Pressable>
          );
        }
        const active = focusedName === item.route;
        const tint = active ? colors.ink : colors.ink3;
        return (
          <Pressable
            key={item.route}
            style={styles.item}
            onPress={() => navigation.navigate(item.route)}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
            accessibilityLabel={item.label}
          >
            {active && <View style={styles.activeMark} />}
            <Icon name={item.icon} size={20} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  activeMark: {
    position: 'absolute',
    top: -spacing.sm,
    width: 24,
    height: 2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.ink,
  },
  label: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.4,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
});
