export function kissLine(from: string, to?: string): string {
  const who = cleanName(from);
  const target = to?.trim() ?? "";
  if (target && !isPhone(target) && target.toLowerCase() !== "you") {
    return `${who} kissed ${cleanName(target)}.`;
  }
  return `${who} kissed you.`;
}

export function sharePayload(from: string, to?: string, toPhone?: string): {
  title: string;
  text: string;
  url?: string;
} {
  const who = cleanName(from);
  const text = kissLine(from, to);
  const url = publicCatchUrl(who, toPhone);
  return { title: `A kiss from ${who}`, text, url };
}

export function shareBody(from: string, to?: string, toPhone?: string): string {
  const { text, url } = sharePayload(from, to, toPhone);
  return url ? `${text}\n${url}` : text;
}

export function publicCatchUrl(from: string, toPhone?: string): string | undefined {
  const origin = publicOrigin();
  if (!origin) return undefined;
  const base = `${origin}/k/${encodeURIComponent(from)}`;
  const digits = (toPhone ?? "").replace(/\D/g, "");
  if (digits.length >= 8) return `${base}?p=${encodeURIComponent(digits)}`;
  return base;
}

export function cleanName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!t || /^you$/i.test(t)) return "Someone";
  return t;
}

function isPhone(raw: string): boolean {
  return /^\+?\d[\d\s-]{6,}$/.test(raw.trim());
}

function publicOrigin(): string | null {
  if (typeof window === "undefined") return null;
  const { hostname, origin } = window.location;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".grok-sandbox.com") ||
    hostname.endsWith(".localhost")
  ) {
    return null;
  }
  return origin;
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
