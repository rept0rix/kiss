export type BlockedPerson = {
  name: string;
  tel?: string;
};

const KEY = "kiss-block-v1";

export function loadBlocks(): BlockedPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BlockedPerson[];
    return Array.isArray(parsed) ? parsed.slice(0, 200) : [];
  } catch {
    return [];
  }
}

function save(list: BlockedPerson[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

function tail(raw?: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(-8);
}

export function isBlocked(name: string, tel?: string): boolean {
  const n = name.trim().toLowerCase();
  const t = tail(tel);
  return loadBlocks().some(
    (b) => (t && tail(b.tel) === t) || (!t && b.name.trim().toLowerCase() === n),
  );
}

export function blockLocal(person: BlockedPerson): BlockedPerson[] {
  const t = tail(person.tel);
  const n = person.name.trim().toLowerCase();
  const next = [
    { name: person.name.trim() || "Someone", tel: person.tel },
    ...loadBlocks().filter((b) => (t ? tail(b.tel) !== t : b.name.trim().toLowerCase() !== n)),
  ];
  save(next);
  return next;
}

export function unblockLocal(person: BlockedPerson): BlockedPerson[] {
  const t = tail(person.tel);
  const n = person.name.trim().toLowerCase();
  const next = loadBlocks().filter((b) => (t ? tail(b.tel) !== t : b.name.trim().toLowerCase() !== n));
  save(next);
  return next;
}
