import { isConfigured } from "../config.js";
import { query } from "./db.js";

export type TrackDto = {
  id: string;
  userId: string;
  authorName: string;
  title?: string;
  prompt: string;
  genre: string | null;
  durationMs: number;
  instrumental: boolean;
  status: "queued" | "generating" | "ready" | "failed";
  errorMessage: string | null;
  audioUrl: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  likeCount: number;
  liked: boolean;
  aiGenerated: boolean;
  createdAt: string;
};

/**
 * Puts live like counts and this listener's hearts onto catalog tracks. Without a database
 * the catalog is returned as it is.
 */
export async function withLikes<T extends TrackDto>(tracks: T[], userId?: string): Promise<T[]> {
  if (!isConfigured.database || tracks.length === 0) return tracks;
  const ids = tracks.map((track) => track.id);
  const [counts, mine] = await Promise.all([
    query<{ track_id: string; n: string }>(
      "select track_id, count(*) as n from likes where track_id = any($1) group by track_id",
      [ids]
    ),
    userId
      ? query<{ track_id: string }>(
          "select track_id from likes where user_id = $1 and track_id = any($2)",
          [userId, ids]
        )
      : Promise.resolve({ rows: [] as { track_id: string }[] }),
  ]);
  const count = new Map(counts.rows.map((row) => [row.track_id, Number(row.n)]));
  const liked = new Set(mine.rows.map((row) => row.track_id));
  return tracks.map((track) => ({
    ...track,
    likeCount: count.get(track.id) ?? 0,
    liked: liked.has(track.id),
  }));
}

/** This listener's liked track ids, newest first. */
export async function likedIds(userId: string) {
  const { rows } = await query<{ track_id: string }>(
    "select track_id from likes where user_id = $1 order by created_at desc",
    [userId]
  );
  return rows.map((row) => row.track_id);
}
