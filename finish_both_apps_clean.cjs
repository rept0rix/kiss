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

async function attachSingleAssetToSection(page, sectionTitle, filePath) {
  // Ensure drawer is closed first
  await page.evaluate(() => {
    const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
    if (closeBtn && closeBtn.offsetWidth > 0) closeBtn.click();
  });
  await page.waitForTimeout(800);

  // Open drawer for the exact section by finding the first ancestor with '*'
  const opened = await page.evaluate((targetHeader) => {
    const btns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.trim() === "Add assets");
    for (const btn of btns) {
      let el = btn;
      for (let k = 0; k < 14 && el; k++) {
        el = el.parentElement;
        if (el && (el.innerText || "").includes("*")) {
          const header = el.innerText.split("\n")[0].trim();
          if (header.includes(targetHeader)) {
            btn.click();
            return true;
          }
          break;
        }
      }
    }
    return false;
  }, sectionTitle);

  if (!opened) {
    console.log(`Could not find 'Add assets' for ${sectionTitle}`);
    return false;
  }
  await page.waitForTimeout(2200);

  // Upload single file via input[type='file']
  await page.setInputFiles("input[type='file']", filePath);
  await page.waitForTimeout(6500);

  const clickedAdd = await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll("material-drawer button")).find(
      b => !b.innerText.includes("Drive") && (b.innerText.includes("add_photo_alternate") || b.innerText.trim() === "Add")
    );
    if (addBtn && !addBtn.disabled) {
      addBtn.click();
      return true;
    }
    return false;
  });
  console.log(`Uploaded ${filePath.split("/").pop()} to [${sectionTitle}] -> Clicked Add: ${clickedAdd}`);
  await page.waitForTimeout(2500);

  // Ensure drawer is closed
  await page.evaluate(() => {
    const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
    if (closeBtn && closeBtn.offsetWidth > 0) closeBtn.click();
  });
  await page.waitForTimeout(800);
  return clickedAdd;
}

async function configureAppStoreListing(page, appId, appName, shortDesc, fullDesc, iconPath, featurePath, shotPaths) {
  console.log(`\n========================================`);
  console.log(`Configuring Store Listing for ${appName} (${appId})`);
  console.log(`========================================`);

  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/store-listings/default/edit`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5500);

  // Fill text fields using Playwright native .fill() so Angular Dart form controls update
  const textInputs = page.locator("input[type='text']");
  const inputCount = await textInputs.count();
  console.log(`Found ${inputCount} text inputs`);
  if (inputCount >= 2) {
    const curTitle = await textInputs.nth(0).inputValue();
    if (!curTitle || curTitle.trim() !== appName) {
      await textInputs.nth(0).click();
      await textInputs.nth(0).fill(appName);
    }
    await textInputs.nth(1).click();
    await textInputs.nth(1).fill(shortDesc);
  }
  const textareas = page.locator("textarea");
  if ((await textareas.count()) >= 1) {
    await textareas.nth(0).click();
    await textareas.nth(0).fill(fullDesc);
  }
  await page.waitForTimeout(1000);

  // Remove any old/bad placeholder assets
  for (let i = 0; i < 8; i++) {
    const removed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button[aria-label*='Remove' i]"));
      const bad = btns.find(b => {
        const l = b.getAttribute("aria-label") || "";
        return l.includes("1_App_Icon") || l.includes("2_Feature") || l.includes("3_Phone") || l.includes("4_Phone") || l.includes("5_Phone") || l.includes("6_Phone") || l.includes("playstore");
      });
      if (bad) {
        const label = bad.getAttribute("aria-label");
        bad.click();
        return label;
      }
      return null;
    });
    if (!removed) break;
    console.log("Removed old asset:", removed);
    await page.waitForTimeout(800);
  }

  // Check current asset counts in each section
  const getCounts = async () => page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("button[aria-label*='Remove' i]")).map(b => b.getAttribute("aria-label") || "");
    const hasIcon = labels.some(l => l.toLowerCase().includes("icon"));
    const hasFeature = labels.some(l => l.toLowerCase().includes("feature"));
    const shotCount = labels.filter(l => l.toLowerCase().includes("shot")).length;
    return { hasIcon, hasFeature, shotCount, labels };
  });

  let counts = await getCounts();
  console.log("Current attached assets before upload:", counts);

  if (!counts.hasIcon) {
    await attachSingleAssetToSection(page, "App icon", iconPath);
  }
  if (!counts.hasFeature) {
    await attachSingleAssetToSection(page, "Feature graphic", featurePath);
  }
  if (counts.shotCount < 3) {
    for (let i = counts.shotCount; i < shotPaths.length; i++) {
      await attachSingleAssetToSection(page, "Phone screenshots", shotPaths[i]);
    }
  }

  counts = await getCounts();
  console.log("Attached assets after upload:", counts);

  // Verify form state before Next
  const formCheck = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input[type='text']")).map(i => i.value);
    const textareas = Array.from(document.querySelectorAll("textarea")).map(t => t.value.slice(0, 40));
    const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
    return { inputs, textareas, bottomBtns: btns.slice(-6) };
  });
  console.log("Form check before Next:", JSON.stringify(formCheck));

  // Click Save as draft if enabled, or Next
  const step1Action = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const nextBtn = btns.find(b => b.innerText.trim() === "Next" && !b.disabled);
    if (nextBtn) {
      nextBtn.click();
      return "Clicked Next";
    }
    const saveBtn = btns.find(b => (b.innerText.trim() === "Save" || b.innerText.trim() === "Save as draft") && !b.disabled);
    if (saveBtn) {
      saveBtn.click();
      return `Clicked ${saveBtn.innerText.trim()}`;
    }
    return "No enabled Next/Save button";
  });
  console.log("Step 1 action:", step1Action);
  await page.waitForTimeout(4500);

  // Inspect Step 2 (Review) and click Save
  const step2Info = await page.evaluate(() => {
    const errors = Array.from(document.querySelectorAll("[class*='error' i], [role='alert']")).map(e => e.innerText.trim()).filter(Boolean);
    const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
    const saveBtn = Array.from(document.querySelectorAll("button")).find(b => {
      const t = b.innerText.trim();
      return (t === "Save" || t === "Save changes" || t === "Publish" || t === "Submit") && !b.disabled && b.offsetWidth > 0;
    });
    let clicked = null;
    if (saveBtn) {
      clicked = saveBtn.innerText.trim();
      saveBtn.click();
    }
    return { clicked, errors: errors.slice(0, 10), visibleBtns: btns.slice(-10) };
  });
  console.log("Step 2 info:", JSON.stringify(step2Info));
  await page.waitForTimeout(6000);

  // Check Dashboard & Publishing Overview
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5500);
  const dashInfo = await page.evaluate(() => {
    const m = document.body.innerText.match(/\d+ of \d+ complete/i);
    return { progress: m ? m[0] : "not found", url: location.href };
  });
  console.log(`${appName} Dashboard Info:`, JSON.stringify(dashInfo));

  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/publishing`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5500);
  const pubAction = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const sendBtn = btns.find(b => /send .* for review/i.test(b.innerText.trim()) && !b.disabled);
    if (sendBtn) {
      const txt = sendBtn.innerText.trim();
      sendBtn.click();
      return `Clicked '${txt}'`;
    }
    const bodySnippet = document.body.innerText.split("\n").filter(l => /review|changes|ready|draft/i.test(l)).slice(0, 10);
    return `No active Send for review button. Lines: ${JSON.stringify(bodySnippet)}`;
  });
  console.log(`${appName} Publishing Overview action:`, pubAction);
  if (pubAction.startsWith("Clicked")) {
    await page.waitForTimeout(3000);
    const modalConfirm = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button"));
      const confirmBtn = btns.filter(b => /send .* for review|^send$/i.test(b.innerText.trim()) && !b.disabled).pop();
      if (confirmBtn) {
        const txt = confirmBtn.innerText.trim();
        confirmBtn.click();
        return `Confirmed modal '${txt}'!`;
      }
      return "No modal confirm button found";
    });
    console.log(`${appName} Modal confirm:`, modalConfirm);
    await page.waitForTimeout(5000);
  }
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages[0] || await browser.contexts()[0].newPage();

  try {
    // 1. SendKiss
    await configureAppStoreListing(
      page,
      "4972175458793862190",
      "SendKiss",
      "Send digital haptic kisses, sweet sounds & love streaks to your partner.",
      `Welcome to SendKiss — the sweetest and most interactive way to stay close to the people you love!

Whether you are in a long-distance relationship, missing your partner, or just want to send a warm romantic gesture, SendKiss lets you deliver personalized digital kisses with real haptic feedback, custom sound effects, and vibrant animated kiss styles.

Key Features:
• Instant Interactive Kisses: Send and receive kisses that light up your screen with authentic haptics and touch animations.
• Custom Kiss Styles: Choose from classic red lipstick, glowing neon, glitter, hearts, and seasonal themes.
• Romantic Sound Effects: Pair each kiss with romantic audio messages or sweet audio notes.
• Stay Connected: Perfect for couples, long-distance relationships, family, and best friends.
• Private & Secure: Your intimate moments are protected with complete privacy.

Download SendKiss today and send some love to someone special!`,
      "/Users/naoryanko/kiss/store_assets/sendkiss_icon_512.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png",
      [
        "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
        "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
        "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
      ]
    );

    // 2. StreamSnap AI
    await configureAppStoreListing(
      page,
      "4974194036705358034",
      "StreamSnap AI",
      "AI product recognition on live streams. Identify fashion & gear in 1 click.",
      `Welcome to StreamSnap AI — the ultimate AI-powered visual commerce companion for live stream viewers!

Ever watched your favorite streamer on YouTube, Twitch, or TikTok and wondered: "Where did they get that hoodie?" or "What headset are they using?" StreamSnap AI is Shazam for live streams — identifying products, fashion, and tech gear in real time and letting you find verified Amazon matches instantly.

Key Features:
• Real-Time Stream Scanning: Powered by multimodal AI, StreamSnap detects apparel, sneakers, hats, and gaming gear live as you watch.
• 1-Click Amazon Matches: View verified product listings with real customer reviews, current prices, and Prime next-day shipping.
• Visual Object Search: Highlight any item on stream to find exact matches and budget-friendly alternatives.
• Live Catalog: Browse all products detected during marathon 24-hour creator streams.
• Multi-Platform Support: Seamless integration with YouTube Live, Twitch, and TikTok Live.

Never wonder where a streamer bought their outfit again. Download StreamSnap AI today!`,
      "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_icon_512.png",
      "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_feature_1024x500.png",
      [
        "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot1_1080x1920.png",
        "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot2_1080x1920.png",
        "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot3_1080x1920.png"
      ]
    );
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
