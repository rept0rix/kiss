# Native wrap (Capacitor)

KISS stays a **Vite + TanStack Start** web app. Capacitor wraps that app in a native WebView and adds the **Contacts** plugin so phones can pick recipients.

## Why Capacitor (not Expo)

- Expo would mean a React Native rewrite of the UI.
- Capacitor keeps the existing web codebase and loads it from `server.url` (dev LAN or `https://app.sendkiss.online`).
- Native Contacts (`@capgo/capacitor-contacts`) only runs inside the iOS/Android shell.

## English — how to run

### Prerequisites

- Node.js + `npm install` in the repo root
- **Android:** Android Studio (SDK + emulator or device)
- **iOS (Mac only):** Xcode + CocoaPods (`sudo gem install cocoapods` if needed)
- Phone and Mac on the **same Wi‑Fi** for local dev (`CAP_SERVER_URL`)

### First-time native projects

```bash
npm install
npm run native:setup
```

This runs `cap add ios` / `cap add android` (skips if already present), `cap sync`, and patches contacts permissions (`NSContactsUsageDescription`, `READ_CONTACTS`). If iOS add fails (no Xcode), Android + JS still work — re-run after installing Xcode.

### Dev (live reload from your Mac)

1. Start the web app (listens on all interfaces, port 8080):

```bash
npm install
npm run native:dev
# or: npm run dev
```

2. Find your Mac’s LAN IP (System Settings → Network, or `ipconfig getifaddr en0`).

3. Point Capacitor at that server and sync:

```bash
CAP_SERVER_URL=http://YOUR_LAN_IP:8080 npx cap sync
```

4. Open a platform:

```bash
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

5. Run on a device or simulator. When sending a kiss, tap **Contacts** and allow access.

Without `CAP_SERVER_URL`, the shell loads **https://app.sendkiss.online**. Native contacts JS must be deployed there for the picker to work against production.

### QA

- Use test phone **555** only — do not kiss real people while testing.
- Do **not** submit to the App Store / Play Store yet (no paid accounts in this slice).

### Project layout

| Path | Role |
|---|---|
| `capacitor.config.ts` | App id, `webDir`, `server.url` |
| `native/www/` | Placeholder HTML (required by Capacitor when using `server.url`) |
| `ios/`, `android/` | Native projects (committed) |
| `src/lib/contacts.ts` | Native picker + web Contact Picker fallback |

---

## עברית — לנאור (iPhone / Android)

**פעם ראשונה (אם עדיין אין `ios/` / `android/` או PR):**
```bash
cd ~/kiss/kiss
bash scripts/finish-native-wrap.sh
```
(זה עושה install, יוצר פלטפורמות, פותח PR — בלי מיזוג ל־production.)

**להריץ על הטלפון:**
1. במק: `npm install` ואז פעם ראשונה `npm run native:setup`. אחר כך `npm run native:dev`.
2. מצא את ה־IP של המק ב־WiFi (System Settings → Network), למשל `192.168.1.20`.
3. הרץ: `CAP_SERVER_URL=http://IP:8080 npx cap sync` ואז `npx cap open ios` (או `android`).
4. ב־Xcode בחר את האייפון → Run. ב־Android Studio בחר מכשיר → Run.
5. כששולחים נשיקה, לחץ **Contacts** ואשר גישה לאנשי קשר.
6. רק מספר בדיקה **555** — לא אנשים אמיתיים.
7. בלי חשבון App Store / Play עדיין — רק הרצה מקומית מהמק.

**חשוב:** בלי `CAP_SERVER_URL` האפליקציה טוענת את production (`app.sendkiss.online`). כדי שה־Contacts החדש יעבוד, חייבים לטעון את הקוד מהענף הזה (Vite מקומי או preview אחרי PR).
