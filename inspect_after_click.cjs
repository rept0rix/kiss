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
  let page;
  for (const p of browser.contexts()[0].pages()) {
    if (p.url().includes("4972175458793862190")) {
      page = p;
      break;
    }
  }

  console.log("Current page URL:", page.url());

  // Find button with aria-label="Manage artifact"
  const manageButtons = await page.$$("button[aria-label='Manage artifact']");
  console.log("Found Manage artifact buttons:", manageButtons.length);

  if (manageButtons.length > 0) {
    // The first one is for version 1!
    console.log("Clicking first Manage artifact button...");
    await manageButtons[0].click();
    await page.waitForTimeout(2000);

    // List all newly visible buttons on page
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button, a, [role='menuitem'], span"))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.innerText && el.innerText.trim().length > 0;
        })
        .map(el => ({
          tag: el.tagName,
          text: el.innerText.trim(),
          role: el.getAttribute("role"),
          class: el.className
        }))
        .filter(el => el.text.includes("Remove") || el.text.includes("Delete") || el.text.includes("artifact") || el.text.includes("Discard") || el.text.includes("Download"));
    });
    console.log("Matching elements after click:\n", JSON.stringify(buttons, null, 2));
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
