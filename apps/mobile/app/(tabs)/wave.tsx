import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { SectionTitle, TrackCover, TrackRow } from '@/components/ui';
import { Waveform } from '@/components/Waveform';
import { api } from '@/lib/api';
import { formatClock, trackTitle } from '@/lib/cover';
import { demoApi } from '@/lib/demo';
import { useDesktop } from '@/lib/layout';
import { filterByMood, shuffleTracks, type Mood } from '@/lib/wave';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';

const MOODS: { id: Mood; key: 'moodCalm' | 'moodEnergy' | 'moodNight' | 'moodFocus' | 'moodSad' }[] = [
  { id: 'calm', key: 'moodCalm' },
  { id: 'energy', key: 'moodEnergy' },
  { id: 'night', key: 'moodNight' },
  { id: 'focus', key: 'moodFocus' },
  { id: 'sad', key: 'moodSad' },
];

export default function WaveScreen() {
  const { mood: initial } = useLocalSearchParams<{ mood?: Mood }>();
  const { colors, t } = useSettings();
  const desktop = useDesktop();
  const { play, toggle, next, prev, track, isPlaying, positionMs, durationMs, seek, radio } = usePlayer();
  const [catalog, setCatalog] = useState<Track[]>(() => demoApi.feed().tracks);
  const [mood, setMood] = useState<Mood | null>(initial ?? 'night');
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setMood(initial);
  }, [initial]);

  useEffect(() => {
    api
      .feed()
      .then((data) => setCatalog(data.tracks.length ? data.tracks : demoApi.feed().tracks))
      .catch(() => setCatalog(demoApi.feed().tracks));
  }, []);

  const pool = useMemo(() => filterByMood(catalog, mood), [catalog, mood]);
  const inPool = track ? pool.some((item) => item.id === track.id) : false;
  const picked = pool.find((item) => item.id === pickedId) ?? null;
  const hero = inPool && track ? track : picked ?? pool[0] ?? null;
  const live = Boolean(track && inPool);
  const progress = live && durationMs > 0 ? positionMs / durationMs : 0;

  const startWave = async (from?: Track) => {
    const seed = from ?? hero;
    const list = seed
      ? [seed, ...shuffleTracks(pool.filter((item) => item.id !== seed.id))]
      : shuffleTracks(pool);
    if (!list[0]) return;
    setPickedId(list[0].id);
    await play(list[0], list, { radio: true });
  };

  const skip = async (direction: number) => {
    if (live) {
      if (direction > 0) await next();
      else await prev();
      return;
    }
    if (!hero || pool.length < 2) return;
    const index = Math.max(0, pool.findIndex((item) => item.id === hero.id));
    const nextTrack = pool[(index + direction + pool.length) % pool.length];
    setPickedId(nextTrack.id);
  };

  return (
    <ScreenBackdrop>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, desktop && styles.contentDesktop]}>
        <Text style={[styles.kicker, { color: colors.accent }]}>{live && radio ? t.waveNow : t.waveTitle}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t.waveTitle}</Text>
        <Text style={{ color: colors.muted }}>{t.waveSubtitle}</Text>
        <AdBanner />

        <View style={styles.moods}>
          {MOODS.map((item) => {
            const active = mood === item.id;
            return (
              <PressableScale
                key={item.id}
                onPress={() => {
                  setMood(item.id);
                  setPickedId(null);
                }}
                style={[
                  styles.mood,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}>
                <Text
                  style={{
                    color: active ? colors.buttonText : colors.muted,
                    fontWeight: active ? '800' : '600',
                    fontSize: 13,
                  }}>
                  {t[item.key]}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {hero ? (
          <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.heroRow, desktop && styles.heroRowDesktop]}>
              <TrackCover track={hero} size={desktop ? 200 : 180} radius={18} />
              <View style={[styles.heroMeta, desktop && styles.heroMetaDesktop]}>
                <Text style={[styles.heroTitle, { color: colors.text }, desktop && { textAlign: 'left' }]}>
                  {trackTitle(hero)}
                </Text>
                <Text style={{ color: colors.muted }}>{hero.authorName}</Text>
                <Waveform
                  progress={progress}
                  onSeek={(ratio) => {
                    if (live) void seek((durationMs || hero.durationMs) * ratio);
                  }}
                />
                <View style={styles.times}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{formatClock(live ? positionMs : 0)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {formatClock(live ? durationMs || hero.durationMs : hero.durationMs)}
                  </Text>
                </View>
                <View style={[styles.controls, desktop && styles.controlsDesktop]}>
                  <PressableScale onPress={() => void skip(-1)} hitSlop={12} scaleTo={0.88}>
                    <Icon name="prev" color={colors.text} size={26} />
                  </PressableScale>
                  <PressableScale
                    onPress={() => (live ? void toggle() : void startWave(hero))}
                    style={[styles.play, { backgroundColor: colors.accent }]}
                    scaleTo={0.9}>
                    <Icon name={live && isPlaying ? 'pause' : 'play'} color={colors.buttonText} size={28} />
                  </PressableScale>
                  <PressableScale onPress={() => void skip(1)} hitSlop={12} scaleTo={0.88}>
                    <Icon name="next" color={colors.text} size={26} />
                  </PressableScale>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {pool.length ? (
          <View style={{ gap: 4 }}>
            <View style={styles.rowBetween}>
              <SectionTitle>
                {t.waveQueue}
                <Text style={{ color: colors.muted, fontWeight: '600' }}> · {pool.length}</Text>
              </SectionTitle>
              <PressableScale onPress={() => void startWave()} scaleTo={0.96}>
                <Text style={{ color: colors.accent2, fontWeight: '700' }}>{t.shuffle}</Text>
              </PressableScale>
            </View>
            {pool.map((item) => (
              <TrackRow
                key={item.id}
                track={item}
                onPress={() => {
                  setPickedId(item.id);
                }}
              />
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.muted }}>{t.catalogEmpty}</Text>
        )}
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 140 },
  contentDesktop: { paddingHorizontal: 48, paddingTop: 28, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  kicker: { fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6 },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  mood: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 18, marginTop: 8 },
  heroRow: { alignItems: 'center', gap: 16 },
  heroRowDesktop: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  heroMeta: { alignItems: 'center', gap: 10, width: '100%' },
  heroMetaDesktop: { flex: 1, alignItems: 'flex-start' },
  heroTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  times: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 6, zIndex: 2 },
  controlsDesktop: { alignSelf: 'flex-start' },
  play: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
