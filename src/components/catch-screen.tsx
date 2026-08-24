import { useState } from "react";
import { Face } from "./face";
import { ConfettiBurst } from "./confetti-burst";
import { KissSky } from "./kiss-sky";
import { LipsMark } from "./lips-mark";
import { playCelebrate, unlockSound } from "@/lib/sound";
import { Button } from "./ui/button";

export function CatchScreen({
  from,
  photo,
  first,
  onCaught,
}: {
  from: string;
  photo?: string | null;
  first?: boolean;
  onCaught: () => void;
}) {
  const [caught, setCaught] = useState(false);
  const who = from.trim() || "Someone";

  return (
    <KissSky>
      <ConfettiBurst show={caught || Boolean(first)} />
      <div className="stage">
        <span className="live-face">
          <Face name={who} photo={photo} />
          <LipsMark className="live-stamp" />
        </span>
        <p className="live-kicker mt-6">{first ? "Your first kiss" : "Incoming"}</p>
        <h1 className="catch-name mt-2">{who}</h1>
        <p className="mt-2 text-lg text-muted">kissed you</p>
        <Button
          size="lg"
          className="mt-8 h-16 w-full max-w-xs rounded-xl font-display text-2xl"
          disabled={caught}
          onClick={() => {
            if (caught) return;
            setCaught(true);
            unlockSound();
            playCelebrate(first ? 8 : 3);
            window.setTimeout(onCaught, 1100);
          }}
        >
          {caught ? "Caught" : "Catch it"}
        </Button>
      </div>
    </KissSky>
  );
}
