import { useEffect, useState } from "react";
import { getSuperBalance, grantSuperKisses } from "@/lib/store/server";
import { Button } from "./ui/button";

const BUNDLES = [
  { id: "pack5", label: "5 Super Kisses", price: "$0.99", count: 5 },
  { id: "pack20", label: "20 Super Kisses", price: "$2.99", count: 20 },
  { id: "pack50", label: "50 Super Kisses", price: "$5.99", count: 50 },
] as const;

const SUBSCRIPTION = {
  id: "kiss_plus",
  label: "KISS+ Unlimited",
  price: "$2.99/mo",
  desc: "Unlimited Super Kisses, exclusive skins, and stats.",
};

export function SuperKissStore({
  open,
  phone,
  onClose,
  onPurchased,
}: {
  open: boolean;
  phone: string;
  onClose: () => void;
  onPurchased?: (count: number) => void;
}) {
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !phone) return;
    let gone = false;
    void getSuperBalance({ data: phone }).then((r) => {
      if (!gone) setBalance(r.balance);
    }).catch(() => undefined);
    return () => { gone = true; };
  }, [open, phone]);

  if (!open) return null;

  async function buy(count: number) {
    setBusy(true);
    setMessage(null);
    try {
      // In production: Apple/Google in-app purchase with receipt validation.
      await grantSuperKisses({ data: { phone, count } });
      const r = await getSuperBalance({ data: phone });
      setBalance(r.balance);
      setMessage(`+${count} Super Kisses!`);
      if (onPurchased) onPurchased(count);
    } catch {
      setMessage("Purchase failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet sheet-tall" role="dialog" aria-label="Super Kiss store" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="font-display text-2xl">Super Kiss</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className="super-balance mt-3">
          <span className="super-balance-label">You have</span>
          <span className="super-balance-num">{balance}</span>
          <span className="super-balance-label">Super Kisses</span>
        </div>

        <div className="mt-4">
          <p className="connect-label">Bundles</p>
          <div className="super-bundles mt-2">
            {BUNDLES.map((b) => (
              <button
                key={b.id}
                type="button"
                className="super-bundle"
                disabled={busy}
                onClick={() => void buy(b.count)}
              >
                <span className="super-bundle-label">{b.label}</span>
                <span className="super-bundle-price">{b.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="connect-label">Subscription</p>
          <button
            type="button"
            className="super-sub mt-2"
            disabled={busy}
            onClick={() => setMessage("Subscription coming soon to the App Store")}
          >
            <div className="super-sub-info">
              <span className="super-sub-label">{SUBSCRIPTION.label}</span>
              <span className="super-sub-desc">{SUBSCRIPTION.desc}</span>
            </div>
            <span className="super-sub-price">{SUBSCRIPTION.price}</span>
          </button>
        </div>

        {message ? (
          <p className="mt-3 text-center text-sm text-muted">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
