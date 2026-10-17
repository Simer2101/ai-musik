export type TrackStatus = 'queued' | 'generating' | 'ready' | 'failed';

export type Track = {
  id: string;
  userId: string;
  authorName: string;
  title?: string;
  prompt: string;
  genre: string | null;
  durationMs: number;
  instrumental: boolean;
  status: TrackStatus;
  errorMessage: string | null;
  audioUrl: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  likeCount: number;
  playCount?: number;
  liked: boolean;
  aiGenerated: boolean;
  createdAt: string;
};

/** The signed-in account as our API returns it. */
export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  /** E.164, set for phone sign-ins. */
  phone?: string | null;
  /** Without the @, set for Telegram sign-ins that have a username. */
  telegramUsername?: string | null;
};
