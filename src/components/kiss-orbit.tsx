import { useRef } from "react";
import { faceTemplate, tinyPhoto } from "@/lib/contacts";
import type { OrbitItem } from "@/lib/kisses/types";
import { KissSkin } from "./kiss-skin";

export function KissOrbit({
  photo,
  items,
  onAddPhoto,
  onCatch,
  onFace,
  onReply,
}: {
  photo: string | null;
  items: OrbitItem[];
  onAddPhoto: () => void;
  onCatch: (item: OrbitItem) => void;
  onFace: (id: string, photo: string) => void;
  onReply: (item: OrbitItem) => void;
}) {
  const shown = items.slice(0, 6);
  const faceRef = useRef<HTMLInputElement>(null);
  const pending = useRef<string | null>(null);

  return (
    <div className="orbit">
      <input
        ref={faceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = pending.current;
          e.target.value = "";
          pending.current = null;
          if (!file || !id) return;
          void tinyPhoto(file).then((data) => {
            if (data) onFace(id, data);
          });
        }}
      />
      <button
        type="button"
        className="orbit-face"
        onClick={onAddPhoto}
        aria-label={photo ? "Change photo" : "Add photo"}
      >
        {photo ? (
          <img src={photo} alt="" className="orbit-photo" />
        ) : (
          <img src={faceTemplate("you")} alt="" className="orbit-photo" />
        )}
      </button>
      {shown.map((item, i) => {
        const canCatch = item.dir === "in" && item.status === "waiting";
        const face = item.photo || faceTemplate(item.name);
        const n = Math.max(item.toMe ?? 0, item.fromMe ?? 0, 1);
        return (
          <button
            key={item.id}
            type="button"
            className={`orbit-chip orbit-chip-${i + 1} is-${item.dir} is-${item.status}`}
            onClick={() => {
              if (item.dir === "in") onCatch(item);
              else onReply(item);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              pending.current = item.id;
              faceRef.current?.click();
            }}
          >
            <span className="chip-face">
              <img src={face} alt="" className="chip-photo" />
              {Array.from({ length: Math.min(n, 5) }, (_, k) => (
                <KissSkin
                  key={k}
                  skin={item.skin}
                  className="chip-kiss"
                  style={{
                    transform: `translate(${k * 3}px, ${k * -2}px) rotate(${k * 12}deg)`,
                    zIndex: 5 - k,
                  }}
                />
              ))}
              {n > 1 ? <span className="chip-count">×{n}</span> : null}
            </span>
            <span className="orbit-who">{item.name}</span>
            <span className="orbit-meta">{canCatch ? "open" : n > 1 ? `${n} kisses` : "kiss"}</span>
          </button>
        );
      })}
    </div>
  );
}
