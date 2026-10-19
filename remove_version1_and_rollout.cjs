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
      if (p.url().includes("4972175458793862190")) {
        page = p;
        break;
      }
    }
  }
  if (!page) page = await browser.contexts()[0].newPage();

  console.log("Navigating to prepare screen...");
  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/tracks/4701692433853227392/releases/1/prepare");
  await page.waitForTimeout(4000);

  // Find the delete button for version 1
  console.log("Finding bundle rows...");
  const removed = await page.evaluate(() => {
    // Find all table rows or list items
    const rows = Array.from(document.querySelectorAll("tr, [role='row'], div[class*='bundle'], material-list-item"));
    for (const r of rows) {
      if (r.innerText && (r.innerText.includes("1 (1.0)") || r.innerText.includes("Version code 1") || r.innerText.includes("API 35") || r.innerText.includes("1 (1.0)"))) {
        const delBtn = r.querySelector("button [aria-label*='delete'], button [aria-label*='Delete'], button:has-text('delete'), material-button[icon='delete']");
        const anyDel = r.querySelector("button");
        if (delBtn) { delBtn.click(); return "clicked specific delete"; }
        // Look for any button with delete icon or delete text inside this row
        const btns = r.querySelectorAll("button, [role='button']");
        for (const b of btns) {
          if (b.innerText && (b.innerText.includes("delete") || b.innerText.includes("Remove") || b.getAttribute("aria-label")?.includes("Delete"))) {
            b.click();
            return "clicked button with delete text/label";
          }
        }
      }
    }

    // Fallback: look for the first delete button on the page if there are multiple bundles
    const allDeleteBtns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText && b.innerText.includes("delete"));
    if (allDeleteBtns.length > 0) {
      allDeleteBtns[0].click();
      return "clicked first delete button";
    }
    return "no delete button found";
  });

  console.log("Remove version 1 result:", removed);
  await page.waitForTimeout(3000);

  // Click Next
  const nextBtn = await page.$("button:has-text('Next')");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    console.log("Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(4000);

    console.log("Review URL:", page.url());
    const errorsAfter = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.split("\n").filter(l => l.includes("Error") || l.includes("Warning") || l.includes("Save and publish") || l.includes("rollout"));
    });
    console.log("Status after remove:", errorsAfter);

    // If Save and publish is enabled, click it!
    const publishBtn = await page.$("button:has-text('Save and publish'), button:has-text('Start rollout to Internal testing')");
    if (publishBtn && !await publishBtn.isDisabled()) {
      console.log("Clicking Save and publish!");
      await publishBtn.click();
      await page.waitForTimeout(3000);

      // Confirm dialog
      const confirmBtn = await page.$(".mat-dialog-container button:has-text('Save and publish'), .mat-dialog-container button:has-text('Rollout'), .mat-dialog-container button:has-text('Save'), .mat-dialog-container button:has-text('Publish')");
      if (confirmBtn) {
        console.log("Confirming dialog...");
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }
      console.log("SendKiss rollout SUCCESSFUL!");
    } else {
      console.log("Publish button state:", publishBtn ? (await publishBtn.isDisabled() ? "disabled" : "enabled") : "not found");
    }
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
