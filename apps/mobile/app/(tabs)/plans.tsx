import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TokenEstimate } from '@/components/TokenHint';
import { useDesktop } from '@/lib/layout';
import { PLANS, planTitle } from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export default function PlansScreen() {
  const { colors, t } = useSettings();
  const desktop = useDesktop();
  const { planId, subscribe } = useTokens();
  const names = { free: t.planFree, lite: t.planLite, pro: t.planPro, studio: t.planStudio };

  return (
    <ScreenBackdrop>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <Text style={[styles.heading, { color: colors.text }]}>{t.plansTitle}</Text>
        <Text style={[styles.copy, { color: colors.muted }]}>{t.plansCopy}</Text>

        <Text style={[styles.section, { color: colors.text }]}>{t.plansSection}</Text>
        <View style={[styles.grid, desktop && styles.gridRow]}>
          {PLANS.map((plan) => {
            const active = planId === plan.id;
            const popular = plan.id === 'pro';
            return (
              <PressableScale
                key={plan.id}
                onPress={() => subscribe(plan.id)}
                style={[
                  styles.card,
                  styles.planCard,
                  { backgroundColor: colors.card },
                  popular && !active && [styles.current, { borderColor: colors.accent }],
                  active && [styles.current, { borderColor: colors.success }],
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
                <Text style={{ color: colors.text, fontWeight: '700', textAlign: 'center' }}>
                  {plan.priceRub.toLocaleString('ru-RU')} ₽ · {plan.tokens} {t.tokensLabel.toLowerCase()}
                </Text>
                <TokenEstimate tokens={plan.tokens} center />
                <Text style={{ color: active ? colors.success : colors.muted, fontWeight: '700', textAlign: 'center' }}>
                  {active ? t.planAlready : t.planBuy}
                </Text>
              </PressableScale>
            );
          })}
        </View>
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
  section: { fontSize: 20, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  grid: { width: '100%', gap: 12 },
  gridRow: { flexDirection: 'row', alignItems: 'stretch' },
  card: { borderRadius: 20, padding: 18, gap: 8, width: '100%', alignItems: 'center' },
  planCard: { flex: 1 },
  current: { borderWidth: 2 },
  popular: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
