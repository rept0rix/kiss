import { useState, useMemo, useRef } from "react";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  type Country,
  validatePhoneForCountry,
} from "@/lib/countries";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { toast } from "sonner";
import { signIn, authEnabled } from "@/lib/auth/client";
import { LipsMark } from "./lips-mark";

interface PhoneGateProps {
  draftPhone?: string;
  onDraftPhone?: (v: string) => void;
  onReady: (phone: string) => void;
  onCancel?: () => void;
}

export function PhoneGate({
  draftPhone = "",
  onDraftPhone,
  onReady,
  onCancel,
}: PhoneGateProps) {
  useKeyboardInset(true);

  // Parse initial phone if provided
  const initialCountry = useMemo(() => {
    if (!draftPhone) return DEFAULT_COUNTRY;
    const clean = draftPhone.replace(/\D/g, "");
    if (clean.startsWith("972") || clean.startsWith("05") || clean.startsWith("5")) {
      return DEFAULT_COUNTRY;
    }
    const found = COUNTRIES.find((c) => clean.startsWith(c.dialCode.replace(/\D/g, "")));
    return found || DEFAULT_COUNTRY;
  }, [draftPhone]);

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [localNumber, setLocalNumber] = useState(() => {
    if (!draftPhone) return "";
    let clean = draftPhone.replace(/\D/g, "");
    const dial = initialCountry.dialCode.replace(/\D/g, "");
    if (clean.startsWith(dial)) {
      clean = clean.slice(dial.length);
      if (initialCountry.code === "IL" && clean.startsWith("5")) {
        clean = `0${clean}`;
      }
    }
    return clean;
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Validate current number
  const validation = useMemo(() => {
    return validatePhoneForCountry(selectedCountry, localNumber);
  }, [selectedCountry, localNumber]);

  // Filter countries for scrollable picker
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c);
    setIsPickerOpen(false);
    setSearchQuery("");
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  const handleConfirm = () => {
    if (!validation.isValid) return;
    onReady(validation.normalizedPhone);
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === "apple") {
      toast.info("Apple Sign-in is available in native iOS app.");
      return;
    }
    try {
      if (authEnabled) {
        await signIn(provider, { callbackURL: "/" });
      } else {
        toast.info("Social login connects via your Google or X account.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in error";
      toast.error(msg);
    }
  };

  return (
    <div className="sheet-scrim flex items-center justify-center p-4" dir="ltr">
      <div
        className="sheet relative max-h-[90dvh] !max-w-md w-full overflow-hidden flex flex-col p-6 rounded-3xl bg-[#0f0f12]/95 border border-white/10 text-white shadow-[0_25px_60px_-15px_rgba(255,45,85,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-label="Enter your phone number"
      >
        {/* Header Close button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {isPickerOpen ? (
          /* Country Picker View */
          <div className="flex flex-col h-full max-h-[70dvh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-display text-lg tracking-wider uppercase text-white">Select Country</span>
              <button
                type="button"
                className="text-xs text-white/60 hover:text-white px-2 py-1 rounded-full bg-white/5"
                onClick={() => setIsPickerOpen(false)}
              >
                Done
              </button>
            </div>

            {/* Search Country Input */}
            <div className="relative my-3">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full bg-white/[0.06] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50"
                autoFocus
              />
            </div>

            {/* Scrollable Countries List */}
            <div className="overflow-y-auto flex-1 divide-y divide-white/5 pr-1">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center justify-between py-3 px-3 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-rose-500/15 text-rose-300"
                          : "hover:bg-white/5 text-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-white">
                            {c.name}
                          </span>
                          <span className="text-xs text-white/40">
                            {c.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-white/70">
                          {c.dialCode}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Phone Input View */
          <div className="flex flex-col items-center text-center">
            {/* Glowing Lip Badge */}
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,45,85,0.25)]">
              <LipsMark className="w-9 h-9 text-rose-500 animate-pulse" />
            </div>

            <h2 className="font-display text-2xl tracking-wider uppercase text-white mb-1.5">
              YOUR NUMBER
            </h2>
            <p className="text-xs text-white/60 mb-6 max-w-xs leading-relaxed">
              Confirm the phone number people already have to blow you kisses.
            </p>

            {/* Input Row: Country Selector + Local Number */}
            <div className="w-full flex items-stretch gap-2.5 mb-3">
              {/* Country Pill */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-2 px-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 rounded-2xl transition-all h-13 flex-shrink-0"
                title="Change country"
              >
                <span className="text-xl leading-none">{selectedCountry.flag}</span>
                <span className="text-sm font-semibold font-mono text-white">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              </button>

              {/* Number Input */}
              <div className="relative flex-1">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={`w-full h-13 bg-white/[0.06] border rounded-2xl px-4 text-base font-mono tracking-wide text-white placeholder-white/30 focus:outline-none transition-all ${
                    validation.isValid
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      : "border-white/10 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/60"
                  }`}
                  placeholder={selectedCountry.placeholder}
                  value={localNumber}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setLocalNumber(raw);
                    onDraftPhone?.(raw);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && validation.isValid) {
                      handleConfirm();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Helper status text */}
            <div className="w-full text-left px-1 min-h-[1.25rem] mb-5 text-xs">
              {localNumber && !validation.isValid ? (
                <span className="text-rose-400">
                  Please enter a valid {selectedCountry.name} phone number
                </span>
              ) : validation.isValid ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Ready: {selectedCountry.dialCode} {validation.formattedDisplay}</span>
                </div>
              ) : (
                <span className="text-white/40">
                  e.g. {selectedCountry.placeholder}
                </span>
              )}
            </div>

            {/* Glowing CTA Button */}
            <button
              type="button"
              className="w-full h-13 rounded-full bg-gradient-to-r from-[#ff2d55] via-[#f43f5e] to-[#fb7185] hover:brightness-110 active:scale-[0.98] transition-all text-white font-display text-sm uppercase tracking-widest font-bold shadow-[0_4px_24px_rgba(255,45,85,0.45)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              disabled={!validation.isValid}
              onClick={handleConfirm}
            >
              <span>ENTER KISS</span>
              <span>💋</span>
            </button>

            {/* Divider */}
            <div className="relative w-full my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative bg-[#0f0f12] px-3 text-[10px] uppercase font-display tracking-widest text-white/40">
                Or connect with
              </div>
            </div>

            {/* Social Sign-in Buttons */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 active:scale-95 transition-all text-white shadow-sm cursor-pointer"
                title="Google"
              >
                <GoogleIcon />
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("apple")}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 active:scale-95 transition-all text-white shadow-sm cursor-pointer"
                title="Apple"
              >
                <AppleIcon />
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("twitter")}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 active:scale-95 transition-all text-white shadow-sm cursor-pointer"
                title="X (Twitter)"
              >
                <XIcon />
              </button>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="mt-5 text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.06-1.87.94-2.96-.92.04-2.02.62-2.67 1.39-.58.67-1.09 1.76-.96 2.82 1.03.08 2.06-.47 2.69-1.25" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
