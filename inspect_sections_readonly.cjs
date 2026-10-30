const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

function allowOnce() {
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
}

(async () => {
  const interval = setInterval(allowOnce, 400);
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  clearInterval(interval);

  const page = browser.contexts()[0].pages()[0];
  // Reload cleanly to dismiss the Google Drive modal and reset viewport
  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/store-listings/default/edit", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  const sections = await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.trim() === "Add assets");
    return addBtns.map((btn, idx) => {
      // Walk up to find the nearest section/header text
      let el = btn;
      let contextText = "";
      for (let i = 0; i < 6 && el; i++) {
        el = el.parentElement;
        if (el && el.innerText) {
          const lines = el.innerText.split("\n").map(l => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            contextText = lines.slice(0, 4).join(" | ");
            if (contextText.length > 20) break;
          }
        }
      }
      return { idx, contextText };
    });
  });

  console.log("Add assets buttons with context:", JSON.stringify(sections, null, 2));
  await browser.close();
  process.exit(0);
})();
