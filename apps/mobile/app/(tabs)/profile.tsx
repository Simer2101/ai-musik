import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '@/constants/Colors';
import { api } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setProfile(null);
        return;
      }
      api.me().then(setProfile).catch(() => setProfile(null));
    }, [user])
  );

  const removeAccount = () => {
    Alert.alert('Delete account', 'This removes your profile, tracks, and likes.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.deleteAccount();
          await signOut();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.box}>
        <Text style={styles.heading}>Profile</Text>
        <Text style={styles.copy}>Create an account to generate music and keep a library.</Text>
        <Pressable onPress={() => router.push('/auth')} style={styles.primary}>
          <Text style={styles.primaryText}>Sign in or register</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{profile?.displayName ?? 'Listener'}</Text>
      <Text style={styles.copy}>{user.email}</Text>
      <View style={styles.card}>
        <Text style={styles.stat}>
          {profile?.generationsUsedToday ?? 0} / {profile?.dailyGenerationLimit ?? 3} generations today
        </Text>
        <Text style={styles.hint}>Free daily limit keeps ElevenLabs costs under control.</Text>
      </View>
      <Pressable onPress={signOut} style={styles.secondary}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </Pressable>
      <Pressable onPress={removeAccount} style={styles.danger}>
        <Text style={styles.dangerText}>Delete account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 14 },
  box: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center', gap: 12 },
  heading: { color: theme.text, fontSize: 28, fontWeight: '800' },
  copy: { color: theme.muted },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  stat: { color: theme.text, fontWeight: '700', fontSize: 16 },
  hint: { color: theme.muted },
  primary: { backgroundColor: theme.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  primaryText: { color: '#140b24', fontWeight: '800' },
  secondary: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  secondaryText: { color: theme.text, fontWeight: '700' },
  danger: { alignItems: 'center', padding: 12 },
  dangerText: { color: theme.danger, fontWeight: '700' },
});
