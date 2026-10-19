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

  // Find all buttons inside table rows
  const result = await page.evaluate(async () => {
    const rows = Array.from(document.querySelectorAll("tr, [role='row']"));
    const v1Row = rows.find(r => (r.innerText.includes("1 (1.0)") || r.innerText.includes("API 35")) && !r.innerText.includes("2 (1.0.1)"));
    if (!v1Row) return "v1Row not found";

    // Find the more_vert / Manage artifact button in this row
    const buttons = Array.from(v1Row.querySelectorAll("button, [role='button']"));
    const moreBtn = buttons.find(b => b.innerText.includes("more_vert") || (b.getAttribute("aria-label") && b.getAttribute("aria-label").toLowerCase().includes("manage")));
    if (!moreBtn) return "moreBtn not found, buttons: " + buttons.map(b => b.innerText || b.getAttribute("aria-label")).join(", ");

    // Dispatch click events on moreBtn
    moreBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    moreBtn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
    moreBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return "Dispatched click on moreBtn";
  });
  console.log("Result:", result);

  await page.waitForTimeout(1500);

  // Check all menuitems / buttons currently visible anywhere in the document
  const visibleItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("*"))
      .filter(el => {
        const text = el.innerText || "";
        return (text === "Delete app bundle" || text === "Delete" || text === "Remove app bundle" || text === "Remove");
      })
      .map(el => ({
        tag: el.tagName,
        text: el.innerText,
        role: el.getAttribute("role"),
        class: el.className
      }));
  });
  console.log("Visible delete items:", visibleItems);

  // If found, click it!
  const clickedDelete = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("*"));
    for (const el of items) {
      const text = (el.innerText || "").trim();
      if (text === "Delete app bundle" || text === "Delete" || text === "Remove app bundle" || text === "Remove from release") {
        el.click();
        return "Clicked: " + text;
      }
    }
    return "Not clicked";
  });
  console.log("Clicked delete result:", clickedDelete);

  await page.waitForTimeout(2000);

  // Check for confirmation dialog button
  const confirmResult = await page.evaluate(() => {
    const dialogButtons = Array.from(document.querySelectorAll(".mat-dialog-container button, [role='dialog'] button, button.mat-button-base"));
    for (const b of dialogButtons) {
      const text = (b.innerText || "").trim();
      if (text === "Delete" || text === "Remove" || text === "Confirm") {
        b.click();
        return "Clicked confirm: " + text;
      }
    }
    return "No confirm button clicked";
  });
  console.log("Confirm result:", confirmResult);

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
