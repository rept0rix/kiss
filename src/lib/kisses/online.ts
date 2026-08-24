export function isLive(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 5 * 60 * 1000;
}
