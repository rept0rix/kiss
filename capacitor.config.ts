import type { CapacitorConfig } from "@capacitor/cli";

/// Capacitor config — connects the native mobile app (Android/iOS)
/// to the live backend server. When testing locally over Wi-Fi, CAP_SERVER_URL
/// can point to the dev machine (e.g. http://192.168.1.9:8080).
/// In production/release builds, it connects to https://app.sendkiss.online.
const targetUrl = process.env.CAP_SERVER_URL || "https://app.sendkiss.online";

const config: CapacitorConfig = {
  appId: "online.sendkiss.app",
  appName: "KISS",
  webDir: "dist",
  server: {
    androidScheme: "https",
    url: targetUrl,
    cleartext: targetUrl.startsWith("http://"),
    allowNavigation: [
      "app.sendkiss.online",
      "*.sendkiss.online",
      "192.168.*.*",
      "10.*.*.*",
      "localhost",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#070707",
      androidScaleType: "CENTER_CROP",
    },
    CapacitorCookies: { enabled: true },
    CapacitorHttp: { enabled: true },
  },
};

export default config;
