import { publicUrl, supabaseAdmin } from "./supabase.js";

export type TrackRow = {
  id: string;
  user_id: string;
  prompt: string;
  genre: string | null;
  duration_ms: number;
  instrumental: boolean;
  status: "queued" | "generating" | "ready" | "failed";
  error_message: string | null;
  audio_path: string | null;
  cover_path: string | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

export type TrackDto = {
  id: string;
  userId: string;
  authorName: string;
  prompt: string;
  genre: string | null;
  durationMs: number;
  instrumental: boolean;
  status: TrackRow["status"];
  errorMessage: string | null;
  audioUrl: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  likeCount: number;
  liked: boolean;
  aiGenerated: true;
  createdAt: string;
};

export function toTrackDto(row: TrackRow, liked = false): TrackDto {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.profiles?.display_name ?? "Listener",
    prompt: row.prompt,
    genre: row.genre,
    durationMs: row.duration_ms,
    instrumental: row.instrumental,
    status: row.status,
    errorMessage: row.error_message,
    audioUrl: publicUrl("tracks", row.audio_path),
    coverUrl: publicUrl("covers", row.cover_path),
    isPublic: row.is_public,
    likeCount: row.like_count,
    liked,
    aiGenerated: true,
    createdAt: row.created_at,
  };
}

export async function likedTrackIds(userId: string | undefined, trackIds: string[]) {
  if (!userId || trackIds.length === 0) return new Set<string>();
  const { data } = await supabaseAdmin
    .from("likes")
    .select("track_id")
    .eq("user_id", userId)
    .in("track_id", trackIds);
  return new Set((data ?? []).map((row) => row.track_id as string));
}

export const TRACK_SELECT =
  "id, user_id, prompt, genre, duration_ms, instrumental, status, error_message, audio_path, cover_path, is_public, like_count, created_at, updated_at, profiles(display_name, avatar_url)";
