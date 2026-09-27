import { randomUUID } from "node:crypto";

import { config, isConfigured } from "../config.js";
import { coverSvg } from "./covers.js";
import {
  listCatalogTracks,
  publicAudioUrl,
  publicCoverUrl,
  publishTrackToGithub,
  type CatalogTrack,
} from "./github-catalog.js";
import { supabaseAdmin } from "./supabase.js";
import type { TrackRow } from "./tracks.js";

const jobs = new Set<string>();

export function enqueueGeneration(trackId: string) {
  if (jobs.has(trackId)) return;
  jobs.add(trackId);
  void runGeneration(trackId).finally(() => jobs.delete(trackId));
}

async function runGeneration(trackId: string) {
  const { data: track, error } = await supabaseAdmin
    .from("tracks")
    .select("*")
    .eq("id", trackId)
    .single<TrackRow>();

  if (error || !track) return;

  await supabaseAdmin
    .from("tracks")
    .update({ status: "generating", error_message: null })
    .eq("id", trackId);

  try {
    if (!isConfigured.elevenLabs) {
      throw new Error(
        "ElevenLabs is not configured. Add ELEVENLABS_API_KEY on the API host."
      );
    }

    const audio = await composeMusic(track);
    const audioPath = `${track.user_id}/${track.id}.mp3`;
    const coverPath = `${track.user_id}/${track.id}.svg`;

    const audioUpload = await supabaseAdmin.storage
      .from("tracks")
      .upload(audioPath, audio, {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (audioUpload.error) throw audioUpload.error;

    const coverUpload = await supabaseAdmin.storage
      .from("covers")
      .upload(coverPath, coverSvg(track.id, track.genre), {
        contentType: "image/svg+xml",
        upsert: true,
      });
    if (coverUpload.error) throw coverUpload.error;

    await supabaseAdmin
      .from("tracks")
      .update({
        status: "ready",
        audio_path: audioPath,
        cover_path: coverPath,
        error_message: null,
      })
      .eq("id", trackId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    await supabaseAdmin
      .from("tracks")
      .update({ status: "failed", error_message: message })
      .eq("id", trackId);
  }
}

function titleFromPrompt(prompt: string) {
  const first = prompt.trim().split(/[.!?\n]/)[0]?.trim() || "Новый трек";
  return first.length > 36 ? `${first.slice(0, 33).trim()}…` : first;
}

export async function generateToGithub(input: {
  prompt: string;
  genre?: string;
  durationMs?: number;
  instrumental?: boolean;
  authorName?: string;
  userId?: string;
}): Promise<CatalogTrack> {
  if (!isConfigured.elevenLabs) {
    throw new Error("ElevenLabs is not configured. Add ELEVENLABS_API_KEY on the API host.");
  }

  const existing = await listCatalogTracks();
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = existing.filter((item) => item.createdAt.startsWith(today)).length;
  if (usedToday >= config.dailyGenerationLimit) {
    throw new Error(
      `Daily limit reached (${config.dailyGenerationLimit} tracks). Try again tomorrow.`
    );
  }

  const id = `gen-${randomUUID()}`;
  const durationMs = input.durationMs ?? 30000;
  const track: CatalogTrack = {
    id,
    userId: input.userId ?? "demo-user",
    authorName: input.authorName ?? "Демо-слушатель",
    title: titleFromPrompt(input.prompt),
    prompt: input.prompt.trim(),
    genre: input.genre?.trim() || null,
    durationMs,
    instrumental: input.instrumental ?? true,
    status: "ready",
    errorMessage: null,
    audioUrl: publicAudioUrl(id),
    coverUrl: publicCoverUrl(id),
    isPublic: true,
    likeCount: 0,
    playCount: 0,
    liked: false,
    aiGenerated: true,
    createdAt: new Date().toISOString(),
  };

  const audio = await composeMusic({
    prompt: track.prompt,
    genre: track.genre,
    duration_ms: durationMs,
    instrumental: track.instrumental,
  });
  await publishTrackToGithub(track, audio, coverSvg(track.id, track.genre));
  return track;
}

async function composeMusic(track: {
  prompt: string;
  genre?: string | null;
  duration_ms: number;
  instrumental: boolean;
}): Promise<Buffer> {
  const prompt = [
    track.prompt.trim(),
    track.genre ? `Genre: ${track.genre}.` : "",
    "Original AI music, not an imitation of a specific artist.",
  ]
    .filter(Boolean)
    .join(" ");

  const response = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: {
      "xi-api-key": config.elevenLabsApiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: track.duration_ms,
      model_id: config.elevenLabsModelId,
      force_instrumental: track.instrumental,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${detail.slice(0, 400)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
