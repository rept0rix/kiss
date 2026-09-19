#!/usr/bin/env bash
# Finish native wrap: install, scaffold platforms, branch, commit, push, PR.
# Safe to re-run; does NOT merge.
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="cursor/native-wrap-contacts"

echo "==> npm install"
npm install

echo "==> native:setup (cap add + sync + permissions)"
npm run native:setup

echo "==> git branch $BRANCH"
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

echo "==> clean accidental shell shims (do not commit)"
rm -f ls scripts/ls .envrc
rm -rf .cursor/bin .cursor/zfuncs .cursor/zdot .cursor/hooks
rm -f .cursor/NATIVE_WRAP_TRIGGER .cursor/native-env.sh .cursor/probe-env.sh .cursor/path-test-out.txt .cursor/restore-src.txt

echo "==> stage + commit"
git add \
  package.json package-lock.json \
  capacitor.config.ts \
  native/www/index.html \
  src/lib/contacts.ts \
  src/components/send-sheet.tsx \
  docs/NATIVE.md docs/NATIVE-WRAP-BRIEF.md \
  README.md .gitignore \
  scripts/native-setup.mjs scripts/finish-native-wrap.sh \
  ios android 2>/dev/null || true

git status -sb

git commit -m "$(cat <<'EOF'
Native wrap: Capacitor shell + contacts picker.

Load the Vite app in a WebView and pick recipients via @capgo/capacitor-contacts on device.
EOF
)" || echo "(nothing to commit or commit failed)"

echo "==> push + PR (do NOT merge)"
git push -u origin HEAD

gh pr create \
  --title "Native wrap: Capacitor + contacts picker" \
  --body "$(cat <<'EOF'
## Summary
- Capacitor wraps the existing Vite + TanStack Start app (no Expo / RN rewrite).
- Native contacts picker via `@capgo/capacitor-contacts`; web Contact Picker remains as fallback.
- Docs: `docs/NATIVE.md` (EN + Hebrew for Naor).

## Notes
- **Do NOT merge without תמזג.**
- No App Store / Play submit. No paid store accounts.
- Stack = **Capacitor**. Backend stays `https://app.sendkiss.online` when `CAP_SERVER_URL` unset.
- QA phone **555** only.

## Test plan
- [ ] `npm install && npm run native:setup`
- [ ] `npm run native:dev` + `CAP_SERVER_URL=http://<lan-ip>:8080 npx cap sync`
- [ ] Run on device → Send → Contacts → pick → kiss (555 only)
EOF
)"

echo "Done. PR URL above. Do not merge."
