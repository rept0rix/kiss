import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enabledProviders, resolveAuthEnv, socialCallbackURL } from "./auth-env.ts";

const SECRET = "x".repeat(64);
const SOCIAL_CREDS = {
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
  TWITTER_CLIENT_ID: "twitter-id",
  TWITTER_CLIENT_SECRET: "twitter-secret",
};

const noLoopback = (value: string | undefined) => {
  assert.ok(!/localhost|127\.0\.0\.1|\[::1\]/.test(value ?? ""), `loopback in ${value}`);
};

describe("resolveAuthEnv", () => {
  it("deployed with explicit URL, secret and Google/X creds enables social only", () => {
    const r = resolveAuthEnv({
      VERCEL: "1",
      BETTER_AUTH_URL: "https://app.sendkiss.online/",
      BETTER_AUTH_SECRET: SECRET,
      ...SOCIAL_CREDS,
    });
    assert.equal(r.deployed, true);
    assert.equal(r.baseURL, "https://app.sendkiss.online");
    assert.equal(r.secretOk, true);
    assert.deepEqual(r.socialProviders, ["google", "twitter"]);
    assert.equal(r.brokerEnabled, false);
    assert.equal(r.signInDisabledReason, undefined);
    const callbacks = r.socialProviders.map((p) => socialCallbackURL(r.baseURL as string, p));
    assert.deepEqual(callbacks, [
      "https://app.sendkiss.online/api/auth/callback/google",
      "https://app.sendkiss.online/api/auth/callback/twitter",
    ]);
    for (const url of callbacks) noLoopback(url);
    assert.deepEqual(
      enabledProviders(r).map((p) => [p.id, p.kind]),
      [
        ["google", "social"],
        ["twitter", "social"],
      ],
    );
  });

  it("derives baseURL from VERCEL_PROJECT_PRODUCTION_URL", () => {
    const r = resolveAuthEnv({ VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "app.sendkiss.online" });
    assert.equal(r.baseURL, "https://app.sendkiss.online");
  });

  it("deployed without BETTER_AUTH_SECRET disables sign-in with a reason, no throw", () => {
    const r = resolveAuthEnv({
      VERCEL: "1",
      BETTER_AUTH_URL: "https://app.sendkiss.online",
      ...SOCIAL_CREDS,
      GROK_AUTH_CLIENT_ID: "id",
      GROK_AUTH_CLIENT_SECRET: "secret",
    });
    assert.equal(r.secretOk, false);
    assert.deepEqual(r.socialProviders, []);
    assert.equal(r.brokerEnabled, false);
    assert.match(r.signInDisabledReason ?? "", /BETTER_AUTH_SECRET/);
    assert.deepEqual(enabledProviders(r), []);
  });

  it("deployed without a resolvable origin disables sign-in", () => {
    const r = resolveAuthEnv({ DATABASE_URL: "postgres://x", BETTER_AUTH_SECRET: SECRET, ...SOCIAL_CREDS });
    assert.equal(r.deployed, true);
    assert.equal(r.baseURL, undefined);
    assert.deepEqual(r.socialProviders, []);
    assert.ok(r.signInDisabledReason);
  });

  it("deployed without GROK_AUTH_* never enables the broker (no preview client)", () => {
    const r = resolveAuthEnv({
      VERCEL_ENV: "production",
      BETTER_AUTH_URL: "https://app.sendkiss.online",
      BETTER_AUTH_SECRET: SECRET,
    });
    assert.equal(r.brokerEnabled, false);
    assert.equal(r.brokerCredentials, null);
  });

  it("deployed with real GROK_AUTH_* enables the broker from env", () => {
    const r = resolveAuthEnv({
      VERCEL: "1",
      BETTER_AUTH_URL: "https://app.sendkiss.online",
      BETTER_AUTH_SECRET: SECRET,
      GROK_AUTH_CLIENT_ID: "id",
      GROK_AUTH_CLIENT_SECRET: "secret",
    });
    assert.equal(r.brokerCredentials, "env");
  });

  it("deployed with no Google/X creds reports no providers (buttons hidden)", () => {
    const r = resolveAuthEnv({
      VERCEL: "1",
      BETTER_AUTH_URL: "https://app.sendkiss.online",
      BETTER_AUTH_SECRET: SECRET,
    });
    assert.deepEqual(r.socialProviders, []);
    assert.deepEqual(enabledProviders(r), []);
  });

  it("deployed never yields a loopback baseURL", () => {
    const envs = [
      { VERCEL: "1" },
      { VERCEL: "1", BETTER_AUTH_URL: "http://localhost:8080" },
      { VERCEL_ENV: "preview", BETTER_AUTH_URL: "http://127.0.0.1:8080" },
      { DATABASE_URL: "postgres://x", VERCEL_PROJECT_PRODUCTION_URL: "app.sendkiss.online" },
    ];
    for (const e of envs) {
      const r = resolveAuthEnv({ ...e, BETTER_AUTH_SECRET: SECRET, ...SOCIAL_CREDS });
      assert.equal(r.deployed, true);
      noLoopback(r.baseURL);
      if (!r.baseURL) assert.deepEqual(r.socialProviders, []);
    }
  });

  it("not deployed keeps the dynamic preview baseURL and the preview broker client", () => {
    const r = resolveAuthEnv({});
    assert.equal(r.deployed, false);
    assert.equal(r.baseURL, undefined);
    assert.equal(r.secretOk, true);
    assert.equal(r.brokerCredentials, "preview");
    assert.deepEqual(
      enabledProviders(r).map((p) => p.id),
      ["grok-google", "grok-x"],
    );
  });

  it("VITE_AUTH_ENABLED=false disables every sign-in method", () => {
    const r = resolveAuthEnv({ VITE_AUTH_ENABLED: "false", ...SOCIAL_CREDS });
    assert.equal(r.authDisabled, true);
    assert.deepEqual(enabledProviders(r), []);
  });
});
