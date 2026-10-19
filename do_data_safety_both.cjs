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

async function doDataSafety(page, appId, appName) {
  console.log(`\n=================== Data Safety for ${appName} (${appId}) ===================`);
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-content/data-privacy-security`);
  await page.waitForTimeout(6000);

  // Step 1: Overview - Click Next
  console.log("On Step 1 (Overview)... Clicking Next");
  const nextBtn1 = await page.$("button:has-text('Next')");
  if (nextBtn1 && !(await nextBtn1.isDisabled())) {
    await nextBtn1.click();
    await page.waitForTimeout(5000);
  }

  // Step 2: Data collection and security
  console.log("On Step 2. Page URL:", page.url());
  await page.screenshot({ path: `/Users/naoryanko/kiss/ds_step2_${appName}.png`, fullPage: true });

  // In Data Safety step 2:
  // "Does your app collect or share any of the required user data types?" -> No
  // Let's find radio buttons or labels for "No"
  const clickedNo = await page.evaluate(() => {
    let count = 0;
    // Check radios where label or parent text includes "No"
    const labels = Array.from(document.querySelectorAll("label, [role='radio'], material-radio, .mdc-radio"));
    for (const l of labels) {
      const text = (l.innerText || "").trim().toLowerCase();
      if (text === "no" || text.startsWith("no\n") || text === "no (") {
        l.click();
        count++;
      }
    }
    const inputs = Array.from(document.querySelectorAll("input[type='radio']"));
    for (const inp of inputs) {
      const parent = inp.closest("div") || inp.parentElement;
      const t = (parent ? parent.innerText : "").toLowerCase();
      if (t.includes("no") && !t.includes("not")) {
        inp.click();
        count++;
      }
    }
    return count;
  });
  console.log(`Clicked ${clickedNo} "No" options on Step 2.`);
  await page.waitForTimeout(2000);

  // Click Next from Step 2
  const nextBtn2 = await page.$("button:has-text('Next')");
  console.log("Step 2 Next disabled?", nextBtn2 ? await nextBtn2.isDisabled() : "not found");
  if (nextBtn2 && !(await nextBtn2.isDisabled())) {
    await nextBtn2.click();
    await page.waitForTimeout(5000);
  }

  // Step 3 / 4 / 5: Loop Next until Save / Submit
  for (let step = 3; step <= 6; step++) {
    console.log(`Checking step ${step}...`);
    const submitBtn = await page.$("button:has-text('Submit'), button:has-text('Save')");
    const nextBtn = await page.$("button:has-text('Next')");

    // If Submit button is visible and active on Preview
    if (submitBtn && !(await submitBtn.isDisabled()) && (await submitBtn.innerText()).includes("Submit")) {
      console.log("Clicking Submit on Preview!");
      await submitBtn.click();
      await page.waitForTimeout(5000);
      break;
    } else if (submitBtn && !(await submitBtn.isDisabled()) && (await submitBtn.innerText()).includes("Save")) {
      console.log("Clicking Save!");
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    if (nextBtn && !(await nextBtn.isDisabled())) {
      console.log(`Clicking Next on step ${step}...`);
      await nextBtn.click();
      await page.waitForTimeout(5000);
    } else {
      console.log(`No active Next button on step ${step}.`);
    }
  }

  await page.screenshot({ path: `/Users/naoryanko/kiss/ds_final_${appName}.png`, fullPage: true });
  console.log(`Data Safety finished for ${appName}!`);
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await doDataSafety(page, "4972175458793862190", "SendKiss");
  await doDataSafety(page, "4974194036705358034", "StreamSnap_AI");

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
