import { Text, View } from 'react-native';

import { tracksFromTokens } from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';

export function TokenEstimate({ tokens, center }: { tokens: number; center?: boolean }) {
  const { colors, t } = useSettings();
  const minutes = tracksFromTokens(tokens).min1;

  return (
    <Text style={{ color: colors.muted, lineHeight: 20, textAlign: center ? 'center' : 'left' }}>
      ≈ {t.tokensEstimate.replace('{n}', String(minutes))}
    </Text>
  );
}

export function TokenHint({
  tokens,
  granted,
  center,
}: {
  tokens: number;
  granted?: boolean;
  center?: boolean;
}) {
  const { colors, t } = useSettings();
  const title = (granted ? t.tokensGranted : t.tokensBalance).replace('{n}', String(tokens));

  return (
    <View style={{ gap: 6, alignItems: center ? 'center' : 'flex-start' }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, textAlign: center ? 'center' : 'left' }}>
        {title}
      </Text>
      <TokenEstimate tokens={tokens} center={center} />
    </View>
  );
}
