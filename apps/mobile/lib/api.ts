import { loadGithubCatalog, mergeTracks } from './catalog';
import { DEMO_SESSION_KEY, demoApi } from './demo';
import { supabase, supabaseConfigured } from './supabase';
import type { Profile, Track } from './types';

function isDemoSession() {
  if (!supabaseConfigured) return true;
  if (typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_SESSION_KEY) === '1') return true;
  return false;
}

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { timeoutMs, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

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

async function withDemo<T>(live: () => Promise<T>, fallback: () => T): Promise<T> {
  if (isDemoSession()) return fallback();
  try {
    return await live();
  } catch {
    return fallback();
  }
}

async function catalogTracks() {
  const [github, live] = await Promise.all([
    loadGithubCatalog(),
    request<{ tracks: Track[] }>('/v1/tracks').catch(() => ({ tracks: [] as Track[] })),
  ]);
  return mergeTracks(github, live.tracks, demoApi.feed().tracks);
}

export const api = {
  health: () =>
    withDemo(
      () => request<{ ok: boolean; elevenLabs: boolean; supabase: boolean; github?: boolean }>('/health'),
      () => ({ ok: true, elevenLabs: false, supabase: false, github: true })
    ),
  feed: async () => ({ tracks: await catalogTracks() }),
  track: async (id: string) => {
    const tracks = await catalogTracks();
    const found = tracks.find((item) => item.id === id);
    if (found) return { track: found };
    return demoApi.track(id);
  },
  createTrack: async (payload: {
    prompt: string;
    genre?: string;
    durationMs?: number;
    instrumental?: boolean;
  }) => {
    try {
      return await request<{ track: Track }>('/v1/tracks', {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 180000,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Генерация заняла слишком много времени. Попробуйте ещё раз.');
      }
      if (error instanceof Error && /failed to fetch|network|abort/i.test(error.message)) {
        throw new Error('API не запущен. Новые треки сохраняются на GitHub через локальный сервер.');
      }
      throw error;
    }
  },
  uploadTrack: async (payload: {
    title: string;
    genre?: string;
    durationMs?: number;
    audioBase64: string;
    audioUrl?: string;
  }) => {
    try {
      return await request<{ track: Track }>('/v1/tracks/upload', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          genre: payload.genre,
          durationMs: payload.durationMs,
          audioBase64: payload.audioBase64,
        }),
        timeoutMs: 180000,
      });
    } catch (error) {
      if (payload.audioUrl) {
        return demoApi.uploadTrack({
          title: payload.title,
          genre: payload.genre,
          durationMs: payload.durationMs,
          audioUrl: payload.audioUrl,
        });
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Загрузка заняла слишком много времени. Попробуйте ещё раз.');
      }
      throw error;
    }
  },
  me: () => withDemo(() => request<Profile>('/v1/me'), demoApi.me),
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
