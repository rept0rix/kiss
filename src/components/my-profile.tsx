import { useEffect, useState } from "react";
import { addPhoto, loadGallery, saveGallery, type Gallery } from "@/lib/gallery";
import { listNicks } from "@/lib/kisses/server";
import { Face } from "./face";
import { LipsMark } from "./lips-mark";

export function MyProfile({
  name,
  phone,
  sent,
  caught,
  photo,
  onClose,
  onAddPhoto,
  onMain,
  onSend,
}: {
  name: string;
  phone: string;
  sent: number;
  caught: number;
  photo: string | null;
  onClose: () => void;
  onAddPhoto: () => void;
  onMain: (photo: string) => void;
  onSend: (photo: string) => void;
}) {
  const [gallery, setGallery] = useState<Gallery>(() => loadGallery());
  const [nicks, setNicks] = useState<Array<{ from: string; nick: string }>>([]);

  useEffect(() => {
    setGallery(loadGallery());
    if (!phone) return;
    void listNicks({ data: phone }).then(setNicks).catch(() => undefined);
  }, [phone, photo]);

  const pics = gallery.photos.length ? gallery.photos : photo ? [photo] : [];

  return (
    <div className="person-full">
      <button type="button" className="person-x" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <div className="person-body">
        <Face name={name} photo={gallery.main || photo} className="person-face" />
        <h1 className="catch-who" style={{ fontSize: "1.8rem", marginTop: "0.7rem" }}>
          {name.toUpperCase()}
        </h1>
        <p className="person-counts">
          <strong>{sent}</strong> sent · <strong>{caught}</strong> caught
        </p>
        {nicks.length > 0 ? (
          <div className="nick-list">
            <p className="catch-pass-label">They call you</p>
            {nicks.map((n, i) => (
              <p key={`${n.from}-${i}`} className="nick-row">
                <b>{n.nick}</b>
                <span> by {n.from}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="person-ago">No nicknames yet</p>
        )}
        <p className="catch-pass-label">Kiss styles</p>
        <ul className="lip-pack">
          {Array.from({ length: 25 }, (_, i) => (
            <li key={i}>
              <LipsMark i={i} />
            </li>
          ))}
        </ul>
        <p className="catch-pass-label">Photos</p>
        <ul className="photo-grid">
          {pics.map((p) => (
            <li key={p.slice(-24)}>
              <button type="button" className="photo-cell" onClick={() => onMain(p)}>
                <img src={p} alt="" />
                {gallery.main === p ? <span className="photo-tag">Main</span> : null}
                {gallery.send === p ? <span className="photo-tag is-send">Send</span> : null}
              </button>
              <button
                type="button"
                className="photo-send-pick"
                onClick={() => {
                  const next = { ...gallery, send: p };
                  saveGallery(next);
                  setGallery(next);
                  onSend(p);
                }}
              >
                Use to send
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="photo-add" onClick={onAddPhoto}>
              +
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function rememberPhoto(photo: string): void {
  addPhoto(photo);
}
