/**
 * Pure resolution of the auth environment (no runtime deps beyond the
 * dependency-free `./providers`; unit-tested in
 * `auth-env.test.ts`). `server.ts` builds Better Auth from this, and the
 * `/api/auth-providers` route reports the enabled providers from it, so the two
 * can never disagree about which sign-in buttons work.
 *
 * Deployed (Vercel, or any real `DATABASE_URL`): the public origin comes ONLY
 * from `BETTER_AUTH_URL` / `VERCEL_PROJECT_PRODUCTION_URL` — never the dynamic
 * preview baseURL or the `http://localhost:8080` fallback — and the Grok broker
 * is only used with real `GROK_AUTH_*` creds, never the shared preview client.
 * A missing secret or origin disables OAuth sign-in (loudly, in `server.ts`)
 * instead of crashing, so phone login keeps working.
 */
import { BROKER_PROVIDERS, SOCIAL_PROVIDERS, type EnabledProvider } from "./providers.ts";

export type AuthEnvInput = Readonly<Record<string, string | undefined>>;

export type SocialProviderId = "google" | "twitter";

/** Where broker (genericOAuth) credentials come from, or null when off. */
export type BrokerCredentials = "env" | "preview" | null;

export type ResolvedAuthEnv = {
  deployed: boolean;
  /** `VITE_AUTH_ENABLED=false`: session enforcement and sign-in both off. */
  authDisabled: boolean;
  /**
   * Explicit public origin (no trailing slash). `undefined` when not deployed
   * and `BETTER_AUTH_URL` is unset -> `server.ts` uses the dynamic preview baseURL.
   */
  baseURL: string | undefined;
  /** False only when deployed without `BETTER_AUTH_SECRET`. */
  secretOk: boolean;
  socialProviders: SocialProviderId[];
  brokerEnabled: boolean;
  brokerCredentials: BrokerCredentials;
  /** Set when OAuth sign-in is force-disabled by a config problem. */
  signInDisabledReason?: string;
};

function read(input: AuthEnvInput, key: string): string | undefined {
  const value = input[key]?.trim();
  return value ? value : undefined;
}

const stripTrailingSlashes = (url: string): string => url.replace(/\/+$/, "");

export function resolveAuthEnv(input: AuthEnvInput): ResolvedAuthEnv {
  const env = (key: string) => read(input, key);

  const deployed =
    env("VERCEL") === "1" || Boolean(env("VERCEL_ENV")) || Boolean(env("DATABASE_URL"));
  const authDisabled = env("VITE_AUTH_ENABLED") === "false";

  const productionHost = env("VERCEL_PROJECT_PRODUCTION_URL");
  const rawBaseURL = deployed
    ? (env("BETTER_AUTH_URL") ?? (productionHost ? `https://${productionHost}` : undefined))
    : env("BETTER_AUTH_URL");
  const baseURL = rawBaseURL ? stripTrailingSlashes(rawBaseURL) : undefined;

  const secretOk = !deployed || Boolean(env("BETTER_AUTH_SECRET"));

  let signInDisabledReason: string | undefined;
  if (authDisabled) {
    signInDisabledReason = "VITE_AUTH_ENABLED=false";
  } else if (deployed && !baseURL) {
    signInDisabledReason =
      "deployed without BETTER_AUTH_URL or VERCEL_PROJECT_PRODUCTION_URL — no public origin for OAuth callbacks";
  } else if (deployed && isLoopback(baseURL)) {
    signInDisabledReason = `deployed with a loopback BETTER_AUTH_URL (${baseURL}) — OAuth callbacks would point at localhost`;
  } else if (!secretOk) {
    signInDisabledReason = "deployed without BETTER_AUTH_SECRET";
  }
  const signInAllowed = signInDisabledReason === undefined;

  const socialProviders: SocialProviderId[] = [];
  if (signInAllowed && env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")) {
    socialProviders.push("google");
  }
  if (signInAllowed && env("TWITTER_CLIENT_ID") && env("TWITTER_CLIENT_SECRET")) {
    socialProviders.push("twitter");
  }

  let brokerCredentials: BrokerCredentials = null;
  if (signInAllowed) {
    if (env("GROK_AUTH_CLIENT_ID") && env("GROK_AUTH_CLIENT_SECRET")) {
      brokerCredentials = "env";
    } else if (!deployed) {
      brokerCredentials = "preview";
    }
  }

  return {
    deployed,
    authDisabled,
    baseURL: deployed && isLoopback(baseURL) ? undefined : baseURL,
    secretOk,
    socialProviders,
    brokerEnabled: brokerCredentials !== null,
    brokerCredentials,
    ...(signInDisabledReason ? { signInDisabledReason } : {}),
  };
}

/** Client-safe list of enabled sign-in providers (no secrets). */
export function enabledProviders(resolved: ResolvedAuthEnv): EnabledProvider[] {
  const social = SOCIAL_PROVIDERS.filter((p) => resolved.socialProviders.includes(p.id));
  const broker = resolved.brokerEnabled ? BROKER_PROVIDERS : [];
  return [...social, ...broker].map(({ id, label, kind }) => ({ id, label, kind }));
}

/** Better Auth's callback for a social provider under `baseURL`. */
export function socialCallbackURL(baseURL: string, provider: SocialProviderId): string {
  return `${stripTrailingSlashes(baseURL)}/api/auth/callback/${provider}`;
}

function isLoopback(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  } catch {
    return false;
  }
}
