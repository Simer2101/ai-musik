import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';

const KEY = 'aimusik.profile';

export const NAME_MAX = 40;
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 24;
export const BIO_MAX = 160;

/** What the listener has customised; anything unset falls back to the account defaults. */
type ProfileEdits = {
  displayName?: string;
  handle?: string;
  bio?: string;
  /** A data URI on web, a local file URI on phones. */
  avatarUri?: string | null;
};

export type ProfileView = {
  displayName: string;
  handle: string;
  bio: string;
  avatarUri: string | null;
};

type ProfileContextValue = {
  profile: ProfileView;
  save: (edits: ProfileEdits) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

async function load(): Promise<ProfileEdits> {
  try {
    const raw =
      Platform.OS === 'web'
        ? typeof localStorage === 'undefined'
          ? null
          : localStorage.getItem(KEY)
        : await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as ProfileEdits) : {};
  } catch {
    return {};
  }
}

async function store(edits: ProfileEdits) {
  const raw = JSON.stringify(edits);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(KEY, raw);
}

/** Lower-case latin letters, digits, dot and underscore; the leading @ is added on display. */
export function cleanHandle(value: string) {
  return value.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '');
}

export function handleIsValid(value: string) {
  return new RegExp(`^[a-z0-9._]{${HANDLE_MIN},${HANDLE_MAX}}$`).test(value);
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useSettings();
  const [edits, setEdits] = useState<ProfileEdits>({});

  useEffect(() => {
    void load().then(setEdits);
  }, []);

  const save = useCallback(
    async (next: ProfileEdits) => {
      const merged = { ...edits, ...next };
      setEdits(merged);
      await store(merged);
    },
    [edits]
  );

  const value = useMemo<ProfileContextValue>(() => {
    const accountHandle = cleanHandle(user?.telegramUsername ?? '');
    const fallbackHandle = accountHandle || cleanHandle(t.profileHandle);
    return {
      profile: {
        displayName: edits.displayName || user?.displayName || t.listener,
        handle: edits.handle || fallbackHandle,
        bio: edits.bio ?? t.profileBio,
        avatarUri: edits.avatarUri ?? null,
      },
      save,
    };
  }, [edits, save, t.listener, t.profileBio, t.profileHandle, user]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
