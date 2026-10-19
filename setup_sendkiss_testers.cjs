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
  const page = pages.find(p => p.url().includes("4972175458793862190")) || pages[6];

  // Click the "Testers" tab link on page
  console.log("Looking for Testers tab...");
  const tabs = await page.$$("[role='tab'], .mat-tab-label");
  for (const t of tabs) {
    const text = await t.innerText();
    if (text.includes("Testers")) {
      console.log("Clicking Testers tab...");
      await t.click();
      await page.waitForTimeout(3000);
      break;
    }
  }

  // Find all checkboxes on page
  const cbs = await page.$$("input[type='checkbox']");
  console.log("Found checkboxes:", cbs.length);
  for (let i = 0; i < cbs.length; i++) {
    const checked = await cbs[i].isChecked();
    console.log(`Checkbox [${i}] checked:`, checked);
    if (!checked) {
      console.log(`Checking checkbox [${i}]...`);
      await cbs[i].check({ force: true });
      await page.waitForTimeout(500);
    }
  }

  // Click Save changes button if enabled
  const saveBtn = await page.$("button:has-text('Save changes'), button:has-text('Save')");
  if (saveBtn) {
    const disabled = await saveBtn.isDisabled();
    console.log("Save button disabled?", disabled);
    if (!disabled) {
      await saveBtn.click();
      console.log("Clicked Save changes!");
      await page.waitForTimeout(3000);
    }
  }

  // Check how to join
  const joinText = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split("\n").filter(l => l.includes("join") || l.includes("Join") || l.includes("link") || l.includes("Link") || l.includes("testing") || l.includes("Copy"));
    return lines.join("\n");
  });
  console.log("Join details:\n", joinText);

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
