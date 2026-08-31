export type GroupMember = {
  name: string;
  tel?: string;
  userId?: string;
  photo?: string | null;
};

export type KissGroup = {
  id: string;
  name: string;
  members: GroupMember[];
};

const KEY = "kiss-groups-v1";

export function loadGroups(): KissGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KissGroup[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups: KissGroup[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(groups.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export function upsertGroup(group: KissGroup): KissGroup[] {
  const next = [group, ...loadGroups().filter((g) => g.id !== group.id)].slice(0, 20);
  saveGroups(next);
  return next;
}

export function removeGroup(id: string): KissGroup[] {
  const next = loadGroups().filter((g) => g.id !== id);
  saveGroups(next);
  return next;
}
