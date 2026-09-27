import { Text, View } from 'react-native';

import { formatTokenCount, generationTimeFromTokens } from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';

export function TokenEstimate({ tokens, center }: { tokens: number; center?: boolean }) {
  const { colors, t } = useSettings();
  const time = generationTimeFromTokens(tokens);
  const label =
    time.minutes === 0
      ? t.tokensAvailableSeconds.replace('{seconds}', String(time.seconds))
      : time.seconds === 0
        ? t.tokensAvailable.replace('{minutes}', String(time.minutes))
        : t.tokensAvailableWithSeconds
            .replace('{minutes}', String(time.minutes))
            .replace('{seconds}', String(time.seconds));

  return (
    <Text style={{ color: colors.muted, lineHeight: 20, textAlign: center ? 'center' : 'left' }}>{label}</Text>
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
  const { colors, t, language } = useSettings();
  const locale = language === 'en' ? 'en-US' : 'ru-RU';
  const title = (granted ? t.tokensGranted : t.tokensBalance).replace('{n}', formatTokenCount(tokens, locale));

  return (
    <View style={{ gap: 6, alignItems: center ? 'center' : 'flex-start' }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, textAlign: center ? 'center' : 'left' }}>
        {title}
      </Text>
      <TokenEstimate tokens={tokens} center={center} />
    </View>
  );
}
