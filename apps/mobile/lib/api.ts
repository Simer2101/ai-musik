import { supabase } from './supabase';
import type { Profile, Track } from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return body as T;
}

export const api = {
  health: () => request<{ ok: boolean; elevenLabs: boolean; supabase: boolean }>('/health'),
  feed: () => request<{ tracks: Track[] }>('/v1/tracks'),
  track: (id: string) => request<{ track: Track }>(`/v1/tracks/${id}`),
  createTrack: (payload: {
    prompt: string;
    genre?: string;
    durationMs?: number;
    instrumental?: boolean;
  }) =>
    request<{ track: Track }>('/v1/tracks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request<Profile>('/v1/me'),
  myTracks: () => request<{ tracks: Track[] }>('/v1/me/tracks'),
  myLikes: () => request<{ tracks: Track[] }>('/v1/me/likes'),
  like: (id: string) => request<{ ok: boolean }>(`/v1/tracks/${id}/like`, { method: 'POST' }),
  unlike: (id: string) => request<{ ok: boolean }>(`/v1/tracks/${id}/like`, { method: 'DELETE' }),
  report: (id: string, reason: string) =>
    request<{ ok: boolean }>(`/v1/tracks/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  deleteAccount: () => request<{ ok: boolean }>('/v1/me', { method: 'DELETE' }),
};
