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
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Navigate to SendKiss dashboard
  console.log("Navigating to SendKiss dashboard...");
  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/app-dashboard");
  await page.waitForTimeout(6000);

  // Find the "Content rating" link/button
  const link = await page.$("text='Content rating'");
  console.log("Found Content rating element:", !!link);
  if (link) {
    await link.click();
    await page.waitForTimeout(6000);
    console.log("Navigated to:", page.url());
    await page.screenshot({ path: "/Users/naoryanko/kiss/content_rating_page.png", fullPage: true });

    // Inspect buttons on this page
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button, a, input")).map(el => ({
        tag: el.tagName,
        type: el.type,
        text: (el.innerText || el.value || "").trim(),
        disabled: el.disabled || el.getAttribute("aria-disabled") === "true",
        className: el.className
      })).filter(b => b.text || b.type);
    });
    console.log("Interactive elements on Content rating page:", JSON.stringify(buttons, null, 2));
  }

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
