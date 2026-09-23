import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { config, isConfigured } from "./config.js";
import { enqueueGeneration } from "./lib/generate.js";
import { moderatePrompt } from "./lib/moderation.js";
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
  })
);

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
  durationMs: z.number().int().min(10000).max(120000).optional(),
  instrumental: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

app.get("/v1/tracks", async (c) => {
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
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Sign in to create music" }, 401);

  const parsed = createTrackSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  const moderationError = moderatePrompt(parsed.data.prompt);
  if (moderationError) return c.json({ error: moderationError }, 400);

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

app.get("/v1/me", async (c) => {
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
