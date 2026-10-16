import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/AppText';
import { formatClock } from '@/lib/cover';
import { useSettings } from '@/providers/SettingsProvider';

const BARS = [6, 11, 7, 15, 9, 18, 12, 16, 6, 17, 10, 14, 5, 18, 8, 16, 11, 13, 8, 17, 9, 12, 7, 15, 11, 19, 8, 13];
const STEP_MS = 10000;
/** Bar plus gap, in px: the bar count follows the width so the wave stays dense. */
const PITCH = 8;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Waveform seek bar: tap anywhere or drag to scrub. While dragging, the bars and the
 * clock follow the finger and the track only seeks on release, so playback never stutters.
 * `inline` puts the clocks either side of the bars (desktop player), otherwise they sit below.
 */
export function Waveform({
  positionMs,
  durationMs,
  onSeek,
  inline = false,
}: {
  positionMs: number;
  durationMs: number;
  onSeek: (ms: number) => void;
  inline?: boolean;
}) {
  const { colors } = useSettings();
  const width = useRef(0);
  const left = useRef(0);
  const [count, setCount] = useState(BARS.length);
  const [scrub, setScrub] = useState<number | null>(null);

  const progress = scrub ?? (durationMs > 0 ? clamp(positionMs / durationMs) : 0);
  const shownMs = scrub === null ? positionMs : scrub * durationMs;

  // pageX stays in one coordinate space while the finger moves, even off the bar, so the
  // bar's left edge is worked out once on touch-down and reused for every move.
  const ratioAt = (event: GestureResponderEvent) =>
    width.current > 0 ? clamp((event.nativeEvent.pageX - left.current) / width.current) : 0;

  const begin = (event: GestureResponderEvent) => {
    left.current = event.nativeEvent.pageX - event.nativeEvent.locationX;
    setScrub(ratioAt(event));
  };
  const move = (event: GestureResponderEvent) => setScrub(ratioAt(event));
  const end = (event: GestureResponderEvent) => {
    const ratio = ratioAt(event);
    setScrub(null);
    if (durationMs > 0) onSeek(ratio * durationMs);
  };

  const step = (direction: number) => {
    if (durationMs > 0) onSeek(Math.min(durationMs, Math.max(0, positionMs + direction * STEP_MS)));
  };

  const bars = (
    <View
      style={[styles.bars, inline && styles.barsInline]}
      onLayout={(event: LayoutChangeEvent) => {
        width.current = event.nativeEvent.layout.width;
        setCount(Math.max(12, Math.floor(width.current / PITCH)));
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={begin}
      onResponderMove={move}
      onResponderRelease={end}
      onResponderTerminate={() => setScrub(null)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Перемотка"
      accessibilityValue={{ min: 0, max: Math.round(durationMs / 1000), now: Math.round(shownMs / 1000) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      {/* Children ignore touches so locationX is always measured against the whole bar. */}
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length: count }, (_, index) => {
          const height = BARS[index % BARS.length];
          const active = (index + 0.5) / count <= progress;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: scrub === null ? height : height + 1,
                  backgroundColor: active ? colors.accent : colors.muted,
                  opacity: active ? 1 : 0.35,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );

  const clock = (ms: number, align: 'left' | 'right') => (
    <Text
      style={[
        styles.clock,
        inline && styles.clockInline,
        { color: scrub !== null && align === 'left' ? colors.text : colors.muted, textAlign: align },
      ]}>
      {formatClock(ms)}
    </Text>
  );

  if (inline) {
    return (
      <View style={styles.inline}>
        {clock(shownMs, 'left')}
        {bars}
        {clock(durationMs, 'right')}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {bars}
      <View style={styles.times}>
        {clock(shownMs, 'left')}
        {clock(durationMs, 'right')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 2 },
  inline: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  bars: {
    alignSelf: 'stretch',
    // Taller than the bars so the bar is still easy to grab with a finger.
    height: 32,
    justifyContent: 'center',
    cursor: 'pointer',
  },
  barsInline: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
  },
  bar: { width: 2, borderRadius: 1 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  clock: { fontSize: 12, fontVariant: ['tabular-nums'] },
  clockInline: { fontSize: 11, width: 36 },
});
