# Store screenshot and listing copy audit (draft)

Status: DRAFT for the founder and counsel, 21 Nov 2026; refreshed 22 Nov 2026 (Moments tab status, view name and cited line numbers, all read at `origin/develop` `6e24e3bcb43b1acb8227bf70ae2763508e3d4e3c`; the `strings.en.ts` and `DECISIONS.md` line cites were re-read on 23 Nov 2026 at `863d10b41` and will drift as those files move). Written by the store/copy lane as a Claude role, not counsel. This file changes no listing text. The listing (`packages/content/src/store.en.ts`, `docs/store/app-store.md`, `apps/mobile/store.config.json`) and the screenshots are owned by the founder and counsel; every "proposed replacement" below is a suggestion for them to take or leave.

## What was checked, and against what

Facts of the first store build (EAS `production` profile in `apps/mobile/eas.json`, read on `develop`): servers on, so sign-in and sync exist (letters sync only after the sensitive-data agreement); recording backup off (`EXPO_PUBLIC_BACKUP`); analytics off (`EXPO_PUBLIC_ANALYTICS`); English only (`EXPO_PUBLIC_ENGLISH_ONLY`, `EXPO_PUBLIC_SPOKEN_LANGUAGES=en`); no co-parent, Family tab and invites hidden (D-126; `packages/content/test/build12-untrue-copy.test.ts` header states the same profile).

Rules checked:
- Content rules (`CLAUDE.md`, `packages/content/WRITING-GUIDE.md` sections 0 and 2): no dashes, curly quotes, ellipsis or emoji; no exclamation marks in store copy; caption 40 and subline 60 characters; never imply software writes; never gender the child; no gap counting; no "never", "always", "only" or "exactly" without proof.
- D-125 item 9 and D-133: "exactly as you said it" stays out of the listing; the true line is "It stays in your words. Every word we change is marked, and your original recording is kept unchanged." (the exec rulings of 23 Nov 2026, item 8d, changed "Every change" to "Every word we change", because the engine also changes dashes, quotes, spaces and non-speech tags without a mark; those are characters, not words)
- Q-X1-12 (`docs/product/moments-tab/PRINCIPLES-REVIEW-21nov.md`, MT-PR-R11): Moments is not in store name, subtitle, keywords, listing or screenshots until counsel clears the name. The CLO review (`docs/product/moments-tab/exec-review/clo.md`) adds that screenshots show the tab bar, so clearance has to come before screenshots.

Verdicts: **ok** (true to the build, passes the rules), **untrue** (not true of the first store build, or contradicts the source), **banned** (a name or phrase the rules keep out), **counsel-held** (a promise, claim or legal line that only counsel or the founder may change; no replacement offered).

How it was done: read `docs/store/screenshots/captions.json`, the README, `store.en.ts`, `app-store.md`, `app-store-staged-1.0-proposal.md` and `notes-for-review-1.0.txt`; opened every committed PNG in `docs/store/screenshots/iphone-medium-1206x2622` and read the baked-in words; grepped the app and content for each factual claim. Not run: `npm test`, `npm run lint:copy` (this change is one new docs file), a simulator capture of the release build, a network capture.

## Summary

1. Frame 6's committed PNG does not say what `captions.json` says. The image headline reads "Your book stays on your phone." The source says "Your book is private." The first is not true of a servers-on build with sign-in and sync. The image also shows the "What we never do" list with padlock icons, which Settings, Privacy retired on 8 Nov (`apps/mobile/src/components/consent/copy.ts`, CPrivO-5), and its third line names photos, which 1.0 does not have. This is the one clear blocker in the set.
2. Frame 3's headline says "each letter", but a typed letter has no recording. Small fix proposed.
3. Frame 3's screen shows the in-app link "Exactly as said". D-125 item 9 holds the phrase out of the listing, and the 23 Nov ruling (item 8e) keeps the link out of the frame. Recapture needed.
4. No caption or listing line names Moments. `git grep -i moments` finds nothing in `docs/store/` or `store.en.ts`. As first written, the only hit in `packages/content/src` was a notification group key. That has changed on `develop`: #1479 (22 Nov 03:37 UTC) added `packages/content/src/features/moments-tab.en.ts` with `label: 'Moments'`, and #1482 (22 Nov 04:17 UTC) added the tab, `apps/mobile/src/app/(tabs)/moments.tsx`, wired in `(tabs)/_layout.tsx:85` to `:86` behind `EXPO_PUBLIC_MOMENTS_TAB` (flag off, the route stays hidden). The `production` profile in `apps/mobile/eas.json` does not set that flag (no `MOMENTS_TAB` string in the file; `apps/mobile/test/store-family-tab.test.ts:52` asserts it, not run here), so the store build still hides the tab, and the claim that no caption or listing line names Moments still holds. The recapture rule below is now live, not hypothetical: any capture from current `develop` with the flag on shows the tab. See "Recapture rule" below.
5. Every other caption is ok. The listing's privacy, subscription and "stays on your phone" lines are counsel-held, listed below with their gates.

## Screenshot captions

Source: `docs/store/screenshots/captions.json`, which is the same text as `storeListing.screenshots`. "Image says" is what the committed 1206 x 2622 PNG shows. All headlines are 40 characters or fewer and all sublines 60 or fewer.

| # | Headline / subline (source) | Image says | Verdict | Why | Proposed replacement |
|---|---|---|---|---|---|
| 1 | Tell your child about today. / A minute is plenty. It becomes a letter. | Same. Screen: Tonight, a question, Speak and Type, a sample letter from the fictional Asha | ok | True of the build. "It becomes a letter" says what the app does and does not say software wrote it. Asha sample content is allowed (WRITING-GUIDE principle 3.11) | none |
| 2 | Every word we change is marked. / We only fix small slips. Tap one to put it back. | The committed PNG still reads "Every change is marked." Screen: "Took out a sound" with Put it back | changed in source 23 Nov (item 8d); image is stale | New headline, 31 characters, is literally true. The subline is the BRAND.md sentence (COUNSEL_LOCKED.md, LNG-18), not edited | Recapture or recompose frame 2 (founder or device step, see "Recapture status" below) |
| 3 headline | A spoken letter keeps your voice. | The committed PNG still reads "Your voice stays with each letter." | changed in source 23 Nov (item 8e); image is stale | The old line overclaimed: a typed letter has no recording. New headline is 33 characters | Recapture or recompose frame 3 (see "Recapture status") |
| 3 subline | The original recording is kept unchanged. | Same. Screen also shows the link "Exactly as said" under the letter | ok (text); see 3a | Matches the D-133 wording. Backup is off and the recording stays on the phone, which the screen says ("Recording kept on this phone") | none |
| 3a | (text inside the frame) "Exactly as said" | Visible in the app screen | ruled 23 Nov: out of the frame (item 8e) | D-125 item 9 holds "exactly as you said it" out of the listing until counsel clears it (T30). D-133 (`DECISIONS.md:1041`) found the "Exactly as said" link names the raw machine view, and the 23 Nov ruling (item 8e) keeps it out of the picture. The view is still labelled "Exactly as said" on `develop` (`strings.en.ts:426`; also `:862`, `:1504`), so a plain recapture would show it | Recapture frame 3 so the link is not inside the frame (crop or capture a state without it). No new words and no app string change |
| 4 | A book that grows by month. / Each letter goes into your child's month of age. | Same. Screen: Asha's book, month 7 and month 6, Read together, two tabs (Tonight, Book) | ok | True. The tab bar in the image shows no Moments tab and no Family tab | none |
| 5 | Read together at bedtime. / One letter at a time, oldest first. | Same. Screen: one letter, Hear Mama, Back one, Next letter | ok | `apps/mobile/src/app/read-together.tsx` header: "one letter at a time, oldest first". No word highlight shown (D-059) | none |
| 6 headline | Your book is private. (source) | **Your book stays on your phone.** | untrue (image); counsel-held (source) | The PNG contradicts `captions.json`. "Stays on your phone" is false once a parent signs in and sync is on. The source line, "private", is a claim in the claims registry (Q16, Q17, LEGAL-REQ-044) | None for the text. Recapture so the image matches the source after counsel's answer |
| 6 subline | Private by default. Never sold, never used for ads. | Same | counsel-held | Mirrors `en.trust.promise` and `en.trust.short`; the promise is word for word (D-061) and gated by Q16 and Q17 | none |
| 6 screen | (text inside the frame) "What we never do" list, three lock icons, "Terms of Service" | Visible in the committed PNG | untrue; ruled 23 Nov: recapture, caption unchanged (item 8e) | The list was retired 8 Nov; Settings, Privacy now opens with `trust.promise`. The third line names photos, which 1.0 does not have. VOICE.md allows no locks | Recapture from current `develop`. No new words needed |
| 7 | Quiet days are fine. / Tap Not much today. That is enough. | Same. Screen: "A quiet day, kept." with Undo | ok | The button is "Not much today" (`strings.en.ts`). No gap counting, no streak | none |
| 8 | Pause, laugh, start again. / Take your time. Say it however it comes. | Same. Screen: Listening, Pause, Finish, Let it go, "Only you, until you add it to the book." with a padlock icon | ok | Pause exists. "Start again" is loose (the controls are Pause and Let it go), but nothing is untrue. The padlock icon in the screen is the app's, not ours to redraw | Optional: Pause, laugh, keep going. Only if the founder wants the verb to match the button |

Two small notes that are not verdicts. Frame 1 and frame 7 show an Asha sample letter with "um" and "you you" left in, which is the point of frame 2, so it is ok. Frame 3's date line reads Sep 3 2026 while the other frames are Nov 3; harmless.

### Recapture rule (Q-X1-12)

The frames were captured from `develop` at `d6e83f9e` on 3 Nov, before any Moments work. Before any recapture:
- The Moments tab is on `develop` since #1482 but dark behind `EXPO_PUBLIC_MOMENTS_TAB`, and the `production` profile does not set it. If the tab (or any label for it) is on in the build used for the recapture, the tab bar in every frame that shows it will name it. That is store text under MT-PR-R11 until counsel clears the name. Crop the tab bar, capture with the fallback label the CLO review names (it cites "Days" from PR #1270), or hold the recapture until counsel answers.
- The captions need no change for this; no caption mentions the tab.
- Recapture frame 6 in the same pass (summary item 1).

## Listing lines (`store.en.ts`, mirrored in `app-store.md` and `store.config.json`)

Only lines that carry a fact about the build, or a promise, are listed. Lines that are plain description (the opening paragraph, "A minute is plenty", "Names spelled your way") passed the content rules and say nothing the build does not do.

| Field / section | Line | Verdict | Why | Proposed replacement |
|---|---|---|---|---|
| Name, subtitle | Early Letters: Baby Journal; For parents who'd rather talk | ok | From `packages/brand`, D-139. No Moments, no "exactly" | none |
| Promotional text | Tell your child about today. A minute is plenty. It stays in your words. Every word we change is marked, and your original recording is kept unchanged. | changed 23 Nov (items 8b, 8d) | No timing promise (D-169 item 1); "Every word we change" is the exec-ruled alignment of the D-133 line (BL-1711). 151 of 170 characters | none |
| Keywords | diary,keepsake,memory,book,voice,newborn,toddler,child,parenting,audio,recorder,bedtime,mom,dad,mama | ok | 100 of 100. No language keywords (English only), no Moments, no other platform | none |
| IT STAYS IN YOUR WORDS | "...only fixes small slips... It never adds a word. Every change is marked... We never rewrite your words, shorten them or write for you. A word can be misheard... Letters you type stay as you typed them." | counsel-held | Promise wording (Q16), built on the BRAND.md and D-133 lines. "Every word we change is marked" since 23 Nov (item 8d). "Exactly" does not appear | none |
| YOUR VOICE, KEPT | Every letter you speak keeps its recording, on your phone and in your iPhone's own backup if you use one. We never imitate your voice. Your original recording is always kept exactly as you made it. | counsel-held | True with backup off: the person's own iPhone backup is the only backup, and the Build 12 test allows that phrase. The last sentence is `en.trust.voice` (a registered promise; it uses "always" and "exactly" about the recording, not the words) | none |
| READ TOGETHER AT BEDTIME | Open Read together... one letter at a time, oldest first. Listen to the letters you spoke, with the words on the screen. Typed letters are there too, for you to read aloud. | ok (changed 23 Nov, item 8c) | Order matches the code. "For you to read aloud" says the parent reads it; no text-to-speech is promised. Not verified on a device: that Hear plays inside Read together for every spoken letter (frame 5 shows it) | none |
| A BOOK THAT GROWS BY MONTH | Each letter goes into your child's month of age... Before You... Twins or more each get their own book. | ok | "Before You" exists (`strings.en.ts:114`, `:513`, `:544`) | none |
| PRIVATE BY DEFAULT | Your letters and recordings are private. We never sell them... You sign in to keep your book. If you agree to sync, the words of your letters and your child's name and dates are kept on our servers so they reach a new phone. Recordings stay on the phone that made them. Keep any letter just for you... Recently deleted for 30 days. | changed 23 Nov (item 8a) | The first two sentences are `en.trust.promise` word for word (D-061). The old "Without an account, your book stays on your phone" described a mode the parent will not meet (sign-in is required, D-160), and "or erase it at once" was false because Erase now is hidden when sync is on. The new lines say what sign-in and sync keep. Counsel must confirm; no outside lawyer has read it (D-172) | none |
| REMINDERS | Reminders are off until you turn them on... none comes after 9:30 at night. | ok | `packages/content/src/features/reminders.en.ts:57`: between 7 AM and 9:30 PM | none |
| TAKE IT WITH YOU | Export your book any time, for free: your letters, your recordings and a PDF of the book. | ok, unverified | The `app-store-staged-1.0-proposal.md` table says "Verify" for the PDF. Not re-checked on the build in this audit | none |
| IN ENGLISH | This version writes down letters spoken in English. The speech model is a one-time download, on Wi-Fi unless you turn on cellular data, 575 MB on most iPhones and smaller on some, and you choose when it starts. | ok | English only is on in `production`. Size and Wi-Fi rule match `notes-for-review-1.0.txt` (575 MB, 190 MB on smaller phones) | none |
| PLUS | $4.99 a month with the first month free, or $49.99 a year with the first 2 months free... works with Family Sharing... Payment is charged to your Apple Account. Plus renews automatically... | counsel-held | Prices and trials match `notes-for-review-1.0.txt`. Subscription notices and Family Sharing are gated by Q8, Q-C4, Q-C10 and D-053. D-053's older price line ($3.99, $29.99) is superseded; the listing and the notes agree with each other | none |
| What's New | This is the first version of Early Letters. Talk or type a letter to your child, keep your voice with it, read together at bedtime, and export your book any time. | ok | True of the build. No co-parent, no languages, no Moments | none |
| Terms and Privacy URLs | earlyletters.com/terms, /privacy | counsel-held | Legal pages; the live-page check is an open item in `app-store.md` | none |

## Other store files that disagree with the source (not edited here)

| File | Line | Problem |
|---|---|---|
| `docs/store/app-store.md`, Screenshots table | Frame 6 screen text | Fixed 23 Nov: the generator (`scripts/brand/store-listing.ts`) now describes frame 6 without the "What we never do" list |
| `docs/store/screenshots/README.md`, frames table and "Know before upload" | Same frame 6 description; "Captured from `develop` at `d6e83f9e`" | Same staleness. The README also says the frames were checked against the sharing and family word list; it does not mention the retired list |
| `docs/store/notes-for-review-1.0.txt` | "NO ACCOUNT ... no sign-in" | Already marked SUPERSEDED FOR BUILD 12 at the top. Correctly not for pasting. The servers-on notes are `packages/content/src/release/app-review.en.ts` (protected) |
| `docs/store/app-store-staged-1.0-proposal.md`, section 5 | Frame 6 "Private to your family"; frame 2 "We fix slips of the tongue. Never your words." | Marked superseded at the top; history only |

## Recapture status (23 Nov 2026, exec rulings item 8e)

Not done in this change. A recapture needs a simulator or device and the release build, so it is a founder or device step, and no image was generated or edited here. The committed PNGs under `iphone-medium-1206x2622` and `ios-6.9in` still show the old words on frames 2 and 3 and the old Settings screen on frame 6.

- Frame 2: compose again with the headline "Every word we change is marked." (31 characters).
- Frame 3: compose again with the headline "A spoken letter keeps your voice." (33 characters), and capture so the "Exactly as said" link is not inside the frame (D-133 found it is raw machine output).
- Frame 6: recapture from current `develop`, caption "Your book is private." unchanged, with no "What we never do" list, no lock icons and no photo line (BL-1853).
- Frames 1, 4, 5, 7 and 8 are unchanged.

## What to do next (suggested order)

1. Founder: recapture frames 1 to 8 from current `develop` on the release build (README "Know before upload"), so frame 6 shows the current Settings, Privacy screen. This clears summary item 1 with no new words.
2. Founder: take or leave the frame 3 headline fix (summary item 2).
3. Founder: recapture frame 3 without the "Exactly as said" link (3a, ruled). Founder and counsel: rule on the sync silence in PRIVATE BY DEFAULT.
4. Counsel: the clearance for Moments before any recapture that shows a tab bar with it (Q-X1-12).

This audit found one image that contradicts its source, one overclaiming headline, and nothing banned. It did not test the build; the claims about what the app does come from reading the code and content files on `develop`.
