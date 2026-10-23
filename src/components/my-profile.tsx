import { useEffect, useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { addPhoto, loadGallery, saveGallery, type Gallery } from "@/lib/gallery";
import { listNicks } from "@/lib/kisses/server";
import { openWhatsApp } from "@/lib/contacts";
import { nativeShareOrCopy, publicCatchUrl, publicOrigin } from "@/lib/share";
import { Achievements } from "./achievements";
import { Face } from "./face";
import { QrCodeSection } from "./qr-code-section";

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
        <QrCodeSection phone={phone} name={name} />

        <div className="flex gap-2 w-full mt-2 mb-4 justify-center">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366]/25 text-[#25d366] font-medium text-xs transition-colors"
            onClick={() => {
              const url = publicCatchUrl(name, phone) || publicOrigin();
              openWhatsApp("", `Send me a kiss on KISS 💋\n${url}`);
            }}
          >
            <MessageCircle size={15} />
            <span>Share via WhatsApp</span>
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
            onClick={async () => {
              const url = publicCatchUrl(name, phone);
              const res = await nativeShareOrCopy({
                title: "KISS",
                text: `Send me a kiss on KISS 💋`,
                url: url || publicOrigin(),
              });
              if (res === "copied") toast.success("Profile link copied!");
              else if (res === "shared") toast.success("Shared successfully!");
            }}
          >
            <Share2 size={15} />
            <span>Share Link</span>
          </button>
        </div>

        <Achievements sent={sent} received={caught} />
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
