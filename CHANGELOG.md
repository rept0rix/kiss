# Changelog

## v0.2.0

- **Photo sync:** `phone_book.photo` in Neon is the source of truth. Boot/hydrate reads it via `lookupFace`; uploads still write through `registerPhone`. Auto presence sync no longer pushes a stale local photo over Neon.
- **LEAVE:** Settings → Log out / Leave always clears `kiss-me-v2` + `kiss-id-v1` and returns to the phone gate (works with phone-only auth off too).
- **Orbit:** Hydrate from real `phone_kisses` / `getHome` only. Local-only chips (QA leftovers) are dropped once the server answers.
