export type PaidPlanId = 'start' | 'pro' | 'ultra';
export type PlanId = 'free' | PaidPlanId;

/** Temporary single subscription: removes ads. Payment is not wired. */
export const AD_FREE_PRICE_RUB = 149;

/** One free 30-second track for accounts that have not bought a plan. */
export const FREE_PLAN = {
  id: 'free' as const,
  tokens: 100,
  seconds: 30,
};

/** Approved rate: 100 tokens = 30 seconds of generated music. */
export const TOKENS_PER_30_SECONDS = 100;

export const TOKEN_COSTS = {
  30000: 100,
  60000: 200,
  120000: 400,
} as const;

export const PLANS: {
  id: PlanId;
  priceRub: number;
  tokens: number;
  minutes: number;
}[] = [
  { id: 'start', priceRub: 999, tokens: 4000, minutes: 20 },
  { id: 'pro', priceRub: 1499, tokens: 6000, minutes: 30 },
  { id: 'ultra', priceRub: 2790, tokens: 12000, minutes: 60 },
];

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === 'start' || value === 'pro' || value === 'ultra';
}

export function isPlanId(value: unknown): value is PlanId {
  return value === 'free' || isPaidPlanId(value);
}

export const MIN_TRACK_SECONDS = 10;
export const MAX_TRACK_SECONDS = 5 * 60;

/** Linear rate. 30s, 1 min and 2 min stay exactly 100, 200 and 400 tokens. */
export function tokensForDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  return Math.max(1, Math.round((seconds * TOKENS_PER_30_SECONDS) / 30));
}

export function generationTimeFromTokens(tokens: number) {
  const totalSeconds = Math.floor((Math.max(0, tokens) * 30) / TOKENS_PER_30_SECONDS);
  return {
    totalSeconds,
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatTokenCount(tokens: number, locale = 'ru-RU') {
  return Math.max(0, Math.floor(tokens)).toLocaleString(locale);
}

export function tracksFromTokens(tokens: number) {
  return {
    sec30: Math.floor(tokens / TOKEN_COSTS[30000]),
    min1: Math.floor(tokens / TOKEN_COSTS[60000]),
    min2: Math.floor(tokens / TOKEN_COSTS[120000]),
  };
}

export function planById(id: PaidPlanId) {
  return PLANS.find((plan) => plan.id === id);
}

export function planTitle(
  planId: PlanId | null,
  names: { free: string; start: string; pro: string; ultra: string }
) {
  if (!planId) return names.free;
  return names[planId];
}

/** One-time top-up grid. Do not invent other packs without an explicit request. */
export const TOKEN_PACKS = [
  { rub: 50, tokens: 100 },
  { rub: 100, tokens: 200 },
  { rub: 200, tokens: 500 },
  { rub: 500, tokens: 2000 },
  { rub: 1000, tokens: 4000 },
  { rub: 2000, tokens: 8000 },
  { rub: 5000, tokens: 20000 },
  { rub: 10000, tokens: 40000 },
] as const;

export const MIN_TOPUP_RUB = 50;
export const MAX_TOPUP_RUB = 1_000_000;

export function parseTopUpRub(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.min(MAX_TOPUP_RUB, Math.round(value));
}

export function tokensForRub(rub: number) {
  if (!Number.isFinite(rub) || rub <= 0) return 0;
  const amount = Math.round(rub);
  const first = TOKEN_PACKS[0];
  const last = TOKEN_PACKS[TOKEN_PACKS.length - 1];
  if (amount <= first.rub) return first.tokens;
  if (amount >= last.rub) {
    const rate = last.tokens / last.rub;
    return Math.round(last.tokens + (amount - last.rub) * rate);
  }
  for (let i = 0; i < TOKEN_PACKS.length - 1; i += 1) {
    const from = TOKEN_PACKS[i];
    const to = TOKEN_PACKS[i + 1];
    if (amount === from.rub) return from.tokens;
    if (amount < to.rub) {
      const progress = (amount - from.rub) / (to.rub - from.rub);
      return Math.round(from.tokens + progress * (to.tokens - from.tokens));
    }
  }
  return last.tokens;
}

export function formatMusicFromTokens(
  tokens: number,
  labels: {
    sec: string;
    min: string;
    minSec: string;
    hourMin: string;
  }
) {
  const { totalSeconds } = generationTimeFromTokens(tokens);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return labels.hourMin.replace('{h}', String(hours)).replace('{m}', String(minutes));
  }
  if (minutes > 0 && seconds > 0) {
    return labels.minSec.replace('{m}', String(minutes)).replace('{s}', String(seconds));
  }
  if (minutes > 0) {
    return labels.min.replace('{n}', String(minutes));
  }
  return labels.sec.replace('{n}', String(seconds));
}
