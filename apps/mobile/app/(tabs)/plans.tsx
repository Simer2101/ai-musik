import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { COVER_ASSETS } from '@/lib/cover';
import { AD_FREE_PRICE_RUB } from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

const HERO_COVERS = [
  COVER_ASSETS['demo-afterglow'],
  COVER_ASSETS['demo-orbit-house'],
  COVER_ASSETS['demo-night-drive'],
  COVER_ASSETS['demo-neon-rock'],
  COVER_ASSETS['demo-forest-ambient'],
  COVER_ASSETS['demo-city-hop'],
  COVER_ASSETS['demo-velvet-sad'],
  COVER_ASSETS['demo-cinema-dawn'],
  COVER_ASSETS['demo-rush-house'],
];

const PERKS: { icon: IconName; key: 'perkAds' | 'perkDownload' | 'perkWave' | 'perkOrder' | 'perkPause' | 'perkCancel' }[] =
  [
    { icon: 'speaker', key: 'perkAds' },
    { icon: 'download', key: 'perkDownload' },
    { icon: 'radio', key: 'perkWave' },
    { icon: 'shuffle', key: 'perkOrder' },
    { icon: 'headphones', key: 'perkPause' },
    { icon: 'card', key: 'perkCancel' },
  ];

export default function PlansScreen() {
  const { colors, t, language, themeName } = useSettings();
  const { adFree, removeAds } = useTokens();
  const locale = language === 'en' ? 'en-US' : 'ru-RU';
  const price = t.planPerMonth.replace('{price}', AD_FREE_PRICE_RUB.toLocaleString(locale));
  const cta = adFree ? t.planRenew : t.plansStart;
  const lightCta = themeName === 'dark';
  const bullets = [t.planBulletAds, t.planBulletAccount, t.planBulletCancel];

  return (
    <ScreenBackdrop>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={styles.hero}>
            <View style={styles.mosaic}>
              {HERO_COVERS.map((source, index) => (
                <Image key={index} source={source} style={styles.tile} />
              ))}
            </View>
            <LinearGradient
              pointerEvents="none"
              colors={[`${colors.bg}00`, colors.bg]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.body}>
            <Text style={[styles.headline, { color: colors.text }]}>{t.plansHeroTitle}</Text>
            <PressableScale
              onPress={removeAds}
              style={[
                styles.cta,
                { backgroundColor: lightCta ? '#ffffff' : colors.text },
              ]}>
              <Text style={[styles.ctaText, { color: lightCta ? '#000000' : colors.card }]}>{cta}</Text>
            </PressableScale>

            <Text style={[styles.section, { color: colors.text }]}>{t.plansAvailable}</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.brand, { color: colors.muted }]}>AImusik</Text>
              <Text style={[styles.planName, { color: colors.success }]}>{t.planAdFreeName}</Text>
              <Text style={[styles.price, { color: colors.muted }]}>{price}</Text>
              <View style={styles.bullets}>
                {bullets.map((item) => (
                  <Text key={item} style={[styles.bullet, { color: colors.text }]}>
                    {`\u2022  ${item}`}
                  </Text>
                ))}
              </View>
              <PressableScale
                onPress={removeAds}
                style={[styles.cta, { backgroundColor: colors.success }]}>
                <Text style={[styles.ctaText, { color: colors.buttonText }]}>{cta}</Text>
              </PressableScale>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.perksTitle, { color: colors.text }]}>{t.plansPerksTitle}</Text>
              <View style={[styles.perkLine, { backgroundColor: colors.border }]} />
              {PERKS.map((item) => (
                <View key={item.key} style={styles.perk}>
                  <Icon name={item.icon} color={colors.text} size={22} />
                  <Text style={[styles.perkText, { color: colors.text }]}>{t[item.key]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 120 },
  column: { width: 420, maxWidth: '100%' },
  hero: { height: 240, overflow: 'hidden' },
  mosaic: {
    position: 'absolute',
    top: -36,
    left: -48,
    right: -48,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    transform: [{ rotate: '-14deg' }],
  },
  tile: { width: 118, height: 118, borderRadius: 4 },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  headline: { fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 38 },
  cta: {
    alignSelf: 'stretch',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaText: { fontWeight: '800', fontSize: 16 },
  section: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  card: { borderRadius: 12, padding: 20, gap: 12 },
  brand: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  planName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  price: { fontSize: 15, fontWeight: '600' },
  bullets: { gap: 8, paddingVertical: 4 },
  bullet: { fontSize: 15, lineHeight: 22 },
  perksTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  perkLine: { height: 1, marginBottom: 4 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  perkText: { flex: 1, fontSize: 16, fontWeight: '600', lineHeight: 22 },
});
