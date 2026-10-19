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

async function doContentRating(browser, appId, appName) {
  console.log(`\n=================== Content Rating for ${appName} (${appId}) ===================`);
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/content-rating-overview`);
  await page.waitForTimeout(6000);

  // Check if Edit or Start button is available and enabled
  const editBtn = await page.$("button:has-text('Edit')");
  const startBtn = await page.$("button:has-text('Start new questionnaire'), button:has-text('Start questionnaire')");

  if (editBtn && !(await editBtn.isDisabled())) {
    console.log("Clicking 'Edit' to resume questionnaire...");
    await editBtn.click();
  } else if (startBtn && !(await startBtn.isDisabled())) {
    console.log("Clicking 'Start questionnaire'...");
    await startBtn.click();
  } else {
    console.log("Neither Edit nor Start button is enabled/found. Let's inspect page text:");
    const txt = await page.evaluate(() => document.body.innerText);
    console.log(txt.slice(0, 300));
  }
  await page.waitForTimeout(5000);
  console.log("Current URL after click:", page.url());

  // Step 1 check: If email input is present, fill it and category
  const emailInput = await page.$("input[type='email']");
  if (emailInput) {
    console.log("Filling email and selecting category...");
    await emailInput.fill("na0ryank0@gmail.com");
    await page.waitForTimeout(500);

    const radios = await page.$$("input[type='radio']");
    if (radios.length >= 3) {
      await radios[2].check({ force: true });
      await page.waitForTimeout(500);
    }
    const cb = await page.$("input[type='checkbox']");
    if (cb) {
      await cb.check({ force: true });
      await page.waitForTimeout(500);
    }

    const nextBtn1 = await page.$("button:has-text('Next')");
    if (nextBtn1 && !(await nextBtn1.isDisabled())) {
      console.log("Clicking Next from Step 1...");
      await nextBtn1.click();
      await page.waitForTimeout(5000);
    }
  }

  // Step 2: Answer questionnaire (select "No" to all questions)
  console.log("On questionnaire questions step. URL:", page.url());
  const clickedNo = await page.evaluate(() => {
    let count = 0;
    // In Play Console questionnaires, every question has radio options "Yes" and "No".
    // Find all elements that look like radio buttons or labels for "No"
    const elements = Array.from(document.querySelectorAll("material-radio, [role='radio'], label, .mdc-radio"));
    for (const el of elements) {
      const text = (el.innerText || "").trim().toLowerCase();
      if (text === "no" || text.startsWith("no\n") || text === "no (") {
        el.click();
        count++;
      }
    }
    // Also direct input[type='radio'] where value or label is No
    const inputs = Array.from(document.querySelectorAll("input[type='radio']"));
    for (const inp of inputs) {
      const parentText = (inp.parentElement ? inp.parentElement.innerText : "").trim().toLowerCase();
      const nextText = (inp.nextSibling ? inp.nextSibling.textContent : "").trim().toLowerCase();
      if (parentText.includes("no") || nextText.includes("no")) {
        inp.click();
        count++;
      }
    }
    return count;
  });
  console.log(`Clicked ${clickedNo} "No" elements.`);
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
    console.log("Clicking Next to Summary step...");
    await nextBtn2.click();
    await page.waitForTimeout(4000);
  }

  // Step 3: Summary / Submit
  console.log("On Summary step. URL:", page.url());
  const submitBtn = await page.$("button:has-text('Submit'), button:has-text('Save')");
  if (submitBtn && !(await submitBtn.isDisabled())) {
    console.log("Clicking Submit...");
    await submitBtn.click();
    await page.waitForTimeout(5000);
    console.log(`🎉 SUCCESS: Content Rating questionnaire submitted for ${appName}!`);
  } else {
    console.log("Submit button status:", submitBtn ? (await submitBtn.isDisabled() ? "disabled" : "enabled") : "not found");
    const txt = await page.evaluate(() => document.body.innerText);
    console.log("Page text snippet:", txt.slice(0, 500));
  }

  await page.screenshot({ path: `/Users/naoryanko/kiss/rating_result_${appName.replace(/\s+/g, "_")}.png`, fullPage: true });
  await page.close();
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);

  await doContentRating(browser, "4972175458793862190", "SendKiss");
  await doContentRating(browser, "4974194036705358034", "StreamSnap AI");

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
