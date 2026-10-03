import { randomUUID } from "node:crypto";

import { config } from "../config.js";
import { coverSvg } from "./covers.js";
import {
  publicAudioUrl,
  publicCoverUrl,
  publishTrackToGithub,
  readLocalCatalog,
  saveLocalMedia,
  writeLocalCatalog,
  type CatalogTrack,
} from "./github-catalog.js";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function localMediaUrl(kind: "audio" | "covers", id: string) {
  const base = (process.env.PUBLIC_API_URL ?? `http://localhost:${config.port}`).replace(/\/$/, "");
  return `${base}/v1/media/${kind}/${id}`;
}

export function decodeAudioBase64(value: string) {
  const raw = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  const audio = Buffer.from(raw, "base64");
  if (audio.length < 1000) {
    throw new Error("Audio file is empty");
  }
  if (audio.length > MAX_UPLOAD_BYTES) {
    throw new Error("File is larger than 15 MB");
  }
  return audio;
}

export async function publishUploadedTrack(input: {
  title: string;
  genre?: string;
  durationMs?: number;
  audio: Buffer;
  authorName?: string;
  userId?: string;
}): Promise<CatalogTrack> {
  const id = `upl-${randomUUID()}`;
  const title = input.title.trim();
  const durationMs = Math.min(Math.max(input.durationMs ?? 30000, 3000), 180000);
  const cover = coverSvg(id, input.genre, "upload");
  const track: CatalogTrack = {
    id,
    userId: input.userId ?? "demo-user",
    authorName: input.authorName ?? "Слушатель",
    title,
    prompt: title,
    genre: input.genre?.trim() || null,
    durationMs,
    instrumental: false,
    status: "ready",
    errorMessage: null,
    audioUrl: localMediaUrl("audio", id),
    coverUrl: localMediaUrl("covers", id),
    isPublic: true,
    likeCount: 0,
    playCount: 0,
    liked: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
  };

  saveLocalMedia(id, input.audio, cover);
  writeLocalCatalog([track, ...readLocalCatalog().filter((item) => item.id !== id)]);

  if (config.githubRepo) {
    try {
      const published = {
        ...track,
        audioUrl: publicAudioUrl(id),
        coverUrl: publicCoverUrl(id),
      };
      await publishTrackToGithub(published, input.audio, cover);
      return published;
    } catch {
      writeLocalCatalog([track, ...readLocalCatalog().filter((item) => item.id !== id)]);
    }
  }

  return track;
}
