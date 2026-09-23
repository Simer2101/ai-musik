import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { TrackRow } from '@/components/ui';
import { theme } from '@/constants/Colors';
import { api } from '@/lib/api';
import type { Track } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/PlayerProvider';

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { play } = usePlayer();
  const [tab, setTab] = useState<'mine' | 'likes'>('mine');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setTracks([]);
      return;
    }
    setRefreshing(true);
    try {
      const data = tab === 'mine' ? await api.myTracks() : await api.myLikes();
      setTracks(data.tracks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load library');
    } finally {
      setRefreshing(false);
    }
  }, [tab, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!user) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.heading}>Your library</Text>
        <Text style={styles.copy}>Sign in to see tracks you created or saved.</Text>
        <Pressable onPress={() => router.push('/auth')} style={styles.link}>
          <Text style={styles.linkText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.accent} />}>
      <Text style={styles.heading}>Library</Text>
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('mine')} style={[styles.tab, tab === 'mine' && styles.tabOn]}>
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextOn]}>Created</Text>
        </Pressable>
        <Pressable onPress={() => setTab('likes')} style={[styles.tab, tab === 'likes' && styles.tabOn]}>
          <Text style={[styles.tabText, tab === 'likes' && styles.tabTextOn]}>Liked</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          onPress={() => {
            if (track.status === 'ready') void play(track, tracks);
            router.push(`/track/${track.id}`);
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  emptyBox: { flex: 1, backgroundColor: theme.bg, padding: 24, gap: 12, justifyContent: 'center' },
  heading: { color: theme.text, fontSize: 28, fontWeight: '800' },
  copy: { color: theme.muted },
  link: { alignSelf: 'flex-start', backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  linkText: { color: '#140b24', fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: theme.border },
  tabOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  tabText: { color: theme.muted },
  tabTextOn: { color: '#140b24', fontWeight: '700' },
  error: { color: theme.danger },
});
