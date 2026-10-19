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

async function doAppRating(browser, appId, name) {
  console.log(`\n=================== Content Rating for ${name} ===================`);
  const page = await browser.contexts()[0].newPage();
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/content-rating-overview`);
  await page.waitForTimeout(5000);

  const startBtn = await page.$("button:has-text('Start new questionnaire'), button:has-text('Start questionnaire'), button:has-text('Edit')");
  if (startBtn) {
    console.log("Clicking Start/Edit questionnaire...");
    await startBtn.click();
    await page.waitForTimeout(4000);
  }

  console.log("Filling email and selecting category...");
  const emailInput = await page.$("input[type='email']");
  if (emailInput) {
    await emailInput.fill("na0ryank0@gmail.com");
    await page.waitForTimeout(500);
  }

  // Radio 3: All other app types
  const radios = await page.$$("input[type='radio']");
  console.log("Found radios on step 1:", radios.length);
  if (radios.length >= 3) {
    await radios[2].check({ force: true });
    await page.waitForTimeout(500);
  }

  // Checkbox for IARC agreement
  const cb = await page.$("input[type='checkbox']");
  if (cb) {
    await cb.check({ force: true });
    await page.waitForTimeout(500);
  }

  const nextBtn1 = await page.$("button:has-text('Next')");
  console.log("Next 1 disabled?", await nextBtn1.isDisabled());
  if (nextBtn1 && !await nextBtn1.isDisabled()) {
    await nextBtn1.click();
    await page.waitForTimeout(5000);
  }

  console.log("URL on Step 2:", page.url());

  // Answer all "No" radio buttons
  // On Step 2, each question has radio buttons (Yes / No). Typically "No" is the second radio of each group!
  const step2Radios = await page.$$("input[type='radio']");
  console.log("Found Step 2 radios:", step2Radios.length);

  // Click every label that says "No"
  const clickedNo = await page.evaluate(() => {
    let count = 0;
    const labels = Array.from(document.querySelectorAll("label, [role='radio'], material-radio"));
    for (const l of labels) {
      const text = (l.innerText || "").trim();
      if (text === "No" || text.startsWith("No")) {
        l.click();
        count++;
      }
    }
    return count;
  });
  console.log("Clicked No labels:", clickedNo);
  await page.waitForTimeout(2000);

  // Click Save
  const saveBtn = await page.$("button:has-text('Save')");
  if (saveBtn && !(await saveBtn.isDisabled())) {
    console.log("Clicking Save...");
    await saveBtn.click();
    await page.waitForTimeout(3000);
  }

  // Click Next
  const nextBtn2 = await page.$("button:has-text('Next')");
  if (nextBtn2 && !(await nextBtn2.isDisabled())) {
    console.log("Clicking Next to Step 3...");
    await nextBtn2.click();
    await page.waitForTimeout(4000);
  }

  // Step 3: Click Submit / Save
  const submitBtn = await page.$("button:has-text('Submit'), button:has-text('Save')");
  if (submitBtn && !(await submitBtn.isDisabled())) {
    console.log("Clicking Submit...");
    await submitBtn.click();
    await page.waitForTimeout(4000);
    console.log(`🎉 SUCCESS: Content Rating submitted for ${name}! 🎉`);
  } else {
    console.log("Submit button state:", submitBtn ? (await submitBtn.isDisabled() ? "disabled" : "enabled") : "not found");
  }

  await page.close();
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);

  await doAppRating(browser, "4972175458793862190", "SendKiss");
  await doAppRating(browser, "4974194036705358034", "StreamSnap AI");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
