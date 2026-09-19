#!/usr/bin/env node
/**
 * One-shot Capacitor platform bootstrap for KISS.
 * Run after: npm install
 *
 *   node scripts/native-setup.mjs
 *   CAP_SERVER_URL=http://192.168.x.x:8080 node scripts/native-setup.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "native", "www");

function sh(cmd, args) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", env: process.env });
}

mkdirSync(www, { recursive: true });
if (!existsSync(join(www, "index.html"))) {
  writeFileSync(
    join(www, "index.html"),
    `<!doctype html><html><head><meta charset="utf-8"/><title>KISS</title></head><body><p>Loading KISS…</p></body></html>\n`,
  );
}

if (!existsSync(join(root, "ios"))) {
  try {
    sh("npx", ["cap", "add", "ios"]);
  } catch (err) {
    console.warn(
      "\n[native-setup] iOS add failed (need Xcode on macOS). Continuing.\n",
      err?.message ?? err,
    );
  }
}

if (!existsSync(join(root, "android"))) {
  sh("npx", ["cap", "add", "android"]);
}

sh("npx", ["cap", "sync"]);

const infoPlist = join(root, "ios", "App", "App", "Info.plist");
if (existsSync(infoPlist)) {
  let plist = readFileSync(infoPlist, "utf8");
  if (!plist.includes("NSContactsUsageDescription")) {
    plist = plist.replace(
      "</dict>\n</plist>",
      `\t<key>NSContactsUsageDescription</key>\n\t<string>KISS needs contacts so you can pick who to kiss.</string>\n</dict>\n</plist>`,
    );
    writeFileSync(infoPlist, plist);
    console.log("[native-setup] Added NSContactsUsageDescription to Info.plist");
  }
}

const manifest = join(root, "android", "app", "src", "main", "AndroidManifest.xml");
if (existsSync(manifest)) {
  let xml = readFileSync(manifest, "utf8");
  if (!xml.includes("android.permission.READ_CONTACTS")) {
    xml = xml.replace(
      /(<manifest\b[^>]*>)/,
      `$1\n    <uses-permission android:name="android.permission.READ_CONTACTS" />`,
    );
    writeFileSync(manifest, xml);
    console.log("[native-setup] Ensured READ_CONTACTS in AndroidManifest.xml");
  }
}

console.log("\nDone. Open with: npm run cap:ios  or  npm run cap:android");
console.log("See docs/NATIVE.md for Naor’s Hebrew steps.\n");
