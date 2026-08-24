export type PhoneContact = {
  name: string;
  tel: string;
  photo?: string | null;
};

type ContactPickerNav = Navigator & {
  contacts?: {
    select: (
      props: string[],
      opts?: { multiple?: boolean },
    ) => Promise<Array<{ name?: string[]; tel?: string[]; icon?: Blob[] }>>;
  };
};

const RECENTS_KEY = "kiss-contacts-v1";

export function canPickContacts(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as ContactPickerNav;
  return typeof nav.contacts?.select === "function";
}

export async function pickFromPhone(): Promise<PhoneContact[]> {
  const nav = navigator as ContactPickerNav;
  if (!nav.contacts?.select) return [];
  let rows: Array<{ name?: string[]; tel?: string[]; icon?: Blob[] }> = [];
  try {
    rows = await nav.contacts.select(["name", "tel", "icon"], { multiple: true });
  } catch {
    try {
      rows = await nav.contacts.select(["name", "tel"], { multiple: true });
    } catch {
      return [];
    }
  }
  const out: PhoneContact[] = [];
  for (const row of rows.slice(0, 40)) {
    const name = (row.name?.[0] ?? "").trim() || "Someone";
    const tel = (row.tel?.[0] ?? "").trim();
    const photo = row.icon?.[0] ? await tinyPhoto(row.icon[0]) : null;
    const picked = { name, tel, photo };
    rememberContact(picked);
    out.push(picked);
  }
  return out;
}

export function faceTemplate(name: string): string {
  const n = nameHue(name || "x");
  const i = (n % 10) + 1;
  return `/faces/face-${String(i).padStart(2, "0")}.jpg`;
}

export function nameHue(name: string): number {
  let n = 0;
  for (let i = 0; i < name.length; i++) n = (n + name.charCodeAt(i) * (i + 3)) % 360;
  return n;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function tinyPhoto(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, 96, 96);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function phoneDigits(raw: string): string {
  return waPhone(raw);
}

/** WhatsApp wants country code + number, no +, no 0, no dashes. */
export function waPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("9720")) d = `972${d.slice(4)}`;
  if (d.startsWith("0") && d.length >= 9 && d.length <= 11) d = `972${d.slice(1)}`;
  if (!d.startsWith("972") && d.length === 9 && d.startsWith("5")) d = `972${d}`;
  return d;
}

export function isValidPhone(raw: string): boolean {
  const d = waPhone(raw);
  return d.length >= 8 && d.length <= 15;
}

export function waHref(tel: string, text: string): string {
  const digits = waPhone(tel);
  const q = encodeURIComponent(text);
  if (digits.length < 8) return `https://api.whatsapp.com/send/?text=${q}`;
  return `whatsapp://send?phone=${digits}&text=${q}`;
}

export function waWebHref(tel: string, text: string): string {
  const digits = waPhone(tel);
  const q = encodeURIComponent(text);
  if (digits.length < 8) {
    return `https://api.whatsapp.com/send/?text=${q}&type=phone_number&app_absent=0`;
  }
  return `https://api.whatsapp.com/send/?phone=${digits}&text=${q}&type=phone_number&app_absent=0`;
}

export function openWhatsApp(tel: string, text: string): void {
  const app = waHref(tel, text);
  const web = waWebHref(tel, text);
  const framed = typeof window !== "undefined" && window.top !== window;
  try {
    if (framed) {
      window.open(app, "_blank");
    } else {
      window.location.href = app;
    }
  } catch {
    /* ignore */
  }
  window.setTimeout(() => {
    window.open(web, "_blank", "noopener,noreferrer");
  }, 700);
}

export function smsHref(tel: string, text: string): string {
  const digits = phoneDigits(tel);
  const body = encodeURIComponent(text);
  const ios = typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent);
  if (ios) return digits.length >= 7 ? `sms:${digits}&body=${body}` : `sms:&body=${body}`;
  return digits.length >= 7 ? `sms:${digits}?body=${body}` : `sms:?body=${body}`;
}

export function loadRecents(): PhoneContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PhoneContact[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function rememberContact(contact: PhoneContact): void {
  if (typeof window === "undefined") return;
  const name = contact.name.trim();
  const tel = contact.tel.trim();
  if (!name && !tel) return;
  const next = [
    { name: name || tel, tel, photo: contact.photo ?? null },
    ...loadRecents().filter((c) => c.tel !== tel || c.name !== name),
  ].slice(0, 12);
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function openOutbound(href: string): void {
  window.location.href = href;
}
