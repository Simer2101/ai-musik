import { Image, View } from 'react-native';

import { Text } from '@/components/AppText';
import { AVATAR_DEMO } from '@/lib/cover';
import { useProfile } from '@/providers/ProfileProvider';
import { useSettings } from '@/providers/SettingsProvider';

/** The listener's avatar: their own photo, else the demo picture, or their initial when `initialOnly`. */
export function Avatar({ size, uri, initialOnly }: { size: number; uri?: string | null; initialOnly?: boolean }) {
  const { colors } = useSettings();
  const { profile } = useProfile();
  const source = uri !== undefined ? uri : profile.avatarUri;

  if (!source && initialOnly) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: size * 0.36 }}>
          {profile.displayName.slice(0, 1).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={source ? { uri: source } : AVATAR_DEMO}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.cardAlt }}
    />
  );
}
