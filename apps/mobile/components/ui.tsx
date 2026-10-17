import type { ReactNode } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { coverColors, coverSource, coverUri, formatClock, trackTitle } from '@/lib/cover';
import { genreLabel } from '@/lib/wave';
import type { Track } from '@/lib/types';
import { fonts } from '@/constants/Fonts';
import { useSettings } from '@/providers/SettingsProvider';

export function TrackCover({
  track,
  size = 64,
  radius = 6,
}: {
  track: Track;
  size?: number;
  radius?: number;
}) {
  const { colors } = useSettings();
  const [from, to] = coverColors(track.id);
  const source = coverSource(track);
  const frame = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden' as const,
    backgroundColor: colors.cardAlt,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const webUri = coverUri(track);
  if (Platform.OS === 'web' && webUri) {
    return (
      <View style={frame}>
        <img
          className="sonari-cover"
          src={webUri}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </View>
    );
  }

  if (source) {
    return (
      <View style={frame}>
        <Image source={source} resizeMode="cover" style={{ width: size, height: size }} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={frame}>
      <View style={styles.coverFallback}>
        <Text style={styles.coverLabel}>{(track.genre || 'AI').slice(0, 1)}</Text>
      </View>
    </LinearGradient>
  );
}

export function TrackRow({
  track,
  onPress,
  onLike,
}: {
  track: Track;
  onPress: () => void;
  onLike?: () => void;
}) {
  const { colors, t } = useSettings();
  return (
    <PressableScale onPress={onPress} style={styles.row} scaleTo={0.985}>
      <TrackCover track={track} size={52} radius={12} />
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {trackTitle(track)}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
          {track.authorName}
          {track.genre ? ` · ${genreLabel(track.genre, t)}` : ''}
          {` · ${formatClock(track.durationMs)}`}
        </Text>
      </View>
      {/* Stores want the AI label on every track, so the heart sits beside it, never instead. */}
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
        {track.aiGenerated ? t.aiGenerated : t.userUpload}
      </Text>
      {onLike ? (
        <PressableScale
          onPress={onLike}
          hitSlop={8}
          scaleTo={0.86}
          accessibilityRole="button"
          accessibilityLabel={track.liked ? t.likedShort : t.like}
          accessibilityState={{ selected: track.liked }}
          style={styles.rowLike}>
          <Icon
            name={track.liked ? 'heartFilled' : 'heart'}
            color={track.liked ? colors.accent2 : colors.muted}
            size={22}
          />
        </PressableScale>
      ) : null}
    </PressableScale>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useSettings();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.97}
      style={[styles.button, { backgroundColor: colors.accent }, disabled && styles.buttonDisabled]}>
      <Text style={[styles.buttonText, { color: colors.buttonText }]}>{title}</Text>
    </PressableScale>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useSettings();
  return <Text style={[styles.section, fonts.display('700'), { color: colors.text }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowLike: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600' },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontWeight: '800', fontSize: 16 },
  section: { fontSize: 19, letterSpacing: -0.3 },
});
