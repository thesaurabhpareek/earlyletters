## What and why

The "What to Test" text for the next servers-off TestFlight build (`whatToTest.build1`) and the Beta App Description no longer match the app or the claims rules. The CMO and the Chief AI Officer ruled on these edits on Mon 9 Nov 2026 (council answers, `cmo.md` section 1 and `caio.md` section 3). One concern: the words the founder pastes into App Store Connect.

Changed in `packages/content/src/release/testflight.en.ts` (plus tests: `packages/content/test/testflight.test.ts` and, after review, `apps/mobile/test/what-to-test-labels.test.ts`). No app source changed:

1. Book bullet names the Months button and the condition under which it shows: once the book has letters in two months (CMO: `testflight.en.ts:67`; the condition is from review).
2. New bullets for "Another thought" while starting a typed letter, and for Settings (Your words under Writing, App lock under Privacy and security, Recently deleted under Your letters; they are rows, not groups).
3. The speech paragraph also says a lock for the book is offered at the end of setting up, on a phone with a passcode, stays off until turned on, and where the App lock row is for a phone that installed over an earlier build (the offer is on first setup only). Split into shorter sentences.
4. The export sentence names the path as the app has it now: Settings, Your letters, Export your book.
5. One new plain line about the Erase row: removes every book, letter and recording from this phone, cannot be undone, save a copy first.
6. Beta App Description: "exactly as you said them" becomes "in your own words" (D-125 item 9, D-133; raw text is machine output until the English speech gate runs; CAIO risk 1).

Not used, on purpose: "We hold no copy", "Nothing is sent anywhere", "Your free letters start again", and the backups line stay on the Erase screen only (CCO-6, D-144; app only; free letters do not apply in alpha). The standing Plus line is unchanged and stays true: the standing Plus line never shows in alpha (`tonight-plus.logic.ts:46`).

### PROPOSED WORDING (the founder approves these by pasting them into App Store Connect)

**Revised after two CHANGES reviews (10 Nov 2026).** The founder approved the first wording in chat on 9 Nov 2026. Both reviews found one line in it false (Your words, App lock and Recently deleted are rows in Settings, not groups) and others that would send a tester looking for something they cannot see. The lines below are the revised ones; the changed lines are marked. He sees the final text again when he pastes it.

Every changed or new line, exactly as it will read in the build 1 text:

- Changed bullet: `- The Book, a letter on its own page, and Read together. Once the book has letters in two months, the "Months" button opens a list of them.` (**revised**: the Months button shows only once the book has letters in two months)
- New bullet: `- "Another thought" under the question, when you start a typed letter.`
- New bullet (**revised**, was "Settings, which is arranged in groups: ..."): `- Settings: Your words under Writing, App lock under Privacy and security, and Recently deleted under Your letters.`
- Changed paragraph (**revised**: shorter sentences, and where the App lock row is, because the offer is on first setup only): `At the end of setting up, the app offers a one-time download on Wi-Fi so it can write down your words. On a phone with a passcode it also offers a lock for the book. The lock stays off until you turn it on, at the offer or later in Settings, Privacy and security, App lock. If you tap "Not now" on the download, it asks again when words are waiting. Until the download finishes, your recordings are kept and the words follow.`
- Changed sentence: `... To keep a copy, use Settings, Your letters, Export your book.` (was `Settings, Export your book`)
- New paragraph, after the export one (**revised**: "the last row of Your letters in Settings"): `The Erase row, the last row of Your letters in Settings, removes every book, letter and recording from this phone. It cannot be undone, so save a copy first.`
- Beta App Description, second paragraph: `... kept as a letter, in your own words, with the recording beside it.` (was `exactly as you said them`)

### Read these before you paste

- **Build 1 only.** This text is for the servers-off profile (no account, Plus hidden). A production-profile TestFlight build has Plus on, so the Plus line and "your letters stay on this phone" are false there. It would need its own What to Test text, and this is not it. Karma names the profile: the next TestFlight alpha is the `testflight` profile (servers off), which this text is for.
- **Erase row caveat (from review).** The row shows only on a phone that never signed in. The `testflight` and servers-on `preview` profiles share one bundle id, so a phone that signed in on a servers-on build has no Erase row until it is reset. Not verified whether any tester signed in on a preview build.
- **How the Erase row is named.** The row's label is "Erase everything on this phone". `testflight.test.ts` (tester notice 5.2) bars the phrase "everything on this phone" from every tester text, because feedback and crash reports do leave the phone. I fixed the copy, not the test: the line names the row by its place ("The Erase row, the last row of Your letters in Settings"). Say so if you would rather name the full label; that needs a counsel-approved change to the 5.2 guard first.
- **The Months button** is in the Book and shows once the book has letters in two months (`MONTHS_BUTTON_MIN_ROWS` is 2), so the text says so; a new tester will not see it on day one.
- **"Another thought"** shows only while the typed page is empty and the letter opened from a question; it fades at the first character.
- **The lock offer** is hidden on a phone with no passcode, so the text says "on a phone with a passcode".
- No change to the invitations, build 2 texts (build 2 still says "Settings, Export your book"), `withoutSpeech` or the feedback block.

### When you paste (from Review B)

- Nothing in the repo sends this text: `testflight.yml` runs `eas build` with no `--what-to-test`, so you paste it by hand into App Store Connect.
- Every build goes to the Family group automatically on submit with no What to Test attached (`docs/release/TESTFLIGHT.md` line 65, since 8 Nov). Paste as soon as the build finishes processing and before you tell testers. Whether Apple notifies testers when a build is added to a group is not verified.
- Replace `{feedbackEmail}`, which appears twice in the build 1 text. The rendered build 1 text is 2,789 characters (cap 4,000) and the description 682.
- Paste build 1 only for the `testflight` profile.

### The Erase line and your approval

You approved the first wording in chat on 9 Nov 2026 (Pacific). The Erase sentence is tester text only. It paraphrases the first clause of the Erase screen's `body` line (D-144) without "We hold no copy", and the CMO's guidance (council note, outside the repo) was to add one plain line and not reuse the four D-144 lines; the CMO's own wording uses the full row label, which the 5.2 guard bars, so the line names the row by its place instead. D-144's open question about those four lines stays open. The revised sentence differs from the one you approved only in "the last row of Your letters in Settings"; you will read it again when you paste.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What I ran: `npx vitest run` in `packages/content`: 15 files, 374 tests pass, including `testflight.test.ts` (31 tests) and `rules.test.ts`; `npx vitest run test/what-to-test-labels.test.ts` in `apps/mobile`: 2 of 2. `npx tsc --noEmit` in `packages/content`: clean; in `apps/mobile`: clean in this worktree. Not run: root `npm test`, `npm run test:db`.

New describe block in `testflight.test.ts`, "[CMO 9 Nov]": seven tests. Reverting only `testflight.en.ts` to `origin/develop` and keeping the new tests: 6 of the 31 fail; the D-144 test (the four Erase-screen lines never appear outside that screen) passes on both, because the old text never had them. With the change: 31 of 31 pass. The content tests read the Settings labels and group titles from `en` (`settingsHome.yourWords`, `settingsHome.sections.*`, `settingsHome.exportLabel`, `settings.delete.recentlyDeleted`, `tonight.newPromptButton`) and assert each row sits under the group that holds it, and that none of the three rows is itself a group title. The Months button and the App lock row are labelled in the app, not in `en`, so the new mobile test covers those. After review: a small mobile test (`apps/mobile/test/what-to-test-labels.test.ts`) reads the build 1 text against `bookCopy.monthsButton` and `appLockCopy.settingsHome.appLock`, which live in the app, so a rename there fails. Reverting only `testflight.en.ts` to the first wording (b681a5d3) fails 4 of the content tests and both mobile ones (Review A of this PR ran it).

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

---
_Generated by [Claude Code](https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF)_


