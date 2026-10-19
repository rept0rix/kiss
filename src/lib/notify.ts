import { toast } from "sonner";

export async function askNotify(): Promise<void> {
  if (typeof window === "undefined") return;

  // Try Capacitor LocalNotifications if native
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.requestPermissions();
      return;
    }
  } catch {
    /* fallback to web */
  }

  // Web Notification API
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
  }
}

export async function notifyKiss(from: string, count = 1): Promise<void> {
  if (typeof window === "undefined") return;
  const line = count > 1 ? `${from} kissed you ×${count}!` : `${from} kissed you!`;

  // 1. Native Haptics or Web Vibration
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([80, 50, 120, 50, 200]);
    }
  } catch {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([80, 50, 120, 50, 200]);
      } catch {
        /* ignore */
      }
    }
  }

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
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 100000),
            title: "KISS 💋",
            body: line,
            sound: undefined,
            schedule: { at: new Date(Date.now() + 50) },
          },
        ],
      });
      nativeNotificationSent = true;
    }
  } catch {
    /* fall back to web Notification */
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

