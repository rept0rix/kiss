const fs = require("fs");
const { execSync, exec } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

function autoAllow() {
  const s = `tell application "System Events" to tell process "Comet" to repeat with w in windows
try
click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of sheet "Allow remote debugging?" of w
end try
try
click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of group 1 of w
end try
end repeat`;
  try { execSync(`osascript -e "${s}"`, { stdio: "ignore" }); } catch (e) {}
  return setInterval(() => { exec(`osascript -e "${s}"`, () => {}); }, 1000);
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  let page;
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      if (p.url().includes("releases/1/prepare") || p.url().includes("4972175458793862190")) {
        page = p;
        break;
      }
    }
  }
  if (!page) page = await browser.contexts()[0].newPage();

  console.log("Current URL:", page.url());
  const bodyText = await page.evaluate(() => {
    return document.body.innerText.split("\n").filter(l => l.trim().length > 0).slice(0, 45);
  });
  console.log("Page text:\n", bodyText);

  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Is Next button enabled?", nextBtn ? !(await nextBtn.isDisabled()) : "none");

  // If enabled, click Next!
  if (nextBtn && !(await nextBtn.isDisabled())) {
    console.log("Next is enabled! Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(4000);
    console.log("URL after Next:", page.url());
    const afterNextText = await page.evaluate(() => document.body.innerText.split("\n").filter(l => l.trim().length > 0).slice(0, 30));
    console.log("Text after Next:", afterNextText);
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
