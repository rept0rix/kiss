import { useEffect, useMemo, useState } from "react";
import { Face } from "./face";
import { ConfettiBurst } from "./confetti-burst";
import { KissSky } from "./kiss-sky";
import { LipsMark } from "./lips-mark";
import { playKiss, unlockSound } from "@/lib/sound";
import { loadMe } from "@/lib/me";
import { loadRecents } from "@/lib/contacts";
import { searchDirectory, sendPhoneKiss } from "@/lib/kisses/server";
import type { PublicPerson } from "@/lib/kisses/types";

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
  const [pass, setPass] = useState(false);
  const [friends, setFriends] = useState<PublicPerson[]>([]);
  const who = from.trim() || "Someone";
  const bits = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${(i * 19) % 100}%`,
        delay: `${(i % 9) * 0.12}s`,
        dur: `${2.2 + (i % 7) * 0.25}s`,
        size: 28 + (i % 6) * 10,
        rot: (i * 17) % 50 - 25,
      })),
    [],
  );

  useEffect(() => {
    unlockSound();
    playKiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pass) return;
    const me = loadMe();
    const recents = loadRecents();
    void searchDirectory({ data: { q: "", myPhone: me.phone } }).then((rows) => {
      const mine = me.phone.replace(/\D/g, "").slice(-8);
      const sender = who.toLowerCase();
      const recentTails = new Set(recents.map((c) => c.tel.replace(/\D/g, "").slice(-8)).filter((t) => t.length >= 7));
      const picks = rows.filter((r) => {
        const tail = (r.phone ?? "").replace(/\D/g, "").slice(-8);
        if (mine && tail === mine) return false;
        if (r.displayName.toLowerCase() === sender) return false;
        if (recentTails.size === 0) return Boolean(r.phone);
        return recentTails.has(tail);
      });
      setFriends((picks.length > 0 ? picks : rows.filter((r) => r.displayName.toLowerCase() !== sender)).slice(0, 8));
    });
  }, [pass, who]);

  return (
    <KissSky storm={14}>
      <ConfettiBurst show />
      <div className="catch-rain" aria-hidden>
        {bits.map((b) => (
          <span
            key={b.id}
            className="catch-drop"
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.dur,
              width: b.size,
              ["--spin" as string]: `${b.rot}deg`,
            }}
          >
            <LipsMark i={b.id} />
          </span>
        ))}
      </div>
      <div className="catch-stage">
        <span className="catch-face">
          <Face name={who} photo={photo} />
          <LipsMark i={3} className="catch-stamp" />
        </span>
        <p className="catch-kicker">{first ? "FIRST KISS" : "INCOMING"}</p>
        <h1 className="catch-who">{who.toUpperCase()}</h1>
        <p className="catch-did">KISSED YOU</p>
        {pass ? (
          <div className="catch-pass">
            <p className="catch-pass-label">Send it on</p>
            <ul className="catch-friends">
              {friends.map((f) => (
                <li key={f.userId}>
                  <button
                    type="button"
                    className="catch-friend"
                    onClick={() => {
                      const me = loadMe();
                      playKiss();
                      if (me.phone && f.phone) {
                        void sendPhoneKiss({
                          data: {
                            fromPhone: me.phone,
                            fromName: me.name || "Someone",
                            toPhone: f.phone,
                            count: 1,
                          },
                        }).catch(() => undefined);
                      }
                    }}
                  >
                    <Face name={f.displayName} photo={f.photo} className="catch-friend-face" />
                    <span>{f.displayName.split(" ")[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="catch-go" onClick={onCaught}>
              Come in
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="catch-go"
            disabled={caught}
            onClick={() => {
              if (caught) return;
              setCaught(true);
              unlockSound();
              playKiss();
              window.setTimeout(() => setPass(true), 900);
            }}
          >
            {caught ? "GOT IT" : "COME GET IT"}
          </button>
        )}
      </div>
    </KissSky>
  );
}
