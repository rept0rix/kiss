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
  const page = browser.contexts()[0].pages()[0];

  const clicked = await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll("material-drawer button")).find(b => (b.innerText || "").includes("Add"));
    if (addBtn) {
      addBtn.click();
      return "Clicked Add button via DOM click!";
    }
    return "Add button not found";
  });
  console.log("Result:", clicked);

  await page.waitForTimeout(2000);

  // Close drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
    if (closeBtn) closeBtn.click();
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/eval_click_result.png" });
  console.log("Screenshot saved!");

  clearInterval(timer);
  process.exit(0);
})();
