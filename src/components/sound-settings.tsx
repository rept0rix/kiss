import { getSoundPrefs, setSoundPrefs, unlockSound } from "@/lib/sound";
import { useState } from "react";

export function SoundSettings({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [prefs, setPrefs] = useState(getSoundPrefs);
  if (!open) return null;

  function toggle(key: "kisses" | "hearts") {
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
      </div>
    </div>
  );
}
