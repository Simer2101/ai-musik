import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PLAYER_HEIGHT, useDesktop } from '@/lib/layout';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';

// Flat page background; on desktop the screen sits in a rounded panel beside the sidebar.
export function ScreenBackdrop({ children }: { children: ReactNode }) {
  const { colors } = useSettings();
  const desktop = useDesktop();
  const { track } = usePlayer();

  if (!desktop) {
    return <View style={[styles.screen, { backgroundColor: colors.bg }]}>{children}</View>;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.hero, marginBottom: track ? PLAYER_HEIGHT + 16 : 8 },
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  panel: { flex: 1, margin: 8, borderRadius: 20, overflow: 'hidden' },
});
