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
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/content-rating-iarc-questionnaire`);
  await page.waitForTimeout(4000);

  console.log("Current URL:", page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Body text:\n", bodyText.split("\n").filter(l => l.trim().length > 0).slice(0, 40));

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input")).map(i => ({
      type: i.type,
      name: i.name,
      value: i.value,
      checked: i.checked,
      ariaLabel: i.getAttribute("aria-label")
    }));
  });
  console.log("Inputs:", inputs);

  // Check buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, [role='button']")).map(b => ({
      text: b.innerText ? b.innerText.trim() : "",
      disabled: b.disabled || b.getAttribute("aria-disabled") === "true"
    })).filter(b => b.text.length > 0);
  });
  console.log("Buttons:", buttons);

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
