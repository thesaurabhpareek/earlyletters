# BL-373 free letters: check against the Done-when

- Date: 27 Nov 2026
- Read at: `develop` 505bafde2b5a98bd351a195a6d48d334ed969b50
- Row: `docs/BACKLOG.md` BL-373 (D-051 in the row; D-082, D-083 and D-103 in `docs/DECISIONS.md` are the decisions that stand).
- Statuses: proven (code plus a passing test run for this check), present but untested, partly, missing.
- What was run: `packages/core` `npx vitest run` (56 files, 1643 tests, all pass; the plan tests are 2 files, 80 tests); `packages/analytics` `npx vitest run` (33 files, 586 tests, all pass); in `apps/mobile`, 21 billing, gate and Keep test files with `npx vitest run` (817 tests, all pass, 520 of them in `test/bl373-done-when.test.ts`, and the new case below); `apps/mobile` `npx tsc --noEmit` (no errors).
- What was read and not run: every e2e-web flow named here (no browser in this workspace); the React Native screens (`review.tsx`, `plus-gate.tsx`), which Node cannot load, so their wiring is held by source-text tests; nothing ran on a phone or in the store build.
- Test setup note: in this worktree `node_modules` is a link to another checkout, so `@scribe/core` in the mobile tests resolves to that checkout's `packages/core`. It is at the same sha and its `packages/` matched this worktree file for file, so the results stand, but a change to `packages/core` here does not reach the mobile tests. The mutation checks below were made in files the tests do reach.

## Done-when clauses

| Clause | Status | Evidence (code) | Test, run? |
|---|---|---|---|
| With 2 saved letters, saving the 3rd shows the Plus sheet | proven | `apps/mobile/src/app/review.tsx:609` (keepNeedsPlus), `:650` (return before the write), `:895` (PlusGate on an offer); `apps/mobile/src/lib/billing/keep-step.ts:23`; `apps/mobile/src/lib/billing/gates.ts:110`; `packages/core/src/plan.ts:193` | `apps/mobile/test/keep-step.test.ts:77`, `test/review-keep-m17.test.ts:121`, `test/review-keep-from-write.test.ts:155`, `test/billing-plan.test.ts:321`, `packages/core/test/plan.test.ts:127`; run, pass |
| and keeps the typed or recorded letter on the phone | proven | `review.tsx:652` (draft untouched), `review.tsx:911` (holdDraft on Keep it here for now) | spoken: `test/review-keep-m17.test.ts:121`; typed: `test/review-keep-from-write.test.ts:155`, `:181`; held row: `test/plus-gate.test.ts:313`; relaunch: `test/billing-ledger.test.ts:355`; run, pass |
| once Plus starts the held letter saves | proven, on the person's Keep tap | `apps/mobile/src/components/child/plus-gate.tsx:113` (carryOn calls onPlus once Plus is on); `review.tsx:916` closes the sheet and the person taps Keep (D-083: "After Plus starts, the person taps Keep on each held letter") | `test/review-keep-m17.test.ts:121` and `:174`, `test/billing-ledger.test.ts:371`, `test/review-keep-from-write.test.ts:167`; run, pass. Nothing saves on its own when Plus starts. |
| A lapsed member can read, play and export every letter | proven | read, play and export surfaces never import the gate or read the plan; `apps/mobile/src/lib/export/device.ts:167` uses hasPlus only as a label | `apps/mobile/test/bl373-done-when.test.ts:110` (source scan of every surface, 520 cases); new `test/keep-step.test.ts` lapsed case (every kept letter still listed); run, pass. Not run on a phone or web. |
| and cannot add one | proven | `packages/core/src/plan.ts:185` (LAPSED_STATES), `:198` | `packages/core/test/plan.test.ts:145`, `test/billing-plan.test.ts:332`, new `test/keep-step.test.ts` lapsed case through the real gate and ledger; run, pass |
| The allowance is read from one constant | proven, with one pinned copy | `packages/core/src/plan.ts:68` (DEFAULT_FREE_LETTERS), `:149` (freeLettersFrom), `gates.ts:67`; a second constant `packages/api/src/remote-config.ts:36` (BUNDLED_FREE_LETTERS) | `test/bl373-done-when.test.ts:48` (no other number compared with the allowance; the api copy pinned equal at `:103`); run, pass |
| A unit test proves `decide()` never gates read, play or export | proven | `packages/core/src/plan.ts:36` (FreeForever), `:51` (compile-time no-overlap), `:213` (decide throws for anything not gated) | `packages/core/test/plan.test.ts:202`; run, pass; mutation check below |
| New analytics events pass the allowlist test | proven | `packages/analytics/src/registry.ts:213`, `:223`, `:233`, `:243` (allowance_reach, keep_gate_view, letter_hold_create, keep_gate_plan_start: bounded integers only); the mobile `track()` is typed to registered names | `packages/analytics/test/registry-data.test.ts:59` and the rest of the analytics suite; `apps/mobile` typecheck; run, pass |

## Scope items

| Scope item | Status | Evidence (code) | Test, run? |
|---|---|---|---|
| A quiet free-letters counter | partly | the count is the ledger (`apps/mobile/src/lib/billing/letter-ledger.ts`, Keychain and database); on screen there is no number, only the Tonight line once the free letters are used (`apps/mobile/src/components/tonight/tonight-plus.logic.ts:45`) | `test/billing-ledger.test.ts`, `test/billing-ledger.max-rule.test.ts`, `test/tonight-plus.test.ts:40`; run, pass. No visible count exists, by the content rules. |
| The gate on letter creation uses `decide()` | partly | the Keep gate uses `decideKeepLetter` (`gates.ts:118`), the sibling in `plan.ts:193`; `decide()` throws for keep_letter (`plan.ts:213`) | `packages/core/test/plan.test.ts:115`, `test/review-keep-m17.test.ts:210`; run, pass |
| Reads, playback and export never consult entitlement | proven | as the lapsed row above | `test/bl373-done-when.test.ts:110`; run, pass |
| The held letter is never discarded | proven | `review.tsx:652`, `:911`; `plus-gate.tsx` onDismiss holds and keeps nothing | `test/plus-gate.test.ts:313`, `:346`, `test/billing-keep-gate-plan-read.test.ts:80`, `test/review-keep-m17.test.ts:174`; run, pass |
| A lapsed-member state | proven | `packages/core/src/plan.ts:182`; sheet wording `apps/mobile/src/components/child/plus-gate.logic.ts:98`; Plan row `apps/mobile/src/components/settings/plan.logic.ts:85` | `test/plus-gate.test.ts:47`, `test/tonight-plus.test.ts:46`, `test/settings-plan-rows.test.ts`; run, pass |
| The allowance as one config constant (default 2) | proven | as the constant row above; alpha builds raise it to MAX_FREE_LETTERS through the same path (`apps/mobile/src/lib/billing/alpha.ts:35`, `apps/mobile/src/app/_layout.tsx:109`) | `packages/core/test/plan.test.ts:135`, `test/billing-alpha.test.ts:139`, `:160`; run, pass |
| A quiet one-time line after the second letter | proven | `keep-step.ts:40` (countAfterSave, only at the default allowance); `apps/mobile/src/app/(tabs)/book.tsx:235` (toast); copy `packages/content/src/features/billing.en.ts:68` | `test/keep-step.test.ts:103` (once), `test/billing-alpha.test.ts:139`; run, pass |
| A "Plus" tag on Add a child in the Whose book sheet | missing, and superseded | `apps/mobile/src/components/child/whose-book-sheet.tsx` lists books only, no Add a child row and no tag; D-083 says a second child needs no extra gate | none; `apps/mobile/e2e-web/j03-children.flow.ts:51` states "Another book is free" (read, not run) |
| New events content-free and on the allowlist | proven | as the analytics row above; `keep-step.ts:31`, `:45` send numbers only | `test/keep-step.test.ts:77`, `:103`; analytics suite; run, pass |

## Journeys named in the row (read, not run)

- J12 (`apps/mobile/e2e-web/j12-plus.flow.ts`): one test, the Plan screen on a Free book and Restore purchases. There is no "third letter" step in this file.
- The third letter is covered instead by J07d (`apps/mobile/e2e-web/j07-typed.flow.ts:61`, store build: two kept, the second-free toast, the third opens the sheet and is held) and J06e (`apps/mobile/e2e-web/j06-review.flow.ts:75`, store build: the sheet, then Keep it here for now and the card on Home). J04f (`apps/mobile/e2e-web/j04-tonight.flow.ts:92`) shows the held letter on Home.
- J03-08: no e2e-web step carries this id. The nearest is the "Another book is free" step in `apps/mobile/e2e-web/j03-children.flow.ts:51`.
- No journey shows a lapsed member (the web build has no StoreKit, so Plus cannot start or end there).

## Added for this check

- `apps/mobile/test/keep-step.test.ts`: "[BL-373, D-082] a lapsed member keeps every letter and cannot add one". Three letters kept under Plus, then Plus ends: the Keep sheet answers with the lapsed wording, `plus:keep_gate_view` carries `lapsed: 1`, and all three letters are still in the store.
- Mutation checks, each restored after: (1) the gate reads the plan as `none` (`gates.ts:118`): the new case fails; (2) Keep goes ahead for a lapsed member (`keep-step.ts:27`): the new case fails; (3) `decide()` no longer throws for features outside the gate list (`plan.ts:213`): `packages/core/test/plan.test.ts:202` and `:215` fail.

## Gaps

- Name `decideKeepLetter` in BL-373 where it says `decide()`: the Keep gate uses `decideKeepLetter`, and `decide()` refuses keep_letter by design.
- Drop the "Plus" tag on Add a child from BL-373, or reopen D-083: starting another book is free, so the tag would sell a gate that does not exist.
- Point BL-373's Test line at J07d and J06e for the third letter, or add a "third letter" step to J12; J12 has none today (store-build flows are touched by BL-2009, BL-2162 and BL-2243).
- Say what J03-08 is in the e2e-web flows: no step carries that id.
- Say in BL-373 that "once Plus starts the held letter saves" means on the person's Keep tap (D-083), so a later check does not look for an automatic save.
- Say in BL-373 that the free-letters counter is the ledger and the Tonight line, with no number on screen, or decide a visible counter that the content rules allow.
- Read the free-letter default from packages/core in packages/api, so `BUNDLED_FREE_LETTERS` stops being a second copy (today a test pins the two equal).
- Run the third-letter, held-letter and lapsed paths in the store build on a phone: nothing here ran on a device.
