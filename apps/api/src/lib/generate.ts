import { config, isConfigured } from "../config.js";
import { coverSvg } from "./covers.js";
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

async function composeMusic(track: TrackRow): Promise<Buffer> {
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
