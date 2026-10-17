import { randomInt } from "node:crypto";

import { config, isConfigured } from "../config.js";
import { sha256 } from "./auth.js";
import { query } from "./db.js";

const CODE_TTL_MINUTES = 5;
const RESEND_AFTER_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export class SmsError extends Error {
  constructor(message: string, readonly status: 400 | 429 | 502 | 503) {
    super(message);
  }
}

const codeHash = (phone: string, code: string) => sha256(`${phone}:${code}`);

/** sms.ru answers 200 with its own status inside; anything but OK is a failure. */
async function sendViaSmsRu(phone: string, text: string) {
  const params = new URLSearchParams({
    api_id: config.smsRuApiId,
    to: phone.replace(/^\+/, ""),
    msg: text,
    json: "1",
  });
  const response = await fetch(`https://sms.ru/sms/send?${params}`);
  const body = (await response.json().catch(() => null)) as
    | { status?: string; status_text?: string; sms?: Record<string, { status?: string; status_text?: string }> }
    | null;
  const perPhone = body?.sms ? Object.values(body.sms)[0] : undefined;
  if (body?.status !== "OK" || (perPhone && perPhone.status !== "OK")) {
    const reason = perPhone?.status_text || body?.status_text || `HTTP ${response.status}`;
    throw new SmsError(`SMS was not sent: ${reason}`, 502);
  }
}

/** Generates a 6-digit code, stores its hash and texts it to the listener. */
export async function sendPhoneCode(phone: string) {
  if (!isConfigured.sms) throw new SmsError("SMS sign-in is not configured", 503);

  const { rows } = await query<{ wait: number }>(
    `select extract(epoch from (sent_at + make_interval(secs => $2)) - now())::int as wait
     from phone_codes where phone = $1`,
    [phone, RESEND_AFTER_SECONDS]
  );
  if (rows[0] && rows[0].wait > 0) {
    throw new SmsError(`Wait ${rows[0].wait} s before asking for a new code`, 429);
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await query(
    `insert into phone_codes (phone, code_hash, attempts, sent_at, expires_at)
     values ($1, $2, 0, now(), now() + make_interval(mins => $3))
     on conflict (phone) do update
       set code_hash = excluded.code_hash, attempts = 0,
           sent_at = excluded.sent_at, expires_at = excluded.expires_at`,
    [phone, codeHash(phone, code), CODE_TTL_MINUTES]
  );

  const text = `Sonari: код входа ${code}. Никому его не сообщайте.`;
  if (config.smsRuApiId) await sendViaSmsRu(phone, text);
  else console.log(`[sms dev echo] ${phone}: ${code}`);
}

/** True when the code matches; each wrong guess counts, and the code dies after a few. */
export async function checkPhoneCode(phone: string, code: string) {
  const { rows } = await query<{ code_hash: string; attempts: number; expired: boolean }>(
    "select code_hash, attempts, expires_at < now() as expired from phone_codes where phone = $1",
    [phone]
  );
  const row = rows[0];
  if (!row || row.expired) throw new SmsError("The code has expired. Ask for a new one", 400);
  if (row.attempts >= MAX_ATTEMPTS) throw new SmsError("Too many attempts. Ask for a new code", 429);

  if (row.code_hash !== codeHash(phone, code)) {
    await query("update phone_codes set attempts = attempts + 1 where phone = $1", [phone]);
    throw new SmsError("Wrong code", 400);
  }
  await query("delete from phone_codes where phone = $1", [phone]);
}
