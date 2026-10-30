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

  const cbText = await page.evaluate(() => {
    const cb = document.querySelector("input[type='checkbox']");
    if (!cb) return "none";
    let p = cb.parentElement;
    while (p && p.innerText.trim().length === 0) p = p.parentElement;
    return p ? p.innerText : "no parent text";
  });
  console.log("Checkbox text:", cbText);

  // Now test filling email, checking radio 3, checking checkbox, and see if Next becomes enabled!
  console.log("Filling email...");
  await page.fill("input[type='email']", "na0ryank0@gmail.com");
  await page.waitForTimeout(500);

  console.log("Checking 3rd radio (All other app types)...");
  const radios = await page.$$("input[type='radio']");
  if (radios.length >= 3) {
    await radios[2].check({ force: true });
    await page.waitForTimeout(500);
  }

  console.log("Checking checkbox...");
  const cb = await page.$("input[type='checkbox']");
  if (cb) {
    await cb.check({ force: true });
    await page.waitForTimeout(500);
  }

  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Is Next button disabled now?", await nextBtn.isDisabled());

  if (nextBtn && !await nextBtn.isDisabled()) {
    console.log("Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(4000);
    console.log("URL after Next:", page.url());
    const step2Radios = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("material-radio, [role='radio'], input[type='radio']")).length;
    });
    console.log("Total radios on Step 2:", step2Radios);
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
