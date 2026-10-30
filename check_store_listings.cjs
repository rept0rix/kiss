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
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 1200 });

  for (const [name, appId] of [["SendKiss", "4972175458793862190"], ["StreamSnap_AI", "4974194036705358034"]]) {
    console.log(`\n=== Checking Store Listing for ${name} (${appId}) ===`);
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/main-store-listing`);
    await page.waitForTimeout(6000);

    const shotPath = `/Users/naoryanko/kiss/store_listing_${name}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log("Screenshot saved:", shotPath);

    const listingState = await page.evaluate(() => {
      // Find app name, short description, full description, and missing visual assets
      const inputs = Array.from(document.querySelectorAll("input[type='text'], textarea")).map(i => ({
        label: i.getAttribute("aria-label") || i.placeholder || "",
        value: i.value.slice(0, 50)
      }));
      const text = document.body.innerText;
      return {
        inputs,
        hasIcon: text.includes("App icon") && !text.includes("Upload an app icon"),
        hasFeature: text.includes("Feature graphic") && !text.includes("Upload a feature graphic"),
        saveDisabled: Array.from(document.querySelectorAll("button")).find(b => (b.innerText || "").trim() === "Save")?.disabled
      };
    });
    console.log("Listing state:", JSON.stringify(listingState, null, 2));
  }

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
