import type { OrbitItem } from "./kisses/types";

const KEY = "kiss-me-v2";
const ID_KEY = "kiss-id-v1";

export type MeState = {
  entered: boolean;
  name: string;
  phone: string;
  photo: string | null;
  sent: number;
  received: number;
  lastInboxId: number;
  lastPhoneId: number;
  orbit: OrbitItem[];
};

const EMPTY: MeState = {
  entered: false,
  name: "",
  phone: "",
  photo: null,
  sent: 0,
  received: 0,
  lastInboxId: 0,
  lastPhoneId: 0,
  orbit: [],
};

function readJson(key: string): Partial<MeState> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<MeState>;
  } catch {
    return null;
  }
}

export function loadMe(): MeState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const full =
      readJson(KEY) ?? readJson("kiss-me-v1") ?? {};
    const id = readJson(ID_KEY) ?? {};
    const parsed = { ...id, ...full };
    return {
      entered: Boolean(parsed.entered || parsed.phone || parsed.name),
      name: typeof parsed.name === "string" ? parsed.name.slice(0, 32) : "",
      phone: typeof parsed.phone === "string" ? parsed.phone.replace(/\D/g, "").slice(0, 15) : "",
      photo: typeof parsed.photo === "string" ? parsed.photo : null,
      sent: Number(parsed.sent) || 0,
      received: Number(parsed.received) || 0,
      lastInboxId: Number(parsed.lastInboxId) || 0,
      lastPhoneId: Number(parsed.lastPhoneId) || 0,
      orbit: Array.isArray(parsed.orbit) ? parsed.orbit.slice(0, 16) : [],
    };
  } catch {
    return EMPTY;
  }
}

export function saveMe(next: MeState): void {
  if (typeof window === "undefined") return;
  const identity = {
    entered: next.entered,
    name: next.name,
    phone: next.phone,
    sent: next.sent,
    received: next.received,
    lastInboxId: next.lastInboxId,
  };
  try {
    window.localStorage.setItem(ID_KEY, JSON.stringify(identity));
  } catch {
    /* ignore */
  }
  try {
    const slim: MeState = {
      ...next,
      photo: next.photo,
      orbit: next.orbit.slice(0, 12).map((o) => ({
        ...o,
        photo: o.photo && o.photo.length > 12000 ? null : o.photo,
      })),
    };
    window.localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    try {
      const slim: MeState = {
        ...next,
        photo: next.photo,
        orbit: next.orbit.slice(0, 8).map((o) => ({ ...o, photo: null })),
      };
      window.localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      try {
        window.localStorage.setItem(ID_KEY, JSON.stringify({
          entered: next.entered,
          name: next.name,
          phone: next.phone,
          sent: next.sent,
          received: next.received,
          lastInboxId: next.lastInboxId,
        }));
      } catch {
        /* stay in memory */
      }
    }
  }
}

export function cropPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 280;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no canvas"));
        return;
      }
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}