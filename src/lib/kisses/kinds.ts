import { isSkin } from "./ranks";

export const KISS_KINDS = [
  { id: "warm", label: "Smooch", hint: "The default hit" },
  { id: "miss", label: "Miss u", hint: "A little unhinged" },
  { id: "play", label: "Later", hint: "Chaotic friendly" },
] as const;

export type KissKindId = (typeof KISS_KINDS)[number]["id"] | string;

export function isKissKind(value: string): boolean {
  return KISS_KINDS.some((k) => k.id === value) || isSkin(value) || value === "random" || value === "super";
}

export function kindLabel(id: string): string {
  return KISS_KINDS.find((k) => k.id === id)?.label ?? "Kiss";
}