import { useEffect, useState } from "react";
import { MessageCircle, Smartphone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { isBlocked } from "@/lib/block";
import { formatPhone, openWhatsApp, smsHref } from "@/lib/contacts";
import { displayName, getNick, setNick } from "@/lib/nicks";
import { saveNick } from "@/lib/kisses/server";
import { nativeShareOrCopy, publicCatchUrl } from "@/lib/share";
import type { OrbitItem } from "@/lib/kisses/types";
import { Face } from "./face";
import { Confirm } from "./confirm";

function ago(ts?: number): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function PersonSheet({
  item,
  onClose,
  onKiss,
  onBlock,
  busy,
  myPhone,
  myName,
}: {
  item: OrbitItem;
  onClose: () => void;
  /** Resolve `false` when the kiss did not go out; the sheet then does not count it. */
  onKiss: () => void | boolean | Promise<void | boolean>;
  onBlock: () => void;
  busy?: boolean;
  myPhone?: string;
  myName?: string;
}) {
  const real = item.realName || item.name;
  const tel = item.tel;
  const [nick, setNickValue] = useState(() => getNick(real, tel));
  const [now, setNow] = useState(0);
  const [sentNow, setSentNow] = useState(0);
  const [askBlock, setAskBlock] = useState(false);
  const blocked = isBlocked(real, tel);
  const shown = displayName(real, tel) || real;
  const phone = tel ? formatPhone(tel) : null;

  useEffect(() => {
    const id = window.setInterval(() => setNow((n) => n + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="person-full">
      <button type="button" className="person-x" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <button type="button" className="person-block" onClick={() => setAskBlock(true)}>
        {blocked ? "Blocked" : "Block"}
      </button>
      <div className="person-body">
        <Face name={shown} photo={item.photo} className="person-face" />
        <input
          className="person-nick"
          value={nick}
          placeholder="Nickname"
          maxLength={24}
          onChange={(e) => setNickValue(e.target.value)}
          onBlur={() => {
            setNick(real, tel, nick);
            if (myPhone && tel && nick.trim()) {
              void saveNick({
                data: { myPhone, myName: myName || "", theirPhone: tel, nick },
              }).catch(() => undefined);
            }
          }}
        />
        <p className="person-real">{real}</p>
        {phone?.display ? (
          <p className="person-tel">
            {phone.display} {phone.country}
          </p>
        ) : null}
        {blocked ? <p className="person-flag">Blocked · they don't know</p> : null}
        <p className="person-counts">
          You sent <strong>{item.fromMe ?? 0}</strong>
          {" · "}
          They sent <strong>{item.toMe ?? 0}</strong>
        </p>
        <p className="person-ago" key={now}>
          You: {ago(item.lastOut)}
          {" · "}
          Them: {ago(item.lastIn)}
        </p>
        <button
          type="button"
          className="person-kiss"
          disabled={busy || blocked}
          onClick={() => {
            void Promise.resolve(onKiss()).then((ok) => {
              if (ok !== false) setSentNow((n) => n + 1);
            });
          }}
        >
          {busy ? "…" : sentNow > 0 ? `Kiss · ${sentNow}` : "Kiss"}
        </button>

        {/* Quick External Actions: WhatsApp, SMS, Share */}
        <div className="flex gap-2 w-full mt-2 justify-center">
          {tel ? (
            <>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366]/25 text-[#25d366] font-medium text-xs transition-colors"
                onClick={() => {
                  const url = publicCatchUrl(myName || "Someone", tel);
                  const msg = `Come get a kiss from me on KISS 💋${url ? `\n${url}` : ""}`;
                  openWhatsApp(tel, msg);
                }}
                title="Send on WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>
              <a
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium text-xs transition-colors"
                href={smsHref(tel, `Come get a kiss from me on KISS 💋\n${publicCatchUrl(myName || "Someone", tel) || ""}`)}
                title="Send SMS"
              >
                <Smartphone size={15} />
                <span>SMS</span>
              </a>
            </>
          ) : null}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
            onClick={async () => {
              const url = publicCatchUrl(myName || "Someone", tel);
              const res = await nativeShareOrCopy({
                title: "KISS",
                text: `Come get a kiss from ${myName || "Someone"} on KISS 💋`,
                url: url || window.location.origin,
              });
              if (res === "copied") toast.success("קישור הועתק!");
              else if (res === "shared") toast.success("שותף בהצלחה!");
            }}
            title="Share kiss link"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>
      </div>
      <Confirm
        open={askBlock}
        title={blocked ? "Unblock?" : "Block them?"}
        body="They won't know. Their kisses stop arriving. They stay on your orbit marked blocked."
        yes={blocked ? "Unblock" : "Block"}
        onNo={() => setAskBlock(false)}
        onYes={() => {
          setAskBlock(false);
          onBlock();
        }}
      />
    </div>
  );
}
