import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { DEMO_EMAIL, DEMO_NAME, DEMO_SESSION_KEY, DEMO_USER_ID } from '@/lib/demo';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { TelegramAuthData } from '@/lib/telegram';

export const demoUser = {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  user_metadata: { display_name: DEMO_NAME },
} as unknown as User;

type AuthContextValue = {
  session: { access_token: string } | null;
  user: User | null;
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
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  if (on) localStorage.setItem(DEMO_SESSION_KEY, '1');
  else localStorage.removeItem(DEMO_SESSION_KEY);
}

function readDemo() {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return false;
  return localStorage.getItem(DEMO_SESSION_KEY) === '1';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(supabaseConfigured ? null : demoUser);
  const [isDemo, setIsDemo] = useState(!supabaseConfigured);
  const [loading, setLoading] = useState(supabaseConfigured);

  const enterDemo = () => {
    setUser(demoUser);
    setIsDemo(true);
    persistDemo(true);
  };

  useEffect(() => {
    if (readDemo() || !supabaseConfigured) {
      enterDemo();
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (data.session?.user) setUser(data.session.user);
        else enterDemo();
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        enterDemo();
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next?.user) {
        setUser(next.user);
        setIsDemo(false);
      }
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: user ? { access_token: isDemo ? 'demo' : 'session' } : null,
      user,
      loading,
      isDemo,
      enterDemo,
      // Without Supabase the app runs in demo mode: any number and any 6-digit code sign in.
      sendPhoneCode: async (phone) => {
        if (!supabaseConfigured) return;
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
      },
      verifyPhoneCode: async (phone, code) => {
        if (!supabaseConfigured) {
          if (!/^\d{6}$/.test(code)) throw new Error('Invalid code');
          enterDemo();
          return;
        }
        const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
        if (error) throw error;
      },
      signInWithTelegram: async (data) => {
        if (!supabaseConfigured || !data) {
          enterDemo();
          return;
        }
        const { tokenHash } = await api.telegramLogin(data);
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
        if (error) throw error;
      },
      signOut: async () => {
        persistDemo(false);
        setIsDemo(false);
        setUser(null);
        if (supabaseConfigured) await supabase.auth.signOut();
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
