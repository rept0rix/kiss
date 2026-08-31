import { useEffect, useMemo } from "react";
import { Face } from "./face";
import { ConfettiBurst } from "./confetti-burst";
import { HeartMark } from "./heart-mark";
import { KissSkin } from "./kiss-skin";
import { LipsMark } from "./lips-mark";
import { playKiss, playSuper, unlockSound } from "@/lib/sound";

export function LiveKiss({
  from,
  photo,
  first,
  count,
  skin,
  canReply,
  more,
  inbound = true,
  superMs = 0,
  onClose,
  onReply,
  onFlood,
  onSuper,
  onBlock,
}: {
  from: string;
  photo?: string | null;
  first: boolean;
  count: number;
  skin?: string | null;
  canReply?: boolean;
  more?: boolean;
  inbound?: boolean;
  superMs?: number;
  onClose: () => void;
  onReply: () => void;
  onFlood?: () => void;
  onSuper?: () => void;
  onBlock?: () => void;
}) {
  const n = Math.max(1, count);
  const rain = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 12) * 0.12}s`,
        dur: `${2.4 + (i % 7) * 0.22}s`,
        size: 18 + (i % 5) * 8,
        heart: i % 2 === 0,
        rot: (i * 23) % 50 - 25,
      })),
    [],
  );

  useEffect(() => {
    unlockSound();
    playKiss();
  }, [from]);

  return (
    <div className="live-kiss" role="dialog" aria-label={`${from} loves you`}>
      <div className="love-rain" aria-hidden>
        {rain.map((d) => (
          <span
            key={d.id}
            className="love-drop"
            style={{
              left: d.left,
              animationDelay: d.delay,
              animationDuration: d.dur,
              width: d.size,
              color: "#e11d2e",
              ["--spin" as string]: `${d.rot}deg`,
            }}
          >
            {d.heart ? <HeartMark /> : <LipsMark />}
          </span>
        ))}
      </div>
      <ConfettiBurst show />
      <div className="live-card">
        <button type="button" className="live-face love-glow" onClick={onReply} aria-label={`Kiss ${from} back`}>
          <Face name={from} photo={photo} />
          <KissSkin skin={skin} className="live-stamp" />
          {Array.from({ length: Math.min(n, 12) }, (_, i) => {
            const a = (i / Math.min(n, 12)) * Math.PI * 2 - Math.PI / 2;
            const rad = 108;
            return (
              <span
                key={i}
                className="count-bit"
                style={{
                  left: `calc(50% + ${Math.cos(a) * rad}px)`,
                  top: `calc(50% + ${Math.sin(a) * rad}px)`,
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <KissSkin skin={skin} />
              </span>
            );
          })}
        </button>
        <p className="live-kicker">{first ? "Your first kiss" : inbound ? "So loved" : "Your kisses"}</p>
        <p className="live-name">{from}</p>
        <p className="live-count">
          <span className="tabular-nums">{n}</span> {n === 1 ? "kiss" : "kisses"}{" "}
          {inbound ? "for you" : "you sent"}
        </p>
        <p className="live-love-line">
          {inbound ? "They keep kissing you." : "You showered them with love."}
        </p>
        {canReply !== false ? (
          <button type="button" className="live-go" onClick={onReply}>
            Kiss back
          </button>
        ) : null}
        {canReply !== false && onSuper && superMs > 0 ? (
          <button type="button" className="live-super" onClick={() => { playSuper(); onSuper(); }}>
            Super kiss · {Math.ceil(superMs / 1000)}s
          </button>
        ) : canReply !== false && onSuper ? (
          <button type="button" className="live-super" onClick={() => { playSuper(); onSuper(); }}>
            Super kiss
          </button>
        ) : null}
        {canReply !== false && onFlood ? (
          <button type="button" className="live-flood" onClick={onFlood}>
            Flood ×21
          </button>
        ) : null}
        <button type="button" className="live-skip" onClick={onClose}>
          {more ? "Next kiss" : "Close"}
        </button>
        {onBlock ? (
          <button type="button" className="live-block" onClick={onBlock}>
            Block · they won't know
          </button>
        ) : null}
      </div>
    </div>
  );
}
