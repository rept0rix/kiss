const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

function allowOnce() {
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
}

(async () => {
  const interval = setInterval(allowOnce, 400);
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  clearInterval(interval);

  const page = browser.contexts()[0].pages()[0];
  console.log("Connected to:", page.url());

  // 1. Fill Short & Full Description using native input/textarea events
  const textStatus = await page.evaluate(() => {
    const setVal = (el, val) => {
      if (!el) return false;
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.blur();
      return true;
    };
    const textInputs = Array.from(document.querySelectorAll("input[type='text']"));
    const textareas = Array.from(document.querySelectorAll("textarea"));
    const shortOk = setVal(textInputs[1], "Send digital haptic kisses, sweet sounds & love streaks to your partner.");
    const fullDesc = `Welcome to SendKiss — the sweetest and most interactive way to stay close to the people you love!

Whether you are in a long-distance relationship, missing your partner, or just want to send a warm romantic gesture, SendKiss lets you deliver personalized digital kisses with real haptic feedback, custom sound effects, and vibrant animated kiss styles.

Key Features:
• Instant Interactive Kisses: Send and receive kisses that light up your screen with authentic haptics and touch animations.
• Custom Kiss Styles: Choose from classic red lipstick, glowing neon, glitter, hearts, and seasonal themes.
• Romantic Sound Effects: Pair each kiss with romantic audio messages or sweet audio notes.
• Stay Connected: Perfect for couples, long-distance relationships, family, and best friends.
• Private & Secure: Your intimate moments are protected with complete privacy.

Download SendKiss today and send some love to someone special!`;
    const fullOk = setVal(textareas[0], fullDesc);
    return { shortOk, fullOk };
  });
  console.log("Text status:", textStatus);

  // 2. Remove any old bad assets via DOM click
  for (let i = 0; i < 6; i++) {
    const removed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button[aria-label*='Remove' i]"));
      const bad = btns.find(b => {
        const l = b.getAttribute("aria-label") || "";
        return l.includes("1_App_Icon") || l.includes("2_Feature") || l.includes("3_Phone") || l.includes("4_Phone") || l.includes("5_Phone") || l.includes("6_Phone");
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

  // Helper to open drawer for a specific section, upload or select files, and click Add
  async function attachAssetsForSection(sectionTitleSubstring, filePaths, fileNamesToMatch) {
    console.log(`\n--- Attaching for section: ${sectionTitleSubstring} ---`);
    // Make sure drawer is closed first
    await page.evaluate(() => {
      const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
      if (closeBtn && closeBtn.offsetWidth > 0) closeBtn.click();
    });
    await page.waitForTimeout(800);

    // Find the "Add assets" button belonging to this section
    const clickedOpen = await page.evaluate((sub) => {
      const btns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.trim() === "Add assets");
      for (const btn of btns) {
        let el = btn;
        for (let i = 0; i < 8 && el; i++) {
          el = el.parentElement;
          if (el && (el.innerText || "").includes(sub)) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }, sectionTitleSubstring);

    console.log("Opened drawer for section?", clickedOpen);
    if (!clickedOpen) return;
    await page.waitForTimeout(2000);

    // Upload files directly to input[type='file']
    console.log("Setting input files:", filePaths);
    await page.setInputFiles("input[type='file']", filePaths);
    await page.waitForTimeout(7000);

    // Check if the Add button (NOT Add from Drive!) is ready, or if we should click the item checkboxes
    const addResult = await page.evaluate((names) => {
      const findRealAddBtn = () => Array.from(document.querySelectorAll("material-drawer button")).find(
        b => !b.innerText.includes("Drive") && (b.innerText.includes("add_photo_alternate") || b.innerText.trim() === "Add")
      );
      let addBtn = findRealAddBtn();
      if (addBtn && !addBtn.disabled) {
        addBtn.click();
        return "Clicked real Add button directly!";
      }
      // Otherwise click the matching items in the drawer list to select them
      const items = Array.from(document.querySelectorAll("material-drawer li, material-drawer [role='option'], material-drawer asset-list-item, material-drawer .item"));
      let selectedCount = 0;
      for (const name of names) {
        const row = Array.from(document.querySelectorAll("material-drawer *")).find(
          el => el.children.length === 0 && (el.innerText || "").trim() === name
        );
        if (row) {
          const clickable = row.closest("li, [role='option'], .asset-row, div[tabindex]") || row.parentElement;
          if (clickable) {
            clickable.click();
            selectedCount++;
          }
        }
      }
      addBtn = findRealAddBtn();
      if (addBtn && !addBtn.disabled) {
        addBtn.click();
        return `Selected ${selectedCount} and clicked Add!`;
      }
      return `Add button still not active (selectedCount=${selectedCount})`;
    }, fileNamesToMatch);
    console.log("Add result:", addResult);
    await page.waitForTimeout(2500);

    // Close drawer if still open
    await page.evaluate(() => {
      const closeBtn = document.querySelector("material-drawer button[debug-id='close-button']");
      if (closeBtn && closeBtn.offsetWidth > 0) closeBtn.click();
    });
    await page.waitForTimeout(1000);
  }

  await attachAssetsForSection(
    "App icon",
    ["/Users/naoryanko/kiss/store_assets/sendkiss_icon_512.png"],
    ["sendkiss_icon_512.png"]
  );

  await attachAssetsForSection(
    "Feature graphic",
    ["/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png"],
    ["sendkiss_feature_1024x500.png"]
  );

  await attachAssetsForSection(
    "Phone screenshots",
    [
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
    ],
    [
      "sendkiss_shot1_1080x1920.png",
      "sendkiss_shot2_1080x1920.png",
      "sendkiss_shot3_1080x1920.png"
    ]
  );

  // Check current state of buttons at bottom (Save as draft / Next)
  const footerState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveDraft = btns.find(b => b.innerText.trim() === "Save as draft");
    const nextBtn = btns.find(b => b.innerText.trim() === "Next");
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
      return "Clicked Next!";
    }
    if (saveDraft && !saveDraft.disabled) {
      saveDraft.click();
      return "Clicked Save as draft!";
    }
    return {
      saveDraftDisabled: saveDraft ? saveDraft.disabled : "missing",
      nextDisabled: nextBtn ? nextBtn.disabled : "missing"
    };
  });
  console.log("Footer state:", footerState);
  await page.waitForTimeout(4000);

  // If on Review step, click Save
  const finalSaveState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => b.innerText.trim() === "Save" && !b.disabled);
    if (saveBtn) {
      saveBtn.click();
      return "Clicked final Save!";
    }
    return "No active Save button on step 2";
  });
  console.log("Final save state:", finalSaveState);
  await page.waitForTimeout(4000);

  await browser.close();
  process.exit(0);
})();
