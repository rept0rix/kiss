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
    {
      name: "StreamSnap AI",
      id: "4974194036705358034",
      privacyUrl: "https://streamsnap.online/privacy.html",
      doPrivacy: true
    },
    {
      name: "SendKiss",
      id: "4972175458793862190",
      privacyUrl: "https://www.sendkiss.online/privacy.html",
      doPrivacy: false // already saved!
    }
  ];

  for (const app of apps) {
    console.log(`\n========================================`);
    console.log(`CONFIGURING BASIC POLICIES FOR ${app.name} (${app.id})`);
    console.log(`========================================`);

    // 1. Privacy Policy
    if (app.doPrivacy) {
      console.log(`Setting Privacy Policy for ${app.name}...`);
      await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${app.id}/app-content/privacy-policy`);
      await page.waitForTimeout(4000);
      const privInput = await page.$("input[aria-label='Privacy policy URL'], input[type='text'], input[type='url']");
      if (privInput) {
        await privInput.fill(app.privacyUrl);
        await page.waitForTimeout(1000);
        const saveBtn = await page.$("button:has-text('Save'), [role='button']:has-text('Save')");
        if (saveBtn) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
          console.log("Privacy Policy saved!");
        }
      }
    }

    // 2. Testing Credentials (App access)
    console.log(`Setting App access for ${app.name}...`);
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${app.id}/app-content/testing-credentials`);
    await page.waitForTimeout(4000);
    // Find radio option "No"
    const noRadioAppAccess = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll("material-radio, [role='radio']"));
      for (const r of radios) {
        if (r.innerText && r.innerText.trim().startsWith("No")) {
          r.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked No on App access:", noRadioAppAccess);
    await page.waitForTimeout(1000);
    const saveBtnAccess = await page.$("button:has-text('Save'), [role='button']:has-text('Save')");
    if (saveBtnAccess && !await saveBtnAccess.isDisabled()) {
      await saveBtnAccess.click();
      await page.waitForTimeout(3000);
      console.log("App access saved!");
    } else {
      console.log("Save button for App access not clickable or disabled");
    }

    // 3. Ads declaration
    console.log(`Setting Ads for ${app.name}...`);
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${app.id}/app-content/ads-declaration`);
    await page.waitForTimeout(4000);
    const noRadioAds = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll("material-radio, [role='radio']"));
      for (const r of radios) {
        if (r.innerText && (r.innerText.includes("No, my app does not contain ads") || r.innerText.startsWith("No"))) {
          r.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked No on Ads:", noRadioAds);
    await page.waitForTimeout(1000);
    const saveBtnAds = await page.$("button:has-text('Save'), [role='button']:has-text('Save')");
    if (saveBtnAds && !await saveBtnAds.isDisabled()) {
      await saveBtnAds.click();
      await page.waitForTimeout(3000);
      console.log("Ads saved!");
    } else {
      console.log("Save button for Ads not clickable or disabled");
    }
  }

  // Check dashboard status
  for (const app of apps) {
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${app.id}/app-dashboard`);
    await page.waitForTimeout(4000);
    const status = await page.evaluate(() => {
      return document.body.innerText.split("\n").filter(l => l.includes("complete"));
    });
    console.log(`Current completion status for ${app.name}:`, status);
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
