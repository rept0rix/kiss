const KEY = "kiss-super-v1";

type SuperStore = {
  day?: string;
  used?: boolean;
  until?: number;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): SuperStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SuperStore;
  } catch {
    return {};
  }
}

function write(next: SuperStore): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function superState(): { dailyLeft: boolean; windowMs: number } {
  const s = read();
  const dailyLeft = !(s.day === today() && s.used);
  const windowMs = Math.max(0, (s.until ?? 0) - Date.now());
  return { dailyLeft, windowMs };
}

export function canSuper(): boolean {
  const s = superState();
  return s.dailyLeft || s.windowMs > 0;
}

export function openSuperWindow(): void {
  const s = read();
  write({ ...s, until: Date.now() + 60_000 });
}

export function consumeSuper(): void {
  write({ day: today(), used: true, until: 0 });
}
