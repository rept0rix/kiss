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

  // Click Back button
  console.log("Clicking Back button...");
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
  console.log("URL after clicking Back:", page.url());

  // Inspect the bundles on prepare page
  const bundles = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr, [role='row']"));
    return rows.map(r => ({
      text: r.innerText.replace(/\n+/g, " | "),
      buttons: Array.from(r.querySelectorAll("button, [role='button']")).map(b => b.innerText.trim() || b.getAttribute("aria-label"))
    })).filter(r => r.text.includes(".aab") || r.text.includes("Version") || r.text.includes("1 (") || r.text.includes("2 ("));
  });
  console.log("Bundles rows found:\n", JSON.stringify(bundles, null, 2));

  // Find and click delete for version 1
  const deleteResult = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr, [role='row']"));
    for (const r of rows) {
      const text = r.innerText || "";
      // If this row is for version 1
      if ((text.includes("1 (1.0)") || text.includes(" 1 ") || text.includes("Version 1") || text.includes("API 35")) && !text.includes("2 (1.0.1)")) {
        const btn = r.querySelector("button [aria-label*='delete'], button");
        const allB = Array.from(r.querySelectorAll("button, [role='button']"));
        for (const b of allB) {
          const t = b.innerText || b.getAttribute("aria-label") || "";
          if (t.includes("delete") || t.includes("Delete") || t.includes("Remove")) {
            b.click();
            return "Clicked delete in row: " + text.slice(0, 50);
          }
        }
      }
    }
    return "Not found in rows";
  });
  console.log("Delete result:", deleteResult);

  await page.waitForTimeout(3000);

  // If modal confirm delete appears
  const modalDelete = await page.$(".mat-dialog-container button:has-text('Delete'), .mat-dialog-container button:has-text('Remove'), [role='dialog'] button:has-text('Delete')");
  if (modalDelete) {
    console.log("Confirming delete modal...");
    await modalDelete.click();
    await page.waitForTimeout(2000);
  }

  // Click Next
  console.log("Clicking Next...");
  const nextBtn = await page.$("button:has-text('Next')");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    await nextBtn.click();
    await page.waitForTimeout(4000);
    console.log("URL after Next:", page.url());

    const reviewStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.split("\n").filter(l => l.includes("Error") || l.includes("Warning") || l.includes("Save and publish") || l.includes("rollout") || l.includes("problems"));
    });
    console.log("Review status:\n", reviewStatus);

    // Click Save and publish!
    const publishBtn = await page.$("button:has-text('Save and publish'), button:has-text('Start rollout to Internal testing')");
    if (publishBtn && !(await publishBtn.isDisabled())) {
      console.log("Clicking Save and publish button!");
      await publishBtn.click();
      await page.waitForTimeout(3000);

      // Confirm dialog if any
      const confirmBtn = await page.$(".mat-dialog-container button:has-text('Save and publish'), .mat-dialog-container button:has-text('Rollout'), .mat-dialog-container button:has-text('Save'), .mat-dialog-container button:has-text('Publish')");
      if (confirmBtn) {
        console.log("Confirming rollout modal...");
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }
      console.log("SENDKISS RELEASE ROLLED OUT SUCCESSFULLY!");
    } else {
      console.log("Publish button state on review:", publishBtn ? (await publishBtn.isDisabled() ? "disabled" : "enabled") : "not found");
    }
  }

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
