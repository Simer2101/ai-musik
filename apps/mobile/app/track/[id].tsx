import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { TrackCover } from '@/components/ui';
import { Waveform } from '@/components/Waveform';
import { coverColors, formatClock, trackTitle } from '@/lib/cover';
import { api } from '@/lib/api';
import { commentsFor, demoApi } from '@/lib/demo';
import { genreLabel } from '@/lib/wave';
import { useDesktop } from '@/lib/layout';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    play,
    toggle,
    next,
    prev,
    seek,
    track: current,
    isPlaying,
    positionMs,
    durationMs,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();
  const { colors, t } = useSettings();
  const desktop = useDesktop();
  const [track, setTrack] = useState<Track | null>(null);
  const [related, setRelated] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = {
    queued: t.statusQueued,
    generating: t.statusGenerating,
    ready: t.statusReady,
    failed: t.statusFailed,
  };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.track(id);
      setTrack(data.track);
      const feed = await api.feed().catch(() => demoApi.feed());
      setRelated(
        feed.tracks.filter((item) => item.id !== id && item.genre === data.track.genre).slice(0, 4)
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.trackMissing);
    }
  }, [id, t.trackMissing]);

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
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted }}>{error ?? t.loading}</Text>
      </View>
    );
  }

  const active = current?.id === track.id;
  const tint = coverColors(track.id);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, desktop && styles.contentDesktop]}>
      <LinearGradient colors={[tint[0], colors.bg]} style={[styles.hero, desktop && styles.heroDesktop]}>
        <TrackCover track={track} size={desktop ? 340 : 280} radius={8} />
        {desktop ? (
          <View style={styles.metaDesktop}>
            <Text style={[styles.title, { color: colors.text }]}>{trackTitle(track)}</Text>
            <Text style={{ color: colors.muted, fontSize: 18 }}>{track.authorName}</Text>
            <Text style={{ color: colors.muted }}>
              {genreLabel(track.genre, t)}
              {track.playCount ? ` · ${track.playCount} ${t.plays}` : ''}
            </Text>
          </View>
        ) : null}
      </LinearGradient>
      <View style={[styles.meta, desktop && { display: 'none' }]}>
        <Text style={[styles.title, { color: colors.text }]}>{trackTitle(track)}</Text>
        <Text style={{ color: colors.muted }}>{track.authorName}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {genreLabel(track.genre, t)} · {statusLabel[track.status]}
          {track.playCount ? ` · ${track.playCount} ${t.plays}` : ''}
        </Text>
      </View>
      {track.status === 'queued' || track.status === 'generating' ? (
        <Text style={{ color: colors.muted }}>{t.generatingTrack}</Text>
      ) : null}
      {track.status === 'failed' ? (
        <Text style={{ color: colors.danger }}>{track.errorMessage}</Text>
      ) : null}
      {track.status === 'ready' ? (
        <>
          <Waveform
            progress={active && durationMs ? positionMs / durationMs : 0}
            onSeek={(ratio) => {
              if (!active) void play(track, related.length ? [track, ...related] : [track]);
              void seek((durationMs || track.durationMs) * ratio);
            }}
          />
          <View style={styles.times}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{formatClock(active ? positionMs : 0)}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {formatClock(active ? durationMs || track.durationMs : track.durationMs)}
            </Text>
          </View>
          <View style={styles.controls}>
            <PressableScale onPress={toggleShuffle} hitSlop={14}>
              <Icon name="shuffle" color={shuffle ? colors.accent2 : colors.muted} size={22} />
            </PressableScale>
            <PressableScale
              onPress={() => {
                if (active) void prev();
                else void play(track, related.length ? [track, ...related] : [track]);
              }}
              hitSlop={14}>
              <Icon name="prev" color={colors.text} size={28} />
            </PressableScale>
            <PressableScale
              onPress={() => {
                if (active) void toggle();
                else void play(track, related.length ? [track, ...related] : [track]);
              }}
              style={[styles.play, { backgroundColor: colors.accent }]}>
              <Icon name={active && isPlaying ? 'pause' : 'play'} color={colors.buttonText} size={26} />
            </PressableScale>
            <PressableScale
              onPress={() => {
                if (active) void next();
                else void play(track, related.length ? [track, ...related] : [track]);
              }}
              hitSlop={14}>
              <Icon name="next" color={colors.text} size={28} />
            </PressableScale>
            <PressableScale onPress={toggleRepeat} hitSlop={14}>
              <Icon name="repeat" color={repeat ? colors.accent2 : colors.muted} size={22} />
            </PressableScale>
          </View>
        </>
      ) : null}
      <View style={styles.row}>
        <PressableScale
          onPress={async () => {
            try {
              if (track.liked) await api.unlike(track.id);
              else await api.like(track.id);
              await load();
            } catch (err) {
              Alert.alert(t.signInRequired, err instanceof Error ? err.message : t.likeFail);
            }
          }}>
          <View style={styles.likeRow}>
            <Icon
              name={track.liked ? 'heartFilled' : 'heart'}
              color={track.liked ? colors.accent2 : colors.text}
              size={20}
            />
            <Text style={{ color: track.liked ? colors.accent2 : colors.text, fontWeight: '700' }}>
              {track.likeCount}
            </Text>
          </View>
        </PressableScale>
        <PressableScale
          onPress={() => {
            Alert.prompt
              ? Alert.prompt(t.reportTitle, t.reportBody, async (reason) => {
                  if (!reason) return;
                  try {
                    await api.report(track.id, reason);
                    Alert.alert(t.thanks, t.reportReceived);
                  } catch (err) {
                    Alert.alert(t.reportFail, err instanceof Error ? err.message : '');
                  }
                })
              : Alert.alert(t.reportTitle, t.reportBody);
          }}>
          <Text style={{ color: colors.muted }}>{t.report}</Text>
        </PressableScale>
      </View>
      {related.length ? (
        <View style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>{t.related}</Text>
          {related.map((item) => (
            <PressableScale
              key={item.id}
              onPress={() => router.replace(`/track/${item.id}`)}
              style={styles.related}>
              <TrackCover track={item} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{trackTitle(item)}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{item.authorName}</Text>
              </View>
            </PressableScale>
          ))}
        </View>
      ) : null}
      <View style={styles.block}>
        <Text style={[styles.blockTitle, { color: colors.text }]}>{t.comments}</Text>
        {commentsFor(track.id).map((item) => (
          <View key={item.id} style={styles.comment}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{item.author}</Text>
            <Text style={{ color: colors.muted }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 140, gap: 14 },
  contentDesktop: { paddingHorizontal: 48, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingTop: 12, paddingBottom: 28 },
  heroDesktop: { flexDirection: 'row', alignItems: 'flex-end', gap: 32, paddingHorizontal: 8 },
  metaDesktop: { flex: 1, gap: 8, paddingBottom: 8 },
  meta: { paddingHorizontal: 24, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  times: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  row: { flexDirection: 'row', gap: 18, paddingHorizontal: 24, alignItems: 'center' },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 28,
    zIndex: 2,
  },
  play: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  block: { paddingHorizontal: 24, gap: 10, marginTop: 8 },
  blockTitle: { fontSize: 20, fontWeight: '800' },
  related: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  comment: { gap: 4, paddingVertical: 8 },
});
