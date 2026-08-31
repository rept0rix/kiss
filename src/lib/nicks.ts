const KEY = "kiss-nicks-v1";

type NickMap = Record<string, string>;

function keyOf(name: string, tel?: string): string {
  const t = (tel ?? "").replace(/\D/g, "").slice(-8);
  if (t.length >= 7) return `t:${t}`;
  return `n:${name.trim().toLowerCase()}`;
}

function load(): NickMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NickMap) : {};
  } catch {
    return {};
  }
}

function save(map: NickMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getNick(name: string, tel?: string): string {
  return load()[keyOf(name, tel)] ?? "";
}

export function setNick(name: string, tel: string | undefined, nick: string): void {
  const map = load();
  const key = keyOf(name, tel);
  const v = nick.trim().slice(0, 24);
  if (v) map[key] = v;
  else delete map[key];
  save(map);
}

export function displayName(real: string, tel?: string): string {
  return getNick(real, tel) || real;
}
