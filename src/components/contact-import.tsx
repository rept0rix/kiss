import { useEffect, useRef, useState } from "react";
import { canPickContacts, pickFromPhone, type PhoneContact } from "@/lib/contacts";
import { searchDirectory, sendPhoneKiss } from "@/lib/kisses/server";
import { rankAt } from "@/lib/kisses/ranks";
import { Button } from "./ui/button";
import { Face } from "./face";
import type { PublicPerson } from "@/lib/kisses/types";

export function ContactImport({
  open,
  myPhone,
  myName,
  mySent,
  onClose,
  onImported,
}: {
  open: boolean;
  myPhone: string;
  myName: string;
  mySent: number;
  onClose: () => void;
  onImported?: (contacts: PhoneContact[]) => void;
}) {
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [matched, setMatched] = useState<PublicPerson[]>([]);
  const [unmatched, setUnmatched] = useState<PhoneContact[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setContacts([]);
      setMatched([]);
      setUnmatched([]);
      setMessage(null);
    }
  }, [open]);

  if (!open) return null;

  function parseText(text: string): PhoneContact[] {
    const out: PhoneContact[] = [];
    if (/BEGIN:VCARD/i.test(text)) {
      for (const card of text.split(/BEGIN:VCARD/i).slice(1)) {
        const name = /^FN[^:]*:(.+)$/im.exec(card)?.[1]?.trim() ?? "";
        const tel = /^TEL[^:]*:(.+)$/im.exec(card)?.[1]?.trim() ?? "";
        if (tel) out.push({ name: name || tel, tel } as PhoneContact);
      }
      return out;
    }
    for (const line of text.split(/\n/)) {
      const digits = line.replace(/\D/g, "");
      if (digits.length < 7) continue;
      const tel = /\+?[\d][\d\s().-]{5,}/.exec(line)?.[0]?.trim() ?? digits;
      const name = line.replace(tel, "").replace(/[,;:\t]+/g, " ").trim();
      out.push({ name: name || tel, tel } as PhoneContact);
    }
    return out;
  }

  async function doImport(given?: PhoneContact[]) {
    setBusy(true);
    setMessage(null);
    try {
      const picked = given ?? (await pickFromPhone());
      if (picked.length === 0) {
        setMessage("No contacts picked or contacts not available");
        return;
      }
      setContacts(picked);
      // Match against the directory
      const allHits: PublicPerson[] = [];
      for (const c of picked) {
        const rows = await searchDirectory({ data: { q: c.tel || c.name, myPhone } }).catch(() => []);
        if (rows.length > 0) {
          allHits.push(rows[0]!);
        }
      }
      // Deduplicate by phone tail
      const seen = new Set<string>();
      const matchedHits = allHits.filter((p) => {
        const key = (p.phone ?? "").replace(/\D/g, "").slice(-8) || p.displayName.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setMatched(matchedHits);
      const matchedTails = new Set(matchedHits.map((p) => (p.phone ?? "").replace(/\D/g, "").slice(-8)));
      setUnmatched(picked.filter((c) => !matchedTails.has(c.tel.replace(/\D/g, "").slice(-8))));
      if (onImported) onImported(picked);
    } finally {
      setBusy(false);
    }
  }

  async function kissMatched(person: PublicPerson) {
    setBusy(true);
    try {
      await sendPhoneKiss({
        data: {
          fromPhone: myPhone,
          fromName: myName,
          toPhone: person.phone ?? "",
          count: 1,
          kind: rankAt(mySent).skin,
        },
      });
      setMessage(`Kissed ${person.displayName}!`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet sheet-tall" role="dialog" aria-label="Import contacts" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="font-display text-xl">Find Friends</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted mb-4">
              Import your contacts to find who's already on KISS.
            </p>
            {canPickContacts() ? (
              <Button size="lg" className="w-full" disabled={busy} onClick={() => void doImport()}>
                {busy ? "Importing…" : "Import Contacts"}
              </Button>
            ) : (
              <>
                <textarea
                  className="paste-box"
                  placeholder={"Paste numbers, one per line\nDana, +66 98 151 9523"}
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                />
                <Button
                  size="lg"
                  className="mt-2 w-full"
                  disabled={busy || parseText(pasted).length === 0}
                  onClick={() => void doImport(parseText(pasted))}
                >
                  {busy ? "Searching…" : "Find friends"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".vcf,.csv,.txt,text/vcard,text/plain,text/csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void f.text().then((t) => setPasted(t));
                  }}
                />
                <button type="button" className="mt-2 text-xs text-muted underline" onClick={() => fileRef.current?.click()}>
                  or upload a .vcf / .csv contacts file
                </button>
              </>
            )}
          </div>
        ) : null}

        {matched.length > 0 ? (
          <div className="mt-3">
            <p className="connect-label">On KISS ({matched.length})</p>
            <ul className="hit-list mt-2">
              {matched.map((p) => (
                <li key={p.userId} className="hit">
                  <Face name={p.displayName} photo={p.photo} className="hit-face" />
                  <span className="hit-copy">
                    <span className="hit-name">{p.displayName}</span>
                    <span className="hit-meta">on KISS</span>
                  </span>
                  <Button
                    size="sm"
                    className="rounded-lg font-display"
                    disabled={busy}
                    onClick={() => void kissMatched(p)}
                  >
                    Kiss
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {unmatched.length > 0 ? (
          <div className="mt-3">
            <p className="connect-label">Invite ({unmatched.length})</p>
            <ul className="hit-list mt-2">
              {unmatched.slice(0, 20).map((c) => (
                <li key={c.tel || c.name} className="hit">
                  <Face name={c.name} photo={c.photo} className="hit-face" />
                  <span className="hit-copy">
                    <span className="hit-name">{c.name}</span>
                    <span className="hit-meta">Not on KISS</span>
                  </span>
                  <a
                    className="invite-toggle"
                    href={`sms:${c.tel}?body=${encodeURIComponent("Come get a kiss from me on KISS")}`}
                  >
                    Invite
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {message ? (
          <p className="mt-3 text-center text-sm text-muted">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
