/**
 * Turns what the listener typed into E.164 (+79001234567). Russian numbers may be typed
 * as 8 900…, 7 900… or just 900…; other countries need the leading +. Returns null if invalid.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('+')) {
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 11 && (digits[0] === '8' || digits[0] === '7')) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  return null;
}

/** +79001234567 → +7 900 123-45-67; other numbers are shown as they are. */
export function formatPhone(e164: string) {
  const match = e164.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return match ? `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}` : e164;
}
