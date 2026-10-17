import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { Avatar } from '@/components/Avatar';
import { Text, TextInput, useFocusRing } from '@/components/AppText';
import { HorizontalCarousel } from '@/components/HorizontalCarousel';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { SectionTitle, TrackCover, TrackRow } from '@/components/ui';
import { fonts } from '@/constants/Fonts';
import { api } from '@/lib/api';
import { formatClock, trackTitle } from '@/lib/cover';
import { demoApi } from '@/lib/demo';
import { useDesktop } from '@/lib/layout';
import type { Track } from '@/lib/types';
import { useLikeToggle } from '@/lib/likes';
import { filterByNeedles, GENRES, genreLabel, searchTracks, type Mood } from '@/lib/wave';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';

const STYLES = GENRES.map((item) => ({
  id: item.id,
  needles: item.needles,
}));

// Gap between carousel items (HorizontalCarousel row gap) and the smallest desktop cover.
const SHELF_GAP = 12;
const SHELF_MIN = 168;

const HERO_MOODS: { id: Mood; key: 'moodEnergy' | 'moodCalm' | 'moodFocus' | 'moodNight' }[] = [
  { id: 'energy', key: 'moodEnergy' },
  { id: 'calm', key: 'moodCalm' },
  { id: 'focus', key: 'moodFocus' },
  { id: 'night', key: 'moodNight' },
];

// Decorative bar heights for the wave card; the first part is lit to suggest playback.
const BARS = [10, 18, 26, 14, 30, 22, 34, 16, 24, 36, 20, 12, 28, 32, 18, 26, 10, 22, 34, 30, 14, 24, 18, 36, 28, 12, 20, 30, 16, 26, 34, 22, 10, 18, 28, 24, 14, 32, 20, 12];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useSettings();
  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border },
        active && { backgroundColor: colors.text, borderColor: colors.text },
      ]}>
      <Text style={{ color: active ? colors.bg : colors.text, fontWeight: active ? '600' : '500', fontSize: 14 }}>
        {label}
      </Text>
    </PressableScale>
  );
}

function WaveCard({ desktop, onStart, onMood }: { desktop: boolean; onStart: () => void; onMood: (mood: Mood) => void }) {
  const { colors, t } = useSettings();
  const scale = desktop ? 2.6 : 1;
  const play = desktop ? 96 : 72;
  const bars = (
    <View style={[styles.bars, desktop && { flex: 1 }, { height: 36 * scale, gap: desktop ? 4 : 3 }]} pointerEvents="none">
      {BARS.map((height, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: height * scale,
            borderRadius: desktop ? 3 : 2,
            backgroundColor: index < 16 ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
  const button = (
    <PressableScale
      onPress={onStart}
      accessibilityLabel={t.waveStart}
      scaleTo={0.92}
      style={[styles.play, { width: play, height: play, borderRadius: play / 2, backgroundColor: colors.accent }]}>
      <Icon name="play" color={colors.buttonText} size={desktop ? 38 : 28} />
    </PressableScale>
  );

  return (
    <View
      style={[
        styles.wave,
        desktop && styles.waveDesktop,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}>
      <View style={[styles.waveText, desktop && { flexBasis: 320 }]}>
        <Text style={{ color: colors.accent, fontWeight: '700', fontSize: desktop ? 12 : 11, letterSpacing: 1.6 }}>
          {t.listenKicker}
        </Text>
        <Text style={[fonts.display('700'), { color: colors.text, fontSize: desktop ? 44 : 26, lineHeight: desktop ? 48 : 29, letterSpacing: -0.6, maxWidth: desktop ? undefined : 180 }]}>
          {t.waveTitle}
        </Text>
        <Text style={{ color: colors.muted, fontSize: desktop ? 16 : 13, lineHeight: desktop ? 24 : 18, maxWidth: desktop ? 420 : 200 }}>
          {desktop ? t.waveSubtitle : t.waveShort}
        </Text>
        {desktop ? (
          <View style={styles.moods}>
            {HERO_MOODS.map((mood, index) => (
              <Chip key={mood.id} label={t[mood.key]} active={index === 0} onPress={() => onMood(mood.id)} />
            ))}
          </View>
        ) : null}
      </View>
      {desktop ? (
        <View style={styles.waveRight}>
          {bars}
          {button}
        </View>
      ) : (
        <View style={{ position: 'absolute', top: 20, right: 20 }}>{button}</View>
      )}
      {desktop ? null : bars}
    </View>
  );
}

function PopularRow({ track, rank, onPress }: { track: Track; rank: number; onPress: () => void }) {
  const { colors, t } = useSettings();
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} style={[styles.popular, { borderBottomColor: colors.border }]}>
      <Text style={[fonts.display('500'), { width: 24, color: colors.muted, fontSize: 14 }]}>{rank}</Text>
      <TrackCover track={track} size={48} radius={12} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
          {trackTitle(track)}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
          {track.authorName}
          {track.genre ? ` · ${genreLabel(track.genre, t)}` : ''}
        </Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{formatClock(track.durationMs)}</Text>
    </PressableScale>
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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchFocus = useFocusRing();
  const [shelfWidth, setShelfWidth] = useState(0);
  const [style, setStyle] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const toggleLike = useLikeToggle(setTracks, {
    onDone: () => setLiked(user ? demoApi.myLikes().tracks : []),
    onError: (message) => setLikeError(message === null ? null : message || t.likeFail),
  });

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
  const popular = useMemo(
    () =>
      [...tracks]
        .sort((a, b) => (b.playCount ?? 0) + b.likeCount - ((a.playCount ?? 0) + a.likeCount))
        .slice(0, desktop ? 8 : 5),
    [desktop, tracks]
  );
  const openTrack = (item: Track) => router.push(`/track/${item.id}`);
  // On desktop, size covers so a whole number fits the row: no cover is cut off at the right edge.
  const shelf = (() => {
    if (!desktop || !shelfWidth) return { size: desktop ? 168 : 128, perPage: 1 };
    const perPage = Math.max(3, Math.floor((shelfWidth + SHELF_GAP) / (SHELF_MIN + SHELF_GAP)));
    return { size: Math.floor((shelfWidth - SHELF_GAP * (perPage - 1)) / perPage), perPage };
  })();

  const searchField = (
    <View style={[styles.search, desktop && styles.searchDesktop, { backgroundColor: colors.cardAlt }, searchFocus.ring]}>
      <Icon name="search" color={colors.muted} size={20} />
      <TextInput
        ring={false}
        onFocus={searchFocus.onFocus}
        onBlur={searchFocus.onBlur}
        value={query}
        onChangeText={setQuery}
        autoFocus={!desktop && searchOpen}
        placeholder={t.searchPlaceholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={t.search}
        style={[styles.searchInput, { color: colors.text }]}
      />
    </View>
  );
  const avatar = (
    <PressableScale
      onPress={() => router.push('/profile')}
      accessibilityLabel={t.tabProfile}
      style={styles.round}>
      <Avatar size={44} initialOnly={!user} />
    </PressableScale>
  );

  return (
    <ScreenBackdrop>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, desktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />}>
        {desktop ? (
          <View style={styles.header}>
            {searchField}
            {avatar}
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Logo height={32} />
              <View style={styles.headerRight}>
                <PressableScale
                  onPress={() => setSearchOpen((open) => !open)}
                  accessibilityLabel={t.search}
                  style={[styles.round, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                  <Icon name="search" color={colors.text} size={20} />
                </PressableScale>
                {avatar}
              </View>
            </View>
            {searchOpen || query ? searchField : null}
          </>
        )}

        {browsing ? null : (
          <WaveCard
            desktop={desktop}
            onStart={() => router.push('/wave')}
            onMood={(mood) => router.push(`/wave?mood=${mood}`)}
          />
        )}

        <HorizontalCarousel>
          <Chip label={t.styleAll} active={!activeStyle} onPress={() => setStyle('all')} />
          {availableStyles.map((item) => (
            <Chip
              key={item.id}
              label={genreLabel(item.id, t)}
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
                <SectionTitle>{activeStyle ? genreLabel(activeStyle.id, t) : t.stylesTitle}</SectionTitle>
                <PressableScale onPress={() => void play(visible[0], visible, { radio: true })} scaleTo={0.96}>
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>{t.playAll}</Text>
                </PressableScale>
              </View>
            ) : null}
            {likeError ? <Text style={{ color: colors.danger }}>{likeError}</Text> : null}
            {visible.map((item) => (
              <TrackRow
                key={item.id}
                track={item}
                onPress={() => openTrack(item)}
                onLike={() => void toggleLike(item)}
              />
            ))}
          </View>
        ) : (
          <>
            {tracks.length ? (
              <View onLayout={(event) => setShelfWidth(event.nativeEvent.layout.width)}>
              <HorizontalCarousel title={t.newReleases} step={desktop ? shelf.perPage * (shelf.size + SHELF_GAP) : undefined}>
                {tracks.slice(0, desktop ? 12 : 8).map((item) => (
                  <PressableScale
                    key={item.id}
                    onPress={() => openTrack(item)}
                    style={{ width: shelf.size }}
                    scaleTo={0.97}>
                    <TrackCover track={item} size={shelf.size} radius={18} />
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', fontSize: desktop ? 15 : 14, marginTop: 8 }}>
                      {trackTitle(item)}
                    </Text>
                    <Text numberOfLines={1} style={{ color: colors.muted, fontSize: desktop ? 13 : 12 }}>
                      {item.authorName}
                      {item.genre ? ` · ${genreLabel(item.genre, t)}` : ''}
                    </Text>
                  </PressableScale>
                ))}
              </HorizontalCarousel>
              </View>
            ) : null}

            {popular.length ? (
              <View style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <SectionTitle>{t.popularTitle}</SectionTitle>
                  <PressableScale onPress={() => void play(popular[0], popular)} scaleTo={0.96}>
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>{t.playAll}</Text>
                  </PressableScale>
                </View>
                <View style={desktop ? styles.popularGrid : undefined}>
                  {popular.map((item, index) => (
                    <View key={item.id} style={desktop ? styles.popularCell : undefined}>
                      <PopularRow track={item} rank={index + 1} onPress={() => openTrack(item)} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <AdBanner />

            {liked.length ? (
              <HorizontalCarousel title={t.becauseYouLiked}>
                {liked.slice(0, 8).map((item) => (
                  <PressableScale key={item.id} onPress={() => openTrack(item)} style={{ width: 128 }} scaleTo={0.97}>
                    <TrackCover track={item} size={128} radius={18} />
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', marginTop: 8 }}>
                      {trackTitle(item)}
                    </Text>
                  </PressableScale>
                ))}
              </HorizontalCarousel>
            ) : null}
            {recents.length ? (
              <HorizontalCarousel title={t.recentlyPlayed}>
                {recents.slice(0, 8).map((item) => (
                  <PressableScale key={item.id} onPress={() => openTrack(item)} style={{ width: 128 }} scaleTo={0.97}>
                    <TrackCover track={item} size={128} radius={18} />
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', marginTop: 8 }}>
                      {trackTitle(item)}
                    </Text>
                  </PressableScale>
                ))}
              </HorizontalCarousel>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 22, paddingBottom: 120 },
  contentDesktop: { paddingHorizontal: 32, paddingTop: 24, paddingBottom: 40, gap: 32, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  searchDesktop: { flexGrow: 0, flexShrink: 1, flexBasis: 420 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15 },
  chip: { borderRadius: 999, paddingHorizontal: 16, height: 36, justifyContent: 'center', borderWidth: 1 },
  wave: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 16 },
  waveDesktop: { padding: 32, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 32 },
  waveText: { flexGrow: 1, flexShrink: 1, gap: 8 },
  waveRight: { flexGrow: 1, flexShrink: 1, flexBasis: 360, flexDirection: 'row', alignItems: 'center', gap: 24 },
  bars: { flexDirection: 'row', alignItems: 'center' },
  play: { alignItems: 'center', justifyContent: 'center' },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  popular: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 32 },
  popularCell: { flexGrow: 1, flexBasis: 360, minWidth: 0 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
