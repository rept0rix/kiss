const fs = require("fs");
const { execSync, exec } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

function autoAllow() {
  const s = `tell application "System Events" to tell process "Comet"
repeat with w in windows
  try
    repeat with g in groups of w
      try
        click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of g
      end try
    end repeat
  end try
  try
    repeat with s in sheets of w
      try
        click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of s
      end try
    end repeat
  end try
end repeat
end tell`;
  try { execSync(`osascript -e '${s}'`, { stdio: "ignore" }); } catch (e) {}
  return setInterval(() => { exec(`osascript -e '${s}'`, () => {}); }, 500);
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const context = browser.contexts()[0];
  const pages = context.pages();
  const page = pages.find(p => p.url().includes("store-listings")) || pages[0];

  console.log("Using page URL:", page.url());
  await page.setViewportSize({ width: 1440, height: 1200 });

  // Make sure we are on default edit
  if (!page.url().includes("4972175458793862190/store-listings/default/edit")) {
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/store-listings/default/edit");
    await page.waitForTimeout(6000);
  }

  // Scroll to Feature graphic
  console.log("Finding Feature graphic section...");
  const addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Add assets buttons:", addButtons.length);

  // Let's click the second Add assets button (Feature graphic)
  if (addButtons.length >= 2) {
    console.log("Clicking Add assets for Feature graphic...");
    await addButtons[1].click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/drawer_opened.png" });

    // Look for Upload button
    const uploadBtn = await page.$("button:has-text('Upload')");
    console.log("Upload button found?", !!uploadBtn);

    if (uploadBtn) {
      console.log("Triggering filechooser...");
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadBtn.click()
      ]);
      console.log("Uploading sendkiss_feature_1024x500.png...");
      await fileChooser.setFiles("/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png");
      console.log("Waiting 6 seconds...");
      await page.waitForTimeout(6000);

      await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/after_feature_upload.png" });
      console.log("Screenshot after upload saved!");

      // List all buttons in the drawer or dialog
      const drawerButtons = await page.$$eval("button", els => els.map(e => e.innerText.trim()).filter(Boolean));
      console.log("All buttons now:", drawerButtons);
    }
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
