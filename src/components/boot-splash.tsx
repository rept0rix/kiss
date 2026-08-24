import { useEffect, useRef, useState } from "react";
import { HeartMark } from "./heart-mark";
import { LipsMark } from "./lips-mark";

export function BootSplash({ onReady }: { onReady: () => void }) {
  const [dark, setDark] = useState(false);
  const [pct, setPct] = useState(12);
  const done = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now() - start;
      if (t >= 280) setDark(true);
      const next = Math.min(100, 12 + (t / 700) * 88);
      setPct(next);
      if (next >= 100 && !done.current) {
        done.current = true;
        onReady();
      }
    }, 32);
    const fail = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      setPct(100);
      onReady();
    }, 900);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fail);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={dark ? "boot is-dark" : "boot"}>
      {dark
        ? Array.from({ length: 8 }, (_, i) => (
            <HeartMark key={i} className={`boot-bit boot-heart boot-h-${i + 1}`} />
          ))
        : Array.from({ length: 8 }, (_, i) => (
            <LipsMark key={i} className={`boot-bit boot-kiss boot-k-${i + 1}`} />
          ))}
      <p className="boot-word">KISS</p>
      <div className="boot-meter">
        <div className="boot-track">
          <i className="boot-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="boot-pct">{Math.round(pct)}%</p>
      </div>
    </div>
  );
}
