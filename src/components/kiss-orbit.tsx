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
              <KissSkin skin={item.skin} className="chip-kiss" />
            </span>
            <span className="orbit-who">{item.name}</span>
            <span className="orbit-meta">{canCatch ? "open" : "kiss"}</span>
          </button>
        );
      })}
    </div>
  );
}
