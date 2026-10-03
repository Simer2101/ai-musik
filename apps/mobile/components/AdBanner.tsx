import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export function AdBanner() {
  const router = useRouter();
  const { colors, t } = useSettings();
  const { adFree } = useTokens();
  if (adFree) return null;

  return (
    <PressableScale
      onPress={() => router.push('/plans')}
      scaleTo={0.985}
      style={[styles.ad, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{t.adLabel}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{t.adTitle}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{t.adBody}</Text>
      <View style={[styles.cta, { backgroundColor: colors.accent }]}>
        <Text style={{ color: colors.buttonText, fontWeight: '800', fontSize: 13 }}>{t.adCta}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  ad: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '800' },
  body: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cta: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
});
