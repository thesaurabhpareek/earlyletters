# Definition of done, by change type

Owner: qa. Written 20 Nov 2026. Docs only. Tags: [V] verified (file, line or command), Rec = proposal with its basis, [U] unverified.
Rules referenced as C-nn are in `CHECKS-AND-BALANCES.md` (same folder). Row ids are in the four `TEST-CASE-CATALOGUE-*.md` files.

## 0. Applies to every change type

Before the PR is opened:
- [ ] One concern, 400 changed lines and 20 files at most, not counting the lockfile, generated files and test data (CODE-R02, `docs/engineering/01-code-and-change.md:31` [V]). Otherwise split by layer: types, then logic with tests, then wiring.
- [ ] A test that fails on the old code for every behaviour change (CODE-R04); its red output saved for the PR body (C-03).
- [ ] For each P0 row in `Satisfies:`: the catalogue line read, the exact title used, the mutant table filled (C-05).
- [ ] Fixtures use the family Asha only; no real name, letter, picture, voice or path anywhere (CLAUDE.md privacy rules).
- [ ] ASCII only in added lines (no em or en dashes, curly quotes, ellipsis characters, emoji) except a fixture that needs a script on purpose.
- [ ] No `console.*`, log, breadcrumb, analytics or crash call carries content, a path or a hash (OBS-R02; `docs/engineering/ENFORCEMENT.md:52` [V]).
- [ ] Sandbox baseline unchanged (a rule for agents in the sandbox, not a CI gate): 8 `apps/mobile` test files red (`app-lock-wiring`, `capabilities`, `config`, `hosting-ios17`, `licences`, `preflight-production`, `privacy-manifest`, `store-sign-in-capabilities`; missing `expo-local-authentication` and `expo-clipboard`; 73 tests) and `tsc` shows its 5 known errors [V, run in the #835 to #838 reviews]. Nothing else red.

Before it merges:
- [ ] CI `required`, compliance-fence and `applied migrations unchanged` green (`.github/README.md` branch protection list [V]).
- [ ] Two independent reviews on the current head, each starting `## Review A|B at <sha>: ...` and counted under CR-63 (`docs/agents/cto/RULINGS.md:594` [V]); merge by Karma (D-132, `docs/DECISIONS.md:655` [V]).
- [ ] Every Must fix closed with a commit, and the head re-read from the API after the last push.
- [ ] Anything only a phone can prove is listed under "Not verified" in the PR body and has a row on a run sheet (`JOURNEYS-AND-DEVICE-SHEETS.md`).

Evidence block, copied into every PR body (Rec; it is the shape the reviewers already ask for):
```
Satisfies: NS-xx-Rn, ...            (card ids, not card text)
Data classes touched: L? ...
Fail-before: <command> -> red at <file>:<line> on <old sha or removed line>
Mutants: table of C-05 (row, file:line, files run, red at)
Sandbox: <n> files, <n> tests red = baseline; tsc 5 known errors; content tests <n> pass
Not verified: <what only a phone or CI can show>
Way back: <how to undo>
```

## 1. UI screen (a route or a component a parent sees)

Before the PR:
- [ ] Every string is a `packages/content` key, marked PROPOSED, with `TODO(founder)`; the PR gets `needs:founder`. `npm test -w packages/content` passes (no dash, no count, no gap word, no AI-writes implication, no gendered child).
- [ ] Only Home starts a capture; the screen calls no capture function (`apps/mobile/test/navigation-one-entry.test.ts` passes [V, file listing]; NS-35-R1).
- [ ] Accessibility, each as a unit test where it can be: role and state per control; reading order; targets at least 44 pt; one `Text` heading with `asHeading` where the card says; no `tablist` (NS-33-R3); `numberOfLines` only with a large-text guard (`a11y-ax5.test.ts:73` pattern [V]); Smart Invert flag on any image (NS-33-R11); colour never the only signal (NS-33-R12).
- [ ] Dynamic Type to AX5: one column, no truncation, nothing fixed-height around text. Contrast through tokens only, light, dark and Increase Contrast (NS-33-R8 token test).
- [ ] Motion: fades at most 200 ms under Reduce Motion, no loop (NS-33-R5); durations and easing from `packages/design-tokens`, none invented.
- [ ] Performance: no work before the first frame that was not there; no decode while a take runs (`captureBusy`, NS-37-R2); lists virtualised; no new full-size image in a list (NS-37-R8). A budget a card states is a run-sheet row, and an unmeasured row holds its flag (`docs/tdd/new-scope/architecture.md:130`, AP-8 [V]).
- [ ] Switch: behind its build flag and the remote pause; with both off the screen is absent, not disabled (NS-01-R19, R59).
- [ ] Privacy: no content in route params or URLs (NS-02-R25); nothing donated to the system (`[X6-R1]` scan covers the new files); writing tools off on any words field, or a recorded finding (NS-01-R50).
- [ ] Observability without content: any new failure has a closed code; the canary test forces each code and finds no path, hash or text in any sink (NS-01-R51).

Before merge: reviewers tick lens B (section 9 of CHECKS). Device rows for the screen are on the run sheet and have an owner.
PR body adds: the catalogue lines satisfied; the a11y unit tests by title; "Not verified: VoiceOver on a phone, AX5 on an SE 3, Reduce Motion".

## 2. Store or migration (local SQLite store, Supabase migration, export schema)

Before the PR:
- [ ] A new migration file; a migration that has been applied is never edited (CLAUDE.md branches and commits; guard `.github/scripts/migration-guard.mjs` [V]). Local migrations are append-only in `apps/mobile/src/lib/db/migrations.ts`; an unshipped one may be edited only with a reviewer stating that it has not shipped (as at #835 Review A, item 1 [V, PR comment]).
- [ ] Each new column states its level (L1 to L4) in the migration comment and appears in the classification test (`supabase/tests/classification.test.mjs`, NS-36-R10, R6 [V, file listing]); the same PR adds its row to `docs/legal/data-policy.md` section 4 or names `DATA_CLASSIFICATION.md` as the interim (NS-36-R6).
- [ ] Every new table, view, sequence or function in `public` carries its grants in its own migration and in `supabase/tests/grants.mjs` (CLAUDE.md [V]).
- [ ] A new synced column updates the `entries` content-trigger tuple and the `book_entries` view in the same migration (NS-36-R11).
- [ ] Upgrade test: a database at the previous version with 1,000 Asha letters, drafts, agreements and outbox rows is byte-identical after the migration and nothing is queued (NS-01-R35 shape). Old rows untouched; recordings still play.
- [ ] Kill-safety order: file first, then row on delete; row after file on write; a sweep removes orphans (NS-01-R16c, R36). The test seeds a real file first (C-06).
- [ ] Erase paths: eraseEntry, deleteDraft, finishDiscard, purge, Erase everything, account deletion and `finishServerErased` all reach the new data (`photos/device.ts` pattern in #835 Review B [V, PR comment]).
- [ ] Export: schema version bumped one way (a 1.6.0 reader rejects 1.7.0 and the 1.7.0 schema reads it, NS-36-R7); a golden file with one Asha row.
- [ ] Account scope: every query carries the account or owner clause (`[X4-R1]`; `apps/mobile/src/lib/auth/account-scope.logic.ts` [V]).
- [ ] Performance: a query on 1,000 Asha letters has an index or a stated reason; a migration on 1,000 letters finishes inside the first-launch budget (device row).
- [ ] Security: row-level policy tests for each role; no `anon` access; the `supabase/tests` matrix passes (`npm run test:db`).

Before merge: `npm run test:db` green when `supabase/**` changes; migration guard green; the applied-migrations list untouched unless the PR records an apply (Karma applies, never the author).
PR body adds: the migration file name; the upgrade test title; the erase-path test titles; "Applied: no".

## 3. Sync (outbox, pull, merge, server functions)

- [ ] A kill switch or remote config key with an owner and a removal date (CODE-R19, `01-code-and-change.md:77` [V]); behaviour with `serverFeaturesEnabled()` off and `killSwitches.sync` on has its own test (NS-09-R10, NS-13-R26).
- [ ] Idempotency: one key per user action; a lost answer then a retry gives one row and one object (NS-10-R7, NS-25-R10, NS-08-R13).
- [ ] Account ownership on every queued op: A's op is never sent under B's session; sign-out waits for ops or holds them for A (NS-09-R11, R12).
- [ ] What must not sync is proven absent in the payload at any depth (NS-01-R15, R26): capture the payload and walk it.
- [ ] Pull half tested as well as push (#836 must-fix 3 [V, PR comment]); a pull never deletes data it does not own.
- [ ] Two-phone behaviour: a two-store test with an injected clock and a fake server titled `[stand-in]` (C-10), plus the device row; seal and cursor cases follow NS-06-B8b.
- [ ] Time: injected clock; a reader's device clock never opens or hides anything the server decides (NS-06-B16).
- [ ] Performance: pull pages and batch sizes stated; `supabase/tests/sync_perf.test.mjs` budget when the pull path changes (`docs/tdd/new-scope/data-and-sync.md` S4 [V]).
- [ ] Privacy: no content in the request line, headers or logs; the log canary covers the new path.
Before merge: `npm run test:db` and `npm run test:functions` when their paths change. PR body adds: the payload walk test title; the retry test title; "Not verified: two phones".

## 4. Native module (Swift or Kotlin under `apps/mobile/modules/*`)

- [ ] The module and the pod compile exactly the listed sources; a source scan (`swiftProblems`-style) has a positive control (`docs/tdd/new-scope/architecture.md:126` AP-4 [V]; C-09).
- [ ] No permission call, no library or camera authorisation, no Vision, Core ML, OCR, face or classifier import (NS-01-R2, R33).
- [ ] `PrivacyInfo.xcprivacy` and the build's capabilities match what the code uses (`apps/mobile/test/privacy-manifest.test.ts` [V, file listing]); a new API reason or entitlement needs the recorded decision (NS-07-G11-3).
- [ ] Licences: a new dependency passes `licences.test.ts` and `scripts/licences/verify-shipped.mjs` [V, file listing]; CODE-R17 text (permissive licence, active tracker, installed through the serialised command) is followed. No install in a docs or design run.
- [ ] The JS side has a port with a fake for sandbox tests; the fake is named in titles that use it (C-10).
- [ ] Failure leaves nothing: no file, no row, no temp copy; each closed failure code has a test (NS-01-R17a, R52).
- [ ] Performance: no work on the UI thread over 16 ms; the long re-encode path runs off it; the budget is a run-sheet row.
- [ ] Device: the simulator build of the `e2e` profile launches (`kill-harness.yml.example`, `ios-e2e.yml.example` in `apps/mobile/e2e/ci/` [V]); the phone rows are listed.
Before merge: iOS simulator build green when native files change (it is skipped otherwise, #837 review [V, PR comment]).
PR body adds: "Native verified on: simulator only" or the evidence file; the scan's positive control.

## 5. Notification

- [ ] The class is in the registry with a group, priority and owner; an unregistered class fails its test (NS-32-R2, R5).
- [ ] The body and title are `packages/content` keys; no generated text; slots only weekday, month number, child name (NS-13-R24, NS-32-R11). No count, no number of days, none of the guilt words (NS-13-R5). No Plus, price or Keep step (NS-13-R11). No due date (NS-13-R10).
- [ ] Names off by default: the whole neutral pool and the Asha plan hold no `{child}` token and no name (NS-13-R6a); no letter words ever (NS-13-R6b, NS-32-R12).
- [ ] Budget: one a day, at most 60 pending plus plan notices, one shared `allocate()` (NS-32-R1, R4b, R7, NS-13-R23). Quiet hours 07:00 to 21:30 in 15-minute steps (NS-13-R30). Interruption level `active` (NS-32-R10).
- [ ] Back-off to nothing after day 35, tested with an injected clock (NS-13-R18); a typed day survives (NS-32-R9).
- [ ] Sign-out, Erase everything and account deletion remove pending and presented items and the settings (NS-13-R14, R15, NS-18-R6).
- [ ] A tap lands on Home or a reading screen and never starts a capture (NS-35-R3); the microphone is never opened from outside (NS-35-R7).
- [ ] Device rows: reminder at the chosen hour, time zone change, revoked permission, lock-screen preview in default settings across a week (J-N3, J-N5, J-N24).
PR body adds: the pool test titles; "Not verified: delivery on a phone".

## 6. Content key (a new key in `packages/content`, not yet a parent-read word)

- [ ] The key is marked PROPOSED and never final; the PR has `needs:founder`.
- [ ] The glossary rows: internal terms stay in code; a parent reads only BRAND.md glossary words (CR-25, CLAUDE.md [V]).
- [ ] `npm test -w packages/content` passes; `rules.test.ts` is not edited to pass (fix the copy).
- [ ] `{child}` only; no gendered word; no count; no "yet" or gap word; no AI-writes implication.
- [ ] Every key has a use site or a named later slice; an unused key is deleted (CODE-R09).
- [ ] A key used in a notification, share text or the printed book is checked against that surface's own rules (NS-13-R5, NS-05-R18, NS-07-C28-2).
PR body adds: key names, their screens, the test run.

## 7. Copy (words a parent reads, once approved)

- [ ] The founder's written approval is linked in the PR body; counsel reads named by the card (G2, G3) are on file.
- [ ] Store listing, site and in-app lines agree with what the build does: claims inventory diff, with no backup claim while backup is off (NS-08-R7) and no language not shipped (NS-17-R4).
- [ ] The privacy label and policy lines match the build's data (NS-08-R4; G5). A diff that adds data leaving the phone fails the label guard unless the decision is recorded (NS-07-G11-1a).
- [ ] Translated or transliterated strings: not produced by the product; a person's words are never rewritten (constitution).
- [ ] Reading-level and tone check by `content`; `qa` checks only that the tests pass and the title cites the row.

## 8. Workflow (`.github/workflows/**`, CI, scripts that CI runs)

- [ ] The Claude GitHub App cannot edit `.github/workflows/`. Write the change as a patch under `docs/ops/proposed/` (the folder exists, with `coverage-ci.md` [V]) and flag it for the founder, with: what runs, on which events, expected minutes, the required-check name, and the way back.
- [ ] CI total stays under 10 minutes (`.github/README.md:63` [V]); split a slow job, do not raise its timeout.
- [ ] A new required check is not added until it has run green on develop three times (Rec); a check that cannot fail is refused (C-03).
- [ ] The script has its own test (`scripts/*.test.mjs` pattern: `trace.test.mjs`, `skip-guard.test.mjs`, `migration-guard` [V, file listing]) with a failing fixture for each rule it enforces.
- [ ] Secrets: none printed; fork PRs never see them; no new external account without the founder.
- [ ] Observability: a failure line names the file and the rule, never content.
PR body adds: the patch path, "Needs: founder applies", the dry-run output of the script on develop.

## 9. Non-functional rows at a glance

| Area | Proven by | Where it lives | Phone needed |
|---|---|---|---|
| Performance: speed, memory, frames | Run-sheet number against the card's budget, device, build fingerprint (NS-34-R1, R3) | `docs/qa/evidence/<date>-<build>-se3.md` | Yes (SE 3 and iOS 17) |
| Accessibility: VoiceOver, AX5, Reduce Motion, Voice and Switch Control, contrast | Unit tests for roles, order, targets, tokens; device walks; XCUITest audit when the harness exists (NS-33-R16) | `apps/mobile/test/a11y-*.test.ts` | Yes |
| Security | RLS and policy tests, bundle scan, source scans with positive controls, preflight | `supabase/tests`, `apps/mobile/test`, `scripts` | No |
| Privacy | Log canary, `[X4-R1]`, `[X6-R1]`, no-real-family-data, label diff | tests plus the claims inventory | Partly |
| Motion | Token-driven durations; Reduce Motion unit tests; device recording of loops | design tokens and run sheet | Yes for loops |
| Observability without content | Closed failure codes; canary over every sink | `apps/mobile/test` | No |

## 10. Samples checked for this file

Cites sampled: 24 file or line cites and 8 file-existence cites (`grants.mjs`, `classification.test.mjs`, `sync_perf.test.mjs`, `e2e-seams.ts`, `verify-shipped.mjs`, `navigation-one-entry.test.ts`, `migration-guard.mjs`, `docs/ops/proposed`); held 32 of 32. Not verified: `docs/engineering/ENFORCEMENT.md` rows beyond OBS-R02; whether `apps/mobile/e2e/ci/*.example` files match the current CI; counsel and founder approvals named in section 7 (they are conditions, not facts).
