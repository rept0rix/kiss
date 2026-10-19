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
  let page;
  for (const p of browser.contexts()[0].pages()) {
    if (p.url().includes("4972175458793862190")) {
      page = p;
      break;
    }
  }

  // Find the moreBtn using playwright locator and click with actual mouse coordinates!
  const rows = await page.$$("tr, [role='row']");
  for (const r of rows) {
    const text = await r.innerText();
    if ((text.includes("1 (1.0)") || text.includes("API 35")) && !text.includes("2 (1.0.1)")) {
      const moreBtn = await r.$("button:has-text('more_vert'), [aria-label*='Manage artifact']");
      if (moreBtn) {
        console.log("Found moreBtn via selector, box:", await moreBtn.boundingBox());
        await moreBtn.click(); // Real playwright click with mouse events
        await page.waitForTimeout(1000);
        break;
      }
    }
  }

  // Dump entire overlay container or any popup
  const overlayText = await page.evaluate(() => {
    const overlay = document.querySelector(".cdk-overlay-container");
    if (overlay) {
      return {
        html: overlay.innerHTML.slice(0, 1000),
        text: overlay.innerText
      };
    }
    return "No .cdk-overlay-container";
  });
  console.log("Overlay container:\n", JSON.stringify(overlayText, null, 2));

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
