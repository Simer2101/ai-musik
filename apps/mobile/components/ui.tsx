import type { ReactNode } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { coverColors, coverSource, coverUri, formatClock, trackTitle } from '@/lib/cover';
import { genreLabel } from '@/lib/wave';
import type { Track } from '@/lib/types';
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
  const inset = size >= 120 ? 10 : size >= 64 ? 6 : 4;
  const art = Math.max(24, size - inset * 2);
  const shadow = size > 80 ? '0 14px 28px rgba(0,0,0,0.45)' : '0 4px 12px rgba(0,0,0,0.22)';
  const frame = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden' as const,
    backgroundColor: colors.cardAlt,
    boxShadow: shadow,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: inset,
  };

  const webUri = coverUri(track);
  if (Platform.OS === 'web' && webUri) {
    return (
      <View style={frame}>
        <img
          className="aimusik-cover"
          src={webUri}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
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
        <Image source={source} resizeMode="contain" style={{ width: art, height: art }} />
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
      <TrackCover track={track} size={52} radius={10} />
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
      {onLike ? (
        <PressableScale onPress={onLike} hitSlop={12} scaleTo={0.86}>
          <Icon
            name={track.liked ? 'heartFilled' : 'heart'}
            color={track.liked ? colors.accent2 : colors.muted}
            size={20}
          />
        </PressableScale>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {track.aiGenerated ? t.aiGenerated : t.userUpload}
        </Text>
      )}
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
  return <Text style={[styles.section, { color: colors.text }]}>{children}</Text>;
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
  title: { fontSize: 16, fontWeight: '600' },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
    boxShadow: '0 10px 24px rgba(139, 124, 255, 0.28)',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontWeight: '800', fontSize: 16 },
  section: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
});
