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

  console.log("Setting input files directly on input[type='file']...");
  await page.setInputFiles("input[type='file']", "/Users/naoryanko/kiss/store_assets/sendkiss_icon_512.png");
  console.log("Input files set! Waiting 8s for upload...");
  await page.waitForTimeout(8000);

  // Check drawer items to see if sendkiss_icon_512.png appeared
  const drawerItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("material-drawer *"))
      .filter(el => (el.innerText || "").includes("sendkiss_icon_512"))
      .map(el => el.innerText.slice(0, 40));
  });
  console.log("Drawer items matching sendkiss_icon_512:", drawerItems);

  // If there's an Add button, click it
  const addBtn = await page.$("material-drawer button:has-text('Add')");
  console.log("Add button enabled?", addBtn ? !(await addBtn.isDisabled()) : "no add button");
  if (addBtn && !(await addBtn.isDisabled())) {
    console.log("Clicking Add button in drawer...");
    await addBtn.click();
    await page.waitForTimeout(2000);
  }

  // Close drawer
  const closeBtn = await page.$("material-drawer button[debug-id='close-button']");
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/direct_input_result.png" });
  console.log("Screenshot saved to direct_input_result.png");

  clearInterval(timer);
  process.exit(0);
})();
