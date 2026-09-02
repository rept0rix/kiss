import { useEffect, useMemo, useState } from "react";
import { displayName } from "@/lib/nicks";
import type { OrbitItem } from "@/lib/kisses/types";
import { playKiss, unlockSound } from "@/lib/sound";
import { Face } from "./face";
import { LipsMark } from "./lips-mark";

export function LoginRain({
  name,
  people,
  sent,
  caught,
  onReady,
}: {
  name: string;
  people: OrbitItem[];
  sent: number;
  caught: number;
  onReady: () => void;
}) {
  const safeName = (() => {
    const trimmed = name.trim();
    const words = trimmed.split(/\s+/);
    const half = Math.ceil(words.length / 2);
    if (words.length > 1 && words.slice(0, half).join(" ") === words.slice(half).join(" ")) {
      return words.slice(0, half).join(" ");
    }
    return trimmed;
  })();
  const [calm, setCalm] = useState(false);
  const senders = useMemo(() => {
    const seen = new Set<string>();
    const list: OrbitItem[] = [];
    for (const p of people) {
      if ((p.toMe ?? 0) <= 0 && p.dir !== "in") continue;
      const key = (p.tel || p.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(p);
      if (list.length >= 8) break;
    }
    return list;
  }, [people]);

  const rain = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        key: `lip-${i}`,
        left: `${2 + ((i * 17 + (i % 5) * 7) % 94)}%`,
        delay: `${(i % 20) * 0.45 + Math.floor(i / 20) * 0.2}s`,
        dur: `${3.6 + (i % 8) * 0.55}s`,
        size: 28 + (i % 8) * 9,
        i,
      })),
    [],
  );

  const faces = useMemo(
    () =>
      senders.map((p, i) => ({
        key: p.id,
        name: displayName(p.realName || p.name, p.tel),
        photo: p.photo,
        left: `${10 + ((i * 23) % 72)}%`,
        delay: `${0.15 + i * 0.22}s`,
        dur: `${4.2 + (i % 3) * 0.4}s`,
        size: 64 + (i % 3) * 8,
      })),
    [senders],
  );

  useEffect(() => {
    unlockSound();
    playKiss();
    const calmT = window.setTimeout(() => setCalm(true), 18000);
    const done = window.setTimeout(onReady, 30000);
    return () => {
      window.clearTimeout(calmT);
      window.clearTimeout(done);
    };
    // only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={calm ? "login-rain is-calm" : "login-rain"}>
      <div className="login-storm">
      {rain.map((d) => (
        <span
          key={d.key}
          className="login-lip"
          style={{
            left: d.left,
            animationDelay: d.delay,
            animationDuration: d.dur,
            width: d.size,
          }}
        >
          <LipsMark i={d.i} />
        </span>
      ))}
      {faces.map((f) => (
        <span
          key={f.key}
          className="login-person"
          style={{
            left: f.left,
            animationDelay: f.delay,
            animationDuration: f.dur,
            width: f.size,
            height: f.size,
          }}
        >
          <Face name={f.name} photo={f.photo} className="login-face" />
        </span>
      ))}
      </div>
      <div className="login-copy">
        <div className="login-glass">
          <p className="login-kicker">You're in</p>
          <h1 className="login-hi">{(safeName || "Kiss").toUpperCase()}</h1>
          <p className="login-count">
            <strong>{sent}</strong> sent
            <span>·</span>
            <strong>{caught}</strong> caught
          </p>
          <button type="button" className="login-go" onClick={onReady}>
            Come in
          </button>
        </div>
      </div>
    </div>
  );
}
