import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { Face } from "@/components/face";
import { LipsMark } from "@/components/lips-mark";
import { kissStream } from "@/lib/kisses/server";
import { playKiss, unlockSound } from "@/lib/sound";

export const Route = createFileRoute("/live")({
  component: LiveStream,
});

function LiveStream() {
  const navigate = useNavigate();
  const feed = useQuery({
    queryKey: ["kiss-stream"],
    queryFn: () => kissStream(),
    refetchInterval: 2800,
  });
  const rows = feed.data ?? [];
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (rows.length === 0) return;
    const fresh = rows.filter((r) => !seen.current.has(r.id));
    if (seen.current.size > 0 && fresh.length > 0) {
      unlockSound();
      playKiss();
    }
    for (const r of rows) seen.current.add(r.id);
  }, [rows]);

  const unique = useMemo(() => {
    const seenPair = new Set<string>();
    const out = [];
    for (const r of rows) {
      const key = `${r.from}|${r.to}`;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      out.push(r);
      if (out.length >= 8) break;
    }
    return out;
  }, [rows]);

  const rain = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 4) % 96}%`,
        delay: `${(i % 8) * 0.35}s`,
        dur: `${8 + (i % 5)}s`,
        size: 26 + (i % 5) * 8,
      })),
    [],
  );

  const tape = unique.slice(0, 12);

  return (
    <div className="live-world">
      <div className="live-world-rain" aria-hidden>
        {rain.map((b) => (
          <span
            key={b.id}
            className="live-world-drop"
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.dur,
              width: b.size,
            }}
          >
            <LipsMark i={b.id} />
          </span>
        ))}
      </div>
      <header className="live-world-bar">
        <button type="button" className="live-back" onClick={() => void navigate({ to: "/" })}>
          Back
        </button>
        <p className="live-world-title">
          <i className="live-pulse" /> LIVE
        </p>
        <p className="live-world-count">{rows.length}</p>
      </header>
      <div className="live-feed">
        {unique.length === 0 ? (
          <p className="live-empty">Waiting for a kiss</p>
        ) : (
          unique.map((r, i) => (
            <div key={r.id} className={`live-event ${r.kind === "super" ? "is-super" : ""}`} style={{ animationDelay: `${i * 0.08}s` }}>
              <Face name={r.from} className="stream-face" />
              <LipsMark i={i} className="live-event-lip" />
              <Face name={r.to} className="stream-face" />
              <p className="live-event-copy">
                <b>{r.from}</b> kissed <b>{r.to}</b>
                {r.count > 1 ? ` ×${r.count}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="stream-tape" aria-hidden>
        <div className="stream-tape-track">
          {(tape.length ? tape : [{ id: "x", from: "Someone", to: "Someone", kind: "classic", count: 1 }]).map((r) => (
            <span key={r.id} className="stream-chip">
              {r.from} → {r.to}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
