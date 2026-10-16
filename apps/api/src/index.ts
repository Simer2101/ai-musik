import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { config, isConfigured } from "./config.js";
import { listCatalogTracks, readLocalMedia } from "./lib/github-catalog.js";
import { getUserFromToken, supabaseAdmin } from "./lib/supabase.js";
import { verifyTelegramLogin, type TelegramAuthData } from "./lib/telegram.js";
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
    service: "sonari-api",
    supabase: isConfigured.supabase,
    github: isConfigured.github,
    telegram: isConfigured.telegram,
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

const telegramSchema = z
  .object({
    id: z.number().int(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    photo_url: z.string().optional(),
    auth_date: z.number().int(),
    hash: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .passthrough();

// Telegram sign-in: verify Telegram's signature, make sure a Supabase user exists for this
// Telegram account, and hand back a one-time magic-link token the app exchanges for a session.
app.post("/v1/auth/telegram", async (c) => {
  if (!isConfigured.telegram || !isConfigured.supabase) {
    return c.json({ error: "Telegram sign-in is not configured" }, 503);
  }
  const parsed = telegramSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Invalid Telegram data" }, 400);
  const data = parsed.data as TelegramAuthData;
  if (!verifyTelegramLogin(data, config.telegramBotToken)) {
    return c.json({ error: "Telegram signature check failed" }, 401);
  }

  const email = `tg${data.id}@telegram.sonari.app`;
  const displayName = [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || "Telegram";
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      telegram_id: data.id,
      telegram_username: data.username ?? null,
      avatar_url: data.photo_url ?? null,
    },
  });
  if (created.error && !/already/i.test(created.error.message)) {
    return c.json({ error: created.error.message }, 500);
  }

  const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) return c.json({ error: link.error.message }, 500);
  return c.json({ tokenHash: link.data.properties.hashed_token });
});

app.get("/v1/me", async (c) => {
  if (!isConfigured.supabase) {
    return c.json({
      id: "demo-user",
      email: "demo@sonari.app",
      displayName: "Демо-слушатель",
      avatarUrl: null,
    });
  }
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return c.json({
    id: user.id,
    email: user.email,
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Listener",
    avatarUrl: profile?.avatar_url ?? null,
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
  console.log(`Sonari API listening on http://localhost:${info.port}`);
});
