/** Where production invite links live. *.vercel.app 308-redirects here, and crawlers drop redirected previews. */
export const CANONICAL_SHARE_ORIGIN = "https://app.sendkiss.online";

const HOSTNAME = /^[a-z0-9.-]+\.[a-z]{2,}$/;
const HOST_WITH_PORT = /^[a-z0-9.-]+(:\d+)?$/i;
const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/i;

function isVercelSystemHost(host: string): boolean {
  const bare = host.split(":")[0] ?? "";
  return bare === "vercel.app" || bare.endsWith(".vercel.app");
}

export type ShareOriginInput = {
  /** VITE_PUBLIC_HOSTNAME */
  pinned?: string | null;
  /** VERCEL_ENV: "production" | "preview" | "development" | unset off Vercel */
  vercelEnv?: string | null;
  /** x-forwarded-host ?? host */
  host?: string | null;
  /** x-forwarded-proto */
  proto?: string | null;
};

/**
 * Absolute origin for og:url / og:image. Vercel previews point at themselves;
 * production never emits a *.vercel.app origin.
 */
export function resolveShareOrigin({ pinned, vercelEnv, host, proto }: ShareOriginInput): string {
  const env = (vercelEnv ?? "").trim();
  const isVercelPreview = env !== "" && env !== "production";
  const isVercelProduction = env === "production";

  if (!isVercelPreview) {
    const name = (pinned ?? "").trim().toLowerCase();
    if (HOSTNAME.test(name)) {
      return isVercelSystemHost(name) ? CANONICAL_SHARE_ORIGIN : `https://${name}`;
    }
  }

  const requestHost = (host ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  if (!HOST_WITH_PORT.test(requestHost)) return "";
  if (isVercelProduction && isVercelSystemHost(requestHost)) return CANONICAL_SHARE_ORIGIN;
  const local = LOCAL_HOST.test(requestHost);
  const scheme = (proto ?? "").split(",")[0]?.trim() || (local ? "http" : "https");
  return `${scheme === "http" ? "http" : "https"}://${requestHost}`;
}
