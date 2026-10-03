import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TrackRow } from '@/components/ui';
import { api } from '@/lib/api';
import { demoApi } from '@/lib/demo';
import type { Track } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { play } = usePlayer();
  const { colors, t } = useSettings();
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
      const data =
        user.id === 'demo-user'
          ? tab === 'mine'
            ? demoApi.myTracks()
            : demoApi.myLikes()
          : tab === 'mine'
            ? await api.myTracks()
            : await api.myLikes();
      setTracks(data.tracks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.libraryError);
    } finally {
      setRefreshing(false);
    }
  }, [tab, t.libraryError, user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <ScreenBackdrop>
        <View style={styles.emptyBox}>
          <View style={styles.emptyInner}>
            <Text style={[styles.heading, { color: colors.text }]}>{t.libraryTitle}</Text>
            <Text style={[styles.emptyCopy, { color: colors.muted }]}>{t.libraryGuest}</Text>
            <PressableScale onPress={() => router.push('/auth')} style={[styles.link, { backgroundColor: colors.accent }]}>
              <Text style={[styles.linkText, { color: colors.buttonText }]}>{t.signIn}</Text>
            </PressableScale>
          </View>
        </View>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />}>
      <Text style={[styles.heading, { color: colors.text }]}>{t.libraryTitle}</Text>
      <AdBanner />
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        <PressableScale
          onPress={() => setTab('mine')}
          style={[styles.tab, tab === 'mine' && { backgroundColor: colors.accent }]}>
          <Text style={{ color: tab === 'mine' ? colors.buttonText : colors.muted, fontWeight: '700' }}>
            {t.created}
          </Text>
        </PressableScale>
        <PressableScale
          onPress={() => setTab('likes')}
          style={[styles.tab, tab === 'likes' && { backgroundColor: colors.accent }]}>
          <Text style={{ color: tab === 'likes' ? colors.buttonText : colors.muted, fontWeight: '700' }}>
            {t.liked}
          </Text>
        </PressableScale>
      </View>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {tracks[0] ? (
        <View style={styles.actions}>
          <PressableScale
            onPress={() => void play(tracks[0], tracks)}
            style={[styles.playAll, { backgroundColor: colors.accent }]}>
            <Icon name="play" color={colors.buttonText} size={16} />
            <Text style={{ color: colors.buttonText, fontWeight: '800' }}>{t.playAll}</Text>
          </PressableScale>
          <PressableScale onPress={() => void play(tracks[0], tracks, { radio: true })} style={styles.shuffle}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{t.shuffle}</Text>
          </PressableScale>
        </View>
      ) : null}
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          onPress={() => router.push(`/track/${track.id}`)}
        />
      ))}
    </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 36, gap: 16, paddingBottom: 120, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  emptyBox: { flex: 1, padding: 36, justifyContent: 'center', alignItems: 'center' },
  emptyInner: { alignSelf: 'center', width: 420, maxWidth: '100%', gap: 12 },
  emptyCopy: { fontSize: 16, lineHeight: 22 },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  link: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  linkText: { fontWeight: '800' },
  tabs: { flexDirection: 'row', borderRadius: 999, padding: 4, alignSelf: 'flex-start' },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  playAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  shuffle: { paddingHorizontal: 10, paddingVertical: 10 },
});
