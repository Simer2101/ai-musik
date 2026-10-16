import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { fonts } from '@/constants/Fonts';
import { formatPhone, normalizePhone } from '@/lib/phone';
import { supabaseConfigured } from '@/lib/supabase';
import {
  readTelegramResult,
  TELEGRAM_CALLBACK_URL,
  telegramAuthUrl,
  telegramConfigured,
  type TelegramAuthData,
} from '@/lib/telegram';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';

const TELEGRAM_BLUE = '#2aabee';
const RESEND_SECONDS = 60;

type Step = 'choose' | 'phone' | 'code';

export default function AuthScreen() {
  const router = useRouter();
  const { colors, t } = useSettings();
  const { sendPhoneCode, verifyPhoneCode, signInWithTelegram, enterDemo } = useAuth();
  const [step, setStep] = useState<Step>('choose');
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [resendLeft, setResendLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const finishTelegram = async (data: TelegramAuthData | null) => {
    setBusy(true);
    setError(null);
    try {
      await signInWithTelegram(data);
      done();
    } catch {
      setError(t.telegramFailed);
    } finally {
      setBusy(false);
    }
  };

  // On the web Telegram sends the browser back to this screen with #tgAuthResult=… in the URL.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const data = readTelegramResult(window.location.hash);
    if (!data) return;
    window.history.replaceState(null, '', window.location.pathname);
    void finishTelegram(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendLeft <= 0) return;
    const timer = setTimeout(() => setResendLeft((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendLeft]);

  const startTelegram = async () => {
    if (!telegramConfigured || !supabaseConfigured) return finishTelegram(null);
    if (Platform.OS === 'web') {
      window.location.href = telegramAuthUrl(`${window.location.origin}/auth`);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(telegramAuthUrl(TELEGRAM_CALLBACK_URL), 'sonari://auth');
    if (result.type !== 'success') return;
    const data = readTelegramResult(result.url);
    if (data) await finishTelegram(data);
    else setError(t.telegramFailed);
  };

  const requestCode = async () => {
    const normalized = normalizePhone(phoneInput);
    if (!normalized) return setError(t.phoneInvalid);
    setBusy(true);
    setError(null);
    try {
      await sendPhoneCode(normalized);
      setPhone(normalized);
      setCode('');
      setResendLeft(RESEND_SECONDS);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.authFailed);
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!/^\d{6}$/.test(code)) return setError(t.codeInvalid);
    setBusy(true);
    setError(null);
    try {
      await verifyPhoneCode(phone, code);
      done();
    } catch {
      setError(t.codeFailed);
    } finally {
      setBusy(false);
    }
  };

  const primary = (label: string, onPress: () => void) => (
    <PressableScale
      onPress={onPress}
      disabled={busy}
      scaleTo={0.97}
      style={[styles.button, { backgroundColor: colors.accent }, busy && styles.disabled]}>
      <Text style={[styles.buttonText, { color: colors.buttonText }]}>{busy ? t.pleaseWait : label}</Text>
    </PressableScale>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.form}>
        <Text style={[fonts.display('700'), styles.heading, { color: colors.text }]}>{t.authTitle}</Text>
        <Text style={[styles.copy, { color: colors.muted }]}>{t.authCopy}</Text>

        {step === 'choose' ? (
          <>
            <PressableScale
              onPress={() => void startTelegram()}
              disabled={busy}
              scaleTo={0.97}
              style={[styles.button, { backgroundColor: TELEGRAM_BLUE }, busy && styles.disabled]}>
              <Icon name="telegram" color="#ffffff" size={22} />
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>{t.authTelegram}</Text>
            </PressableScale>
            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={{ color: colors.muted, fontSize: 13 }}>{t.authOr}</Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>
            <PressableScale
              onPress={() => {
                setError(null);
                setStep('phone');
              }}
              scaleTo={0.97}
              style={[styles.button, styles.outline, { borderColor: colors.border }]}>
              <Icon name="phone" color={colors.text} size={22} />
              <Text style={[styles.buttonText, { color: colors.text }]}>{t.authPhone}</Text>
            </PressableScale>
          </>
        ) : null}

        {step === 'phone' ? (
          <>
            <Text style={[styles.label, { color: colors.muted }]}>{t.fieldPhone}</Text>
            <TextInput
              value={phoneInput}
              onChangeText={setPhoneInput}
              onSubmitEditing={() => void requestCode()}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              autoFocus
              placeholder={t.phonePlaceholder}
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            />
            {primary(t.sendCode, () => void requestCode())}
            <Text style={[styles.link, { color: colors.muted }]} onPress={() => setStep('choose')}>
              {t.cancel}
            </Text>
          </>
        ) : null}

        {step === 'code' ? (
          <>
            <Text style={{ color: colors.text }}>{t.codeSent.replace('{phone}', formatPhone(phone))}</Text>
            <Text style={[styles.label, { color: colors.muted }]}>{t.codeLabel}</Text>
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              onSubmitEditing={() => void confirmCode()}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              autoFocus
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                styles.code,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
            />
            {primary(t.confirmCode, () => void confirmCode())}
            <View style={styles.codeLinks}>
              {resendLeft > 0 ? (
                <Text style={{ color: colors.muted }}>{t.resendIn.replace('{s}', String(resendLeft))}</Text>
              ) : (
                <Text style={[styles.link, { color: colors.accent }]} onPress={() => void requestCode()}>
                  {t.resendCode}
                </Text>
              )}
              <Text style={[styles.link, { color: colors.muted }]} onPress={() => setStep('phone')}>
                {t.changePhone}
              </Text>
            </View>
          </>
        ) : null}

        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

        {supabaseConfigured ? null : (
          <View style={[styles.demo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{t.authDemoMode}</Text>
            <Text
              style={[styles.link, { color: colors.accent, textAlign: 'left' }]}
              onPress={() => {
                enterDemo();
                done();
              }}>
              {t.enterDemo}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  form: { alignSelf: 'center', width: 420, maxWidth: '100%', gap: 12 },
  heading: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  copy: { marginBottom: 8, lineHeight: 22 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 20,
  },
  outline: { borderWidth: 1 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  label: { fontSize: 12, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },
  code: { fontSize: 22, letterSpacing: 8, textAlign: 'center' },
  codeLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  link: { textAlign: 'center', fontWeight: '600', paddingVertical: 6 },
  demo: { marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
});
