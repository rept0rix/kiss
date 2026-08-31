# KISS — Product Requirements

**Status:** live prototype  
**Audience:** people who want to send a feeling, not a message  
**Platform:** mobile-first PWA (iPhone Safari is the bar)  
**Language:** English in product. Hebrew is fine in conversation.

Updated 31 Aug 2026.

---

## 1. One-liner

A one-screen social toy where you throw kisses at people. Your face sits in the middle. Everyone who kissed you (or you kissed) orbits you. The rest is weather: lips in the air, a super kiss, a live world feed.

## 2. Why

Talking is work. A kiss is one tap. The viral motion is:

1. I kiss you.
2. You get a card that looks like *me*, not an app icon.
3. You open it. Celebration.
4. You kiss me back, or pass it to someone from your phone.

If the card is ugly, or the catch screen feels like UI, the loop dies.

## 3. Who it is for

- Close people (partner, friends, family) who already have each other's numbers
- Anyone who will tap a WhatsApp preview
- Not for dating profiles, not for chat, not for comments

## 4. Core loop

```
open → you're in (rain) → home orbit
                │
         Send kiss
                │
     ┌──────────┴──────────┐
  on KISS              not yet
  in-app only          WhatsApp / SMS
  live overlay         /k/{code} catch
                │
         kiss back / send it on
```

Success looks like: two people inside the app, kissing without leaving it, with faces on the chips, and a LIVE page that is readable.

## 5. Screens

### 5.1 Boot
- Red field, **black** lip sprites, word `KISS`, progress
- Crossfades to black + red hearts
- Fast. Then, if already entered → **You're in**. If new → welcome + phone.

### 5.2 You're in
- Glass card: name, **sent / caught**
- Kiss rain that starts hard and fades over ~30s
- One kiss sound, never a barrage
- **Come in** (or auto after 30s)

### 5.3 Home (the product)
- Center: your photo (locked, not draggable). Tap → **My profile**
- Orbit: unique people (merge by phone tail). Drag each chip independently. Pinch zoom.
- HUD: LIVE · settings gear · sound
- Stats: name, pretty phone + country, sent · caught, rank bar (compact)
- Dock: **Send kiss** · **Super kiss** (when available)
- Connect friends: Google, X, WhatsApp icons. **No log out here** (settings only)

### 5.4 Send sheet
- Search name or phone, autocomplete from `phone_book` + recents
- Hits **on KISS** → only an in-app Kiss button
- Hits not on KISS → WhatsApp + SMS, never the iOS share sheet as the primary path
- Groups: multi-select, save, kiss all
- Deduped. Never attach *your* photo to someone else.

### 5.5 Catch (`/k/{code}` or `?k=`)
- Wild rain of the 25 lip sprites
- Giant uppercase name, cooler display font
- Button: **COME GET IT** (not “Catch it”)
- After catch: **Send it on** — people on KISS matching numbers you already have
- Then home

### 5.6 Person (tap a chip)
- Full screen, X, Block in the corner (confirm popup)
- Nickname (local + saved to server so *they* can see it)
- Real name + phone stay visible
- You sent N · they sent M
- Last you / last them (relative time)
- Kiss button counts this session (`Kiss · 3`)
- Blocked people **stay** on the orbit, grey, labeled

### 5.7 My profile (tap your face)
- Gallery
- **Main** photo (home)
- **Use to send** photo (kiss card)
- Nicknames others gave you
- Add from camera or library

### 5.8 LIVE
- Header with blur: Back · LIVE · count
- Unique pairs as a readable feed (face → lip → face + line)
- Lip rain in the back
- Ticker of latest at the bottom
- No overlapping piles of chips

### 5.9 Settings
- Sound / music toggles (music is a quiet bed)
- Blacklist (unblock)
- Log out
- Delete me (confirm)

## 6. Identity & data

| Fact | Rule |
|---|---|
| Key | Phone digits, normalized (`0…` Israel → `972…`) |
| Returning user | Lookup by phone → fill name + photo, **skip name gate** |
| New user | Phone, then full name, then photo (camera or library) |
| Persistence | Device: `localStorage`. Shared: Neon `phone_book`, `phone_kisses`, `share_links`, `phone_blocks`, `phone_nicks` |
| Preview | No `DATABASE_URL` → PGLite, wiped on restart |
| Publish | `deploy.database: true` → platform injects Neon |

Do not invent people from stock portraits. Initials if there is no photo.

## 7. Sharing

- Copy: `I kiss you now! Come inside and get it.` + short `/k/{code}`
- Card: your **send** photo, circular, kiss stamp, `COME GET IT`
- OG image URL: `/c/{code}` (not a relative `/api` path, not the site `og.jpg`)
- Direct `whatsapp://send?phone=&text=` with `wa.me` fallback
- Never prefill a WhatsApp *chat with the recipient's own number as if they were messaging themselves* incorrectly; digits must have no dashes

## 8. Non-goals

- SMS OTP (preview cannot deliver real SMS)
- Scraping WhatsApp / Facebook for profile photos
- Chat, comments, public profiles as destinations
- Bottom tabs
- Loud looping kiss SFX

## 9. Sound

- Four kiss samples in `public/sounds/kiss-1…4.mp3`
- Super sample
- Quiet looping bed (`bed.mp3`, gain ~0.045), starts after Come in
- Global cooldown ~1.4s so a re-render cannot machine-gun kisses
- `playCelebrate` = one kiss, not a drum fill

## 10. Quality bar (ship blockers)

- iPhone Safari, no accidental zoom, keyboard does not cover the send field
- Orbit chips are circles with faces when we have them
- Send to someone on KISS never opens WhatsApp
- Catch and LIVE never look like a broken list
- Block confirm is a popup
- Existing phone does not ask for a name again

## 11. Analytics we care about (later)

- Invites sent vs caught
- In-app kiss vs WhatsApp kiss
- Time to first kiss-back
- Super kiss use

Not vanity DAU slides. The question is: did they kiss back?

## 12. Open product bets

- Groups of people, one kiss to all (exists, polish later)
- Rank skins should *look* different in the air, not only in data
- Home-screen PWA icon is required on iOS (`apple-touch-icon.png` at root)
- Neon in preview is still **not** connected; publish is the path to a real user graph
