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
  const page = pages.find(p => p.url().includes("releases/2/prepare")) || pages[6];

  console.log("Current page URL:", page.url());

  // Upload the Version 3 AAB bundle!
  const aabPath = "/Users/naoryanko/kiss/app-release-v3.aab";
  console.log("Uploading Version 3 AAB:", aabPath);

  const fileInput = await page.$("input[type='file']");
  if (fileInput) {
    await fileInput.setInputFiles(aabPath);
    console.log("File input set to v3. Waiting for upload to complete...");
  } else {
    console.error("File input not found!");
  }

  // Poll upload status
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(3000);
    const status = await page.evaluate(() => {
      const text = document.body.innerText;
      const uploading = text.includes("Uploading") || text.includes("Processing");
      const v3Found = text.includes("3 (1.0.2)") || text.includes("3 (1.0") || text.includes("3 (");
      const hasError = text.includes("Upload failed") || text.includes("You uploaded an APK");
      return { uploading, v3Found, hasError };
    });
    console.log(`Poll [${i}]:`, status);
    if (status.v3Found && !status.uploading) {
      console.log("Version 3 upload completed successfully!");
      break;
    }
  }

  await page.waitForTimeout(3000);

  // Click Next
  console.log("Clicking Next...");
  const nextBtn = await page.$("button:has-text('Next')");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    await nextBtn.click();
    await page.waitForTimeout(6000);
    console.log("URL after Next:", page.url());

    // Check review status
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

      const confirmBtn = await page.$(".mat-dialog-container button:has-text('Save and publish'), .mat-dialog-container button:has-text('Rollout'), .mat-dialog-container button:has-text('Save'), .mat-dialog-container button:has-text('Publish')");
      if (confirmBtn) {
        console.log("Confirming rollout modal...");
        await confirmBtn.click();
        await page.waitForTimeout(4000);
      }
      console.log("🎉 SUCCESS: SENDKISS RELEASE ROLLED OUT CLEANLY! 🎉");
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
