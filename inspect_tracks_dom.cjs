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
    // 1. Check SendKiss Dashboard Closed testing links
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/app-dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);
    await page.evaluate(() => {
      for (const b of Array.from(document.querySelectorAll("button"))) {
        if (/View tasks/i.test(b.innerText)) b.click();
      }
    });
    await page.waitForTimeout(1500);

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a, button")).filter(el => el.offsetWidth > 0 && /Select countries|Select testers|Create a new release|Preview and confirm/i.test(el.innerText)).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        href: el.getAttribute("href")
      }));
    });
    console.log("SendKiss Closed Testing links:", JSON.stringify(links, null, 2));

    // Click 'Select countries and regions'
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("a, button")).find(e => /Select countries and regions/i.test(e.innerText));
      if (el) el.click();
    });
    await page.waitForTimeout(5000);
    console.log("SendKiss Closed Testing Track URL:", page.url());

    const trackDom = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("[role='tab'], a[role='tab'], button[role='tab']")).map(t => t.innerText.trim());
      const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => b.innerText.trim());
      return { tabs, btns };
    });
    console.log("SendKiss Closed Testing Track DOM:", JSON.stringify(trackDom, null, 2));

    // 2. Check StreamSnap AI Internal Testing links
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/internal-testing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const streamInternalDom = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("[role='tab']")).map(t => t.innerText.trim());
      const btns = Array.from(document.querySelectorAll("button, a")).filter(b => b.offsetWidth > 0 && /release|draft|tester|Edit|Resume|Create/i.test(b.innerText)).map(b => ({ tag: b.tagName, text: b.innerText.trim(), href: b.getAttribute("href") }));
      return { url: location.href, tabs, btns };
    });
    console.log("StreamSnap AI Internal Testing DOM:", JSON.stringify(streamInternalDom, null, 2));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
