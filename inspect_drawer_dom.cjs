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

  const drawerInfo = await page.evaluate(() => {
    const drawer = document.querySelector("material-drawer");
    if (!drawer) return "No material-drawer";
    const buttons = Array.from(drawer.querySelectorAll("button")).map(b => ({
      text: b.innerText.trim(),
      ariaLabel: b.getAttribute("aria-label"),
      className: b.className,
      html: b.outerHTML.slice(0, 100)
    }));
    return {
      visible: drawer.getAttribute("visible"),
      expanded: drawer.className,
      buttons
    };
  });

  console.log("Drawer info:", JSON.stringify(drawerInfo, null, 2));
  clearInterval(timer);
  process.exit(0);
})();
