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

  // First let's check App access
  console.log("\n--- Checking App access ---");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`);
  await page.waitForTimeout(3000);
  try {
    await page.click("text='Sign-in details'");
    await page.waitForTimeout(3000);
    console.log("App access URL:", page.url());
    const radios = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("material-radio, input[type='radio'], [role='radio']")).map(r => r.innerText || r.getAttribute("aria-label"));
    });
    console.log("App access radios:", radios);
  } catch (e) {
    console.error("Error on App access:", e.message);
  }

  // Next let's check Ads
  console.log("\n--- Checking Ads ---");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`);
  await page.waitForTimeout(3000);
  try {
    await page.click("text='Ads'");
    await page.waitForTimeout(3000);
    console.log("Ads URL:", page.url());
    const radios = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("material-radio, input[type='radio'], [role='radio']")).map(r => r.innerText || r.getAttribute("aria-label"));
    });
    console.log("Ads radios:", radios);
  } catch (e) {
    console.error("Error on Ads:", e.message);
  }

  // Next let's check Content rating
  console.log("\n--- Checking Content rating ---");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`);
  await page.waitForTimeout(3000);
  try {
    await page.click("text='Content rating'");
    await page.waitForTimeout(3000);
    console.log("Content rating URL:", page.url());
  } catch (e) {
    console.error("Error on Content rating:", e.message);
  }

  // Next let's check Target audience
  console.log("\n--- Checking Target audience ---");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`);
  await page.waitForTimeout(3000);
  try {
    await page.click("text='Target audience'");
    await page.waitForTimeout(3000);
    console.log("Target audience URL:", page.url());
  } catch (e) {
    console.error("Error on Target audience:", e.message);
  }

  // Next let's check Data safety
  console.log("\n--- Checking Data safety ---");
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`);
  await page.waitForTimeout(3000);
  try {
    await page.click("text='Data safety'");
    await page.waitForTimeout(3000);
    console.log("Data safety URL:", page.url());
  } catch (e) {
    console.error("Error on Data safety:", e.message);
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
