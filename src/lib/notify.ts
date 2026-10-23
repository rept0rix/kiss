import { toast } from "sonner";

const PREFS_KEY = "kiss-notify-prefs-v1";

export type NotifyPrefs = {
  notifications: boolean;
  haptics: boolean;
};

const DEFAULT_PREFS: NotifyPrefs = {
  notifications: true,
  haptics: true,
};

export function getNotifyPrefs(): NotifyPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotifyPrefs>;
    return {
      notifications: parsed.notifications !== false,
      haptics: parsed.haptics !== false,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setNotifyPrefs(next: Partial<NotifyPrefs>): NotifyPrefs {
  const current = getNotifyPrefs();
  const updated = { ...current, ...next };
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
  return updated;
}

export type PermissionResult = "granted" | "denied" | "prompt";

export async function getNotificationPermissionStatus(): Promise<PermissionResult> {
  if (typeof window === "undefined") return "prompt";
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === "granted") return "granted";
      if (perm.display === "denied") return "denied";
      return "prompt";
    }
  } catch {
    /* fallback to web */
  }

  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "prompt";
  }

  return "prompt";
}

let channelCreated = false;
async function ensureNotificationChannel(): Promise<void> {
  if (channelCreated || typeof window === "undefined") return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.createChannel({
        id: "kiss_channel",
        name: "Kiss Alerts",
        description: "Incoming kisses and love messages",
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: "#FF2E63",
      });
      channelCreated = true;
    }
  } catch {
    /* ignore channel error if not android */
  }
}

export async function askNotify(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Try Capacitor LocalNotifications if native
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await ensureNotificationChannel();
      const res = await LocalNotifications.requestPermissions();
      return res.display === "granted";
    }
  } catch {
    /* fallback to web */
  }

  // Web Notification API
  if (typeof Notification !== "undefined") {
    try {
      const res = await Notification.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  }

  return false;
}

export async function triggerHaptic(): Promise<void> {
  const prefs = getNotifyPrefs();
  if (!prefs.haptics || typeof window === "undefined") return;

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    }
  } catch {
    /* fallback to web vibration */
  }

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([80, 50, 120, 50, 200]);
    } catch {
      /* ignore */
    }
  }
}

export async function notifyKiss(from: string, count = 1): Promise<void> {
  if (typeof window === "undefined") return;
  const prefs = getNotifyPrefs();
  if (!prefs.notifications) return;

  const line = count > 1 ? `${from} kissed you ×${count}!` : `${from} kissed you!`;

  // 1. Native Haptics or Web Vibration
  void triggerHaptic();

  // 2. In-app rich notification banner (Sonner)
  try {
    toast(`💋 ${line}`, {
      description: "Touch to open and catch your kiss",
      duration: 4500,
    });
  } catch {
    /* ignore */
  }

  // 3. Native Capacitor LocalNotification
  let nativeNotificationSent = false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await ensureNotificationChannel();
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== "granted") return;
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor((Date.now() % 100000) + Math.random() * 1000),
            title: "KISS 💋",
            body: line,
            channelId: "kiss_channel",
            schedule: { at: new Date(Date.now() + 50) },
          },
        ],
      });
      nativeNotificationSent = true;
    }
  } catch (err) {
    console.warn("Native notification failed:", err);
  }

  // 4. Web System notification (desktop / PWA)
  if (!nativeNotificationSent && typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("KISS 💋", {
        body: line,
        tag: "kiss-in",
        silent: false,
        icon: "/__grok/icon-192.png",
      });
    } catch {
      /* unsupported on some mobile WebViews */
    }
  }
}

export async function sendTestNotification(): Promise<void> {
  await askNotify();
  await triggerHaptic();
  await notifyKiss("KISS Test 💋", 1);
}
