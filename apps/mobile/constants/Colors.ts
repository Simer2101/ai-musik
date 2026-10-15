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
    bg: '#0b0b0d',
    card: '#16161a',
    cardAlt: '#1d1d22',
    text: '#f3f3f0',
    muted: '#8e8e96',
    accent: '#c6f432',
    accent2: '#c6f432',
    danger: '#ff6b81',
    border: '#232328',
    success: '#c6f432',
    buttonText: '#0b0b0d',
    hero: '#121215',
  },
  light: {
    bg: '#f4f4f1',
    card: '#ffffff',
    cardAlt: '#e9e9e4',
    text: '#111113',
    muted: '#62626a',
    accent: '#3f6212',
    accent2: '#3f6212',
    danger: '#be123c',
    border: '#e1e1db',
    success: '#3f6212',
    buttonText: '#ffffff',
    hero: '#ebebe6',
  },
};

type Surface = Pick<ThemeColors, 'bg' | 'card' | 'cardAlt' | 'border' | 'hero'>;

// Surfaces only retune the backgrounds; text and accents stay the same in every variant.
// Every tone is a near-black neutral, teal or green so it sits well next to the lime accent.
// The ids are kept from earlier palettes so saved settings still load.
const SURFACES: Record<BackgroundId, Record<ThemeName, Surface>> = {
  classic: {
    dark: { bg: '#0b0b0d', card: '#16161a', cardAlt: '#1d1d22', border: '#232328', hero: '#121215' },
    light: { bg: '#f4f4f1', card: '#ffffff', cardAlt: '#e9e9e4', border: '#e1e1db', hero: '#ebebe6' },
  },
  graphite: {
    dark: { bg: '#131313', card: '#1d1d1d', cardAlt: '#262626', border: '#303030', hero: '#181818' },
    light: { bg: '#f1f1ef', card: '#ffffff', cardAlt: '#e4e4e1', border: '#d9d9d5', hero: '#e8e8e5' },
  },
  ocean: {
    dark: { bg: '#071114', card: '#0e1c20', cardAlt: '#15282d', border: '#1d353b', hero: '#0b181b' },
    light: { bg: '#eef4f5', card: '#ffffff', cardAlt: '#dfeaec', border: '#d3e1e4', hero: '#e4eef0' },
  },
  plum: {
    dark: { bg: '#09110c', card: '#111c15', cardAlt: '#18271d', border: '#213427', hero: '#0d1711' },
    light: { bg: '#f0f4ee', card: '#ffffff', cardAlt: '#e1eadd', border: '#d5e0d0', hero: '#e7eee4' },
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
