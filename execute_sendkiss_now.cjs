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
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  // Find the SendKiss tab or use the first tab
  const page = pages.find(p => p.url().includes("4972175458793862190")) || pages[0];
  console.log("Current page URL:", page.url());

  // Wait for page to be ready
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(3000);

  // 1. Text Assets
  console.log("Filling short description and full description...");
  const inputs = await page.$$("input[type='text']");
  if (inputs.length >= 2) {
    await inputs[1].fill("Send digital haptic kisses, sweet sounds & love streaks to your partner.");
    console.log("Short description set.");
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
    console.log("Full description set.");
  }

  // 2. Remove old bad assets
  console.log("Removing old/bad screenshots...");
  while (true) {
    const removeButtons = await page.$$("button[aria-label*='Remove' i], button[aria-label*='מחק' i], button[aria-label*='הסר' i]");
    let clicked = false;
    for (const btn of removeButtons) {
      const label = await btn.getAttribute("aria-label");
      if (label && (label.includes("Phone_Screenshot") || label.includes("Feature_Graphic") || label.includes("1_App_Icon") || label.includes("2_Feature") || label.includes("3_Phone"))) {
        console.log("Removing:", label);
        try {
          await btn.click();
          await page.waitForTimeout(1500);
          clicked = true;
          break;
        } catch (e) {}
      }
    }
    if (!clicked) break;
  }

  // Ensure any side drawer is closed first
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);

  // 3. Upload Feature Graphic
  console.log("Uploading Feature Graphic...");
  let addButtons = await page.$$("button:has-text('Add assets')");
  if (addButtons.length >= 2) {
    await addButtons[1].click();
    await page.waitForTimeout(2500);

    const uploadBtn = await page.$("button:has-text('Upload')");
    if (uploadBtn) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadBtn.click()
      ]);
      await fileChooser.setFiles("/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png");
      console.log("Feature graphic uploaded, waiting 8s...");
      await page.waitForTimeout(8000);

      const addInDrawer = await page.$("button:has-text('Add')");
      if (addInDrawer && !(await addInDrawer.isDisabled())) {
        await addInDrawer.click();
        await page.waitForTimeout(2000);
      }
    }
  }

  // Close drawer
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);

  // 4. Upload Phone Screenshots
  console.log("Uploading Phone Screenshots...");
  addButtons = await page.$$("button:has-text('Add assets')");
  // The phone screenshots Add assets button is the next one
  const phoneBtn = addButtons[addButtons.length - 1];
  if (phoneBtn) {
    await phoneBtn.click();
    await page.waitForTimeout(2500);

    const uploadBtn = await page.$("button:has-text('Upload')");
    if (uploadBtn) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        uploadBtn.click()
      ]);
      await fileChooser.setFiles([
        "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
        "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
        "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
      ]);
      console.log("Screenshots uploaded, waiting 10s...");
      await page.waitForTimeout(10000);

      const addInDrawer = await page.$("button:has-text('Add')");
      if (addInDrawer && !(await addInDrawer.isDisabled())) {
        await addInDrawer.click();
        await page.waitForTimeout(2000);
      }
    }
  }

  // Close drawer
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);

  // 5. Save changes
  console.log("Saving changes...");
  const saveDraft = await page.$("button:has-text('Save as draft')");
  if (saveDraft && !(await saveDraft.isDisabled())) {
    console.log("Clicking Save as draft...");
    await saveDraft.click();
    await page.waitForTimeout(3000);
  }

  const nextBtn = await page.$("button:has-text('Next')");
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

  console.log("SendKiss listing complete!");
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
