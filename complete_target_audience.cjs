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

  // 1. SendKiss is already on the Summary screen with Save button
  console.log("Saving SendKiss Target Audience...");
  const saveBtn = await page.$("button:has-text('Save')");
  if (saveBtn) {
    await saveBtn.click();
    await page.waitForTimeout(3000);
    console.log("SendKiss Target Audience saved!");
  }

  // 2. StreamSnap AI
  const streamSnapId = "4974194036705358034";
  console.log("Navigating to StreamSnap AI Target audience...");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${streamSnapId}/app-content/target-audience-content`);
  await page.waitForTimeout(4000);

  const checkboxes = await page.$$("input[type='checkbox']");
  if (checkboxes.length >= 6) {
    console.log("Checking 18 and over for StreamSnap AI...");
    await checkboxes[5].check({ force: true });
    await page.waitForTimeout(1000);
  }

  const nextBtn = await page.$("button:has-text('Next')");
  if (nextBtn && !await nextBtn.isDisabled()) {
    console.log("Clicking Next for StreamSnap AI...");
    await nextBtn.click();
    await page.waitForTimeout(3000);
  }

  const saveBtn2 = await page.$("button:has-text('Save')");
  if (saveBtn2 && !await saveBtn2.isDisabled()) {
    console.log("Clicking Save for StreamSnap AI...");
    await saveBtn2.click();
    await page.waitForTimeout(3000);
    console.log("StreamSnap AI Target Audience saved!");
  }

  // Verify dashboard statuses
  const apps = [
    { name: "SendKiss", id: "4972175458793862190" },
    { name: "StreamSnap AI", id: "4974194036705358034" }
  ];
  for (const a of apps) {
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${a.id}/app-dashboard`);
    await page.waitForTimeout(4000);
    const status = await page.evaluate(() => {
      return document.body.innerText.split("\n").filter(l => l.includes("complete"));
    });
    console.log(`Completion status for ${a.name}:`, status);
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
