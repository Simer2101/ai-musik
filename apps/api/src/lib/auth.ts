import { createHash, randomBytes } from "node:crypto";

import { config } from "../config.js";
import { query } from "./db.js";

export type UserRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  telegram_id: string | null;
  telegram_username: string | null;
  created_at: string;
};

export type UserDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  telegramUsername: string | null;
};

export function toUserDto(row: UserRow): UserDto {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    telegramUsername: row.telegram_username,
  };
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Issues a new session and returns the raw token; only its hash is stored. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await query(
    `insert into sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), userId, config.sessionDays]
  );
  return token;
}

export async function userFromToken(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  const hash = sha256(token);
  const { rows } = await query<UserRow>(
    `select u.* from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [hash]
  );
  if (!rows[0]) return null;
  // Touch at most once an hour so busy listeners do not write on every request.
  await query(
    `update sessions set last_used_at = now()
     where token_hash = $1 and last_used_at < now() - interval '1 hour'`,
    [hash]
  );
  return rows[0];
}

export async function deleteSession(token: string) {
  await query("delete from sessions where token_hash = $1", [sha256(token)]);
}

/** Finds the account for this Telegram user, creating it on first sign-in. */
export async function upsertTelegramUser(input: {
  telegramId: number;
  displayName: string;
  username: string | null;
  photoUrl: string | null;
}) {
  const { rows } = await query<UserRow>(
    `insert into users (telegram_id, display_name, telegram_username, avatar_url)
     values ($1, $2, $3, $4)
     on conflict (telegram_id) do update
       set telegram_username = excluded.telegram_username,
           avatar_url = coalesce(excluded.avatar_url, users.avatar_url)
     returning *`,
    [input.telegramId, input.displayName, input.username, input.photoUrl]
  );
  return rows[0];
}

/** Finds the account for this phone number, creating it on first sign-in. */
export async function upsertPhoneUser(phone: string, displayName: string) {
  const { rows } = await query<UserRow>(
    `insert into users (phone, display_name) values ($1, $2)
     on conflict (phone) do update set phone = excluded.phone
     returning *`,
    [phone, displayName]
  );
  return rows[0];
}
