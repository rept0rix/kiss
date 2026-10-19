import { useState, useMemo, useEffect, useRef } from "react";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  type Country,
  validatePhoneForCountry,
} from "@/lib/countries";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { signIn, authEnabled } from "@/lib/auth/client";

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
  const [step, setStep] = useState<"phone" | "sms">("phone");
  const [smsCode, setSmsCode] = useState("");
  const [smsError, setSmsError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const smsInputRef = useRef<HTMLInputElement>(null);

  // Validate current number
  const validation = useMemo(() => {
    return validatePhoneForCountry(selectedCountry, localNumber);
  }, [selectedCountry, localNumber]);

  // Resend timer countdown
  useEffect(() => {
    if (step !== "sms" || resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  // Filter countries for scrollable picker
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameHe.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handlePhoneChange = (val: string) => {
    setLocalNumber(val);
    if (onDraftPhone) {
      onDraftPhone(val);
    }
  };

  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c);
    setIsPickerOpen(false);
    setSearchQuery("");
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  const handleSendSms = () => {
    if (!validation.isValid) return;
    setStep("sms");
    setSmsError("");
    setResendCountdown(30);
    setTimeout(() => smsInputRef.current?.focus(), 150);
  };

  const handleResendSms = () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setResendCountdown(30);
      setSmsError("");
    }, 800);
  };

  const handleVerifySms = () => {
    const cleanCode = smsCode.replace(/\D/g, "");
    if (cleanCode.length < 4) {
      setSmsError("נא להזין קוד אימות תקין (6 ספרות)");
      return;
    }

    onReady(validation.normalizedPhone);
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === "apple") {
      toast.info("התחברות באמצעות Apple תהיה זמינה בקרוב!");
      return;
    }
    try {
      if (authEnabled) {
        await signIn(provider, { callbackURL: "/" });
      } else {
        toast.info("התחברות באמצעות רשתות חברתיות דורשת הגדרת מפתחות Google/X בשרת.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "שגיאה בהתחברות";
      toast.error(msg);
    }
  };

  return (
    <div className="sheet-scrim" dir="rtl">
      <div
        className="sheet relative max-h-[85dvh] !max-w-md w-full overflow-hidden flex flex-col p-5 rounded-2xl bg-[#141414] border border-white/10 text-white shadow-2xl"
        role="dialog"
        aria-label="אימות מספר טלפון"
      >
        {isPickerOpen ? (
          /* Country Picker View */
          <div className="flex flex-col h-full max-h-[70dvh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-bold text-lg">בחר מדינה</span>
              <button
                type="button"
                className="text-sm text-neutral-400 hover:text-white px-2 py-1 rounded"
                onClick={() => setIsPickerOpen(false)}
              >
                סגור
              </button>
            </div>

            {/* Search Country Input */}
            <div className="relative my-3">
              <Search className="absolute right-3 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש מדינה או קידומת..."
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl py-2.5 pr-9 pl-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            {/* Scrollable Countries List */}
            <div className="overflow-y-auto flex-1 divide-y divide-white/5 pr-1">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-sm">
                  לא נמצאו מדינות
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center justify-between py-3 px-2 rounded-lg text-right transition-colors ${
                        isSelected
                          ? "bg-red-500/10 text-red-400"
                          : "hover:bg-white/5 text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <div className="flex flex-col text-right">
                          <span className="font-medium text-sm text-white">
                            {c.nameHe}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {c.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" dir="ltr">
                        <span className="text-sm font-mono text-neutral-300">
                          {c.dialCode}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-red-500" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : step === "phone" ? (
          /* Phone Input Step */
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-5 h-5 text-red-500" />
              <h2 className="font-display text-2xl font-bold text-white">
                מספר הטלפון שלך
              </h2>
            </div>
            <p className="text-sm text-neutral-400 mb-5">
              הזן את מספר הטלפון כדי שחברים יוכלו לזהות אותך ולשלוח נשיקות.
            </p>

            {/* Dual Input: Country Code + Local Number */}
            <div className="flex items-stretch gap-2.5 mb-2">
              {/* Country Selector Button */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-2 px-3 bg-[#1e1e1e] hover:bg-[#252525] border border-white/10 hover:border-white/20 rounded-xl transition-all h-12 flex-shrink-0"
                title="החלף מדינה"
              >
                <span className="text-2xl leading-none">{selectedCountry.flag}</span>
                <span className="text-sm font-semibold font-mono text-neutral-200" dir="ltr">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {/* Local Number Input */}
              <div className="flex-1 relative">
                <Input
                  ref={phoneInputRef}
                  className={`h-12 rounded-xl bg-[#1e1e1e] border text-lg text-left font-mono tracking-wider text-white placeholder:text-neutral-500 ${
                    localNumber && !validation.isValid
                      ? "border-amber-500/50 focus-visible:ring-amber-500/30"
                      : validation.isValid
                      ? "border-emerald-500/50 focus-visible:ring-emerald-500/30"
                      : "border-white/10"
                  }`}
                  value={localNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={selectedCountry.placeholder}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  autoFocus
                />
              </div>
            </div>

            {/* Live Validation Feedback */}
            <div className="min-h-[22px] mb-4 text-xs">
              {localNumber && !validation.isValid && validation.error ? (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{validation.error}</span>
                </div>
              ) : validation.isValid ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>מספר תקין: {selectedCountry.dialCode} {validation.formattedDisplay}</span>
                </div>
              ) : (
                <span className="text-neutral-500">
                  {selectedCountry.code === "IL"
                    ? "מספר נייד ישראלי כולל 10 ספרות (לדוגמה: 050-123-4567)"
                    : `פורמט מקומי: ${selectedCountry.placeholder}`}
                </span>
              )}
            </div>

            {/* Next / Confirm Button */}
            <Button
              size="lg"
              className="h-12 w-full rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-base shadow-lg shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              disabled={!validation.isValid}
              onClick={handleSendSms}
            >
              המשך לאימות SMS
            </Button>

            {/* Divider: או התחבר באמצעות */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative bg-[#141414] px-2.5 text-xs text-neutral-400">
                או התחבר באמצעות
              </div>
            </div>

            {/* Social Sign-in Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-white"
                title="התחבר עם Google"
              >
                <GoogleIcon />
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("apple")}
                className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-white"
                title="התחבר עם Apple"
              >
                <AppleIcon />
                <span>Apple</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("twitter")}
                className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-white"
                title="התחבר עם X"
              >
                <XIcon />
                <span>X</span>
              </button>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 text-xs text-neutral-400 hover:text-white text-center py-1"
              >
                ביטול
              </button>
            )}
          </div>
        ) : (
          /* SMS Verification Step */
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="font-display text-2xl font-bold text-white">
                  אימות קוד ב-SMS
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <span>ערוך מספר</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-sm text-neutral-400 mb-4">
              קוד אימות בן 6 ספרות נשלח אל{" "}
              <span className="font-mono text-white font-semibold" dir="ltr">
                {selectedCountry.dialCode} {validation.formattedDisplay}
              </span>
            </p>

            {/* OTP Code Input */}
            <div className="mb-3">
              <Input
                ref={smsInputRef}
                className="h-14 rounded-xl bg-[#1e1e1e] border-white/10 text-center text-3xl font-mono tracking-[0.5em] text-white placeholder:tracking-normal placeholder:text-sm placeholder:text-neutral-500"
                value={smsCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setSmsCode(val);
                  setSmsError("");
                }}
                placeholder="123456"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                dir="ltr"
                autoFocus
              />
            </div>

            {smsError && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{smsError}</span>
              </div>
            )}

            {/* Test helper badge during dev */}
            <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 mb-4 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                קוד אימות לדוגמה: <strong className="text-white font-mono">123456</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSmsCode("123456");
                  setSmsError("");
                }}
                className="text-xs text-red-400 hover:text-red-300 font-medium"
              >
                הזן קוד לבדיקה
              </button>
            </div>

            {/* Resend Countdown / Button */}
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-4 px-1">
              {resendCountdown > 0 ? (
                <span>שליחה חוזרת בעוד {resendCountdown} שניות</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendSms}
                  disabled={isResending}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                >
                  <RotateCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                  <span>שלח קוד שוב</span>
                </button>
              )}
            </div>

            {/* Verify Button */}
            <Button
              size="lg"
              className="h-12 w-full rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-base shadow-lg shadow-red-600/20 disabled:opacity-40 transition-all"
              disabled={smsCode.length < 4}
              onClick={handleVerifySms}
            >
              אישור והתחברות
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 fill-white" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.87-1 2.99 1.07.08 2.15-.53 2.81-1.33z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 fill-white" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

