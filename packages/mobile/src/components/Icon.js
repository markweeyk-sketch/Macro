// Icon.js — monoline stroke icon set, ported 1:1 from the web `Icon`
// (web/screens.jsx). Same names, same 24x24 paths, re-rendered with
// react-native-svg. `color` replaces the web's `currentColor`.
import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '@macro/core/theme';

const PATHS = {
  home: (k) => <Path key={k} d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" />,
  plus: (k) => (
    <G key={k}>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </G>
  ),
  search: (k) => (
    <G key={k}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-3.5-3.5" />
    </G>
  ),
  book: (k) => <Path key={k} d="M4 4h11a4 4 0 0 1 4 4v12H7a3 3 0 0 1-3-3V4z M4 17h15" />,
  chart: (k) => (
    <G key={k}>
      <Path d="M4 20V10" />
      <Path d="M10 20V4" />
      <Path d="M16 20v-7" />
      <Path d="M22 20H2" />
    </G>
  ),
  user: (k) => (
    <G key={k}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </G>
  ),
  settings: (k) => (
    <G key={k}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.9l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </G>
  ),
  barcode: (k) => (
    <G key={k}>
      <Path d="M3 5v14" />
      <Path d="M7 5v14" />
      <Path d="M11 5v14" />
      <Path d="M15 5v14" />
      <Path d="M19 5v14" />
      <Path d="M21 5v14" />
    </G>
  ),
  camera: (k) => (
    <G key={k}>
      <Path d="M3 7h4l2-3h6l2 3h4v12H3V7z" />
      <Circle cx="12" cy="13" r="4" />
    </G>
  ),
  close: (k) => (
    <G key={k}>
      <Path d="M6 6l12 12" />
      <Path d="M18 6L6 18" />
    </G>
  ),
  chevron: (k) => <Path key={k} d="M9 6l6 6-6 6" />,
  flame: (k) => <Path key={k} d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C7.5 11 8 13.5 8 14a4 4 0 0 0 4 4 4 4 0 0 0 4-4c0-3-2-5-4-7-1-1-1-2 0-4z" />,
  bolt: (k) => <Path key={k} d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  target: (k) => (
    <G key={k}>
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="5" />
      <Circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </G>
  ),
  check: (k) => <Path key={k} d="M5 13l4 4L19 7" />,
  pencil: (k) => (
    <G key={k}>
      <Path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" />
      <Path d="M14.5 5.5l4 4" />
    </G>
  ),
  minus: (k) => <Path key={k} d="M5 12h14" />,
  arrowR: (k) => (
    <G key={k}>
      <Path d="M5 12h14" />
      <Path d="M13 6l6 6-6 6" />
    </G>
  ),
  star: (k) => <Path key={k} d="M12 3l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-6.5L3 10l6-1z" />,
  drop: (k) => <Path key={k} d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  foot: (k) => <Path key={k} d="M7 16c0 2 2 4 4 4s4-2 4-4c0-1-1-2-2-3-1-1-2-2-2-4 0-2-1-4-3-4S5 7 5 10c0 2 2 4 2 6z" />,
  scale: (k) => (
    <G key={k}>
      <Path d="M3 7h18l-2 13H5L3 7z" />
      <Path d="M9 7a3 3 0 0 1 6 0" />
    </G>
  ),
};

export default function Icon({ name, size = 18, stroke = 1.6, color = colors.ink }) {
  const render = PATHS[name];
  if (!render) return null;
  // The `target` icon uses a filled center dot; map its literal 'currentColor'
  // fill to the active color by passing fill at the Svg level too.
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      color={color}
    >
      {render('icon')}
    </Svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
