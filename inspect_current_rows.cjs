const fs = require("fs");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages.find(p => p.url().includes("4972175458793862190")) || pages[6];
  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("tr, [role='row']")).map(r => r.innerText.replace(/\n+/g, " | "));
  });
  console.log("Rows found:\n", JSON.stringify(rows, null, 2));
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
