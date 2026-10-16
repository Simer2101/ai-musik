import { StyleSheet, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';

import { Text } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { fonts } from '@/constants/Fonts';
import { PLAYER_HEIGHT, SIDEBAR_WIDTH } from '@/lib/layout';
import { AD_FREE_PRICE_RUB } from '@/lib/tokens';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, t, language } = useSettings();
  const { adFree } = useTokens();
  const { track } = usePlayer();

  const items: { href: Href; label: string; icon: IconName }[] = [
    { href: '/', label: t.tabListen, icon: 'headphones' },
    { href: '/wave', label: t.waveTitle, icon: 'radio' },
    { href: '/library', label: t.tabLibrary, icon: 'library' },
    { href: '/plans', label: t.tabPlans, icon: 'star' },
    { href: '/profile', label: t.tabProfile, icon: 'person' },
  ];
  const price = t.planPerMonth.replace(
    '{price}',
    AD_FREE_PRICE_RUB.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')
  );

  return (
    <View style={[styles.side, { backgroundColor: colors.hero, marginBottom: track ? PLAYER_HEIGHT + 16 : 8 }]}>
      <Text style={[styles.logo, fonts.display('800'), { color: colors.text }]}>
        Son<Text style={[fonts.display('800'), { color: colors.accent2 }]}>ari</Text>
      </Text>
      <View style={styles.items}>
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href as string);
          const tint = active ? colors.text : colors.muted;
          return (
            <PressableScale
              key={item.href as string}
              onPress={() => router.push(item.href)}
              scaleTo={0.98}
              style={[styles.item, active && { backgroundColor: colors.cardAlt }]}>
              <Icon name={item.icon} color={tint} size={22} />
              <Text style={{ color: tint, fontWeight: '600', fontSize: 15 }}>{item.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      {adFree ? null : (
        <View style={[styles.promo, { backgroundColor: colors.card }]}>
          <Text style={[fonts.display('700'), { color: colors.text, fontSize: 15 }]}>{t.planAdFreeName}</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
            {t.plansCopy} {price}
          </Text>
          <PressableScale
            onPress={() => router.push('/plans')}
            scaleTo={0.97}
            style={[styles.promoButton, { backgroundColor: colors.accent }]}>
            <Text style={{ color: colors.buttonText, fontWeight: '700', fontSize: 14 }}>{t.planBuy}</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    width: SIDEBAR_WIDTH,
    margin: 8,
    marginRight: 0,
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 14,
    gap: 28,
  },
  logo: { fontSize: 22, letterSpacing: -0.4, paddingHorizontal: 10 },
  items: { gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  promo: { marginTop: 'auto', borderRadius: 16, padding: 16, gap: 10 },
  promoButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
});
