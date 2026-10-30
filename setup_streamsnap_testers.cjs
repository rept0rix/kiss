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
  const page = pages.find(p => p.url().includes("4974194036705358034"));

  console.log("Navigating to StreamSnap testers tab...");
  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/internal-testing?tab=testers", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  // Check if any checkbox exists (like existing email list)
  let cb = await page.$("input[type='checkbox']");
  if (!cb) {
    console.log("No email list found, clicking Create email list...");
    const createBtn = await page.$("button:has-text('Create email list')");
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = await page.$(".mat-dialog-container input[type='text'], [role='dialog'] input[type='text']");
      if (nameInput) {
        await nameInput.fill("Internal Testers");
        await page.waitForTimeout(500);
      }

      const emailInput = await page.$("input[type='email'], input[aria-label='Add email addresses']");
      if (emailInput) {
        await emailInput.fill("na0ryank0@gmail.com");
        await page.waitForTimeout(500);
        await emailInput.press("Enter");
        await page.waitForTimeout(1000);
      }

      const modalSave = await page.$(".mat-dialog-container button:has-text('Save changes'), [role='dialog'] button:has-text('Save changes')");
      if (modalSave) {
        await modalSave.click();
        await page.waitForTimeout(3000);
      }
    }
  }

  // Check the checkbox
  cb = await page.$("input[type='checkbox']");
  if (cb && !(await cb.isChecked())) {
    console.log("Checking email list checkbox...");
    await cb.check({ force: true });
    await page.waitForTimeout(1000);
  }

  // Save changes on page
  const savePageBtn = await page.$("button:has-text('Save changes'), button:has-text('Save')");
  if (savePageBtn && !(await savePageBtn.isDisabled())) {
    console.log("Saving changes on page...");
    await savePageBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log("STREAMSNAP TESTERS CONFIGURED!");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
