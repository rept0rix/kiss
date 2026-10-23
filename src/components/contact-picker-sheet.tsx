import { useEffect, useMemo, useState } from "react";
import {
  checkContactsPermission,
  fetchAllPhoneContacts,
  formatPhone,
  nameHue,
  openContactsSettings,
  pickFromPhone,
  requestContactsPermission,
  type ContactPermissionStatus,
  type PhoneContact,
} from "@/lib/contacts";
import { Search, ShieldAlert, Sparkles, Smartphone, Users, X } from "lucide-react";
import { Button } from "./ui/button";

export function ContactPickerSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (contact: PhoneContact) => void;
}) {
  const [permission, setPermission] = useState<ContactPermissionStatus>("prompt");
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(false);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return contacts;
    return contacts.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const cDigits = c.tel.replace(/\D/g, "");
      const matchTel = digits.length > 0 && cDigits.includes(digits);
      return matchName || matchTel;
    });
  }, [contacts, query]);

  if (!open) return null;

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        className="sheet sheet-tall flex flex-col"
        role="dialog"
        aria-label="Select Contact"
        style={{ maxHeight: "min(38rem, 88dvh)" }}
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
                : "Allow KISS to access your contacts so you can easily pick friends and blow kisses. Your contacts stay private on your device."}
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
            {/* Search Bar & Quick System Picker */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search by name or number…"
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
                  {query ? "Try a different name or number" : "No contacts available on this device"}
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
                  const hue = nameHue(c.name);
                  const initial = (c.name.trim()[0] || "?").toUpperCase();
                  const formatted = formatPhone(c.tel).display;
                  return (
                    <button
                      key={`${c.tel}-${i}`}
                      type="button"
                      onClick={() => {
                        onSelect(c);
                        onClose();
                      }}
                      className="w-full py-2.5 px-2 flex items-center gap-3 text-left hover:bg-white/5 rounded-xl transition-colors active:scale-[0.99]"
                    >
                      {/* Avatar */}
                      {c.photo ? (
                        <img
                          src={c.photo}
                          alt=""
                          className="size-10 rounded-full object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div
                          className="size-10 rounded-full flex items-center justify-center font-display text-sm text-white shrink-0 border border-white/10"
                          style={{
                            background: `hsl(${hue} 65% 28%)`,
                          }}
                        >
                          {initial}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <p className="text-xs text-neutral-400 truncate font-mono">{formatted}</p>
                      </div>

                      {/* Kiss Badge */}
                      <span className="text-xs text-[#FF2E63] font-display uppercase tracking-wider px-2 py-1 rounded-lg bg-[#FF2E63]/10 shrink-0">
                        Select
                      </span>
                    </button>
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
