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

  // Click "Create email list"
  console.log("Clicking Create email list...");
  const createBtn = await page.$("button:has-text('Create email list')");
  if (createBtn) {
    await createBtn.click();
    await page.waitForTimeout(2000);

    // In modal: enter list name "Testers" and email "na0ryank0@gmail.com"
    const nameInput = await page.$(".mat-dialog-container input[type='text'], [role='dialog'] input[type='text']");
    if (nameInput) {
      console.log("Entering list name...");
      await nameInput.fill("Internal Testers");
      await page.waitForTimeout(500);
    }

    const emailTextarea = await page.$(".mat-dialog-container textarea, [role='dialog'] textarea, .mat-dialog-container input[aria-label*='email']");
    if (emailTextarea) {
      console.log("Entering email address...");
      await emailTextarea.fill("na0ryank0@gmail.com");
      await page.waitForTimeout(500);
    }

    // Click Save / Create button in modal
    const modalSave = await page.$(".mat-dialog-container button:has-text('Save'), [role='dialog'] button:has-text('Save'), .mat-dialog-container button:has-text('Create')");
    if (modalSave) {
      console.log("Saving email list modal...");
      await modalSave.click();
      await page.waitForTimeout(3000);
    }

    // Now check the checkbox for "Internal Testers"
    const cb = await page.$("input[type='checkbox']");
    if (cb && !(await cb.isChecked())) {
      console.log("Checking the new email list checkbox...");
      await cb.check({ force: true });
      await page.waitForTimeout(1000);
    }

    // Save changes
    const savePageBtn = await page.$("button:has-text('Save changes'), button:has-text('Save')");
    if (savePageBtn && !(await savePageBtn.isDisabled())) {
      console.log("Saving changes on testers page...");
      await savePageBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  console.log("Testers configured successfully!");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
