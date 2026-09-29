import { Gift, QrCode, Settings, Sparkles, UserRound, Users } from "lucide-react";
import { authEnabled, signIn, useEnabledProviders } from "@/lib/auth/client";

type Action = { key: string; label: string; icon: typeof QrCode; run: () => void };

export function MoreMenu({
  open,
  onClose,
  onProfile,
  onScan,
  onImport,
  onSkins,
  onSuper,
  onSettings,
}: {
  open: boolean;
  onClose: () => void;
  onProfile: () => void;
  onScan: () => void;
  onImport: () => void;
  onSkins: () => void;
  onSuper: () => void;
  onSettings: () => void;
}) {
  const providers = useEnabledProviders();
  if (!open) return null;
  const actions: Action[] = [
    { key: "profile", label: "My profile", icon: UserRound, run: onProfile },
    { key: "scan", label: "Scan QR", icon: QrCode, run: onScan },
    { key: "import", label: "Import contacts", icon: Users, run: onImport },
    { key: "skins", label: "Skins", icon: Sparkles, run: onSkins },
    { key: "super", label: "Super kisses", icon: Gift, run: onSuper },
    { key: "settings", label: "Settings", icon: Settings, run: onSettings },
  ];
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet more-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="catch-pass-label">More</p>
          <button type="button" className="sheet-x" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="more-grid">
          {actions.map((a) => (
            <li key={a.key}>
              <button
                type="button"
                className="more-item"
                onClick={() => {
                  onClose();
                  a.run();
                }}
              >
                <a.icon size={20} />
                <span>{a.label}</span>
              </button>
            </li>
          ))}
        </ul>
        {authEnabled && providers.length > 0 ? (
          <>
            <p className="connect-label">Sign in</p>
            <div className="social-row">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="more-item more-social"
                  onClick={() => signIn(p.id, { callbackURL: "/" })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
