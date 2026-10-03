import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { PrimaryButton } from '@/components/ui';
import { api } from '@/lib/api';
import { GENRES, MAIN_GENRE_COUNT, genreLabel } from '@/lib/wave';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

async function fileToBase64(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });
}

async function audioDuration(uri: string) {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const status = await sound.getStatusAsync();
    await sound.unloadAsync();
    if (status.isLoaded && status.durationMillis) return Math.round(status.durationMillis);
  } catch {
    /* keep default */
  }
  return 30000;
}

function isMp3(name: string, mime?: string) {
  const lower = name.toLowerCase();
  return lower.endsWith('.mp3') || mime === 'audio/mpeg' || mime === 'audio/mp3';
}

export default function PublishScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, t } = useSettings();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState(GENRES[0].value);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/mp3'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!isMp3(asset.name, asset.mimeType)) {
      setFileName(null);
      setFileUri(null);
      setError(t.publishBadType);
      return;
    }
    if ((asset.size ?? 0) > MAX_UPLOAD_BYTES) {
      setFileName(null);
      setFileUri(null);
      setError(t.publishTooBig);
      return;
    }
    setFileName(asset.name);
    setFileUri(asset.uri);
    setFileSize(asset.size ?? 0);
    if (!title.trim()) setTitle(asset.name.replace(/\.mp3$/i, ''));
  };

  const submit = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!title.trim()) {
      setError(t.publishNeedTitle);
      return;
    }
    if (!fileUri) {
      setError(t.publishNeedFile);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const audioBase64 = await fileToBase64(fileUri);
      if (fileSize > MAX_UPLOAD_BYTES || audioBase64.length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 64) {
        throw new Error(t.publishTooBig);
      }
      const durationMs = Math.min(await audioDuration(fileUri), 180000);
      const { track } = await api.uploadTrack({
        title: title.trim(),
        genre,
        durationMs,
        audioBase64,
        audioUrl: fileUri,
      });
      router.push(`/track/${track.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.publishError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenBackdrop>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <Text style={[styles.heading, { color: colors.text }]}>{t.publishTitle}</Text>
          <Text style={{ color: colors.muted }}>{t.publishCopy}</Text>
          <AdBanner />
          <Text style={[styles.label, { color: colors.text }]}>{t.fieldTitle}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t.titlePlaceholder}
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          />
          <Text style={[styles.label, { color: colors.text }]}>{t.genre}</Text>
          <View style={styles.chips}>
            {GENRES.slice(0, MAIN_GENRE_COUNT).map((item) => {
              const active = genre === item.value;
              return (
                <PressableScale
                  key={item.id}
                  onPress={() => setGenre(item.value)}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.cardAlt },
                    active && { backgroundColor: colors.accent },
                  ]}>
                  <Text
                    style={{
                      color: active ? colors.buttonText : colors.muted,
                      fontWeight: active ? '700' : '400',
                    }}>
                    {genreLabel(item.value, t)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <PressableScale
            onPress={() => void pick()}
            style={[styles.file, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {fileName ?? t.publishPick}
            </Text>
          </PressableScale>
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <PrimaryButton
            title={busy ? t.publishSubmitting : user ? t.publishSubmit : t.publishSignIn}
            onPress={() => void submit()}
            disabled={busy}
          />
        </View>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 120, paddingTop: 28 },
  column: { width: 420, maxWidth: '100%', paddingHorizontal: 20, gap: 14 },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  label: { fontWeight: '700' },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  file: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
});
