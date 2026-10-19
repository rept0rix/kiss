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
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 1200 });

  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/store-listings/default/edit");
  await page.waitForTimeout(6000);

  // Fill text assets first
  console.log("Filling short description and full description...");
  const textareas = await page.$$("textarea");
  console.log("Found textareas:", textareas.length);
  if (textareas.length >= 2) {
    await textareas[0].fill("Send virtual kisses with sound, haptics, and custom styles to your loved ones.");
    await page.waitForTimeout(500);

    const fullDesc = `Welcome to SendKiss — the sweetest and most interactive way to stay close to the people you love!

Whether you are in a long-distance relationship, missing your partner, or just want to send a warm romantic gesture, SendKiss lets you deliver personalized digital kisses with real haptic feedback, custom sound effects, and vibrant animated kiss styles.

Key Features:
💋 Instant Interactive Kisses: Send and receive kisses that light up your screen with authentic haptics and touch animations.
🎨 Custom Kiss Styles: Choose from classic red lipstick, glowing neon, glitter, hearts, and seasonal themes.
🔊 Romantic Sound Effects: Pair each kiss with romantic audio messages or sweet audio notes.
📱 Stay Connected: Perfect for couples, long-distance relationships, family, and best friends.
🔒 Private & Secure: Your intimate moments are protected with complete privacy.

Download SendKiss today and send some love to someone special!`;
    await textareas[1].fill(fullDesc);
    await page.waitForTimeout(1000);
  }

  // Upload Feature Graphic (button 1)
  const addButtons = await page.$$("button:has-text('Add assets'), button:has-text('Upload')");
  console.log("Add buttons count:", addButtons.length);

  if (addButtons.length >= 2) {
    console.log("Triggering filechooser for Feature Graphic (button 1)...");
    const [fileChooser1] = await Promise.all([
      page.waitForEvent('filechooser'),
      addButtons[1].click()
    ]);
    console.log("FileChooser opened! Uploading feature graphic...");
    await fileChooser1.setFiles("/Users/naoryanko/kiss/store_assets/sendkiss_feature_1024x500.png");
    await page.waitForTimeout(5000);
  }

  // Upload Screenshots (button 2)
  if (addButtons.length >= 3) {
    console.log("Triggering filechooser for Screenshots (button 2)...");
    const [fileChooser2] = await Promise.all([
      page.waitForEvent('filechooser'),
      addButtons[2].click()
    ]);
    console.log("FileChooser opened! Uploading phone screenshots...");
    await fileChooser2.setFiles([
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot1_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot2_1080x1920.png",
      "/Users/naoryanko/kiss/store_assets/sendkiss_shot3_1080x1920.png"
    ]);
    await page.waitForTimeout(6000);
  }

  // Click Save or Next
  const saveBtn = await page.$("button:has-text('Save'), button:has-text('Save as draft')");
  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Next disabled?", nextBtn ? await nextBtn.isDisabled() : "no next");

  if (saveBtn && !(await saveBtn.isDisabled())) {
    console.log("Clicking Save...");
    await saveBtn.click();
    await page.waitForTimeout(3000);
  }

  if (nextBtn && !(await nextBtn.isDisabled())) {
    console.log("Clicking Next...");
    await nextBtn.click();
    await page.waitForTimeout(5000);

    // If step 2 (Review) has a Save button
    const saveReview = await page.$("button:has-text('Save')");
    if (saveReview && !(await saveReview.isDisabled())) {
      console.log("Clicking Save on Review step...");
      await saveReview.click();
      await page.waitForTimeout(4000);
    }
  }

  await page.screenshot({ path: "/Users/naoryanko/kiss/sendkiss_store_saved.png", fullPage: true });
  console.log("SendKiss store listing update completed!");

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
