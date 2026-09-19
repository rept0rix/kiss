import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.sendkiss.app",
  appName: "KISS",
  webDir: "native/www",
  server: {
    // Dev: CAP_SERVER_URL=http://<mac-lan-ip>:8080  (needed for this branch's Contacts JS)
    // Default: production web until תמזג deploys the picker code
    url: process.env.CAP_SERVER_URL || "https://app.sendkiss.online",
    cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    CapacitorCookies: { enabled: true },
    CapacitorHttp: { enabled: true },
  },
};

export default config;
