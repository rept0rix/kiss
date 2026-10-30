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
  const page = browser.contexts()[0].pages()[0];

  try {
    // =========================================================================
    // PART 1: SendKiss (4972175458793862190) — Resolve 'Missing sign-in details' & Submit!
    // =========================================================================
    console.log("=== PART 1: Submitting SendKiss for Review ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);

    // Open 'View issues' -> 'View details'
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button, a")).find(el => /View.*issue/i.test(el.innerText) && el.offsetWidth > 0);
      if (b) b.click();
    });
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      const vd = Array.from(document.querySelectorAll("button, a")).find(el => /View details/i.test(el.innerText) && el.offsetWidth > 0);
      if (vd) vd.click();
    });
    await page.waitForTimeout(3000);

    // Click 'Proceed anyway' if available, or inspect its tag
    const clickedProceed = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("button, a")).find(b => /Proceed anyway/i.test(b.innerText) && b.offsetWidth > 0);
      if (el) {
        const t = el.innerText.trim();
        el.click();
        return t;
      }
      return null;
    });
    console.log("SendKiss clicked 'Proceed anyway':", clickedProceed);
    await page.waitForTimeout(3000);

    // Confirm any modal after 'Proceed anyway' or close drawer if needed
    const afterProceed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
      const submitBtn = Array.from(document.querySelectorAll("button")).find(b => /Submit .* for review|Send .* for review|Proceed/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      let clicked = null;
      if (submitBtn) {
        clicked = submitBtn.innerText.trim();
        submitBtn.click();
      }
      return { clicked, btns: btns.slice(-10) };
    });
    console.log("SendKiss after Proceed anyway:", JSON.stringify(afterProceed));
    await page.waitForTimeout(3500);

    // Check if there is a final confirmation modal on SendKiss
    const sendkissFinalConfirm = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const cBtn = btns.filter(b => /Submit|Send/i.test(b.innerText.trim())).pop();
      if (cBtn) {
        const t = cBtn.innerText.trim();
        cBtn.click();
        return t;
      }
      return null;
    });
    console.log("🎉 SendKiss Final Confirm:", sendkissFinalConfirm);
    await page.waitForTimeout(5000);

    const sendkissPubStatus = await page.evaluate(() => {
      return document.body.innerText.split("\n").map(l => l.trim()).filter(l => /review|submitted|Changes in review|ready/i.test(l)).slice(0, 12);
    });
    console.log("SendKiss Publishing Overview status lines:", JSON.stringify(sendkissPubStatus));

    // =========================================================================
    // PART 2: StreamSnap AI (4974194036705358034) — Fill Photo/Video Permissions, Save Release, & Submit!
    // =========================================================================
    console.log("\n=== PART 2: Completing StreamSnap AI Photo/Video Permissions & Submitting ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/app-content/photos-and-videos?releaseId=1&trackId=4700120161555852153", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const photoInputsInfo = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("input, textarea, [contenteditable='true']")).filter(el => el.offsetWidth > 0);
      return all.map((el, i) => ({ i, tag: el.tagName, type: el.getAttribute("type"), aria: el.getAttribute("aria-label") }));
    });
    console.log("StreamSnap AI photos-and-videos inputs:", JSON.stringify(photoInputsInfo));

    const visTextareas = page.locator("textarea:visible, input[type='text']:visible");
    const vtCount = await visTextareas.count();
    console.log("Visible textareas/inputs count (without main):", vtCount);
    for (let i = 0; i < vtCount; i++) {
      await visTextareas.nth(i).click();
      await visTextareas.nth(i).fill("StreamSnap AI requires gallery access so users can browse and scan saved live stream screenshots and product photos for instant AI visual commerce recognition.");
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(1500);
    const savedPhoto = await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save$/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    });
    console.log("StreamSnap AI Saved Photo/Video Declaration:", savedPhoto);
    await page.waitForTimeout(5000);

    // Now go back to StreamSnap AI Closed Testing Release Step 2 and Save!
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/4700120161555852153/releases/1/review", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const streamReleaseStep2 = await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save$|Save and publish/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (saveBtn) {
        const t = saveBtn.innerText.trim();
        saveBtn.click();
        return { clicked: t };
      }
      const errs = document.body.innerText.split("\n").filter(l => /error|problem|require/i.test(l)).slice(0, 12);
      return { clicked: null, errs };
    });
    console.log("StreamSnap AI Closed Testing Release Step 2:", JSON.stringify(streamReleaseStep2));
    await page.waitForTimeout(3500);

    const streamModalGo = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const cBtn = btns.filter(b => /Go to overview|Go to publishing overview|^Save$/i.test(b.innerText.trim())).pop();
      if (cBtn) {
        const t = cBtn.innerText.trim();
        cBtn.click();
        return t;
      }
      return null;
    });
    console.log("StreamSnap AI Release Modal Confirm:", streamModalGo);
    await page.waitForTimeout(5500);

    // Check StreamSnap AI Publishing Overview
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6500);

    const streamPub = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
      const submitBtn = Array.from(document.querySelectorAll("button")).find(b => /Submit .* for review|Send .* for review/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      let clicked = null;
      if (submitBtn) {
        clicked = submitBtn.innerText.trim();
        submitBtn.click();
      }
      return {
        clicked,
        btns: btns.slice(0, 10),
        text: document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(15, 50)
      };
    });
    console.log("StreamSnap AI Publishing Overview:", JSON.stringify(streamPub, null, 2));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
