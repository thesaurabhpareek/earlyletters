# Executive council rulings: claims and trust (1 Nov 2026)

Branch `docs/exec-claims-trust-2026-11-01`. Convened for the founder (Saurabh), who asked: "Discuss all these questions with the executive team members needed and then decide what's right. Make sure we don't make false claims and remain focused on building trust." He approved and delegated implementation to the CTO (Karma).

## Read this first: limits of this document

- Every role here is a Claude role (CLO, CCO, Privacy, CPO, CMO, Design, CAIO, signing as "<title> (Claude role)"). None is a lawyer. Where a line says "counsel must confirm", no lawyer has looked at it, and nothing here is legal advice.
- The council ran in one session, so the founder gate (CTO skill, section 10a: an independent challenge) was **self-challenged only**. The rulings below should be read with that in mind.
- `docs/agents/exec/COUNCIL.md` and `RULINGS.md` are not on `main`. I read them in full from `origin/develop` (with the role skills and `docs/DECISIONS.md`) and followed them, but the entries live here, in a stand-alone doc, until `develop` and `main` meet.
- D-133 is not in `develop`'s `DECISIONS.md`. It exists only in open PR #439. It is cited as "D-133 (PR #439, open)". Its true line is used as the model sentence: "It stays in your words. Every change is marked, and your original recording is kept unchanged."
- I could not run the app, the App Store listing, EAS, the real microphone, or the PDF printer. Everything below is read from code and docs, not observed running.

## The finding that shapes everything: two products on two branches

- `main` is the website plus a stale 3 Oct snapshot of `apps/mobile` and `packages/content`.
- `develop` is the real product (74 commits ahead in one direction, 284 in the other). The first store build is `develop`'s `production` EAS profile (`apps/mobile/eas.json` lines 56 to 69): `SERVER_FEATURES` off, `BACKUP` off, `STATUS_REPORT` off, `ANALYTICS` off, `ENGLISH_ONLY` on, `ACCOUNT_DELETION` on (but it needs servers, so the row is not drawn).
- So "what is true" has to be judged against build 1 (D-121), not against the main snapshot. Content fixes on `main` do not reach the build unless ported to `develop`. Several of the strings fixed here were already fixed, or retired as dead copy, on `develop` (see the retired-strings note at the foot of `develop`'s `strings.en.ts`).
- **Follow-up for the CTO (not done here, one concern per PR):** port the true wording from `develop` into the `main` snapshot, or retire the snapshot strings. `main` still carries server-product copy in the snapshot (for example `backup.body`, `honestNote`, `delete.bookBody`). Flagged, not edited.

## What the engine really does in build 1 (facts for Q1, Q5)

Read from `origin/develop`:

- `packages/core/src/types.ts:12-19`: `EditType` is `filler`, `false_start`, `repeat`, `stt_fix`, `punctuation`, `agreement`, `paragraph`. Every edit goes through `verifyEdits` (`verify.ts`); the `inserted_content_word` rule rejects added words. `raw_transcript` is immutable.
- Build 1 runs rules only (`pipeline.ts`, `rules.ts`, `punctuation.ts`): dictionary `stt_fix`, fillers, accidental repeats and restarts, sentence-start capitals, a final full stop. The model pass is never wired. English runs at the `clean` level, other languages at `verbatim`. Late-arriving words are never fixed.
- Typed text is untouched (D-057). The original recording is unaltered (D-058).
- The PDF prints `finalText` (`export/build.logic.ts`), so printed words are the fixed words, not the raw words.
- Recordings are deliberately not excluded from the iPhone's own backup (`apps/mobile/src/lib/model-files.ts:14`). That is why "kept on your phone and in your iPhone's own backup, if you use one" is true and "not sent to us" is true.

---

## Q1. The PDF sentence "Nobody tidied it up afterwards. The only changes were small fixes where a microphone misheard a word."

- **Verdict: FALSE.** It omits the most common edits (ums, repeats, capitals, a full stop), and "where a microphone misheard a word" describes only `stt_fix`, and only for words in the family's own names list. "Nobody tidied" is also in tension with a thing that does tidy.
- **Facts.** `packages/content/src/book.en.ts` (before this PR), `aboutThisBook.body`, `backCover` ("kept exactly as they said it"), `colophon` ("Every word kept as it was said"). Engine facts above.
- **Positions.** CLO (Claude role): a printed claim about what a book contains is the strongest kind; a printed keepsake cannot be corrected after it ships. Say what happens, no more. Privacy: no objection. CPO: the true sentence is also the better one; it explains the "marked" fixes the parent already saw in Read it back. CMO: do not trade accuracy for the tagline. Design: keep the page short. Disagreement: CMO wanted "In their own words" kept on the back cover; CLO said "kept in their own words" is true and "exactly as they said it" is not. Karma tie-break: CLO.
- **Decision (RULED, Karma).** Replace with a sentence that matches `EditType` and the D-133 line. New `aboutThisBook.body`: "Every word in this book was spoken or typed by {child}'s family, and no word was added. Typed letters are exactly as they were typed. A spoken letter may carry small fixes: a stray "um" or an accidental repeat taken out, a name set to the spelling you gave the app, and capital letters and full stops put in. The app showed each fix when the letter was kept, and every original recording is kept unchanged. ..." Also `backCover` now says "kept in their own words" and `colophon` says "Made with Early Letters, from words the family said and typed."
- **Door type.** Two-way until a book is printed or exported, then one-way for that copy. This is why it is fixed before the first export.
- **Revisit trigger.** The model pass is wired, a new `EditType` is added, or the build adds a language that runs above `verbatim`.
- **Counsel must confirm:** whether a printed book needs this sentence at all, and the wording of any claim about "no word was added" given `agreement` is an allowed edit type (one word, same stem). Not used in build 1 rules, but it is in the allowlist.
- **Founder:** none. Test pins added (below).

## Q2. "tidy / tidied" in about 10 in-app labels

- **Verdict: NOT A QUESTION.** D-086 already says remove "tidy" everywhere and mark fixes.
- **Facts.** `strings.en.ts` on `main` (before this PR): `promise.body`, `review.subtitle`, `review.showTidiedButton`, `review.tidiedLabel`, `provenance.spokenTidied`, `settingsMore.tidyLabel/tidyOn/tidyHelp`, `neverRewrite`. On `develop` most are already fixed.
- **Decision (RULED, Karma).** Change the values to "small fixes", keep the keys (the key `tidyOn` and `spokenTidied` stay because the app reads them). `rules.test.ts` now rejects `tidy/tidied/tidying` anywhere in the content leaves.
- **Door type.** Two-way.
- **Founder:** none.

## Q3. Site hero "Private by design: your letters stay on your phone" versus the FAQ saying letters sync when signed in

- **Verdict: BUILD-1-ONLY, with the FAQ FALSE for build 1.** The hero is true for build 1 only (no server, no sign-in, no sync: `capabilities.ts`, `eas.json` production). The FAQ sentence "When you sign in, your letters sync to our servers" describes a later release and is false for build 1. Together they contradict each other and the second is the one a 1.0.x release will make true.
- **Facts.** The live site (`apps/web/src/content/site.ts` on `main`) has no "Private by design" hero (searched; none). The phrase lives in `packages/content/src/site.en.ts`, the reference copy. The live site says it at `site.ts:74` (`comingSoon.trust`): "Your letters stay on your iPhone. Only the people you invite can see them." That has the same split: "stay on your iPhone" is true for build 1 only, and "the people you invite" is not true for build 1 at all.
- **Positions.** Privacy: say only what the build does. CLO: "private by design" is a legal-adjacent phrase and a promise; drop "by design" (counsel must confirm any use). CMO: keep warmth. Karma tie-break: write the first-build truth now, and re-check at the first release that adds sync or backup (D-121).
- **Decision (RULED, Karma).** Reference copy (`site.en.ts`) states first-build facts only: "It stays in your words, and your letters stay on your iPhone." Sync, backup and invite wording is removed from the reference and held (list below). For the live site, see the apply-after-#478 list.
- **Door type.** Two-way, but a promise in the App Store text is one-way for that version.
- **Revisit trigger.** The first release with sync, backup or invites (the 1.0.x that flips `SERVER_FEATURES`).
- **Counsel must confirm:** the Privacy page and terms against build 1 (legal text is held by D-125 and not touched here).
- **Founder:** none for the wording; the legal text is FOUNDER (below).

## Q4. Status copy ("arrives in a coming update", "not open yet in the beta")

- **Verdict: FALSE in a store build.** "Beta" contradicts D-060 (no "beta" in the store). "Arrives in a coming update" is a promise of a date-less feature, and a promise to users is founder-only unless the founder has already made it (D-126 says no co-parent "coming soon" surface in the store build).
- **Decision (RULED, Karma): reword to say what this version does, make no promise.** Values changed, keys kept: `childrenExtra.plusNotYet` "Plus is not available in this version."; `familyTab.inviteNeedsSignIn` "...This version has no accounts."; `settingsMore.signedOutHelp` "Your letters and recordings are kept on this phone and in your iPhone's own backup, if you use one."; `exportNotYet` "Export is not available in this version."; `deleteAccountNotYet` "There is no account in this version. Deleting the app removes its letters and recordings from this phone."; `backupNotYet` "Encrypted backup is not available in this version."; `remindersNotYet` "Your choice is saved. Reminders are not on in this version."
- **Two honest caveats.** (1) On `develop`, several of these are retired or dead copy and export exists in build 1 (`export/build.logic.ts`); those strings are true of the `main` snapshot only. (2) The old `backupNotYet` tied backup to Plus, which D-111 says is free; the new line no longer does. `rules.test.ts` now blocks "arrives", "coming", "not open yet" and "beta" in these three status groups.
- **Door type.** Two-way.
- **Founder:** none, unless the founder wants a "coming soon" promise in the store (D-126 says no; default is no).

## Q5. Website claims and emails, traced

Source: `apps/web/src/content/site.ts` on `main` (896101e2). Line numbers are for that commit. "Build 1" means the `production` EAS profile.

| # | Claim (line) | Verdict | Basis | True wording / action |
|---|---|---|---|---|
| 1 | "takes out the ums and false starts and fixes a misheard name. It never adds a word. Every fix is marked and can be put back." (151) | TRUE FOR BUILD 1, with one nuance | `filler`, `false_start`/`repeat`, `stt_fix`; `inserted_content_word` blocks added words; "misheard name" only for words in the family's names list. "Put back" works in Read it back (`review.tsx`). | "takes out the ums and accidental repeats, and spells your names your way. It never adds a word. Every fix is marked and can be put back." |
| 2 | "never adds a word" | TRUE | `verify.ts` rejects `inserted_content_word`; D-133 | Keep. |
| 3 | "Delete any letter whenever you like." (212) | TRUE FOR BUILD 1 | D-085: delete, 30-day shelf (Recently deleted), no own backup in v1.0 | Optional: add "It waits 30 days in Recently deleted, or you can erase it at once." |
| 4 | "Your letters stay on your iPhone." (74) | TRUE FOR BUILD 1 ONLY | `SERVER_FEATURES` off | Keep with the re-check comment; see apply list. |
| 5 | "Only the people you invite can see your letters." (74, 208, welcome email) | FALSE FOR BUILD 1 | No invite in build 1 (D-126); there is no one else | "Your letters and recordings stay on your iPhone. They are not sent to us." |
| 6 | Seven sample lines in seven languages (196-203) | UNTRACED | D-115: English-only pack release, native reviewer. The file's own comment says each line needs a native speaker's sign-off. I found no sign-off record in the repo. | Hold the six non-English lines until a reviewer's name and date are on record. Show the English line only. |
| 7 | "English first. Hindi, Spanish, Mandarin, French, Arabic and Portuguese follow, each once a native speaker has checked it." (189) | BUILD-1-ONLY (English only is true) but the order is a promise | `ENGLISH_ONLY=on`. D-125 item 2 sets the unlock order; #478 reorders the list against it. | "English first. More languages follow one at a time, each after a native speaker has checked it." Do not name an order or a date. |
| 8 | "Years from now, press play and hear yourself" (181) | TRUE FOR BUILD 1 | Player in `lib/player/*`; recording kept on device; D-058 | Keep. Add "on your phone" only if a surface shows recordings leave the phone (it does not). |
| 9 | "Every letter you speak keeps its recording." (161, welcome email) | TRUE for spoken letters; typed letters have none | D-058; typed text is separate (D-057) | "Each letter you speak keeps its original recording, unchanged." |
| 10 | "Your letters are never used to train AI." (209) | TRUE FOR BUILD 1 (nothing is sent to us, no model runs) | Analytics, server, backup off | Counsel must confirm before it is a standing promise in a later release. |
| 11 | "No ads. We never sell your data." | TRUE FOR BUILD 1 | No ads SDK; analytics off (D-095/D-124) | Keep. |
| 12 | "Export your letters whenever you want." (210) | TRUE FOR BUILD 1 | `export/build.logic.ts` exists on `develop`; not observed running | Keep, but verify on a device before launch (not verified here). |
| 13 | Pricing: first two free; $4.99 a month with 1-month trial, $49.99 a year with 2-month trial (222-228) | UNTRACED to the App Store | Matches `pricing.ts` and D-082; I could not see App Store Connect | Founder confirms the numbers match the store before launch. D-075: the site shows the price. |
| 14 | "On iPhone in the US." (241) | TRUE as intent, UNTRACED as storefront | Not verifiable here | Keep; confirm storefront with the listing. |
| 15 | Sign-up email promises: "We never rewrite your words"; recording kept; "No ads, and we never sell your data"; unsubscribe link (`welcomeEmail`, 276-298; `notify.note`) | TRUE except the invite clause | Strings; unsubscribe route exists (`/unsubscribe`). I did not send a real email. | Fix the invite clause (row 5). |
| 16 | "Your email address is all we ask for." (`notify.hint`) | TRUE as far as the form goes | Not traced in the API handler | Counsel/CTO verify against what the handler stores (IP, user agent). |
| 17 | "Private" section label and headline "For your family only." (205-206) | BUILD-1-ONLY | Same as row 5 | "Kept on your phone." |
| 18 | Hero "Private by design: your letters stay on your phone" (in `site.en.ts` only) | TRUE FOR BUILD 1 ONLY, "by design" held | See Q3 | Replaced in the reference copy. |
| 19 | Tagline "Exactly as you said it." (`packages/brand/index.ts:41`) | FALSE as stated about edits | Engine makes small marked edits | See Q6. |

## Q6. The brand tagline "Exactly as you said it."

- **Verdict: FALSE as a description of what the app does; a feeling, not a fact, if read as a promise of faithfulness.** The engine removes ums and repeats and adds capitals and full stops. "Exactly" is not the right word for that, and D-086 and D-133 already moved the product line away from it.
- **Facts.** `packages/brand/index.ts:41`; baked into the OG PNG (registry `og.image`); alt text and tests pin name plus tagline; the video end card. D-125 item 9 holds the "exactly" wording; the alpha keeps its headline; D-133 (PR #439, open) says the brand lane picks a new tagline.
- **Positions.** CMO: the line is the brand; changing it touches the PNG, alt, tests and video. CLO: a tagline is a promise; "exactly" is the word most likely to be read literally by a regulator or a reviewer. Brand/Design: swapping in a new line is a one-day job once chosen. Karma tie-break: the line stays held, no edit now, and nothing we write meanwhile repeats it.
- **Decision (RULED, Karma).** Do not change `packages/brand` here (outside this PR's lane, and the brand lane owns the pick). The brand lane picks a new tagline against the D-133 line, as a separate PR that changes `packages/brand`, the OG image, its alt text, the pinned tests and the video end card in one move. Meanwhile, no new copy uses "exactly as you said it"; this PR removed the remaining uses in `book.en.ts` and `strings.en.ts` and the site reference. The website footer already uses "In your own words." (`site.ts:374`).
- **Door type.** Two-way, with a cost (the OG PNG is cached by social platforms).
- **Revisit trigger.** The brand lane's pick, or the first App Store review comment on the line.
- **Counsel must confirm:** whether any tagline that implies faithfulness needs a qualifier.
- **Founder (FOUNDER):** choosing the new public tagline is a public-name/brand decision. Recommendation: use the D-133 line or a short form of it ("It stays in your words."). Default if no answer: keep the held line off the site and out of new copy, and ship the store listing with the D-133 line.

## Q7. The ambient music

- **Facts.** Web Audio synthesis only, in `apps/web/src/film/sound/` (`AmbientSound.tsx`, `ambient-map.ts`, `ambient-engine.ts`). No audio file in `apps/web`, nothing fetched or decoded, no audio package, no model. The reverb tail is seeded noise. The on/off choice is stored in `localStorage` under `el-ambient-sound`, written only when a visitor presses the sound button. `apps/web/test/legal.test.ts` allows exactly this one file to touch storage. `docs/web/ambient-sound.md` was stale and drew legal conclusions ("no one else's copyright to licence", "a set of pitches is not a protectable composition"); a Claude role cannot state those. `privacy-copy.ts` still says "no browser storage".
- **Positions.** CLO: state facts only; "original", "no copyright issues" and "no AI" are legal or marketing claims that must stay true for every change; counsel must confirm. Privacy: a remembered choice in the browser is a small thing but it is a storage write, and the Privacy page should say so in one sentence rather than say nothing. CMO: "made live, no recordings" is a charming and true line, but a public claim is a standing promise. Disagreement: CMO would put it on the site; CLO and Privacy said hold. Karma tie-break: hold.
- **Decision (RULED, Karma).**
  1. Copyright position, as it may be said internally: "The sound is made live in your browser by our own code. It uses no recordings and no samples, and no audio file or model is involved. Counsel has not reviewed it." That is a description of the code, not a legal conclusion.
  2. The site says nothing public about it beyond the button's label. If someone asks, the sentence above is true and may be used.
  3. `docs/web/ambient-sound.md` is edited in this PR: unreviewed legal conclusions removed, a "counsel has not reviewed" status added, the facts above stated, and the old gain table marked stale (the master gain is now 0.24 and the maximum 0.35 after #472 and #475).
  4. Privacy page sentence (recommended, not applied, because it is legal text and held by D-125): "If you press the sound button, your browser remembers whether sound is on. It stays in your browser and is never sent to us." This is FOUNDER, below.
- **Door type.** Two-way (the sound is removable; a public claim is not).
- **Revisit trigger.** Any audio file, sample, or model enters `film/sound/`; or counsel reviews.
- **Counsel must confirm:** whether the synthesised sound raises any copyright question, and whether the `localStorage` choice needs a notice.
- **Founder (FOUNDER):** add the Privacy page sentence. Recommendation: yes, one sentence. Default: leave the Privacy page as it is and keep the choice stored only on button press.

---

## What changed in this PR

Edited (only `packages/content`, tests and docs, as the founder asked):

- `packages/content/src/book.en.ts`: `backCover`, `aboutThisBook.body`, `colophon`.
- `packages/content/src/strings.en.ts`: values only, keys kept: `promise.body`, `review.subtitle`, `review.noChanges`, `review.showTidiedButton`, `review.tidiedLabel`, `provenance.spokenTidied`, invite `howStep2`, `settingsMore.tidyLabel/tidyOn/tidyOff/tidyHelp`, `neverRewrite`, `childrenExtra.plusNotYet`, `familyTab.inviteNeedsSignIn`, and the status group (`signedOutHelp`, `exportNotYet`, `deleteAccountNotYet`, `backupNotYet`, `remindersNotYet`).
- `packages/content/src/site.en.ts`: rewritten as a first-build reference with a header pointing here. The family and gift sections are removed (held, see below).
- `packages/content/test/rules.test.ts`: 5 new tests (listed next).
- `docs/web/ambient-sound.md`: see Q7.
- `docs/exec-rulings-claims-trust-2026-11-01.md`: this file.

Not edited: `apps/web/src/content/site.ts` and `apps/web/e2e` (owned by in-flight PR #478), `packages/brand`, legal text, `docs/DECISIONS.md`.

Tests added or changed in `packages/content/test/rules.test.ts`, describe block "claims that must be true of what the first build does":

1. No tidy/tidied/tidying anywhere (D-086).
2. The book never says nobody changed the words, or "exactly as they said", or "kept as it was said".
3. `aboutThisBook` pins: "no word was added", "small fixes", "original recording is kept unchanged", "Typed letters are exactly as they were typed".
4. Status lines never say arrives, coming, later in the, not open yet, or beta.
5. The site reference mentions no invite, grandparent, co-parent, backs up, sync, vault, cloud, gift or mixed languages.

These five fail on the old source and pass on the new (checked by stashing the source changes).

## Apply after #478 merges (`apps/web/src/content/site.ts`)

Key paths follow the object in `site.ts` on `main` (896101e2). #478 also reorders the language list against D-125 item 2; resolve that first.

| Key | Old | New |
|---|---|---|
| `comingSoon.trust` (74) | Your letters stay on your iPhone. Only the people you invite can see them. | Your letters and recordings stay on your iPhone. They are not sent to us. |
| `s09.points[0]` (208) | Only the people you invite can see your letters. | Your letters and recordings stay on your iPhone. They are not sent to us. |
| `s09.headline` (206) | For your family only. | Kept on your phone. |
| `s04.support` (151) | `${NAME}` takes out the ums and false starts and fixes a misheard name. It never adds a word. Every fix is marked and can be put back. | `${NAME}` takes out the ums and accidental repeats, and spells your names your way. It never adds a word. Every fix is marked and can be put back. |
| `s05.support` (161) | Every letter you speak keeps its recording. One day Meera can hear exactly how you sounded tonight. | Every letter you speak keeps its original recording, unchanged. One day Meera can hear exactly how you sounded tonight. |
| `s08.support` (189) | English first. Hindi, Spanish, Mandarin, French, Arabic and Portuguese follow, each once a native speaker has checked it. | English first. More languages follow one at a time, each after a native speaker has checked it. |
| `s08.lines` (194-203) | seven lines | English line only, until a native reviewer's name and date are on record (D-115). |
| `welcomeEmail.promises[1]` (292) | Each letter you speak keeps its recording. | Each letter you speak keeps its original recording, unchanged. |
| `welcomeEmail.promises[2]` (293) | Only the people you invite can see your letters. No ads, and we never sell your data. | Your letters and recordings stay on your iPhone. No ads, and we never sell your data. |
| `s09.points[4]` (212) | Delete any letter whenever you like. | Delete any letter whenever you like. It waits 30 days in Recently deleted, or you can erase it at once. (optional) |

Two tests may need a matching edit with these: the welcome email excerpt test (`welcome-email.test.ts`) and any e2e that reads the languages list. Those files are #478's.

## Held for a later release (wording removed from the first-build reference, not deleted from history)

- Family invites, grandparents, co-parent: after sign-in ships (D-126).
- Sync, "your next phone can read them", backup, recovery key, Vault: after servers (D-121, D-111).
- Mixed Hindi and English "in the same sentence", and every non-English language: after native review (D-115, D-125 item 2).
- The gift: held.
- "Private by design": held (CLO, counsel must confirm).

## FOUNDER list (each with a recommendation and a default)

1. **New public tagline** (Q6). Recommend the D-133 line or "It stays in your words." Default: keep "Exactly as you said it." held out of new copy; use the D-133 line in the store listing.
2. **Privacy page sentence about the remembered sound choice** (Q7). Recommend yes, one sentence (wording in Q7). Default: no change; the choice stays button-press only. Legal text is held by D-125, so I did not edit it.
3. **Legal text and terms against build 1.** Recommend counsel review the Privacy page and Terms before launch (the Privacy page describes the server product; build 1 has none). Default: leave as is.
4. **Pricing line on the site matches the App Store.** Recommend you check the three numbers in App Store Connect before launch. Default: leave the site as is, since it matches `pricing.ts` and D-082.
5. **Any "coming soon" promise in the store build.** Recommend none (D-126). Default: none.
6. **Publishing the six non-English sample lines.** Recommend hold until a native reviewer signs each one with name and date. Default: English line only.

## What could not be verified

- That the app, as built from the `production` profile, behaves as read from code (no device run). In particular export, Put it back after keeping, and the player.
- App Store Connect prices, storefront and listing text.
- Native-reviewer sign-offs for the non-English lines (none found in the repo).
- What the notify handler stores (IP, user agent) against "Your email address is all we ask for."
- Real email delivery and the unsubscribe route end to end.
- D-125 item 2's exact language order beyond what #478 contradicts.
- No independent challenge: self-challenged only.
