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
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 1200 });

  console.log("Navigating to SendKiss default store listing...");
  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/store-listings/default/edit");
  await page.waitForTimeout(6000);

  // 1. Fill Text Assets
  console.log("Filling short description and full description...");
  const inputs = await page.$$("input[type='text']");
  console.log("Found text inputs:", inputs.length);
  // input 0 is App name, input 1 is Short description
  if (inputs.length >= 2) {
    await inputs[1].fill("Send digital haptic kisses, sweet sounds & love streaks to your partner.");
    console.log("Filled short description.");
  }

  const textareas = await page.$$("textarea");
  if (textareas.length >= 1) {
    const fullDesc = `Welcome to SendKiss — the sweetest and most interactive way to stay close to the people you love!

Whether you are in a long-distance relationship, missing your partner, or just want to send a warm romantic gesture, SendKiss lets you deliver personalized digital kisses with real haptic feedback, custom sound effects, and vibrant animated kiss styles.

Key Features:
💋 Instant Interactive Kisses: Send and receive kisses that light up your screen with authentic haptics and touch animations.
🎨 Custom Kiss Styles: Choose from classic red lipstick, glowing neon, glitter, hearts, and seasonal themes.
🔊 Romantic Sound Effects: Pair each kiss with romantic audio messages or sweet audio notes.
📱 Stay Connected: Perfect for couples, long-distance relationships, family, and best friends.
🔒 Private & Secure: Your intimate moments are protected with complete privacy.

Download SendKiss today and send some love to someone special!`;
    await textareas[0].fill(fullDesc);
    console.log("Filled full description.");
  }

  // 2. Remove old phone screenshots if present
  console.log("Removing bad existing screenshots...");
  while (true) {
    const removeButtons = await page.$$("button[aria-label*='Remove' i], button[aria-label*='מחק' i], button[aria-label*='הסר' i]");
    let clickedAny = false;
    for (const btn of removeButtons) {
      const label = await btn.getAttribute("aria-label");
      if (label && (label.includes("Phone_Screenshot") || label.includes("Feature_Graphic") || label.includes("1_App_Icon"))) {
        console.log("Clicking remove for:", label);
        try {
          await btn.click();
          await page.waitForTimeout(1500);
          clickedAny = true;
          break; // break inner loop to re-query fresh handles
        } catch (e) {
          console.log("Error clicking remove, will retry:", e.message);
        }
      }
    }
    if (!clickedAny) {
      console.log("No more bad assets to remove.");
      break;
    }
  }

  await page.waitForTimeout(2000);

  // 3. Helper function to upload an asset via the side-drawer
  async function uploadInDrawer(addAssetButton, filePaths) {
    console.log("Clicking Add assets button...");
    await addAssetButton.click();
    await page.waitForTimeout(3000);

    // Look for Upload button in the drawer: at the bottom left of the drawer
    const uploadBtn = await page.$("button:has-text('Upload')");
    if (!uploadBtn) {
      console.error("Upload button not found in drawer!");
      return;
    }

    console.log("Found Upload button in drawer, triggering filechooser...");
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadBtn.click()
    ]);

    console.log("Setting files in fileChooser:", filePaths);
    await fileChooser.setFiles(filePaths);
    console.log("Files set, waiting 8s for upload to process...");
    await page.waitForTimeout(8000);

    // Check if there is an "Apply" button or "Save" button in the drawer
    const applyBtn = await page.$("button:has-text('Apply'), button:has-text('Insert'), button:has-text('Select'), button:has-text('Done')");
    if (applyBtn && !(await applyBtn.isDisabled())) {
      console.log("Clicking Apply/Done in drawer...");
      await applyBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // Check if drawer can be closed with close button (X)
      console.log("Checking for drawer close button...");
      const closeBtn = await page.$("button[aria-label='Close' i], button[aria-label='סגור' i], button:has-text('close')");
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  }

  // 4. Find all "Add assets" buttons
  let addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Found 'Add assets' buttons count:", addButtons.length);

  // Button 0: App icon
  if (addButtons.length >= 1) {
    console.log("--- Uploading App Icon ---");
    await uploadInDrawer(addButtons[0], "/Users/naoryanko/kiss/store_assets/sendkiss_icon_512.png");
  }

  await page.waitForTimeout(2000);
  addButtons = await page.$$("button:has-text('Add assets')");

  // Button 1: Feature graphic
  if (addButtons.length >= 2) {
    console.log("--- Uploading Feature Graphic ---");
    await uploadInDrawer(addButtons[1], "/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png");
  }

  await page.waitForTimeout(2000);
  addButtons = await page.$$("button:has-text('Add assets')");

  // Button 2: Phone screenshots
  if (addButtons.length >= 3) {
    console.log("--- Uploading Phone Screenshots ---");
    await uploadInDrawer(addButtons[2], [
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
    ]);
  }

  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/after_upload_all.png", fullPage: true });
  console.log("Saved fullPage screenshot after uploads.");

  // Check Save as draft or Next
  const saveBtn = await page.$("button:has-text('Save as draft'), button:has-text('Save')");
  const nextBtn = await page.$("button:has-text('Next')");

  console.log("Save button disabled?", saveBtn ? await saveBtn.isDisabled() : "not found");
  console.log("Next button disabled?", nextBtn ? await nextBtn.isDisabled() : "not found");

  if (saveBtn && !(await saveBtn.isDisabled())) {
    console.log("Clicking Save as draft...");
    await saveBtn.click();
    await page.waitForTimeout(4000);
  }

  if (nextBtn && !(await nextBtn.isDisabled())) {
    console.log("Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/after_next_click.png" });

    // Look for Save / Submit on the Review tab
    const finalSave = await page.$("button:has-text('Save')");
    if (finalSave && !(await finalSave.isDisabled())) {
      console.log("Clicking Final Save on Review step...");
      await finalSave.click();
      await page.waitForTimeout(4000);
    }
  }

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/final_state.png" });
  console.log("Done!");

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
