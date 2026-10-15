import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
} from '@expo-google-fonts/onest';
import { Unbounded_500Medium, Unbounded_700Bold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import type { TextStyle } from 'react-native';

/** Every font file the app loads at startup. */
export const FONT_FILES = {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
  Unbounded_500Medium,
  Unbounded_700Bold,
  Unbounded_800ExtraBold,
};

type Weight = NonNullable<TextStyle['fontWeight']>;

function weightNumber(weight: Weight | undefined) {
  if (weight === undefined || weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  const value = Number(weight);
  return Number.isFinite(value) ? value : 400;
}

/** Body text: Onest, picked by weight so native platforms get the right file. */
export function bodyFamily(weight?: Weight) {
  const value = weightNumber(weight);
  if (value >= 800) return 'Onest_800ExtraBold';
  if (value >= 700) return 'Onest_700Bold';
  if (value >= 600) return 'Onest_600SemiBold';
  if (value >= 500) return 'Onest_500Medium';
  return 'Onest_400Regular';
}

/** Display text (logo, headings): Unbounded. */
export function displayFamily(weight?: Weight) {
  const value = weightNumber(weight);
  if (value >= 800) return 'Unbounded_800ExtraBold';
  if (value >= 600) return 'Unbounded_700Bold';
  return 'Unbounded_500Medium';
}

export const fonts = {
  display: (weight: Weight = '700'): TextStyle => ({ fontFamily: displayFamily(weight), fontWeight: 'normal' }),
};
