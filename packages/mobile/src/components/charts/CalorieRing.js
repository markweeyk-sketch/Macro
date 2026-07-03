// CalorieRing.js — RN port of the web `CalorieRing` (web/screens.jsx). Same
// stroke-dash arc math and proportions, re-drawn with react-native-svg. The arc
// starts at 12 o'clock (rotated -90°, like the web CSS) and turns warn-colored
// when a "lose" goal is exceeded.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../ui/type';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, fonts } from '@macro/core/theme';

export default function CalorieRing({
  consumed,
  goal,
  size = 200,
  thickness = 14,
  mode = 'lose',
  onPress,
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(consumed / goal, 1.15));
  const remaining = goal - consumed;
  const overGoal = mode === 'lose' && remaining < 0;
  const Wrap = onPress ? Pressable : View;

  return (
    <Wrap onPress={onPress} style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          stroke={colors.surface2}
          strokeLinecap="round"
        />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={thickness}
            stroke={overGoal ? colors.warn : colors.ink}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - c * pct}
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.eyebrow}>{remaining >= 0 ? 'Remaining' : 'Over'}</Text>
        <Text style={styles.big}>{Math.abs(Math.round(remaining))}</Text>
        <Text style={styles.sub}>
          {Math.round(consumed)} / {goal} kcal
        </Text>
      </View>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.ink3,
  },
  big: {
    fontSize: 56,
    lineHeight: 60,
    fontFamily: fonts.serifMedium,
    color: colors.ink,
    marginTop: 4,
  },
  sub: { fontSize: 12, color: colors.ink3, marginTop: 6 },
});
