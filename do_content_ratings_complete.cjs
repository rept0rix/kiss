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

async function solveQuestionnaire(page) {
  const sections = [
    "Downloaded app",
    "User content sharing",
    "Online content",
    "Promotion or sale of age-restricted products or activities",
    "Miscellaneous"
  ];

  for (const secTitle of sections) {
    console.log(`\n--- Handling Section: ${secTitle} ---`);
    // Find the header element
    const foundHeader = await page.evaluate((title) => {
      const all = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, div, span, p"));
      for (const el of all) {
        if ((el.innerText || "").trim().startsWith(title)) {
          // If it's clickable or an expansion header, click it
          el.click();
          return { found: true, tag: el.tagName, text: el.innerText.trim().slice(0, 50) };
        }
      }
      return { found: false };
    }, secTitle);
    console.log("Header click result:", foundHeader);
    await page.waitForTimeout(1000);

    // Now answer all "No" options currently visible
    const clicked = await page.evaluate(() => {
      let count = 0;
      // In Material / Play Console:
      const radioLabels = Array.from(document.querySelectorAll("label, [role='radio'], material-radio, .mdc-radio, .mdc-label"));
      for (const l of radioLabels) {
        const text = (l.innerText || "").trim().toLowerCase();
        if (text === "no" || text.startsWith("no\n") || text === "no (") {
          l.click();
          count++;
        }
      }
      return count;
    });
    console.log(`Clicked ${clicked} "No" options after expanding ${secTitle}.`);
    await page.waitForTimeout(1000);
  }

  // Check Save and Next buttons
  await page.waitForTimeout(2000);
  const saveBtn = await page.$("button:has-text('Save')");
  console.log("Save button disabled?", saveBtn ? await saveBtn.isDisabled() : "not found");
  if (saveBtn && !(await saveBtn.isDisabled())) {
    await saveBtn.click();
    console.log("Clicked Save!");
    await page.waitForTimeout(3000);
  }

  const nextBtn = await page.$("button:has-text('Next')");
  console.log("Next button disabled?", nextBtn ? await nextBtn.isDisabled() : "not found");
  if (nextBtn && !(await nextBtn.isDisabled())) {
    await nextBtn.click();
    console.log("Clicked Next to Step 3!");
    await page.waitForTimeout(4000);

    // On Step 3 Summary:
    const submitBtn = await page.$("button:has-text('Submit'), button:has-text('Save')");
    console.log("Submit button disabled?", submitBtn ? await submitBtn.isDisabled() : "not found");
    if (submitBtn && !(await submitBtn.isDisabled())) {
      await submitBtn.click();
      console.log("Clicked Submit on Step 3!");
      await page.waitForTimeout(5000);
    }
  }
}

async function runForApp(browser, appId, appName) {
  console.log(`\n======================================================`);
  console.log(`Starting Content Rating for ${appName} (${appId})`);
  console.log(`======================================================`);
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/content-rating-overview`);
  await page.waitForTimeout(5000);

  const editBtn = await page.$("button:has-text('Edit')");
  const startBtn = await page.$("button:has-text('Start new questionnaire'), button:has-text('Start questionnaire')");

  if (editBtn && !(await editBtn.isDisabled())) {
    console.log("Clicking Edit...");
    await editBtn.click();
  } else if (startBtn && !(await startBtn.isDisabled())) {
    console.log("Clicking Start...");
    await startBtn.click();
  }
  await page.waitForTimeout(5000);

  // If on Category (Step 1)
  const emailInput = await page.$("input[type='email']");
  if (emailInput) {
    console.log("Completing Step 1 (Category)...");
    await emailInput.fill("na0ryank0@gmail.com");
    await page.waitForTimeout(500);

    const radios = await page.$$("input[type='radio']");
    if (radios.length >= 3) {
      await radios[2].check({ force: true });
    }
    const cb = await page.$("input[type='checkbox']");
    if (cb) {
      await cb.check({ force: true });
    }
    const next1 = await page.$("button:has-text('Next')");
    if (next1 && !(await next1.isDisabled())) {
      await next1.click();
      await page.waitForTimeout(5000);
    }
  }

  // Now on Step 2 (Questionnaire)
  await solveQuestionnaire(page);

  await page.screenshot({ path: `/Users/naoryanko/kiss/rating_final_${appName.replace(/\s+/g, "_")}.png`, fullPage: true });
  await page.close();
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);

  await runForApp(browser, "4972175458793862190", "SendKiss");
  await runForApp(browser, "4974194036705358034", "StreamSnap_AI");

  clearInterval(timer);
  console.log("\nALL DONE!");
  process.exit(0);
})().catch(e => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
