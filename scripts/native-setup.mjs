#!/usr/bin/env node
/**
 * Capacitor platform bootstrap for KISS.
 * Configures iOS and Android platforms with contacts, camera, and notification permissions.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "dist");

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
    console.warn("\n[native-setup] iOS add skipped or failed (macOS/Xcode required).\n");
  }
}

if (!existsSync(join(root, "android"))) {
  try {
    sh("npx", ["cap", "add", "android"]);
  } catch (err) {
    console.warn("\n[native-setup] Android add skipped or failed.\n");
  }
}

try {
  sh("npx", ["cap", "sync"]);
} catch (err) {
  console.warn("\n[native-setup] cap sync warning:\n", err?.message ?? err);
}

// 1. Configure iOS Info.plist
const infoPlist = join(root, "ios", "App", "App", "Info.plist");
if (existsSync(infoPlist)) {
  let plist = readFileSync(infoPlist, "utf8");
  let modified = false;

  if (!plist.includes("NSContactsUsageDescription")) {
    plist = plist.replace(
      "</dict>\n</plist>",
      `\t<key>NSContactsUsageDescription</key>\n\t<string>KISS needs contacts so you can pick who to send a kiss to.</string>\n</dict>\n</plist>`,
    );
    modified = true;
    console.log("[native-setup] Added NSContactsUsageDescription to Info.plist");
  }

  if (!plist.includes("NSCameraUsageDescription")) {
    plist = plist.replace(
      "</dict>\n</plist>",
      `\t<key>NSCameraUsageDescription</key>\n\t<string>KISS needs camera access to take selfies for your profile and kisses.</string>\n</dict>\n</plist>`,
    );
    modified = true;
    console.log("[native-setup] Added NSCameraUsageDescription to Info.plist");
  }

  if (modified) {
    writeFileSync(infoPlist, plist);
  }
}

// 2. Configure Android AndroidManifest.xml
const manifest = join(root, "android", "app", "src", "main", "AndroidManifest.xml");
if (existsSync(manifest)) {
  let xml = readFileSync(manifest, "utf8");
  let modified = false;

  const permissions = [
    "android.permission.READ_CONTACTS",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.VIBRATE",
    "android.permission.CAMERA",
  ];

  for (const perm of permissions) {
    if (!xml.includes(perm)) {
      xml = xml.replace(
        /(<manifest\b[^>]*>)/,
        `$1\n    <uses-permission android:name="${perm}" />`,
      );
      modified = true;
      console.log(`[native-setup] Ensured ${perm} in AndroidManifest.xml`);
    }
  }

  if (modified) {
    writeFileSync(manifest, xml);
  }
}

console.log("\n[native-setup] Setup completed successfully!\n");
