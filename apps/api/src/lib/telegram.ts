import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Fields Telegram signs in a Login Widget / OAuth result. */
export type TelegramAuthData = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  [key: string]: unknown;
};

const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Checks the login really came from Telegram for this bot:
 * HMAC-SHA256 of the sorted "key=value" lines, keyed by SHA-256 of the bot token.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(data: TelegramAuthData, botToken: string, now = Date.now()) {
  const { hash, ...fields } = data;
  const checkString = Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== null)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return now / 1000 - data.auth_date <= MAX_AGE_SECONDS;
}
