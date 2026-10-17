import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { config, isConfigured } from "./config.js";
import {
  createSession,
  deleteSession,
  toUserDto,
  upsertPhoneUser,
  upsertTelegramUser,
  userFromToken,
} from "./lib/auth.js";
import { databaseReachable, migrate, query } from "./lib/db.js";
import { listCatalogTracks, readLocalMedia } from "./lib/github-catalog.js";
import { checkPhoneCode, sendPhoneCode, SmsError } from "./lib/sms.js";
import { verifyTelegramLogin, type TelegramAuthData } from "./lib/telegram.js";
import { likedIds, withLikes } from "./lib/tracks.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: config.corsOrigins.includes("*") ? "*" : config.corsOrigins,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  })
);

app.get("/health", async (c) =>
  c.json({
    ok: true,
    service: "sonari-api",
    database: isConfigured.database ? await databaseReachable() : false,
    github: isConfigured.github,
    telegram: isConfigured.telegram,
    sms: isConfigured.sms,
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

function bearer(c: Context) {
  const header = c.req.header("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

/** The signed-in listener, or null. Never throws when there is no database. */
async function currentUser(c: Context) {
  if (!isConfigured.database) return null;
  return userFromToken(bearer(c));
}

const noDatabase = (c: Context) => c.json({ error: "Accounts are not configured on this server" }, 503);

app.get("/v1/tracks", async (c) => {
  const user = await currentUser(c);
  return c.json({ tracks: await withLikes(await listCatalogTracks(), user?.id) });
});

app.get("/v1/tracks/:id", async (c) => {
  const track = (await listCatalogTracks()).find((item) => item.id === c.req.param("id"));
  if (!track) return c.json({ error: "Track not found" }, 404);
  const user = await currentUser(c);
  const [withHeart] = await withLikes([track], user?.id);
  return c.json({ track: withHeart });
});

// ---- Sign-in ---------------------------------------------------------------

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

// Telegram sign-in: check Telegram's signature with the bot token, find or create the
// account for that Telegram user, and hand back a session token.
app.post("/v1/auth/telegram", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  if (!isConfigured.telegram) return c.json({ error: "Telegram sign-in is not configured" }, 503);
  const parsed = telegramSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Invalid Telegram data" }, 400);
  const data = parsed.data as TelegramAuthData;
  if (!verifyTelegramLogin(data, config.telegramBotToken)) {
    return c.json({ error: "Telegram signature check failed" }, 401);
  }

  const user = await upsertTelegramUser({
    telegramId: data.id,
    displayName: [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || "Telegram",
    username: data.username ?? null,
    photoUrl: data.photo_url ?? null,
  });
  return c.json({ token: await createSession(user.id), user: toUserDto(user) });
});

const phoneSchema = z.string().regex(/^\+[1-9]\d{9,14}$/, "Phone must be in +79001234567 form");

function smsFailure(c: Context, err: unknown) {
  if (err instanceof SmsError) return c.json({ error: err.message }, err.status);
  throw err;
}

app.post("/v1/auth/phone/send", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const body = z.object({ phone: phoneSchema }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "Enter the number as +79001234567" }, 400);
  try {
    await sendPhoneCode(body.data.phone);
  } catch (err) {
    return smsFailure(c, err);
  }
  return c.json({ ok: true });
});

app.post("/v1/auth/phone/verify", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const body = z
    .object({ phone: phoneSchema, code: z.string().regex(/^\d{6}$/) })
    .safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "Enter the 6-digit code" }, 400);
  try {
    await checkPhoneCode(body.data.phone, body.data.code);
  } catch (err) {
    return smsFailure(c, err);
  }
  const user = await upsertPhoneUser(body.data.phone, "Слушатель");
  return c.json({ token: await createSession(user.id), user: toUserDto(user) });
});

app.post("/v1/auth/logout", async (c) => {
  const token = bearer(c);
  if (token && isConfigured.database) await deleteSession(token);
  return c.json({ ok: true });
});

// ---- The signed-in listener -------------------------------------------------

app.get("/v1/me", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  return c.json(toUserDto(user));
});

app.get("/v1/me/likes", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const ids = await likedIds(user.id);
  const byId = new Map((await listCatalogTracks()).map((track) => [track.id, track]));
  // A liked track that left the catalog is skipped rather than shown broken.
  const tracks = ids.map((id) => byId.get(id)).filter((track) => track !== undefined);
  return c.json({ tracks: await withLikes(tracks, user.id) });
});

app.post("/v1/tracks/:id/like", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  await query(
    "insert into likes (user_id, track_id) values ($1, $2) on conflict do nothing",
    [user.id, c.req.param("id")]
  );
  return c.json({ ok: true });
});

app.delete("/v1/tracks/:id/like", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  await query("delete from likes where user_id = $1 and track_id = $2", [user.id, c.req.param("id")]);
  return c.json({ ok: true });
});

app.post("/v1/tracks/:id/report", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = z
    .object({ reason: z.string().trim().min(4).max(300) })
    .safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "Describe the issue" }, 400);
  await query("insert into reports (user_id, track_id, reason) values ($1, $2, $3)", [
    user.id,
    c.req.param("id"),
    body.data.reason,
  ]);
  return c.json({ ok: true });
});

// Deleting the account removes the profile, sessions and likes; reports stay, unlinked.
app.delete("/v1/me", async (c) => {
  if (!isConfigured.database) return noDatabase(c);
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  await query("delete from users where id = $1", [user.id]);
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Server error" }, 500);
});

await migrate();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(
    `Sonari API listening on http://localhost:${info.port}` +
      (isConfigured.database ? "" : " (no DATABASE_URL: catalog only, accounts off)")
  );
});
