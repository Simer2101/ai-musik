import { StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Waveform } from '@/components/Waveform';
import { formatClock, trackTitle } from '@/lib/cover';
import { PLAYER_HEIGHT, SIDEBAR_WIDTH, useDesktop } from '@/lib/layout';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { TrackCover } from '@/components/ui';

export function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useDesktop();
  const onTabs =
    pathname === '/' ||
    ['/wave', '/library', '/profile', '/plans'].some((path) => pathname.startsWith(path));
  const { colors } = useSettings();
  const { track, isPlaying, positionMs, durationMs, toggle, next, prev, seek } = usePlayer();
  if (!track || pathname.startsWith('/track/') || pathname.startsWith('/wave')) return null;

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;

  if (desktop) {
    return (
      <View
        style={[
          styles.desktop,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingLeft: onTabs ? SIDEBAR_WIDTH + 16 : 16,
            pointerEvents: 'auto',
          },
        ]}>
        <PressableScale style={styles.desktopLeft} onPress={() => router.push(`/track/${track.id}`)} scaleTo={0.99}>
          <TrackCover track={track} size={56} radius={10} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700' }}>
              {trackTitle(track)}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
              {track.authorName}
            </Text>
          </View>
        </PressableScale>
        <View style={styles.desktopCenter}>
          <View style={styles.desktopControls}>
            <PressableScale onPress={() => void prev()} hitSlop={12} scaleTo={0.88}>
              <Icon name="prev" color={colors.muted} size={22} />
            </PressableScale>
            <PressableScale
              onPress={toggle}
              style={[styles.playLg, { backgroundColor: colors.accent }]}
              scaleTo={0.9}>
              <Icon name={isPlaying ? 'pause' : 'play'} color={colors.buttonText} size={20} />
            </PressableScale>
            <PressableScale onPress={() => void next()} hitSlop={12} scaleTo={0.88}>
              <Icon name="next" color={colors.muted} size={22} />
            </PressableScale>
          </View>
          <View style={styles.desktopWave}>
            <Text style={{ color: colors.muted, fontSize: 11, width: 36 }}>{formatClock(positionMs)}</Text>
            <Waveform
              progress={progress}
              onSeek={(ratio) => void seek((durationMs || track.durationMs) * ratio)}
            />
            <Text style={{ color: colors.muted, fontSize: 11, width: 36, textAlign: 'right' }}>
              {formatClock(durationMs || track.durationMs)}
            </Text>
          </View>
        </View>
        <View style={styles.desktopSpacer} />
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <PressableScale
        onPress={() => router.push(`/track/${track.id}`)}
        style={[styles.wrap, { backgroundColor: colors.cardAlt }]}
        scaleTo={0.99}>
        <View style={[styles.progress, { width: `${progress * 100}%`, backgroundColor: colors.accent2 }]} />
        <View style={styles.row}>
          <TrackCover track={track} size={40} radius={10} />
          <View style={styles.body}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
              {trackTitle(track)}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11 }}>
              {track.authorName} · {formatClock(positionMs)}
            </Text>
          </View>
          <PressableScale onPress={toggle} hitSlop={10} style={[styles.play, { backgroundColor: colors.text }]} scaleTo={0.88}>
            <Icon name={isPlaying ? 'pause' : 'play'} color={colors.bg} size={16} />
          </PressableScale>
          <PressableScale onPress={() => void next()} hitSlop={10} scaleTo={0.88}>
            <Icon name="next" color={colors.text} size={20} />
          </PressableScale>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PLAYER_HEIGHT,
    borderTopWidth: 1,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 16,
  },
  desktopLeft: {
    flex: 1,
    minWidth: 0,
    maxWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopCenter: {
    flex: 2,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  desktopSpacer: { flex: 1, maxWidth: 280 },
  desktopControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  desktopWave: { width: '100%', maxWidth: 560, flexDirection: 'row', alignItems: 'center', gap: 8 },
  playLg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(139, 124, 255, 0.35)',
  },
  outer: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 64,
    zIndex: 20,
  },
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  progress: {
    height: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  body: { flex: 1 },
  play: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
