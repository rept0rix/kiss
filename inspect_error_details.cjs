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
      if (p.url().includes("releases/1/review") || p.url().includes("4972175458793862190")) {
        page = p;
        break;
      }
    }
  }
  if (!page) page = await browser.contexts()[0].newPage();

  // Click all "Show more" or expand icons
  const showMoreButtons = await page.$$("text='Show more'");
  console.log(`Found ${showMoreButtons.length} Show more buttons`);
  for (const btn of showMoreButtons) {
    try { await btn.click(); await page.waitForTimeout(500); } catch(e) {}
  }

  const errorTexts = await page.evaluate(() => {
    const errorContainers = Array.from(document.querySelectorAll("[class*='error'], [class*='warning'], material-expansionpanel, .validation-result"));
    return errorContainers.map(c => c.innerText.trim()).filter(t => t.length > 0);
  });
  console.log("Error & warning contents:\n", JSON.stringify(errorTexts, null, 2));

  // Also full page text around errors
  const pageText = await page.evaluate(() => {
    const lines = document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean);
    const errIdx = lines.findIndex(l => l.includes("1 Error") || l.includes("Errors, warnings"));
    if (errIdx !== -1) {
      return lines.slice(errIdx, errIdx + 25);
    }
    return lines.slice(0, 30);
  });
  console.log("Page text around errors:\n", pageText);

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
