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
    // 1. On StreamSnap AI Release Step 2, click 'Show more' -> 'Go to declaration'
    console.log("=== 1. Opening StreamSnap AI Photo/Video Declaration via 'Show more' -> 'Go to declaration' ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4974194036705358034/tracks/4700120161555852153/releases/1/review", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);

    await page.evaluate(() => {
      for (const b of Array.from(document.querySelectorAll("button"))) {
        if (/Show more/i.test(b.innerText)) b.click();
      }
    });
    await page.waitForTimeout(2000);

    const declClicked = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("a, button")).find(b => /Go to declaration/i.test(b.innerText) && b.offsetWidth > 0);
      if (el) {
        const href = el.getAttribute("href");
        el.click();
        return { text: el.innerText.trim(), href };
      }
      return null;
    });
    console.log("Clicked 'Go to declaration':", JSON.stringify(declClicked));
    await page.waitForTimeout(5500);

    const declPageInfo = await page.evaluate(() => {
      const cbs = Array.from(document.querySelectorAll("material-checkbox, [role='checkbox']")).filter(c => c.offsetWidth > 0).map(c => ({
        checked: c.getAttribute("aria-checked"),
        text: (c.parentElement ? c.parentElement.innerText : c.innerText).trim().slice(0, 100)
      }));
      const radios = Array.from(document.querySelectorAll("material-radio, [role='radio']")).filter(r => r.offsetWidth > 0).map(r => ({
        checked: r.getAttribute("aria-checked"),
        text: (r.parentElement ? r.parentElement.innerText : r.innerText).trim().slice(0, 100)
      }));
      return {
        url: location.href,
        cbs,
        radios,
        text: (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean)
      };
    });
    console.log("StreamSnap AI Photo/Video Declaration Page:", JSON.stringify(declPageInfo, null, 2));

    // 2. On SendKiss Publishing Overview, click 'View issues' (/View.*issue/i)
    console.log("\n=== 2. Clicking 'View issues' on SendKiss Publishing Overview ===");
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/publishing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);

    const clickedViewIssues = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => /View.*issue/i.test(b.innerText) && b.offsetWidth > 0);
      if (btn) {
        btn.click();
        return btn.innerText.trim();
      }
      return null;
    });
    console.log("Clicked View issues on SendKiss:", clickedViewIssues);
    await page.waitForTimeout(4500);

    const sendkissIssues = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button")).filter(el => el.offsetWidth > 0 && /fix|go to|update|edit|manage|complete|show more|expand_more/i.test(el.innerText)).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        href: el.getAttribute("href")
      }));
      return {
        url: location.href,
        mainText: (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean),
        links
      };
    });
    console.log("SendKiss View issues page:", JSON.stringify(sendkissIssues, null, 2));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
