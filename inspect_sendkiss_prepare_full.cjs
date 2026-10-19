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
  const pages = browser.contexts()[0].pages();
  const page = pages.find(p => p.url().includes("4972175458793862190")) || pages[6];

  console.log("Navigating to prepare page...");
  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/tracks/4701692433853227392/releases/1/prepare");
  await page.waitForTimeout(6000);

  console.log("Current URL:", page.url());

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a[role='button']"))
      .map(b => ({
        text: b.innerText.trim(),
        aria: b.getAttribute("aria-label"),
        disabled: b.disabled || b.getAttribute("aria-disabled") === "true"
      }))
      .filter(b => b.text.length > 0 || b.aria);
  });
  console.log("Buttons found on prepare page:\n", JSON.stringify(buttons, null, 2));

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
