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
  const page = browser.contexts()[0].pages()[0];

  await page.goto("https://play.google.com/console/u/0/developers/7275830997865972611/app/4972175458793862190/store-listings/default/edit", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5500);

  const state = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input[type='text']")).map(i => i.value);
    const textareas = Array.from(document.querySelectorAll("textarea")).map(t => t.value.slice(0, 60));
    const removeBtns = Array.from(document.querySelectorAll("button[aria-label*='Remove' i]")).map(b => b.getAttribute("aria-label"));
    const addBtns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.trim() === "Add assets").map((b, i) => {
      let el = b;
      for (let k = 0; k < 12 && el; k++) {
        el = el.parentElement;
        if (el && (el.innerText || "").includes("*")) {
          return { i, header: el.innerText.split("\n")[0] };
        }
      }
      return { i, header: "unknown" };
    });
    return { inputs, textareas, removeBtns, addBtns };
  });

  console.log("SendKiss current saved state:", JSON.stringify(state, null, 2));
  clearInterval(timer);
  process.exit(0);
})();
