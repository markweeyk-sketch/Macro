// @macro/core/theme — shared design tokens (framework-agnostic, no platform deps)
//
// Single source of truth for colors, spacing, radii, and type scale, mirrored
// from the web `styles.css` :root + theme palettes. Both web and React Native
// reference these so the two platforms stay visually in sync, and so the future
// universal codebase has one token module to draw from. Keep this file free of
// `react-native`, DOM, or any platform import.

// ─── Theme color palettes (mirrors styles.css :root + [data-theme=*]) ────────
// Each theme is pushed to a strong, unmistakable identity — a warm editorial
// cream, a true-black high-contrast graphite, a sun-bleached citrus, and a deep
// ocean marine — so switching is dramatic, not cosmetic. Two lights, two darks.
export const themes = {
  // Bone — warm editorial cream. The signature light theme.
  bone: {
    bg:         '#F6F2E9',
    surface:    '#FFFFFF',
    surface2:   '#EDE7D9',
    ink:        '#1B1A16',
    ink2:       '#4C4840',
    ink3:       '#8A8477',
    line:       'rgba(27, 26, 22, 0.08)',
    line2:      'rgba(27, 26, 22, 0.15)',
    accent:     '#5C7A3E',
    accentSoft: '#AFCB86',
    warn:       '#C4622F',
    pColor:     '#BE6F3E',
    cColor:     '#5F8B41',
    fColor:     '#C79A34',
  },
  // Graphite — true dark, high contrast, lime accent. Muted inks are lifted so
  // meta text stays legible on near-black (the old #6F6A60 was too faint).
  graphite: {
    bg:         '#0E0E12',
    surface:    '#191920',
    surface2:   '#25252E',
    ink:        '#F4F2EC',
    ink2:       '#CDC8BC',
    ink3:       '#948E80',
    line:       'rgba(255, 255, 255, 0.09)',
    line2:      'rgba(255, 255, 255, 0.17)',
    accent:     '#B7E27F',
    accentSoft: '#6E9247',
    warn:       '#E8935C',
    pColor:     '#E6A470',
    cColor:     '#B7E27F',
    fColor:     '#ECCE76',
  },
  // Citrus — bright, sun-bleached, hot orange.
  citrus: {
    bg:         '#FFF6E7',
    surface:    '#FFFFFF',
    surface2:   '#FCE8CD',
    ink:        '#2C1B0E',
    ink2:       '#5E4632',
    ink3:       '#9C8567',
    line:       'rgba(44, 27, 14, 0.09)',
    line2:      'rgba(44, 27, 14, 0.16)',
    accent:     '#E8562A',
    accentSoft: '#F4A76F',
    warn:       '#B93B1C',
    pColor:     '#E2591F',
    cColor:     '#C0871B',
    fColor:     '#977338',
  },
  // Marine — deep ocean navy, bright teal.
  marine: {
    bg:         '#0C1B24',
    surface:    '#13272F',
    surface2:   '#1D3641',
    ink:        '#EAF3F3',
    ink2:       '#B1C7C9',
    ink3:       '#7C9799',
    line:       'rgba(255, 255, 255, 0.08)',
    line2:      'rgba(255, 255, 255, 0.16)',
    accent:     '#37C2B4',
    accentSoft: '#2C8079',
    warn:       '#E8935C',
    pColor:     '#F0A57A',
    cColor:     '#5FD3C4',
    fColor:     '#E9CE7E',
  },
};

export const themeKeys = ['bone', 'graphite', 'citrus', 'marine'];
export const defaultThemeKey = 'bone';

// Swatch order matches the web THEME_PALETTES: [bg, ink, accent].
export const themeSwatches = themeKeys.reduce((acc, k) => {
  acc[k] = [themes[k].bg, themes[k].ink, themes[k].accent];
  return acc;
}, {});

// The live palette every component imports. It is a *copy* of the default
// theme (not a reference to themes[defaultThemeKey]) so applyTheme can mutate it
// in place without corrupting the source palettes. On mobile the persisted theme
// is applied via applyTheme() at boot (index.js) before any screen's
// StyleSheet.create reads these values; changing the theme re-boots the JS so
// the stylesheets rebuild against the new palette.
export const colors = { ...themes[defaultThemeKey] };

export function getTheme(key) {
  return themes[key] || themes[defaultThemeKey];
}

// Overwrite the live `colors` object in place with the given theme's palette.
// Mutation (not reassignment) is deliberate: modules already hold the `colors`
// reference, so mutating it updates every consumer that reads at render time.
export function applyTheme(key) {
  Object.assign(colors, getTheme(key));
  return colors;
}

// ─── Radii (mirrors --r-* plus the pill/sheet radii used in styles.css) ──────
export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  pill: 999,
  sheet: 28,
};

// ─── Spacing scale ───────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

// ─── Type scale (px, matching the web sizes) ─────────────────────────────────
export const fontSizes = {
  eyebrow: 11,
  caption: 12,
  body: 13,
  base: 15,
  lg: 18,
  title: 24,
  display: 32,
  hero: 56,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
};

// Font families. The web app resolves fonts via CSS (styles.css :root), so it
// does NOT import these — these values are React-Native family names, matching
// the faces bundled via expo-font in the mobile app (see packages/mobile/src/ui
// /fonts.js). Web uses Fraunces (serif / .numeric), Inter (body), JetBrains Mono
// (chart axes); these mirror that. RN ignores fontWeight on a named family, so a
// weight per family name is exposed and applied by the mobile <Text> wrapper.
export const fonts = {
  sans:          'Inter_400Regular',
  sansMedium:    'Inter_500Medium',
  sansSemibold:  'Inter_600SemiBold',
  serif:         'Fraunces_400Regular',
  serifMedium:   'Fraunces_500Medium',
  serifItalic:   'Fraunces_400Regular_Italic',
  serifMediumItalic: 'Fraunces_500Medium_Italic',
  mono:          'JetBrainsMono_400Regular',
};

export default {
  themes,
  themeKeys,
  themeSwatches,
  defaultThemeKey,
  colors,
  getTheme,
  applyTheme,
  radii,
  spacing,
  fontSizes,
  fontWeights,
  fonts,
};
