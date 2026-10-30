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

  // Click Back if on review
  if (page.url().includes("/review")) {
    console.log("Clicking Back...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
      for (const b of buttons) {
        if (b.innerText && b.innerText.trim() === "Back") {
          b.click();
          return;
        }
      }
    });
    await page.waitForTimeout(4000);
  }

  // Find the exact more_vert button using Playwright locator
  console.log("Finding row with version 1...");
  // Let's find row that contains "1 (1.0)"
  const rows = await page.$$("tr, [role='row']");
  let targetBtn = null;
  for (const r of rows) {
    const text = await r.innerText();
    if ((text.includes("1 (1.0)") || text.includes("API 35")) && !text.includes("2 (1.0.1)")) {
      console.log("Found row 1 text:", text.replace(/\n+/g, " | "));
      const btns = await r.$$("button, [role='button']");
      for (const b of btns) {
        const bText = await b.innerText();
        const aria = await b.getAttribute("aria-label");
        console.log("Button in row:", { bText, aria });
        if (bText.includes("more_vert") || (aria && aria.includes("More")) || bText.includes("More")) {
          targetBtn = b;
          break;
        }
      }
      if (!targetBtn && btns.length >= 2) {
        targetBtn = btns[1];
      }
    }
  }

  if (targetBtn) {
    console.log("Clicking target more_vert button with Playwright click()...");
    await targetBtn.click();
    await page.waitForTimeout(1500);

    // Look for all visible menu items or overlays
    const overlays = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("[role='menuitem'], .mat-menu-item, [role='menu'], .cdk-overlay-pane"));
      return items.map(i => ({
        tag: i.tagName,
        text: i.innerText,
        role: i.getAttribute("role"),
        html: i.outerHTML.slice(0, 150)
      }));
    });
    console.log("Overlays / Menu items found:", JSON.stringify(overlays, null, 2));
  } else {
    console.log("Target button not found!");
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
