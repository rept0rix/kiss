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
  await page.evaluate(() => {
    const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
    if (closeBtn && closeBtn.offsetWidth > 0) closeBtn.click();
  });
  await page.waitForTimeout(1000);

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
  await page.waitForTimeout(2500);

  const fileName = filePath.split("/").pop();

  // First check if fileName is already listed inside material-drawer!
  const selectedExisting = await page.evaluate((fname) => {
    const drawer = document.querySelector("material-drawer");
    if (!drawer) return false;
    // Look for an element with the filename inside the drawer
    const items = Array.from(drawer.querySelectorAll("[role='checkbox'], material-checkbox, .asset-item, [class*='asset' i], [aria-label*='" + fname + "']"));
    for (const el of Array.from(drawer.querySelectorAll("*"))) {
      if (el.children.length === 0 && (el.innerText || "").trim() === fname) {
        // Click its card/checkbox container
        let card = el;
        for (let k = 0; k < 6 && card; k++) {
          card = card.parentElement;
          if (card && (card.getAttribute("role") === "checkbox" || card.tagName.includes("CARD") || card.querySelector("material-checkbox, [role='checkbox']"))) {
            const cb = card.querySelector("material-checkbox, [role='checkbox']") || card;
            cb.click();
            return true;
          }
        }
        el.click();
        return true;
      }
    }
    return false;
  }, fileName);

  if (selectedExisting) {
    console.log(`Selected existing asset ${fileName} from drawer library`);
    await page.waitForTimeout(1000);
  } else {
    await page.setInputFiles("input[type='file']", filePath);
  }

  // Poll up to 15s for Add button to be enabled
  let clickedAdd = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    await page.waitForTimeout(1000);
    clickedAdd = await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll("material-drawer button")).find(
        b => !b.innerText.includes("Drive") && (b.innerText.includes("add_photo_alternate") || b.innerText.trim() === "Add")
      );
      if (addBtn && !addBtn.disabled) {
        addBtn.click();
        return true;
      }
      return false;
    });
    if (clickedAdd) break;
  }

  console.log(`Asset ${fileName} to [${sectionTitle}] -> Clicked Add: ${clickedAdd}`);
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
    if (closeBtn && closeBtn.offsetWidth > 0) closeBtn.click();
  });
  await page.waitForTimeout(800);
  return clickedAdd;
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const page = browser.contexts()[0].pages()[0];

  try {
    // Complete StreamSnap AI Store Listing
    const appId = "4974194036705358034";
    const appName = "StreamSnap AI";
    const shortDesc = "AI product recognition on live streams. Identify fashion & gear in 1 click.";
    const fullDesc = `Welcome to StreamSnap AI — the ultimate AI-powered visual commerce companion for live stream viewers!

Ever watched your favorite streamer on YouTube, Twitch, or TikTok and wondered: "Where did they get that hoodie?" or "What headset are they using?" StreamSnap AI is Shazam for live streams — identifying products, fashion, and tech gear in real time and letting you find verified Amazon matches instantly.

Key Features:
• Real-Time Stream Scanning: Powered by multimodal AI, StreamSnap detects apparel, sneakers, hats, and gaming gear live as you watch.
• 1-Click Amazon Matches: View verified product listings with real customer reviews, current prices, and Prime next-day shipping.
• Visual Object Search: Highlight any item on stream to find exact matches and budget-friendly alternatives.
• Live Catalog: Browse all products detected during marathon 24-hour creator streams.
• Multi-Platform Support: Seamless integration with YouTube Live, Twitch, and TikTok Live.

Never wonder where a streamer bought their outfit again. Download StreamSnap AI today!`;

    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/store-listings/default/edit`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const textInputs = page.locator("input[type='text']");
    if ((await textInputs.count()) >= 2) {
      await textInputs.nth(0).click();
      await textInputs.nth(0).fill(appName);
      await textInputs.nth(1).click();
      await textInputs.nth(1).fill(shortDesc);
    }
    const textareas = page.locator("textarea");
    if ((await textareas.count()) >= 1) {
      await textareas.nth(0).click();
      await textareas.nth(0).fill(fullDesc);
    }
    await page.waitForTimeout(1000);

    await attachSingleAssetToSection(page, "App icon", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_icon_512.png");
    await attachSingleAssetToSection(page, "Feature graphic", "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_feature_1024x500.png");
    for (const shot of [
      "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot1_1080x1920.png",
      "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot2_1080x1920.png",
      "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/store_assets/streamsnap_shot3_1080x1920.png"
    ]) {
      await attachSingleAssetToSection(page, "Phone screenshots", shot);
    }

    const labels = await page.evaluate(() => Array.from(document.querySelectorAll("button[aria-label*='Remove' i]")).map(b => b.getAttribute("aria-label")));
    console.log("StreamSnap AI attached labels:", labels);

    // Click Next -> Save
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Next" && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await page.waitForTimeout(4500);
    const saved = await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Save" && !b.disabled && b.offsetWidth > 0);
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    });
    console.log("StreamSnap AI clicked Save on Step 2:", saved);
    await page.waitForTimeout(6000);

    // Now inspect Dashboard and Publishing Overview for both apps in detail
    for (const [name, id] of [["SendKiss", "4972175458793862190"], ["StreamSnap AI", "4974194036705358034"]]) {
      await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${id}/app-dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5500);
      const dashText = await page.evaluate(() => {
        const main = document.querySelector("main") || document.body;
        return main.innerText.split("\n").map(l => l.trim()).filter(Boolean);
      });
      console.log(`\n=== ${name} FULL DASHBOARD ===`);
      console.log(dashText.join("\n"));

      await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${id}/publishing`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5500);
      const pubText = await page.evaluate(() => {
        const main = document.querySelector("main") || document.body;
        const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled, aria: b.getAttribute("aria-label") }));
        return { text: main.innerText.split("\n").map(l => l.trim()).filter(Boolean), btns };
      });
      console.log(`\n=== ${name} FULL PUBLISHING OVERVIEW ===`);
      console.log(pubText.text.join("\n"));
      console.log("Buttons:", JSON.stringify(pubText.btns));
    }
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
