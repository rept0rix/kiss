const fs = require("fs");
const { execSync, exec } = require("child_process");
const { chromium } = require("/Users/naoryanko/rime-rush/node_modules/playwright-core");

function autoAllow() {
  const s = `tell application "System Events" to tell process "Comet" to repeat with w in windows
try
click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of sheet "Allow remote debugging?" of w
end try
try
click button "Allow" of group 1 of group 2 of group 1 of group 1 of group "Allow remote debugging?" of group 1 of w
end try
end repeat`;
  try { execSync(`osascript -e "${s}"`, { stdio: "ignore" }); } catch (e) {}
  return setInterval(() => { exec(`osascript -e "${s}"`, () => {}); }, 1000);
}

(async () => {
  const timer = autoAllow();
  const [port, path] = fs.readFileSync("/Users/naoryanko/Library/Application Support/Comet/DevToolsActivePort", "utf8").trim().split("\n");
  const browser = await chromium.connectOverCDP(`ws://127.0.0.1:${port}${path}`);
  let page;
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      if (p.url().includes("7275830997865972611")) {
        page = p;
        break;
      }
    }
  }
  if (!page) page = await browser.contexts()[0].newPage();

  const appId = "4972175458793862190"; // SendKiss
  await page.goto(`https://play.google.com/console/u/0/developers/7275830997865972611/app/${appId}/app-dashboard`);
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: "/Users/naoryanko/Desktop/dashboard_sendkiss.png", fullPage: true });

  // Get all text blocks and clickable items under "Finish setting up your app"
  const tasksInfo = await page.evaluate(() => {
    // Find all headings, links, buttons
    const sections = Array.from(document.querySelectorAll("section, [role='region'], div[class*='container'], material-expansionpanel"));
    const data = [];
    document.querySelectorAll("*").forEach(el => {
      if (el.children.length === 0 && el.innerText && el.innerText.trim().length > 0) {
        // leaf text
        const t = el.innerText.trim();
        if (t.length > 2 && t.length < 150) {
          data.push(t);
        }
      }
    });
    return data;
  });

  // Filter tasks related text
  console.log("Dashboard visible text snippets:");
  const relevant = tasksInfo.filter(t => 
    t.includes("Privacy") || t.includes("access") || t.includes("Ads") || 
    t.includes("Content rating") || t.includes("Target") || t.includes("Data safety") || 
    t.includes("Government") || t.includes("Financial") || t.includes("Health") || 
    t.includes("Category") || t.includes("listing") || t.includes("complete") ||
    t.includes("Start") || t.includes("Manage") || t.includes("Set up")
  );
  console.log([...new Set(relevant)]);

  // Let's also look for all clickable task links or rows
  const taskRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("material-list-item, [role='listitem'], div[class*='task'], [role='button'], a"));
    return rows.map(r => ({
      text: (r.innerText || "").trim().replace(/\n+/g, " | "),
      tag: r.tagName,
      role: r.getAttribute("role"),
      href: r.getAttribute("href")
    })).filter(r => r.text.includes("complete") || r.text.includes("Set up") || r.text.includes("policy") || r.text.includes("privacy") || r.text.includes("access") || r.text.includes("rating") || r.text.includes("safety"));
  });

  console.log("\nTask rows found:");
  console.log(JSON.stringify(taskRows, null, 2));

  clearInterval(timer);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
