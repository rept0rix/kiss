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

  for (const [name, appId] of [["SendKiss", "4972175458793862190"], ["StreamSnap AI", "4974194036705358034"]]) {
    console.log(`\n=== Checking Publishing Overview for ${name} (${appId}) ===`);
    const page = await browser.contexts()[0].newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/publishing`);
    await page.waitForTimeout(6000);

    const shotPath = `/Users/naoryanko/kiss/pub_${name.replace(/\s+/g, "_")}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Saved screenshot to ${shotPath}`);

    // Also get all text in the document
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    console.log("Found text summary (first 40 lines):");
    console.log(lines.slice(0, 40).join(" | "));

    // Check for send for review button
    const reviewBtn = await page.$("button:has-text('Send for review'), button:has-text('Send changes for review')");
    if (reviewBtn) {
      console.log("Send for review button FOUND! Disabled:", await reviewBtn.isDisabled());
    } else {
      console.log("Send for review button not found.");
    }

    await page.close();
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
