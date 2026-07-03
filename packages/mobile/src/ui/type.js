// type.js — drop-in <Text>/<TextInput> replacements that apply the bundled
// Inter faces. React Native ignores `fontWeight` when a named font family is
// set, so we map the style's fontWeight to the matching Inter family name.
//
// If a style already sets an explicit `fontFamily` (e.g. a Fraunces serif
// heading or the JetBrains Mono chart ticks), we leave it untouched — that
// family wins. Everything else becomes Inter at the right weight.
import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { fonts } from '@macro/core/theme';

function interFamily(style) {
  const flat = StyleSheet.flatten(style);
  if (flat && flat.fontFamily) return null; // explicit family already chosen
  const w = flat && flat.fontWeight;
  if (w === '600' || w === '700' || w === '800' || w === '900' || w === 'bold') {
    return fonts.sansSemibold;
  }
  if (w === '500') return fonts.sansMedium;
  return fonts.sans;
}

export const Text = React.forwardRef(function Text({ style, ...props }, ref) {
  const fam = interFamily(style);
  return <RNText ref={ref} {...props} style={fam ? [{ fontFamily: fam }, style] : style} />;
});

export const TextInput = React.forwardRef(function TextInput({ style, ...props }, ref) {
  const fam = interFamily(style);
  return <RNTextInput ref={ref} {...props} style={fam ? [{ fontFamily: fam }, style] : style} />;
});
