import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui';
import { theme } from '@/constants/Colors';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

const GENRES = ['Synthwave', 'Lo-fi', 'House', 'Ambient', 'Rock', 'Hip-hop', 'Cinematic'];
const LENGTHS = [
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
  { label: '2 min', value: 120000 },
];

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Synthwave');
  const [durationMs, setDurationMs] = useState(30000);
  const [instrumental, setInstrumental] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { track } = await api.createTrack({ prompt, genre, durationMs, instrumental });
      router.push(`/track/${track.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start generation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Create AI music</Text>
      <Text style={styles.copy}>
        Describe mood, instruments, and tempo. Do not name living artists or copyrighted songs.
      </Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Night drive synthwave, analog bass, no vocals, 110 BPM"
        placeholderTextColor={theme.muted}
        multiline
        style={styles.input}
      />
      <Text style={styles.label}>Genre</Text>
      <View style={styles.chips}>
        {GENRES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setGenre(item)}
            style={[styles.chip, genre === item && styles.chipOn]}>
            <Text style={[styles.chipText, genre === item && styles.chipTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Length</Text>
      <View style={styles.chips}>
        {LENGTHS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setDurationMs(item.value)}
            style={[styles.chip, durationMs === item.value && styles.chipOn]}>
            <Text style={[styles.chipText, durationMs === item.value && styles.chipTextOn]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setInstrumental((value) => !value)} style={styles.toggle}>
        <Text style={styles.toggleText}>{instrumental ? 'Instrumental' : 'May include vocals'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        title={busy ? 'Queuing…' : user ? 'Generate track' : 'Sign in to generate'}
        onPress={submit}
        disabled={busy || prompt.trim().length < 8}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  heading: { color: theme.text, fontSize: 28, fontWeight: '800' },
  copy: { color: theme.muted },
  input: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    color: theme.text,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  label: { color: theme.text, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { color: theme.muted },
  chipTextOn: { color: '#140b24', fontWeight: '700' },
  toggle: {
    borderRadius: 14,
    backgroundColor: theme.card,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleText: { color: theme.text, fontWeight: '600' },
  error: { color: theme.danger },
});
