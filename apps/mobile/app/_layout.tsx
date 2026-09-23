import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { theme } from '@/constants/Colors';
import { AuthProvider } from '@/providers/AuthProvider';
import { PlayerProvider } from '@/providers/PlayerProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <PlayerProvider>
        <ThemeProvider
          value={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: theme.bg,
              card: theme.card,
              text: theme.text,
              border: theme.border,
              primary: theme.accent,
            },
          }}>
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.bg },
                headerTintColor: theme.text,
                contentStyle: { backgroundColor: theme.bg },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ title: 'Sign in', presentation: 'modal' }} />
              <Stack.Screen name="track/[id]" options={{ title: 'Track' }} />
            </Stack>
            <StatusBar style="light" />
          </View>
        </ThemeProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
