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
  // Black and white with a soft blue accent and a soft violet second accent.
  dark: {
    bg: '#0a0a0c',
    card: '#141418',
    cardAlt: '#1b1b21',
    text: '#f5f5f7',
    muted: '#8f8f9a',
    accent: '#9cc9ff',
    accent2: '#c3b4ff',
    danger: '#ff6b81',
    border: '#24242b',
    success: '#c3b4ff',
    buttonText: '#0a0a0c',
    hero: '#111115',
  },
  light: {
    bg: '#f6f6f8',
    card: '#ffffff',
    cardAlt: '#ececf1',
    text: '#111114',
    muted: '#63636d',
    accent: '#2d63c8',
    accent2: '#6e52d6',
    danger: '#be123c',
    border: '#e2e2e8',
    success: '#6e52d6',
    buttonText: '#ffffff',
    hero: '#ededf2',
  },
};

/** Blends two #rrggbb colours; t = 0 gives `from`, t = 1 gives `to`. */
export function mixHex(from: string, to: string, t: number) {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const channel = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}

type Surface = Pick<ThemeColors, 'bg' | 'card' | 'cardAlt' | 'border' | 'hero'>;

// Surfaces only retune the backgrounds; text and accents stay the same in every variant.
// Every tone is a near-black neutral, indigo or violet so it sits well with the blue and violet accents.
// The ids are kept from earlier palettes so saved settings still load.
const SURFACES: Record<BackgroundId, Record<ThemeName, Surface>> = {
  classic: {
    dark: { bg: '#0a0a0c', card: '#141418', cardAlt: '#1b1b21', border: '#24242b', hero: '#111115' },
    light: { bg: '#f6f6f8', card: '#ffffff', cardAlt: '#ececf1', border: '#e2e2e8', hero: '#ededf2' },
  },
  graphite: {
    dark: { bg: '#131315', card: '#1d1d20', cardAlt: '#26262a', border: '#303035', hero: '#18181b' },
    light: { bg: '#f1f1f3', card: '#ffffff', cardAlt: '#e4e4e8', border: '#d9d9de', hero: '#e8e8ec' },
  },
  ocean: {
    dark: { bg: '#090c15', card: '#111628', cardAlt: '#182036', border: '#202a44', hero: '#0d1120' },
    light: { bg: '#f1f4fb', card: '#ffffff', cardAlt: '#e3e9f6', border: '#d7dff0', hero: '#e8edf8' },
  },
  plum: {
    dark: { bg: '#0d0a15', card: '#161226', cardAlt: '#1e1833', border: '#2a2242', hero: '#120e1e' },
    light: { bg: '#f5f2fb', card: '#ffffff', cardAlt: '#ebe5f7', border: '#e0d8f0', hero: '#efeaf8' },
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
