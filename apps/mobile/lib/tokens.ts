export type PlanId = 'lite' | 'pro' | 'studio';

export const TOKEN_COST_RUB = 1.5;

export const TOKEN_COSTS = {
  30000: 5,
  60000: 10,
  120000: 20,
} as const;

export const PLANS: {
  id: PlanId;
  priceRub: number;
  tokens: number;
}[] = [
  { id: 'lite', priceRub: 1290, tokens: 400 },
  { id: 'pro', priceRub: 2490, tokens: 900 },
  { id: 'studio', priceRub: 4990, tokens: 2000 },
];

export function tokensForDuration(durationMs: number) {
  if (durationMs <= 30000) return TOKEN_COSTS[30000];
  if (durationMs <= 60000) return TOKEN_COSTS[60000];
  return TOKEN_COSTS[120000];
}

export function tracksFromTokens(tokens: number) {
  return {
    sec30: Math.floor(tokens / TOKEN_COSTS[30000]),
    min1: Math.floor(tokens / TOKEN_COSTS[60000]),
    min2: Math.floor(tokens / TOKEN_COSTS[120000]),
  };
}

export function planById(id: PlanId) {
  return PLANS.find((plan) => plan.id === id);
}

export function planTitle(
  planId: PlanId | null,
  names: { free: string; lite: string; pro: string; studio: string }
) {
  if (!planId) return names.free;
  return names[planId];
}
