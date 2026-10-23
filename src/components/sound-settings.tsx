import { getSoundPrefs, setSoundPrefs, unlockSound } from "@/lib/sound";
import { loadBlocks, unblockLocal, type BlockedPerson } from "@/lib/block";
import { authEnabled, signOut } from "@/lib/auth/client";
import { leaveLocalSession } from "@/lib/me";
import { getRuntimeInfo, unblockPhone } from "@/lib/kisses/server";
import {
  askNotify,
  getNotificationPermissionStatus,
  getNotifyPrefs,
  sendTestNotification,
  setNotifyPrefs,
  triggerHaptic,
  type NotifyPrefs,
  type PermissionResult,
} from "@/lib/notify";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, ChevronRight, Music, Plus, Server, Sparkles, Trash2, Vibrate, Volume2, X } from "lucide-react";
import { addTrack, getActiveId, listTracks, removeTrack, restartTrack, setActiveId, type Track } from "@/lib/music";
import { toast } from "sonner";
import { Button } from "./ui/button";

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
  const [notifyPrefs, setNotify] = useState<NotifyPrefs>(getNotifyPrefs);
  const [permStatus, setPermStatus] = useState<PermissionResult>("prompt");
  const [blocked, setBlocked] = useState<BlockedPerson[]>(() => loadBlocks());
  const [runtime, setRuntime] = useState<{ db: string; label: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [testingNotify, setTestingNotify] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeId, setActive] = useState(getActiveId);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    void listTracks().then(setTracks);
    void getNotificationPermissionStatus().then(setPermStatus);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let gone = false;
    void getRuntimeInfo()
      .then((info) => {
        if (!gone) setRuntime(info);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [open]);

  if (!open) return null;

  function toggleSound(key: "kisses" | "hearts" | "music") {
    void triggerHaptic();
    const nextVal = !prefs[key];
    const updated = setSoundPrefs({ [key]: nextVal });
    setPrefs(updated);
  }

  function toggleNotify(key: "notifications" | "haptics") {
    void triggerHaptic();
    const nextVal = !notifyPrefs[key];
    const updated = setNotifyPrefs({ [key]: nextVal });
    setNotify(updated);

    if (key === "notifications" && nextVal) {
      void askNotify().then((granted) => {
        void getNotificationPermissionStatus().then(setPermStatus);
        if (granted) toast.success("Notifications enabled!");
      });
    }
  }

  async function handleTestNotification() {
    setTestingNotify(true);
    try {
      await sendTestNotification();
      void getNotificationPermissionStatus().then(setPermStatus);
      toast.success("Test notification fired! 💋");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Notification test failed");
    } finally {
      setTestingNotify(false);
    }
  }

  function pickSong(id: string) {
    void triggerHaptic();
    setActiveId(id);
    setActive(id);
    if (prefs.music) {
      void restartTrack();
    } else {
      setPrefs(setSoundPrefs({ music: true }));
    }
  }

  async function onLeave() {
    if (leaving) return;
    setLeaving(true);
    leaveLocalSession();
    if (authEnabled) {
      try {
        await signOut("/");
        return;
      } catch {
        /* fallback */
      }
    }
    window.location.href = "/";
  }

  const dataLine =
    runtime === null
      ? "Connecting to server…"
      : runtime.db === "neon"
        ? `Backend · Neon ${runtime.label}`
        : "Backend · preview DB (resets on restart)";

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        className="sheet sheet-tall flex flex-col"
        role="dialog"
        aria-label="Settings"
        style={{ maxHeight: "min(40rem, 90dvh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sheet-head pb-3 border-b border-white/10 shrink-0">
          <p className="font-display text-2xl tracking-tight text-white">Settings</p>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto py-2 pr-1 divide-y divide-white/5 space-y-4">
          {/* Sounds Section */}
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Audio & Sounds
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                className="sound-row transition-transform active:scale-[0.99]"
                onClick={() => toggleSound("kisses")}
              >
                <span className="text-sm font-medium">Kiss sounds</span>
                <span className={prefs.kisses ? "sound-on" : "sound-off"}>
                  {prefs.kisses ? "On" : "Off"}
                </span>
              </button>

              <button
                type="button"
                className="sound-row transition-transform active:scale-[0.99]"
                onClick={() => toggleSound("hearts")}
              >
                <span className="text-sm font-medium">Heart sounds</span>
                <span className={prefs.hearts ? "sound-on" : "sound-off"}>
                  {prefs.hearts ? "On" : "Off"}
                </span>
              </button>

              <button
                type="button"
                className="sound-row transition-transform active:scale-[0.99]"
                onClick={() => toggleSound("music")}
              >
                <span className="text-sm font-medium">Background music</span>
                <span className={prefs.music ? "sound-on" : "sound-off"}>
                  {prefs.music ? "On" : "Off"}
                </span>
              </button>
            </div>
          </div>

          {/* Background Songs */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Music Tracks
              </p>
              <button
                type="button"
                className="text-xs text-[#FF2E63] font-medium flex items-center gap-1 hover:underline"
                onClick={() => fileRef.current?.click()}
              >
                <Plus size={14} />
                <span>Add song</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {tracks.map((t) => {
                const isSelected = activeId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-[#FF2E63]/10 border-[#FF2E63]/30"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                      onClick={() => pickSong(t.id)}
                    >
                      <Music size={15} className={isSelected ? "text-[#FF2E63]" : "text-neutral-400"} />
                      <span className={`text-sm truncate ${isSelected ? "text-white font-medium" : "text-neutral-300"}`}>
                        {t.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && prefs.music ? (
                        <span className="text-[11px] font-display text-[#FF2E63] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF2E63]/20">
                          Playing
                        </span>
                      ) : null}

                      {!t.builtin ? (
                        <button
                          type="button"
                          className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                          aria-label="Remove song"
                          onClick={() =>
                            void removeTrack(t.id).then(() => {
                              setActive(getActiveId());
                              void listTracks().then(setTracks);
                              if (prefs.music) void restartTrack();
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void Promise.all(files.map(addTrack)).then(() => listTracks().then(setTracks));
              }}
            />
          </div>

          {/* Notifications & Haptics Section */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Notifications & Alerts
              </p>
              <span className={`text-[10px] uppercase font-display px-2 py-0.5 rounded-full ${
                permStatus === "granted"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : permStatus === "denied"
                    ? "bg-rose-500/15 text-rose-400"
                    : "bg-amber-500/15 text-amber-400"
              }`}>
                {permStatus}
              </span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                className="sound-row transition-transform active:scale-[0.99]"
                onClick={() => toggleNotify("notifications")}
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-neutral-400" />
                  <span className="text-sm font-medium">Push & local alerts</span>
                </div>
                <span className={notifyPrefs.notifications ? "sound-on" : "sound-off"}>
                  {notifyPrefs.notifications ? "On" : "Off"}
                </span>
              </button>

              <button
                type="button"
                className="sound-row transition-transform active:scale-[0.99]"
                onClick={() => toggleNotify("haptics")}
              >
                <div className="flex items-center gap-2">
                  <Vibrate size={16} className="text-neutral-400" />
                  <span className="text-sm font-medium">Vibration & haptics</span>
                </div>
                <span className={notifyPrefs.haptics ? "sound-on" : "sound-off"}>
                  {notifyPrefs.haptics ? "On" : "Off"}
                </span>
              </button>

              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-2 border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 text-xs flex items-center justify-center gap-1.5"
                disabled={testingNotify}
                onClick={() => void handleTestNotification()}
              >
                <Sparkles size={14} className="text-[#FF2E63]" />
                <span>{testingNotify ? "Testing…" : "Send Test Notification 💋"}</span>
              </Button>
            </div>
          </div>

          {/* Blocked Users Section */}
          <div className="pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Blocked ({blocked.length})
            </p>
            {blocked.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-1">
                Nobody blocked. You can block someone by tapping their face.
              </p>
            ) : (
              <div className="space-y-1.5">
                {blocked.map((b) => (
                  <div
                    key={b.tel || b.name}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-white truncate">{b.name}</span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#FF2E63] hover:underline px-2 py-1"
                      onClick={() => {
                        setBlocked(unblockLocal(b));
                        if (myPhone && b.tel) {
                          void unblockPhone({ data: { myPhone, theirPhone: b.tel } }).catch(() => undefined);
                        }
                        toast.success(`Unblocked ${b.name}`);
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account & Server Actions */}
          <div className="pt-3 space-y-2">
            <button
              type="button"
              className="sound-row transition-transform active:scale-[0.99]"
              disabled={leaving}
              onClick={() => void onLeave()}
            >
              <span className="text-sm font-medium text-neutral-300">Log out</span>
              <span className="text-xs font-display uppercase text-neutral-400">
                {leaving ? "Leaving…" : "Leave"}
              </span>
            </button>

            {onDelete ? (
              <button
                type="button"
                className="w-full py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-medium transition-colors"
                onClick={onDelete}
              >
                Delete account / reset data
              </button>
            ) : null}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 shrink-0 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Server size={12} />
            <span>{dataLine}</span>
          </span>
          <span>v1.0.3</span>
        </div>
      </div>
    </div>
  );
}
