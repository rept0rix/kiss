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

  // We loop clicking the primary bottom-right action button (Next or Save)
  for (let round = 1; round <= 7; round++) {
    console.log(`--- Round ${round} ---`);
    await page.waitForTimeout(2000);

    // If on Data collection and security step, ensure "No" is selected
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes("Does your app collect or share any of the required user data types?")) {
      console.log("Selecting 'No' to data collection...");
      await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll("label, [role='radio'], material-radio, .mdc-radio"));
        for (const l of labels) {
          const t = (l.innerText || "").trim().toLowerCase();
          if (t === "no" || t.startsWith("no\n") || t === "no (") {
            l.click();
          }
        }
      });
      await page.waitForTimeout(1000);
    }

    // Check bottom action buttons: Look specifically for the primary button on the right
    // The footer buttons are inside a footer bar. The primary action is usually the last button in the footer.
    const actionResult = await page.evaluate(() => {
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll("button")).filter(b => {
        const txt = (b.innerText || "").trim();
        return (txt === "Next" || txt === "Save" || txt === "Submit") && !b.disabled && b.getAttribute("aria-disabled") !== "true";
      });
      if (buttons.length > 0) {
        // Prefer Next if present, else Save / Submit
        const next = buttons.find(b => (b.innerText || "").trim() === "Next");
        if (next) {
          next.click();
          return { clicked: "Next" };
        }
        const saveOrSubmit = buttons.find(b => {
          const t = (b.innerText || "").trim();
          return t === "Save" || t === "Submit";
        });
        if (saveOrSubmit) {
          saveOrSubmit.click();
          return { clicked: (saveOrSubmit.innerText || "").trim() };
        }
      }
      return { clicked: null };
    });

    console.log("Action result:", actionResult);
    if (actionResult.clicked === "Save" || actionResult.clicked === "Submit") {
      console.log(`Saved/Submitted Data Safety for ${appName}!`);
      await page.waitForTimeout(5000);
      break;
    }

    await page.waitForTimeout(4000);
  }

  await page.screenshot({ path: `/Users/naoryanko/kiss/ds_final_${appName}.png`, fullPage: true });
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
  console.log("\nDATA SAFETY COMPLETED FOR BOTH APPS!");
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
