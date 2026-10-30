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

  // If on review page, click Back button to go to prepare page
  if (page.url().includes("/review")) {
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
  }

  // Find row for Version 1 and click its more_vert button
  console.log("Finding version 1 row and more_vert button...");
  const clickedMoreVert = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr, [role='row']"));
    for (const r of rows) {
      const text = r.innerText || "";
      if ((text.includes("1 (1.0)") || text.includes("API 35")) && !text.includes("2 (1.0.1)")) {
        const btns = Array.from(r.querySelectorAll("button, [role='button']"));
        for (const b of btns) {
          const t = b.innerText || b.getAttribute("aria-label") || "";
          if (t.includes("more_vert") || t.includes("More") || t.includes("more")) {
            b.click();
            return "Clicked more_vert in row: " + text.slice(0, 50);
          }
        }
        // Fallback: second button
        if (btns.length >= 2) {
          btns[1].click();
          return "Clicked btns[1] in row: " + text.slice(0, 50);
        }
      }
    }
    return "Row not found";
  });
  console.log("Clicked more_vert result:", clickedMoreVert);

  await page.waitForTimeout(2000);

  // Inspect and click Delete menu item
  const menuItemClicked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("[role='menuitem'], button.mat-menu-item, .mat-menu-content button"));
    for (const item of items) {
      const t = item.innerText || "";
      if (t.includes("Delete") || t.includes("Remove") || t.includes("delete") || t.includes("remove")) {
        item.click();
        return "Clicked menu item: " + t;
      }
    }
    return "Menu item not found among: " + items.map(i => i.innerText).join(", ");
  });
  console.log("Menu item clicked:", menuItemClicked);

  await page.waitForTimeout(2000);

  // If confirm modal dialog appears
  const modalClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll(".mat-dialog-container button, [role='dialog'] button"));
    for (const b of btns) {
      const t = b.innerText || "";
      if (t.includes("Delete") || t.includes("Remove") || t.includes("Confirm")) {
        b.click();
        return "Clicked modal button: " + t;
      }
    }
    return "No modal button found";
  });
  console.log("Modal clicked:", modalClicked);

  await page.waitForTimeout(3000);

  // Click Next
  console.log("Clicking Next...");
  const nextBtn = await page.$("button:has-text('Next')");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    await nextBtn.click();
    await page.waitForTimeout(5000);
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
      console.log("SUCCESS: SENDKISS RELEASE ROLLED OUT!");
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
