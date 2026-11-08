import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkContactsPermission,
  fetchAllPhoneContacts,
  formatPhone,
  isNativeApp,
  loadCachedContacts,
  loadRecents,
  markPhoneAsKnown,
  nameHue,
  openContactsSettings,
  openWhatsApp,
  parseContactsFile,
  pickFromPhone,
  requestContactsPermission,
  saveCachedContacts,
  smsHref,
  type ContactPermissionStatus,
  type PhoneContact,
} from "@/lib/contacts";
import { batchCheckContacts, searchDirectory, type MatchedContact } from "@/lib/kisses/server";
import { publicCatchUrl } from "@/lib/share";
import { FolderUp, MessageCircle, Search, ShieldAlert, Sparkles, Smartphone, Users, X, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

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
  const isNative = isNativeApp();
  const [permission, setPermission] = useState<ContactPermissionStatus>("prompt");
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [appMatches, setAppMatches] = useState<Map<string, MatchedContact>>(new Map());
  const [loading, setLoading] = useState(false);
  const [checkingApp, setCheckingApp] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "onApp" | "invite">("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [directoryResults, setDirectoryResults] = useState<PhoneContact[]>([]);
  const [searchingDirectory, setSearchingDirectory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      setDirectoryResults([]);
      return;
    }
    void init();
  }, [open]);

  // When query changes, also search directory if query is entered and contacts list is empty or sparse
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setDirectoryResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchingDirectory(true);
      void searchDirectory({ data: { q, myPhone } })
        .then((rows) => {
          const formatted: PhoneContact[] = rows.map((r) => ({
            name: r.displayName || "Someone",
            tel: r.phone || "",
            photo: r.photo || null,
          }));
          setDirectoryResults(formatted);
        })
        .catch(() => setDirectoryResults([]))
        .finally(() => setSearchingDirectory(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, myPhone]);

  function checkAppMatches(list: PhoneContact[]) {
    if (!list.length) return;
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

  async function init() {
    setLoading(true);
    setError(null);

    // 1. Immediately populate from local cache and recent contacts so user never sees a dead blank screen
    const cached = loadCachedContacts();
    const recents = loadRecents();
    const initialMap = new Map<string, PhoneContact>();
    for (const c of [...cached, ...recents]) {
      const key = (c.tel || "").replace(/\D/g, "").slice(-8) || c.name.toLowerCase();
      if (key && !initialMap.has(key)) initialMap.set(key, c);
    }
    const initialList = Array.from(initialMap.values());
    if (initialList.length > 0) {
      setContacts(initialList);
      checkAppMatches(initialList);
    }

    try {
      if (isNative) {
        const status = await checkContactsPermission();
        setPermission(status);
        if (status === "granted") {
          await loadContacts();
        }
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
      if (list.length > 0) {
        setContacts(list);
        checkAppMatches(list);
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
        setContacts((prev) => [picked[0], ...prev.filter((p) => p.tel !== picked[0].tel)]);
        onSelect(picked[0]);
        onClose();
      } else if (!isNative) {
        // If web and picker returned nothing, offer VCF file picker
        fileInputRef.current?.click();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "System picker failed");
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseContactsFile(text);
      if (parsed.length > 0) {
        saveCachedContacts(parsed);
        for (const c of parsed) {
          if (c.tel) markPhoneAsKnown(c.tel);
        }
        setContacts((prev) => {
          const map = new Map<string, PhoneContact>();
          for (const c of [...parsed, ...prev]) {
            const key = (c.tel || "").replace(/\D/g, "").slice(-8) || c.name.toLowerCase();
            if (key) map.set(key, c);
          }
          return Array.from(map.values());
        });
        toast.success(`Loaded ${parsed.length} contacts!`);
        checkAppMatches(parsed);
      } else {
        toast.error("No valid contacts found in file.");
      }
      setLoading(false);
    };
    reader.onerror = () => {
      toast.error("Error reading file");
      setLoading(false);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
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

    return {
      onAppContacts: onApp,
      inviteContacts: toInvite,
      totalOnApp: onApp.length,
    };
  }, [contacts, appMatches]);

  const filtered = useMemo(() => {
    let source = contacts;
    if (activeTab === "onApp") source = onAppContacts;
    if (activeTab === "invite") source = inviteContacts;

    if (!query.trim()) return source;
    const q = query.trim().toLowerCase();
    const directHits = source.filter(
      (c) => c.name.toLowerCase().includes(q) || c.tel.replace(/\D/g, "").includes(q),
    );

    // If query has results from search directory, append any that aren't already included
    if (directoryResults.length > 0) {
      const existingTails = new Set(directHits.map((c) => c.tel.replace(/\D/g, "").slice(-8)));
      for (const d of directoryResults) {
        const tail = d.tel.replace(/\D/g, "").slice(-8);
        if (tail && !existingTails.has(tail)) {
          if (activeTab !== "invite") {
            directHits.push(d);
          }
        }
      }
    }

    return directHits;
  }, [contacts, onAppContacts, inviteContacts, activeTab, query, directoryResults]);

  function inviteViaWhatsApp(c: PhoneContact) {
    const url = publicCatchUrl(myName, c.tel);
    openWhatsApp(c.tel, `Come get a kiss from me on SendKiss 💋\n${url}`);
  }

  if (!open) return null;

  return (
    <div className="sheet-scrim" onClick={onClose} dir="ltr">
      <div
        className="sheet sheet-tall relative max-h-[88dvh] flex flex-col p-4 bg-[#0e0e12] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl text-white"
        role="dialog"
        aria-label="Contacts"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden VCF file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".vcf,.vcard,.csv,text/vcard,text/csv"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-rose-500" />
            <h2 className="font-display text-base tracking-wide uppercase text-white">Contacts</h2>
            {checkingApp && <span className="text-[10px] text-rose-400 animate-pulse">Syncing…</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 flex items-center gap-1 transition-colors"
              title="Import .VCF file"
            >
              <Plus size={12} />
              <span>.VCF</span>
            </button>
            <button
              type="button"
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-md"
              onClick={onClose}
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>

        {/* Search Bar - ALWAYS visible at top */}
        <div className="flex items-center gap-2 my-3 shrink-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name or phone number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
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
          {isNative ? (
            <button
              type="button"
              onClick={() => void handleNativeSystemPick()}
              className="h-10 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-neutral-300 flex items-center gap-1.5 shrink-0"
              title="Apple System Picker"
            >
              <Smartphone size={14} />
              <span>Picker</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-neutral-300 flex items-center gap-1.5 shrink-0"
              title="Import Contacts"
            >
              <FolderUp size={14} />
              <span>Import</span>
            </button>
          )}
        </div>

        {/* Permission Prompt screen ONLY when permission is undetermined ("prompt") and no search */}
        {permission === "prompt" && contacts.length === 0 && !query.trim() ? (
          <div className="my-auto py-6 px-3 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-[0_0_20px_rgba(255,45,85,0.25)]">
              <Users size={32} />
            </div>

            <h3 className="font-display text-lg mb-2 text-white">Find Your Friends</h3>

            {isNative ? (
              <>
                <p className="text-xs text-neutral-400 mb-6 max-w-xs leading-relaxed">
                  Allow SendKiss to access your contacts to see who is already here and blow them kisses.
                </p>

                <div className="w-full flex flex-col gap-2.5 max-w-xs">
                  <Button
                    size="lg"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium shadow-lg shadow-rose-500/25"
                    onClick={() => void handleRequestPermission()}
                  >
                    {loading ? "Checking…" : "Allow Contacts Access"}
                  </Button>

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
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-400 mb-6 max-w-xs leading-relaxed">
                  Safari on iPhone keeps contacts private from web pages. You can import contacts instantly using a .VCF file, or install the native app for 1-tap sync.
                </p>

                <div className="w-full flex flex-col gap-2.5 max-w-xs">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FolderUp size={16} />
                    <span>Import Contacts File (.vcf)</span>
                  </Button>

                  <p className="text-[11px] text-neutral-500 mt-2">
                    Tip: In iPhone Contacts app, tap any contact or list &gt; "Export / Share" &gt; Save to Files, then pick it here!
                  </p>
                </div>
              </>
            )}

            {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Permission Denied Banner */}
            {permission === "denied" && (
              <div className="mb-2.5 p-2 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between text-xs text-rose-300">
                <span>Contacts access is disabled in Settings</span>
                <button
                  type="button"
                  onClick={() => void openContactsSettings()}
                  className="font-semibold text-white underline ml-2"
                >
                  Settings
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl mb-2.5 shrink-0">
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

            {/* Contacts List */}
            {loading && contacts.length === 0 && !query.trim() ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent mb-3" />
                <p className="text-xs">Loading contacts…</p>
              </div>
            ) : searchingDirectory && filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent mb-3" />
                <p className="text-xs">Searching for "{query}"…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center text-neutral-400">
                <p className="text-sm font-medium text-white mb-1">
                  {query ? `No contacts found for "${query}"` : "No contacts available in this view"}
                </p>
                <p className="text-xs text-neutral-500 mb-4 max-w-xs leading-relaxed">
                  {isNative
                    ? "Tap below to pick directly from your iPhone contacts book, or try another search."
                    : "Try a different name or number, or upload your contacts."}
                </p>
                {isNative ? (
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <Button
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
                      onClick={() => void handleNativeSystemPick()}
                    >
                      <Smartphone size={14} />
                      <span>{query ? `Pick "${query}" from iPhone Contacts` : "Choose from iPhone Contacts"}</span>
                    </Button>
                    {!query && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs flex items-center justify-center gap-1.5"
                        onClick={() => void loadContacts()}
                        disabled={loading}
                      >
                        <span>{loading ? "Syncing…" : "🔄 Sync Phone Contacts"}</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-white/15 text-xs flex items-center gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FolderUp size={14} />
                    <span>Upload .VCF Contacts</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 pr-1">
                {filtered.map((c, i) => {
                  const tail = c.tel.replace(/\D/g, "").slice(-8);
                  const appMatch = appMatches.get(tail);
                  const isFromDir = directoryResults.some((d) => d.tel.replace(/\D/g, "").slice(-8) === tail);
                  const isRegistered = Boolean(appMatch?.isOnSendKiss || isFromDir);
                  const dirContact = isFromDir ? directoryResults.find((d) => d.tel.replace(/\D/g, "").slice(-8) === tail) : null;
                  const displayPhoto = c.photo || appMatch?.photo || dirContact?.photo || null;
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
                        {displayPhoto ? (
                          <img
                            src={displayPhoto}
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
