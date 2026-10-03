import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { FREE_PLAN, isPaidPlanId, planById, type PaidPlanId, type PlanId } from '@/lib/tokens';

const STORAGE_KEY = 'aimusik.wallet.v5';
const LEGACY_KEYS = ['aimusik.wallet.v4', 'aimusik.wallet.v3'];

type Wallet = {
  balance: number;
  planId: PlanId;
  freeClaimed: boolean;
  adFree: boolean;
};

type TokensContextValue = Wallet & {
  notice: string | null;
  clearNotice: () => void;
  spend: (amount: number) => boolean;
  refund: (amount: number) => void;
  subscribe: (planId: PaidPlanId) => { tokens: number; priceRub: number };
  removeAds: () => void;
};

const TokensContext = createContext<TokensContextValue | undefined>(undefined);

function freeWallet(): Wallet {
  return { balance: FREE_PLAN.tokens, planId: 'free', freeClaimed: true, adFree: false };
}

function readStored(): string | null {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return current;
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) return raw;
  }
  return null;
}

function readWallet(): Wallet {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return freeWallet();
  try {
    const raw = readStored();
    if (!raw) return freeWallet();
    const parsed = JSON.parse(raw) as Partial<Wallet>;
    const adFree = parsed.adFree === true;
    if (isPaidPlanId(parsed.planId)) {
      return {
        balance: Number(parsed.balance) || 0,
        planId: parsed.planId,
        freeClaimed: true,
        adFree,
      };
    }
    if (parsed.freeClaimed) {
      return {
        balance: Math.max(0, Number(parsed.balance) || 0),
        planId: 'free',
        freeClaimed: true,
        adFree,
      };
    }
    return { ...freeWallet(), adFree };
  } catch {
    return freeWallet();
  }
}

function writeWallet(wallet: Wallet) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

export function TokensProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet>(readWallet);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const next = readWallet();
    setWallet(next);
    writeWallet(next);
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
        commit({ balance: plan.tokens, planId, freeClaimed: true, adFree: wallet.adFree });
        setNotice(`granted:${plan.tokens}`);
        return { tokens: plan.tokens, priceRub: plan.priceRub };
      },
      removeAds: () => {
        commit({ ...wallet, adFree: true });
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
