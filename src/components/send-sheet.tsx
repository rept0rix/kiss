import { useEffect, useState } from "react";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import {
  canPickContacts,
  isValidPhone,
  loadRecents,
  openWhatsApp,
  pickFromPhone,
  rememberContact,
  smsHref,
} from "@/lib/contacts";
import { loadGroups, upsertGroup, type KissGroup } from "@/lib/groups";
import { rankAt } from "@/lib/kisses/ranks";
import { createShareLink, searchDirectory, sendPhoneKiss } from "@/lib/kisses/server";
import type { PublicPerson } from "@/lib/kisses/types";
import { buildKissCard } from "@/lib/kiss-card";
import { shareBody, shortCatchUrl } from "@/lib/share";
import { Button } from "./ui/button";
import { Face } from "./face";
import { Input } from "./ui/input";

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
  const picker = canPickContacts();
  useKeyboardInset(open);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTel("");
      setError(null);
      setHits([]);
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
        if (!gone) setInviteText(shareBody(myName, query, url));
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
  const onApp = shown.length > 0;

  function finishInApp(toName: string, userId?: string, count = 1, phone?: string) {
    rememberContact({ name: toName, tel: phone || tel });
    onSent({ name: toName, status: "waiting", tel: phone || tel, userId, count });
    onClose();
  }

  function kissPerson(person: PublicPerson, count = 1) {
    const toPhone = person.phone || tel;
    if (!isValidPhone(myPhone)) {
      setError("Add your phone first");
      return;
    }
    if (!toPhone) {
      setError("Need their number");
      return;
    }
    setBusy(true);
    void sendPhoneKiss({
      data: {
        fromPhone: myPhone,
        fromName: myName,
        toPhone,
        count,
        kind: rankAt(mySent).skin,
      },
    })
      .then((res) => finishInApp(res.toName || person.displayName, person.userId, count, toPhone))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Missed"))
      .finally(() => setBusy(false));
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
          <p className="font-display text-xl">Send</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
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
                    void (async () => {
                      for (const m of g.members) {
                        if (!m.tel && !m.userId) continue;
                        try {
                          if (m.tel) {
                            await sendPhoneKiss({
                              data: {
                                fromPhone: myPhone,
                                fromName: myName,
                                toPhone: m.tel,
                                count: 1,
                                kind: rankAt(mySent).skin,
                              },
                            });
                          }
                        } catch {
                          /* skip missing */
                        }
                      }
                      onSent({ name: g.name, status: "waiting", count: g.members.length });
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
                  <span className="hit-meta">{hit.phone ? "on KISS" : "saved"}</span>
                </span>
                <Button
                  size="sm"
                  className="rounded-lg font-display"
                  disabled={busy}
                  onClick={() => kissPerson(hit, 1)}
                >
                  {busy ? "…" : "Kiss"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted">
            {query.trim() ? "Not on KISS yet." : "Name or phone."}
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
                void (async () => {
                  for (const m of members) {
                    if (!m.phone) continue;
                    try {
                      await sendPhoneKiss({
                        data: {
                          fromPhone: myPhone,
                          fromName: myName,
                          toPhone: m.phone,
                          count: 1,
                          kind: rankAt(mySent).skin,
                        },
                      });
                    } catch {
                      /* skip */
                    }
                  }
                  onSent({ name: `${members.length} people`, status: "waiting", count: members.length });
                  onClose();
                })().finally(() => setBusy(false));
              }}
            >
              Kiss {picked.size}
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

        {!onApp ? (
          <>
            {picker ? (
              <button type="button" className="invite-toggle" onClick={() => void onPick()}>
                Contacts
              </button>
            ) : null}
            {hasPhone && query !== tel ? (
              <Input
                className="mt-2"
                value={tel}
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                onChange={(e) => setTel(e.target.value)}
                placeholder="Phone"
              />
            ) : null}
            {!hasPhone ? (
              <Input
                className="mt-2"
                value={tel}
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                onChange={(e) => setTel(e.target.value)}
                placeholder="Phone to invite"
              />
            ) : null}
            <div className="sheet-actions">
              {hasPhone ? (
                <>
                  <button
                    type="button"
                    className="send-wa"
                    onClick={() => {
                      markInvited();
                      openWhatsApp(tel, inviteText);
                    }}
                  >
                    WhatsApp
                  </button>
                  <a
                    className="send-link"
                    href={smsHref(tel, inviteText)}
                    onClick={markInvited}
                  >
                    SMS
                  </a>
                </>
              ) : (
                <span className="send-wa is-off">WhatsApp</span>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
