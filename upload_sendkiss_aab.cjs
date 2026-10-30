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

  const appId = "4972175458793862190"; // SendKiss
  console.log("Navigating to SendKiss internal testing tracks...");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/tracks/4701692433853227392`);
  await page.waitForTimeout(4000);

  console.log("Current URL:", page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.split("\n").filter(l => l.trim().length > 0).slice(0, 30));
  console.log("Tracks page text:", bodyText);

  // Look for Edit release or Create new release
  const editBtn = await page.$("button:has-text('Edit release'), a:has-text('Edit release'), button:has-text('Create new release')");
  if (editBtn) {
    console.log("Clicking Edit release / Create new release...");
    await editBtn.click();
    await page.waitForTimeout(4000);
  }

  console.log("Release page URL:", page.url());
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input[type='file']")).map(i => ({
      accept: i.accept,
      id: i.id,
      className: i.className
    }));
  });
  console.log("File inputs found:", inputs);

  // If there's a file input, upload app-release.aab
  const aabPath = "/Users/naoryanko/kiss/app-release.aab";
  console.log(`Checking if ${aabPath} exists:`, fs.existsSync(aabPath), fs.statSync(aabPath).size);

  const fileInput = await page.$("input[type='file']");
  if (fileInput) {
    console.log("Uploading AAB bundle to release...");
    await fileInput.setInputFiles(aabPath);
    console.log("Upload triggered, waiting 15s for processing...");
    await page.waitForTimeout(15000);

    const afterUploadText = await page.evaluate(() => document.body.innerText.split("\n").filter(l => l.trim().length > 0).slice(0, 35));
    console.log("Text after upload:\n", afterUploadText);
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
