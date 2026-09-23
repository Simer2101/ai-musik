import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { MiniPlayer } from '@/components/MiniPlayer';
import { theme } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Listen',
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={{ ios: 'headphones', android: 'headphones', web: 'headphones' }}
                tintColor={color}
                size={26}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                tintColor={color}
                size={26}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={{ ios: 'music.note.list', android: 'library_music', web: 'library_music' }}
                tintColor={color}
                size={26}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={{ ios: 'person.crop.circle', android: 'person', web: 'person' }}
                tintColor={color}
                size={26}
              />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
