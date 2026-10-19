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

  console.log("Current URL:", page.url());
  const initialText = await page.evaluate(() => document.body.innerText.split("\n").filter(l => l.trim().length > 0).slice(0, 30));
  console.log("Initial text:", initialText);

  // Click 18 and over
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("label, material-checkbox, [role='checkbox'], div, span"));
    for (const l of labels) {
      if (l.innerText && l.innerText.trim() === "18 and over") {
        l.click();
        break;
      }
    }
  });
  await page.waitForTimeout(1000);

  // Check next button
  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Next button disabled?", await nextBtn.isDisabled());
  if (nextBtn && !await nextBtn.isDisabled()) {
    await nextBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log("After clicking Next, URL:", page.url());
  const step2Text = await page.evaluate(() => document.body.innerText.split("\n").filter(l => l.trim().length > 0).slice(0, 30));
  console.log("Step 2 text:", step2Text);

  const step2Elements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input, material-radio, [role='radio'], button")).map(el => ({
      tag: el.tagName,
      role: el.getAttribute("role"),
      type: el.getAttribute("type"),
      text: el.innerText ? el.innerText.trim().replace(/\n+/g, " ") : ""
    }));
  });
  console.log("Step 2 interactive elements:", step2Elements);

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
