const fs = require("fs");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625, // Gives 1080 x 2400 resolution!
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log("Navigating to https://online.sendkiss.app...");
  try {
    await page.goto("https://online.sendkiss.app", { waitUntil: "networkidle", timeout: 15000 });
  } catch (e) {
    console.log("Goto error or timeout:", e.message);
  }
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/real_sendkiss_1.png" });
  console.log("Saved real_sendkiss_1.png");

  // Try clicking something or interacting
  const buttons = await page.$$("button");
  console.log("Found buttons:", buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    console.log(`Button ${i}:`, (await buttons[i].innerText()).trim());
  }

  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
