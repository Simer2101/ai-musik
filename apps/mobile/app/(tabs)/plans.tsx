import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TokenShop } from '@/components/TokenShop';
import { AD_FREE_PRICE_RUB } from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export default function PlansScreen() {
  const { colors, t, language } = useSettings();
  const { adFree, removeAds } = useTokens();
  const locale = language === 'en' ? 'en-US' : 'ru-RU';

  return (
    <ScreenBackdrop>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text style={[styles.heading, { color: colors.text }]}>{t.plansTitle}</Text>
          <Text style={[styles.copy, { color: colors.muted }]}>{t.plansCopy}</Text>

          <PressableScale
            onPress={removeAds}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.accent },
              adFree && styles.current,
            ]}>
            <Text style={{ color: adFree ? colors.success : colors.text, fontWeight: '800', fontSize: 26, textAlign: 'center' }}>
              {t.planAdFree}
            </Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>
              {t.planPerMonth.replace('{price}', AD_FREE_PRICE_RUB.toLocaleString(locale))}
            </Text>
            <Text style={{ color: colors.muted, fontWeight: '700', textAlign: 'center' }}>{t.planAdFreeBenefit}</Text>
            <Text style={{ color: adFree ? colors.success : colors.muted, fontWeight: '700', textAlign: 'center' }}>
              {adFree ? t.planRenew : t.planBuy}
            </Text>
          </PressableScale>

          <TokenShop />
        </View>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', padding: 36, paddingBottom: 120 },
  inner: { width: '100%', maxWidth: 460, gap: 14, alignItems: 'center' },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  copy: { textAlign: 'center' },
  card: { borderRadius: 20, padding: 22, gap: 8, width: '100%', alignItems: 'center', borderWidth: 2 },
  current: { borderWidth: 2 },
});
