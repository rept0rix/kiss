import type { CapacitorConfig } from "@capacitor/cli";

/// Capacitor config — wraps the existing Vite/TanStack Start build.
/// After `npm run build`, run `npx cap sync` to copy the web build
/// into the native iOS/Android projects.
const config: CapacitorConfig = {
  appId: "online.sendkiss.app",
  appName: "KISS",
  webDir: "dist",
  server: {
    androidScheme: "https",
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

