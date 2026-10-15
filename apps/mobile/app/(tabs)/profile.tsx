import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Text, TextInput, useFocusRing } from '@/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';

import { AdBanner } from '@/components/AdBanner';
import { Avatar } from '@/components/Avatar';
import { PressableScale } from '@/components/PressableScale';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { TrackCover } from '@/components/ui';
import { BACKGROUND_IDS, buildColors, type BackgroundId, type ThemeName } from '@/constants/Colors';
import { api } from '@/lib/api';
import { pickAvatar } from '@/lib/avatar';
import { trackTitle } from '@/lib/cover';
import { demoApi } from '@/lib/demo';
import { genreLabel } from '@/lib/wave';
import type { Language } from '@/lib/i18n';
import type { Profile, Track } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { usePlayer } from '@/providers/PlayerProvider';
import { useSettings } from '@/providers/SettingsProvider';
import {
  BIO_MAX,
  cleanHandle,
  HANDLE_MAX,
  handleIsValid,
  NAME_MAX,
  useProfile,
} from '@/providers/ProfileProvider';
import { useTokens } from '@/providers/TokensProvider';

const BACKGROUND_LABELS: Record<BackgroundId, 'bgClassic' | 'bgGraphite' | 'bgOcean' | 'bgPlum'> = {
  classic: 'bgClassic',
  graphite: 'bgGraphite',
  ocean: 'bgOcean',
  plum: 'bgPlum',
};

function Choice({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: { accent: string; muted: string; buttonText: string; cardAlt: string };
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.choice, { backgroundColor: colors.cardAlt }, active && { backgroundColor: colors.accent }]}>
      <Text style={{ color: active ? colors.buttonText : colors.muted, fontWeight: active ? '700' : '500' }}>
        {label}
      </Text>
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { colors, t, language, themeName, background, setLanguage, setThemeName, setBackground } = useSettings();
  const { recents, play } = usePlayer();
  const { adFree } = useTokens();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mine, setMine] = useState<Track[]>([]);
  const [likes, setLikes] = useState<Track[]>([]);
  const { profile: shown, save } = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shown);
  const [formError, setFormError] = useState<string | null>(null);
  const handleFocus = useFocusRing();

  const startEditing = () => {
    setDraft(shown);
    setFormError(null);
    setEditing(true);
  };

  const changePhoto = async () => {
    try {
      const uri = await pickAvatar();
      if (uri) setDraft((current) => ({ ...current, avatarUri: uri }));
    } catch {
      setFormError(t.photoFailed);
    }
  };

  const submit = async () => {
    const displayName = draft.displayName.trim();
    const handle = cleanHandle(draft.handle);
    if (!displayName) return setFormError(t.nameRequired);
    if (!handleIsValid(handle)) return setFormError(t.handleInvalid);
    await save({ displayName, handle, bio: draft.bio.trim(), avatarUri: draft.avatarUri });
    setEditing(false);
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    if (user.id === 'demo-user') {
      setProfile(demoApi.me());
      setMine(demoApi.myTracks().tracks);
      setLikes(demoApi.myLikes().tracks);
      return;
    }
    api.me().then(setProfile).catch(() => setProfile(null));
    api.myTracks().then((data) => setMine(data.tracks)).catch(() => setMine([]));
    api.myLikes().then((data) => setLikes(data.tracks)).catch(() => setLikes([]));
  }, [user]);

  const removeAccount = () => {
    Alert.alert(t.deleteTitle, t.deleteBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await api.deleteAccount();
          await signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenBackdrop>
        <View style={styles.box} />
      </ScreenBackdrop>
    );
  }

  if (!user) {
    return (
      <ScreenBackdrop>
        <View style={styles.guest}>
          <View style={styles.guestInner}>
            <Text style={[styles.heading, { color: colors.text }]}>{t.profileTitle}</Text>
            <Text style={[styles.guestCopy, { color: colors.muted }]}>{t.profileGuest}</Text>
            <PressableScale
              onPress={() => router.push('/auth')}
              style={[styles.guestButton, { backgroundColor: colors.accent }]}>
              <Text style={[styles.primaryText, { color: colors.buttonText }]}>{t.signInOrRegister}</Text>
            </PressableScale>
          </View>
        </View>
      </ScreenBackdrop>
    );
  }

  const field = [styles.input, { backgroundColor: colors.cardAlt, color: colors.text }];

  return (
    <ScreenBackdrop>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={[`${colors.hero}00`, `${colors.hero}66`, `${colors.bg}00`]} locations={[0, 0.4, 1]} style={styles.hero}>
        {editing ? (
          <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.editPhoto}>
              <Avatar size={96} uri={draft.avatarUri} />
              <View style={{ gap: 8 }}>
                <PressableScale onPress={changePhoto} style={[styles.pill, { backgroundColor: colors.accent }]}>
                  <Text style={{ color: colors.buttonText, fontWeight: '700' }}>{t.changePhoto}</Text>
                </PressableScale>
                {draft.avatarUri ? (
                  <PressableScale
                    onPress={() => setDraft((current) => ({ ...current, avatarUri: null }))}
                    style={[styles.pill, { borderWidth: 1, borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{t.removePhoto}</Text>
                  </PressableScale>
                ) : null}
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.fieldName}</Text>
            <TextInput
              value={draft.displayName}
              onChangeText={(displayName) => setDraft((current) => ({ ...current, displayName }))}
              maxLength={NAME_MAX}
              placeholder={t.fieldName}
              placeholderTextColor={colors.muted}
              style={field}
            />

            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.fieldHandle}</Text>
            <View style={[styles.handleRow, { backgroundColor: colors.cardAlt }, handleFocus.ring]}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>@</Text>
              <TextInput
                ring={false}
                onFocus={handleFocus.onFocus}
                onBlur={handleFocus.onBlur}
                value={draft.handle}
                onChangeText={(handle) => setDraft((current) => ({ ...current, handle: cleanHandle(handle) }))}
                maxLength={HANDLE_MAX}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="nickname"
                placeholderTextColor={colors.muted}
                style={[styles.handleInput, { color: colors.text }]}
              />
            </View>

            <View style={styles.bioHead}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.fieldBio}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {draft.bio.length}/{BIO_MAX}
              </Text>
            </View>
            <TextInput
              value={draft.bio}
              onChangeText={(bio) => setDraft((current) => ({ ...current, bio }))}
              maxLength={BIO_MAX}
              multiline
              placeholder={t.bioPlaceholder}
              placeholderTextColor={colors.muted}
              style={[field, styles.bioInput]}
            />

            {formError ? <Text style={{ color: colors.danger }}>{formError}</Text> : null}

            <View style={styles.editActions}>
              <PressableScale onPress={() => setEditing(false)} style={[styles.pill, { borderWidth: 1, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{t.cancel}</Text>
              </PressableScale>
              <PressableScale onPress={() => void submit()} style={[styles.pill, { backgroundColor: colors.accent }]}>
                <Text style={{ color: colors.buttonText, fontWeight: '700' }}>{t.save}</Text>
              </PressableScale>
            </View>
          </View>
        ) : (
          <>
            <Avatar size={96} />
            <Text style={[styles.heading, { color: colors.text }]}>{shown.displayName}</Text>
            <Text style={{ color: colors.muted }}>@{shown.handle}</Text>
            {shown.bio ? <Text style={{ color: colors.muted, textAlign: 'center', maxWidth: 520 }}>{shown.bio}</Text> : null}
            <PressableScale
              onPress={startEditing}
              style={[styles.pill, { borderWidth: 1, borderColor: colors.border, marginTop: 6, alignSelf: 'center' }]}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t.editProfile}</Text>
            </PressableScale>
          </>
        )}
      </LinearGradient>

      <View style={styles.stats}>
        <Stat value={likes.length} label={t.statsLikes} colors={colors} />
        <Stat value={128} label={t.followers} colors={colors} />
        <Stat value={14} label={t.following} colors={colors} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <AdBanner />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{t.fieldPlan}</Text>
        <Text style={{ color: colors.success, fontWeight: '700', fontSize: 16 }}>
          {t.planBadge.replace('{name}', adFree ? t.planAdFree : t.planWithAds)}
        </Text>
        <PressableScale onPress={() => router.push('/plans')} style={[styles.primary, { backgroundColor: colors.accent, marginTop: 4 }]}>
          <Text style={[styles.primaryText, { color: colors.buttonText }]}>
            {adFree ? t.planRenew : t.planBuy}
          </Text>
        </PressableScale>
      </View>

      {mine.length || likes.length ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>{t.topGenres}</Text>
          <View style={styles.row}>
            {[...new Set([...mine, ...likes].map((item) => item.genre).filter(Boolean))]
              .slice(0, 4)
              .map((genre) => (
                <View key={genre} style={[styles.choice, { backgroundColor: colors.cardAlt }]}>
                  <Text style={{ color: colors.muted, fontWeight: '600' }}>{genreLabel(genre, t)}</Text>
                </View>
              ))}
          </View>
        </View>
      ) : null}

      {recents.length ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>{t.recentlyPlayed}</Text>
          {recents.slice(0, 3).map((item) => (
            <PressableScale
              key={item.id}
              onPress={() => router.push(`/track/${item.id}`)}
              style={styles.recent}
              scaleTo={0.985}>
              <TrackCover track={item} size={48} radius={10} />
              <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{trackTitle(item)}</Text>
            </PressableScale>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{t.fieldEmail}</Text>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{user.email}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{t.fieldLanguage}</Text>
        <View style={styles.row}>
          {(['ru', 'en'] as Language[]).map((item) => (
            <Choice
              key={item}
              label={item === 'ru' ? t.languageRu : t.languageEn}
              active={language === item}
              onPress={() => setLanguage(item)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{t.fieldTheme}</Text>
        <View style={styles.row}>
          {(['dark', 'light'] as ThemeName[]).map((item) => (
            <Choice
              key={item}
              label={item === 'dark' ? t.themeDark : t.themeLight}
              active={themeName === item}
              onPress={() => setThemeName(item)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{t.fieldBackground}</Text>
        <View style={styles.row}>
          {BACKGROUND_IDS.map((item) => {
            const preview = buildColors(themeName, item);
            const active = background === item;
            return (
              <PressableScale
                key={item}
                onPress={() => setBackground(item)}
                style={[
                  styles.swatch,
                  { backgroundColor: preview.bg, borderColor: active ? colors.accent : colors.border },
                ]}>
                <View style={[styles.swatchDot, { backgroundColor: preview.hero }]} />
                <Text style={{ color: preview.text, fontWeight: active ? '800' : '600', fontSize: 13 }}>
                  {t[BACKGROUND_LABELS[item]]}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <PressableScale onPress={signOut} style={[styles.secondary, { backgroundColor: colors.card }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{t.signOut}</Text>
      </PressableScale>
      <PressableScale onPress={removeAccount} style={styles.danger}>
        <Text style={{ color: colors.danger, fontWeight: '700' }}>{t.deleteAccount}</Text>
      </PressableScale>
    </ScrollView>
    </ScreenBackdrop>
  );
}

function Stat({
  value,
  label,
  colors,
}: {
  value: number;
  label: string;
  colors: { text: string; muted: string };
}) {
  return (
    <View style={styles.statBox}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 120, gap: 16, maxWidth: 880, width: '100%', alignSelf: 'center' },
  box: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  guest: { flex: 1, padding: 36, justifyContent: 'center', alignItems: 'center' },
  guestInner: { alignSelf: 'center', width: 420, maxWidth: '100%', gap: 12 },
  guestCopy: { fontSize: 16, lineHeight: 22 },
  guestButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  heading: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  hero: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, paddingBottom: 20, gap: 8 },
  editCard: { width: '100%', maxWidth: 520, borderRadius: 24, borderWidth: 1, padding: 20, gap: 8 },
  editPhoto: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' },
  fieldLabel: { fontSize: 12, marginTop: 4 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 14, paddingHorizontal: 14 },
  handleInput: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 16 },
  bioHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bioInput: { minHeight: 88, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  stats: { flexDirection: 'row', paddingHorizontal: 16 },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  card: { marginHorizontal: 16, borderRadius: 18, padding: 16, gap: 8 },
  label: { fontSize: 18, fontWeight: '800', paddingHorizontal: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  choice: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  swatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  swatchDot: { width: 16, height: 16, borderRadius: 8 },
  primary: { borderRadius: 999, padding: 14, alignItems: 'center' },
  primaryText: { fontWeight: '800' },
  secondary: { marginHorizontal: 16, borderRadius: 999, padding: 14, alignItems: 'center' },
  danger: { alignItems: 'center', padding: 12 },
});
