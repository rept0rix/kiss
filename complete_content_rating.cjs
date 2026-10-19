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

async function fillQuestionnaire(page, appName, appId) {
  console.log(`\n========================================`);
  console.log(`COMPLETING CONTENT RATING FOR ${appName} (${appId})`);
  console.log(`========================================`);

  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/content-rating-overview`);
  await page.waitForTimeout(5000);

  // Check if questionnaire already completed
  const completedText = await page.evaluate(() => {
    return document.body.innerText.includes("Questionnaire completed") || document.body.innerText.includes("Certificate");
  });
  if (completedText) {
    console.log(`Content rating already completed for ${appName}!`);
    return;
  }

  // Check if "Edit" or "Start new questionnaire" or "Start questionnaire"
  const startBtn = await page.$("button:has-text('Start new questionnaire'), button:has-text('Start questionnaire'), button:has-text('Edit')");
  if (startBtn && !(await startBtn.isDisabled())) {
    console.log("Clicking Start/Edit questionnaire button...");
    await startBtn.click();
    await page.waitForTimeout(4000);
  }

  // Step 1: Category & Email
  console.log("Step 1: Filling Email and Category...");
  const emailInput = await page.$("input[type='email']");
  if (emailInput) {
    await emailInput.fill("na0ryank0@gmail.com");
    await page.waitForTimeout(1000);
  }

  // Select "All other app types"
  await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll("material-radio, [role='radio'], input[type='radio']"));
    for (const r of radios) {
      if (r.innerText && (r.innerText.includes("All other app types") || r.innerText.includes("Utility") || r.innerText.includes("Productivity"))) {
        r.click();
        break;
      }
    }
  });
  await page.waitForTimeout(1000);

  // IARC agreement checkbox
  const cb = await page.$("input[type='checkbox']");
  if (cb && !(await cb.isChecked())) {
    console.log("Checking IARC agreement checkbox...");
    await cb.check({ force: true });
    await page.waitForTimeout(500);
  }

  // Click Next
  const nextBtn1 = await page.$("button:has-text('Next')");
  if (nextBtn1 && !(await nextBtn1.isDisabled())) {
    console.log("Clicking Next from Step 1...");
    await nextBtn1.click();
    await page.waitForTimeout(4000);
  }

  // Step 2: Answering Questionnaire (No to all)
  console.log("Step 2: Answering Questionnaire (selecting No to all)...");
  let answeredCount = 0;
  for (let pass = 0; pass < 3; pass++) {
    const count = await page.evaluate(() => {
      let clicked = 0;
      const radios = Array.from(document.querySelectorAll("material-radio, [role='radio'], input[type='radio']"));
      for (const r of radios) {
        const text = (r.innerText || "").trim();
        if ((text === "No" || text.startsWith("No")) && r.getAttribute("aria-checked") !== "true") {
          r.click();
          clicked++;
        }
      }
      return clicked;
    });
    answeredCount += count;
    await page.waitForTimeout(1000);
    if (count === 0) break;
  }
  console.log(`Answered "No" to ${answeredCount} questions`);

  // Click Save
  console.log("Clicking Save...");
  const saveBtn = await page.$("button:has-text('Save'), [role='button']:has-text('Save')");
  if (saveBtn && !(await saveBtn.isDisabled())) {
    await saveBtn.click();
    await page.waitForTimeout(3000);
  }

  // Click Next
  console.log("Clicking Next to summary...");
  const nextBtn2 = await page.$("button:has-text('Next')");
  if (nextBtn2 && !(await nextBtn2.isDisabled())) {
    await nextBtn2.click();
    await page.waitForTimeout(4000);
  }

  // Step 3: Summary / Submit
  console.log("Step 3: Submitting questionnaire...");
  const submitBtn = await page.$("button:has-text('Submit'), [role='button']:has-text('Submit'), button:has-text('Save')");
  if (submitBtn && !(await submitBtn.isDisabled())) {
    await submitBtn.click();
    await page.waitForTimeout(4000);
    console.log(`🎉 Content rating successfully submitted for ${appName}! 🎉`);
  } else {
    console.log(`Submit button not clickable for ${appName}`);
  }
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const pages = browser.contexts()[0].pages();
  const page = pages[0];

  // Run for SendKiss
  await fillQuestionnaire(page, "SendKiss", "4972175458793862190");

  // Run for StreamSnap AI
  await fillQuestionnaire(page, "StreamSnap AI", "4974194036705358034");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
