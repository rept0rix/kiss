# KISS — native wrap brief (for Cursor Agent)

Goal: one wrapped app (phone first) so KISS can use **native contacts** and feel like a real app — web alone is not enough.

## Why
- Production web still looks like old UI (v0.2.0 sync PR not merged; design lock not built).
- Naor needs contacts / capabilities only native APIs provide.
- Sequence he wants: lock design → wrap one app for phone/iOS/desktop (kisses from everywhere). Store accounts = paid approval later.

## Constraints
- Work in ~/kiss/kiss (or a sibling folder if Cap/Expo scaffold needs it — prefer same repo).
- Do NOT merge to production without explicit תמזג.
- Do NOT buy store accounts / spend / DNS without תעשה.
- Keep using https://app.sendkiss.online as the web backend / API where possible.
- QA phone 555 only — no real people.

## Must deliver (MVP wrap)
1. Choose one stack that fits this Vite/TanStack app with minimal rewrite (prefer Capacitor over full rewrite unless Expo is clearly better after a short look).
2. iOS and/or Android project that loads the app (dev build).
3. **Contacts permission + picker** when sending a kiss (read contacts, pick recipient phone).
4. Short README: how Naor runs it on his phone (Xcode/Android Studio or Expo Go — whichever you chose).
5. Open a PR (or local branch + clear status). No App Store / Play submit yet.

## Out of scope for this slice
- Full redesign / mockup pixel-perfect (can follow after wrap runs).
- Merging PR #11 (v0.2.0) unless user said תמזג.
- Push notifications (later).
- Google/X OAuth redirect (later).

## Done when
- Naor can open a native build on phone and pick a contact to send a kiss to (test numbers OK).
- Report: stack chosen + how to run + PR/branch URL.
