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
    // 1. Finish StreamSnap AI Internal Testing (rollout draft release + select testers)
    console.log("=== Finishing StreamSnap AI Internal Testing ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/internal-testing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const clickedEdit = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => b.innerText.trim() === "Edit release" && b.offsetWidth > 0);
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked Edit release on StreamSnap Internal Testing:", clickedEdit);
    if (clickedEdit) {
      await page.waitForTimeout(5000);
      const clickedNext = await page.evaluate(() => {
        const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Next" && !b.disabled);
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      });
      console.log("Clicked Next:", clickedNext);
      await page.waitForTimeout(5000);

      const pubInfo = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
        const pubBtn = Array.from(document.querySelectorAll("button")).find(b => /Save and publish|Start rollout/i.test(b.innerText.trim()) && !b.disabled);
        if (pubBtn) {
          pubBtn.click();
          return { clicked: pubBtn.innerText.trim(), btns: btns.slice(-8) };
        }
        return { clicked: null, btns: btns.slice(-8), bodyErrors: document.body.innerText.split("\n").filter(l => /error|warning|problem/i.test(l)).slice(0, 10) };
      });
      console.log("Internal testing Step 2 publish info:", JSON.stringify(pubInfo));
      if (pubInfo.clicked) {
        await page.waitForTimeout(3000);
        const modalClicked = await page.evaluate(() => {
          const cBtn = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => /Save and publish|Rollout|Publish|Confirm/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0).pop();
          if (cBtn) {
            const t = cBtn.innerText.trim();
            cBtn.click();
            return t;
          }
          return null;
        });
        console.log("Confirmed internal testing rollout modal:", modalClicked);
        await page.waitForTimeout(5000);
      }
    }

    // Now select testers on StreamSnap AI Internal Testing
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/internal-testing?tab=testers", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const testersResult = await page.evaluate(() => {
      const cbs = Array.from(document.querySelectorAll("material-checkbox, [role='checkbox']"));
      const clicked = [];
      for (const cb of cbs) {
        if (cb.getAttribute("aria-checked") === "false" && cb.offsetWidth > 0) {
          cb.click();
          clicked.push(cb.getAttribute("aria-label") || "checkbox");
        }
      }
      return { totalCbs: cbs.length, clicked };
    });
    console.log("StreamSnap AI Testers checkboxes:", JSON.stringify(testersResult));
    await page.waitForTimeout(1500);
    const savedTesters = await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save( changes)?$/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (saveBtn) {
        saveBtn.click();
        return saveBtn.innerText.trim();
      }
      return null;
    });
    console.log("Saved StreamSnap AI Testers:", savedTesters);
    await page.waitForTimeout(4000);

    // 2. Discover Closed Testing track URL on SendKiss
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/app-dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);
    await page.evaluate(() => {
      for (const b of Array.from(document.querySelectorAll("button"))) {
        if (/View tasks/i.test(b.innerText)) b.click();
      }
    });
    await page.waitForTimeout(1500);

    const taskElements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*")).filter(el => el.children.length === 0 && /Select countries and regions|Select testers|Create a new release/i.test(el.innerText || ""));
      return all.map(el => {
        const chain = [];
        let cur = el;
        for (let i = 0; i < 6 && cur; i++) {
          chain.push({ tag: cur.tagName, role: cur.getAttribute("role"), href: cur.getAttribute("href"), cls: (cur.className || "").toString().slice(0, 40) });
          cur = cur.parentElement;
        }
        return { text: el.innerText.trim(), chain };
      });
    });
    console.log("Dashboard task elements chain:", JSON.stringify(taskElements, null, 2));

    // Click 'Select countries and regions' via Playwright text locator
    await page.locator("text='Select countries and regions'").first().click();
    await page.waitForTimeout(5000);
    console.log("URL after clicking 'Select countries and regions':", page.url());
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
