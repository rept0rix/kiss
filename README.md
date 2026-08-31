<p align="center">
  <img src="public/icon-512.png" width="96" height="96" alt="KISS" />
</p>

<h1 align="center">KISS</h1>

<p align="center">
  <strong>Throw a kiss at someone. That's the whole app.</strong>
</p>

<p align="center">
  A one-screen social toy. Your face in the middle. Friends orbit you.<br/>
  Kisses fly. Super kisses exist. The world stream is always on.
</p>

<p align="center">
  <a href="docs/PRD.md">Product spec</a>
  ·
  <a href="#how-it-works">How it works</a>
  ·
  <a href="#run-it">Run it</a>
</p>

---

## Why this exists

Most social apps ask you to *talk*. KISS asks you to *send a feeling*.

You find someone by name or phone. You kiss them. They open a card with your face on it. They kiss back. That's the loop — small, stupid, and sticky.

It is built to feel like a game, not a form: one screen, flying lips, ranks, super kisses, a live world feed of everyone kissing everyone.

## What you get

| Moment | What happens |
|---|---|
| **Boot** | Red splash, black lips, then black with red hearts |
| **You're in** | Rain of kisses, your name, sent / caught, **Come in** |
| **Home** | You in the center. People who kissed you orbit. Drag them. Pinch zoom. |
| **Send** | Search by name or phone. In-app if they're on KISS. WhatsApp / SMS if they're not. |
| **Catch** | Full-screen celebration. Then *send it on* to people you already know. |
| **Profile** | Tap your photo. Gallery, main vs send face, nicknames others gave you. |
| **Person** | Tap anyone. Counts, last kiss timer, nickname, silent block. |
| **LIVE** | Global stream. Who kissed who, right now. |

## How it works

```
Phone number  ──►  you exist
       │
       ▼
   Kiss someone
       │
       ├── already on KISS  →  they see it live (inbox + orbit)
       └── not yet          →  WhatsApp / SMS with a kiss card + short link
                                      │
                                      ▼
                               /k/{code}  →  Catch it  →  they're in
```

**Identity is the phone.** No SMS code. If the number is already in the book, name and photo come back and you skip re-registration.

**Sharing** builds a 1200×630 JPEG of *your* face with a kiss stamp (`COME GET IT`) and a short `/k/xxxxx` link. WhatsApp unfurls `/c/{code}` as the image.

**Silent block** — they still think they sent it. You never see it. They stay on your orbit, marked blocked.

## Ranks

Send more kisses, unlock wilder skins.

| Rank | Kisses |
|---|---|
| Rookie | 0 |
| Crush | 250 |
| Heat | 400 |
| Flame | 650 |
| Frost | 900 |
| Venom | 1 500 |
| Royal | 2 500 |
| Void | 5 000 |
| Myth | 10 000 |
| God | 25 000 |
| Eternal | 50 000 |
| Immortal | 100 000 |

One **Super kiss** per day — extra if someone kisses you while you're inside the app (a 60s window).

## Stack

| Layer | What |
|---|---|
| UI | React 19 + TanStack Start / Router, one-screen PWA |
| Style | Tailwind 4, black / blood-red, Archivo Black |
| Data | Neon Postgres when published. PGLite (in-memory) in live preview |
| Identity | Phone number in `phone_book`. Optional Google / X sign-in |
| Share | Canvas kiss card + `share_links` / `share_cards` |
| Client | `localStorage` for you, orbit, gallery, nicknames, mute |

Schema lives in [`migrations/`](migrations/). Do not edit applied files — add a new numbered SQL file.

## Run it

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run build          # also applies migrations when DATABASE_URL is set
```

**Published:** set `DATABASE_URL` to a Neon (or any Postgres) connection string. Preview without it uses a throwaway local DB.

**Auth:** Google and X go through the app's Better Auth broker. Leave `VITE_AUTH_ENABLED=false` for phone-only.

## Project map

```
src/routes/index.tsx      home, boot, gates, orbit, send
src/routes/live.tsx       global kiss stream
src/routes/k.$from.tsx    catch a shared kiss
src/lib/kisses/server.ts  phone book, send, inbox, search, blocks, nicks
src/lib/kiss-card.ts      WhatsApp / OG card
src/lib/me.ts             device identity
public/lips/              25 kiss sprites
public/sounds/            kiss SFX + quiet bed
docs/PRD.md               full product spec
```

## Product rules (the ones that matter)

1. One screen. No tab bar.
2. Phone is how people find each other.
3. Existing number → skip the name gate.
4. In-app send never opens WhatsApp.
5. Your photo is yours. Fake stock faces stay out.
6. One kiss sound. Never a loop.
7. Block is silent.
8. The LIVE page is a feed, not a pile of overlapping chips.

## License

Private product. All rights reserved unless you say otherwise.

<p align="center"><sub>KISS · send one · catch one · send it on</sub></p>
