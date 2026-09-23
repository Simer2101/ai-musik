import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { coverColors, formatClock } from '@/lib/cover';
import type { Track } from '@/lib/types';
import { theme } from '@/constants/Colors';

export function TrackCover({ track, size = 64 }: { track: Track; size?: number }) {
  const [from, to] = coverColors(track.id);
  return (
    <View style={[styles.cover, { width: size, height: size, backgroundColor: from }]}>
      {track.coverUrl ? (
        <Image source={{ uri: track.coverUrl }} style={{ width: size, height: size }} />
      ) : (
        <View style={[styles.coverFallback, { backgroundColor: to }]}>
          <Text style={styles.coverLabel}>{(track.genre || 'AI').slice(0, 3).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

export function TrackRow({
  track,
  onPress,
  onLike,
}: {
  track: Track;
  onPress: () => void;
  onLike?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <TrackCover track={track} />
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={styles.title}>
          {track.genre || 'AI track'}
        </Text>
        <Text numberOfLines={2} style={styles.prompt}>
          {track.prompt}
        </Text>
        <Text style={styles.meta}>
          {track.authorName} · {formatClock(track.durationMs)} · AI-generated
        </Text>
      </View>
      {onLike ? (
        <Pressable onPress={onLike} hitSlop={12}>
          <Text style={[styles.like, track.liked && styles.liked]}>{track.liked ? '♥' : '♡'}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverLabel: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  rowBody: { flex: 1, gap: 4 },
  title: { color: theme.text, fontSize: 16, fontWeight: '700' },
  prompt: { color: theme.muted, fontSize: 13 },
  meta: { color: theme.accent, fontSize: 11, letterSpacing: 0.3 },
  like: { color: theme.muted, fontSize: 22, paddingHorizontal: 4 },
  liked: { color: theme.danger },
  button: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#140b24', fontWeight: '800', fontSize: 16 },
});
