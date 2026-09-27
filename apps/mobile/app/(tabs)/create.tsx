import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TokenHint } from '@/components/TokenHint';
import { PrimaryButton } from '@/components/ui';
import { api } from '@/lib/api';
import { DEFAULT_GENRE, GENRES } from '@/lib/wave';
import { tokensForDuration } from '@/lib/tokens';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, t } = useSettings();
  const { balance, notice, spend, refund, clearNotice } = useTokens();
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState(DEFAULT_GENRE);
  const [durationMs, setDurationMs] = useState(30000);
  const [instrumental, setInstrumental] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = tokensForDuration(durationMs);
  const granted = notice?.startsWith('granted:') ? Number(notice.slice(8)) : 0;

  const lengths = [
    { label: `30 ${t.seconds}`, value: 30000, tokens: 5 },
    { label: `1 ${t.minutes}`, value: 60000, tokens: 10 },
    { label: `2 ${t.minutes}`, value: 120000, tokens: 20 },
  ];

  const submit = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!spend(cost)) {
      setError(t.notEnoughTokens);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { track } = await api.createTrack({ prompt, genre, durationMs, instrumental });
      router.push(`/track/${track.id}`);
    } catch (err) {
      refund(cost);
      setError(err instanceof Error ? err.message : t.createError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenBackdrop>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: colors.text }]}>{t.createTitle}</Text>
      <Text style={{ color: colors.muted }}>{t.createCopy}</Text>
      <PressableScale onPress={() => router.push('/plans')} style={[styles.wallet, { backgroundColor: colors.card }]}>
        <TokenHint tokens={balance} />
        {granted ? (
          <Text style={{ color: colors.accent2, fontWeight: '700' }}>
            {t.tokensGranted.replace('{n}', String(granted))}
          </Text>
        ) : null}
        <Text style={{ color: colors.muted }}>{t.planOpen}</Text>
      </PressableScale>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder={t.createPlaceholder}
        placeholderTextColor={colors.muted}
        multiline
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
      />
      <Text style={[styles.label, { color: colors.text }]}>{t.genre}</Text>
      <View style={styles.chips}>
        {GENRES.map((item) => (
          <PressableScale
            key={item.id}
            onPress={() => setGenre(item.value)}
            style={[
              styles.chip,
              { backgroundColor: colors.cardAlt },
              genre === item.value && { backgroundColor: colors.accent },
            ]}>
            <Text
              style={{
                color: genre === item.value ? colors.buttonText : colors.muted,
                fontWeight: genre === item.value ? '700' : '400',
              }}>
              {t[item.labelKey]}
            </Text>
          </PressableScale>
        ))}
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{t.length}</Text>
      <View style={styles.chips}>
        {lengths.map((item) => (
          <PressableScale
            key={item.value}
            onPress={() => {
              setDurationMs(item.value);
              clearNotice();
            }}
            style={[
              styles.chip,
              { backgroundColor: colors.cardAlt },
              durationMs === item.value && { backgroundColor: colors.accent },
            ]}>
            <Text
              style={{
                color: durationMs === item.value ? colors.buttonText : colors.muted,
                fontWeight: durationMs === item.value ? '700' : '400',
              }}>
              {item.label} · {t.tokensCost.replace('{n}', String(item.tokens))}
            </Text>
          </PressableScale>
        ))}
      </View>
      <PressableScale
        onPress={() => setInstrumental((value) => !value)}
        style={[styles.toggle, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>
          {instrumental ? t.instrumental : t.withVocals}
        </Text>
      </PressableScale>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <PrimaryButton
        title={busy ? t.generating : user ? t.generate : t.signInToGenerate}
        onPress={submit}
        disabled={busy || prompt.trim().length < 8}
      />
    </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 36, gap: 16, paddingBottom: 120, maxWidth: 760, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  wallet: { borderRadius: 18, padding: 16, gap: 8 },
  input: {
    minHeight: 140,
    borderRadius: 18,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  label: { fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggle: {
    borderRadius: 16,
    padding: 14,
  },
});
