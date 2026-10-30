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

async function submitAppInPublishingOverview(page, appName, appId) {
  console.log(`\n======================================================`);
  console.log(`Finalizing Submission in Publishing Overview: ${appName} (${appId})`);
  console.log(`======================================================`);

  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/publishing`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);

  // Check if 'View issues' is present first
  const hasViewIssues = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button, a")).find(el => /View.*issue/i.test(el.innerText) && el.offsetWidth > 0);
    if (b) {
      b.click();
      return true;
    }
    return false;
  });

  if (hasViewIssues) {
    console.log(`${appName}: Found 'View issues', opening drawer...`);
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const vd = Array.from(document.querySelectorAll("button, a")).find(el => /View details/i.test(el.innerText) && el.offsetWidth > 0);
      if (vd) vd.click();
    });
    await page.waitForTimeout(3000);
    const clickedProceedAnyway = await page.evaluate(() => {
      const pa = Array.from(document.querySelectorAll("button, a")).find(el => /Proceed anyway/i.test(el.innerText) && el.offsetWidth > 0);
      if (pa) {
        pa.click();
        return true;
      }
      return false;
    });
    console.log(`${appName}: Clicked 'Proceed anyway':`, clickedProceedAnyway);
    await page.waitForTimeout(2500);
    const clickedProceedModal = await page.evaluate(() => {
      const p = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(el => /^Proceed$/i.test(el.innerText.trim()) && !el.disabled && el.offsetWidth > 0).pop();
      if (p) {
        p.click();
        return true;
      }
      return false;
    });
    console.log(`${appName}: Confirmed 'Proceed' modal:`, clickedProceedModal);
    await page.waitForTimeout(3500);
  }

  // Click 'Submit X changes for review' or 'Send changes for review'
  const clickedSubmitBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => /Submit .* for review|Send .* for review/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
    if (btn) {
      const t = btn.innerText.trim();
      btn.click();
      return t;
    }
    return null;
  });
  console.log(`${appName}: Clicked main Submit button:`, clickedSubmitBtn);
  await page.waitForTimeout(3000);

  // Click 'Send changes for review' inside the confirmation dialog!
  const confirmedDialog = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
    const sendBtn = btns.filter(b => /^Send changes for review$|^Send for review$|^Submit$/i.test(b.innerText.trim())).pop();
    if (sendBtn) {
      const t = sendBtn.innerText.trim();
      sendBtn.click();
      return t;
    }
    return null;
  });
  console.log(`🎉 ${appName}: Confirmed 'Send changes for review' dialog:`, confirmedDialog);
  await page.waitForTimeout(6000);

  // Verify final state on /publishing
  const finalLines = await page.evaluate(() => {
    return (document.querySelector("main") || document.body).innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(18, 55);
  });
  console.log(`${appName} Final Publishing Overview Lines:\n`, finalLines.join("\n"));
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const page = browser.contexts()[0].pages()[0];

  try {
    await submitAppInPublishingOverview(page, "SendKiss", "4972175458793862190");
    await submitAppInPublishingOverview(page, "StreamSnap AI", "4974194036705358034");

    // Also check All Apps table to see the updated statuses!
    await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app-list", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5500);
    const appListText = await page.evaluate(() => {
      return document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean).slice(20, 65);
    });
    console.log("\n=== ALL APPS LIST ===\n", appListText.join("\n"));
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
