import type { GrokHeadContext } from "../../scripts/grok-pwa-shared.mjs";

export declare function hasOwnOgImage(head: string): boolean;
export declare function injectPwaOnly(head: string, ctx?: GrokHeadContext): string;
export declare function createShareAwareHeadInjector(ctx?: GrokHeadContext): {
  push(chunk: Uint8Array | string): Uint8Array[];
  flush(): Uint8Array[];
};
