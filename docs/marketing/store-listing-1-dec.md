# Store listing for the 1 Dec submission: claims check, proposed changes and the build 2 tester note

Owner: `marketing` (draft). Final words go to `content` (`packages/content/src/store.en.ts`, `packages/content/src/release/testflight.en.ts`); claims go to `legal`. Written 1 Nov 2026 against `develop` at b79982d0. Nothing here is published, pasted into App Store Connect or sent to anyone.

Sources: wave 3 brief; `/home/claude/proposals/v1-experience/council.md` (F5, CMO-1, Part 3 release map); `/home/claude/proposals/v1-experience/plus.md` (PL-2, section 5 copy); `/home/claude/proposals/account-security/council.md` (NAQ-2, CPrivO-1); `docs/DECISIONS.md` (D-061, D-121, D-125 item 9, D-126, D-133); `docs/exec-rulings-claims-trust-2026-11-01.md`; the code paths named in the claims table.

## 1. Ownership: why this PR changes no listing file

| File | Owner | Why it is not edited here |
|---|---|---|
| `apps/mobile/store.config.json` | Generated | `scripts/release/store-config.ts` writes it from `store.en.ts`; "Never edit store.config.json by hand" (line 8 of the script); `--check` fails a hand edit |
| `docs/store/app-store.md` | `content` (brand and content) | Generated from `store.en.ts`; the content rules test fails if it drifts |
| `packages/content/src/store.en.ts` | `content` | Every product word lives in `packages/content` (CLAUDE.md); my charter sends final copy to `content` |
| `packages/content/src/release/testflight.en.ts` | `content` | Same |
| `docs/store/listing/apple.md`, `listing.json` | Superseded (`docs/store/listing/SUPERSEDED.md`) | Not pasted; kept only for a test |
| `docs/store/app-store-staged-1.0-proposal.md` | Store lane, historical | Status line says "applied 31 Oct"; not a draft |

So the proposals below are drafts for `content` to apply in one PR to `store.en.ts`, then run `npx tsx scripts/release/store-config.ts` and the store-listing script so both generated files follow.

### The "delete everything" line is already fixed on develop

The false sentence "You can export everything or delete everything, any time, from Settings" is no longer in `store.config.json` or `docs/store/app-store.md`: #567 (246debbd, 1 Nov) replaced it, as `docs/store/app-store-connect-1.0.md` risk R2 records. Both now say "Delete one and it waits in Recently deleted for 30 days, or erase it at once.", which is the true sentence from `docs/store/listing/apple.md:54` in the listing's own phrasing, backed by `SHELF_DAYS = 30` (`apps/mobile/src/lib/shelf-days.ts:2`). NAQ-2 and CPrivO-1 are met. The old sentence survives only in `docs/store/app-store-staged-1.0-proposal.md:52`, a historical proposal that is not pasted anywhere; its owner may add a "superseded" note.

## 2. Proposed changes to `store.en.ts` (for `content`)

Each row names the current words, the proposed words and the ruling. Rows P1 to P3 are for the 1 Dec listing. Rows A1 to A4 are words that go in only in the same PR that ships the feature (the rule at the top of `store.en.ts`: "Each later 1.0.x release that turns a feature on adds it back here in the same pull request").

| Id | Section | Current | Proposed | Why |
|---|---|---|---|---|
| P1 | A MINUTE IS PLENTY | "...tap "Not much today" and that is enough. Nothing keeps score." | "...tap "Not much today" and that is enough." (drop the last sentence) | CMO-1: no "No streaks" line in the store. "Nothing keeps score" is the same claim in other words. Streak absence is a comparative claim (competitors.md item 9) that belongs to `legal` and `content`, and the release map row "Listing: no memory, fact or streak claims" (council Part 3) is 1 Dec |
| P2 | YOUR VOICE, KEPT | "Every letter you speak keeps its recording, on your phone and in your iPhone's own backup if you use one. We never imitate your voice. Your original recording is always kept exactly as you made it." (the last two sentences are `en.trust.voice`) | "Each letter you speak keeps its original recording, unchanged, on your phone and in your iPhone's own backup if you use one. We never imitate your voice." (stop reusing `en.trust.voice` in the listing) | "always kept" is false once a parent deletes a letter and it leaves Recently deleted; "exactly" is the word D-125 item 9 and D-133 hold back from public surfaces, and D-133 notes the player plays a cleaned listening copy, so only the original file is unchanged. The proposed sentence is row 9 of the claims-trust rulings word for word, plus the backup clause already in the listing. Whether the in-app `en.trust.voice` should change too is `content`'s and `legal`'s call |
| P3 | PLUS | "Your first two letters are free, so you can see how it feels. To keep adding letters, choose Plus: $4.99 a month with the first month free, or $49.99 a year with the first 2 months free. The free months are for people new to Plus. One plan covers every child's book and works with Family Sharing. A new letter past the free two waits on your phone until you decide. Every letter you have kept stays yours to read, play and export, with or without Plus." | "Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free. Plus is $4.99 a month with the first month free, or $49.99 a year with the first 2 months free. The free months are for people new to Plus. One plan covers every child's book and works with Family Sharing. A new letter past the free two waits on your phone until you decide." | F5: the parent meets the same three sentences at setup, on Plan and at letter 2 (council F5, plus.md section 5). Prices sit in their own sentence, apart from "two letters" (subscription-metadata.md: the phrase never shares a line with a price or trial). "Your copy" is the export, which `FREE_FOREVER` keeps free (`packages/core/src/plan.ts:56`) |
| P3b | PLUS, only if PL-2 merges by Fri 20 Nov | (P3's last sentence) | "A new letter past the free two waits on your phone until you decide, and you can read it, play it and export it while it waits." | PL-2 is P0 for 1 Dec, but today a held letter is not exported (plus.md finding 3: `lib/export/device.ts` exports kept entries only). F5's default: if PL-2 slips, the held note drops "export". So P3 ships as written unless PL-2 is merged and its export hash test passes |
| A1 | PRIVATE BY DEFAULT | (nothing) | "To erase everything on this phone at once, use Settings, Erase everything." | Only in the PR that ships Erase everything (account items, 1 Dec on the release map) and after it is verified on a device (CPrivO-1, NAQ-2). Says "on this phone": copies in the parent's own iPhone backup are outside the app's reach. `legal` reviews before it goes in |
| A2 | PRIVATE BY DEFAULT | (nothing) | "Lock the app with Face ID if you like." | Only if the app lock ships on 1 Dec (account items, F1); counsel is still on the Face ID usage string (release map) |
| A3 | PLUS | (nothing) | "A note you keep counts toward the free two, like a letter." | Only in the PR that ships notes (D-133 decision 1 and its effects: "the store listing's notes line"). If notes ship and this line does not, "Your first two letters are free" undercounts what is counted |
| A4 | None | (nothing) | No line about memories, the "A month ago" card, facts or thoughts | CMO-1 and F6, F7: no memory or fact claims in the 1 Dec listing; facts not before 1.2 |

Kept as they are (checked, true for the 1 Dec build): name, subtitle, keywords, promotional text (the D-133 line, pinned by `rules.test.ts`), the privacy promise (`en.trust.promise`, word for word, D-061), "There is no account to make, and your book stays on your phone" (D-121, D-126: no sign-in, sync or sharing in the store build), every other section. No section claims sign-in, sync, sharing or a backup of ours; the only backup named is the person's own iPhone backup, which is true (claims table row 7).

Screenshots: frame 1 (`01-tonight`) must be captured with no memory card on Tonight, since the card gains "Not today" on 1 Dec and CMO-1 keeps memories out of the listing. Captions for frames 1 to 8 make no memory, fact, streak, sign-in, sync or backup claim.

## 3. Claims table

Status: TRUE (code or ruling backs it for the 1 Dec build), CHANGE (proposal above), CONDITIONAL (true only if a 1 Dec item lands), FOUNDER (only the founder can confirm), LEGAL (needs `legal` before submission).

| # | Claim | Where it appears | Evidence | Owner | Status |
|---|---|---|---|---|---|
| 1 | It stays in your words. Every change is marked, and your original recording is kept unchanged. | Promotional text; description "IT STAYS IN YOUR WORDS" | D-133 decision 2; `packages/core/src/types.ts` `EditType`; `verify.ts`; pinned by `rules.test.ts` ("store text carries the D-133 line") | content, legal | TRUE |
| 2 | The app only fixes small slips (um, repeat, a name spelled your way); it never adds a word; every change can be put back | Description | `EditType`, `verifyEdits` (CLAUDE.md constitution); claims-trust ruling Q5 row 1 | content | TRUE |
| 3 | Your words are written down on your phone | Description | On-device speech model (`apps/mobile/src/lib/models/catalog.ts`); server features off in `production` (`apps/mobile/eas.json`) | content | TRUE |
| 4 | Letters you type stay as you typed them | Description | D-057; claims-trust ruling (typed text untouched) | content | TRUE |
| 5 | Each spoken letter keeps its original recording, unchanged | Description (P2), screenshot 3 subline | D-058; D-133 ("only the original file is unchanged") | content, legal | CHANGE (P2) |
| 6 | Your original recording is always kept exactly as you made it | Description today (`en.trust.voice`) | "always" fails after deletion (`SHELF_DAYS`); "exactly" held by D-125 item 9 and D-133 | content, legal | CHANGE (P2) |
| 7 | Recordings are in your iPhone's own backup if you use one | Description | Only model and pack folders are excluded from backup (`apps/mobile/src/lib/model-files.ts:43`, `apps/mobile/src/lib/packs/app-support.ts:38`); claims-trust ruling line 28; account council (backup question) | content | TRUE |
| 8 | We never imitate your voice | Description | No voice synthesis in the app; listening copy is the parent's recording, cleaned (D-133) | legal | TRUE; LEGAL (absolute "never") |
| 9 | Read together, one letter at a time, oldest first; typed letters ready to read aloud | Description; screenshot 5 | `store.en.ts` screenshot note; Read together screen | content | TRUE |
| 10 | A question to begin with; "Not much today" | Description; screenshot 7 | Prompt pool in `packages/content`; `Not much today` on Tonight | content | TRUE |
| 11 | Nothing keeps score | Description today | CMO-1 | content, legal | CHANGE (P1, cut) |
| 12 | Each letter goes into the child's month of age; Before You for an expected baby; each child gets a book | Description; screenshot 4 | Age math in `packages/core`; `before` prompts (BL-535) | content | TRUE |
| 13 | Names and home words spelled your way | Description | Family word list (`features/words.en.ts`; `dictionaryFor` in `apps/mobile/src/lib/store.ts`) | content | TRUE |
| 14 | Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models. | Description (once, D-061) | `en.trust.promise` (`packages/content/src/strings.en.ts:1208`), the approved wording; analytics off (D-124) | legal | TRUE; LEGAL (LEGAL-REQ-044 registry before submission, app-store.md checklist) |
| 15 | There is no account to make, and your book stays on your phone | Description; screenshot 6 | D-121, D-126: server features off in `production`; notes-for-review "NO ACCOUNT" | content | TRUE for 1 Dec; must change in the 1.1 PR that ships sign-in |
| 16 | Keep any letter just for you, out of the book | Description | Write's "Keep private" (`strings.en.ts:417`) | content | TRUE |
| 17 | Delete one and it waits in Recently deleted for 30 days, or erase it at once | Description | `SHELF_DAYS = 30` (`apps/mobile/src/lib/shelf-days.ts:2`); true line of `docs/store/listing/apple.md:54`; #567 | content | TRUE |
| 18 | Erase everything on this phone from Settings | Not in the listing (A1) | Specified (WP-F17-15), not built on develop | privacy, legal | CONDITIONAL (A1) |
| 19 | Reminders are off until turned on; none after 9:30 at night | Description | `LATEST_MINUTES = 21 * 60 + 30` (`apps/mobile/src/lib/reminders/planner.ts:128`); `reminders/prefs.ts:13` | content | TRUE |
| 20 | Export any time, for free: letters, recordings and a PDF | Description; What's New | `FREE_FOREVER` includes `export` (`packages/core/src/plan.ts:56`); `apps/mobile/src/lib/export/` | content | TRUE |
| 21 | English only; one-time download on Wi-Fi unless cellular is on; 575 MB on most iPhones, smaller on some | Description | `ENGLISH_ONLY` on in `production` (D-121); turbo 574,041,195 B plus VAD 885,098 B = 575 MB; compact tier 190 MB (`catalog.ts:120, 138, 156`) | content | TRUE |
| 22 | First two letters free; then Plus; reading, listening and your copy stay free | Description (P3) | `DEFAULT_FREE_LETTERS = 2` and `FREE_FOREVER` (`plan.ts:56, 68`); F5 | content, payments | CHANGE (P3) |
| 23 | A held letter can be read, played and exported while it waits | Not in the listing (P3b) | PL-2 not built: `lib/export/device.ts` exports kept entries only (plus.md) | payments, legal | CONDITIONAL (P3b) |
| 24 | $4.99 a month, first month free; $49.99 a year, first 2 months free; free months for people new to Plus | Description | `apps/web/src/content/pricing.ts`; `docs/store/app-store-connect-1.0.md` subscription table | founder | FOUNDER (prices and offers entered in App Store Connect must match) |
| 25 | One plan covers every child's book and works with Family Sharing | Description | `plan.ts` (familyShared entitlement); `app-store-connect-1.0.md:117` "Family Sharing On" | founder | FOUNDER (setting in App Store Connect; cannot be turned off later). Note `docs/store/compliance/subscription-metadata.md:33` still says Off and is stale |
| 26 | Auto-renewal terms; manage or cancel in Apple Account settings; Terms and Privacy links | Description | Guideline 3.1.2; `brand.web.terms`, `brand.web.privacy` | legal, founder | LEGAL (app Terms and Privacy pages live by Fri 20 Nov, app-store-connect-1.0.md R1) |
| 27 | Years from now, your child can read it and hear how you sounded | Description | Recording kept on the phone and in the iPhone backup; Export (claims-trust row 8: "TRUE FOR BUILD 1") | legal | TRUE; LEGAL (low: depends on the parent keeping the phone, a backup or an export) |
| 28 | Notes count like letters | Not in the listing (A3) | D-133 decision 1; notes land after 9 Nov | content | CONDITIONAL (A3) |
| 29 | No memory, fact or streak claim anywhere in the listing or captions | Whole listing | CMO-1, F6, F7 | marketing | TRUE after P1 |
| 30 | No sign-in, sync, sharing or backup-of-ours claim | Whole listing | D-121, D-126; `SERVER_ONLY_CLAIMS` in `scripts/release/store-config.ts --assert-shippable` | marketing | TRUE |

## 4. TestFlight "What to Test", build 2 (draft for `content`)

Build 2 is the alpha build cut at the freeze, Tue 3 Nov 5:00 AM PT (D-130). Everything below is on `develop` now: #541 (download progress), #545 (typing), #546 (Settings back), #552 (no letter limit in alpha builds). If build 2 is the `preview` profile (servers on, D-126), this block goes before the "Please try" list of `whatToTest.build2` in `testflight.en.ts`; if it is the `testflight` profile, before `whatToTest.build1`'s list. The rest of that text (Plus line, feedback block, group lines) stays as it is.

```text
New in this build, please try:

- The speech download. If your phone has not downloaded it yet, start it at the end of setting up. While it moves you should see a percent and a bar. If it is waiting for Wi-Fi or getting ready, it should say so in words, not sit at 0%. If it stops, it should say Paused and offer Try again. If you already downloaded it in the first build, it is done, and there is nothing to see here.

- Typing a letter. Type a long letter, several lines, past the top of the keyboard. The line you are typing should stay in view, and autocorrect, suggestions and dictation should work as they do in your other apps.

- Back from Settings. Open Settings, then tap Back at the top left. You should return to where you were.

- Keeping more than two letters. Plus is not part of this test, so the app should not stop you after your second letter. Keep a third and a fourth and tell us if anything asks you to pay.
```

Notes on the draft:
- No line asks a tester to delete the app to see the download again: deleting the app deletes the letters on the phone.
- "No letter limit" is 100 letters in code (`MAX_FREE_LETTERS`, #552 "Known and left open"). The draft does not say "unlimited" or "as many as you like" for that reason.
- No real names, no child's name; the existing feedback block already asks testers to keep their child's name and words out of feedback.
- The existing `plusLine` ("Plus is not part of this test, so every letter you keep is free. Purchases in this test cost nothing.") stays; the fourth bullet does not repeat it.

## 5. For `legal`

1. P2: the listing drops "always kept exactly as you made it" for "keeps its original recording, unchanged". Should the in-app `en.trust.voice` change to match (it is shown in Settings)?
2. Row 8: "We never imitate your voice" is absolute. True of the code today; confirm it may be said.
3. Row 14: the privacy promise is the approved wording (D-061); it still needs counsel's tick in the LEGAL-REQ-044 claims registry before submission.
4. A1: "Erase everything on this phone" says nothing about copies in the parent's own iPhone backup. Confirm whether the listing (or the Erase screen) must mention them.
5. Row 26: the description links Terms and Privacy pages that must exist for the app (today they cover only the website, app-store-connect-1.0.md R1).
6. Row 27: a long-horizon promise in a store with no backup of ours. Low risk; confirm.
7. Seen in passing, not a listing claim: `strings.en.ts:183` ("Only the ones you add to the book are shared.") talks about sharing in a build that has none (D-126). Worth a look by `content`.
