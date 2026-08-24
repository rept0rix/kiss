export function askNotify(): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function notifyKiss(from: string): void {
  if (typeof window === "undefined") return;
  const line = `${from} kissed you.`;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([40, 40, 80]);
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("KISS", { body: line, tag: "kiss-in", silent: false });
    } catch {
      /* unsupported */
    }
  }
}
