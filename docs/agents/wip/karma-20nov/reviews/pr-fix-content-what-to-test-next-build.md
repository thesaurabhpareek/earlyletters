## What and why

The "What to Test" text for the next servers-off TestFlight build (`whatToTest.build1`) and the Beta App Description no longer match the app or the claims rules. The CMO and the Chief AI Officer ruled on these edits on Mon 9 Nov 2026 (council answers, `cmo.md` section 1 and `caio.md` section 3). One concern: the words the founder pastes into App Store Connect.

Changed in `packages/content/src/release/testflight.en.ts` only (plus tests):

1. Book bullet names the Months list (CMO: `testflight.en.ts:67`).
2. New bullets for "Another thought" while starting a typed letter, and for the grouped Settings (Your words, App lock, Recently deleted).
3. The speech paragraph also says a lock for the book is offered at the end of setting up, on a phone with a passcode, and stays off until turned on.
4. The export sentence names the path as the app has it now: Settings, Your letters, Export your book.
5. One new plain line about the Erase row: removes every book, letter and recording from this phone, cannot be undone, save a copy first.
6. Beta App Description: "exactly as you said them" becomes "in your own words" (D-125 item 9, D-133; raw text is machine output until the English speech gate runs; CAIO risk 1).

Not used, on purpose: "We hold no copy", "Nothing is sent anywhere", "Your free letters start again", and the backups line stay on the Erase screen only (CCO-6, D-144; app only; free letters do not apply in alpha). The standing Plus line is unchanged and stays true: the standing Plus line never shows in alpha (`tonight-plus.logic.ts:46`).

### PROPOSED WORDING (the founder approves these by pasting them into App Store Connect)

Every changed or new line, exactly as it will read in the build 1 text:

- Changed bullet: `- The Book, the Months list, a letter on its own page, and Read together.`
- New bullet: `- "Another thought" under the question, when you start a typed letter.`
- New bullet: `- Settings, which is arranged in groups: Your words, App lock and Recently deleted.`
- Changed paragraph (the speech line, with the lock added; the other three sentences are as before, with "Not now" now tied to the download):
  `At the end of setting up, the app offers a one-time download on Wi-Fi so it can write down your words, and a lock for the book on a phone with a passcode. The lock stays off until you turn it on. If you tap "Not now" on the download, it asks again when words are waiting. Until the download finishes, your recordings are kept and the words follow.`
- Changed sentence: `... To keep a copy, use Settings, Your letters, Export your book.` (was `Settings, Export your book`)
- New paragraph, after the export one: `The Erase row, last in Settings, Your letters, removes every book, letter and recording from this phone. It cannot be undone, so save a copy first.`
- Beta App Description, second paragraph: `... kept as a letter, in your own words, with the recording beside it.` (was `exactly as you said them`)

### Read these before you paste

- **Build 1 only.** This text is for the servers-off profile (no account, Plus hidden). A production-profile TestFlight build has Plus on, so the Plus line and "your letters stay on this phone" are false there. It would need its own What to Test text, and this is not it. Which profile build 12 uses is still open (CMO: Karma names it).
- **How the Erase row is named.** The row's label is "Erase everything on this phone". `testflight.test.ts` (tester notice 5.2) bars the phrase "everything on this phone" from every tester text, because feedback and crash reports do leave the phone. I fixed the copy, not the test: the line names the row by its place ("The Erase row, last in Settings, Your letters"). Say so if you would rather name the full label; that needs a counsel-approved change to the 5.2 guard first.
- **The Months list** is the "Months" button in the Book. It appears once the book spans more than one month, so a new tester will not see it on day one.
- **"Another thought"** shows only while the typed page is empty and the letter opened from a question; it fades at the first character.
- **The lock offer** is hidden on a phone with no passcode, so the text says "on a phone with a passcode".
- No change to the invitations, build 2 texts, `withoutSpeech` or the feedback block.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What I ran: `npx vitest run` in `packages/content`: 15 files, 373 tests pass, including `testflight.test.ts` (30 tests) and `rules.test.ts`. `npx tsc --noEmit` in `packages/content`: clean. Not run: root `npm test`, `npm run test:db`, the mobile typecheck (no mobile or database file changed).

New describe block in `testflight.test.ts`, "[CMO 9 Nov]": six tests. Reverting only `testflight.en.ts` to `origin/develop` and keeping the new tests: 5 of the 30 fail (Months list and Settings labels, lock offer, export path, Erase line, "exactly as you said" in the description); the sixth (the four D-144 Erase lines never appear outside the Erase screen) passes on both, because the old text never had them. With the change: 30 of 30 pass. The new tests read the Settings labels from `en` (`settingsHome.yourWords`, `settingsHome.sections.letters`, `settingsHome.exportLabel`, `settings.delete.recentlyDeleted`, `tonight.newPromptButton`), so a rename in the app fails here. They pin a few claims, not whole sentences.

Added lines checked for bytes at 0x80 or above: none. File overlap with the first 100 open PRs (checked by file list): none (only #698 touches `preflight-testflight.mjs` and #609 a run sheet).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable: no engine change)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (not applicable)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (not applicable: none)
- [x] The public product name comes only from `packages/brand`

Device test plan: no step added. The text lives in App Store Connect and TestFlight, not on a screen of the app. What only a phone can show: that each named row and control is where the text says it is (Months button, "Another thought" on a new typed letter, Settings groups, the lock offer at the end of setting up, Erase last in Your letters). Worth one read of the pasted text against build 12 on the SE 3 before it goes out.

## Screenshots

n/a (no app screen changes)

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
