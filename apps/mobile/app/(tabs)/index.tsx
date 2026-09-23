import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { TrackRow } from '@/components/ui';
import { theme } from '@/constants/Colors';
import { api } from '@/lib/api';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/providers/PlayerProvider';

export default function FeedScreen() {
  const router = useRouter();
  const { play } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.feed();
      setTracks(data.tracks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the catalog');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const toggleLike = async (track: Track) => {
    try {
      if (track.liked) await api.unlike(track.id);
      else await api.like(track.id);
      await load();
    } catch {
      router.push('/auth');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.accent} />}>
      <Text style={styles.kicker}>ONLY AI MUSIC</Text>
      <Text style={styles.heading}>Listen to tracks created in AImusik</Text>
      <Text style={styles.copy}>
        Every song here is generated from a prompt. Nothing else lives in this app.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tracks.length === 0 && !error ? (
        <Text style={styles.empty}>The catalog is empty. Create the first track.</Text>
      ) : null}
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          onPress={() => {
            void play(track, tracks);
            router.push(`/track/${track.id}`);
          }}
          onLike={() => toggleLike(track)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  kicker: { color: theme.accent2, letterSpacing: 2, fontSize: 12, fontWeight: '700' },
  heading: { color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  copy: { color: theme.muted, marginBottom: 8 },
  error: { color: theme.danger },
  empty: { color: theme.muted, paddingVertical: 24 },
});
