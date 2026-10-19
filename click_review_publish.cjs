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

  console.log("Current page URL:", page.url());

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a[role='button']"))
      .map(b => ({
        text: b.innerText.trim(),
        aria: b.getAttribute("aria-label"),
        disabled: b.disabled || b.getAttribute("aria-disabled") === "true",
        rect: b.getBoundingClientRect()
      }))
      .filter(b => b.text.includes("publish") || b.text.includes("Save") || b.text.includes("rollout") || b.text.includes("Rollout"));
  });
  console.log("Publish/Save buttons found:\n", JSON.stringify(buttons, null, 2));

  // Click the enabled Save and publish button
  for (const b of buttons) {
    if (!b.disabled && (b.text.includes("Save and publish") || b.text.includes("rollout") || b.text.includes("Rollout"))) {
      console.log("Clicking button:", b.text);
      const clicked = await page.evaluate((btnText) => {
        const all = Array.from(document.querySelectorAll("button"));
        const target = all.find(el => el.innerText.trim() === btnText && !el.disabled);
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, b.text);
      console.log("Clicked result:", clicked);
      await page.waitForTimeout(3000);

      // Check for confirm modal
      const confirmModal = await page.evaluate(() => {
        const dialogBtns = Array.from(document.querySelectorAll(".mat-dialog-container button, [role='dialog'] button"));
        for (const btn of dialogBtns) {
          const t = btn.innerText.trim();
          if (t.includes("Save and publish") || t.includes("Rollout") || t.includes("Publish") || t.includes("Save")) {
            btn.click();
            return "Clicked dialog button: " + t;
          }
        }
        return "No dialog button found, dialogs: " + dialogBtns.map(b => b.innerText.trim()).join(", ");
      });
      console.log("Confirm modal result:", confirmModal);
      await page.waitForTimeout(4000);
      break;
    }
  }

  console.log("URL after publish:", page.url());

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
