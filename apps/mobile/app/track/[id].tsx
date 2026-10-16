import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';

import { AdBanner } from '@/components/AdBanner';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { TrackCover } from '@/components/ui';
import { Waveform } from '@/components/Waveform';
import { coverColors, trackTitle } from '@/lib/cover';
import { api } from '@/lib/api';
import { downloadTrack } from '@/lib/download';
import { demoApi } from '@/lib/demo';
import { genreLabel } from '@/lib/wave';
import { useDesktop } from '@/lib/layout';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

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
  const { adFree } = useTokens();
  const [downloadState, setDownloadState] = useState<'idle' | 'busy' | 'locked' | 'failed'>('idle');
  const [likeError, setLikeError] = useState<string | null>(null);
  const likeBusy = useRef(false);

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
      <View style={{ paddingHorizontal: desktop ? 0 : 24 }}>
        <AdBanner />
      </View>
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
          <View style={styles.seek}>
            <Waveform
              positionMs={active ? positionMs : 0}
              durationMs={active ? durationMs || track.durationMs : track.durationMs}
              onSeek={async (ms) => {
                // Start this track first; the player holds the seek until it has loaded.
                if (!active) await play(track, related.length ? [track, ...related] : [track]);
                void seek(ms);
              }}
            />
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
            if (likeBusy.current) return;
            likeBusy.current = true;
            // Flip the heart at once; roll back only if the server says no.
            const before = track;
            const liked = !before.liked;
            setLikeError(null);
            setTrack({ ...before, liked, likeCount: Math.max(0, before.likeCount + (liked ? 1 : -1)) });
            try {
              if (liked) await api.like(before.id);
              else await api.unlike(before.id);
            } catch (err) {
              setTrack(before);
              setLikeError(err instanceof Error && err.message ? err.message : t.likeFail);
            } finally {
              likeBusy.current = false;
            }
          }}
          scaleTo={0.94}
          accessibilityRole="button"
          accessibilityState={{ selected: track.liked }}
          style={[
            styles.like,
            {
              borderColor: track.liked ? colors.accent2 : colors.border,
              backgroundColor: track.liked ? colors.cardAlt : 'transparent',
            },
          ]}>
          <Icon
            name={track.liked ? 'heartFilled' : 'heart'}
            color={track.liked ? colors.accent2 : colors.text}
            size={20}
          />
          <Text style={{ color: track.liked ? colors.accent2 : colors.text, fontWeight: '700' }}>
            {track.liked ? t.likedShort : t.like}
          </Text>
          {track.likeCount > 0 ? (
            <Text style={{ color: colors.muted, fontWeight: '600' }}>{track.likeCount}</Text>
          ) : null}
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
      {likeError ? (
        <Text style={{ color: colors.danger, paddingHorizontal: 24, marginTop: -6 }}>{likeError}</Text>
      ) : null}
      {track.status === 'ready' && track.audioUrl ? (
        <View style={{ gap: 10 }}>
          <PressableScale
            disabled={downloadState === 'busy'}
            onPress={async () => {
              // Downloads are a Premium perk; free listeners get the upsell instead.
              if (!adFree) return setDownloadState('locked');
              setDownloadState('busy');
              try {
                await downloadTrack(track);
                setDownloadState('idle');
              } catch {
                setDownloadState('failed');
              }
            }}
            style={[styles.download, { borderColor: colors.border }]}>
            <Icon name="download" color={adFree ? colors.text : colors.muted} size={20} />
            <Text style={{ color: adFree ? colors.text : colors.muted, fontWeight: '600' }}>
              {downloadState === 'busy' ? t.downloading : t.download}
            </Text>
            {adFree ? null : (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={{ color: colors.buttonText, fontSize: 11, fontWeight: '700' }}>Premium</Text>
              </View>
            )}
          </PressableScale>
          {downloadState === 'locked' ? (
            <View style={[styles.locked, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, flex: 1 }}>{t.downloadLocked}</Text>
              <PressableScale onPress={() => router.push('/plans')} style={[styles.badge, styles.lockedCta, { backgroundColor: colors.accent }]}>
                <Text style={{ color: colors.buttonText, fontWeight: '700' }}>{t.planBuy}</Text>
              </PressableScale>
            </View>
          ) : null}
          {downloadState === 'failed' ? <Text style={{ color: colors.danger }}>{t.downloadFailed}</Text> : null}
        </View>
      ) : null}
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
  row: { flexDirection: 'row', gap: 18, paddingHorizontal: 24, alignItems: 'center' },
  seek: { paddingHorizontal: 24 },
  like: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
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
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  locked: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  lockedCta: { paddingHorizontal: 16, minHeight: 40, justifyContent: 'center' },
});
