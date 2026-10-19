const fs = require("fs");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

(async () => {
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages.find(p => p.url().includes("releases/2/prepare"));
  if (page) {
    console.log("Found release 2 prepare page!");
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").filter(l => l.trim().length > 0 && !l.includes("Feedback") && !l.includes("Help"));
    console.log("Lines on prepare:\n", lines.slice(0, 40).join("\n"));
  } else {
    console.log("Not found release 2 page, pages are:", pages.map(p => p.url()));
  }
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
