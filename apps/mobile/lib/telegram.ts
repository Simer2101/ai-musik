/** Telegram sign-in via oauth.telegram.org (the same flow the Telegram Login Widget uses). */

export const TELEGRAM_BOT_ID = process.env.EXPO_PUBLIC_TELEGRAM_BOT_ID ?? '';
/** Page on your site that forwards Telegram's answer back into the phone app (site/telegram-callback.html). */
export const TELEGRAM_CALLBACK_URL = process.env.EXPO_PUBLIC_TELEGRAM_CALLBACK_URL ?? '';
export const telegramConfigured = /^\d+$/.test(TELEGRAM_BOT_ID);

export type TelegramAuthData = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function telegramAuthUrl(returnTo: string) {
  const origin = new URL(returnTo).origin;
  const params = new URLSearchParams({
    bot_id: TELEGRAM_BOT_ID,
    origin,
    request_access: 'write',
    return_to: returnTo,
  });
  return `https://oauth.telegram.org/auth?${params.toString()}`;
}

/** Telegram returns `#tgAuthResult=<base64 JSON>` on the return URL. */
export function readTelegramResult(url: string): TelegramAuthData | null {
  const match = url.match(/[#&?]tgAuthResult=([^&#]+)/);
  if (!match) return null;
  try {
    let base64 = decodeURIComponent(match[1]).replace(/-/g, '+').replace(/_/g, '/');
    base64 += '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64);
    const json = decodeURIComponent(
      Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    );
    const data = JSON.parse(json) as TelegramAuthData;
    return typeof data?.id === 'number' && typeof data.hash === 'string' ? data : null;
  } catch {
    return null;
  }
}
