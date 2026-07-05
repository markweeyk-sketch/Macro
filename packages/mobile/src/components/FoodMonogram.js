// FoodMonogram — a colored initial-letter tile that stands in for a food or
// recipe icon, replacing the old hand-typed emoji (no more hunting the keyboard
// for a glyph). The tint is driven by the food's dominant macro so items read
// at a glance, and because it uses the active theme's macro colors, the icon
// follows whatever theme is applied.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/type';
import { colors, fonts } from '@macro/core/theme';

// hex (#RRGGBB) → rgba() at the given alpha, for a soft tile fill. Non-hex
// inputs (already-rgba tokens) pass through unchanged.
function tint(hex, a) {
  const h = String(hex).replace('#', '');
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// The category color for a food: whichever macro contributes the most calories
// (protein/carb ×4, fat ×9). Falls back to a neutral ink for zero-macro items.
export function foodColor(food) {
  const { p = 0, c = 0, f = 0 } = food?.per100 || {};
  const pc = p * 4;
  const cc = c * 4;
  const fc = f * 9;
  const max = Math.max(pc, cc, fc);
  if (max <= 0) return colors.ink3;
  if (fc === max) return colors.fColor;
  if (pc === max) return colors.pColor;
  return colors.cColor;
}

export default function FoodMonogram({ food, label, color, size = 40, style }) {
  const c = color || foodColor(food);
  const src = String(label ?? food?.name ?? '').trim();
  const letter = src ? src.charAt(0).toUpperCase() : '?';
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          backgroundColor: tint(c, 0.18),
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: c, fontFamily: fonts.serifMedium, fontSize: Math.round(size * 0.44) }}>
        {letter}
      </Text>
    </View>
  );
}
