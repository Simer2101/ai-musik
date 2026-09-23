import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, TrackCover } from '@/components/ui';
import { theme } from '@/constants/Colors';
import { formatClock } from '@/lib/cover';
import { api } from '@/lib/api';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/providers/PlayerProvider';

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { play, toggle, track: current, isPlaying, positionMs, durationMs } = usePlayer();
  const [track, setTrack] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.track(id);
      setTrack(data.track);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Track not found');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!track || track.status === 'ready' || track.status === 'failed') return;
    const timer = setInterval(() => {
      void load();
    }, 2500);
    return () => clearInterval(timer);
  }, [load, track]);

  if (error || !track) {
    return (
      <View style={styles.center}>
        <Text style={styles.copy}>{error ?? 'Loading…'}</Text>
      </View>
    );
  }

  const active = current?.id === track.id;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TrackCover track={track} size={240} />
      <Text style={styles.badge}>AI-GENERATED</Text>
      <Text style={styles.title}>{track.genre || 'Untitled AI track'}</Text>
      <Text style={styles.prompt}>{track.prompt}</Text>
      <Text style={styles.meta}>
        {track.authorName} · {formatClock(track.durationMs)} · {track.status}
      </Text>
      {track.status === 'queued' || track.status === 'generating' ? (
        <Text style={styles.copy}>Generating your track. This screen refreshes automatically.</Text>
      ) : null}
      {track.status === 'failed' ? <Text style={styles.error}>{track.errorMessage}</Text> : null}
      {track.status === 'ready' ? (
        <>
          <Text style={styles.time}>
            {formatClock(active ? positionMs : 0)} / {formatClock(active ? durationMs || track.durationMs : track.durationMs)}
          </Text>
          <PrimaryButton
            title={active && isPlaying ? 'Pause' : 'Play'}
            onPress={() => {
              if (active) void toggle();
              else void play(track);
            }}
          />
        </>
      ) : null}
      <View style={styles.row}>
        <Pressable
          onPress={async () => {
            try {
              if (track.liked) await api.unlike(track.id);
              else await api.like(track.id);
              await load();
            } catch (err) {
              Alert.alert('Sign in required', err instanceof Error ? err.message : 'Could not like');
            }
          }}
          style={styles.ghost}>
          <Text style={styles.ghostText}>{track.liked ? 'Liked' : 'Like'} · {track.likeCount}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.prompt
              ? Alert.prompt('Report track', 'Why is this content a problem?', async (reason) => {
                  if (!reason) return;
                  try {
                    await api.report(track.id, reason);
                    Alert.alert('Thanks', 'We received the report.');
                  } catch (err) {
                    Alert.alert('Could not report', err instanceof Error ? err.message : '');
                  }
                })
              : Alert.alert('Report', 'Use this to flag a prompt or audio that breaks the rules.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Report',
                    onPress: async () => {
                      await api.report(track.id, 'User flagged this track');
                    },
                  },
                ]);
          }}
          style={styles.ghost}>
          <Text style={styles.ghostText}>Report</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 24, gap: 12, alignItems: 'center', paddingBottom: 48 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  badge: { color: theme.accent2, letterSpacing: 2, fontWeight: '700', fontSize: 12 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  prompt: { color: theme.muted, textAlign: 'center' },
  meta: { color: theme.accent },
  copy: { color: theme.muted, textAlign: 'center' },
  error: { color: theme.danger, textAlign: 'center' },
  time: { color: theme.text, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  ghost: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ghostText: { color: theme.text, fontWeight: '600' },
});
