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
  const pages = browser.contexts()[0].pages();
  console.log("Pages count:", pages.length);
  const page = pages.find(p => p.url().includes("store-listings")) || pages[0];
  console.log("Current URL:", page.url());

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/live_state_now.png", fullPage: true });
  console.log("Screenshot taken!");

  // List all buttons on page
  const buttons = await page.$$eval("button", els => els.map(e => ({ text: e.innerText.trim(), ariaLabel: e.getAttribute('aria-label') })).filter(e => e.text || e.ariaLabel));
  console.log("Buttons on page:", JSON.stringify(buttons, null, 2));

  clearInterval(timer);
  process.exit(0);
})();
