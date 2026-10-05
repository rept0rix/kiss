/** Profile photos: square edge in px, and the data-URL budget (~60 KB of JPEG). */
export const PHOTO_PX = 512;
export const PHOTO_MAX_CHARS = 80000;

/** Highest JPEG quality, starting at `quality`, whose data URL fits `maxChars`. */
export function jpegWithin(canvas: HTMLCanvasElement, maxChars: number, quality = 0.8): string {
  let q = quality;
  let out = canvas.toDataURL("image/jpeg", q);
  while (out.length > maxChars && q > 0.5) {
    q = Math.round((q - 0.08) * 100) / 100;
    out = canvas.toDataURL("image/jpeg", q);
  }
  return out;
}
