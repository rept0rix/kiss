/**
 * Wraps the platform head injector (scripts/grok-pwa-shared.mjs) so a page
 * that sets its own og:image — per-link invite previews on /k/<code> — keeps
 * its share metas. The platform injector strips every og/twitter tag and
 * writes the site defaults, which made WhatsApp show the generic card.
 *
 * Kept outside scripts/ so a platform sync of the shared script cannot undo it.
 */
import {
  createHeadInjector,
  escapeHtml,
  grokExtensionsHeadTags,
  grokPwaHeadTags,
  normalizeHeadContext,
} from "../../scripts/grok-pwa-shared.mjs";

const OWN_OG_IMAGE = /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*\bcontent\s*=\s*["'][^"']+["']/i;

export function hasOwnOgImage(head) {
  return OWN_OG_IMAGE.test(String(head));
}

/** PWA chrome only; the page's share metas are left exactly as rendered. */
export function injectPwaOnly(head, ctx = {}) {
  const { appName, projectId } = normalizeHeadContext(ctx);
  const html = String(head);
  const missing = grokPwaHeadTags(appName)
    .filter(([key]) => {
      if (key === "manifest") return !html.includes('href="/__grok/manifest.webmanifest"');
      if (key === "apple-touch-icon") return !html.includes('href="/__grok/icon-180.png"');
      return !html.includes(`name="${key}"`);
    })
    .map(([, tag]) => tag);
  if (!html.includes("/grok-app-builder/extensions.js")) {
    missing.push(...grokExtensionsHeadTags(projectId));
  }
  if (projectId && !html.includes('property="grok:app_id"')) {
    missing.push(`<meta property="grok:app_id" content="${escapeHtml(projectId)}">`);
  }
  return html + missing.join("");
}

/** Same streaming contract as createHeadInjector: buffer until `</head>`, then pass through. */
export function createShareAwareHeadInjector(ctx = {}) {
  const platform = createHeadInjector(ctx);
  /** @type {Buffer[]} */
  let pending = [];
  /** @type {null | "own" | "platform"} */
  let mode = null;

  return {
    /** @param {Uint8Array | string} chunk */
    push(chunk) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (mode === "platform") return platform.push(buf);
      if (mode === "own") return [buf];
      pending.push(buf);
      const joined = Buffer.concat(pending);
      const at = joined.toString("latin1").search(/<\/head>/i);
      if (at === -1) return [];
      pending = [];
      const head = joined.subarray(0, at).toString("utf8");
      if (!hasOwnOgImage(head)) {
        mode = "platform";
        return platform.push(joined);
      }
      mode = "own";
      return [Buffer.from(injectPwaOnly(head, ctx), "utf8"), joined.subarray(at)];
    },
    flush() {
      if (mode === "platform") return platform.flush();
      if (mode === "own" || pending.length === 0) return [];
      const rest = Buffer.concat(pending);
      pending = [];
      mode = "platform";
      return [...platform.push(rest), ...platform.flush()];
    },
  };
}
