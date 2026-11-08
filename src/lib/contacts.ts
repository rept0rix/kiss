import { Capacitor } from "@capacitor/core";
import { normalizePhone, phonesMatch, maskPhone } from "./phone";

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

export interface KissContactsPluginType {
  pickContact(): Promise<{ name?: string; tel?: string; photo?: string | null }>;
  getContacts(): Promise<{ contacts: Array<{ name: string; tel: string; photo?: string | null }> }>;
  checkPermissions?(): Promise<{ readContacts?: string }>;
  requestPermissions?(): Promise<{ readContacts?: string }>;
  openSettings?(): Promise<void>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    const win = window as Window & { Capacitor?: { isNativePlatform?: () => boolean } };
    return Boolean(win.Capacitor?.isNativePlatform?.());
  }
}

export type ContactPermissionStatus = "granted" | "denied" | "prompt";

export async function checkContactsPermission(): Promise<ContactPermissionStatus> {
  if (!isNativeApp()) {
    return "prompt";
  }

  // 1. First check our native KissContacts plugin
  try {
    const plugin = await getKissContactsPlugin();
    if (plugin?.checkPermissions) {
      const res = await withTimeout(plugin.checkPermissions(), 2000, null);
      if (res?.readContacts === "granted" || res?.readContacts === "limited") return "granted";
      if (res?.readContacts === "denied") return "denied";
      if (res?.readContacts === "prompt") return "prompt";
    }
  } catch {
    /* fallback to capgo */
  }

  // 2. Fallback to Capgo
  try {
    const { CapacitorContacts } = await import("@capgo/capacitor-contacts");
    const status = await withTimeout(CapacitorContacts.checkPermissions(), 2000, null);
    if (status?.readContacts === "granted" || status?.readContacts === "limited") return "granted";
    if (status?.readContacts === "denied") return "denied";
    return "prompt";
  } catch {
    return "prompt";
  }
}

export async function requestContactsPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;

  // 1. First try our native KissContacts plugin
  try {
    const plugin = await getKissContactsPlugin();
    if (plugin?.requestPermissions) {
      const res = await withTimeout(plugin.requestPermissions(), 20000, null);
      if (res?.readContacts === "granted" || res?.readContacts === "limited") return true;
      if (res?.readContacts === "denied") return false;
    }
  } catch {
    /* fallback */
  }

  // 2. Try Capgo request
  try {
    const { CapacitorContacts } = await import("@capgo/capacitor-contacts");
    const req = await withTimeout(
      CapacitorContacts.requestPermissions({ permissions: ["readContacts"] }),
      20000,
      null,
    );
    if (req?.readContacts === "granted" || req?.readContacts === "limited") return true;
  } catch {
    /* fallback to getContacts */
  }

  // 3. Last fallback: try calling getContacts() which triggers iOS system dialog if not determined
  try {
    const plugin = await getKissContactsPlugin();
    if (plugin?.getContacts) {
      const res = await withTimeout(plugin.getContacts(), 20000, null);
      return Boolean(res?.contacts && res.contacts.length >= 0);
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function openContactsSettings(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const plugin = await getKissContactsPlugin();
    if (plugin?.openSettings) {
      await plugin.openSettings();
      return;
    }
  } catch {
    /* ignore */
  }
  try {
    const { CapacitorContacts } = await import("@capgo/capacitor-contacts");
    await CapacitorContacts.openSettings();
  } catch {
    /* ignore */
  }
}

async function capgoPick(): Promise<PhoneContact[] | null> {
  try {
    if (!isNativeApp()) return null;
    const { CapacitorContacts } = await import("@capgo/capacitor-contacts");
    const result = await CapacitorContacts.pickContacts({
      multiple: false,
    });
    if (!result?.contacts?.length) return [];
    const out: PhoneContact[] = [];
    for (const c of result.contacts) {
      const name = (c.fullName || `${c.givenName ?? ""} ${c.familyName ?? ""}`.trim() || "Someone").trim() || "Someone";
      const tel = (c.phoneNumbers?.[0]?.value || "").trim();
      const photo = c.photo ? (c.photo.startsWith("data:") ? c.photo : `data:image/jpeg;base64,${c.photo}`) : null;
      if (tel) {
        const picked = { name, tel, photo };
        rememberContact(picked);
        out.push(picked);
      }
    }
    return out;
  } catch (e) {
    console.warn("CapacitorContacts.pickContacts dismissed or failed:", e);
    return null;
  }
}

async function capgoGetAll(): Promise<PhoneContact[] | null> {
  try {
    if (!isNativeApp()) return null;
    const { CapacitorContacts } = await import("@capgo/capacitor-contacts");
    const perm = await CapacitorContacts.checkPermissions();
    if (perm.readContacts !== "granted" && perm.readContacts !== "limited") {
      const req = await CapacitorContacts.requestPermissions({ permissions: ["readContacts"] });
      if (req.readContacts !== "granted" && req.readContacts !== "limited") {
        return null;
      }
    }
    const result = await CapacitorContacts.getContacts();
    if (!result?.contacts?.length) return [];
    const out: PhoneContact[] = [];
    for (const c of result.contacts) {
      const name = (c.fullName || `${c.givenName ?? ""} ${c.familyName ?? ""}`.trim() || "Someone").trim() || "Someone";
      const tel = (c.phoneNumbers?.[0]?.value || "").trim();
      const photo = c.photo ? (c.photo.startsWith("data:") ? c.photo : `data:image/jpeg;base64,${c.photo}`) : null;
      if (tel) {
        const contact = { name, tel, photo };
        rememberContact(contact);
        out.push(contact);
      }
    }
    return out;
  } catch (e) {
    console.warn("CapacitorContacts.getContacts failed:", e);
    return null;
  }
}

async function getKissContactsPlugin(): Promise<KissContactsPluginType | null> {
  if (!isNativeApp()) return null;
  try {
    const { registerPlugin } = await import("@capacitor/core");
    return registerPlugin<KissContactsPluginType>("KissContacts");
  } catch {
    return null;
  }
}

export function canPickContacts(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  const nav = navigator as ContactPickerNav;
  return typeof nav.contacts?.select === "function";
}

async function webPick(): Promise<PhoneContact[]> {
  if (typeof navigator === "undefined") return [];
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

export async function pickFromPhone(): Promise<PhoneContact[]> {
  // 1. Try custom KissContacts plugin first (iOS + Android native contact picker sheet)
  const plugin = await getKissContactsPlugin();
  if (plugin?.pickContact) {
    try {
      const res = await withTimeout(plugin.pickContact(), 60000, null);
      if (res && res.tel) {
        const picked: PhoneContact = {
          name: res.name || "Someone",
          tel: res.tel,
          photo: res.photo || null,
        };
        rememberContact(picked);
        markPhoneAsKnown(picked.tel);
        return [picked];
      }
      if (res) return []; // User cancelled
    } catch (err) {
      console.warn("KissContacts.pickContact error or dismissed:", err);
    }
  }

  // 2. Try Capgo native picker (iOS / platforms where implemented)
  const capgo = await withTimeout(capgoPick(), 60000, null);
  if (capgo !== null && capgo.length > 0) return capgo;

  // 3. Web contact picker fallback
  return webPick();
}

export const CACHED_CONTACTS_KEY = "kiss_contacts_cached_v1";

export function loadCachedContacts(): PhoneContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHED_CONTACTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCachedContacts(contacts: PhoneContact[]): void {
  if (typeof window === "undefined" || !contacts?.length) return;
  try {
    const existing = loadCachedContacts();
    const map = new Map<string, PhoneContact>();
    for (const c of [...existing, ...contacts]) {
      const key = (c.tel || "").replace(/\D/g, "").slice(-8) || c.name.toLowerCase();
      if (key) map.set(key, c);
    }
    const combined = Array.from(map.values()).slice(0, 500);
    window.localStorage.setItem(CACHED_CONTACTS_KEY, JSON.stringify(combined));
  } catch {
    /* ignore quota */
  }
}

export function parseContactsFile(text: string): PhoneContact[] {
  const out: PhoneContact[] = [];
  if (/BEGIN:VCARD/i.test(text)) {
    for (const card of text.split(/BEGIN:VCARD/i).slice(1)) {
      const name = /^FN[^:]*:(.+)$/im.exec(card)?.[1]?.trim() ?? "";
      const tel = /^TEL[^:]*:(.+)$/im.exec(card)?.[1]?.trim() ?? "";
      if (tel) {
        out.push({ name: name || tel, tel });
      }
    }
    return out;
  }
  for (const line of text.split(/\n/)) {
    const digits = line.replace(/\D/g, "");
    if (digits.length < 7) continue;
    const tel = /\+?[\d][\d\s().-]{5,}/.exec(line)?.[0]?.trim() ?? digits;
    const name = line.replace(tel, "").replace(/[,;:\t]+/g, " ").trim();
    out.push({ name: name || tel, tel });
  }
  return out;
}

export async function fetchAllPhoneContacts(): Promise<PhoneContact[]> {
  // 1. Try custom KissContacts plugin if present (iOS + Android)
  const plugin = await getKissContactsPlugin();
  if (plugin?.getContacts) {
    try {
      const res = await withTimeout(plugin.getContacts(), 15000, null);
      if (res?.contacts && res.contacts.length > 0) {
        const out: PhoneContact[] = [];
        const phones: string[] = [];
        for (const c of res.contacts) {
          if (c.tel) {
            out.push({
              name: c.name || "Someone",
              tel: c.tel,
              photo: c.photo || null,
            });
            phones.push(c.tel);
          }
        }
        if (out.length > 0) {
          saveCachedContacts(out);
          markPhonesAsKnown(phones);
          return out;
        }
      }
    } catch (err) {
      console.warn("KissContacts.getContacts error:", err);
    }
  }

  // 2. Try Capgo get contacts
  const capgo = await withTimeout(capgoGetAll(), 15000, null);
  if (capgo !== null && capgo.length > 0) {
    saveCachedContacts(capgo);
    markPhonesAsKnown(capgo.map((c) => c.tel));
    return capgo;
  }

  // 3. Try cached contacts
  const cached = loadCachedContacts();
  if (cached.length > 0) {
    return cached;
  }

  return [];
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
  return blobToThumb(blob, 96, 0.72);
}

export function shrinkDataUrl(src: string, size = 160): Promise<string> {
  return new Promise((resolve) => {
    if (!src.startsWith("data:image")) {
      resolve(src);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.62));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function blobToThumb(blob: Blob, size: number, quality: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function prettyPersonName(raw: string): string {
  const t = raw.trim();
  if (!t) return "Someone";
  if (/^\+?\d[\d\s()-]{5,}$/.test(t)) return "Someone";
  if (/^them$/i.test(t)) return "Someone";
  return t.slice(0, 24);
}

export { isPhoneIdentity, isValidPhone } from "./phone";

export function phoneDigits(raw: string): string {
  return waPhone(raw);
}

/** WhatsApp wants country code + number, no +, no 0, no dashes. */
export function waPhone(raw: string): string {
  return normalizePhone(raw);
}

export function formatPhone(raw: string): { display: string; country: string } {
  const d = waPhone(raw);
  if (!d) return { display: "", country: "" };
  if (d.startsWith("972")) {
    const n = d.slice(3);
    const pretty =
      n.length >= 8 ? `${n.slice(0, 2)}-${n.slice(2, 5)}-${n.slice(5)}` : n;
    return { display: `+972 ${pretty}`, country: "Israel" };
  }
  if (d.startsWith("66")) {
    const n = d.slice(2);
    const pretty = n.length >= 8 ? `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}` : n;
    return { display: `+66 ${pretty}`, country: "Thailand" };
  }
  if (d.startsWith("1") && d.length === 11) {
    const n = d.slice(1);
    return { display: `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`, country: "US/CA" };
  }
  if (d.startsWith("44")) {
    return { display: `+44 ${d.slice(2)}`, country: "UK" };
  }
  return { display: `+${d}`, country: "" };
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

const KNOWN_PHONES_KEY = "kiss_known_phones_v1";

/**
 * Check if a phone number matches any contact stored in recent contacts or device contacts cache.
 */
export function isKnownContact(targetPhone?: string): boolean {
  if (!targetPhone) return false;
  const targetNorm = normalizePhone(targetPhone);
  if (!targetNorm) return false;

  // 1. Check local recents
  const recents = loadRecents();
  if (recents.some((c) => c.tel && phonesMatch(c.tel, targetNorm))) {
    return true;
  }

  // 2. Check full cached contacts if present in localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(KNOWN_PHONES_KEY);
      if (cached) {
        const list = JSON.parse(cached) as string[];
        if (Array.isArray(list) && list.some((p) => phonesMatch(p, targetNorm))) {
          return true;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return false;
}

/**
 * Remember phone numbers as known/contacts (called when contacts are loaded or user sends a kiss)
 */
export function markPhoneAsKnown(tel: string): void {
  if (typeof window === "undefined" || !tel) return;
  markPhonesAsKnown([tel]);
}

export function markPhonesAsKnown(phones: string[]): void {
  if (typeof window === "undefined" || !phones.length) return;
  try {
    const raw = window.localStorage.getItem(KNOWN_PHONES_KEY);
    const existing = new Set<string>(raw ? JSON.parse(raw) : []);
    let changed = false;
    for (const tel of phones) {
      const norm = normalizePhone(tel);
      if (norm && !existing.has(norm)) {
        existing.add(norm);
        changed = true;
      }
    }
    if (changed) {
      const arr = Array.from(existing).slice(-1000);
      window.localStorage.setItem(KNOWN_PHONES_KEY, JSON.stringify(arr));
    }
  } catch {
    /* quota */
  }
}

export { maskPhone };

