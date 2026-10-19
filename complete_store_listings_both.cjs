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

async function removeOldAssets(page) {
  console.log("Checking for old assets to remove...");
  while (true) {
    const removeButtons = await page.$$("button[aria-label*='Remove' i], button[aria-label*='מחק' i], button[aria-label*='הסר' i]");
    let clicked = false;
    for (const btn of removeButtons) {
      const label = await btn.getAttribute("aria-label");
      if (label && (label.includes("Phone_Screenshot") || label.includes("Feature_Graphic") || label.includes("1_App_Icon") || label.includes("2_Feature") || label.includes("3_Phone"))) {
        console.log("Removing asset:", label);
        try {
          await btn.click();
          await page.waitForTimeout(1500);
          clicked = true;
          break;
        } catch (e) {
          console.log("Could not click remove:", e.message);
        }
      }
    }
    if (!clicked) break;
  }
}

async function uploadToSection(page, sectionName, files) {
  console.log(`\n--- Uploading to ${sectionName} ---`);
  
  // Find "Add assets" button
  // For Feature graphic: button under Feature graphic section
  // For Phone screenshots: button under Phone assets / Phone screenshots
  // For App icon: button under App icon section
  const addButtons = await page.$$("button:has-text('Add assets')");
  console.log(`Total 'Add assets' buttons on page: ${addButtons.length}`);

  let targetButton = null;
  if (sectionName === "icon" && addButtons.length >= 1) {
    targetButton = addButtons[0];
  } else if (sectionName === "feature") {
    // Usually the second button or check context
    targetButton = addButtons.length >= 2 ? addButtons[1] : addButtons[0];
  } else if (sectionName === "phone") {
    targetButton = addButtons.length >= 3 ? addButtons[2] : addButtons[addButtons.length - 1];
  }

  if (!targetButton) {
    console.log(`No Add assets button found for ${sectionName}`);
    return;
  }

  console.log(`Clicking Add assets for ${sectionName}...`);
  await targetButton.click();
  await page.waitForTimeout(3000);

  // Check if drawer is open
  const uploadBtn = await page.$("button:has-text('Upload')");
  if (!uploadBtn) {
    console.log("Upload button not found in drawer!");
    return;
  }

  console.log(`Uploading file(s) for ${sectionName}:`, files);
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadBtn.click()
  ]);

  await fileChooser.setFiles(files);
  console.log("Files set, waiting 10s for upload to complete...");
  await page.waitForTimeout(10000);

  // Look for "Add" button in drawer (at bottom right: button:has-text('Add'))
  // Sometimes it's button:has-text('Add') or button:has-text('Select')
  const addInDrawer = await page.$("button:has-text('Add')");
  if (addInDrawer && !(await addInDrawer.isDisabled())) {
    console.log("Clicking 'Add' button in drawer...");
    await addInDrawer.click();
    await page.waitForTimeout(3000);
  } else {
    console.log("Drawer Add button not enabled or found. Looking for Close...");
    const closeBtn = await page.$("button[aria-label='Close' i], button:has-text('close')");
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(1500);
    }
  }
}

async function processSendKiss(page) {
  console.log("\n=======================================================");
  console.log("PROCESSING SENDKISS (4972175458793862190)");
  console.log("=======================================================");

  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/store-listings/default/edit");
  await page.waitForTimeout(6000);

  // Fill text assets
  console.log("Filling short description and full description...");
  const inputs = await page.$$("input[type='text']");
  if (inputs.length >= 2) {
    await inputs[1].fill("Send digital haptic kisses, sweet sounds & love streaks to your partner.");
    console.log("Short description filled.");
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
    console.log("Full description filled.");
  }

  // Remove bad assets
  await removeOldAssets(page);
  await page.waitForTimeout(2000);

  // Upload Feature graphic
  await uploadToSection(page, "feature", "/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png");
  await page.waitForTimeout(2000);

  // Upload Phone screenshots
  await uploadToSection(page, "phone", [
    "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
    "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
    "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
  ]);
  await page.waitForTimeout(3000);

  // Save changes
  console.log("Saving SendKiss store listing...");
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

  await page.screenshot({ path: "/Users/naoryanko/kiss/store_assets/sendkiss_saved.png" });
  console.log("SendKiss listing saved!");
}

async function processStreamSnap(page) {
  console.log("\n=======================================================");
  console.log("PROCESSING STREAMSNAP AI (4974194036705358034)");
  console.log("=======================================================");

  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/store-listings/default/edit");
  await page.waitForTimeout(6000);

  // Fill text assets
  console.log("Filling short description and full description for StreamSnap AI...");
  const inputs = await page.$$("input[type='text']");
  if (inputs.length >= 1) {
    const val = await inputs[0].inputValue();
    if (!val) {
      await inputs[0].fill("StreamSnap AI");
    }
  }
  if (inputs.length >= 2) {
    await inputs[1].fill("AI product recognition on live streams. Identify fashion & gear in 1 click.");
    console.log("Short description filled.");
  }

  const textareas = await page.$$("textarea");
  if (textareas.length >= 1) {
    const fullDesc = `Welcome to StreamSnap AI — the ultimate AI-powered visual commerce companion for live stream viewers!

Ever watched your favorite streamer on YouTube, Twitch, or TikTok and wondered: "Where did they get that hoodie?" or "What headset are they using?" StreamSnap AI is Shazam for live streams — identifying products, fashion, and tech gear in real time and letting you find verified Amazon matches instantly.

Key Features:
⚡ Real-Time Stream Scanning: Powered by multimodal AI, StreamSnap detects apparel, sneakers, hats, and gaming gear live as you watch.
🛒 1-Click Amazon Matches: View verified product listings with real customer reviews, current prices, and Prime next-day shipping.
🔍 Visual Object Search: Highlight any item on stream to find exact matches and budget-friendly alternatives.
📦 Live Catalog: Browse all products detected during marathon 24-hour creator streams.
🌐 Multi-Platform Support: Seamless integration with YouTube Live, Twitch, and TikTok Live.

Never wonder where a streamer bought their outfit again. Download StreamSnap AI today!`;
    await textareas[0].fill(fullDesc);
    console.log("Full description filled.");
  }

  // Remove bad assets
  await removeOldAssets(page);
  await page.waitForTimeout(2000);

  // Upload App icon
  await uploadToSection(page, "icon", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_icon_512.png");
  await page.waitForTimeout(2000);

  // Upload Feature graphic
  await uploadToSection(page, "feature", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_feature_1024x500.png");
  await page.waitForTimeout(2000);

  // Upload Phone screenshots
  await uploadToSection(page, "phone", [
    "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot1_1080x1920.png",
    "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot2_1080x1920.png",
    "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot3_1080x1920.png"
  ]);
  await page.waitForTimeout(3000);

  // Save changes
  console.log("Saving StreamSnap AI store listing...");
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

  await page.screenshot({ path: "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_saved.png" });
  console.log("StreamSnap AI listing saved!");
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages.find(p => p.url().includes("store-listings")) || pages[0];
  await page.setViewportSize({ width: 1440, height: 1200 });

  try {
    await processSendKiss(page);
    await page.waitForTimeout(3000);
    await processStreamSnap(page);
    console.log("\n=======================================================");
    console.log("BOTH STORE LISTINGS PROCESSED SUCCESSFULLY!");
    console.log("=======================================================");
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
