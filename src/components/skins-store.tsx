import { useEffect, useState } from "react";
import { PREMIUM_SKINS, getOwnedSkins, grantSkin } from "@/lib/store/server";
import { RANKS, rankAt } from "@/lib/kisses/ranks";
import { Button } from "./ui/button";

const ALL_SKIN_CLASSES: Record<string, string> = {
  classic: "skin-classic",
  gold: "skin-gold",
  pink: "skin-pink",
  fire: "skin-fire",
  ice: "skin-ice",
  venom: "skin-venom",
  royal: "skin-royal",
  void: "skin-void",
  myth: "skin-myth",
  god: "skin-god",
  eternal: "skin-eternal",
  immortal: "skin-immortal",
  aurora: "skin-aurora",
  sunset: "skin-sunset",
  neon: "skin-neon",
  crystal: "skin-crystal",
  candy: "skin-candy",
};

export function SkinsStore({
  open,
  phone,
  mySent,
  selectedSkin,
  onClose,
  onSelect,
}: {
  open: boolean;
  phone: string;
  mySent: number;
  selectedSkin: string;
  onClose: () => void;
  onSelect: (skin: string) => void;
}) {
  const [owned, setOwned] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const currentRank = rankAt(mySent);

  useEffect(() => {
    if (!open || !phone) return;
    let gone = false;
    void getOwnedSkins({ data: phone }).then((skins) => {
      if (!gone) setOwned(skins);
    }).catch(() => undefined);
    return () => { gone = true; };
  }, [open, phone]);

  if (!open) return null;

  // Free skins: unlocked by rank
  const unlockedFree = RANKS.filter((r) => mySent >= r.min).map((r) => r.skin);
  // Locked free skins: need higher rank
  const lockedFree = RANKS.filter((r) => mySent < r.min);
  // Premium skins
  const premium = PREMIUM_SKINS;

  async function buySkin(skinId: string) {
    setBusy(true);
    setMessage(null);
    try {
      // In production this goes through Apple/Google in-app purchase.
      // For now, grant directly (the IAP receipt validation is server-side).
      await grantSkin({ data: { phone, skin: skinId } });
      setOwned((prev) => [...prev, skinId]);
      setMessage("Unlocked!");
    } catch {
      setMessage("Could not purchase");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Kiss styles" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="font-display text-2xl">Kiss Styles</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className="mt-3">
          <p className="connect-label">Unlocked ({unlockedFree.length})</p>
          <div className="skin-grid mt-2">
            {unlockedFree.map((skin) => (
              <button
                key={skin}
                type="button"
                className={`skin-cell ${selectedSkin === skin ? "is-on" : ""}`}
                onClick={() => onSelect(skin)}
              >
                <span className={`skin-dot ${ALL_SKIN_CLASSES[skin] ?? "skin-classic"}`} />
                <span className="skin-label">{skin}</span>
              </button>
            ))}
          </div>
        </div>

        {lockedFree.length > 0 ? (
          <div className="mt-3">
            <p className="connect-label">Locked — send more kisses</p>
            <div className="skin-grid mt-2">
              {lockedFree.map((r) => (
                <div key={r.skin} className="skin-cell is-locked">
                  <span className={`skin-dot ${ALL_SKIN_CLASSES[r.skin] ?? "skin-classic"}`} />
                  <span className="skin-label">{r.skin}</span>
                  <span className="skin-req">{r.min}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3">
          <p className="connect-label">Premium</p>
          <div className="skin-grid mt-2">
            {premium.map((skin) => {
              const isOwned = owned.includes(skin.id);
              return (
                <button
                  key={skin.id}
                  type="button"
                  className={`skin-cell ${selectedSkin === skin.id ? "is-on" : ""}`}
                  disabled={busy}
                  onClick={() => (isOwned ? onSelect(skin.id) : void buySkin(skin.id))}
                >
                  <span className="skin-dot" style={{ color: skin.color }} />
                  <span className="skin-label">{skin.name}</span>
                  {isOwned ? null : <span className="skin-price">{skin.price}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {message ? (
          <p className="mt-3 text-center text-sm text-muted">{message}</p>
        ) : null}

        <p className="mt-3 text-xs text-muted">
          Current: {currentRank.name} · {mySent} kisses sent
        </p>
      </div>
    </div>
  );
}
