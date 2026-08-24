import { cn } from "@/lib/utils";

export function AvatarMark({
  name,
  hue,
  size = "md",
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}) {
  const letter = (name.trim()[0] ?? "K").toUpperCase();
  const dim = size === "sm" ? "size-9 text-sm" : size === "lg" ? "size-14 text-xl" : "size-11 text-base";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-medium text-primary-fg",
        dim,
      )}
      style={{ backgroundColor: `hsl(${hue} 28% 38%)` }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
