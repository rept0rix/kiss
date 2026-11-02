import { useEffect, useMemo, useState } from "react";
import {
  checkContactsPermission,
  fetchAllPhoneContacts,
  formatPhone,
  nameHue,
  openContactsSettings,
  openWhatsApp,
  pickFromPhone,
  requestContactsPermission,
  smsHref,
  type ContactPermissionStatus,
  type PhoneContact,
} from "@/lib/contacts";
import { batchCheckContacts, type MatchedContact } from "@/lib/kisses/server";
import { publicCatchUrl } from "@/lib/share";
import { MessageCircle, Search, ShieldAlert, Sparkles, Smartphone, Users, X } from "lucide-react";
import { Button } from "./ui/button";

export function ContactPickerSheet({
  open,
  myPhone,
  myName = "Someone",
  onClose,
  onSelect,
}: {
  open: boolean;
  myPhone?: string;
  myName?: string;
  onClose: () => void;
  onSelect: (contact: PhoneContact) => void;
}) {
  const [permission, setPermission] = useState<ContactPermissionStatus>("prompt");
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [appMatches, setAppMatches] = useState<Map<string, MatchedContact>>(new Map());
  const [loading, setLoading] = useState(false);
  const [checkingApp, setCheckingApp] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "onApp" | "invite">("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      return;
    }
    void init();
  }, [open]);

  async function init() {
    setLoading(true);
    setError(null);
    try {
      const status = await checkContactsPermission();
      setPermission(status);
      if (status === "granted") {
        await loadContacts();
      }
    } catch (err) {
      console.warn("Init contacts error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadContacts() {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAllPhoneContacts();
      setContacts(list);

      // Check which contacts already use SendKiss
      if (list.length > 0) {
        setCheckingApp(true);
        void batchCheckContacts({
          data: {
            phones: list.map((c) => c.tel),
            myPhone,
          },
        })
          .then((matched) => {
            const map = new Map<string, MatchedContact>();
            for (const item of matched) {
              const tail = item.originalPhone.replace(/\D/g, "").slice(-8);
              if (tail) map.set(tail, item);
            }
            setAppMatches(map);
          })
          .catch((err) => {
            console.warn("Batch check error:", err);
          })
          .finally(() => {
            setCheckingApp(false);
          });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPermission() {
    setLoading(true);
    setError(null);
    try {
      const granted = await requestContactsPermission();
      if (granted) {
        setPermission("granted");
        await loadContacts();
      } else {
        const recheck = await checkContactsPermission();
        setPermission(recheck);
        if (recheck === "denied") {
          setError("Contacts permission was denied. You can enable it in device settings.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permission request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleNativeSystemPick() {
    try {
      const picked = await pickFromPhone();
      if (picked.length > 0 && picked[0]) {
        onSelect(picked[0]);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "System picker failed");
    }
  }

  const { onAppContacts, inviteContacts, totalOnApp } = useMemo(() => {
    const onApp: PhoneContact[] = [];
    const toInvite: PhoneContact[] = [];

    for (const c of contacts) {
      const tail = c.tel.replace(/\D/g, "").slice(-8);
      const isRegistered = appMatches.get(tail)?.isOnSendKiss;
      if (isRegistered) {
        onApp.push(c);
      } else {
        toInvite.push(c);
      }
    }

    return { onAppContacts: onApp, inviteContacts: toInvite, totalOnApp: onApp.length };
  }, [contacts, appMatches]);

  const filtered = useMemo(() => {
    let source = contacts;
    if (activeTab === "onApp") source = onAppContacts;
    else if (activeTab === "invite") source = inviteContacts;

    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return source;
    return source.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const cDigits = c.tel.replace(/\D/g, "");
      const matchTel = digits.length > 0 && cDigits.includes(digits);
      return matchName || matchTel;
    });
  }, [contacts, onAppContacts, inviteContacts, activeTab, query]);

  if (!open) return null;

  function inviteViaWhatsApp(c: PhoneContact) {
    const url = publicCatchUrl(myName, c.tel);
    openWhatsApp(c.tel, `Come get a kiss from me on SendKiss 💋\n${url}`);
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        className="sheet sheet-tall flex flex-col"
        role="dialog"
        aria-label="Select Contact"
        style={{ maxHeight: "min(40rem, 90dvh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sheet-head pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-[#FF2E63]" />
            <p className="font-display text-xl tracking-tight">Select Contact</p>
          </div>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Content depending on permission */}
        {permission !== "granted" && contacts.length === 0 ? (
          <div className="my-auto py-6 px-3 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FF2E63]/10 flex items-center justify-center text-[#FF2E63] mb-4">
              {permission === "denied" ? <ShieldAlert size={32} /> : <Users size={32} />}
            </div>
            <h3 className="font-display text-lg mb-2 text-white">
              {permission === "denied" ? "Permission Needed" : "Find Your Friends"}
            </h3>
            <p className="text-sm text-neutral-400 mb-6 max-w-xs leading-relaxed">
              {permission === "denied"
                ? "Contacts access is disabled. Enable it in your phone settings or use the system picker directly."
                : "Allow SendKiss to access your contacts to see who is already here and blow them kisses. Your contacts remain safe and private."}
            </p>

            <div className="w-full flex flex-col gap-2.5 max-w-xs">
              {permission === "denied" ? (
                <Button
                  size="lg"
                  className="w-full bg-[#FF2E63] hover:bg-[#FF2E63]/90 text-white font-medium"
                  onClick={() => void openContactsSettings()}
                >
                  Open Phone Settings
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={loading}
                  className="w-full bg-[#FF2E63] hover:bg-[#FF2E63]/90 text-white font-medium shadow-lg shadow-[#FF2E63]/25"
                  onClick={() => void handleRequestPermission()}
                >
                  {loading ? "Checking…" : "Allow Contacts Access"}
                </Button>
              )}

              <Button
                size="lg"
                variant="secondary"
                className="w-full border-white/15 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2"
                onClick={() => void handleNativeSystemPick()}
              >
                <Smartphone size={16} />
                <span>Open System Picker</span>
              </Button>
            </div>
            {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl mb-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "all" ? "bg-white/15 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                All ({contacts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("onApp")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "onApp"
                    ? "bg-rose-500 text-white shadow shadow-rose-500/30"
                    : "text-rose-400 hover:text-rose-300"
                }`}
              >
                <Sparkles size={12} />
                <span>On SendKiss ({totalOnApp})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("invite")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "invite" ? "bg-white/15 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                Invite ({inviteContacts.length})
              </button>
            </div>

            {/* Search Bar & Quick System Picker */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search name or number…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF2E63]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleNativeSystemPick()}
                className="h-10 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-neutral-300 flex items-center gap-1.5 shrink-0"
                title="System Picker"
              >
                <Smartphone size={14} />
                <span>Picker</span>
              </button>
            </div>

            {/* Contacts List */}
            {loading && contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF2E63] border-t-transparent mb-3" />
                <p className="text-xs">Loading contacts…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-neutral-400">
                <p className="text-sm font-medium text-white mb-1">No contacts found</p>
                <p className="text-xs text-neutral-500 mb-4">
                  {query ? "Try a different name or number" : "No contacts available in this view"}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-white/15 text-xs"
                  onClick={() => void handleNativeSystemPick()}
                >
                  Try System Picker
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 pr-1">
                {filtered.map((c, i) => {
                  const tail = c.tel.replace(/\D/g, "").slice(-8);
                  const appMatch = appMatches.get(tail);
                  const isRegistered = Boolean(appMatch?.isOnSendKiss);
                  const hue = nameHue(c.name);
                  const initial = (c.name.trim()[0] || "?").toUpperCase();
                  const formatted = formatPhone(c.tel).display;

                  return (
                    <div
                      key={`${c.tel}-${i}`}
                      className={`w-full py-2.5 px-2 flex items-center justify-between gap-3 rounded-xl transition-colors ${
                        isRegistered ? "bg-rose-500/10 border border-rose-500/20" : "hover:bg-white/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(c);
                          onClose();
                        }}
                        className="flex-1 min-w-0 flex items-center gap-3 text-left"
                      >
                        {/* Avatar */}
                        {c.photo || appMatch?.photo ? (
                          <img
                            src={c.photo || appMatch?.photo || ""}
                            alt=""
                            className="size-10 rounded-full object-cover shrink-0 border border-white/10"
                          />
                        ) : (
                          <div
                            className="size-10 rounded-full flex items-center justify-center font-display text-sm text-white shrink-0 border border-white/10"
                            style={{
                              background: isRegistered
                                ? "linear-gradient(135deg, #e11d2e, #ff2a4d)"
                                : `hsl(${hue} 65% 28%)`,
                            }}
                          >
                            {initial}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-white truncate">{c.name}</p>
                            {isRegistered && (
                              <span className="text-[10px] font-display uppercase tracking-wider text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                                On SendKiss
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 truncate font-mono">{formatted}</p>
                        </div>
                      </button>

                      {/* Action buttons */}
                      {isRegistered ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(c);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-display text-xs tracking-wider uppercase shadow-md shadow-rose-500/30 shrink-0 transition-transform active:scale-95"
                        >
                          Kiss 💋
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => inviteViaWhatsApp(c)}
                            className="p-2 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366]/25 text-[#25d366] transition-colors"
                            title="Invite via WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <a
                            href={smsHref(c.tel, `Come get a kiss from me on SendKiss 💋\n${publicCatchUrl(myName, c.tel)}`)}
                            className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 transition-colors"
                            title="Invite via SMS"
                          >
                            <Smartphone size={15} />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
