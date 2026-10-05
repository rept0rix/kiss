/**
 * The identity providers this app can offer for sign-in.
 *
 * Source of truth for BOTH the server (`server.ts`) and the client (`client.ts`
 * / sign-in buttons). Kept in its own dependency-free module so the client can
 * import it without pulling the server-only Better Auth instance (and `pg`)
 * into the browser bundle. Which entries are actually enabled is decided at
 * runtime from env (`auth-env.ts`) and served by `/api/auth-providers`.
 *
 * - `social`: this app's own Google / X OAuth apps via Better Auth
 *   `socialProviders`. `id` is Better Auth's provider id and the callback path
 *   segment (`/api/auth/callback/<id>`).
 * - `broker`: federation through the Grok auth broker (`GROK_AUTH_ISSUER`) via
 *   `genericOAuth` — used by the sandbox live preview. `id` is this app's local
 *   provider id (`/api/auth/oauth2/callback/<id>`); `idp` is the upstream hint
 *   the broker reads (Better Auth's id for X is `twitter`).
 */
export type SocialProvider = {
  id: "google" | "twitter";
  label: string;
  kind: "social";
};

export type BrokerProvider = {
  id: string;
  label: string;
  kind: "broker";
  idp: string;
};

export type AuthProvider = SocialProvider | BrokerProvider;

/** Client-safe shape reported by `/api/auth-providers`. */
export type EnabledProvider = Pick<AuthProvider, "id" | "label" | "kind">;

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [
  { id: "google", label: "Google", kind: "social" },
  { id: "twitter", label: "X", kind: "social" },
];

export const BROKER_PROVIDERS: readonly BrokerProvider[] = [
  { id: "grok-google", label: "Google", kind: "broker", idp: "google" },
  { id: "grok-x", label: "X", kind: "broker", idp: "twitter" },
];

export const AUTH_PROVIDERS: readonly AuthProvider[] = [...SOCIAL_PROVIDERS, ...BROKER_PROVIDERS];

export function findProvider(id: string): AuthProvider | undefined {
  return AUTH_PROVIDERS.find((p) => p.id === id);
}

/** Endpoint (outside Better Auth's `/api/auth/*`) listing enabled providers. */
export const AUTH_PROVIDERS_PATH = "/api/auth-providers";
