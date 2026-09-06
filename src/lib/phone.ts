/**
 * Phone identity, shared by the client and the server functions.
 *
 * A phone is stored as bare digits (country code first, no `+`, no trunk `0`).
 * The same rules run on both sides so whatever the browser holds in
 * localStorage is what the server compares against Neon.
 *
 * Two identities are considered the same when their trailing digits agree —
 * see `phonesMatch` and its SQL twin `phone_match()` in
 * migrations/0013_phone_match.sql. That is what lets a short QA identity like
 * `1234` resolve to the stored `15550001234` instead of being padded into a
 * made-up number nobody has.
 */

/** Shortest string of digits we accept as an identity (QA numbers like 1234). */
export const MIN_PHONE_DIGITS = 4;
/** Longest E.164 number. */
export const MAX_PHONE_DIGITS = 15;
/** Shortest number we treat as a real, dialable phone. */
export const MIN_REAL_PHONE_DIGITS = 8;
/** How many trailing digits decide "same number" for long identities. */
export const MATCH_TAIL = 8;

/** Bare digits with Israeli local formats promoted to 972…; nothing is fabricated. */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("9720")) d = `972${d.slice(4)}`;
  else if (d.startsWith("0") && d.length >= 9 && d.length <= 11) d = `972${d.slice(1)}`;
  else if (!d.startsWith("972") && d.length === 9 && d.startsWith("5")) d = `972${d}`;
  // An earlier server rule padded 4–5 digit test numbers into 972555XXXX(X).
  // Those are not real Israeli numbers (055 mobiles have 12 digits), so undo it
  // wherever such a value is still held by a client or a profile row.
  const padded = /^972555(\d{4,5})$/.exec(d);
  if (padded) d = padded[1]!;
  return d;
}

/** Anything the kiss tables can key on, short QA identities included. */
export function isPhoneIdentity(raw: string): boolean {
  const n = normalizePhone(raw).length;
  return n >= MIN_PHONE_DIGITS && n <= MAX_PHONE_DIGITS;
}

/** A real phone you could dial or open in WhatsApp. */
export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw).length;
  return n >= MIN_REAL_PHONE_DIGITS && n <= MAX_PHONE_DIGITS;
}

/**
 * Same identity? Exact, or the same trailing digits: compare the last
 * min(len a, len b, 8) digits, never fewer than 4. Mirrors SQL `phone_match()`.
 */
export function phonesMatch(a: string, b: string): boolean {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const n = Math.min(x.length, y.length, MATCH_TAIL);
  if (n < MIN_PHONE_DIGITS) return false;
  return x.slice(-n) === y.slice(-n);
}
