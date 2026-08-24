import { useEffect } from "react";
import { kindLabel, type KissKindId } from "@/lib/kisses/kinds";
import { LipsMark } from "./lips-mark";

export type OverlayKiss = {
  fromName: string;
  kind: KissKindId | string;
};

export function KissOverlay({
  kiss,
  onDone,
}: {
  kiss: OverlayKiss | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!kiss) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 380;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.stop(ctx.currentTime + 0.24);
    } catch {
      /* audio optional */
    }
    const t = window.setTimeout(onDone, 1400);
    return () => window.clearTimeout(t);
  }, [kiss, onDone]);

  if (!kiss) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/70 px-6"
      role="dialog"
      aria-label="Kiss"
      onClick={onDone}
    >
      <div className="kiss-enter relative flex w-full max-w-sm flex-col items-center gap-4 rounded-xl bg-elevated px-8 py-10 text-center">
        <span className="kiss-ring absolute size-28 rounded-full border border-primary/50" />
        <LipsMark className="relative size-16 text-primary" />
        <p className="font-display text-3xl text-fg">{kindLabel(kiss.kind)}</p>
        <p className="text-sm text-muted">from {kiss.fromName}</p>
      </div>
    </div>
  );
}
