const fs = require("fs");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages.find(p => p.url().includes("store-listings")) || pages[0];
  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/live_snap.png" });
  process.exit(0);
})();
