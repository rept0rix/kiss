const fs = require("fs");
const { execSync, exec } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  let page;
  for (const p of browser.contexts()[0].pages()) {
    if (p.url().includes("4972175458793862190")) {
      page = p;
      break;
    }
  }

  const showMores = await page.$$("text='Show more'");
  for (const sm of showMores) {
    try { await sm.click(); } catch(e){}
  }
  await page.waitForTimeout(1000);

  const text = await page.evaluate(() => {
    const lines = document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean);
    const idx = lines.findIndex(l => l.includes("Error") || l.includes("Errors"));
    return lines.slice(idx, idx + 25);
  });
  console.log("Current errors:\n" + text.join("\n"));
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
