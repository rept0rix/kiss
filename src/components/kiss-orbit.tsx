import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import type { OrbitItem } from "@/lib/kisses/types";
import { isBlocked } from "@/lib/block";
import { displayName } from "@/lib/nicks";
import { Face } from "./face";
import { KissSkin } from "./kiss-skin";

type Extra = { x: number; y: number };

function seed(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return n;
}

export function KissOrbit({
  photo,
  items,
  onAddPhoto,
  onCatch,
  onEmpty,
}: {
  photo: string | null;
  items: OrbitItem[];
  tilt?: { x: number; y: number };
  onAddPhoto: () => void;
  onCatch: (item: OrbitItem) => void;
  onFace?: (id: string, photo: string) => void;
  onReply?: (item: OrbitItem) => void;
  onEmpty?: () => void;
}) {
  const shown = items.slice(0, 12);
  const ghosts = Math.max(0, Math.min(8, 10 - shown.length));
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const extras = useRef(new Map<string, Extra>());
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const wrap = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const [, bump] = useState(0);

  useEffect(() => {
    let frame = 0;
    function loop(t: number) {
      setTick(t / 1000);
      frame = window.requestAnimationFrame(loop);
    }
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    function onStart(e: Event) {
      e.preventDefault();
      pinch.current = { dist: 1, zoom: zoomRef.current };
    }
    function onChange(e: Event) {
      const ge = e as Event & { scale?: number };
      e.preventDefault();
      const scale = ge.scale ?? 1;
      setZoom(clampZoom((pinch.current?.zoom ?? 1) * scale));
    }
    el.addEventListener("gesturestart", onStart, { passive: false });
    el.addEventListener("gesturechange", onChange, { passive: false });
    return () => {
      el.removeEventListener("gesturestart", onStart);
      el.removeEventListener("gesturechange", onChange);
    };
  }, []);

  function clampZoom(v: number) {
    return Math.max(0.7, Math.min(1.85, v));
  }

  function pos(i: number, n: number, id: string) {
    const s = seed(id);
    const speedA = 0.45 + (s % 9) * 0.11;
    const speedB = 0.35 + ((s >> 3) % 7) * 0.13;
    const wobble = 0.12 + ((s >> 6) % 5) * 0.04;
    const baseR = 34 + (s % 10) * 0.7;
    const a =
      (i / Math.max(n, 1)) * Math.PI * 2 -
      Math.PI / 2 +
      Math.sin(tick * speedB + s * 0.01) * wobble;
    const r = (baseR + Math.sin(tick * speedA + s * 0.02) * (3 + (s % 4))) * zoom;
    const extra = extras.current.get(id) ?? { x: 0, y: 0 };
    const x = 50 + Math.cos(a) * r + extra.x + Math.sin(tick * speedA * 1.4 + i) * 1.6;
    const y = 50 + Math.sin(a) * r + extra.y + Math.cos(tick * speedB * 1.1 + i) * 1.8;
    const size = 0.85 + (zoom - 1) * 0.35;
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%, -50%) scale(${size})`,
    };
  }

  function distOf(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function down(id: string, e: PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinch.current = { dist: distOf(pts[0]!, pts[1]!), zoom };
      drag.current = null;
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
  }
  function move(e: PointerEvent) {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pinch.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const d = distOf(pts[0]!, pts[1]!);
      setZoom(clampZoom(pinch.current.zoom * (d / pinch.current.dist)));
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / 4;
    const dy = (e.clientY - d.y) / 4;
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
    const prev = extras.current.get(d.id) ?? { x: 0, y: 0 };
    extras.current.set(d.id, { x: prev.x + dx, y: prev.y + dy });
    d.x = e.clientX;
    d.y = e.clientY;
    bump((n) => n + 1);
  }
  function up(e: PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  }

  function onWheel(e: WheelEvent) {
    setZoom((z) => clampZoom(z + (e.deltaY > 0 ? -0.08 : 0.08)));
  }

  const n = shown.length + ghosts;

  return (
    <div
      ref={wrap}
      className="orbit"
      onWheel={onWheel}
      onPointerDownCapture={(e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) {
          const pts = [...pointers.current.values()];
          pinch.current = { dist: distOf(pts[0]!, pts[1]!), zoom };
          drag.current = null;
        }
      }}
      onPointerMoveCapture={(e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size >= 2) {
          const pts = [...pointers.current.values()];
          const d = distOf(pts[0]!, pts[1]!);
          const base = pinch.current;
          if (base?.dist) setZoom(clampZoom(base.zoom * (d / base.dist)));
        }
      }}
      onPointerUpCapture={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
      }}
    >
      <div className="orbit-zoom">
        <button type="button" onClick={() => setZoom((z) => clampZoom(z - 0.15))} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={() => setZoom((z) => clampZoom(z + 0.15))} aria-label="Zoom in">
          +
        </button>
      </div>
      <button
        type="button"
        className="orbit-face"
        onClick={onAddPhoto}
        aria-label={photo ? "Change photo" : "Add photo"}
      >
        {photo ? (
          <img src={photo} alt="" className="orbit-photo" />
        ) : (
          <span className="orbit-empty">Add photo</span>
        )}
      </button>
      {shown.map((item, i) => {
        const canCatch = item.dir === "in" && item.status === "waiting";
        const count = Math.max(item.toMe ?? 0, item.fromMe ?? 0, 1);
        const style = pos(i, n, item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`orbit-chip is-${item.dir} is-${item.status} ${item.skin === "super" ? "is-super" : ""} ${isBlocked(item.name, item.tel) ? "is-blocked" : ""}`}
            style={style}
            onPointerDown={(e) => down(item.id, e)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onClick={() => {
              if (drag.current?.moved) return;
              onCatch(item);
            }}
          >
            <span className="chip-face">
              <Face name={item.name} photo={item.photo} className="chip-photo" />
              <KissSkin skin={item.skin} className="chip-kiss" />
              {count > 1 ? <span className="chip-count">×{count}</span> : null}
            </span>
            <span className="orbit-who">{displayName(item.realName || item.name, item.tel)}</span>
            <span className="orbit-meta">
              {isBlocked(item.name, item.tel) ? "blocked" : canCatch ? "open" : count > 1 ? `${count}` : "kiss"}
            </span>
          </button>
        );
      })}
      {Array.from({ length: ghosts }, (_, i) => {
        const id = `ghost-${i}`;
        const style = pos(shown.length + i, n, id);
        return (
          <button
            key={id}
            type="button"
            className="orbit-chip is-ghost"
            style={style}
            onPointerDown={(e) => down(id, e)}
            onPointerMove={move}
            onPointerUp={up}
            onClick={() => {
              if (drag.current?.moved) return;
              onEmpty?.();
            }}
            aria-label="Send a kiss"
          >
            <span className="chip-face chip-ghost">+</span>
          </button>
        );
      })}
    </div>
  );
}
