import { getSoundPrefs, setSoundPrefs, unlockSound } from "@/lib/sound";
import { loadBlocks, unblockLocal, type BlockedPerson } from "@/lib/block";
import { authEnabled, signOut } from "@/lib/auth/client";
import { unblockPhone } from "@/lib/kisses/server";
import { useState } from "react";

export function SoundSettings({
  open,
  myPhone,
  onClose,
  onDelete,
}: {
  open: boolean;
  myPhone?: string;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [prefs, setPrefs] = useState(getSoundPrefs);
  const [blocked, setBlocked] = useState<BlockedPerson[]>(() => loadBlocks());
  if (!open) return null;

  function toggle(key: "kisses" | "hearts" | "music") {
    unlockSound();
    setPrefs(setSoundPrefs({ [key]: !prefs[key] }));
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <p className="font-display text-2xl">Settings</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <button type="button" className="sound-row mt-4" onClick={() => toggle("kisses")}>
          <span>Kiss sounds</span>
          <span className={prefs.kisses ? "sound-on" : "sound-off"}>{prefs.kisses ? "On" : "Off"}</span>
        </button>
        <button type="button" className="sound-row" onClick={() => toggle("hearts")}>
          <span>Heart sounds</span>
          <span className={prefs.hearts ? "sound-on" : "sound-off"}>{prefs.hearts ? "On" : "Off"}</span>
        </button>
        <button type="button" className="sound-row" onClick={() => toggle("music")}>
          <span>Background music</span>
          <span className={prefs.music ? "sound-on" : "sound-off"}>{prefs.music ? "On" : "Off"}</span>
        </button>
        <p className="connect-label">Blocked · they don't know</p>
        {blocked.length === 0 ? (
          <p className="mt-2 text-xs text-muted">Nobody. Open someone and tap Block.</p>
        ) : (
          <ul className="hit-list mt-2">
            {blocked.map((b) => (
              <li key={b.tel || b.name} className="hit">
                <span className="hit-copy">
                  <span className="hit-name">{b.name}</span>
                </span>
                <button
                  type="button"
                  className="invite-toggle"
                  onClick={() => {
                    setBlocked(unblockLocal(b));
                    if (myPhone && b.tel) {
                      void unblockPhone({ data: { myPhone, theirPhone: b.tel } }).catch(() => undefined);
                    }
                  }}
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
        {authEnabled ? (
          <button
            type="button"
            className="sound-row"
            onClick={async () => {
              try {
                await signOut();
              } catch {
                /* ignore - signOut handles its own errors */
              }
              try {
                window.localStorage.clear();
              } catch {
                /* ignore */
              }
            }}
          >
            <span>Log out</span>
            <span className="sound-off">Leave</span>
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className="live-block mt-6" onClick={onDelete}>
            Delete me
          </button>
        ) : null}
      </div>
    </div>
  );
}
