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
      if (p.url().includes("7275830997865972611")) {
        page = p;
        break;
      }
    }
  }
  if (!page) page = await browser.contexts()[0].newPage();

  const appId = "4972175458793862190"; // SendKiss
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/target-audience-content`);
  await page.waitForTimeout(4000);

  // Click the 6th checkbox (index 5: 18 and over)
  const checkboxes = await page.$$("input[type='checkbox']");
  console.log(`Found ${checkboxes.length} checkboxes`);
  if (checkboxes.length >= 6) {
    console.log("Checking index 5 (18 and over)...");
    await checkboxes[5].check({ force: true });
    await page.waitForTimeout(1000);
  }

  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Next button disabled after check?", await nextBtn.isDisabled());
  if (nextBtn && !await nextBtn.isDisabled()) {
    console.log("Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(3000);
    console.log("New URL after Next:", page.url());
    const step2Html = await page.evaluate(() => document.body.innerText);
    console.log("Step 2 text snippet:", step2Html.split("\n").filter(l => l.trim().length > 0).slice(0, 35));
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
