import { useEffect, useState } from "react";
import { HeartMark } from "./heart-mark";
import { LipsMark } from "./lips-mark";

export function BootSplash({
  hold,
  onReady,
}: {
  hold?: boolean;
  onReady: () => void;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const a = window.setTimeout(() => setDark(true), 850);
    const b = window.setTimeout(() => onReady(), 2200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={dark ? "boot is-dark" : "boot"} aria-hidden>
      {dark
        ? Array.from({ length: 8 }, (_, i) => (
            <HeartMark key={i} className={`boot-bit boot-heart boot-h-${i + 1}`} />
          ))
        : Array.from({ length: 8 }, (_, i) => (
            <LipsMark key={i} className={`boot-bit boot-kiss boot-k-${i + 1}`} />
          ))}
      <p className="boot-word">KISS</p>
    </div>
  );
}
