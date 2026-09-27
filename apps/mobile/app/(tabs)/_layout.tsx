import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';

import { DesktopNav } from '@/components/DesktopNav';
import { Icon, type IconName } from '@/components/Icon';
import { useDesktop } from '@/lib/layout';
import { useSettings } from '@/providers/SettingsProvider';

function tabIcon(name: IconName) {
  const TabIcon = ({ color }: { color: ColorValue; focused: boolean; size: number }) => (
    <Icon name={name} color={String(color)} size={24} />
  );
  return TabIcon;
}

export default function TabLayout() {
  const { colors, t } = useSettings();
  const desktop = useDesktop();

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {desktop ? <DesktopNav /> : null}
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={desktop ? () => null : undefined}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.bg,
              borderTopColor: 'transparent',
              height: 62,
              paddingTop: 6,
            },
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}>
          <Tabs.Screen name="index" options={{ title: t.tabListen, tabBarIcon: tabIcon('headphones') }} />
          <Tabs.Screen name="wave" options={{ title: t.waveTitle, tabBarIcon: tabIcon('radio') }} />
          <Tabs.Screen name="create" options={{ title: t.tabCreate, tabBarIcon: tabIcon('plus') }} />
          <Tabs.Screen name="library" options={{ title: t.tabLibrary, tabBarIcon: tabIcon('library') }} />
          <Tabs.Screen name="plans" options={{ title: t.tabPlans, tabBarIcon: tabIcon('card') }} />
          <Tabs.Screen name="profile" options={{ title: t.tabProfile, tabBarIcon: tabIcon('person') }} />
        </Tabs>
      </View>
    </View>
  );
}
