import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { fonts } from '@/constants/Fonts';
import { COVER_ASSETS } from '@/lib/cover';
import { useDesktop } from '@/lib/layout';
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

type PerkTileProps = { icon: IconName; title: string; text: string };

// "What Premium gives": one lime headline tile for ad-free listening, plus smaller perk tiles.
function PerksPanel() {
  const { colors, t } = useSettings();
  const tint = `${colors.accent}1f`;
  const Tile = ({ icon, title, text }: PerkTileProps) => (
    <View
      style={[styles.perkTile, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <View style={[styles.perkIcon, { backgroundColor: tint }]}>
        <Icon name={icon} color={colors.accent} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>{text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.perkLayout}>
      <View style={[styles.perkHero, { backgroundColor: colors.accent }]}>
        <Icon name="speaker" color={colors.buttonText} size={36} />
        <View style={{ gap: 8 }}>
          <Text style={[fonts.display('800'), { color: colors.buttonText, fontSize: 22, lineHeight: 26, letterSpacing: -0.4 }]}>
            {t.perkAdsTitle}
          </Text>
          <Text style={{ color: colors.buttonText, fontSize: 14, lineHeight: 20, fontWeight: '500' }}>{t.perkAdsText}</Text>
        </View>
      </View>
      <View style={styles.perkSide}>
        <Tile icon="download" title={t.perkDownloadTitle} text={t.perkDownloadText} />
        <Tile icon="shuffle" title={t.perkOrderTitle} text={t.perkOrderText} />
        <Tile icon="card" title={t.perkCancelTitle} text={t.perkCancelText} />
      </View>
    </View>
  );
}

export default function PlansScreen() {
  const { colors, t, language, themeName } = useSettings();
  const { adFree, removeAds } = useTokens();
  const locale = language === 'en' ? 'en-US' : 'ru-RU';
  const price = t.planPerMonth.replace('{price}', AD_FREE_PRICE_RUB.toLocaleString(locale));
  const cta = adFree ? t.planRenew : t.plansStart;
  const lightCta = themeName === 'dark';
  const bullets = [t.planBulletAds, t.planBulletDownload, t.planBulletCancel];
  const desktop = useDesktop();

  if (desktop) {
    // On desktop the screen sits in a panel coloured `hero`, so the mosaic fades into that.
    const ground = colors.hero;
    return (
      <ScreenBackdrop>
        <ScrollView style={styles.screen} contentContainerStyle={styles.wideContent}>
          <View style={styles.wideHero}>
            <View style={styles.wideMosaic}>
              {[...HERO_COVERS, ...HERO_COVERS, ...HERO_COVERS].map((source, index) => (
                <Image key={index} source={source} style={styles.wideTile} />
              ))}
            </View>
            <LinearGradient
              pointerEvents="none"
              colors={[`${ground}33`, `${ground}cc`, ground]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[ground, `${ground}00`]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0.75, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.wideHeroText}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12, letterSpacing: 1.6 }}>
                {t.planAdFreeName.toUpperCase()} · {price}
              </Text>
              <Text style={[fonts.display('700'), styles.wideHeadline, { color: colors.text }]}>{t.plansHeroTitle}</Text>
              <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 26, maxWidth: 480 }}>{t.plansCopy}</Text>
              <PressableScale
                onPress={removeAds}
                scaleTo={0.97}
                style={[styles.wideCta, { backgroundColor: colors.accent }]}>
                <Text style={[styles.ctaText, { color: colors.buttonText }]}>{cta}</Text>
              </PressableScale>
            </View>
          </View>

          <View style={styles.wideBody}>
            <View style={[styles.card, styles.widePlan, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.brand, { color: colors.muted }]}>Sonari</Text>
              <Text style={[fonts.display('700'), { color: colors.accent, fontSize: 30, lineHeight: 36 }]}>
                {t.planAdFreeName}
              </Text>
              <Text style={[styles.price, { color: colors.muted }]}>{price}</Text>
              <View style={[styles.perkLine, { backgroundColor: colors.border }]} />
              <View style={styles.bullets}>
                {bullets.map((item) => (
                  <View key={item} style={styles.check}>
                    <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.bullet, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{t.downloadNote}</Text>
              <PressableScale onPress={removeAds} style={[styles.cta, { backgroundColor: colors.accent, marginTop: 'auto' }]}>
                <Text style={[styles.ctaText, { color: colors.buttonText }]}>{cta}</Text>
              </PressableScale>
            </View>

            <View style={[styles.card, styles.widePerks, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[fonts.display('700'), { color: colors.text, fontSize: 22 }]}>{t.plansPerksTitle}</Text>
              <PerksPanel />
            </View>
          </View>
        </ScrollView>
      </ScreenBackdrop>
    );
  }

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
              <Text style={[styles.brand, { color: colors.muted }]}>Sonari</Text>
              <Text style={[styles.planName, { color: colors.success }]}>{t.planAdFreeName}</Text>
              <Text style={[styles.price, { color: colors.muted }]}>{price}</Text>
              <View style={styles.bullets}>
                {bullets.map((item) => (
                  <Text key={item} style={[styles.bullet, { color: colors.text }]}>
                    {`\u2022  ${item}`}
                  </Text>
                ))}
              </View>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{t.downloadNote}</Text>
              <PressableScale
                onPress={removeAds}
                style={[styles.cta, { backgroundColor: colors.success }]}>
                <Text style={[styles.ctaText, { color: colors.buttonText }]}>{cta}</Text>
              </PressableScale>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[fonts.display('700'), { color: colors.text, fontSize: 20 }]}>{t.plansPerksTitle}</Text>
              <PerksPanel />
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
  perkLine: { height: 1, marginBottom: 4 },
  wideContent: { paddingBottom: 40 },
  wideHero: { height: 420, overflow: 'hidden', justifyContent: 'flex-end' },
  wideMosaic: {
    position: 'absolute',
    top: -120,
    left: '28%',
    right: -160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    transform: [{ rotate: '-12deg' }],
  },
  wideTile: { width: 168, height: 168, borderRadius: 14 },
  wideHeroText: { paddingHorizontal: 48, paddingBottom: 40, gap: 14, maxWidth: 720 },
  wideHeadline: { fontSize: 48, lineHeight: 54, letterSpacing: -1 },
  wideCta: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  wideBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    paddingHorizontal: 48,
    width: '100%',
    maxWidth: 1340,
  },
  widePlan: { flexGrow: 1, flexShrink: 1, flexBasis: 320, borderWidth: 1, borderRadius: 24, padding: 28, gap: 14 },
  widePerks: { flexGrow: 2, flexShrink: 1, flexBasis: 520, borderWidth: 1, borderRadius: 24, padding: 28, gap: 20 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  perkLayout: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  perkHero: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 190,
    minHeight: 220,
    borderRadius: 22,
    padding: 24,
    justifyContent: 'space-between',
    gap: 24,
  },
  perkSide: { flexGrow: 2, flexShrink: 1, flexBasis: 280, gap: 12 },
  perkTile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  perkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
