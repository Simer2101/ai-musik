export type ThemeName = 'dark' | 'light';
export type BackgroundId = 'classic' | 'graphite' | 'ocean' | 'plum';

export type ThemeColors = {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  danger: string;
  border: string;
  success: string;
  buttonText: string;
  hero: string;
};

export const palettes: Record<ThemeName, ThemeColors> = {
  dark: {
    bg: '#09090f',
    card: '#14141c',
    cardAlt: '#1c1c28',
    text: '#f4f4f8',
    muted: '#9b9baf',
    accent: '#8b7cff',
    accent2: '#3ee0c0',
    danger: '#ff6b81',
    border: '#262636',
    success: '#3ee0c0',
    buttonText: '#09090f',
    hero: '#14121f',
  },
  light: {
    bg: '#f6f5fb',
    card: '#ffffff',
    cardAlt: '#eceaf6',
    text: '#12121a',
    muted: '#6b6b7d',
    accent: '#6d5efc',
    accent2: '#0f9f86',
    danger: '#be123c',
    border: '#e4e2ef',
    success: '#0f9f86',
    buttonText: '#ffffff',
    hero: '#ece8fa',
  },
};

type Surface = Pick<ThemeColors, 'bg' | 'card' | 'cardAlt' | 'border' | 'hero'>;

// Surfaces only retune the backgrounds; text and accents stay the same in every variant.
const SURFACES: Record<BackgroundId, Record<ThemeName, Surface>> = {
  classic: {
    dark: { bg: '#09090f', card: '#14141c', cardAlt: '#1c1c28', border: '#262636', hero: '#14121f' },
    light: { bg: '#f6f5fb', card: '#ffffff', cardAlt: '#eceaf6', border: '#e4e2ef', hero: '#ece8fa' },
  },
  graphite: {
    dark: { bg: '#101014', card: '#1a1a20', cardAlt: '#24242c', border: '#2e2e38', hero: '#1a1a22' },
    light: { bg: '#f1f2f5', card: '#ffffff', cardAlt: '#e5e7ec', border: '#dee1e7', hero: '#e8eaee' },
  },
  ocean: {
    dark: { bg: '#070d18', card: '#101a2b', cardAlt: '#182538', border: '#20304a', hero: '#0c1524' },
    light: { bg: '#eef5fc', card: '#ffffff', cardAlt: '#e0ebf7', border: '#d6e3f1', hero: '#e4eef8' },
  },
  plum: {
    dark: { bg: '#0d0714', card: '#180f24', cardAlt: '#221533', border: '#2d1d42', hero: '#160e20' },
    light: { bg: '#f8f2fb', card: '#ffffff', cardAlt: '#f0e6f7', border: '#e8dcf0', hero: '#f3eaf8' },
  },
};

export const BACKGROUND_IDS: BackgroundId[] = ['classic', 'graphite', 'ocean', 'plum'];

export function buildColors(themeName: ThemeName, background: BackgroundId): ThemeColors {
  return { ...palettes[themeName], ...SURFACES[background][themeName] };
}

export const theme = palettes.dark;

export default {
  light: {
    text: palettes.light.text,
    background: palettes.light.bg,
    tint: palettes.light.accent,
    tabIconDefault: palettes.light.muted,
    tabIconSelected: palettes.light.accent,
  },
  dark: {
    text: palettes.dark.text,
    background: palettes.dark.bg,
    tint: palettes.dark.accent,
    tabIconDefault: palettes.dark.muted,
    tabIconSelected: palettes.dark.accent,
  },
};
