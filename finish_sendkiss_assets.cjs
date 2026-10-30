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

async function uploadAndInsert(page, addBtn, files) {
  console.log("Clicking Add assets button...");
  await addBtn.click();
  await page.waitForTimeout(2500);

  const uploadBtn = await page.$("material-drawer button:has-text('Upload')");
  if (uploadBtn) {
    console.log("Found Upload button in drawer, opening file chooser...");
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadBtn.click()
    ]);
    console.log("Setting files:", files);
    await fileChooser.setFiles(files);
    console.log("Waiting 10s for upload...");
    await page.waitForTimeout(10000);

    const addInDrawer = await page.$("material-drawer button:has-text('Add')");
    if (addInDrawer && !(await addInDrawer.isDisabled())) {
      console.log("Clicking Add button in drawer...");
      await addInDrawer.click();
      await page.waitForTimeout(2500);
    }
  }

  // Close drawer
  const closeBtn = await page.$("material-drawer button[debug-id='close-button']");
  if (closeBtn) {
    console.log("Closing drawer...");
    await closeBtn.click();
    await page.waitForTimeout(1500);
  }
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const page = browser.contexts()[0].pages()[0];

  // 1. App Icon
  console.log("--- 1. Uploading App Icon ---");
  let addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Add assets count:", addButtons.length);
  if (addButtons.length >= 1) {
    await uploadAndInsert(page, addButtons[0], "/Users/naoryanko/kiss/store_assets/sendkiss_icon_512.png");
  }

  // 2. Phone Screenshots
  console.log("--- 2. Uploading Phone Screenshots ---");
  addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Add assets count now:", addButtons.length);
  // Phone screenshots is the last Add assets button
  if (addButtons.length >= 1) {
    const phoneAddBtn = addButtons[addButtons.length - 1];
    await uploadAndInsert(page, phoneAddBtn, [
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
    ]);
  }

  await page.waitForTimeout(3000);

  // 3. Save as draft or Next
  console.log("--- 3. Saving Changes ---");
  const saveDraft = await page.$("button:has-text('Save as draft')");
  if (saveDraft && !(await saveDraft.isDisabled())) {
    console.log("Clicking Save as draft...");
    await saveDraft.click();
    await page.waitForTimeout(3000);
  }

  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Next button disabled?", nextBtn ? await nextBtn.isDisabled() : "not found");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    console.log("Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(4000);

    const finalSave = await page.$("button:has-text('Save')");
    if (finalSave && !(await finalSave.isDisabled())) {
      console.log("Clicking Final Save on Review step...");
      await finalSave.click();
      await page.waitForTimeout(4000);
    }
  }

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/sendkiss_fully_saved.png" });
  console.log("Finished SendKiss!");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
