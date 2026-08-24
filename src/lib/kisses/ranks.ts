export const RANKS = [
  { min: 0, id: "rookie", name: "Rookie", skin: "classic" },
  { min: 250, id: "crush", name: "Crush", skin: "gold" },
  { min: 400, id: "heat", name: "Heat", skin: "pink" },
  { min: 650, id: "flame", name: "Flame", skin: "fire" },
  { min: 900, id: "frost", name: "Frost", skin: "ice" },
  { min: 1500, id: "venom", name: "Venom", skin: "venom" },
  { min: 2500, id: "royal", name: "Royal", skin: "royal" },
  { min: 5000, id: "void", name: "Void", skin: "void" },
  { min: 10000, id: "myth", name: "Myth", skin: "myth" },
  { min: 25000, id: "god", name: "God", skin: "god" },
  { min: 50000, id: "eternal", name: "Eternal", skin: "eternal" },
  { min: 100000, id: "immortal", name: "Immortal", skin: "immortal" },
] as const;

export type Rank = (typeof RANKS)[number];
export type SkinId = Rank["skin"];

export function rankAt(kisses: number): Rank {
  let current: Rank = RANKS[0];
  for (const r of RANKS) {
    if (kisses >= r.min) current = r;
  }
  return current;
}

export function nextRank(kisses: number): Rank | null {
  const cur = rankAt(kisses);
  const i = RANKS.findIndex((r) => r.id === cur.id);
  return RANKS[i + 1] ?? null;
}

export function isSkin(value: string): value is SkinId {
  return RANKS.some((r) => r.skin === value);
}
