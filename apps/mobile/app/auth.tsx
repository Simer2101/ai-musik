import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui';
import { theme } from '@/constants/Colors';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
        router.back();
      } else {
        const notice = await signUp(email.trim(), password, displayName.trim() || email.split('@')[0]);
        if (notice) setMessage(notice);
        else router.back();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>{mode === 'in' ? 'Welcome back' : 'Create account'}</Text>
      <Text style={styles.copy}>Email accounts only in MVP. Google sign-in can be enabled in Supabase later.</Text>
      {mode === 'up' ? (
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          placeholderTextColor={theme.muted}
          style={styles.input}
        />
      ) : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={theme.muted}
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={theme.muted}
        style={styles.input}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <PrimaryButton title={busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Register'} onPress={submit} disabled={busy} />
      <Text
        style={styles.switch}
        onPress={() => setMode((value) => (value === 'in' ? 'up' : 'in'))}>
        {mode === 'in' ? 'Need an account? Register' : 'Already have an account? Sign in'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 24, gap: 12 },
  heading: { color: theme.text, fontSize: 28, fontWeight: '800' },
  copy: { color: theme.muted, marginBottom: 8 },
  input: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    color: theme.text,
    padding: 14,
  },
  message: { color: theme.accent2 },
  switch: { color: theme.accent, textAlign: 'center', marginTop: 8 },
});
