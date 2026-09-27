import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demo';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, enterDemo } = useAuth();
  const { colors, t } = useSettings();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
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
      setMessage(err instanceof Error ? err.message : t.authFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.heading, { color: colors.text }]}>
        {mode === 'in' ? t.authWelcome : t.authCreate}
      </Text>
      <Text style={{ color: colors.muted, marginBottom: 8 }}>{t.authDemo}</Text>
      {mode === 'up' ? (
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t.displayName}
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        />
      ) : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t.email}
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder={t.password}
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
      />
      {message ? <Text style={{ color: colors.accent2 }}>{message}</Text> : null}
      <PrimaryButton
        title={busy ? t.pleaseWait : mode === 'in' ? t.signIn : t.register}
        onPress={submit}
        disabled={busy}
      />
      <PrimaryButton
        title={t.enterDemo}
        onPress={() => {
          enterDemo();
          router.back();
        }}
      />
      <Text
        style={{ color: colors.accent, textAlign: 'center', marginTop: 8 }}
        onPress={() => setMode((value) => (value === 'in' ? 'up' : 'in'))}>
        {mode === 'in' ? t.needAccount : t.haveAccount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  heading: { fontSize: 28, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
});
