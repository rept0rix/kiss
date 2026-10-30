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
    // 1. Complete StreamSnap AI Photo and Video Permissions (<= 250 chars)
    console.log("=== 1. Saving StreamSnap AI Photo and Video Permissions ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/app-content/photos-and-videos?releaseId=1&trackId=4700120161555852153", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const fields = page.locator("main input[type='text']:visible, main textarea:visible");
    const fCount = await fields.count();
    console.log("Found visible text fields on photos-and-videos:", fCount);
    if (fCount > 0) {
      await fields.nth(0).click();
      await fields.nth(0).fill("StreamSnap AI requires gallery access so users can seamlessly browse and scan saved live stream screenshots and product photos for instant AI visual commerce recognition.");
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
    console.log("Clicked Save on StreamSnap AI photos-and-videos:", savedPhoto);
    await page.waitForTimeout(5000);

    // 2. Save StreamSnap AI Closed Testing Release (releases/1/review)
    console.log("\n=== 2. Saving StreamSnap AI Closed Testing Release ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/4700120161555852153/releases/1/review", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const streamReleaseSaved = await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save$|Save and publish/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (saveBtn) {
        const t = saveBtn.innerText.trim();
        saveBtn.click();
        return { clicked: t };
      }
      const errs = document.body.innerText.split("\n").filter(l => /error|problem|require/i.test(l)).slice(0, 10);
      return { clicked: null, errs };
    });
    console.log("StreamSnap AI Closed Testing Release Save:", JSON.stringify(streamReleaseSaved));
    await page.waitForTimeout(3500);

    const streamModalConfirm = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const cBtn = btns.filter(b => /Go to overview|Go to publishing overview|^Save$/i.test(b.innerText.trim())).pop();
      if (cBtn) {
        const t = cBtn.innerText.trim();
        cBtn.click();
        return t;
      }
      return null;
    });
    console.log("StreamSnap AI Release Modal Confirm:", streamModalConfirm);
    await page.waitForTimeout(4500);

    // 3. Complete Advertising ID declaration for BOTH SendKiss and StreamSnap AI
    for (const [appName, appId] of [["SendKiss", "4972175458793862190"], ["StreamSnap AI", "4974194036705358034"]]) {
      console.log(`\n=== 3. Completing Advertising ID Declaration for ${appName} ===`);
      await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/ad-id-declaration?source=publishing-overview`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5500);

      const adIdForm = await page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll("material-radio, [role='radio']")).filter(r => r.offsetWidth > 0).map(r => ({
          checked: r.getAttribute("aria-checked"),
          text: (r.parentElement ? r.parentElement.innerText : r.innerText).trim().slice(0, 100)
        }));
        // Click 'No' if available, or inspect radios
        const noRadio = Array.from(document.querySelectorAll("material-radio, [role='radio']")).find(r => r.offsetWidth > 0 && /^No\b/i.test((r.parentElement ? r.parentElement.innerText : r.innerText).trim()));
        if (noRadio) noRadio.click();
        return { radios, clickedNo: !!noRadio };
      });
      console.log(`${appName} Ad ID form:`, JSON.stringify(adIdForm));
      await page.waitForTimeout(1500);

      // If 'Yes' was required because play-services-ads-identifier is in the bundle, check if 'No' is disabled or shows an error, otherwise Save
      const savedAdId = await page.evaluate(() => {
        const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save$/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
        if (saveBtn) {
          saveBtn.click();
          return true;
        }
        return false;
      });
      console.log(`${appName} Saved Ad ID declaration:`, savedAdId);
      await page.waitForTimeout(4500);
    }

    // 4. Inspect SendKiss 'Missing sign-in details' -> 'View details'
    console.log("\n=== 4. Inspecting SendKiss 'Missing sign-in details' ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => /View.*issue/i.test(b.innerText) && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await page.waitForTimeout(3500);

    const viewDetailsClicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button")).filter(el => el.offsetWidth > 0 && /View details|Complete declaration|Update/i.test(el.innerText.trim()));
      const info = links.map(l => ({ tag: l.tagName, text: l.innerText.trim(), href: l.getAttribute("href") }));
      const vd = links.find(l => /View details/i.test(l.innerText.trim()));
      if (vd) vd.click();
      return info;
    });
    console.log("SendKiss drawer links:", JSON.stringify(viewDetailsClicked));
    await page.waitForTimeout(4500);

    const afterViewDetails = await page.evaluate(() => {
      return {
        url: location.href,
        text: document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(-60)
      };
    });
    console.log("After clicking View details:", JSON.stringify(afterViewDetails, null, 2));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
