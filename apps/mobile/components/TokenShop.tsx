import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import {
  formatMusicFromTokens,
  formatTokenCount,
  isPaidPlanId,
  MIN_TOPUP_RUB,
  parseTopUpRub,
  tokensForRub,
  tracksFromTokens,
} from '@/lib/tokens';
import { useSettings } from '@/providers/SettingsProvider';
import { useTokens } from '@/providers/TokensProvider';

export function TokenShop() {
  const { colors, t, language } = useSettings();
  const { planId } = useTokens();
  const locale = language === 'en' ? 'en-US' : 'ru-RU';
  const [raw, setRaw] = useState(String(MIN_TOPUP_RUB));
  const [touched, setTouched] = useState(false);

  const parsed = parseTopUpRub(raw);
  const belowMin = parsed !== null && parsed < MIN_TOPUP_RUB;
  const empty = raw.trim().length === 0 || parsed === null;
  const rub = empty || belowMin ? MIN_TOPUP_RUB : parsed;
  const tokens = tokensForRub(rub);
  const canBuy = isPaidPlanId(planId);
  const showMinError = touched && (empty || belowMin);

  const time = useMemo(
    () =>
      formatMusicFromTokens(tokens, {
        sec: t.calcTimeSec,
        min: t.calcTimeMin,
        minSec: t.calcTimeMinSec,
        hourMin: t.calcTimeHourMin,
      }),
    [t.calcTimeHourMin, t.calcTimeMin, t.calcTimeMinSec, t.calcTimeSec, tokens]
  );

  const tracksHint = useMemo(() => {
    const oneMinuteTracks = tracksFromTokens(tokens).min1;
    if (oneMinuteTracks <= 0) return t.calcApproxTrack30;
    if (language === 'ru') {
      const mod10 = oneMinuteTracks % 10;
      const mod100 = oneMinuteTracks % 100;
      if (mod10 === 1 && mod100 !== 11) return t.calcApproxTracksOne.replace('{n}', String(oneMinuteTracks));
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return t.calcApproxTracksFew.replace('{n}', String(oneMinuteTracks));
      }
      return t.calcApproxTracksMany.replace('{n}', String(oneMinuteTracks));
    }
    return (oneMinuteTracks === 1 ? t.calcApproxTracksOne : t.calcApproxTracksMany).replace(
      '{n}',
      String(oneMinuteTracks)
    );
  }, [language, t.calcApproxTrack30, t.calcApproxTracksFew, t.calcApproxTracksMany, t.calcApproxTracksOne, tokens]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.calcTitle}</Text>
      <Text style={[styles.copy, { color: colors.muted }]}>{t.calcCopy}</Text>

      <Text style={[styles.label, { color: colors.muted }]}>{t.calcAmountLabel}</Text>
      <View style={[styles.field, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <TextInput
          value={raw}
          onChangeText={(value) => {
            setTouched(true);
            setRaw(value.replace(/\D/g, '').slice(0, 7));
          }}
          onBlur={() => {
            setTouched(true);
            const next = parseTopUpRub(raw);
            setRaw(String(next === null || next < MIN_TOPUP_RUB ? MIN_TOPUP_RUB : next));
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="50"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        <Text style={[styles.currency, { color: colors.muted }]}>₽</Text>
      </View>
      {showMinError ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{t.calcMinError}</Text> : null}

      <View style={[styles.result, { backgroundColor: colors.cardAlt }]}>
        <Text style={[styles.hint, { color: colors.muted }]}>{t.calcResultHint}</Text>
        <Text style={[styles.tokens, { color: colors.text }]}>
          {t.calcTokens.replace('{n}', formatTokenCount(tokens, locale))}
        </Text>
        <Text style={[styles.time, { color: colors.accent2 }]}>{time}</Text>
        <Text style={[styles.approx, { color: colors.muted }]}>{tracksHint}</Text>
      </View>

      <PressableScale
        disabled={!canBuy}
        onPress={() => undefined}
        scaleTo={0.97}
        style={[
          styles.button,
          { backgroundColor: colors.accent },
          !canBuy && styles.buttonOff,
        ]}>
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          {t.calcTopUp.replace('{n}', rub.toLocaleString(locale))}
        </Text>
      </PressableScale>
      {!canBuy ? <Text style={[styles.gate, { color: colors.muted }]}>{t.calcNeedPlan}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    alignSelf: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  copy: { textAlign: 'center', lineHeight: 18, fontSize: 13 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 22, fontWeight: '800', paddingVertical: 8 },
  currency: { fontSize: 18, fontWeight: '800' },
  result: { borderRadius: 16, padding: 14, gap: 4, alignItems: 'center' },
  hint: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  tokens: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  time: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  approx: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  button: { borderRadius: 999, paddingVertical: 11, alignItems: 'center' },
  buttonOff: { opacity: 0.45 },
  buttonText: { fontWeight: '800', fontSize: 15 },
  gate: { textAlign: 'center', fontWeight: '600' },
});
