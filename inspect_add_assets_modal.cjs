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

  // Inspect the input fields
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("input, textarea")).map(el => ({
      tag: el.tagName,
      type: el.type,
      name: el.name,
      id: el.id,
      ariaLabel: el.getAttribute("aria-label"),
      placeholder: el.placeholder,
      value: el.value.slice(0, 30)
    }));
  });
  console.log("All inputs and textareas on page:", JSON.stringify(inputs, null, 2));

  // Find the button for Feature graphic: Look for section containing "Feature graphic"
  const featureSection = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section, div")).filter(s => (s.innerText || "").includes("Feature graphic"));
    return sections.length;
  });
  console.log("Sections with 'Feature graphic':", featureSection);

  // Click "Add assets" under Feature graphic
  // In the page, each asset section has an "Add assets" button
  const addButtons = await page.$$("button:has-text('Add assets')");
  console.log("Found 'Add assets' buttons:", addButtons.length);
  if (addButtons.length >= 2) {
    console.log("Clicking 2nd 'Add assets' button (Feature graphic)...");
    await addButtons[1].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/Users/naoryanko/kiss/after_add_assets_click.png", fullPage: true });

    // Check if dialog or modal appeared
    const dialogText = await page.evaluate(() => {
      const modal = document.querySelector("dialog, [role='dialog'], .mat-dialog-container, .modal");
      return modal ? modal.innerText : "No modal found";
    });
    console.log("Modal text:", dialogText);
  }

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
