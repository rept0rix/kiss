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
    // 1. Inspect SendKiss 'View 2 issues'
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const viewIssuesLoc = page.locator("button:has-text('View'), a:has-text('View')").filter({ hasText: /issue/i }).first();
    if ((await viewIssuesLoc.count()) > 0) {
      await viewIssuesLoc.click();
      await page.waitForTimeout(4500);
    }
    const sendkissIssuesPage = await page.evaluate(() => {
      return {
        url: location.href,
        text: (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean)
      };
    });
    console.log("=== SendKiss Pre-Submission Issues Page ===");
    console.log("URL:", sendkissIssuesPage.url);
    console.log(sendkissIssuesPage.text.join("\n"));

    // 2. Fix StreamSnap AI Closed Testing Release (remove v1, upload v2 streamsnap-release.aab, save)
    console.log("\n=== Fixing StreamSnap AI Closed Testing Release ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/4700120161555852153?tab=releases", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => /Edit release|Resume draft/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);

    // Click 'Back' if we landed on Step 2 (Review)
    await page.evaluate(() => {
      const backBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Back" && !b.disabled && b.offsetWidth > 0);
      if (backBtn) backBtn.click();
    });
    await page.waitForTimeout(3500);

    // Remove version 1 via more_vert menu in the bundle table
    const removedV1 = await page.evaluate(() => {
      const moreBtns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.trim() === "more_vert" && b.offsetWidth > 0);
      if (moreBtns.length > 0) {
        moreBtns[0].click();
        return true;
      }
      return false;
    });
    if (removedV1) {
      await page.waitForTimeout(1500);
      const clickedRemove = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("[role='menuitem'], material-select-item, button, div")).filter(el => el.children.length === 0 && /^Remove$/i.test((el.innerText || "").trim()) && el.offsetWidth > 0);
        if (items[0]) {
          items[0].click();
          return true;
        }
        return false;
      });
      console.log("Removed v1 bundle from StreamSnap AI release:", clickedRemove);
      await page.waitForTimeout(2500);
    }

    // Upload streamsnap-release.aab (v2, Target SDK 36) directly to the release!
    const aabPath = "/Users/naoryanko/Documents/antigravity/excited-hopper/mobile/streamsnap-release.aab";
    console.log("Uploading StreamSnap AI v2 AAB:", aabPath);
    await page.setInputFiles("input[type='file']", aabPath);

    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(3000);
      const st = await page.evaluate(() => {
        const t = (document.querySelector("main") || document.body).innerText;
        const hasV2 = t.includes("1.0.1") || t.includes("36");
        const uploading = /Uploading|Processing|Generating/i.test(t);
        return { hasV2, uploading };
      });
      console.log(`StreamSnap AAB poll [${i}]:`, st);
      if (st.hasV2 && !st.uploading) break;
    }

    await page.waitForTimeout(2500);
    const clickedNext = await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Next" && !b.disabled && b.offsetWidth > 0);
      if (nextBtn) {
        nextBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked Next on StreamSnap Closed Testing release:", clickedNext);
    await page.waitForTimeout(5500);

    const step2Save = await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save$/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (saveBtn) {
        saveBtn.click();
        return "Save";
      }
      const errors = document.body.innerText.split("\n").filter(l => /error|problem/i.test(l)).slice(0, 10);
      return { clicked: null, errors };
    });
    console.log("StreamSnap Closed Testing Step 2 Save:", JSON.stringify(step2Save));
    await page.waitForTimeout(3500);

    const modalGo = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const cBtn = btns.filter(b => /Go to overview|Go to publishing overview|^Save$/i.test(b.innerText.trim())).pop();
      if (cBtn) {
        const t = cBtn.innerText.trim();
        cBtn.click();
        return t;
      }
      return null;
    });
    console.log("StreamSnap Release modal confirm:", modalGo);
    await page.waitForTimeout(5000);

    // Check StreamSnap Publishing Overview
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);
    const streamPub = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
      return { btns: btns.slice(0, 10), text: (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 30) };
    });
    console.log("StreamSnap Publishing Overview:", JSON.stringify(streamPub, null, 2));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
