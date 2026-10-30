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
  await page.setViewportSize({ width: 1440, height: 1600 });

  for (const [name, appId] of [["SendKiss", "4972175458793862190"], ["StreamSnap_AI", "4974194036705358034"]]) {
    console.log(`\n=================== Store Listing for ${name} (${appId}) ===================`);
    await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/store-listings/default/edit`);
    await page.waitForTimeout(6000);

    const shot1 = `/Users/naoryanko/kiss/listing_top_${name}.png`;
    await page.screenshot({ path: shot1 });
    console.log("Screenshot top:", shot1);

    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
    const shot2 = `/Users/naoryanko/kiss/listing_mid_${name}.png`;
    await page.screenshot({ path: shot2 });
    console.log("Screenshot mid:", shot2);

    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
    const shot3 = `/Users/naoryanko/kiss/listing_bot_${name}.png`;
    await page.screenshot({ path: shot3 });
    console.log("Screenshot bot:", shot3);

    // Detail inputs and image counts
    const details = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input[type='text'], textarea")).map(i => ({
        id: i.id,
        placeholder: i.placeholder,
        value: i.value.trim()
      }));
      const fileInputs = Array.from(document.querySelectorAll("input[type='file']")).map(f => ({
        id: f.id,
        accept: f.accept,
        name: f.name
      }));
      const images = Array.from(document.querySelectorAll("img")).map(img => img.src).filter(s => !s.startsWith("data:image/svg"));
      const nextBtnDisabled = Array.from(document.querySelectorAll("button")).find(b => (b.innerText || "").trim() === "Next")?.disabled;
      return { inputs, fileInputsCount: fileInputs.length, imagesCount: images.length, nextBtnDisabled };
    });
    console.log("Details:", JSON.stringify(details, null, 2));
  }

  await page.close();
  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
