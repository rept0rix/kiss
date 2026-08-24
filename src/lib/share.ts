export function kissLine(_from?: string, _to?: string): string {
  return "I kiss you now!\nCome inside and get it.";
}

export function sharePayload(from: string, to?: string, toPhone?: string): {
  title: string;
  text: string;
  url?: string;
} {
  const url = publicCatchUrl(cleanName(from), toPhone);
  return { title: "I kiss you now", text: kissLine(), url };
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

export function publicOrigin(): string | null {
  if (typeof window === "undefined") return null;
  return window.location.origin;
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
