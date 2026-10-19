const fs = require("fs");
const { execSync, exec } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

function autoAllow() {
  const s = `tell application "System Events" to tell process "Comet"
repeat with w in windows
  try
    repeat with g in groups of w
      try
        click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of g
      end try
    end repeat
  end try
  try
    repeat with s in sheets of w
      try
        click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of s
      end try
    end repeat
  end try
end repeat
end tell`;
  try { execSync(`osascript -e '${s}'`, { stdio: "ignore" }); } catch (e) {}
  return setInterval(() => { exec(`osascript -e '${s}'`, () => {}); }, 500);
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  
  const pageSendKiss = pages.find(p => p.url().includes("4972175458793862190"));
  const pageStreamSnap = pages.find(p => p.url().includes("4974194036705358034"));

  async function checkApp(page, name) {
    console.log(`\n=== Checking ${name} ===`);
    const dashLink = await page.$("a:has-text('Dashboard'), button:has-text('Dashboard')");
    if (dashLink) {
      await dashLink.click();
      await page.waitForTimeout(4000);
    }
    console.log(`URL: ${page.url()}`);
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").filter(l => l.trim().length > 0 && !l.includes("Feedback") && !l.includes("Help"));
    const setupIndex = lines.findIndex(l => l.includes("complete") || l.includes("Set up your app"));
    if (setupIndex !== -1) {
      console.log(lines.slice(setupIndex, setupIndex + 25).join("\n"));
    } else {
      console.log("Setup section snippet:\n", lines.slice(15, 45).join("\n"));
    }
  }

  if (pageSendKiss) await checkApp(pageSendKiss, "SendKiss");
  if (pageStreamSnap) await checkApp(pageStreamSnap, "StreamSnap AI");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
