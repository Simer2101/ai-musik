import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { planById, type PlanId } from '@/lib/tokens';

const STORAGE_KEY = 'aimusik.wallet.v2';

type Wallet = {
  balance: number;
  planId: PlanId | null;
};

type TokensContextValue = Wallet & {
  notice: string | null;
  clearNotice: () => void;
  spend: (amount: number) => boolean;
  refund: (amount: number) => void;
  subscribe: (planId: PlanId) => { tokens: number; priceRub: number };
};

const TokensContext = createContext<TokensContextValue | undefined>(undefined);

function readWallet(): Wallet {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return { balance: 0, planId: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { balance: 0, planId: null };
    const parsed = JSON.parse(raw) as Wallet;
    return {
      balance: Number(parsed.balance) || 0,
      planId: parsed.planId === 'lite' || parsed.planId === 'pro' || parsed.planId === 'studio' ? parsed.planId : null,
    };
  } catch {
    return { balance: 0, planId: null };
  }
}

function writeWallet(wallet: Wallet) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

export function TokensProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, planId: null });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setWallet(readWallet());
  }, []);

  const commit = (next: Wallet) => {
    setWallet(next);
    writeWallet(next);
  };

  const value = useMemo<TokensContextValue>(
    () => ({
      ...wallet,
      notice,
      clearNotice: () => setNotice(null),
      spend: (amount) => {
        if (wallet.balance < amount) return false;
        commit({ ...wallet, balance: wallet.balance - amount });
        return true;
      },
      refund: (amount) => {
        commit({ ...wallet, balance: wallet.balance + amount });
      },
      subscribe: (planId) => {
        const plan = planById(planId);
        if (!plan) return { tokens: 0, priceRub: 0 };
        if (wallet.planId === planId) {
          setNotice(null);
          return { tokens: 0, priceRub: 0 };
        }
        // A plan replaces the previous one, so the balance is reset to its quota.
        commit({ balance: plan.tokens, planId });
        setNotice(`granted:${plan.tokens}`);
        return { tokens: plan.tokens, priceRub: plan.priceRub };
      },
    }),
    [notice, wallet]
  );

  return <TokensContext.Provider value={value}>{children}</TokensContext.Provider>;
}

export function useTokens() {
  const ctx = useContext(TokensContext);
  if (!ctx) throw new Error('useTokens must be used inside TokensProvider');
  return ctx;
}

