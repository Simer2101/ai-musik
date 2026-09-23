import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { theme } from '@/constants/Colors';
import { formatClock } from '@/lib/cover';
import { usePlayer } from '@/providers/PlayerProvider';
import { TrackCover } from '@/components/ui';

export function MiniPlayer() {
  const router = useRouter();
  const { track, isPlaying, positionMs, durationMs, toggle, next } = usePlayer();
  if (!track) return null;

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      <Pressable style={styles.row} onPress={() => router.push(`/track/${track.id}`)}>
        <TrackCover track={track} size={44} />
        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.title}>
            {track.genre || 'Now playing'}
          </Text>
          <Text numberOfLines={1} style={styles.sub}>
            {formatClock(positionMs)} / {formatClock(durationMs || track.durationMs)} · AI
          </Text>
        </View>
        <Pressable onPress={toggle} hitSlop={10}>
          <Text style={styles.control}>{isPlaying ? '❚❚' : '▶'}</Text>
        </Pressable>
        <Pressable onPress={next} hitSlop={10}>
          <Text style={styles.control}>⏭</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.cardAlt,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  progress: {
    height: 2,
    backgroundColor: theme.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  body: { flex: 1 },
  title: { color: theme.text, fontWeight: '700' },
  sub: { color: theme.muted, fontSize: 12 },
  control: { color: theme.text, fontSize: 18, paddingHorizontal: 6 },
});
