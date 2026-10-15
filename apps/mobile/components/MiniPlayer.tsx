import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { usePathname, useRouter } from 'expo-router';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Waveform } from '@/components/Waveform';
import { formatClock, trackTitle } from '@/lib/cover';
import { PLAYER_HEIGHT, useDesktop } from '@/lib/layout';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { TrackCover } from '@/components/ui';

export function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useDesktop();
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
            backgroundColor: colors.cardAlt,
            pointerEvents: 'auto',
          },
        ]}>
        <PressableScale style={styles.desktopLeft} onPress={() => router.push(`/track/${track.id}`)} scaleTo={0.99}>
          <TrackCover track={track} size={52} radius={12} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
              {trackTitle(track)}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
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
          <TrackCover track={track} size={44} radius={12} />
          <View style={styles.body}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
              {trackTitle(track)}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
              {track.authorName} · {formatClock(positionMs)}
            </Text>
          </View>
          <PressableScale onPress={toggle} hitSlop={10} style={[styles.play, { backgroundColor: colors.accent }]} scaleTo={0.88}>
            <Icon name={isPlaying ? 'pause' : 'play'} color={colors.buttonText} size={18} />
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
    left: 8,
    right: 8,
    bottom: 8,
    height: PLAYER_HEIGHT,
    borderRadius: 20,
    paddingLeft: 14,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 80,
    zIndex: 20,
  },
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  progress: {
    height: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
  },
  body: { flex: 1 },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
