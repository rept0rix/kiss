import type { Sharp } from "sharp";
import { CARD_TEXT, GLYPH_EM, GLYPHS } from "./card-glyphs.ts";

/** Server-only 1200x630 invite card; same layout as the browser card in src/lib/kiss-card.ts. */
export const CARD_W = 1200;
export const CARD_H = 630;
const FACE_X = 600;
const FACE_Y = 268;
const FACE_R = 168;
const RED = "#e11d2e";
const JPEG = { quality: 82, mozjpeg: true } as const;

type SharpFactory = (input?: Buffer) => Sharp;

async function loadSharp(): Promise<SharpFactory> {
  const mod = await import("sharp");
  return (mod.default ?? mod) as unknown as SharpFactory;
}

function lipsPath(s: number): string {
  const p = (n: number) => +(n * s).toFixed(2);
  return (
    `M${p(-40)} 0C${p(-28)} ${p(-28)} ${p(-8)} ${p(-22)} 0 ${p(-6)}` +
    `C${p(8)} ${p(-22)} ${p(28)} ${p(-28)} ${p(40)} 0` +
    `C${p(28)} ${p(8)} ${p(10)} ${p(28)} 0 ${p(22)}` +
    `C${p(-10)} ${p(28)} ${p(-28)} ${p(8)} ${p(-40)} 0Z`
  );
}

function heartPath(x: number, y: number, r: number): string {
  const f = (n: number) => +n.toFixed(2);
  return (
    `M${f(x)} ${f(y + r * 0.3)}` +
    `C${f(x + r)} ${f(y - r * 0.6)} ${f(x + r * 1.6)} ${f(y + r * 0.4)} ${f(x)} ${f(y + r * 1.35)}` +
    `C${f(x - r * 1.6)} ${f(y + r * 0.4)} ${f(x - r)} ${f(y - r * 0.6)} ${f(x)} ${f(y + r * 0.3)}Z`
  );
}

const LIPS_AT: Array<[number, number, number, number]> = [
  [130, 180, 0.7, -18],
  [980, 140, 0.85, 22],
  [90, 430, 0.55, 12],
  [1080, 380, 0.7, -10],
  [220, 90, 0.4, 30],
  [940, 500, 0.5, -24],
  [1060, 240, 0.45, 8],
];

const HEARTS: Array<[number, number, number]> = [
  [200, 300, 14],
  [1020, 300, 18],
  [160, 520, 11],
  [880, 80, 13],
  [740, 120, 9],
  [430, 80, 10],
];

function backgroundSvg(): string {
  const lips = LIPS_AT.map(
    ([x, y, s, r]) => `<path transform="translate(${x} ${y}) rotate(${r})" d="${lipsPath(s)}"/>`,
  ).join("");
  const hearts = HEARTS.map(([x, y, r]) => `<path d="${heartPath(x, y, r)}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
<defs><radialGradient id="g" gradientUnits="userSpaceOnUse" cx="600" cy="320" r="520" fx="600" fy="300" fr="40">
<stop offset="0" stop-color="#3a0a10"/><stop offset="0.55" stop-color="#120407"/><stop offset="1" stop-color="#070707"/>
</radialGradient></defs>
<rect width="${CARD_W}" height="${CARD_H}" fill="#070707"/>
<rect width="${CARD_W}" height="${CARD_H}" fill="url(#g)"/>
<g fill="${RED}">${lips}${hearts}<path d="${CARD_TEXT.brand}"/></g>
</svg>`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const ini = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return [...ini].every((ch) => GLYPHS[ch]) ? ini : "";
}

/** Initials in the empty face; names without Latin glyphs (e.g. Hebrew) get a lips mark instead. */
function emptyFaceSvg(name: string): string {
  const ini = initialsOf(name);
  let mark = `<path fill="${RED}" transform="translate(${FACE_X} ${FACE_Y})" d="${lipsPath(2.4)}"/>`;
  if (ini) {
    const k = 84 / GLYPH_EM;
    const width = [...ini].reduce((sum, ch) => sum + GLYPHS[ch]!.w * k, 0);
    let x = FACE_X - width / 2;
    mark = [...ini]
      .map((ch) => {
        const g = GLYPHS[ch]!;
        const out = `<path fill="#fff" transform="translate(${x.toFixed(1)} 298) scale(${k.toFixed(4)})" d="${g.d}"/>`;
        x += g.w * k;
        return out;
      })
      .join("");
  }
  return `<circle cx="${FACE_X}" cy="${FACE_Y}" r="${FACE_R}" fill="#1a0a0c" stroke="${RED}" stroke-width="10"/>${mark}`;
}

function overlaySvg(face: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
${face}
<path fill="${RED}" fill-opacity="0.92" transform="translate(742 390) rotate(-25.8)" d="${lipsPath(1.35)}"/>
<path fill="#fff" d="${CARD_TEXT.headline}"/>
<path fill="${RED}" d="${CARD_TEXT.tagline}"/>
</svg>`;
}

const RING = `<circle cx="${FACE_X}" cy="${FACE_Y}" r="${FACE_R}" fill="none" stroke="${RED}" stroke-width="12"/>`;

async function circularFace(sharp: SharpFactory, photo: Buffer): Promise<Buffer | null> {
  const d = FACE_R * 2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${FACE_R}" cy="${FACE_R}" r="${FACE_R}"/></svg>`,
  );
  try {
    return await sharp(photo)
      .rotate()
      .resize(d, d, { fit: "cover", position: "centre" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

export function dataUrlBytes(dataUrl: string | null | undefined): Buffer | null {
  const match = (dataUrl ?? "").match(/^data:image\/[\w+.-]+;base64,(.+)$/);
  return match?.[1] ? Buffer.from(match[1], "base64") : null;
}

/** Render the card from a profile photo (or initials when there is none). */
export async function renderShareCard(photo: Buffer | null, name: string): Promise<Buffer> {
  const sharp = await loadSharp();
  const face = photo ? await circularFace(sharp, photo) : null;
  const layers: Array<{ input: Buffer; left?: number; top?: number }> = [];
  if (face) layers.push({ input: face, left: FACE_X - FACE_R, top: FACE_Y - FACE_R });
  layers.push({ input: Buffer.from(overlaySvg(face ? RING : emptyFaceSvg(name))) });
  return sharp(Buffer.from(backgroundSvg())).composite(layers).flatten({ background: "#070707" }).jpeg(JPEG).toBuffer();
}

/**
 * Any stored image → 1200x630 JPEG. Card-shaped images are resized; anything
 * else is treated as a face and framed in the card. `changed` is false when
 * the input already was a 1200x630 JPEG and is returned untouched.
 */
export async function normalizeShareCard(
  bytes: Buffer,
  name: string,
): Promise<{ jpeg: Buffer; changed: boolean }> {
  const sharp = await loadSharp();
  let meta: { format?: string; width?: number; height?: number };
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    return { jpeg: await renderShareCard(null, name), changed: true };
  }
  const { format, width = 0, height = 0 } = meta;
  if (format === "jpeg" && width === CARD_W && height === CARD_H) return { jpeg: bytes, changed: false };
  const cardShaped = height > 0 && Math.abs(width / height - CARD_W / CARD_H) < 0.03;
  if (cardShaped) {
    const jpeg = await sharp(bytes)
      .resize(CARD_W, CARD_H, { fit: "cover" })
      .flatten({ background: "#070707" })
      .jpeg(JPEG)
      .toBuffer();
    return { jpeg, changed: true };
  }
  return { jpeg: await renderShareCard(bytes, name), changed: true };
}

export type ShareCardImage = { jpeg: Buffer; cacheControl: string };

/** /c/<code> body: always a 1200x630 JPEG. */
export async function shareCardImage(code: string): Promise<ShareCardImage> {
  const { loadShareCardSource, storeShareCard } = await import("./server");
  const source = await loadShareCardSource(code).catch(() => null);
  if (!source) {
    return { jpeg: await renderShareCard(null, "Kiss"), cacheControl: "public, max-age=300" };
  }
  const stored = dataUrlBytes(source.card);
  const { jpeg, changed } = stored
    ? await normalizeShareCard(stored, source.name)
    : { jpeg: await renderShareCard(dataUrlBytes(source.photo), source.name), changed: true };
  if (source.persist && changed) {
    await storeShareCard(source.code, `data:image/jpeg;base64,${jpeg.toString("base64")}`).catch(() => undefined);
  }
  return {
    jpeg,
    cacheControl: source.persist
      ? "public, max-age=86400, s-maxage=604800"
      : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  };
}

export async function shareCardResponse(code: string): Promise<Response> {
  const { jpeg, cacheControl } = await shareCardImage(code);
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "content-type": "image/jpeg",
      "content-length": String(jpeg.length),
      "cache-control": cacheControl,
    },
  });
}
