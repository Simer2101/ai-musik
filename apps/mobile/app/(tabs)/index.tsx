import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HorizontalCarousel } from '@/components/HorizontalCarousel';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { SectionTitle, TrackCover, TrackRow } from '@/components/ui';
import { api } from '@/lib/api';
import { coverColors, trackTitle } from '@/lib/cover';
import { demoApi } from '@/lib/demo';
import { useDesktop } from '@/lib/layout';
import type { Track } from '@/lib/types';
import { filterByMood, filterByNeedles, GENRES, genreLabel, greetingKey, searchTracks, type Mood } from '@/lib/wave';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';

const STYLES = GENRES.map((item) => ({
  id: item.id,
  key: item.labelKey,
  needles: item.needles,
}));

function StyleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useSettings();
  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: colors.card, borderColor: colors.border },
        active && { backgroundColor: colors.accent, borderColor: colors.accent },
      ]}>
      <Text
        style={{
          color: active ? colors.buttonText : colors.muted,
          fontWeight: active ? '800' : '600',
          fontSize: 13,
        }}>
        {label}
      </Text>
    </PressableScale>
  );
}

function Shelf({
  desktop,
  title,
  tracks,
  onPlay,
}: {
  desktop: boolean;
  title: string;
  tracks: Track[];
  onPlay: (track: Track, list: Track[]) => void;
}) {
  const { colors } = useSettings();
  if (!tracks.length) return null;
  return (
    <HorizontalCarousel title={title}>
      {tracks.slice(0, desktop ? 10 : 8).map((item) => (
        <PressableScale key={item.id} onPress={() => onPlay(item, tracks)} style={styles.shelfCard} scaleTo={0.97}>
          <TrackCover track={item} size={desktop ? 168 : 148} radius={14} />
          <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
            {trackTitle(item)}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
            {item.authorName}
          </Text>
        </PressableScale>
      ))}
    </HorizontalCarousel>
  );
}

export default function ListenScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { play, recents } = usePlayer();
  const { colors, t } = useSettings();
  const desktop = useDesktop();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [liked, setLiked] = useState<Track[]>([]);
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.feed();
      setTracks(data.tracks);
      setLiked(user ? demoApi.myLikes().tracks : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.catalogError);
    } finally {
      setRefreshing(false);
    }
  }, [t.catalogError, user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Only styles with at least one playable track are offered, so every chip works.
  const availableStyles = useMemo(
    () => STYLES.map((item) => ({ ...item, list: filterByNeedles(tracks, item.needles) })).filter((item) => item.list.length),
    [tracks]
  );
  const activeStyle = availableStyles.find((item) => item.id === style) ?? null;
  const styleTracks = activeStyle ? activeStyle.list : tracks;
  const visible = useMemo(() => searchTracks(styleTracks, query), [query, styleTracks]);
  const browsing = Boolean(activeStyle) || query.trim().length > 0;
  const genres = useMemo(
    () => GENRES.map((item) => item.value).filter((value) => tracks.some((track) => track.genre === value)),
    [tracks]
  );
  const name = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? '';
  const hello = t[greetingKey()];

  return (
    <ScreenBackdrop>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, desktop && styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />}>
      <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 11, letterSpacing: 1.2 }}>{t.listenKicker}</Text>
      <Text style={[styles.heading, { color: colors.text }]}>
        {hello}
        {name ? `, ${name}` : ''}
      </Text>
      <Text style={{ color: colors.muted }}>{t.listenCopy}</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.searchPlaceholder}
        placeholderTextColor={colors.muted}
        style={[styles.search, { backgroundColor: colors.card, color: colors.text }]}
      />

      <HorizontalCarousel>
        <StyleChip label={t.styleAll} active={!activeStyle} onPress={() => setStyle('all')} />
        {availableStyles.map((item) => (
          <StyleChip
            key={item.id}
            label={t[item.key]}
            active={activeStyle?.id === item.id}
            onPress={() => setStyle(activeStyle?.id === item.id ? 'all' : item.id)}
          />
        ))}
      </HorizontalCarousel>

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {!visible.length && !error ? (
        <Text style={{ color: colors.muted }}>{query ? t.searchEmpty : t.catalogEmpty}</Text>
      ) : null}

      {browsing ? (
        <View style={{ gap: 4 }}>
          {visible.length ? (
            <View style={styles.rowBetween}>
              <SectionTitle>{activeStyle ? t[activeStyle.key] : t.stylesTitle}</SectionTitle>
              <PressableScale onPress={() => void play(visible[0], visible, { radio: true })} scaleTo={0.96}>
                <Text style={{ color: colors.accent2, fontWeight: '700' }}>{t.playAll}</Text>
              </PressableScale>
            </View>
          ) : null}
          {visible.map((item) => (
            <TrackRow
              key={item.id}
              track={item}
              onPress={() => router.push(`/track/${item.id}`)}
            />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.mixes}>
            {[
              { title: t.dailyMix, mood: 'energy' as Mood, list: filterByMood(tracks, 'energy') },
              { title: t.nightMix, mood: 'night' as Mood, list: filterByMood(tracks, 'night') },
              { title: t.focusMix, mood: 'focus' as Mood, list: filterByMood(tracks, 'focus') },
              { title: t.classicMix, mood: 'calm' as Mood, list: filterByNeedles(tracks, GENRES.find((item) => item.id === 'classical')?.needles ?? ['классика']) },
            ].map((mix) => {
              const [from, to] = coverColors(mix.title);
              return (
                <PressableScale
                  key={mix.title}
                  onPress={() => router.push(`/wave?mood=${mix.mood}`)}
                  style={styles.mixCard}
                  scaleTo={0.98}>
                  <LinearGradient colors={[from, to]} style={styles.mixGrad}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{mix.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{mix.list.length} {t.statsTracks}</Text>
                  </LinearGradient>
                </PressableScale>
              );
            })}
          </View>

          <Shelf desktop={desktop} title={t.newInApp} tracks={tracks} onPlay={(item) => router.push(`/track/${item.id}`)} />
          {liked.length ? (
            <Shelf desktop={desktop} title={t.becauseYouLiked} tracks={liked} onPlay={(item) => router.push(`/track/${item.id}`)} />
          ) : null}
          {recents.length ? (
            <Shelf desktop={desktop} title={t.recentlyPlayed} tracks={recents} onPlay={(item) => router.push(`/track/${item.id}`)} />
          ) : null}

          {genres.length ? (
            <HorizontalCarousel title={t.genreMixes}>
              {genres.map((genre) => {
                const mix = tracks.filter((item) => item.genre === genre);
                return (
                  <PressableScale
                    key={genre}
                    onPress={() => {
                      const match = GENRES.find((item) => item.value === genre);
                      setStyle(match?.id ?? 'all');
                    }}
                    style={styles.genreCard}
                    scaleTo={0.97}>
                    <TrackCover track={mix[0] ?? tracks[0]} size={148} radius={14} />
                    <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>{genreLabel(genre, t)}</Text>
                  </PressableScale>
                );
              })}
            </HorizontalCarousel>
          ) : null}

          {tracks.length ? (
            <View style={{ gap: 4 }}>
              <View style={styles.rowBetween}>
                <SectionTitle>{t.madeForYou}</SectionTitle>
                <PressableScale onPress={() => void play(tracks[0], tracks)} scaleTo={0.96}>
                  <Text style={{ color: colors.accent2, fontWeight: '700' }}>{t.playAll}</Text>
                </PressableScale>
              </View>
              {tracks.slice(0, 8).map((item) => (
                <TrackRow
                  key={item.id}
                  track={item}
                  onPress={() => router.push(`/track/${item.id}`)}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 120 },
  contentDesktop: { padding: 36, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  search: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16 },
  chips: { gap: 8, paddingRight: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  mixes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mixCard: { flexGrow: 1, minWidth: 180, borderRadius: 18, overflow: 'hidden' },
  mixGrad: { padding: 18, minHeight: 100, justifyContent: 'flex-end', gap: 4 },
  shelf: { gap: 12 },
  shelfCard: { width: 168 },
  genreCard: { width: 148 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
