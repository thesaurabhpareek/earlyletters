# Execution packets for the startable rows (8 Nov 2026)

Written by `product`, docs only, 8 Nov 2026 (UTC). It decides nothing and changes no row except as listed in section 0. Rows are in `docs/BACKLOG.md` (section "Next roadmap, confirmed 8 Nov 2026"); the working ids map to `F##-REQ` and BL ids in `docs/backlog/ID-MAP-NEXT-2026-11-08.md`.

Every path and function name below was read on `origin/develop` at db0a0b0d or on the named PR branch on 8 Nov. Anything I could not read is marked UNVERIFIED. No test was run by me; "fails on old code" is read from the PR body or the code, and says which.

## 0. Read this first

Corrections to my first pass on PR #684 (they are in this commit):
- BL-774 (catch-up letters) was marked `ready`. Backlog 08 rank 29 says Ready: No ("read the code first; requirement"). I changed it to `needs-decision`. It is not startable and has no packet (section 6).
- The `F##-REQ` numbers I could find in `docs/prd/v2/features` are now in the BACKLOG rows and the id map. NX-24's Refines cites F21-REQ-005 and F21-REQ-010; on develop those are category and age rating, and export compliance. The rating ask is F13-REQ-020 and F21-REQ-033.
- Follow-up for the roadmap PR (#664), not edited here: the headers of NX-15, NX-16, NX-17, NX-24 and NX-27 say "backlog rank 15, 16, 17, 24, 27"; those are the old numbers, the ranks in backlog 08 are 22, 18, 11, 28, 29. Open PRs #680 and #681 also use old numbers in their titles ("rank 18", "rank 22"); in backlog 08 they are rank 23 (BL-770) and rank 27 (BL-772).

Rules that apply to every packet:
- Claim check before the first edit: open `docs/agents/BOARD.md`, list open PRs touching your globs (`gh api repos/thesaurabhpareek/earlyletters/pulls?state=open --paginate` and read each `files` list), and add a claim line. If an open PR already touches the same file and does the same job, do not write a competing one: comment on that PR with what is missing, and take the next step. If it touches the same file for a different job, branch from develop, keep your diff to your own lines, and say in the PR body which PR you will rebase onto.
- Stacking rule used below: a branch cut from an open PR's branch is a stack. Its PR base is `develop` only after the lower PR has merged; until then the PR stays draft and says "stacked on #nnn (head sha)". If the lower PR is squash-merged, rebase with `git rebase --onto origin/develop <lower head sha>`.
- Mobile gates before any push: `npm test -w @scribe/mobile`, `npm test -w @scribe/content` when copy changes, `npm test -w @scribe/core` when core changes, `npm run typecheck`. One PR, one concern; under 400 lines and 20 files.
- Content rules (`packages/content/test/rules.test.ts`): no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never imply AI writes; `{child}` not a gendered word. Fictional family Asha only.
- Device rows already taken: S1-133 (#680), S1-134 (#670). Existing and usable: S1-39 (full disk, long take), S1-13, DL-01, DL-02, S1-47 (reminders without the sheet). New device rows take the next free `S1-nnn` after scanning open PR patches for `### S1-` (S1-135 looked free on 8 Nov; UNVERIFIED against every open PR).
- Analytics: nothing in these packets adds an event. `phone_full_shown` and `download_choice` are not in `packages/analytics/src/catalog.ts` on develop (searched 8 Nov); analytics are off in every build profile (D-124) and F11 is open. Adding an event is a separate task for `analytics` with `privacy` review.

## 1. Packet BL-764: Recording and Listen that behave (NX-06; backlog 08 rank 14)

Customer outcome: your recording is never lost, and a slow or full phone says so and keeps it.

Engineer: `mobile` (words by `content`, finish-failed screen read by `design-systems`). Reviewer: `red-team`, with `qa` for the device rows. Status in BACKLOG: ready.

### What exists, and what does not (exactly)

| Part | State on 8 Nov | Where |
|---|---|---|
| Slow save opens Review on the kept take, Review waits for the save (BL-563 acceptance 1; NX-06-R3 intent) | Built, in an open draft PR, not merged | #670, branch `fix/mobile-bl563-slow-save-review`, head df72953d35. New file `apps/mobile/src/components/capture/take-settle.logic.ts` (`afterFinish`, `settleTake`, `SETTLE_TIMEOUT_MS`); `listen.tsx`, `review.tsx`, `lib/capture/recorder.ts` (`settleTake`), `lib/transcription-queue/index.ts` (`sourceFor` skips a `recording` draft); test `apps/mobile/test/take-settle.test.ts`; device row S1-134. It replaces #615 and #618, both still open |
| Words for the phone-is-full state | Written, in an open draft PR, awaiting design-systems and founder approval of the words | #683, branch `feat/content-phone-full-finish-8nov`, head bb362de6d9. Keys `listen.phoneFull.title`, `.body`, `.keep` in `packages/content/src/strings.en.ts`; test `packages/content/test/listen-phone-full.test.ts`; keys registered under `ADDED` in `packages/content/test/support/copy-surfaces.ts` |
| Phone-is-full at start of a take | Built on develop | `errors.phoneFull` (strings.en.ts:1064), `mic-state.logic.ts:41`, `lib/capture/free-space.ts` (`MIN_FREE_BYTES_TO_RECORD` 50 MB, `roomToRecord`, `freeBytesFrom`) |
| **Phone-is-full screen at Finish with Keep (BL-563 acceptance 2; NX-06-R2; reserved BL-734)** | **NOT BUILT.** On develop and on #670, a save that throws goes through `finishWithin` (`listen.logic.ts`) to `{ ok: false, why: 'failed' }`, and Listen leaves (back or home) with no word said. S1-39 "Not covered" records the same gap. No code distinguishes a space failure from any other failure: no `ENOSPC`, "no space" or "disk full" handling exists in `apps/mobile/src` outside the pack engine tests (searched 8 Nov) | No row here: BL-734 is reserved in #638, its row and its blockers (words approved, screen drawn by design-systems) are there |
| Download choice sheet (NX-06-R5, F03-REQ-005, F04-REQ-044) | UNVERIFIED. I did not find a "wait or keep recording" sheet; `review.tsx` has `keepRecordingOnly` and `words-state.logic.ts` holds the waiting state, but I did not read whether a download choice is offered | read first (step 3) |
| First-run links with Back (NX-06-R7) | UNVERIFIED which two links the requirement means, and whether Back is already correct | read first (step 4) |
| Kill during save, 500 of 500 (NX-06-R1) | Test and harness exist: `apps/mobile/test/qa-kill-harness.test.ts`; simulator gate `apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl01` and `--mode dl02` (DEVICE_TEST_PLAN DL-01, DL-02, B2-11). The SE 3 run is the founder's. Whether the test title carries `[NX-06-R1]`: no | step 2 |

### Branch and steps (each one PR)

Branch names are suggestions; take one that matches `docs/DEVELOPMENT.md`.

1. Wait for #670 to merge (reviewer: `red-team`). If #670 is still open when you start, do steps 2 and 4 only, and comment on #670 asking for the brackets in step 1b. Do not open a third BL-563 PR. 
   - 1a. After #670 merges: PR `test/mobile-bl764-nx06-r3-brackets`, base develop. Add `[NX-06-R3] [F04-REQ-048]` beside the four `[BL-563]` titles in `apps/mobile/test/take-settle.test.ts` that cover "a timeout opens Review on the known draft". Bracket only, no behaviour change. (Alternative: ask the #670 author to add it before merge.)
2. PR `test/mobile-bl764-nx06-r1-bracket`: add `[NX-06-R1] [F04-REQ-048]` to the kill-during-save title(s) in `apps/mobile/test/qa-kill-harness.test.ts` (read the file to pick the right ones; UNVERIFIED which). Bracket only. Passes on old code by design; the 500-run proof is DL-01, DL-02 and B2-11, run by the founder on an SE 3.
3. PR `feat/mobile-bl764-download-choice` (NX-06-R5): read `apps/mobile/src/app/review.tsx` and `words-state.logic.ts` for the state "no verified model, take finished" (F04-REQ-044 path G). Write the unit test on the sheet state first. If the sheet exists, the PR is the test plus any gap; if not, it needs words from `content` first (keys not written; I do not invent them) and a drawing from `design-systems`. Until then this step is blocked on content.
4. PR `test/mobile-bl764-nx06-r7-back`: find the two first-run links (F03 first run; start with `apps/mobile/src/app/` onboarding and the legal links), write the test that Back returns to the same screen, 2 of 2 links. If it already passes on develop, record that in the PR and add only the bracket.
5. Not in a PR: R6 (date picker one-handed, evidence file) and R8 (user-research study) are founder and `user-research` rows. Add the device row for R5 (download choice on cellular) in the PR of step 3.

### Tests (exact titles) and which must fail on old code

| Title | Fails on old code? |
|---|---|
| `[NX-06-R3] [F04-REQ-048] a save over 3 s lands on Review with the draft id` | Yes on develop (the module `take-settle.logic` is absent). After #670 merges it passes; step 1a only adds the bracket |
| `[NX-06-R1] [F04-REQ-048] draft survives a kill during save, 500 of 500` | No (exists and passes). The 500 run is a harness and device run |
| `[NX-06-R5] sheet offers wait or keep recording and a letter can be saved` | Must fail first if the sheet does not exist (UNVERIFIED) |
| `[NX-06-R7] Back returns to the same screen, 2 of 2 links` | Must fail first, unless Back is already correct; then say so |

### Device rows

S1-134 (#670, slow save), S1-39 (full disk, long take, PR #595), S1-13 (kill during recording and save), DL-01, DL-02, B2-11 (kill-safety exit test). New rows, to be added by the step that needs them: download choice on cellular (R5); date picker one-handed (R6).

### Content keys

`listen.phoneFull.title`, `listen.phoneFull.body`, `listen.phoneFull.keep` (in #683, not on develop). Words are not approved yet. The download choice keys do not exist; `content` writes them under the content rules. Do not hardcode the public name.

### Analytics

Not allowlisted: `phone_full_shown`, `download_choice`. Add none in this row.

### Done when

Steps 1 to 4 merged or recorded as already true on develop; every title above passes; `npm test -w @scribe/mobile` and typecheck are green; B2-11 evidence from the founder's SE 3 is the exit test and is not an agent step.

### Blocks

BL-734 (the screen) needs the words approved and a drawing; the founder's SE 3 for DL-01, DL-02, S1-39, S1-134. Pick of #615 or #618 is moot: #670 replaces both (Karma closes them; not my call).

## 2. Packet BL-765: the #533 flake (NX-06-R9; backlog 08 rank 15)

SHELL ONLY. `qa` is reading what #533 is today. Everything marked UNKNOWN is to be filled by `qa` before an engineer starts; I did not guess it.

Customer outcome: updates never trip over your saved letters. Engineer: `mobile`. Reviewer: `data-steward`. Status in BACKLOG: ready (per backlog 08); this packet says it is not startable until the unknowns below are filled.

What #533 is, read on 8 Nov: an open ISSUE (not a PR), "Web journey J13: local_db_migration_failed under load (flaky)". One run of `CI=1 npm run e2e:web -w @scribe/mobile` on a shared 2-core container (load average 5 to 7) failed `[J13] reminders: off, on, how often` (`apps/mobile/e2e-web/j13-reminders.flow.ts`) with a page error `local_db_migration_failed:1`. That string is `MigrationError` in `apps/mobile/src/lib/db/migrations.ts` (class at line 399 on develop; also `apps/mobile/test/migrations.test.ts:130`, `migrations.v5.test.ts:93`, `store.facade.test.ts:83`). Run alone, J13 passed twice in 10 s and 25 s. The issue says what is not known: whether the web migration (expo-sqlite worker, OPFS) fails under CPU pressure or by a race at startup, and whether a phone can hit the same path.

Two findings that need a ruling before work starts:
- NX-06-R9 (the requirement row for this BL) says "mobile migration test on the year-5 fixture (`migrations.v9.test.ts` pattern), `[NX-06-R9] upgrade succeeds 20 of 20`". I found no year-5 fixture in `apps/mobile` or `packages` (searched `year-5`, `year5`, `year_5`, 8 Nov). `migrations.v9.test.ts` tests v8 to v9 on a Node database. That test shape does not reproduce a web, load-dependent flake. Backlog 08 also names "`04` R6" (the feasibility file) as the source, and the BL-765 row says reading NX-06-R9 as that row is mine.
- The issue says J13 is marked `test.fixme` in the web journeys CI job while it flakes, with the mark coming off when fixed. I searched `apps/mobile/e2e-web` and `.github/workflows` on develop and found no `fixme`; UNKNOWN whether the CI workflow PR landed.

Files (verified): `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/store.ts` (migration error path, comment at line 123), `apps/mobile/e2e-web/j13-reminders.flow.ts`, `apps/mobile/test/migrations*.test.ts`, `apps/mobile/test/helpers/node-db.ts`.

Branch: `fix/mobile-bl765-migration-flake` (suggested).

Steps (shell):
1. `qa` fills: current state of #533 (still open? still reproducible?), the CI job name, whether `test.fixme` is in place. UNKNOWN.
2. Reproduce: run J13 in a loop under CPU load (the issue's own recipe: `npx playwright test -c e2e-web/playwright.config.ts j13-reminders`, repeated, with a load generator). Record the failure rate. UNKNOWN until run.
3. Decide the target with `data-steward` and `qa`: a web-only readiness wait in the flow, or a fix in the migration path, or a phone-side repeat-run test. UNKNOWN; this is a decision I do not make.
4. Write the failing repeat-run test that exposes the flake (the title is the requirement's: `[NX-06-R9] upgrade succeeds 20 of 20`, but the fixture it names does not exist; `qa` says what it runs on).
5. Fix, then 20 of 20.

Tests: `[NX-06-R9] upgrade succeeds 20 of 20`, must fail on the tree with the flake (UNKNOWN how; step 2 decides). Device rows: none. Content keys: none. Analytics: none (a migration error code only; nothing with content).

Done when: UNKNOWN until step 3. A candidate, not a decision: the repeat-run test passes 20 of 20 under the same load that failed it, and the J13 `fixme` (if any) is removed.

Blocks: qa's read of #533 and the target decision. Claim check: any open PR touching `apps/mobile/src/lib/db/migrations.ts` or `e2e-web/**`; #533 is an issue so there is no PR to join.

## 3. Packet BL-770: Reminders that fit (NX-10; backlog 08 rank 23)

Customer outcome: a reminder helps, never says the same thing twice in a row, and then steps back.

Engineer: `mobile`. Reviewer: `principal-architect`. Status in BACKLOG: ready (local reminders only; back-off timing needs the founder's BL-534 call).

### What exists

- Planner: `apps/mobile/src/lib/reminders/planner.ts` (pure). `planReminders(input)` at line 288; `slotOrdinal(date, weekdays)` at line 212; `const VARIANTS = en.notifications.evening.length` at line 139; the variant choice at lines 357 to 358: `const ordinal = slotOrdinal(date, weekdays); const variant = ordinal % VARIANTS;`; `PlanInput` at line 77 (it already carries `lastSaveAt`). Callers: `apps/mobile/src/lib/reminders/scheduler.ts` (`intendedPlan`, line 118, builds the input; `rescheduleReminders`, line 175), `prefs.ts` (`readPrefs`, `writePrefs`, `lastOwnSaveAt`). Copy: `packages/content/src/features/reminders.en.ts` (`reminderCopy`, `neutral.evening`).
- Existing tests: `apps/mobile/test/reminders-planner.test.ts`, `reminders-switch.test.ts`, `reminders-inline.test.ts`.
- #680 (draft), branch `test/reminders-no-repeat`, head 4a74c4ef28: adds 10 tests `[NX-10-R2] 30 reminders in a row, across seasons ...` to `reminders-planner.test.ts` (5 cadences, names on and off; 150 days from 5 Oct, 15 Dec, 20 Feb) and device row S1-133. The rule already holds on develop, so these pass there; they bite (shifting the variant by one at the year boundary fails them, 11 failures). It changes no behaviour.
- Back-off (NX-10-R3, C-REQ-008): NOT BUILT. No back-off code or content keys on develop (searched `apps/mobile/src/lib/reminders` and `reminders.en.ts`, 8 Nov).
- Refused-notifications-asked-once (NX-10-R4): UNVERIFIED whether the behaviour exists; `reminder_prime_*` events exist in `packages/analytics/src/catalog.ts` and `apps/mobile/test/reminders-inline.test.ts` exists, which I did not read for this.

### The finding #680 reports and does not fix (the "10 percent" case)

When a person changes cadence or evenings, the rotation restarts from a new count and the next evening can have the same words as the last one. #680's probe: over 10,000 switches (1 Oct 2026 for 400 days, 5 patterns) the next evening after the switch had the same words 969 times (about 10%). #680 says it "needs a decision before any change". I do not make that decision. This packet only places it.

Why, from the code: the variant is `slotOrdinal(date, weekdays) % VARIANTS`, and `slotOrdinal` counts nudge days of the currently selected weekdays since 1970-01-01. A different weekday set gives the same date a different ordinal, so the variant jumps; with 8 variants about one switch in eight lands on the same variant as the last one that fired (the measured 10% is close to that).

Place of a fix, as a proposal for the decision (UNVERIFIED design; not built, not tested):
- The planner is pure, so it needs to be told the last delivered variant. Add an optional field to `PlanInput` (planner.ts line 77), next to `lastSaveAt`: for example `lastDelivered?: { date: string; variant: number } | null`.
- Where it would come from: `scheduler.ts` `intendedPlan` (line 118) builds the input; the value would be read next to `lastOwnSaveAt()` in `prefs.ts`. What records the last delivered evening today is UNVERIFIED; if nothing does, a new settings key is needed (a local, content-free value). Whether to derive it from the previous plan signature instead is the open design question.
- Use in `planReminders` at lines 357 to 358: if the first evening after `lastDelivered.date` has `variant === lastDelivered.variant`, step to the next variant, and carry the same step forward so later evenings do not collapse onto the one before. Whether this must also keep the 4-in-a-window rule that #680's tests assert (needs a decision) is the main open point.
- Unchanged: `namedSlotIndex` (children are named in turn by `ordinal`), month and birthday notes, the quiet window.

### Branch and steps (each one PR)

1. #680 reviews and merges on its own. Nothing for the engineer here except the review.
2. PR A (the switch fix). Branch `fix/mobile-reminders-switch-repeat`, cut from `test/reminders-no-repeat` (so the `[NX-10-R2]` tests and `delivered()` helper are in the tree). PR base: `develop` only after #680 merges; until then the PR is draft, titled "stacked on #680 (4a74c4ef28)". Do not start the code until the decision above is on record in the PR #680 thread or a D entry (`product` drafts, the founder decides). Order inside the PR: (a) the failing test first, (b) the planner change, (c) the scheduler/prefs change if the proposal above is chosen.
3. PR B (refused notifications asked once, NX-10-R4). Branch from develop. Read `reminders-inline.test.ts` and `settings/reminders.tsx` first; if the behaviour exists, the PR is the titled test only.
4. PR C (month-nothing is never counted, NX-10-R6, and the content keys test NX-10-R5). Branch from develop. R5 is a required-keys list added to `packages/content/test/rules.test.ts`; the keys do not exist yet.
5. PR D (back-off, NX-10-R3). Not startable: waits on the founder's BL-534 call (1.0 or 1.0.1), words for the back-off and month-note lines from `content`, and PR C. Written for later, not now.
6. Device: S1-133 (#680) covers R1 and the no-repeat device check. S1-47 exists for the refused-then-Settings flow (R4). No new row unless step 3 finds a gap.

### Tests (exact titles) and which must fail on old code

| Title | Fails on old code? |
|---|---|
| `[NX-10-R2] 30 reminders in a row, across seasons: no text twice in a row, no variant twice within 4 (<label>, names on/off)` (10 tests, #680) | No. They pass on develop (coverage gap); they fail when the variant is shifted, which is how they bite |
| A new switch test in PR A, suggested title `[NX-10-R2] after a cadence switch the next evening never repeats the last words` | Must fail on develop: over a sweep of switches (use the #680 `delivered()` approach plus a switch at each day) it hits the same words about 1 in 10 |
| `[NX-10-R3] [C-REQ-008] 4 unopened drop to weekly, 4 more to month notes, a save restores` | Must fail on develop (back-off not built) |
| `[NX-10-R4] refused notifications are asked once and never again` | UNVERIFIED |
| `[NX-10-R5] back-off and month-note keys exist and have 0 rule hits` | Must fail on develop (keys absent) |
| `[NX-10-R6] a month with nothing recorded is never counted or flagged` | HYPOTHESIS in the requirement file; write when built |

### Content keys

None for PR A. Back-off and month-note keys (R3, R5) do not exist; `content` writes them. Reminder wording must never count days, gaps or letters (S1-133 (d)).

### Analytics

Existing, allowlisted: `reminder_prime_shown`, `reminder_prime_result` (`catalog.ts` around lines 689 to 700). No new event. Analytics are off in every build profile.

### Done when

PR A merged with its failing-first test; `npm test -w @scribe/mobile` and typecheck green; S1-133 recorded by the founder; the decision on the 4-window guarantee is cited in PR A. PRs C and D only after their blocks lift.

### Blocks

The decision on the switch fix (#680); BL-534 timing (R3); the founder's SE 3 for S1-133; Apple 4.5.4.

## 4. Packet BL-772 (startable part): Names that learn and prompts that do not repeat (NX-12 names; backlog 08 rank 27)

Customer outcome: the app spells your family's names right and does not hand you last night's prompt again.

Engineer: `mobile` for the dictionary part, `content` for prompts and keys. Reviewer: `privacy` (names near a log path is the pre-mortem risk). Status in BACKLOG: blocked (the Add to your words control, NX-12-R3b, is not built); this packet covers only the parts that can start.

### Part A: the prompts repeat fix (built)

- PR #681 (draft), branch `test/bl-names-repeat-suppression`, head 44d2683c82. Despite the branch name it is prompts only. Files: `packages/core/src/prompts.ts` (when every prompt in the pool is recent, serve the one used longest ago), `packages/content/test/prompts.repeat.test.ts` (12 tests), `packages/core/test/prompts.selection.test.ts` (a three-prompt library test). Its body: fails 6 of 12 on develop (for example `gap age 2 night 21`, `hard age 2 night 11`, `together age 2 night 9`), cause `selectPrompt` avoids the last 10 keys but the gap pool has 7 prompts and hard has 8, then picked at random, about 10% immediate repeats on gap nights; passes with the fix. Ran core 1232, content 293, mobile 4117 (its own report).
- Nothing for an engineer to write. Review and merge. One point for the reviewer, which I raise and do not decide: `F13-REQ-005` (docs/prd/v2/features/F13-prompts-reminders.md) says when no eligible unseen prompt exists, "show no prompt rather than repeat", and F13-REQ-004 sets a 365-day window; #681 and the code use a 10-key window and, when the pool is exhausted, reuse the oldest. That matches neither REQ exactly (BL-534 "No prompt repeats within 365 days" is the deferred task). `principal-architect` or the founder says which rule holds.
- Satisfies: F13-REQ-004 and F13-REQ-005 are the nearest ids; the BL-772 row does not claim them.

### Part B: bracket-only and test-only steps that can start now (each one PR, branch from develop)

1. `test/content-nx12-r3a-bracket`: add `[NX-12-R3a] [F07-REQ-004]` to the existing title "rejects stt_fix to a non-dictionary word" in `packages/core/test/core.test.ts` (line 169 on develop; the test exists). Bracket only; passes on old code by design.
2. `test/content-nx12-r1-r6-brackets`: add `[NX-12-R1]` to the claims test in `packages/content/test/claims-capabilities.test.ts` (English-only; listing names 1 language), and `[NX-12-R6]` to `packages/api/test/keys.test.ts` and `manifest-verification.test.ts` ("a served pack verifies"). Read each file to choose the title; UNVERIFIED which. Bracket only.
3. `test/core-nx12-r4-regression`: the code-switched regression set `[NX-12-R4] no meaning-changing edit accepted across the code-switched set` under `packages/core/test/regression/`. Read the folder first; if no code-switched set exists, this step stops at "set missing" and goes back to `qa`. UNVERIFIED.

### Part C: not startable

NX-12-R3b (Add to your words, F07-REQ-005 and -006): not built (no `addToWords`, "Add to your words" or `dictionary_term_added` call in `apps/mobile/src` or `packages/content/src`, searched 8 Nov). Blocked on a design from `design-systems`, words from `content`, and a privacy design for where a child's name may be held (no name in analytics, logs or crash reports; CLAUDE.md). `dictionary_term_added` is allowlisted in `packages/analytics/src/catalog.ts` (line 446). NX-12-R2 and R5 (languages) are parked, rank 32, no id.

### Tests

| Title | Fails on old code? |
|---|---|
| `[NX-12-R3a] [F07-REQ-004] stt_fix to a non-dictionary term is rejected` | No (exists) |
| `[NX-12-R1] English-only: picker lists English with a note; listing names 1 language` | No (exists, bracket only) |
| `[NX-12-R6] a served pack verifies` | No (exists, bracket only) |
| `[NX-12-R4] no meaning-changing edit accepted across the code-switched set` | UNVERIFIED |
| `[NX-12-R3b] [F07-REQ-005] term and re-cleaned draft commit in one transaction` | Must fail first; not startable |
| #681: `packages/content/test/prompts.repeat.test.ts` (6 of 12 fail on develop) | Yes, by its own report |

### Device rows, content keys, analytics

Device: new "add a name in Review" (R3b, later); setup S-08 and S-11 for R6. Content keys: none for Parts A and B. Analytics: `dictionary_term_added` allowlisted, nothing added.

### Done when

#681 merged or its rule question answered; Part B brackets merged and `trace.mjs` sees the real ids; Part C stays blocked.

### Blocks

The F13-REQ-005 question for #681; design and privacy for R3b; native reviewers for languages (parked).

## 5. Rows I did not packetise

| Row | Why |
|---|---|
| BL-774 catch-up letters (rank 29) | Backlog 08 says Ready: No ("read the code first; requirement"). I had marked it `ready` in the first pass; I changed it to `needs-decision`. It becomes startable when `qa` re-scores the NX-27 readiness (25 of 28 by the author for R1 to R3) and someone reads the date-bounds code (`apps/mobile/test/book-date-change.test.ts` exists) |
| BL-757 to BL-763, BL-766 to BL-769, BL-771, BL-773 | Each is blocked on a founder decision, counsel, a hosted project or another BL; none was asked for here |

## 6. What is NOT verified

- Whether any open PR other than those named touches the same files (I checked 615, 618, 614, 675, 587, 599 for state only). The claim check above is the engineer's step.
- Line numbers in `planner.ts`, `recorder.ts` and `strings.en.ts` are from develop at db0a0b0d; they move.
- The content of #615 and #618 (open; #670 says it replaces them).
- Everything marked UNVERIFIED or UNKNOWN above.
- No test, device or workflow was run by me.
