const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625, // Produces exact 1080 x 2400 high resolution!
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:8080/...");
  await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Take screenshot 1: Home / Main Screen
  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/sendkiss_real_1.png" });
  console.log("Saved sendkiss_real_1.png");

  // Inspect buttons, links, tabs
  const interactive = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a, [role='button'], [role='tab']")).map(b => ({
      text: (b.innerText || "").trim().slice(0, 40),
      tag: b.tagName
    })).filter(b => b.text.length > 0);
  });
  console.log("Interactive elements:", JSON.stringify(interactive.slice(0, 15), null, 2));

  // Try to click around to explore other tabs / views
  for (const label of ["lips", "Lips", "Customize", "History", "Friends", "Live", "profile"]) {
    const el = await page.$(`text='${label}'`);
    if (el) {
      console.log(`Clicking ${label}...`);
      await el.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/Users/naoryanko/kiss/store_assets/sendkiss_real_${label}.png` });
      console.log(`Saved screenshot for ${label}`);
    }
  }

  // Also check other routes: /live, /profile, /friends
  for (const r of ["/live", "/profile", "/friends"]) {
    try {
      await page.goto(`http://localhost:8080${r}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/Users/naoryanko/kiss/store_assets/sendkiss_real_route_${r.replace('/', '')}.png` });
      console.log(`Saved route ${r}`);
    } catch(e) {}
  }

  await browser.close();
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
