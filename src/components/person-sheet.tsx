import { useEffect, useState } from "react";
import { isBlocked } from "@/lib/block";
import { formatPhone } from "@/lib/contacts";
import { displayName, getNick, setNick } from "@/lib/nicks";
import { saveNick } from "@/lib/kisses/server";
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
  onKiss: () => void;
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
            setSentNow((n) => n + 1);
            onKiss();
          }}
        >
          {busy ? "…" : sentNow > 0 ? `Kiss · ${sentNow}` : "Kiss"}
        </button>
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
