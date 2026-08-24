import { useEffect, useState } from "react";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import {
  canPickContacts,
  faceTemplate,
  isValidPhone,
  pickFromPhone,
  rememberContact,
  smsHref,
  waHref,
} from "@/lib/contacts";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { isLive } from "@/lib/kisses/online";
import { rankAt } from "@/lib/kisses/ranks";
import { browsePeople, matchPhones, searchPeople, sendKiss } from "@/lib/kisses/server";
import type { PublicPerson } from "@/lib/kisses/types";
import { shareBody } from "@/lib/share";
import { Button } from "./ui/button";
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

export function SendSheet({
  open,
  myName,
  signedIn,
  mySent,
  people,
  target,
  onClose,
  onSent,
}: {
  open: boolean;
  myName: string;
  signedIn: boolean;
  mySent: number;
  people: PublicPerson[];
  target?: SendTarget | null;
  onClose: () => void;
  onSent: (sent: SentPayload) => void;
}) {
  const [query, setQuery] = useState("");
  const [tel, setTel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<PublicPerson[]>([]);
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
    void browsePeople()
      .then((rows) => {
        const mine = myName.trim().toLowerCase();
        setHits(rows.filter((p) => p.displayName.trim().toLowerCase() !== mine));
      })
      .catch(() => setHits(people));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const handle = window.setTimeout(() => {
      if (signedIn) {
        void searchPeople({ data: q })
          .then(setHits)
          .catch(() => undefined);
        return;
      }
      setHits((prev) =>
        q
          ? prev.filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase()))
          : prev,
      );
    }, 160);
    return () => window.clearTimeout(handle);
  }, [query, signedIn, open]);

  if (!open) return null;

  const body = shareBody(myName, query, tel);
  const hasPhone = isValidPhone(tel);
  const shown = hits;

  function finishInApp(toName: string, userId?: string, count = 1) {
    rememberContact({ name: toName, tel });
    onSent({ name: toName, status: "waiting", tel, userId, count });
    onClose();
  }

  function kissPerson(person: PublicPerson, count = 1) {
    if (!signedIn) {
      setError("Sign in to send inside");
      return;
    }
    setBusy(true);
    void sendKiss({ data: { toUserId: person.userId, kind: rankAt(mySent).skin, count } })
      .then(() => finishInApp(person.displayName || person.handle, person.userId, count))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Missed"))
      .finally(() => setBusy(false));
  }

  async function onPick() {
    setError(null);
    if (!picker) return;
    try {
      const picked = await pickFromPhone();
      if (picked.length === 0) return;
      if (signedIn) {
        const matched = await matchPhones({ data: picked.map((c) => c.tel) });
        if (matched.length > 0) {
          setHits(matched);
          return;
        }
      }
      const first = picked[0];
      if (first) {
        setQuery(first.name);
        setTel(first.tel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open contacts");
    }
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
          <p className="font-display text-2xl">Send inside</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <p className="mt-1 text-sm text-muted">People already on KISS. Tap Kiss — no WhatsApp.</p>

        <Input
          className="mt-3"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setError(null);
            if (isValidPhone(v)) setTel(v);
          }}
          placeholder="Search who's here"
          autoComplete="off"
        />

        {!signedIn ? (
          <div className="mt-3 space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                size="lg"
                className="w-full"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
              >
                Sign in with {p.label}
              </Button>
            ))}
          </div>
        ) : null}

        {shown.length > 0 ? (
          <ul className="hit-list mt-3">
            {shown.map((hit) => (
              <li key={hit.userId} className="hit-block">
                <div className="hit">
                  <img src={faceTemplate(hit.displayName)} alt="" className="hit-face" />
                  <span className="hit-copy">
                    <span className="hit-name">
                      {isLive(hit.lastSeen) ? <i className="live-dot" /> : null}
                      {hit.displayName}
                    </span>
                    <span className="hit-meta">{isLive(hit.lastSeen) ? "live now" : "on KISS"}</span>
                  </span>
                </div>
                <Button
                  size="lg"
                  className="mt-1 h-12 w-full rounded-xl font-display text-lg"
                  disabled={busy}
                  onClick={() => kissPerson(hit, 1)}
                >
                  {busy ? "…" : `Kiss ${hit.displayName.split(" ")[0]}`}
                </Button>
                <div className="flood-row">
                  {[7, 21, 69].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="flood-n"
                      disabled={busy}
                      onClick={() => kissPerson(hit, n)}
                    >
                      ×{n}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {query.trim() ? "Nobody here with that name." : "You're first. Invite someone below."}
          </p>
        )}

        {error ? <p className="mt-2 text-sm text-primary">{error}</p> : null}

        <p className="invite-label">Not on KISS yet?</p>
        {picker ? (
          <button type="button" className="invite-toggle" onClick={() => void onPick()}>
            Match contacts
          </button>
        ) : null}
        <Input
          className="mt-2"
          value={tel}
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          onChange={(e) => setTel(e.target.value)}
          placeholder="Their phone to invite"
        />
        <div className="sheet-actions">
          {hasPhone ? (
            <>
              <a
                className="send-wa"
                href={waHref(tel, body)}
                onClick={(e) => {
                  e.preventDefault();
                  rememberContact({ name: query.trim() || "them", tel });
                  onSent({ name: query.trim() || "them", status: "invited", tel });
                  window.location.assign(waHref(tel, body));
                }}
              >
                WhatsApp invite
              </a>
              <a
                className="send-link"
                href={smsHref(tel, body)}
                onClick={() => {
                  rememberContact({ name: query.trim() || "them", tel });
                  onSent({ name: query.trim() || "them", status: "invited", tel });
                }}
              >
                Messages invite
              </a>
            </>
          ) : (
            <>
              <span className="send-wa is-off">WhatsApp invite</span>
              <span className="send-link is-off">Messages invite</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
