import { StyleSheet, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';

import { PressableScale } from '@/components/PressableScale';
import { SIDEBAR_WIDTH } from '@/lib/layout';
import { useSettings } from '@/providers/SettingsProvider';

export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, t } = useSettings();

  const items: { href: Href; label: string }[] = [
    { href: '/', label: t.tabListen },
    { href: '/wave', label: t.waveTitle },
    { href: '/publish', label: t.tabPublish },
    { href: '/library', label: t.tabLibrary },
    { href: '/plans', label: t.tabPlans },
    { href: '/profile', label: t.tabProfile },
  ];

  return (
    <View style={[styles.side, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
      <Text style={[styles.logo, { color: colors.accent }]}>AImusik</Text>
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <PressableScale
            key={item.href}
            onPress={() => router.push(item.href)}
            scaleTo={0.98}
            style={[styles.item, active && { backgroundColor: colors.cardAlt }]}>
            <Text style={{ color: active ? colors.text : colors.muted, fontWeight: active ? '800' : '600' }}>
              {item.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    width: SIDEBAR_WIDTH,
    paddingTop: 28,
    paddingHorizontal: 16,
    gap: 6,
    borderRightWidth: 1,
  },
  logo: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginBottom: 18 },
  item: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
});
