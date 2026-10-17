import { loadGithubCatalog, mergeTracks } from './catalog';
import { DEMO_SESSION_KEY, demoApi } from './demo';
import { getSessionToken } from './session';
import type { TelegramAuthData } from './telegram';
import type { Profile, Track } from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Without an API address the app runs on demo data with a local demo listener. */
export const apiConfigured = /^https?:\/\//.test(API_URL);

let demoMode = false;

/** AuthProvider calls this whenever the listener enters or leaves demo mode (on every platform). */
export function setDemoMode(on: boolean) {
  demoMode = on;
}

function isDemoSession() {
  if (!apiConfigured || demoMode) return true;
  if (typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_SESSION_KEY) === '1') return true;
  return false;
}

/** What sign-in returns: our API's session token and the account. */
export type SignInResult = { token: string; user: Profile };

async function request<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  if (!apiConfigured) throw new Error('API is not configured');
  const token = await getSessionToken();

  const { timeoutMs, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? 2000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...rest, headers, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((body as { error?: string }).error || `Request failed (${response.status})`);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

// Demo listeners get local demo data; signed-in listeners get the API, errors included, so a
// failed like or an expired session is never mistaken for success.
async function withDemo<T>(live: () => Promise<T>, fallback: () => T): Promise<T> {
  if (isDemoSession()) return fallback();
  return live();
}

async function catalogTracks() {
  const [github, live] = await Promise.all([
    loadGithubCatalog(),
    apiConfigured
      ? request<{ tracks: Track[] }>('/v1/tracks').catch(() => ({ tracks: [] as Track[] }))
      : Promise.resolve({ tracks: [] as Track[] }),
  ]);
  // The API's copy carries live likes, so it wins over the raw GitHub file for the same track.
  return mergeTracks(live.tracks, github, demoApi.feed().tracks);
}

export const api = {
  health: () =>
    withDemo(
      () => request<{ ok: boolean; database: boolean; telegram: boolean; sms: boolean }>('/health'),
      () => ({ ok: true, database: false, telegram: false, sms: false })
    ),
  feed: async () => ({ tracks: await catalogTracks() }),
  track: async (id: string) => {
    const tracks = await catalogTracks();
    const found = tracks.find((item) => item.id === id);
    if (found) return { track: found };
    return demoApi.track(id);
  },
  telegramLogin: (data: TelegramAuthData) =>
    request<SignInResult>('/v1/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: 15000,
    }),
  sendPhoneCode: (phone: string) =>
    request<{ ok: boolean }>('/v1/auth/phone/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      timeoutMs: 15000,
    }),
  verifyPhoneCode: (phone: string, code: string) =>
    request<SignInResult>('/v1/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      timeoutMs: 15000,
    }),
  logout: () => request<{ ok: boolean }>('/v1/auth/logout', { method: 'POST' }),
  me: () => withDemo(() => request<Profile>('/v1/me'), () => demoApi.me()),
  myTracks: async () => {
    const mine = (await catalogTracks()).filter((item) => item.userId === 'demo-user');
    return { tracks: mine.length ? mine : demoApi.myTracks().tracks };
  },
  myLikes: () => withDemo(() => request<{ tracks: Track[] }>('/v1/me/likes'), demoApi.myLikes),
  like: (id: string) =>
    withDemo(
      () => request<{ ok: boolean }>(`/v1/tracks/${id}/like`, { method: 'POST' }),
      () => demoApi.like(id)
    ),
  unlike: (id: string) =>
    withDemo(
      () => request<{ ok: boolean }>(`/v1/tracks/${id}/like`, { method: 'DELETE' }),
      () => demoApi.unlike(id)
    ),
  report: (id: string, reason: string) =>
    withDemo(
      () =>
        request<{ ok: boolean }>(`/v1/tracks/${id}/report`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }),
      demoApi.report
    ),
  deleteAccount: () =>
    withDemo(() => request<{ ok: boolean }>('/v1/me', { method: 'DELETE' }), demoApi.deleteAccount),
};
