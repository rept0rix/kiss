import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_SHARE_ORIGIN, resolveShareOrigin } from "./share-origin.ts";

describe("resolveShareOrigin", () => {
  it("maps a pinned *.vercel.app host to the canonical domain in production", () => {
    assert.equal(
      resolveShareOrigin({ pinned: "kiss-pied.vercel.app", vercelEnv: "production", host: "kiss-pied.vercel.app" }),
      CANONICAL_SHARE_ORIGIN,
    );
    assert.equal(resolveShareOrigin({ pinned: "kiss-pied.vercel.app" }), CANONICAL_SHARE_ORIGIN);
  });

  it("keeps a pinned custom domain", () => {
    assert.equal(
      resolveShareOrigin({ pinned: "App.SendKiss.online", vercelEnv: "production" }),
      "https://app.sendkiss.online",
    );
  });

  it("ignores the pin on Vercel previews and points at the preview itself", () => {
    assert.equal(
      resolveShareOrigin({
        pinned: "kiss-pied.vercel.app",
        vercelEnv: "preview",
        host: "kiss-git-cursor-photo-fixes-me.vercel.app",
        proto: "https",
      }),
      "https://kiss-git-cursor-photo-fixes-me.vercel.app",
    );
  });

  it("never emits a *.vercel.app request host in production", () => {
    assert.equal(
      resolveShareOrigin({ vercelEnv: "production", host: "kiss-pied.vercel.app" }),
      CANONICAL_SHARE_ORIGIN,
    );
  });

  it("uses the request host off Vercel", () => {
    assert.equal(resolveShareOrigin({ host: "localhost:3000" }), "http://localhost:3000");
    assert.equal(resolveShareOrigin({ host: "a.example.com, b", proto: "https" }), "https://a.example.com");
    assert.equal(resolveShareOrigin({ host: "bad host/" }), "");
  });
});
