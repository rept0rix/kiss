/** Link-preview title for /k/<code> invites (share links and personal QR codes). */
export const GENERIC_INVITE_TITLE = "Come get a kiss from me";

/** Placeholder names the server stores when the sender had none. */
const NO_NAME = new Set(["someone"]);

const HEBREW_START = /^[\u05d0-\u05ea]/;

/**
 * Gender-neutral "נשיקה מ<name> 💋", or the generic title when there is no real name.
 * The Hebrew prefix מ attaches to a Hebrew name ("נשיקה מנאור"); before any
 * other script (Latin, digits, emoji) it takes a hyphen ("נשיקה מ-Naor").
 * Plain text: React escapes it when rendering the meta tag, so it is not
 * HTML-escaped here (that would show "&amp;" in WhatsApp).
 */
export function inviteTitle(name: string | null | undefined): string {
  const clean = String(name ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32)
    .trim();
  if (!clean || NO_NAME.has(clean.toLowerCase())) return GENERIC_INVITE_TITLE;
  return `נשיקה מ${HEBREW_START.test(clean) ? "" : "-"}${clean} 💋`;
}
