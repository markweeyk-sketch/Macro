// @macro/core/theme — shared design tokens (framework-agnostic, no platform deps)
//
// Single source of truth for colors, spacing, radii, and type scale, mirrored
// from the web `styles.css` :root + theme palettes. Both web and React Native
// reference these so the two platforms stay visually in sync, and so the future
// universal codebase has one token module to draw from. Keep this file free of
// `react-native`, DOM, or any platform import.

// ─── Theme color palettes (mirrors styles.css :root + [data-theme=*]) ────────
export const themes = {
  bone: {
    bg:         '#F7F4EE',
    surface:    '#FFFFFF',
    surface2:   '#F0ECE3',
    ink:        '#1A1916',
    ink2:       '#4A4742',
    ink3:       '#8A857B',
    line:       'rgba(26, 25, 22, 0.08)',
    line2:      'rgba(26, 25, 22, 0.14)',
    accent:     '#5C7A3E',
    accentSoft: '#A8C97F',
    warn:       '#C66A3A',
    pColor:     '#B8754A',
    cColor:     '#6B8E4E',
    fColor:     '#C9A24A',
  },
  graphite: {
    bg:         '#161513',
    surface:    '#1F1E1B',
    surface2:   '#28261F',
    ink:        '#F2EFE8',
    ink2:       '#B8B3A6',
    ink3:       '#6F6A60',
    line:       'rgba(255,255,255,0.08)',
    line2:      'rgba(255,255,255,0.14)',
    accent:     '#A8C97F',
    accentSoft: '#5C7A3E',
    warn:       '#E08B5C',
    pColor:     '#D89770',
    cColor:     '#A8C97F',
    fColor:     '#E0C277',
  },
  citrus: {
    bg:         '#FBF7EF',
    surface:    '#FFFFFF',
    surface2:   '#F2EBDB',
    ink:        '#2A1F12',
    ink2:       '#5A4A38',
    ink3:       '#968673',
    line:       'rgba(26, 25, 22, 0.08)',
    line2:      'rgba(26, 25, 22, 0.14)',
    accent:     '#D9633A',
    accentSoft: '#F2A878',
    warn:       '#B8442C',
    pColor:     '#D9633A',
    cColor:     '#C99A3A',
    fColor:     '#8A7448',
  },
  marine: {
    bg:         '#EFF1F2',
    surface:    '#FFFFFF',
    surface2:   '#E1E5E8',
    ink:        '#1A2228',
    ink2:       '#4A5560',
    ink3:       '#8893A0',
    line:       'rgba(26, 25, 22, 0.08)',
    line2:      'rgba(26, 25, 22, 0.14)',
    accent:     '#1F6B6B',
    accentSoft: '#6FB0AC',
    warn:       '#C66A3A',
    pColor:     '#1F6B6B',
    cColor:     '#5A8B9C',
    fColor:     '#C9A24A',
  },
};

export const themeKeys = ['bone', 'graphite', 'citrus', 'marine'];
export const defaultThemeKey = 'bone';

// Swatch order matches the web THEME_PALETTES: [bg, ink, accent].
export const themeSwatches = themeKeys.reduce((acc, k) => {
  acc[k] = [themes[k].bg, themes[k].ink, themes[k].accent];
  return acc;
}, {});

// Default palette for components that don't switch themes yet.
export const colors = themes[defaultThemeKey];

export function getTheme(key) {
  return themes[key] || themes[defaultThemeKey];
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

// Font families. On web these resolve to the loaded webfonts; on RN they fall
// back to the system font unless the fonts are bundled via expo-font later.
export const fonts = {
  serif: "'Fraunces', Georgia, serif",
  sans:  "'Inter', system-ui, sans-serif",
  mono:  "'JetBrains Mono', ui-monospace, monospace",
};

export default {
  themes,
  themeKeys,
  themeSwatches,
  defaultThemeKey,
  colors,
  getTheme,
  radii,
  spacing,
  fontSizes,
  fontWeights,
  fonts,
};
