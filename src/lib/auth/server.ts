/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Pre-wired for live preview + deploy — do not rewrite this file. To enable
 * local email/password, flip the flag in `./email-password` only (see auth skill).
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin. Sign-in uses this app's own Google / X OAuth apps
 * (Better Auth `socialProviders`, enabled by `GOOGLE_CLIENT_*` /
 * `TWITTER_CLIENT_*`) and, optionally, the shared **Grok auth broker**
 * (`GROK_AUTH_ISSUER`) via the `genericOAuth` plugin. Env resolution lives in
 * the pure `./auth-env` module.
 *
 * Tri-mode:
 *   - Deployed (`VERCEL*` or `DATABASE_URL`): origin from `BETTER_AUTH_URL` /
 *     `VERCEL_PROJECT_PRODUCTION_URL`, `BETTER_AUTH_SECRET` required for OAuth,
 *     broker only with real `GROK_AUTH_*` (never the preview client). Missing
 *     origin/secret disables OAuth sign-in with a loud log; phone login still works.
 *   - Sandbox live preview: no injection -> falls back to the shared **preview
 *     client** (`./preview`) and derives the preview's `https://*.grok-sandbox.com`
 *     origin from the request, so real sign-in works (no demo users). Sessions
 *     and identities persist in the embedded PGLite DB (same DB as app data);
 *     the process restart wipes both. Live-preview iframe clients use a bearer
 *     token (partitioned cookies) — see `client.ts`.
 *   - Off (`VITE_AUTH_ENABLED=false`, the shipped default): no providers;
 *     `requireUserId` resolves a dev user with no database configured, and
 *     throws fail-closed once `DATABASE_URL` is set (see `verify.server.ts`).
 *
 * NEVER import this from client code — it pulls in `pg` + the preview secret +
 * server-only Better Auth internals. The client uses `@/lib/auth/client`;
 * components read the user via `@/lib/auth/use-current-user`; server functions get
 * a verified id via `@/lib/auth/middleware`.
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { GATE_PROVIDER_ID, gateIdentitySessions } from "./gate-session.server";
import { resolveAuthEnv } from "./auth-env";
import { BROKER_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads: PGLite (and its session rows) is
 * stored on `globalThis`, so an HMR re-eval of this file must NOT mint a new
 * signing secret or every existing session becomes invalid mid-dev. Process
 * restart clears both the secret and PGLite together.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const authEnv = resolveAuthEnv(process.env);

if (authEnv.signInDisabledReason && !authEnv.authDisabled) {
  console.error(
    `[auth] Google/X/broker sign-in DISABLED: ${authEnv.signInDisabledReason}. ` +
      "Set BETTER_AUTH_URL and BETTER_AUTH_SECRET (see README \"Auth\"). " +
      "Phone login is unaffected.",
  );
}

// Explicit off-switch. Set `VITE_AUTH_ENABLED=false` to force auth off
// everywhere (dev user).
const authDisabled = authEnv.authDisabled;

// Broker federation creds: real `GROK_AUTH_*` when set; when NOT deployed, the
// shared live-preview client, which the broker accepts for any
// `*.grok-sandbox.com` callback (see `./preview`). Never the preview client when
// deployed (`brokerCredentials` is null there without real creds).
const grokIssuer = env("GROK_AUTH_ISSUER") ?? GROK_ISSUER_DEFAULT;
const grokClientId =
  authEnv.brokerCredentials === "env" ? env("GROK_AUTH_CLIENT_ID") : PREVIEW_CLIENT_ID;
const grokClientSecret =
  authEnv.brokerCredentials === "env" ? env("GROK_AUTH_CLIENT_SECRET") : PREVIEW_CLIENT_SECRET;

/**
 * True when real session enforcement is on (`requireUserId` demands a verified
 * session instead of the dev user). Deliberately independent of which OAuth
 * providers are configured: phone-only deployments with no OAuth env must keep
 * enforcing sessions exactly as before (see `verify.server.ts`).
 */
export const authConfigured = !authDisabled;

/** True when at least one OAuth sign-in method (social or broker) is enabled. */
export const signInConfigured =
  !authDisabled && (authEnv.socialProviders.length > 0 || authEnv.brokerEnabled);

// This app's own Better Auth origin. When deployed it's the explicit public URL
// from `./auth-env` (never localhost). In the sandbox live preview there's no
// fixed URL (each preview gets a dynamic `*.grok-sandbox.com` host), so we hand
// Better Auth a dynamic baseURL: it derives the origin per-request from the
// (proxied) host, validated against the preview allowlist, which makes the OAuth
// `redirect_uri` the concrete preview URL the broker's preview client accepts.
const explicitBaseURL = authEnv.baseURL;
// Explicit `string[]` (not a readonly tuple) — Better Auth's DynamicBaseURLConfig
// requires a mutable `allowedHosts: string[]`.
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
// Local `npm run dev` (port 8080 contract). Browsers may send Origin as any of
// these for the same server — trusting only `localhost` rejects `127.0.0.1` and
// breaks email/password with "Invalid origin".
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];
// Deployed with no resolvable origin (sign-in is disabled above): a constant,
// non-localhost placeholder so Better Auth constructs; no OAuth flow uses it.
const DEPLOYED_ORIGIN_PLACEHOLDER = "https://origin-not-configured.invalid";
const baseURL = explicitBaseURL ?? (authEnv.deployed ? DEPLOYED_ORIGIN_PLACEHOLDER : {
  // Include loopback hosts so dynamic baseURL resolves for local email/password
  // (not only the preview wildcard).
  allowedHosts: [...previewAllowedHosts, "localhost", "127.0.0.1", "[::1]"],
  // `auto` → trust both http:// and https:// expansions of allowedHosts
  // (preview is https; local dev is http).
  protocol: "auto" as const,
  fallback: "http://localhost:8080",
});

// Origins Better Auth accepts on credentialed POSTs (sign-up/sign-in, etc.).
// Missing entries here surface as FORBIDDEN "Invalid origin".
const trustedOrigins: string[] =
  explicitBaseURL || authEnv.deployed
    ? [...(explicitBaseURL ? [explicitBaseURL] : []), ...LOCAL_DEV_ORIGINS]
    : [
      // Host wildcards (matched against Origin's host)
      ...previewAllowedHosts,
      // Full-origin wildcards (matched against Origin)
      ...previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
      ...LOCAL_DEV_ORIGINS,
    ];

const databaseUrl = env("DATABASE_URL");

// Static broker OAuth endpoints (skip OIDC discovery on every sign-in / callback).
// Discovery would cost an extra network hop to the broker before the popup can
// even redirect to Google/X — the live-preview popup felt stuck on the app for
// that whole round-trip. These paths match the broker's discovery document.
const issuerBase = grokIssuer.replace(/\/+$/, "");
const grokAuthorizationUrl = `${issuerBase}/api/auth/oauth2/authorize`;
const grokTokenUrl = `${issuerBase}/api/auth/oauth2/token`;
const grokUserInfoUrl = `${issuerBase}/api/auth/oauth2/userinfo`;

// Real Postgres when `DATABASE_URL` is set (deployed apps), else the app's
// embedded PGLite (preview) via a Kysely dialect — so Better Auth persists to the
// SAME DB as app data, including email/password users. Both use the Better Auth
// schema from `migrations/auth/0001_auth.sql`, copied into `migrations/` when
// the app turns sign-in on.
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

/** Session token cookie name — also read by the live-preview popup completion page. */
export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

// Built separately so the `betterAuth({...})` call stays easy to edit without
// breaking brackets (models often trip on the conditional plugin spread).
const grokOAuthPlugin = authEnv.brokerEnabled
  ? genericOAuth({
      config: BROKER_PROVIDERS.map(({ id: providerId, idp }) => ({
        providerId,
        clientId: grokClientId as string,
        clientSecret: grokClientSecret as string,
        // Prefer static endpoints over `discoveryUrl` so initiating (and
        // completing) OAuth does not wait on a broker discovery fetch.
        authorizationUrl: grokAuthorizationUrl,
        tokenUrl: grokTokenUrl,
        userInfoUrl: grokUserInfoUrl,
        scopes: ["openid", "profile", "email"],
        // `prompt: "login"` forces the broker to re-authenticate against the
        // upstream on every sign-in instead of silently reusing an existing
        // broker session. Combined with the broker sending Google
        // `prompt=select_account`, the user always gets the account chooser
        // and can pick (or switch) which account to sign in with.
        authorizationUrlParams: { idp, prompt: "login" },
      })),
    })
  : null;

// This app's own Google / X OAuth apps. Callbacks:
// `${baseURL}/api/auth/callback/google` and `${baseURL}/api/auth/callback/twitter`.
const socialProviders = {
  ...(authEnv.socialProviders.includes("google")
    ? {
        google: {
          clientId: env("GOOGLE_CLIENT_ID") as string,
          clientSecret: env("GOOGLE_CLIENT_SECRET") as string,
          prompt: "select_account" as const,
        },
      }
    : {}),
  ...(authEnv.socialProviders.includes("twitter")
    ? {
        twitter: {
          clientId: env("TWITTER_CLIENT_ID") as string,
          clientSecret: env("TWITTER_CLIENT_SECRET") as string,
        },
      }
    : {}),
};

export const auth = betterAuth({
  baseURL,
  // Deployed apps set BETTER_AUTH_SECRET. Preview (or deployed without it, where
  // `./auth-env` disables every OAuth provider): process-stable secret on
  // globalThis so HMR doesn't invalidate PGLite-backed sessions (see above).
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,
  socialProviders,

  // CSRF / origin check for credentialed auth POSTs (email sign-up/sign-in, …).
  // See `trustedOrigins` construction above — must cover live preview hosts AND
  // local loopback variants, or clients get "Invalid origin".
  trustedOrigins,

  // Encrypt broker-issued OAuth tokens at rest, and treat the broker's upstreams
  // as trusted first-party identities. The broker owns identity and X emails are
  // synthetic/unverified, so WITHOUT this a login can fail with
  // `account_not_linked` (Better Auth refuses to attach an untrusted, unverified
  // identity to an existing user). Google and X carry DISTINCT emails, so this
  // never merges them into one user — they stay separate identities.
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: [
        "google",
        "twitter",
        ...(authEnv.brokerEnabled ? BROKER_PROVIDERS.map((p) => p.id) : []),
        GATE_PROVIDER_ID,
      ],
      // X's synthetic email is never "verified", so don't gate linking on the
      // local user's email-verified state.
      requireLocalEmailVerified: false,
    },
  },

  // Cache the session in the short-lived signed `session_data` cookie so reads
  // (incl. the client's `/get-session`) skip the DB — this shrinks the "loading"
  // window and reduces auth flicker. See the `auth` skill for the full
  // flicker-prevention guidance (gate on `isPending`; SSR the session).
  session: {
    expiresIn: 60 * 60 * 24 * 365,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 },
  },

  // Local email/password — toggled only via `./email-password` (not a plugin).
  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),

  // `__Host-` prefixed cookies: the browser REFUSES any same-named cookie that
  // carries a `Domain` attribute, so a sibling `*.grok.me` app cannot "toss" a
  // `Domain=.grok.me` session cookie onto this app. `__Host-` requires Secure +
  // Path=/ + no Domain; Better Auth otherwise uses `__Secure-` (which permits
  // Domain), so we drop its auto prefix (`useSecureCookies: false`) and set
  // Secure + the names ourselves. (Browsers allow Secure cookies on
  // `http://localhost`, so local dev still works.)
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },

  plugins: [
    gateIdentitySessions(),

    // One genericOAuth provider per upstream (when auth is on), all federating
    // to the broker with the SAME client and differing only by the `idp` hint.
    ...(grokOAuthPlugin ? [grokOAuthPlugin] : []),

    // Accept `Authorization: Bearer <session-token>` as an alternative to the
    // cookie. Needed for the LIVE PREVIEW: the app runs in an embedded iframe
    // where cookies are partitioned, so after popup sign-in it authenticates with
    // a bearer token instead (see `client.ts` / the `auth` skill). The hook only
    // fires when an Authorization header is present, so the cookie path
    // (deployed apps) is unaffected.
    bearer(),

    // Bridges Better Auth's Set-Cookie into TanStack Start responses. MUST be
    // last so it runs after every other plugin's hooks.
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

// Re-exported for convenience; the arrays live in the dependency-free
// `providers.ts` so the client can import them too.
export { AUTH_PROVIDERS, BROKER_PROVIDERS, SOCIAL_PROVIDERS } from "./providers";
