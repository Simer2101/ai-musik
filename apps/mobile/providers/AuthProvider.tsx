import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  DEMO_EMAIL,
  DEMO_NAME,
  DEMO_SESSION_KEY,
  DEMO_USER_ID,
  isDemoLogin,
} from '@/lib/demo';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export const demoUser = {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  user_metadata: { display_name: DEMO_NAME },
} as User;

type AuthContextValue = {
  session: { access_token: string } | null;
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
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
      signIn: async (email, password) => {
        if (isDemoLogin(email, password) || !supabaseConfigured) {
          enterDemo();
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, displayName) => {
        if (!supabaseConfigured) {
          enterDemo();
          return null;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        if (!data.session) {
          return 'Check your email to confirm the account, then sign in.';
        }
        return null;
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
