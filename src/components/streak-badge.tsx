import { Flame } from "lucide-react";

/** A small flame badge showing the streak count, shown next to orbit names. */
export function StreakBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className="streak-badge" title={`${count}-day streak`}>
      <Flame size={12} />
      {count}
    </span>
  );
}
