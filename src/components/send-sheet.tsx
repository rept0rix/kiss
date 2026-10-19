import { useEffect, useState } from "react";
import { MessageCircle, Send, Share2, Smartphone, Users } from "lucide-react";
import { toast } from "sonner";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import {
  canPickContacts,
  isPhoneIdentity,
  isValidPhone,
  loadRecents,
  openWhatsApp,
  pickFromPhone,
  rememberContact,
  smsHref,
} from "@/lib/contacts";
import { loadGroups, upsertGroup, type KissGroup } from "@/lib/groups";
import { RANKS, rankAt } from "@/lib/kisses/ranks";
import { createShareLink, searchDirectory, sendPhoneKiss } from "@/lib/kisses/server";
import { consumeSuperKiss } from "@/lib/store/server";
import type { PublicPerson } from "@/lib/kisses/types";
import { buildKissCard } from "@/lib/kiss-card";
import { nativeShareOrCopy, shareBody, shortCatchUrl } from "@/lib/share";
import { Button } from "./ui/button";
import { Face } from "./face";
import { Input } from "./ui/input";
import { KissSkin } from "./kiss-skin";

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
        const url = shortCatchUrl(code) ?? `${window.location.origin}/k/${code}`;
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
    rememberContact({ name: toName, tel: phone || tel });
    onSent({ name: toName, status: "waiting", tel: phone || tel, userId, count });
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

  function handleWhatsApp(customPhone?: string) {
    const destination = customPhone || tel;
    markInvited();
    openWhatsApp(destination, inviteText || shareBody(myName, query, inviteUrl));
  }

  function handleSms(customPhone?: string) {
    const destination = customPhone || tel;
    markInvited();
    const text = inviteText || shareBody(myName, query, inviteUrl);
    window.location.href = smsHref(destination, text);
  }

  async function handleShare() {
    markInvited();
    const text = inviteText || shareBody(myName, query, inviteUrl);
    const result = await nativeShareOrCopy({
      title: "KISS",
      text,
      url: inviteUrl || window.location.origin,
    });
    if (result === "copied") {
      toast.success("Kiss link copied!");
    } else if (result === "shared") {
      toast.success("Shared successfully!");
    }
  }

  async function onPick() {
    setError(null);
    if (!picker) return;
    try {
      const picked = await pickFromPhone();
      if (picked.length === 0) return;
      const first = picked[0];
      if (first) {
        setQuery(first.name);
        setTel(first.tel);
      }
      const phones = picked.map((c) => c.tel).filter(Boolean);
      void searchDirectory({ data: { q: first?.name || first?.tel || "", myPhone } }).then((rows) => {
        const byTail = new Map(picked.map((c) => [c.tel.replace(/\D/g, "").slice(-8), c] as const));
        setHits(
          rows.map((r) => {
            const local = r.phone ? byTail.get(r.phone.slice(-8)) : undefined;
            return local?.photo ? { ...r, photo: local.photo, displayName: r.displayName || local.name } : r;
          }),
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open contacts");
    }
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
                        setError("Nobody in that group is on KISS yet");
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
                    {hit.phone ? "on KISS" : "saved"}
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
            {query.trim() ? "Not on KISS yet. Use WhatsApp or SMS to send them a kiss!" : "Type a name or phone number."}
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
                    setError("None of them are on KISS yet");
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

        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}

        {/* Direct Send / Invite Bar for typed phone or non-app contacts */}
        {hasPhone ? (
          <div className="sheet-actions mt-3">
            <button
              type="button"
              className="send-wa w-full"
              onClick={() => handleWhatsApp(tel)}
            >
              Send via WhatsApp
            </button>
            <a
              className="send-link mt-2 w-full"
              href={smsHref(tel, inviteText || shareBody(myName, query, inviteUrl))}
              onClick={() => markInvited()}
            >
              Send via SMS
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
