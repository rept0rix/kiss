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
    // 1. Check SendKiss Publishing Overview 'View 2 issues'
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    const clickedViewIssues = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => /View .* issue/i.test(b.innerText.trim()));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked View issues on SendKiss:", clickedViewIssues);
    await page.waitForTimeout(4000);

    const sendkissIssues = await page.evaluate(() => {
      return {
        url: location.href,
        text: (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 60)
      };
    });
    console.log("SendKiss issues details:", JSON.stringify(sendkissIssues, null, 2));

    // 2. Check StreamSnap AI Closed Testing release error
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/4700120161555852153?tab=releases", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => /Edit release|Resume draft/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);

    const streamStep1 = await page.evaluate(() => {
      return (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean);
    });
    console.log("StreamSnap AI Release Step 1:", JSON.stringify(streamStep1.slice(0, 50)));

    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Next" && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      for (const b of Array.from(document.querySelectorAll("button"))) {
        if (/Show more/i.test(b.innerText)) b.click();
      }
    });
    await page.waitForTimeout(1500);
    const streamStep2 = await page.evaluate(() => {
      return (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean);
    });
    console.log("StreamSnap AI Release Step 2 full text:", JSON.stringify(streamStep2.slice(0, 60)));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
