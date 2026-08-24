import { faceTemplate } from "@/lib/contacts";
import { ConfettiBurst } from "./confetti-burst";
import { KissSkin } from "./kiss-skin";

export function LiveKiss({
  from,
  photo,
  first,
  count,
  skin,
  canReply,
  more,
  onClose,
  onReply,
  onFlood,
}: {
  from: string;
  photo?: string | null;
  first: boolean;
  count: number;
  skin?: string | null;
  canReply?: boolean;
  more?: boolean;
  onClose: () => void;
  onReply: () => void;
  onFlood?: () => void;
}) {
  const src = photo || faceTemplate(from);
  const n = Math.max(1, Math.min(count, 16));
  return (
    <div className="live-kiss" role="dialog" aria-label={`${from} kissed you`}>
      <ConfettiBurst show />
      <div className="live-card">
        <button type="button" className="live-face" onClick={onReply} aria-label={`Kiss ${from} back`}>
          <img src={src} alt="" />
          <KissSkin skin={skin} className="live-stamp" />
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const rad = 88;
            return (
              <span
                key={i}
                className="count-bit"
                style={{
                  left: `calc(50% + ${Math.cos(a) * rad}px)`,
                  top: `calc(50% + ${Math.sin(a) * rad}px)`,
                  animationDelay: `${i * 70}ms`,
                }}
              >
                <KissSkin skin={skin} />
              </span>
            );
          })}
        </button>
        <p className="live-kicker">{first ? "Your first kiss" : "Opened"}</p>
        <p className="live-name">{from}</p>
        <p className="live-count">
          <span className="tabular-nums">{count}</span> {count === 1 ? "kiss" : "kisses"} to you
        </p>
        {canReply !== false ? (
          <button type="button" className="live-go" onClick={onReply}>
            Kiss back
          </button>
        ) : null}
        {canReply !== false && onFlood ? (
          <button type="button" className="live-flood" onClick={onFlood}>
            Flood ×21
          </button>
        ) : null}
        <button type="button" className="live-skip" onClick={onClose}>
          {more ? "Next kiss" : "See who"}
        </button>
      </div>
    </div>
  );
}
