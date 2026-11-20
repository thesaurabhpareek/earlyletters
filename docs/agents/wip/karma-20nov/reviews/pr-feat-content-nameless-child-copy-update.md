## Update 10 Nov (review fixes, round two)

This replaces the earlier descriptions, which no longer match the branch. Two rounds of review agreed on a smaller PR, and the branch is now that PR. It has develop merged in (d1641686, which holds #716, #722, #735 and #793), with no conflicts.

**What a person can see change**

| Where | Develop says | This branch says | Who sees it |
|---|---|---|---|
| lock-screen note on a birthday (`notifications.birthday.title`) | Happy birthday, {child} | Happy birthday to {child} | every family that turns on "Names in notifications" (off by default), named or not |
| 16 sentences that open with the child's name (list below) | "your child's book ..." | "Your child's book ..." | a book made without a name, on its screens |

- **One sentence changes for named families:** the birthday title, and only on the lock screen with "Names in notifications" on. "Happy birthday, Asha" becomes "Happy birthday to Asha". It is in every build, including the servers-off alpha. A nameless book can reach this title (the planner fills it with "your child"), where the old words read "Happy birthday, your child". It moves the greeting from the child to the parent. **This is the only change that needs the founder's word approval.**
- **The capital changes nothing for a named book** (`Asha's book` is as it was). For a nameless book, `fill()` in `apps/mobile/src/lib/copy.ts` starts a string that opens with `{child}` with a capital, as NX-36 S14 and S16 require. The 16 sentences: "Your child's book" (the Book tab title, the book's own page title and the Recently deleted card share this text); "Your child's book is right here" (notification); "Your child's birthday"; "Your child's book stays with your co-parent. Your own letters and recordings in it will be removed."; "Your child's book is in Recently deleted."; "Your child's book is back."; the six Delete account lines ("Your child's book stays with ..." and "Your child's book will be deleted ..."); "Your child's book has two parents."; "Your child's book is on its way to this phone."; "Your child's book has not reached this phone yet."; "Your child's book and every letter in it stay on this phone." The merge of develop had taken develop's `fill()` and lost the capital; it is back, with its three tests, and the two develop pins it changes (the Book title and the account-deletion lines in `first-run-child-name.test.ts`) now expect the capital, each with a comment saying why. Only the template decides: text that merely begins with the same words, or a typed name that is literally "your child", is left as written.
- **Needs counsel: none.** No key here is in REGISTERED, HELD, CONSENT_NEVER or HELD_FOR_COUNSEL, and nothing touches a privacy, retention or deletion promise.
- **`notifications.evening[5].body` is not in this PR.** "One day {child} can hear how you sounded." is develop's own, from #768.

**What was taken out, and why** (two rounds of review, one reason each)
- `notifications.evening[2].title` ("Dear {child}," to "A letter for {child}") is back to develop's words. A book with no name is given the neutral evening lines (`planner.ts` `eveningCopy`), so the string never reaches it; the change only altered what named families see.
- The two reworded prompts are back to develop's text and keys: `opening.before.name` (the retired twin `name-story` and the new key are gone) and `together.37-60.older-self` (and `hello-later`). Since #716, a nameless book is never given a prompt about the name (`isNameThemed` in core), so the reword only took the name out of a named book's question. And `tonightPromptInput` always sets `together: false` (with `hardStretch: false`, `role: 'parent'`), so no screen can draw a `together.*` prompt at all: that was dead copy. `PROMPT_LIBRARY_VERSION` is back to 4 and the pre-birth tests are as develop has them.
- `onboarding.nameCheck.title`, `onboarding.nameCheck.doneBody` and `settings.plan.familySharingHelp` are develop's words: no screen reads them (the name check card is not built; the Plus screen reads `billingCopy.plan`).

**How the content test now stays honest** (`packages/content/test/nameless-child.test.ts`)
It renders every `{child}` string a nameless book can be shown, through the app's own `fill()`, and no longer capitalises anything itself. Words that cannot reach such a book are left out, and each exclusion is pinned by a test of the behaviour that keeps it out:
- the evening notifications that carry `{child}`: `first-run-child-name.test.ts`, "evening notes with names on draw only the neutral lines for a book with no name" (all eight neutral lines come up, never "your child", with Names on and off; beside a named book the named lines are that book's);
- prompts about the name: selection skips them for a blank name via `isNameThemed` from core (the filter is #716's, pinned in `nameless-surfaces.test.ts`; the content test uses the same function);
- prompts of a kind no screen asks for: `nameless-surfaces.test.ts`, "no screen asks for a hard, together or family prompt" (the flags are always `hardStretch: false`, `role: 'parent'`, `together: false`; real draws on Tonight and Another thought only ever return openings and gap prompts; and every `selectPrompt` call in the app goes through `tonightPromptInput`);
- the two words no screen reads yet (`nameCheck.title` and `familySharingHelp`, which would read "Say your child's name three times" and a lowercase "your child's other parent"): skipped only while no file in `apps/mobile/src` mentions their key. The day one does, the skip ends and the test fails, so the sentence is fixed first. `nameCheck.doneBody` ("Your child will be spelled your way in every letter.") is not flagged by the checks; it is for whoever builds the card.

**Device plan.** S1-191 step (e) keeps only checks that can fail: `opening.0-3.name` on the two-month book, and `opening.before.name` on the expecting book in step (h). New row (i) reads the capital on the Book tab title, the book's own page title, the delete and restore lines and the Recently deleted card, and says not to quit the app between deleting and restoring (it is the only book; see S1-153 (a)).

## What and why

NX-31 R3, content side. When a first book has no name, the app says "your child" (`onboarding.childFallback`). Two things read wrongly with it: a sentence opening with the fallback in lower case ("your child's book ..."), and the birthday note ("Happy birthday, your child"). This fixes both and makes the content test render what a nameless book can really be shown. The first-book work is in #701 and the nameless screens in #716, both merged.

## How it was checked

Run in a worktree on the head, develop merged:

- packages/content vitest in full: 17 files, 388 tests pass. `npx tsc --noEmit` in packages/content passes.
- apps/mobile related files (`first-run-child-name`, `nameless-surfaces`, `draft-card`, `sync-nameless-book`, the reminders planner, inline, switch and erase tests, the remote `content.test.ts`): 9 files, 189 tests pass.
- Whole apps/mobile suite: 237 files and 4546 tests pass; 8 files and 72 tests fail, the same 8 environment files and 72 tests that fail on plain develop (config, privacy-manifest, store-sign-in-capabilities, licences, preflight-production, hosting-ios17, capabilities, app-lock-wiring; they need native modules and config the sandbox does not have). I ran those 8 files on plain develop myself (72 fail there too); a reviewer counted 4537 passing on plain develop in all, and the 9 more here are this PR's new tests.
- packages/core: 34 files, 1237 tests pass.
- `npx tsc --noEmit` in apps/mobile: only the known sandbox errors (expo-clipboard and expo-local-authentication are not installed here, and the three that follow from them in `app-lock/controller.ts`).
- Mutations (each turned the new tests red, then was put back): develop's `fill()` without the capital (content: 2 tests fail on 16 sentences; mobile `first-run-child-name`: 3 fail); the planner drawing the named evening lines for a blank name (the evening test fails); `tonightPromptInput` asking for `together: true` (3 `nameless-surfaces` tests fail); a second file calling `selectPrompt` (the call-site test fails); each exclusion removed from the content test (evening, name theme, kind: the test goes red); a file mentioning `nameCheck` (the not-shown-yet guard fails).
- Added lines contain no byte at or above 0x80: no em or en dash, curly quote, ellipsis character or emoji.
- Not run: `npm run test:db` (no database change), the other workspaces' tests (api, analytics, emails, design-tokens, experiments, brand), and any device. The capital on a real phone and the lock-screen birthday title are not verified; S1-191 (e), (h) and (i) are the device steps.

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments): content, core and mobile were run as listed above; the other workspaces were not
- [ ] `npm run test:db` passes: not run, no database change
- [ ] `npm run typecheck` passes, including `apps/mobile`: only the known sandbox errors remain (expo-clipboard and expo-local-authentication are not installed here)
- [x] New or changed tests name the requirement or rule they prove (NX-31-R3, NX-36 S14 and S16); no test was deleted or skipped without a reason here (the three capital tests the merge deleted are back)

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [ ] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment: not applicable, cleaning is untouched
- [ ] Gates use `decide()` or `decideKeepLetter()`: not applicable, no gate is touched
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [ ] Database changes are a new migration file: not applicable, no database change
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a (words only; the device steps are S1-191 (e), (h) and (i)).

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
