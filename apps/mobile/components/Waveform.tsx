import { Pressable, StyleSheet, View } from 'react-native';

import { useSettings } from '@/providers/SettingsProvider';

const BARS = [10, 18, 12, 26, 16, 32, 20, 28, 11, 30, 17, 24, 9, 31, 14, 27, 19, 22, 13, 29, 15, 21, 12, 25, 18, 33, 14, 23];

export function Waveform({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (ratio: number) => void;
}) {
  const { colors } = useSettings();
  const played = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.row}>
      {BARS.map((height, index) => {
        const ratio = (index + 0.5) / BARS.length;
        const active = ratio <= played;
        return (
          <Pressable key={`${height}-${index}`} onPress={() => onSeek(ratio)} style={styles.hit}>
            <View
              style={{
                width: 3,
                height,
                borderRadius: 2,
                backgroundColor: active ? colors.accent : colors.cardAlt,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 40,
    width: '100%',
  },
  hit: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
});
