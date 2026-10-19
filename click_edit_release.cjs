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
      if (p.url().includes("4972175458793862190")) {
        page = p;
        break;
      }
    }
  }
  if (!page) page = await browser.contexts()[0].newPage();

  console.log("Current URL:", page.url());

  // Click Edit release
  console.log("Clicking 'Edit release'...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
    for (const b of buttons) {
      if (b.innerText && b.innerText.trim() === "Edit release") {
        b.click();
        return;
      }
    }
  });
  await page.waitForTimeout(4000);

  console.log("URL after clicking Edit release:", page.url());

  // Look for file input
  const fileInputs = await page.$$("input[type='file']");
  console.log(`Found ${fileInputs.length} file inputs`);

  if (fileInputs.length > 0) {
    const aab = "/Users/naoryanko/kiss/app-release.aab";
    console.log(`Uploading ${aab} (${(fs.statSync(aab).size / (1024*1024)).toFixed(2)} MB)...`);
    await fileInputs[0].setInputFiles(aab);
    console.log("Upload started! Waiting for bundle upload to finish (up to 45s)...");

    for (let i = 0; i < 9; i++) {
      await page.waitForTimeout(5000);
      const text = await page.evaluate(() => {
        const body = document.body.innerText;
        return body.split("\n").filter(l => l.includes(".aab") || l.includes("versionCode") || l.includes("uploaded") || l.includes("uploading") || l.includes("%") || l.includes("Error") || l.includes("online.sendkiss.app"));
      });
      console.log(`Status at ${(i+1)*5}s:`, text);
      // Check if uploaded successfully
      const isDone = await page.evaluate(() => {
        return document.body.innerText.includes("online.sendkiss.app") || document.body.innerText.includes("app-release.aab");
      });
      if (isDone) {
        console.log("Bundle detected on page!");
        break;
      }
    }

    // Save and check next
    const nextBtn = await page.$("button:has-text('Next')");
    console.log("Is Next button enabled?", nextBtn ? !(await nextBtn.isDisabled()) : "no next button");
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
