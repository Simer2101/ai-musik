export type TrackStatus = 'queued' | 'generating' | 'ready' | 'failed';

export type Track = {
  id: string;
  userId: string;
  authorName: string;
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
  liked: boolean;
  aiGenerated: true;
  createdAt: string;
};

export type Profile = {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl: string | null;
  generationsUsedToday: number;
  dailyGenerationLimit: number;
};
