export function kissLine(_from?: string, _to?: string): string {
  return "Come get a kiss from me.";
}

export function sharePayload(from: string, to?: string, toPhone?: string): {
  title: string;
  text: string;
  url?: string;
} {
  const url = publicCatchUrl(cleanName(from), toPhone);
  return { title: "Come get a kiss from me", text: kissLine(), url };
}

export function shareBody(_from?: string, _to?: string, url?: string): string {
  const text = kissLine();
  return url ? `${text}\n${url}` : text;
}

export function publicCatchUrl(from: string, toPhone?: string): string | undefined {
  const origin = publicOrigin();
  if (!origin) return undefined;
  const who = encodeURIComponent(cleanName(from));
  const base = `${origin}/k/${who}`;
  const digits = (toPhone ?? "").replace(/\D/g, "");
  if (digits.length >= 8) return `${base}?p=${encodeURIComponent(digits)}`;
  return base;
}

export function shortCatchUrl(code: string): string | undefined {
  const origin = publicOrigin();
  if (!origin) return undefined;
  return `${origin}/k/${code}`;
}

export const PRODUCTION_ORIGIN = "https://app.sendkiss.online";

export function publicOrigin(): string {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;
  const o = window.location.origin;
  // If running in Capacitor mobile shell, local network IP, or localhost:
  // Always use production domain so the link works for anyone on any device anywhere!
  if (
    !o ||
    o.includes("localhost") ||
    o.includes("capacitor://") ||
    o.includes("127.0.0.1") ||
    o.includes("192.168.") ||
    o.includes("10.") ||
    o.includes("172.")
  ) {
    return PRODUCTION_ORIGIN;
  }
  return o;
}

export function cleanName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!t || /^you$/i.test(t)) return "Someone";
  return t;
}

export async function copyKiss(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function nativeShareOrCopy(opts: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const { title = "KISS", text = "Come get a kiss from me 💋", url } = opts;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url: url || undefined });
      return "shared";
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return "failed";
      }
    }
  }
  const full = url ? (text ? `${text}\n${url}` : url) : text;
  const ok = await copyKiss(full);
  return ok ? "copied" : "failed";
}

