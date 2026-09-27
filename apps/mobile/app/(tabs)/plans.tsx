import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TokenShop } from '@/components/TokenShop';
import { useDesktop } from '@/lib/layout';
import { formatTokenCount, PLANS } from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export default function PlansScreen() {
  const { colors, t, language } = useSettings();
  const desktop = useDesktop();
  const { planId, subscribe } = useTokens();
  const locale = language === 'en' ? 'en-US' : 'ru-RU';
  const names = { free: t.planFree, start: t.planStart, pro: t.planPro, ultra: t.planUltra };

  return (
    <ScreenBackdrop>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text style={[styles.heading, { color: colors.text }]}>{t.plansTitle}</Text>
          <Text style={[styles.copy, { color: colors.muted }]}>{t.plansCopy}</Text>

          <View style={[styles.grid, desktop && styles.gridRow]}>
            <PressableScale
              style={[styles.card, styles.planCard, { backgroundColor: colors.card }]}>
              <Text
                style={{
                  color: planId === 'free' ? colors.success : colors.text,
                  fontWeight: '800',
                  fontSize: 20,
                  textAlign: 'center',
                }}>
                {t.planFree}
              </Text>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>
                {t.planFreePrice}
              </Text>
              <Text style={{ color: colors.muted, fontWeight: '700', textAlign: 'center' }}>{t.planFreeLimit}</Text>
              <Text style={{ color: planId === 'free' ? colors.success : colors.muted, fontWeight: '700', textAlign: 'center' }}>
                {planId === 'free' ? t.planYours : t.planFreeForNew}
              </Text>
            </PressableScale>
            {PLANS.map((plan) => {
              const active = planId === plan.id;
              const popular = plan.id === 'pro';
              return (
                <PressableScale
                  key={plan.id}
                  onPress={popular ? undefined : () => subscribe(plan.id)}
                  style={[
                    styles.card,
                    styles.planCard,
                    { backgroundColor: colors.card },
                    popular && [styles.current, { borderColor: colors.accent }],
                  ]}>
                  {popular ? (
                    <View style={[styles.popular, { backgroundColor: colors.accent }]}>
                      <Text style={{ color: colors.buttonText, fontWeight: '800', fontSize: 11 }}>{t.planPopular}</Text>
                    </View>
                  ) : null}
                  <Text
                    style={{
                      color: active ? colors.success : colors.text,
                      fontWeight: '800',
                      fontSize: popular ? 26 : 20,
                      textAlign: 'center',
                    }}>
                    {t.planBadge.replace('{name}', names[plan.id])}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>
                    {t.planPerMonth.replace('{price}', plan.priceRub.toLocaleString(locale))}
                  </Text>
                  <Text style={{ color: colors.muted, fontWeight: '700', textAlign: 'center' }}>
                    {t.planTokens.replace('{n}', formatTokenCount(plan.tokens, locale))}
                  </Text>
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>
                    {t.planMinutes.replace('{n}', String(plan.minutes))}
                  </Text>
                  <Text style={{ color: active ? colors.success : colors.muted, fontWeight: '700', textAlign: 'center' }}>
                    {active ? t.planRenew : t.planBuy}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <TokenShop />
        </View>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', padding: 36, paddingBottom: 120 },
  inner: { width: '100%', maxWidth: 920, gap: 14, alignItems: 'center' },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  copy: { textAlign: 'center' },
  grid: { width: '100%', gap: 12, marginTop: 8 },
  gridRow: { flexDirection: 'row', alignItems: 'stretch' },
  card: { borderRadius: 20, padding: 18, gap: 8, width: '100%', alignItems: 'center' },
  planCard: { flex: 1 },
  current: { borderWidth: 2 },
  popular: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
});
