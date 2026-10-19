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

  const apps = [
    { name: "SendKiss", id: "4972175458793862190" },
    { name: "StreamSnap AI", id: "4974194036705358034" }
  ];

  for (const app of apps) {
    console.log(`Setting Target Audience for ${app.name}...`);
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${app.id}/app-content/target-audience-content`);
    await page.waitForTimeout(4000);

    // Click "18 and over"
    await page.evaluate(() => {
      const cbs = Array.from(document.querySelectorAll("material-checkbox, [role='checkbox']"));
      for (const cb of cbs) {
        if (cb.innerText && cb.innerText.includes("18 and over")) {
          cb.click();
        }
      }
    });
    await page.waitForTimeout(1000);

    // Click Next
    await page.click("button:has-text('Next')");
    await page.waitForTimeout(3000);

    // Check if appeal to children radio exists
    const radios = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("material-radio, [role='radio']")).map(r => r.innerText);
    });
    console.log(`Radios on appeal to children (${app.name}):`, radios);

    // Select "No"
    await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll("material-radio, [role='radio']"));
      for (const r of radios) {
        if (r.innerText && (r.innerText.startsWith("No") || r.innerText.includes("No"))) {
          r.click();
          break;
        }
      }
    });
    await page.waitForTimeout(1000);

    // Click Next / Save
    const nextOrSave = await page.$("button:has-text('Next'), button:has-text('Save')");
    if (nextOrSave) {
      await nextOrSave.click();
      await page.waitForTimeout(3000);
    }

    // If summary screen appears with "Save"
    const finalSave = await page.$("button:has-text('Save')");
    if (finalSave && !await finalSave.isDisabled()) {
      await finalSave.click();
      await page.waitForTimeout(3000);
      console.log(`Target Audience saved for ${app.name}!`);
    } else {
      console.log(`Final save clicked or not needed for ${app.name}`);
    }
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
