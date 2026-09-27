import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/providers/SettingsProvider';

export default function NotFoundScreen() {
  const { colors } = useSettings();
  return (
    <>
      <Stack.Screen options={{ title: 'Нет такой страницы' }} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Этого экрана нет.</Text>
        <Link href="/" style={styles.link}>
          <Text style={{ color: colors.accent }}>На главную, к музыке</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
