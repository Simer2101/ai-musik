import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useSettings } from '@/providers/SettingsProvider';

function mix(from: string, to: string, amount: number) {
  const parse = (hex: string) => {
    const value = hex.replace('#', '');
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ] as const;
  };
  const a = parse(from);
  const b = parse(to);
  const channel = (index: number) => Math.round(a[index] + (b[index] - a[index]) * amount);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

export function ScreenBackdrop({ children }: { children: ReactNode }) {
  const { colors } = useSettings();
  const tint = mix(colors.hero, colors.bg, 0.42);
  const wash = mix(colors.hero, colors.bg, 0.68);
  const fade = mix(colors.hero, colors.bg, 0.86);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <LinearGradient
        pointerEvents="none"
        dither
        colors={[tint, wash, fade, colors.bg, colors.bg]}
        locations={[0, 0.22, 0.48, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
