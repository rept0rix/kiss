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

async function setupClosedTestingAndSubmit(page, appName, appId) {
  console.log(`\n======================================================`);
  console.log(`Setting up Closed Testing & Submitting: ${appName} (${appId})`);
  console.log(`======================================================`);

  // 1. Go to app-dashboard, expand View tasks, click 'Select countries and regions' to get Closed Testing track URL
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5500);

  await page.evaluate(() => {
    for (const b of Array.from(document.querySelectorAll("button"))) {
      if (/View tasks/i.test(b.innerText)) b.click();
    }
  });
  await page.waitForTimeout(1500);

  const hasCountriesTask = await page.locator("text='Select countries and regions'").count();
  if (hasCountriesTask > 0) {
    await page.locator("text='Select countries and regions'").first().click();
    await page.waitForTimeout(5000);
  } else {
    // Fallback: click 'Select testers' or 'Create a new release'
    const anyTask = page.locator("text=/Select testers|Create a new release|Preview and confirm/i").first();
    if ((await anyTask.count()) > 0) {
      await anyTask.click();
      await page.waitForTimeout(5000);
    }
  }

  const trackUrlMatch = page.url().match(/(https:\/\/play\.google\.com\/console\/u\/0\/developers\/\d+\/app\/\d+\/tracks\/\d+)/);
  const baseTrackUrl = trackUrlMatch ? trackUrlMatch[1] : page.url().split("?")[0];
  console.log(`${appName} Closed Testing Base Track URL:`, baseTrackUrl);

  // STEP A: Countries / Regions
  await page.goto(`${baseTrackUrl}?tab=countryAvailability`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  const clickedAddCountries = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => /Add countries/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`${appName} Clicked 'Add countries / regions':`, clickedAddCountries);

  if (clickedAddCountries) {
    await page.waitForTimeout(2500);
    // Check 'Select all rows' checkbox inside dialog
    const checkedAll = await page.evaluate(() => {
      const dialog = document.querySelector("material-dialog, [role='dialog']") || document.body;
      const cb = dialog.querySelector("material-checkbox, [role='checkbox']");
      if (cb && cb.getAttribute("aria-checked") !== "true") {
        cb.click();
        return true;
      }
      return false;
    });
    console.log(`${appName} Checked all countries in modal:`, checkedAll);
    await page.waitForTimeout(1500);

    // Click confirm button in dialog ('Add countries / regions' or 'Save')
    const savedCountries = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const saveBtn = btns.find(b => /Add countries|Save|Add/i.test(b.innerText.trim()));
      if (saveBtn) {
        const t = saveBtn.innerText.trim();
        saveBtn.click();
        return t;
      }
      return null;
    });
    console.log(`${appName} Saved countries modal:`, savedCountries);
    await page.waitForTimeout(4000);

    // If there is a second confirmation dialog (e.g. 'Add countries'), click it
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const cBtn = btns.find(b => /Add|Save|Confirm/i.test(b.innerText.trim()) && !/Cancel/i.test(b.innerText.trim()));
      if (cBtn) cBtn.click();
    });
    await page.waitForTimeout(3000);
  }

  // STEP B: Testers
  await page.goto(`${baseTrackUrl}?tab=testers`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  const testersChecked = await page.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll("material-checkbox, [role='checkbox']")).filter(cb => cb.offsetWidth > 0);
    const clicked = [];
    for (const cb of cbs) {
      if (cb.getAttribute("aria-checked") === "false") {
        cb.click();
        clicked.push(cb.getAttribute("aria-label") || "cb");
      }
    }
    return clicked;
  });
  console.log(`${appName} Closed Testing Testers checked:`, JSON.stringify(testersChecked));
  await page.waitForTimeout(1500);

  const savedTesters = await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll("button")).find(b => /^Save( changes)?$/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
    if (saveBtn) {
      saveBtn.click();
      return saveBtn.innerText.trim();
    }
    return null;
  });
  console.log(`${appName} Saved Closed Testing Testers:`, savedTesters);
  await page.waitForTimeout(4000);

  // STEP C: Create or Edit Release on Closed Testing Track
  await page.goto(`${baseTrackUrl}?tab=releases`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  const releaseBtnClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button, a")).filter(b => b.offsetWidth > 0 && !b.disabled);
    const target = btns.find(b => /Edit release|Resume draft|Create new release/i.test(b.innerText.trim()));
    if (target) {
      const t = target.innerText.trim();
      target.click();
      return t;
    }
    return null;
  });
  console.log(`${appName} Clicked release action on Closed Testing:`, releaseBtnClicked);
  await page.waitForTimeout(5500);

  // Click 'Add from library'
  const clickedAddFromLib = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => /Add from library/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`${appName} Clicked 'Add from library':`, clickedAddFromLib);

  if (clickedAddFromLib) {
    await page.waitForTimeout(3000);
    // In library drawer/modal, select the first checkbox/radio (which is the highest versionCode bundle!)
    const selectedBundle = await page.evaluate(() => {
      const container = document.querySelector("material-drawer, material-dialog, [role='dialog']") || document.body;
      const cbs = Array.from(container.querySelectorAll("material-checkbox, [role='checkbox'], material-radio, [role='radio']")).filter(el => el.offsetWidth > 0);
      // Skip 'Select all rows' if present; pick the first row or click the first bundle row
      const target = cbs.find(cb => !(cb.getAttribute("aria-label") || "").includes("Select all")) || cbs[0];
      if (target) {
        target.click();
        return target.getAttribute("aria-label") || "first-bundle";
      }
      return null;
    });
    console.log(`${appName} Selected bundle from library:`, selectedBundle);
    await page.waitForTimeout(1500);

    const addedToRelease = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-drawer button, material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const addBtn = btns.find(b => /Add to release|^Add$/i.test(b.innerText.trim()));
      if (addBtn) {
        const t = addBtn.innerText.trim();
        addBtn.click();
        return t;
      }
      return null;
    });
    console.log(`${appName} Clicked Add to release:`, addedToRelease);
    await page.waitForTimeout(4500);
  }

  // Click Next on release prepare page
  const clickedNext = await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.trim() === "Next" && !b.disabled && b.offsetWidth > 0);
    if (nextBtn) {
      nextBtn.click();
      return true;
    }
    return false;
  });
  console.log(`${appName} Clicked Next on Closed Testing release:`, clickedNext);
  await page.waitForTimeout(5500);

  // Inspect Step 2 of Closed Testing release and click Save / Save and publish / Go to overview
  const step2Release = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
    const actionBtn = Array.from(document.querySelectorAll("button")).find(b => /Save and publish|Start rollout|Save|Go to publishing overview/i.test(b.innerText.trim()) && !/Discard|Back|Add release/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
    if (actionBtn) {
      const t = actionBtn.innerText.trim();
      actionBtn.click();
      return { clicked: t, btns: btns.slice(-8) };
    }
    return { clicked: null, btns: btns.slice(-8) };
  });
  console.log(`${appName} Closed Testing Release Step 2:`, JSON.stringify(step2Release));
  await page.waitForTimeout(3500);

  // Confirm any modal (e.g. 'Go to overview' or 'Save and publish')
  const modalAfterRelease = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button")).filter(b => b.offsetWidth > 0 && !b.disabled);
    const confirmBtn = btns.find(b => /Go to overview|Go to publishing overview|Save and publish|Rollout|Save|Confirm/i.test(b.innerText.trim()));
    if (confirmBtn) {
      const t = confirmBtn.innerText.trim();
      confirmBtn.click();
      return t;
    }
    return null;
  });
  console.log(`${appName} Modal after release:`, modalAfterRelease);
  await page.waitForTimeout(4500);

  // STEP D: Go to Publishing Overview (/publishing) and click 'Send app for review' / 'Send changes for review'
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/publishing`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5500);

  const pubResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button")).filter(b => b.offsetWidth > 0).map(b => ({ text: b.innerText.trim(), disabled: b.disabled }));
    const sendBtn = Array.from(document.querySelectorAll("button")).find(b => /Send .* for review/i.test(b.innerText.trim()) && !b.disabled && b.offsetWidth > 0);
    if (sendBtn) {
      const t = sendBtn.innerText.trim();
      sendBtn.click();
      return { clicked: t, btns };
    }
    return { clicked: null, btns, text: document.body.innerText.split("\n").filter(l => /review|changes|ready|complete/i.test(l)).slice(0, 12) };
  });
  console.log(`${appName} Publishing Overview result:`, JSON.stringify(pubResult));

  if (pubResult.clicked) {
    await page.waitForTimeout(3000);
    const finalModal = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("material-dialog button, [role='dialog'] button, button")).filter(b => b.offsetWidth > 0 && !b.disabled);
      const cBtn = btns.filter(b => /Send .* for review|^Send$/i.test(b.innerText.trim())).pop();
      if (cBtn) {
        const t = cBtn.innerText.trim();
        cBtn.click();
        return t;
      }
      return null;
    });
    console.log(`🎉 ${appName} Final Review Modal Confirmed:`, finalModal);
    await page.waitForTimeout(5000);
  }
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  const page = browser.contexts()[0].pages()[0];

  try {
    await setupClosedTestingAndSubmit(page, "SendKiss", "4972175458793862190");
    await setupClosedTestingAndSubmit(page, "StreamSnap AI", "4974194036705358034");
  } finally {
    clearInterval(timer);
    process.exit(0);
  }
})();
