import { useEffect, useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  Globe,
  MessageCircle,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import {
  canPickContacts,
  isPhoneIdentity,
  isValidPhone,
  loadRecents,
  markPhoneAsKnown,
  openWhatsApp,
  pickFromPhone,
  rememberContact,
  smsHref,
} from "@/lib/contacts";
import { loadGroups, upsertGroup, type KissGroup } from "@/lib/groups";
import { RANKS, rankAt } from "@/lib/kisses/ranks";
import {
  createShareLink,
  searchDirectory,
  sendPhoneKiss,
  sendSocialKiss,
  sendStrangerKiss,
} from "@/lib/kisses/server";
import { consumeSuperKiss } from "@/lib/store/server";
import type { PublicPerson } from "@/lib/kisses/types";
import { buildKissCard } from "@/lib/kiss-card";
import {
  nativeShareOrCopy,
  publicCatchUrl,
  publicOrigin,
  publicSocialCatchUrl,
  shareBody,
  shortCatchUrl,
} from "@/lib/share";
import { Button } from "./ui/button";
import { Face } from "./face";
import { Input } from "./ui/input";
import { KissSkin } from "./kiss-skin";
import { ContactPickerSheet } from "./contact-picker-sheet";

export type SentPayload = {
  name: string;
  status: "waiting" | "invited";
  photo?: string | null;
  tel?: string;
  userId?: string;
  count?: number;
};

export type SendTarget = {
  name?: string;
  tel?: string;
  photo?: string | null;
  userId?: string;
};

function tailOf(raw?: string | null): string {
  return (raw ?? "").replace(/\D/g, "").slice(-8);
}

function blendHits(
  rows: PublicPerson[],
  known?: { name: string; tel?: string; photo?: string | null }[],
): PublicPerson[] {
  const extra = [...(known ?? []), ...loadRecents()];
  return rows.map((r) => {
    const t = tailOf(r.phone);
    const local = extra.find(
      (k) => (t && tailOf(k.tel) === t) || k.name.trim().toLowerCase() === r.displayName.trim().toLowerCase(),
    );
    if (!local) return r;
    return {
      ...r,
      photo: r.photo || local.photo || null,
      displayName: r.displayName && r.displayName !== r.phone ? r.displayName : local.name || r.displayName,
    };
  });
}

export function SendSheet({
  open,
  myName,
  myPhone,
  myPhoto,
  mySent,
  people,
  known,
  target,
  superCount = 0,
  onClose,
  onSent,
}: {
  open: boolean;
  myName: string;
  myPhone: string;
  myPhoto?: string | null;
  signedIn?: boolean;
  mySent: number;
  people: PublicPerson[];
  known?: { name: string; tel?: string; photo?: string | null }[];
  target?: SendTarget | null;
  superCount?: number;
  onClose: () => void;
  onSent: (sent: SentPayload) => void;
}) {
  const [query, setQuery] = useState("");
  const [tel, setTel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<PublicPerson[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<KissGroup[]>(() => loadGroups());
  const [inviteText, setInviteText] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isSuper, setIsSuper] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<string>(() => rankAt(mySent).skin);
  const [kissCount, setKissCount] = useState<number>(1);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [mode, setMode] = useState<"phone" | "social" | "stranger">("phone");
  const [socialPlatform, setSocialPlatform] = useState<"instagram" | "tiktok" | "x" | "telegram" | "linkedin">("instagram");
  const [socialHandle, setSocialHandle] = useState("");
  const [socialResult, setSocialResult] = useState<{
    claimUrl: string;
    shareText: string;
    isClaimed: boolean;
    recipientName: string;
    handle?: string;
  } | null>(null);
  const picker = canPickContacts();
  useKeyboardInset(open);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTel("");
      setError(null);
      setHits([]);
      setIsSuper(false);
      return;
    }
    setQuery(target?.name ?? "");
    setTel(target?.tel ?? "");
    setError(null);
    setHits(people);
    void searchDirectory({ data: { q: target?.name || target?.tel || "", myPhone } })
      .then((rows) => setHits(blendHits(rows, known)))
      .catch(() => setHits(people));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const handle = window.setTimeout(() => {
      void searchDirectory({ data: { q, myPhone } })
        .then((rows) => {
          const local = [...(known ?? []), ...loadRecents()]
            .filter((k) => {
              const n = k.name.toLowerCase();
              const d = (k.tel ?? "").replace(/\D/g, "");
              if (!q) return true;
              return n.includes(q.toLowerCase()) || (q.replace(/\D/g, "").length >= 3 && d.includes(q.replace(/\D/g, "")));
            })
            .map((k) => ({
              userId: `local:${k.tel || k.name}`,
              handle: (k.tel ?? "").slice(-4),
              displayName: k.name,
              avatarHue: 12,
              lastSeen: null,
              phone: k.tel,
              photo: k.photo ?? null,
            }));
          const merged = blendHits([...local, ...rows], known);
          const seen = new Set<string>();
          setHits(
            merged.filter((p) => {
              const key = (p.phone ?? "").slice(-8) || p.displayName.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }),
          );
        })
        .catch(() => undefined);
    }, 90);
    return () => window.clearTimeout(handle);
  }, [query, myPhone, open]);

  useEffect(() => {
    if (!open) return;
    let gone = false;
    void (async () => {
      const card = await buildKissCard(myPhoto ?? null, myName);
      if (gone) return;
      try {
        const { code } = await createShareLink({
          data: { fromName: myName, toPhone: tel, fromPhone: myPhone, card },
        });
        const url = shortCatchUrl(code) ?? `${publicOrigin()}/k/${code}`;
        if (!gone) {
          setInviteUrl(url);
          setInviteText(shareBody(myName, query, url));
        }
      } catch {
        if (!gone) setInviteText(shareBody(myName, query));
      }
    })();
    return () => {
      gone = true;
    };
  }, [open, tel, myName, myPhone, myPhoto, query]);

  if (!open) return null;

  const hasPhone = isValidPhone(tel);
  const mine = myName.trim().toLowerCase();
  const myTail = myPhone.replace(/\D/g, "").slice(-8);
  const seenHits = new Set<string>();
  const shown = hits.filter((p) => {
    const n = (p.displayName || "").trim().toLowerCase();
    if (p.phone && myTail && p.phone.replace(/\D/g, "").slice(-8) === myTail) return false;
    if (n === "you" || n === "someone" || n === mine) return false;
    const key = (p.phone ?? "").replace(/\D/g, "").slice(-8) || n;
    if (seenHits.has(key)) return false;
    seenHits.add(key);
    return true;
  }).map((p) => (p.photo && myPhoto && p.photo === myPhoto ? { ...p, photo: null } : p));

  function finishInApp(toName: string, userId?: string, count = kissCount, phone?: string) {
    const targetTel = phone || tel;
    if (targetTel) markPhoneAsKnown(targetTel);
    rememberContact({ name: toName, tel: targetTel });
    onSent({ name: toName, status: "waiting", tel: targetTel, userId, count });
    onClose();
  }

  /** Send to each number in turn; returns how many kisses Neon actually saved. */
  async function kissMany(phones: string[]): Promise<number> {
    let saved = 0;
    const kind = isSuper ? "super" : selectedSkin || rankAt(mySent).skin;
    for (const toPhone of phones) {
      try {
        await sendPhoneKiss({
          data: { fromPhone: myPhone, fromName: myName, toPhone, count: kissCount, kind },
        });
        saved += kissCount;
      } catch {
        /* not on KISS — skip, but do not count it */
      }
    }
    return saved;
  }

  function kissPerson(person: PublicPerson, count = kissCount) {
    const toPhone = person.phone || tel;
    if (!isPhoneIdentity(myPhone)) {
      setError("Add your phone first");
      return;
    }
    if (!toPhone) {
      setError("Need their number");
      return;
    }
    setBusy(true);
    const kind = isSuper ? "super" : selectedSkin || rankAt(mySent).skin;
    void sendPhoneKiss({
      data: {
        fromPhone: myPhone,
        fromName: myName,
        toPhone,
        count,
        kind,
      },
    })
      .then((res) => {
        if (isSuper) void consumeSuperKiss({ data: myPhone }).catch(() => undefined);
        finishInApp(res.toName || person.displayName, person.userId, count, toPhone);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Missed"))
      .finally(() => setBusy(false));
  }

  function getEffectiveUrl() {
    return inviteUrl || publicCatchUrl(myName, tel) || publicOrigin();
  }

  function handleWhatsApp(customPhone?: string) {
    const destination = customPhone || tel;
    markInvited();
    const url = getEffectiveUrl();
    openWhatsApp(destination, `Come get a kiss from me on KISS 💋\n${url}`);
  }

  function handleSms(customPhone?: string) {
    const destination = customPhone || tel;
    markInvited();
    const url = getEffectiveUrl();
    window.location.href = smsHref(destination, `Come get a kiss from me on KISS 💋\n${url}`);
  }

  async function handleShare() {
    markInvited();
    const url = getEffectiveUrl();
    const result = await nativeShareOrCopy({
      title: "KISS",
      text: "Come get a kiss from me 💋",
      url,
    });
    if (result === "copied") {
      toast.success("Kiss link copied!");
    } else if (result === "shared") {
      toast.success("Shared successfully!");
    }
  }

  async function handleSendSocial() {
    if (!socialHandle.trim()) {
      setError("Please enter a username or handle");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const kind = isSuper ? "super" : selectedSkin || rankAt(mySent).skin;
      const res = await sendSocialKiss({
        data: {
          fromPhone: myPhone,
          fromName: myName,
          platform: socialPlatform,
          handle: socialHandle,
          count: kissCount,
          kind,
        },
      });
      if (isSuper) void consumeSuperKiss({ data: myPhone }).catch(() => undefined);
      setSocialResult(res);
      toast.success(`Kiss ready for ${res.recipientName}! 💋`);
      onSent({
        name: res.recipientName,
        status: res.isClaimed ? "waiting" : "invited",
        count: kissCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send social kiss");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendStranger() {
    setBusy(true);
    setError(null);
    try {
      const kind = isSuper ? "super" : selectedSkin || rankAt(mySent).skin;
      const res = await sendStrangerKiss({
        data: {
          fromPhone: myPhone,
          fromName: myName,
          count: kissCount,
          kind,
        },
      });
      if (isSuper) void consumeSuperKiss({ data: myPhone }).catch(() => undefined);
      toast.success(`Blown into the universe to ${res.toName}! 💋✨`);
      onSent({
        name: res.toName,
        status: "waiting",
        count: kissCount,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send stranger kiss");
    } finally {
      setBusy(false);
    }
  }

  function onPick() {
    setError(null);
    setContactPickerOpen(true);
  }

  function handleContactChosen(contact: { name: string; tel: string; photo?: string | null }) {
    setQuery(contact.name);
    setTel(contact.tel);
    void searchDirectory({ data: { q: contact.name || contact.tel, myPhone } }).then((rows) => {
      const match = rows.find(
        (r) =>
          r.phone &&
          contact.tel &&
          r.phone.replace(/\D/g, "").slice(-8) === contact.tel.replace(/\D/g, "").slice(-8),
      );
      if (match) {
        setHits([
          contact.photo ? { ...match, photo: contact.photo, displayName: match.displayName || contact.name } : match,
          ...rows.filter((r) => r !== match),
        ]);
      } else {
        setHits(rows);
      }
    });
  }

  function markInvited() {
    rememberContact({ name: query.trim() || "them", tel });
    onSent({ name: query.trim() || "them", status: "invited", tel });
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Send a kiss"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <p className="font-display text-xl">Send a Kiss</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        {/* Quick Native Actions: Contacts, WhatsApp, SMS, Share */}
        <div className="quick-actions-bar">
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => void onPick()}
            title="Pick from contacts"
          >
            <Users size={16} />
            <span>Contacts</span>
          </button>
          <button
            type="button"
            className="quick-action-btn is-wa"
            onClick={() => handleWhatsApp()}
            title="Send via WhatsApp"
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            className="quick-action-btn is-sms"
            onClick={() => handleSms()}
            title="Send via SMS"
          >
            <Smartphone size={16} />
            <span>SMS</span>
          </button>
          <button
            type="button"
            className="quick-action-btn is-share"
            onClick={() => void handleShare()}
            title="Share kiss link"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>

        {/* Mode Selector: Direct / Social Handle / Stranger */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl my-2">
          <button
            type="button"
            onClick={() => { setMode("phone"); setSocialResult(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "phone"
                ? "bg-rose-500 text-white shadow shadow-rose-500/25"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Users size={13} />
            <span>Contacts</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode("social"); setSocialResult(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "social"
                ? "bg-rose-500 text-white shadow shadow-rose-500/25"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <AtSign size={13} />
            <span>Social @</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode("stranger"); setSocialResult(null); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "stranger"
                ? "bg-rose-500 text-white shadow shadow-rose-500/25"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Globe size={13} />
            <span>Stranger 🎲</span>
          </button>
        </div>

        {/* Kiss Type: Regular vs Super */}
        <div className="kiss-type">
          <button type="button" className={isSuper ? "" : "is-on"} onClick={() => setIsSuper(false)}>
            <span className="kiss-type-dot" /> Regular kiss
          </button>
          <button
            type="button"
            className={isSuper ? "is-on" : ""}
            disabled={superCount <= 0}
            onClick={() => setIsSuper(true)}
          >
            <span className="kiss-type-dot" /> Super kiss {superCount > 0 ? `· ${superCount}` : ""}
          </button>
        </div>

        {/* Kiss Style / Skin Selector */}
        {!isSuper ? (
          <div className="kiss-skins-row">
            {RANKS.slice(0, 8).map((r) => (
              <button
                key={r.skin}
                type="button"
                className={`kiss-skin-pill ${selectedSkin === r.skin ? "is-on" : ""}`}
                onClick={() => setSelectedSkin(r.skin)}
              >
                <KissSkin skin={r.skin} className="kiss-skin-mini" />
                <span>{r.name}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Kiss Count Multipliers */}
        <div className="kiss-count-row">
          <span className="kiss-count-label">Shower with:</span>
          {[1, 5, 10, 69].map((c) => (
            <button
              key={c}
              type="button"
              className={`kiss-count-chip ${kissCount === c ? "is-on" : ""}`}
              onClick={() => setKissCount(c)}
            >
              ×{c}
            </button>
          ))}
        </div>

        {mode === "social" ? (
          <div className="flex flex-col gap-3 mt-3">
            {/* Social Platform Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "instagram", name: "Instagram", icon: "📸" },
                { id: "tiktok", name: "TikTok", icon: "🎵" },
                { id: "x", name: "X", icon: "𝕏" },
                { id: "telegram", name: "Telegram", icon: "✈️" },
                { id: "linkedin", name: "LinkedIn", icon: "💼" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSocialPlatform(p.id as any);
                    setSocialResult(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                    socialPlatform === p.id
                      ? "bg-rose-500 text-white shadow shadow-rose-500/25"
                      : "bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Handle Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400 font-mono text-base font-bold">@</span>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="username"
                value={socialHandle}
                onChange={(e) => {
                  setSocialHandle(e.target.value.replace(/^@/, ""));
                  setSocialResult(null);
                  setError(null);
                }}
                className="w-full h-12 pl-9 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {socialResult ? (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col gap-2.5 animate-in fade-in">
                <p className="text-xs text-rose-300 font-medium">
                  {socialResult.isClaimed
                    ? `Kiss delivered directly to ${socialResult.recipientName}!`
                    : `Kiss reserved for @${socialResult.handle} on ${socialPlatform.toUpperCase()}! Share the link so they can catch it:`}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="h-10 rounded-xl bg-[#25d366] hover:bg-[#22c35e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
                    onClick={() => openWhatsApp("", socialResult.shareText)}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10"
                    onClick={() => {
                      void nativeShareOrCopy({
                        title: "SendKiss",
                        text: socialResult.shareText,
                        url: socialResult.claimUrl,
                      });
                      toast.success("Copied DM link!");
                    }}
                  >
                    <Copy size={15} />
                    <span>Copy DM / Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                disabled={busy || !socialHandle.trim()}
                onClick={() => void handleSendSocial()}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 font-display text-sm tracking-wider uppercase shadow-lg shadow-rose-500/25 text-white"
              >
                {busy ? "Sending…" : `Blow Kiss to @${socialHandle.trim() || "handle"} 💋`}
              </Button>
            )}
          </div>
        ) : mode === "stranger" ? (
          <div className="flex flex-col items-center text-center p-4 my-2 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_20px_rgba(255,45,85,0.25)]">
              <Globe size={28} className="animate-pulse" />
            </div>
            <h3 className="font-display text-base uppercase tracking-wider text-white mb-1">
              Kiss a Stranger
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-4 leading-relaxed">
              Send a surprise mystery kiss into the universe to a random person in the world! They can blow one back or just enjoy the love.
            </p>
            <Button
              size="lg"
              disabled={busy}
              onClick={() => void handleSendStranger()}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 font-display text-sm tracking-wider uppercase shadow-lg shadow-rose-500/25 text-white"
            >
              {busy ? "Sending into the Universe…" : "Send to the Universe 🌍💋"}
            </Button>
          </div>
        ) : (
          <>
            <Input
              className="mt-2"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setError(null);
                if (isValidPhone(v)) setTel(v);
              }}
              placeholder="Name or phone — type to find"
              autoComplete="off"
              autoCorrect="off"
            />

            {hasPhone && query !== tel ? (
              <Input
                className="mt-2"
                value={tel}
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                onChange={(e) => setTel(e.target.value)}
                placeholder="Recipient Phone"
              />
            ) : null}

            {groups.length > 0 ? (
              <ul className="group-row mt-2">
                {groups.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="group-chip"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        setError(null);
                        void (async () => {
                          const saved = await kissMany(
                            g.members.map((m) => m.tel).filter((t): t is string => Boolean(t)),
                          );
                          if (saved === 0) {
                            setError("Nobody in that group is on SendKiss yet");
                            return;
                          }
                          onSent({ name: g.name, status: "waiting", count: saved });
                          onClose();
                        })().finally(() => setBusy(false));
                      }}
                    >
                      {g.name} · {g.members.length}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {shown.length > 0 ? (
              <ul className="hit-list mt-2">
                {shown.map((hit) => (
                  <li key={hit.userId} className="hit">
                    <button
                      type="button"
                      className={`hit-check ${picked.has(hit.userId) ? "is-on" : ""}`}
                      onClick={() => {
                        setPicked((prev) => {
                          const next = new Set(prev);
                          if (next.has(hit.userId)) next.delete(hit.userId);
                          else next.add(hit.userId);
                          return next;
                        });
                      }}
                      aria-label="Select for group"
                    />
                    <Face name={hit.displayName} photo={hit.photo} className="hit-face" />
                    <span className="hit-copy">
                      <span className="hit-name">{hit.displayName}</span>
                      <span className="hit-meta">
                        {hit.phone ? "on SendKiss" : "saved"}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hit.phone ? (
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-white/10 text-[#25d366]"
                          onClick={() => handleWhatsApp(hit.phone || undefined)}
                          title="Send on WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                      ) : null}
                      <Button
                        size="sm"
                        className="rounded-lg font-display"
                        disabled={busy}
                        onClick={() => kissPerson(hit, kissCount)}
                      >
                        {busy ? "…" : kissCount > 1 ? `Kiss ×${kissCount}` : "Kiss"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">
                {query.trim() ? "Not on SendKiss yet. Use WhatsApp or SMS below to invite them!" : "Type a name or phone number, or pick from Contacts above."}
              </p>
            )}

            {picked.size >= 2 ? (
              <div className="group-actions">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    const members = shown.filter((h) => picked.has(h.userId));
                    setBusy(true);
                    setError(null);
                    void (async () => {
                      const saved = await kissMany(
                        members.map((m) => m.phone).filter((p): p is string => Boolean(p)),
                      );
                      if (saved === 0) {
                        setError("None of them are on SendKiss yet");
                        return;
                      }
                      onSent({ name: `${saved} people`, status: "waiting", count: saved });
                      onClose();
                    })().finally(() => setBusy(false));
                  }}
                >
                  Kiss {picked.size} ×{kissCount}
                </Button>
                <button
                  type="button"
                  className="invite-toggle"
                  onClick={() => {
                    const members = shown
                      .filter((h) => picked.has(h.userId))
                      .map((h) => ({ name: h.displayName, tel: h.phone ?? undefined, userId: h.userId, photo: h.photo }));
                    const name = members.map((m) => m.name.split(" ")[0]).slice(0, 3).join(" · ");
                    setGroups(upsertGroup({ id: `g-${Date.now()}`, name: name || "Group", members }));
                    setPicked(new Set());
                  }}
                >
                  Save group
                </button>
              </div>
            ) : null}

            {/* Direct Send / Invite Bar for typed phone or non-app contacts */}
            {hasPhone ? (
              <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Invite to SendKiss</span>
                  <span className="font-mono text-white/70">{tel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    className="h-11 rounded-xl bg-[#25d366] hover:bg-[#22c35e] text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#25d366]/20 transition-all active:scale-95"
                    onClick={() => handleWhatsApp(tel)}
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </button>
                  <a
                    className="h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all active:scale-95"
                    href={smsHref(tel, `Come get a kiss from me on SendKiss 💋\n${getEffectiveUrl()}`)}
                    onClick={() => markInvited()}
                  >
                    <Smartphone size={16} />
                    <span>SMS</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void nativeShareOrCopy({
                      title: "SendKiss",
                      text: `Come get a kiss from me on SendKiss 💋\n${getEffectiveUrl()}`,
                      url: getEffectiveUrl(),
                    });
                    toast.success("Link copied!");
                  }}
                  className="w-full py-2 text-[11px] text-neutral-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <Share2 size={12} />
                  <span>Share / Copy invite link</span>
                </button>
              </div>
            ) : null}
          </>
        )}

        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}

        <ContactPickerSheet
          open={contactPickerOpen}
          myPhone={myPhone}
          myName={myName}
          onClose={() => setContactPickerOpen(false)}
          onSelect={handleContactChosen}
        />
      </div>
    </div>
  );
}
