import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TokenHint } from '@/components/TokenHint';
import { PrimaryButton } from '@/components/ui';
import { api } from '@/lib/api';
import { DEFAULT_GENRE, GENRES, genreLabel, MAIN_GENRE_COUNT } from '@/lib/wave';
import { FREE_PLAN, MAX_TRACK_SECONDS, MIN_TRACK_SECONDS, tokensForDuration } from '@/lib/tokens';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, t } = useSettings();
  const { balance, planId, notice, spend, refund, clearNotice } = useTokens();
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState(DEFAULT_GENRE);
  const [genresOpen, setGenresOpen] = useState(false);
  const [genreQuery, setGenreQuery] = useState('');
  const [durationMs, setDurationMs] = useState(30000);
  const [customLength, setCustomLength] = useState(false);
  const [customSeconds, setCustomSeconds] = useState('');
  const [customTouched, setCustomTouched] = useState(false);
  const [instrumental, setInstrumental] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typedSeconds = Number(customSeconds);
  const customValid =
    customSeconds.length > 0 &&
    Number.isInteger(typedSeconds) &&
    typedSeconds >= MIN_TRACK_SECONDS &&
    typedSeconds <= MAX_TRACK_SECONDS;
  const billedMs = customLength ? (customValid ? typedSeconds * 1000 : 0) : durationMs;
  const cost = billedMs > 0 ? tokensForDuration(billedMs) : 0;
  const genreSearch = genreQuery.trim().toLowerCase().replaceAll('ё', 'е');
  const visibleGenres = useMemo(() => {
    if (genreSearch) {
      return GENRES.filter((item) => {
        const hay = `${item.ru} ${item.en} ${item.needles.join(' ')}`.toLowerCase().replaceAll('ё', 'е');
        return hay.includes(genreSearch);
      });
    }
    const main = GENRES.slice(0, MAIN_GENRE_COUNT);
    if (genresOpen) return GENRES;
    const selected = GENRES.find((item) => item.value === genre);
    if (selected && !main.some((item) => item.id === selected.id)) return [...main, selected];
    return main;
  }, [genre, genreSearch, genresOpen]);
  const hiddenGenreCount = GENRES.length - MAIN_GENRE_COUNT;
  const granted = notice?.startsWith('granted:') ? Number(notice.slice(8)) : 0;

  const lengths = [
    { label: `30 ${t.seconds}`, value: 30000 },
    { label: `1 ${t.minutes}`, value: 60000 },
    { label: `2 ${t.minutes}`, value: 120000 },
  ];

  const submit = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!billedMs) return;
    if (balance < cost) {
      setError(t.notEnoughTokens);
      return;
    }
    if (!spend(cost)) {
      setError(t.notEnoughTokens);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { track } = await api.createTrack({ prompt, genre, durationMs: billedMs, instrumental });
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
      {planId === 'free' ? (
        <Text style={{ color: colors.accent2, fontWeight: '700' }}>
          {balance >= FREE_PLAN.tokens ? t.freeTrackHint : t.freeTrackUsed}
        </Text>
      ) : null}
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
      <TextInput
        value={genreQuery}
        onChangeText={setGenreQuery}
        placeholder={t.genreSearch}
        placeholderTextColor={colors.muted}
        style={[styles.genreSearch, { backgroundColor: colors.card, color: colors.text }]}
      />
      {genreSearch && !visibleGenres.length ? <Text style={{ color: colors.muted }}>{t.searchEmpty}</Text> : null}
      <View style={styles.chips}>
        {visibleGenres.map((item) => (
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
              {genreLabel(item.value, t)}
            </Text>
          </PressableScale>
        ))}
        {genreSearch ? null : (
          <PressableScale
            onPress={() => setGenresOpen((value) => !value)}
            style={[styles.chip, { backgroundColor: colors.cardAlt }]}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>
              {genresOpen ? t.genreHide : t.genreShowMore.replace('{n}', String(hiddenGenreCount))}
            </Text>
          </PressableScale>
        )}
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{t.length}</Text>
      <View style={styles.chips}>
        {lengths.map((item) => {
          const active = !customLength && durationMs === item.value;
          return (
            <PressableScale
              key={item.value}
              onPress={() => {
                setCustomLength(false);
                setDurationMs(item.value);
                clearNotice();
              }}
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
                {item.label} · {t.tokensCost.replace('{n}', String(tokensForDuration(item.value)))}
              </Text>
            </PressableScale>
          );
        })}
        <PressableScale
          onPress={() => {
            setCustomLength(true);
            clearNotice();
          }}
          style={[
            styles.chip,
            { backgroundColor: colors.cardAlt },
            customLength && { backgroundColor: colors.accent },
          ]}>
          <Text
            style={{
              color: customLength ? colors.buttonText : colors.muted,
              fontWeight: customLength ? '700' : '400',
            }}>
            {t.lengthCustom}
            {customLength && customValid
              ? ` · ${t.tokensCost.replace('{n}', String(tokensForDuration(typedSeconds * 1000)))}`
              : ''}
          </Text>
        </PressableScale>
      </View>
      {customLength ? (
        <View style={{ gap: 8 }}>
          <View style={styles.lengthRow}>
            <TextInput
              value={customSeconds}
              onChangeText={(value) => {
                setCustomSeconds(value.replace(/\D/g, '').slice(0, 3));
                setCustomTouched(true);
              }}
              onBlur={() => {
                setCustomTouched(true);
                const n = Number(customSeconds);
                if (!customSeconds || n < MIN_TRACK_SECONDS) setCustomSeconds(String(MIN_TRACK_SECONDS));
                else if (n > MAX_TRACK_SECONDS) setCustomSeconds(String(MAX_TRACK_SECONDS));
              }}
              placeholder={String(MIN_TRACK_SECONDS)}
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.lengthInput, { backgroundColor: colors.card, color: colors.text }]}
            />
            <Text style={{ color: colors.muted, fontWeight: '700' }}>{t.seconds}</Text>
          </View>
          <Text style={{ color: customTouched && !customValid ? colors.danger : colors.muted }}>{t.lengthRange}</Text>
        </View>
      ) : null}
      <PressableScale
        onPress={() => setInstrumental((value) => !value)}
        style={[styles.toggle, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>
          {instrumental ? t.instrumental : t.withVocals}
        </Text>
      </PressableScale>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {user && balance < cost ? (
        <PressableScale onPress={() => router.push('/plans')} style={[styles.wallet, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{t.notEnoughTokens}</Text>
          <Text style={{ color: colors.accent, fontWeight: '800' }}>{t.planNeedCta}</Text>
        </PressableScale>
      ) : null}
      <PrimaryButton
        title={busy ? t.generating : user ? t.generate : t.signInToGenerate}
        onPress={submit}
        disabled={busy || !billedMs || prompt.trim().length < 8 || (Boolean(user) && balance < cost)}
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
  genreSearch: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lengthInput: {
    width: 88,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  toggle: {
    borderRadius: 16,
    padding: 14,
  },
});
