import { HeartMark } from "./heart-mark";
import { LipsMark } from "./lips-mark";

const BITS = [
  { cls: "burst-1", Kind: LipsMark },
  { cls: "burst-2", Kind: HeartMark },
  { cls: "burst-3", Kind: LipsMark },
  { cls: "burst-4", Kind: HeartMark },
  { cls: "burst-5", Kind: LipsMark },
  { cls: "burst-6", Kind: HeartMark },
  { cls: "burst-7", Kind: LipsMark },
  { cls: "burst-8", Kind: HeartMark },
  { cls: "burst-9", Kind: LipsMark },
  { cls: "burst-10", Kind: HeartMark },
  { cls: "burst-11", Kind: LipsMark },
  { cls: "burst-12", Kind: HeartMark },
  { cls: "burst-13", Kind: LipsMark },
  { cls: "burst-14", Kind: HeartMark },
  { cls: "burst-15", Kind: LipsMark },
  { cls: "burst-16", Kind: HeartMark },
] as const;

export function ConfettiBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="burst" aria-hidden>
      {BITS.map((b, i) => {
        const Kind = b.Kind;
        return <Kind key={i} className={`burst-bit ${b.cls}`} />;
      })}
    </div>
  );
}
