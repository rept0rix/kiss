import type { ReactNode } from "react";
import { HeartMark } from "./heart-mark";
import { LipsMark } from "./lips-mark";

export function KissSky({
  children,
  quiet = false,
}: {
  children?: ReactNode;
  quiet?: boolean;
}) {
  return (
    <div className={quiet ? "storm is-quiet" : "storm"}>
      {quiet
        ? null
        : Array.from({ length: 6 }, (_, i) => (
            <LipsMark key={`k${i}`} className={`fly-kiss fly-kiss-${i + 1}`} />
          ))}
      {quiet
        ? null
        : Array.from({ length: 4 }, (_, i) => (
            <HeartMark key={`h${i}`} className={`fly-heart fly-heart-${i + 1}`} />
          ))}
      <div className="storm-body">{children}</div>
    </div>
  );
}
