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

  // Select the feature graphic item in the drawer
  console.log("Selecting sendkiss_feature_1024x500.png in drawer...");
  const item = await page.$("material-drawer material-select-item:has-text('sendkiss_feature_1024x500.png'), material-drawer [role='option']:has-text('sendkiss_feature_1024x500.png'), material-drawer li:has-text('sendkiss_feature_1024x500.png'), material-drawer div:has-text('sendkiss_feature_1024x500.png')");
  if (item) {
    await item.click();
    await page.waitForTimeout(1000);
  }

  // Look for Add button in drawer
  const addBtn = await page.$("material-drawer button:has-text('Add')");
  console.log("Add button in drawer found?", !!addBtn);
  if (addBtn && !(await addBtn.isDisabled())) {
    console.log("Clicking Add button in drawer...");
    await addBtn.click();
    await page.waitForTimeout(2000);
  }

  // Close drawer
  const closeBtn = await page.$("material-drawer button[debug-id='close-button']");
  if (closeBtn) {
    console.log("Closing drawer...");
    await closeBtn.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/feature_added_check.png" });
  console.log("Saved screenshot!");

  clearInterval(timer);
  process.exit(0);
})();
