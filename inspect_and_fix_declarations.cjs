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
    // 1. Check SendKiss 'View 2 issues' on /publishing
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const issueBtnInfo = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("button, a")).find(b => /View .* issue/i.test(b.innerText));
      if (!el) return null;
      return { tag: el.tagName, text: el.innerText.trim(), href: el.getAttribute("href"), disabled: el.disabled };
    });
    console.log("SendKiss View issues button info:", JSON.stringify(issueBtnInfo));

    if (issueBtnInfo) {
      await page.locator("text=/View .* issue/i").first().click();
      await page.waitForTimeout(4000);
      const afterClick = await page.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll("material-dialog, [role='dialog'], material-drawer")).filter(d => d.offsetWidth > 0).map(d => d.innerText);
        return { url: location.href, dialogs, bodyText: document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 70) };
      });
      console.log("SendKiss after clicking View issues:", JSON.stringify(afterClick, null, 2));
    }

    // Also check SendKiss /app-content (Need attention tab)
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/app-content", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const sendkissContent = await page.evaluate(() => {
      return (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean);
    });
    console.log("SendKiss App Content (Need attention):", JSON.stringify(sendkissContent));

    // 2. Check StreamSnap AI /app-content (Need attention tab)
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/app-content", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const streamContent = await page.evaluate(() => {
      return (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean);
    });
    console.log("StreamSnap AI App Content (Need attention):", JSON.stringify(streamContent));

    // Click Start on Photo and video permissions on StreamSnap AI if present
    const clickedPhotoStart = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, a")).filter(b => b.offsetWidth > 0 && /Start|Manage/i.test(b.innerText.trim()));
      if (btns[0]) {
        btns[0].click();
        return btns[0].innerText.trim();
      }
      return null;
    });
    console.log("StreamSnap AI clicked Start on App Content:", clickedPhotoStart);
    if (clickedPhotoStart) {
      await page.waitForTimeout(4500);
      const photoForm = await page.evaluate(() => {
        return {
          url: location.href,
          text: (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean),
          cbs: Array.from(document.querySelectorAll("material-checkbox, [role='checkbox'], material-radio, [role='radio']")).filter(e => e.offsetWidth > 0).map(e => ({ tag: e.tagName, role: e.getAttribute("role"), text: (e.parentElement ? e.parentElement.innerText : e.innerText).trim().slice(0, 100) }))
        };
      });
      console.log("StreamSnap AI Photo/Video Declaration Form:", JSON.stringify(photoForm, null, 2));
    }
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
