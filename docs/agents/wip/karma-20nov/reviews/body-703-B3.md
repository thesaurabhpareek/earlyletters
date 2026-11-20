## Update 10 Nov (review fixes)

This replaces the earlier description, which was stale (it said the branch was stacked on #701, promised an `evening[5]` change and a `fill()` capital that the head did not have, and said "seven visible strings"). Two reviews of the previous head both asked for changes; this is what the branch does now. It has develop merged in (d1641686, which holds #716, #722, #735 and #793), no conflicts. It is marked ready for review.

**What the head changes, in words a person can read** (against develop):

| Key | Develop says | Head says | Who sees it |
|---|---|---|---|
| prompt `opening.before.name` is retired, new `opening.before.name-story` | Where did the name {child} come from? Who said it out loud first? | Where did the name come from? Who said it out loud first? | a book made before the birth, named or not |
| prompt `together.37-60.older-self` is retired, new `together.37-60.hello-later` | Ask {child} to say hello to the {child} who reads this later. | Ask {child} to say hello to the grown-up who reads this later. | a book aged 37 to 60 months, named or not |
| `notifications.evening[2].title` | Dear {child}, | A letter for {child} | a named book only, on the lock screen, when Names in notifications is on |
| `notifications.birthday.title` | Happy birthday, {child} | Happy birthday to {child} | named and nameless, on the lock screen, when Names in notifications is on |

- **Needs the founder's word approval:** the two prompts, and the two notification titles as the decision below. **Needs counsel: none.** None of these keys is in REGISTERED, HELD or HELD_FOR_COUNSEL, and none touches a privacy, retention or deletion promise.
- Prompt keys are stable: the two old prompts are marked `retired` (so they are no longer offered) and the new ones carry the new words. `PROMPT_LIBRARY_VERSION` goes 4 to 5; it is only a route param. The pre-birth tests now count live prompts (`!p.retired`).
- **`evening[5].body` is not in this PR.** The line "One day {child} can hear how you sounded." is develop's own (from #768). The earlier description listed it by mistake.
- **`fill()` opening capital is restored** (`apps/mobile/src/lib/copy.ts`). The merge of develop had taken develop's `fill()`, which dropped it. With a blank name, a string whose template opens with `{child}` now starts "Your child's ...", as NX-36 S14 and S16 require. Without it 16 distinct sentences opened in lower case in the app: the Book tab title, the child page title, the Recently deleted card ("Your child's book"); "Your child's book is in Recently deleted." and "Your child's book is back."; "Your child's book is right here" (notification); "Your child's birthday"; "Your child's book stays with your co-parent. ..."; the six Delete account lines ("Your child's book stays with ..." and "Your child's book will be deleted ..."); and three family lines ("Your child's book has two parents.", "... is on its way to this phone.", "... has not reached this phone yet.") plus "Your child's book and every letter in it stay on this phone." Only the template decides: text that merely begins with the same words, or a typed name that is literally "your child", is left as written. Named books are unchanged ("Asha's book").
  - Two develop pins go the other way and say why in a comment: `first-run-child-name.test.ts` (Book title) and its account-deletion lines now expect "Your child's book". The three tests for the capital that the merge had deleted are back.
  - `packages/content/test/nameless-child.test.ts` now renders every `{child}` string through the app's own `fill()`; it no longer capitalises openings itself. A new test in it checks the capital arrives.
- **Dropped, because nothing reads them:** `onboarding.nameCheck.title`, `onboarding.nameCheck.doneBody` and `settings.plan.familySharingHelp` are back to develop's words (grep of `apps/` and `packages/` at the head finds no reader; the name check card is not built, and the Plus screen reads `billingCopy.plan`). Two of them still read oddly with a blank name ("Say your child's name three times", "Plus is shared ... your child's other parent gets it too"). The content test skips exactly those two, and only while no file in `apps/mobile/src` mentions their key: the day a screen reads one, the skip ends and the test fails, so the sentence gets fixed first. `doneBody` ("Your child will be spelled your way in every letter.") is not flagged by the checks; it is for whoever builds the card. This takes three words off the founder's list.
- `apps/mobile/test/sync-nameless-book.test.ts` (from the earlier commit) is test only, Asha only; it pins that a nameless book is sent as an empty name with its date.
- Device plan: S1-191 step (e) no longer quotes prompt text this PR changes; it names `opening.0-3.name`, `opening.before.name-story` and `together.37-60.hello-later`. New row (i) reads the capital on the Book tab title, the book's own page title, the delete and restore lines and the Recently deleted card.

**Decision for the founder: the two notification titles.** `evening[2].title` and `birthday.title` change the lock-screen text that every NAMED family sees when "Names in notifications" is on (a row in Settings, Reminders, and shown on Privacy), in every build, including the servers-off alpha. The setting is off by default.
- `evening[2]`: "Dear Asha," becomes "A letter for Asha". A nameless book never reaches this string (a blank name uses the neutral evening lines, `planner.ts` `eveningCopy`), so this is a wording change for named families with no benefit to the nameless case.
- `birthday`: "Happy birthday, Asha" becomes "Happy birthday to Asha". A nameless book can reach this one (the planner fills it with "your child"), where the old title read "Happy birthday, your child", so this one has a reason. It also moves the greeting from the child to the parent.
- Options: keep both; keep `birthday` and put `evening[2]` back to "Dear {child},"; or put both back (the nameless birthday note then reads "Happy birthday, your child"). I lean to the second, because only `birthday` helps a nameless book, but it is the founder's call.

## What and why

NX-31 R3, content side. When a first book has no name, the app says "your child" (`onboarding.childFallback`). A few words read wrongly with it ("Dear your child,", "Happy birthday, your child", "the your child who reads this later", a lowercase "your child" opening a sentence). They now read naturally with a name and without one. The first-book work itself is in #701 (merged); the screens are in #716 (merged).

How every `{child}` string is checked: `packages/content/test/nameless-child.test.ts` renders every `{child}` string in the package through the app's `fill()` with a blank name and fails on the known bad readings (the list is in the test). It is red on develop's old words and green on the head.

## How it was checked

Run in a worktree on the head, develop merged:

- packages/content vitest in full: 17 files, 387 tests pass. `npx tsc --noEmit` in packages/content passes.
- apps/mobile related files: `first-run-child-name` (22), `nameless-surfaces` (22), `draft-card` (63), `sync-nameless-book` (2), the reminders planner, inline, switch and erase tests, and the remote `content.test.ts`: 185 pass.
- Whole apps/mobile suite: 237 files and 4542 tests pass; 8 files and 72 tests fail, the same 8 environment files and the same 72 tests that fail on plain develop (config, privacy-manifest, store-sign-in-capabilities, licences, preflight-production, hosting-ios17, capabilities, app-lock-wiring; they need native modules and config the sandbox does not have).
- packages/core: 34 files, 1237 tests pass.
- `npx tsc --noEmit` in apps/mobile: only the known sandbox errors (expo-clipboard and expo-local-authentication are not installed here, and the three that follow from them in `app-lock/controller.ts`).
- Mutations: with `fill()`'s capital branch removed, `nameless-child.test.ts` fails 2 tests (16 sentences open in lower case) and `first-run-child-name.test.ts` fails 3; both pass with it restored. With a file in `apps/mobile/src` that mentions `nameCheck`, the content test fails and says the string is now read by a screen.
- Added lines contain no byte at or above 0x80: no em or en dash, curly quote, ellipsis character or emoji.
- Not run: `npm run test:db` (no database change), the other workspaces' tests (api, analytics, emails, design-tokens, experiments, brand), and any device. Notification text on a real lock screen and the capital on a real phone are not verified; S1-191 (e) and (i) are the device steps.

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments): content, core and mobile were run as listed above; the other workspaces were not
- [ ] `npm run test:db` passes: not run, no database change
- [ ] `npm run typecheck` passes, including `apps/mobile`: only the known sandbox errors remain
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

n/a (words only; the device steps are S1-191 (e) and (i)).

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

---
_Generated by [Claude Code](https://claude.ai/code)_
