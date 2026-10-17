import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api, apiConfigured, setDemoMode, type SignInResult } from '@/lib/api';
import { DEMO_NAME, DEMO_SESSION_KEY, DEMO_USER_ID } from '@/lib/demo';
import { getSessionToken, setSessionToken } from '@/lib/session';
import type { TelegramAuthData } from '@/lib/telegram';
import type { Profile } from '@/lib/types';

export type AuthUser = Profile;

export const demoUser: AuthUser = {
  id: DEMO_USER_ID,
  displayName: DEMO_NAME,
  avatarUrl: null,
  phone: null,
  telegramUsername: null,
};

type AuthContextValue = {
  session: { access_token: string } | null;
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  /** Sends a one-time SMS code; `phone` is in E.164 form, e.g. +79001234567. */
  sendPhoneCode: (phone: string) => Promise<void>;
  /** Signs in (or registers) with the SMS code. */
  verifyPhoneCode: (phone: string, code: string) => Promise<void>;
  /** Signs in (or registers) with a Telegram login result; `null` in demo mode. */
  signInWithTelegram: (data: TelegramAuthData | null) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistDemo(on: boolean) {
  setDemoMode(on);
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  if (on) localStorage.setItem(DEMO_SESSION_KEY, '1');
  else localStorage.removeItem(DEMO_SESSION_KEY);
}

function readDemo() {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return false;
  return localStorage.getItem(DEMO_SESSION_KEY) === '1';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(apiConfigured ? null : demoUser);
  const [isDemo, setIsDemo] = useState(!apiConfigured);
  const [loading, setLoading] = useState(apiConfigured);

  const enterDemo = () => {
    setUser(demoUser);
    setIsDemo(true);
    persistDemo(true);
  };

  const signedIn = async ({ token, user: account }: SignInResult) => {
    await setSessionToken(token);
    persistDemo(false);
    setIsDemo(false);
    setUser(account);
  };

  useEffect(() => {
    if (readDemo() || !apiConfigured) {
      enterDemo();
      setLoading(false);
      return;
    }

    // A saved token is checked against the API once at start; a dead one is dropped.
    let cancelled = false;
    (async () => {
      const token = await getSessionToken();
      if (!token) return enterDemo();
      try {
        const account = await api.me();
        if (!cancelled) {
          setUser(account);
          setIsDemo(false);
        }
      } catch (err) {
        if (err instanceof Error && /unauthorized/i.test(err.message)) await setSessionToken(null);
        if (!cancelled) enterDemo();
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: user ? { access_token: isDemo ? 'demo' : 'session' } : null,
      user,
      loading,
      isDemo,
      enterDemo,
      // Without an API the app runs in demo mode: any number and any 6-digit code sign in.
      sendPhoneCode: async (phone) => {
        if (!apiConfigured) return;
        await api.sendPhoneCode(phone);
      },
      verifyPhoneCode: async (phone, code) => {
        if (!apiConfigured) {
          if (!/^\d{6}$/.test(code)) throw new Error('Invalid code');
          enterDemo();
          return;
        }
        await signedIn(await api.verifyPhoneCode(phone, code));
      },
      signInWithTelegram: async (data) => {
        if (!apiConfigured || !data) {
          enterDemo();
          return;
        }
        await signedIn(await api.telegramLogin(data));
      },
      signOut: async () => {
        if (!isDemo) await api.logout().catch(() => undefined);
        await setSessionToken(null);
        persistDemo(false);
        setIsDemo(false);
        setUser(null);
      },
    }),
    [isDemo, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
