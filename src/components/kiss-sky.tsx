import type { ReactNode } from "react";
import { HeartMark } from "./heart-mark";
import { LipsMark } from "./lips-mark";

export function KissSky({
  children,
  quiet = false,
  storm = 6,
}: {
  children?: ReactNode;
  quiet?: boolean;
  storm?: number;
}) {
  const n = quiet ? 0 : storm;
  return (
    <div className={quiet ? "storm is-quiet" : "storm"}>
      {Array.from({ length: n }, (_, i) => (
        <LipsMark key={`k${i}`} i={i} className={`fly-kiss fly-kiss-${(i % 8) + 1}`} />
      ))}
      {quiet
        ? null
        : Array.from({ length: Math.min(4, n) }, (_, i) => (
            <HeartMark key={`h${i}`} className={`fly-heart fly-heart-${i + 1}`} />
          ))}
      <div className="storm-body">{children}</div>
    </div>
  );
}
