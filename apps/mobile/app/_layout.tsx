import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { MiniPlayer } from '@/components/MiniPlayer';
import { FONT_FILES } from '@/constants/Fonts';
import { AuthProvider } from '@/providers/AuthProvider';
import { PlayerProvider } from '@/providers/PlayerProvider';
import { ProfileProvider } from '@/providers/ProfileProvider';
import { SettingsProvider, useSettings } from '@/providers/SettingsProvider';
import { TokensProvider } from '@/providers/TokensProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SettingsProvider>
      <AuthProvider>
        <ProfileProvider>
          <TokensProvider>
            <PlayerProvider>
              <ThemedNavigation />
            </PlayerProvider>
          </TokensProvider>
        </ProfileProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

function ThemedNavigation() {
  const { colors, themeName, t } = useSettings();
  const navigationTheme = themeName === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'Onest_700Bold' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ title: t.signIn, presentation: 'modal' }} />
          <Stack.Screen name="track/[id]" options={{ title: t.trackTitle }} />
        </Stack>
        <MiniPlayer />
        <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      </View>
    </ThemeProvider>
  );
}
