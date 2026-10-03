import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { config, isConfigured } from "./config.js";
import { enqueueGeneration, generateToGithub } from "./lib/generate.js";
import { listCatalogTracks, readLocalMedia } from "./lib/github-catalog.js";
import { moderatePrompt } from "./lib/moderation.js";
import { decodeAudioBase64, publishUploadedTrack } from "./lib/publish.js";
import { coverSvg } from "./lib/covers.js";
import { getUserFromToken, supabaseAdmin } from "./lib/supabase.js";
import {
  likedTrackIds,
  TRACK_SELECT,
  toTrackDto,
  type TrackRow,
} from "./lib/tracks.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: config.corsOrigins.includes("*") ? "*" : config.corsOrigins,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  })
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "aimusik-api",
    supabase: isConfigured.supabase,
    elevenLabs: isConfigured.elevenLabs,
    github: isConfigured.github,
  })
);

app.get("/v1/media/:kind/:id", (c) => {
  const kind = c.req.param("kind");
  if (kind !== "audio" && kind !== "covers") return c.json({ error: "Not found" }, 404);
  const file = readLocalMedia(kind, c.req.param("id"));
  if (!file) return c.json({ error: "Not found" }, 404);
  return new Response(file, {
    headers: {
      "Content-Type": kind === "audio" ? "audio/mpeg" : "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function bearer(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice(7);
}

async function requireUser(c: { req: { header: (name: string) => string | undefined } }) {
  const user = await getUserFromToken(bearer(c.req.header("Authorization")));
  if (!user) return null;
  return user;
}

const createTrackSchema = z.object({
  prompt: z.string().min(8).max(800),
  genre: z.string().max(40).optional(),
  durationMs: z.number().int().min(10000).max(300000).optional(),
  instrumental: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

const uploadTrackSchema = z.object({
  title: z.string().min(1).max(80),
  genre: z.string().max(40).optional(),
  durationMs: z.number().int().min(3000).max(180000).optional(),
  audioBase64: z.string().min(100),
});

app.get("/v1/tracks", async (c) => {
  if (!isConfigured.supabase) {
    return c.json({ tracks: await listCatalogTracks() });
  }
  const user = await getUserFromToken(bearer(c.req.header("Authorization")));
  const { data, error } = await supabaseAdmin
    .from("tracks")
    .select(TRACK_SELECT)
    .eq("status", "ready")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return c.json({ error: error.message }, 500);
  const rows = (data ?? []) as unknown as TrackRow[];
  const liked = await likedTrackIds(
    user?.id,
    rows.map((row) => row.id)
  );
  return c.json({ tracks: rows.map((row) => toTrackDto(row, liked.has(row.id))) });
});

app.get("/v1/tracks/:id", async (c) => {
  if (!isConfigured.supabase) {
    const track = (await listCatalogTracks()).find((item) => item.id === c.req.param("id"));
    if (!track) return c.json({ error: "Track not found" }, 404);
    return c.json({ track });
  }
  const user = await getUserFromToken(bearer(c.req.header("Authorization")));
  const { data, error } = await supabaseAdmin
    .from("tracks")
    .select(TRACK_SELECT)
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Track not found" }, 404);

  const row = data as unknown as TrackRow;
  const isOwner = user?.id === row.user_id;
  if (!isOwner && (row.status !== "ready" || !row.is_public)) {
    return c.json({ error: "Track not found" }, 404);
  }

  const liked = await likedTrackIds(user?.id, [row.id]);
  return c.json({ track: toTrackDto(row, liked.has(row.id)) });
});

app.post("/v1/tracks", async (c) => {
  const parsed = createTrackSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  const moderationError = moderatePrompt(parsed.data.prompt);
  if (moderationError) return c.json({ error: moderationError }, 400);

  if (!isConfigured.supabase) {
    try {
      const track = await generateToGithub({
        prompt: parsed.data.prompt,
        genre: parsed.data.genre,
        durationMs: parsed.data.durationMs,
        instrumental: parsed.data.instrumental ?? true,
      });
      return c.json({ track }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      const status = message.includes("Daily limit") ? 429 : 502;
      return c.json({ error: message }, status);
    }
  }

  const user = await requireUser(c);
  if (!user) return c.json({ error: "Sign in to create music" }, 401);

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count, error: countError } = await supabaseAdmin
    .from("tracks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString());

  if (countError) return c.json({ error: countError.message }, 500);
  if ((count ?? 0) >= config.dailyGenerationLimit) {
    return c.json(
      {
        error: `Daily limit reached (${config.dailyGenerationLimit} tracks). Try again tomorrow.`,
      },
      429
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tracks")
    .insert({
      user_id: user.id,
      prompt: parsed.data.prompt.trim(),
      genre: parsed.data.genre?.trim() || null,
      duration_ms: parsed.data.durationMs ?? 30000,
      instrumental: parsed.data.instrumental ?? false,
      is_public: parsed.data.isPublic ?? true,
      status: "queued",
    })
    .select(TRACK_SELECT)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  const row = data as unknown as TrackRow;
  enqueueGeneration(row.id);
  return c.json({ track: toTrackDto(row) }, 201);
});

app.post("/v1/tracks/upload", async (c) => {
  const parsed = uploadTrackSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  const title = parsed.data.title.trim();
  const moderationError = moderatePrompt(title);
  if (moderationError) return c.json({ error: moderationError }, 400);

  let audio: Buffer;
  try {
    audio = decodeAudioBase64(parsed.data.audioBase64);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Invalid audio" }, 400);
  }

  if (!isConfigured.supabase) {
    try {
      const track = await publishUploadedTrack({
        title,
        genre: parsed.data.genre,
        durationMs: parsed.data.durationMs,
        audio,
      });
      return c.json({ track }, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Upload failed" }, 502);
    }
  }

  const user = await requireUser(c);
  if (!user) return c.json({ error: "Sign in to publish a track" }, 401);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const durationMs = Math.min(Math.max(parsed.data.durationMs ?? 30000, 3000), 180000);
  const { data, error } = await supabaseAdmin
    .from("tracks")
    .insert({
      user_id: user.id,
      prompt: title,
      genre: parsed.data.genre?.trim() || null,
      duration_ms: durationMs,
      instrumental: false,
      is_public: true,
      status: "ready",
    })
    .select(TRACK_SELECT)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  const row = data as unknown as TrackRow;
  const audioPath = `${user.id}/${row.id}.mp3`;
  const coverPath = `${user.id}/${row.id}.svg`;

  const audioUpload = await supabaseAdmin.storage
    .from("tracks")
    .upload(audioPath, audio, { contentType: "audio/mpeg", upsert: true });
  if (audioUpload.error) return c.json({ error: audioUpload.error.message }, 502);

  const coverUpload = await supabaseAdmin.storage
    .from("covers")
    .upload(coverPath, coverSvg(row.id, row.genre, "upload"), {
      contentType: "image/svg+xml",
      upsert: true,
    });
  if (coverUpload.error) return c.json({ error: coverUpload.error.message }, 502);

  const { data: ready, error: updateError } = await supabaseAdmin
    .from("tracks")
    .update({ audio_path: audioPath, cover_path: coverPath })
    .eq("id", row.id)
    .select(TRACK_SELECT)
    .single();

  if (updateError) return c.json({ error: updateError.message }, 500);
  const published = toTrackDto(ready as unknown as TrackRow);
  published.aiGenerated = false;
  published.title = title;
  published.authorName = profile?.display_name ?? published.authorName;
  return c.json({ track: published }, 201);
});

app.get("/v1/me", async (c) => {
  if (!isConfigured.supabase) {
    const tracks = await listCatalogTracks();
    const today = new Date().toISOString().slice(0, 10);
    return c.json({
      id: "demo-user",
      email: "demo@aimusik.app",
      displayName: "Демо-слушатель",
      avatarUrl: null,
      generationsUsedToday: tracks.filter((item) => item.createdAt.startsWith(today)).length,
      dailyGenerationLimit: config.dailyGenerationLimit,
    });
  }
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from("tracks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString());

  return c.json({
    id: user.id,
    email: user.email,
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Listener",
    avatarUrl: profile?.avatar_url ?? null,
    generationsUsedToday: count ?? 0,
    dailyGenerationLimit: config.dailyGenerationLimit,
  });
});

app.get("/v1/me/tracks", async (c) => {
  if (!isConfigured.supabase) {
    const tracks = (await listCatalogTracks()).filter((item) => item.userId === "demo-user");
    return c.json({ tracks });
  }
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabaseAdmin
    .from("tracks")
    .select(TRACK_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  const rows = (data ?? []) as unknown as TrackRow[];
  const liked = await likedTrackIds(
    user.id,
    rows.map((row) => row.id)
  );
  return c.json({ tracks: rows.map((row) => toTrackDto(row, liked.has(row.id))) });
});

app.get("/v1/me/likes", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: likes, error } = await supabaseAdmin
    .from("likes")
    .select("track_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  const ids = (likes ?? []).map((row) => row.track_id as string);
  if (ids.length === 0) return c.json({ tracks: [] });

  const { data, error: tracksError } = await supabaseAdmin
    .from("tracks")
    .select(TRACK_SELECT)
    .in("id", ids)
    .eq("status", "ready");

  if (tracksError) return c.json({ error: tracksError.message }, 500);
  const rows = (data ?? []) as unknown as TrackRow[];
  return c.json({ tracks: rows.map((row) => toTrackDto(row, true)) });
});

app.post("/v1/tracks/:id/like", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { error } = await supabaseAdmin.from("likes").upsert({
    user_id: user.id,
    track_id: c.req.param("id"),
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

app.delete("/v1/tracks/:id/like", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { error } = await supabaseAdmin
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("track_id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

app.post("/v1/tracks/:id/report", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = z
    .object({ reason: z.string().min(4).max(300) })
    .safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "Describe the issue" }, 400);

  const { error } = await supabaseAdmin.from("reports").insert({
    user_id: user.id,
    track_id: c.req.param("id"),
    reason: body.data.reason,
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

app.delete("/v1/me", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`AImusik API listening on http://localhost:${info.port}`);
});
