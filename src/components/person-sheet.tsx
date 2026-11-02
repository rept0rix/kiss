import { useEffect, useState } from "react";
import { MessageCircle, Smartphone, Share2, Lock, Clock, PhoneForwarded, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { isBlocked } from "@/lib/block";
import { formatPhone, openWhatsApp, smsHref, isKnownContact, maskPhone } from "@/lib/contacts";
import { displayName, getNick, setNick } from "@/lib/nicks";
import {
  saveNick,
  getPhoneShareStatus,
  requestPhoneShare,
  respondPhoneShare,
  type PhoneShareStatus,
} from "@/lib/kisses/server";
import { nativeShareOrCopy, publicCatchUrl, publicOrigin } from "@/lib/share";
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
  const [shareStatus, setShareStatus] = useState<PhoneShareStatus | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);

  const blocked = isBlocked(real, tel);
  const shown = displayName(real, tel) || real;

  // Direct contact known if it's already in the user's contacts or they sent kisses directly to them
  const isDirectKnown = Boolean(
    tel && (isKnownContact(tel) || (item.fromMe != null && item.fromMe > 0))
  );

  const canViewPhone = isDirectKnown || shareStatus?.canView === true;
  const phone = tel && canViewPhone ? formatPhone(tel) : null;
  const masked = tel && !canViewPhone ? maskPhone(tel) : null;

  useEffect(() => {
    const id = window.setInterval(() => setNow((n) => n + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  // Fetch phone share status if not directly known in contacts
  useEffect(() => {
    if (!tel || !myPhone || isDirectKnown) return;
    let active = true;
    void getPhoneShareStatus({
      data: { myPhone, otherPhone: tel },
    })
      .then((res) => {
        if (active) setShareStatus(res);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [tel, myPhone, isDirectKnown]);

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

        {/* Phone display: Unmasked if friend/approved, Masked with privacy badge if stranger */}
        {phone?.display ? (
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <p className="person-tel">
              {phone.display} {phone.country}
            </p>
            {isDirectKnown ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Contact
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <CheckCircle2 size={10} /> Shared
              </span>
            )}
          </div>
        ) : masked ? (
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <p className="person-tel text-zinc-400 flex items-center gap-1">
              <Lock size={12} className="text-zinc-500" />
              <span>{masked}</span>
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              Private
            </span>
          </div>
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

        {/* Phone Actions: Visible only when unmasked / approved */}
        {canViewPhone && tel ? (
          <div className="flex gap-2 w-full mt-2 justify-center">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366]/25 text-[#25d366] font-medium text-xs transition-colors active:scale-95"
              onClick={() => {
                const url = publicCatchUrl(myName || "Someone", tel) || publicOrigin();
                const msg = `Come get a kiss from me on KISS 💋\n${url}`;
                openWhatsApp(tel, msg);
              }}
              title="Send on WhatsApp"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </button>
            <a
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium text-xs transition-colors active:scale-95"
              href={smsHref(tel, `Come get a kiss from me on KISS 💋\n${publicCatchUrl(myName || "Someone", tel) || publicOrigin()}`)}
              title="Send SMS"
            >
              <Smartphone size={15} />
              <span>SMS</span>
            </a>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors active:scale-95"
              onClick={async () => {
                const url = publicCatchUrl(myName || "Someone", tel);
                const res = await nativeShareOrCopy({
                  title: "KISS",
                  text: `Come get a kiss from ${myName || "Someone"} on KISS 💋`,
                  url: url || publicOrigin(),
                });
                if (res === "copied") toast.success("Kiss link copied!");
                else if (res === "shared") toast.success("Shared successfully!");
              }}
              title="Share kiss link"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>
          </div>
        ) : (
          /* Privacy Section: Stranger Number Hidden - Request or Approve exchange */
          <div className="w-full mt-3 flex flex-col items-center gap-2">
            {shareStatus?.status === "pending_received" ? (
              <div className="w-full p-3 rounded-2xl bg-gradient-to-b from-[#e11d2e]/20 to-[#e11d2e]/5 border border-[#e11d2e]/40 flex flex-col items-center text-center gap-2">
                <p className="text-xs text-white/95 font-medium leading-relaxed">
                  <strong>{shareStatus.requesterName || real}</strong> asked to see your phone number to connect.
                </p>
                <div className="flex gap-2 w-full mt-1">
                  <button
                    type="button"
                    disabled={loadingShare}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#e11d2e] hover:bg-[#ff2a4d] text-white font-bold text-xs shadow-lg shadow-[#e11d2e]/30 transition-all active:scale-95"
                    onClick={async () => {
                      if (!myPhone || !tel) return;
                      setLoadingShare(true);
                      try {
                        await respondPhoneShare({ data: { myPhone, requesterPhone: tel, approved: true } });
                        toast.success("Phone number shared! 🤝");
                        setShareStatus({ canView: true, status: "approved" });
                      } catch {
                        toast.error("Failed to approve request");
                      } finally {
                        setLoadingShare(false);
                      }
                    }}
                  >
                    {loadingShare ? "…" : "Share Number 🤝"}
                  </button>
                  <button
                    type="button"
                    disabled={loadingShare}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-medium text-xs transition-colors active:scale-95"
                    onClick={async () => {
                      if (!myPhone || !tel) return;
                      setLoadingShare(true);
                      try {
                        await respondPhoneShare({ data: { myPhone, requesterPhone: tel, approved: false } });
                        toast.info("Request declined");
                        setShareStatus({ canView: false, status: "declined" });
                      } catch {
                        toast.error("Failed to decline");
                      } finally {
                        setLoadingShare(false);
                      }
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : shareStatus?.status === "pending_sent" ? (
              <div className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center">
                <p className="text-xs text-amber-300 font-medium flex items-center justify-center gap-1.5">
                  <Clock size={13} />
                  <span>Request sent · Waiting for {real} to share</span>
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  disabled={loadingShare || !tel}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-zinc-700/60 text-white font-semibold text-xs transition-all shadow-md active:scale-98"
                  onClick={async () => {
                    if (!myPhone) {
                      toast.error("Add your phone number first to request");
                      return;
                    }
                    if (!tel) return;
                    setLoadingShare(true);
                    try {
                      const res = await requestPhoneShare({
                        data: { myPhone, myName, targetPhone: tel },
                      });
                      if (res.status === "approved") {
                        toast.success("Mutual exchange! Phone number revealed! 🎉");
                        setShareStatus({ canView: true, status: "approved" });
                      } else {
                        toast.success("Phone request sent! 📱");
                        setShareStatus({ canView: false, status: "pending_sent" });
                      }
                    } catch {
                      toast.error("Could not send request");
                    } finally {
                      setLoadingShare(false);
                    }
                  }}
                >
                  <PhoneForwarded size={14} className="text-[#ff2a4d]" />
                  <span>{loadingShare ? "Sending…" : "Request Phone Number 📱"}</span>
                </button>
                <p className="text-[11px] text-zinc-500 text-center px-1">
                  Number is hidden for privacy. Ask them to share to message on WhatsApp.
                </p>
              </div>
            )}

            {/* Share link to them is always available */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors mt-1 active:scale-95"
              onClick={async () => {
                const url = publicCatchUrl(myName || "Someone", tel);
                const res = await nativeShareOrCopy({
                  title: "KISS",
                  text: `Come get a kiss from ${myName || "Someone"} on KISS 💋`,
                  url: url || publicOrigin(),
                });
                if (res === "copied") toast.success("Kiss link copied!");
                else if (res === "shared") toast.success("Shared successfully!");
              }}
              title="Share kiss link"
            >
              <Share2 size={14} />
              <span>Share Kiss Link</span>
            </button>
          </div>
        )}
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
