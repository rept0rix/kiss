const fs = require("fs");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages.find(p => p.url().includes("store-listings")) || pages[0];

  // Click the first "Add assets" button
  const addBtn = await page.$("button:has-text('Add assets')");
  if (addBtn) {
    console.log("Clicking Add assets...");
    await addBtn.click();
    await page.waitForTimeout(3000);
  }

  // Get all text/items in the drawer
  const items = await page.$$eval("div, span, button", els => {
    return els
      .filter(e => e.innerText && (e.innerText.includes(".png") || e.innerText.includes(".jpg") || e.innerText.includes("sendkiss")))
      .map(e => e.innerText.trim().slice(0, 50));
  });
  console.log("Drawer items:", Array.from(new Set(items)));

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/drawer_items.png", fullPage: true });
  console.log("Screenshot saved to drawer_items.png");

  process.exit(0);
})();
