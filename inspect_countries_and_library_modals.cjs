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
    // 1. Inspect Countries modal on SendKiss Closed Testing
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/tracks/4699519089607343114?tab=countryAvailability", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => /Add countries/i.test(b.innerText.trim()) && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const cb = document.querySelector("material-checkbox, [role='checkbox']");
      if (cb && cb.getAttribute("aria-checked") !== "true") cb.click();
    });
    await page.waitForTimeout(1500);
    const countriesBtns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button, material-button")).filter(b => b.offsetWidth > 0).map(b => ({
        tag: b.tagName,
        text: b.innerText.trim(),
        disabled: b.disabled || b.getAttribute("aria-disabled") === "true"
      }));
    });
    console.log("Countries modal buttons after checking:", JSON.stringify(countriesBtns));

    // 2. Inspect 'Add from library' modal on SendKiss Closed Testing release
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/tracks/4699519089607343114?tab=releases", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(b => /Edit release|Resume draft|Create new release/i.test(b.innerText.trim()) && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => /Add from library/i.test(b.innerText.trim()) && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    const libDom = await page.evaluate(() => {
      const cbs = Array.from(document.querySelectorAll("material-checkbox, [role='checkbox'], input[type='checkbox'], input[type='radio'], [role='radio'], tr, [role='row']")).filter(el => el.offsetWidth > 0).map(el => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        aria: el.getAttribute("aria-label"),
        text: (el.innerText || "").trim().slice(0, 80)
      }));
      const btns = Array.from(document.querySelectorAll("button, material-button")).filter(b => b.offsetWidth > 0).map(b => ({
        tag: b.tagName,
        text: b.innerText.trim(),
        disabled: b.disabled
      }));
      return { cbs: cbs.slice(0, 15), btns: btns.slice(-10) };
    });
    console.log("Add from library DOM:", JSON.stringify(libDom, null, 2));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
