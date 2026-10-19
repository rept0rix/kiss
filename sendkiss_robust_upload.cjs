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

async function cleanOverlays(page) {
  await page.evaluate(() => {
    const stray = document.querySelectorAll("iframe.onepick-dialog-bg, iframe[src*='picker'], .picker-dialog, .picker-dialog-bg, .picker-modal");
    stray.forEach(el => el.remove());
  });
}

async function uploadAndInsert(page, targetButton, files) {
  await cleanOverlays(page);
  console.log("Clicking Add assets button (force: true)...");
  await targetButton.click({ force: true });
  await page.waitForTimeout(2500);

  const uploadBtn = await page.$("material-drawer button:has-text('Upload')");
  if (uploadBtn) {
    console.log("Found Upload button in drawer, triggering filechooser...");
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadBtn.click({ force: true })
    ]);
    console.log("Uploading files:", files);
    await fileChooser.setFiles(files);
    console.log("Files set, waiting 10s for upload...");
    await page.waitForTimeout(10000);

    const addInDrawer = await page.$("material-drawer button:has-text('Add')");
    if (addInDrawer && !(await addInDrawer.isDisabled())) {
      console.log("Clicking Add button in drawer...");
      await addInDrawer.click({ force: true });
      await page.waitForTimeout(2500);
    }
  }

  // Close drawer
  const closeBtn = await page.$("material-drawer button[debug-id='close-button']");
  if (closeBtn) {
    console.log("Closing drawer...");
    await closeBtn.click({ force: true });
    await page.waitForTimeout(1500);
  }
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const page = browser.contexts()[0].pages()[0];

  await cleanOverlays(page);

  // 1. App Icon
  console.log("--- 1. App Icon ---");
  let addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Add assets count:", addButtons.length);
  if (addButtons.length >= 1) {
    await uploadAndInsert(page, addButtons[0], "/Users/naoryanko/kiss/store_assets/sendkiss_icon_512.png");
  }

  // 2. Phone Screenshots
  console.log("--- 2. Phone Screenshots ---");
  await page.waitForTimeout(2000);
  addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Add assets count now:", addButtons.length);
  if (addButtons.length >= 1) {
    const phoneBtn = addButtons[addButtons.length - 1];
    await uploadAndInsert(page, phoneBtn, [
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
    ]);
  }

  await page.waitForTimeout(3000);

  // 3. Save as draft
  console.log("--- 3. Saving Store Listing ---");
  const saveDraft = await page.$("button:has-text('Save as draft')");
  if (saveDraft && !(await saveDraft.isDisabled())) {
    console.log("Clicking Save as draft...");
    await saveDraft.click({ force: true });
    await page.waitForTimeout(3000);
  }

  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Next disabled?", nextBtn ? await nextBtn.isDisabled() : "not found");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    console.log("Clicking Next...");
    await nextBtn.click({ force: true });
    await page.waitForTimeout(4000);

    const finalSave = await page.$("button:has-text('Save')");
    if (finalSave && !(await finalSave.isDisabled())) {
      console.log("Clicking Final Save on Review step...");
      await finalSave.click({ force: true });
      await page.waitForTimeout(4000);
    }
  }

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/sendkiss_complete_final.png" });
  console.log("Done SendKiss!");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
