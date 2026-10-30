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
    for (const [appName, appId, trackId] of [
      ["SendKiss", "4972175458793862190", "4699519089607343114"],
      ["StreamSnap AI", "4974194036705358034", "4700120161555852153"]
    ]) {
      const baseTrackUrl = `https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/tracks/${trackId}`;

      // 1. Save Countries
      await page.goto(`${baseTrackUrl}?tab=countryAvailability`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => /Add countries/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
        if (btn) btn.click();
      });
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        const cb = document.querySelector("material-checkbox, [role='checkbox']");
        if (cb && cb.getAttribute("aria-checked") !== "true") cb.click();
      });
      await page.waitForTimeout(1500);
      const clickedSaveCountries = await page.evaluate(() => {
        const saveBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Save" && !b.disabled && b.offsetWidth > 0);
        if (saveBtn) {
          saveBtn.click();
          return true;
        }
        return false;
      });
      console.log(`${appName} Clicked Save countries:`, clickedSaveCountries);
      await page.waitForTimeout(2500);
      const confirmedCountriesModal = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
        const cBtn = btns.filter(b => /^Save$|^Add countries/i.test(b.innerText.trim())).pop();
        if (cBtn) {
          const t = cBtn.innerText.trim();
          cBtn.click();
          return t;
        }
        return null;
      });
      console.log(`${appName} Confirmed Save countries modal:`, confirmedCountriesModal);
      await page.waitForTimeout(4500);

      // 2. Go to Releases -> Edit release -> Add from library
      await page.goto(`${baseTrackUrl}?tab=releases`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
      const clickedEdit = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button, a")).find(b => /Edit release|Resume draft|Create new release/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
        if (btn) {
          const t = btn.innerText.trim();
          btn.click();
          return t;
        }
        return null;
      });
      console.log(`${appName} Clicked enabled release button:`, clickedEdit);
      await page.waitForTimeout(5500);

      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => /Add from library/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
        if (btn) btn.click();
      });
      await page.waitForTimeout(3500);

      const drawerDetails = await page.evaluate(() => {
        const drawer = document.querySelector("material-drawer") || document.body;
        const cbs = Array.from(drawer.querySelectorAll("material-checkbox, [role='checkbox'], input[type='checkbox']")).filter(el => el.offsetWidth > 0);
        // Click the first non-select-all checkbox (or index 0 if only 1)
        const target = cbs.find(c => !(c.getAttribute("aria-label") || "").includes("Select all")) || cbs[0];
        let clickedLabel = null;
        if (target) {
          clickedLabel = target.getAttribute("aria-label") || target.tagName;
          target.click();
        }
        return { totalCbs: cbs.length, clickedLabel, drawerText: drawer.innerText.split("\n").slice(0, 20) };
      });
      console.log(`${appName} Library drawer details:`, JSON.stringify(drawerDetails));
      await page.waitForTimeout(2000);

      const clickedAddToRelease = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Add to release" && !b.disabled && b.offsetWidth > 0);
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      console.log(`${appName} Clicked 'Add to release':`, clickedAddToRelease);
      await page.waitForTimeout(4500);

      const clickedNext = await page.evaluate(() => {
        const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Next" && !b.disabled && b.offsetWidth > 0);
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      });
      console.log(`${appName} Clicked Next on release:`, clickedNext);
      await page.waitForTimeout(5500);

      const step2Result = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
        const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /Save and publish|Save|Start rollout|Go to publishing overview/i.test(b.innerText.trim()) && !/Discard|Back|Add release/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
        if (saveBtn) {
          const t = saveBtn.innerText.trim();
          saveBtn.click();
          return { clicked: t, btns: btns.slice(-8) };
        }
        return { clicked: null, btns: btns.slice(-8), errors: document.body.innerText.split("\n").filter(l => /error|warning|problem/i.test(l)).slice(0, 10) };
      });
      console.log(`${appName} Release Step 2 result:`, JSON.stringify(step2Result));
      await page.waitForTimeout(3500);

      // Confirm any modal (e.g. 'Go to overview' or 'Save')
      const modalConfirm = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
        const cBtn = btns.filter(b => /Go to overview|Go to publishing overview|Save and publish|Rollout|^Save$/i.test(b.innerText.trim())).pop();
        if (cBtn) {
          const t = cBtn.innerText.trim();
          cBtn.click();
          return t;
        }
        return null;
      });
      console.log(`${appName} Release modal confirm:`, modalConfirm);
      await page.waitForTimeout(4500);

      // 3. Go to Publishing Overview (/publishing) and click 'Send app for review' / 'Send changes for review'
      await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/publishing`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5500);
      const pubResult = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
        const sendBtn = Array.from(document.querySelectorAll("button")).find(b => /Send .* for review/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
        if (sendBtn) {
          const t = sendBtn.innerText.trim();
          sendBtn.click();
          return { clicked: t, btns: btns.slice(0, 8) };
        }
        return { clicked: null, btns: btns.slice(0, 8), text: document.body.innerText.split("\n").filter(l => /review|changes|ready|complete/i.test(l)).slice(0, 10) };
      });
      console.log(`${appName} Publishing Overview:`, JSON.stringify(pubResult));

      if (pubResult.clicked) {
        await page.waitForTimeout(3000);
        const finalModal = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
          const cBtn = btns.filter(b => /Send .* for review|^Send$/i.test(b.innerText.trim())).pop();
          if (cBtn) {
            const t = cBtn.innerText.trim();
            cBtn.click();
            return t;
          }
          return null;
        });
        console.log(`🎉 ${appName} Final Review Modal Confirmed:`, finalModal);
        await page.waitForTimeout(5000);
      }
    }
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
