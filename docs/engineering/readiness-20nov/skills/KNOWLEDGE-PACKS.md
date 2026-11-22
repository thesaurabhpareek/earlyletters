# Knowledge packs, part 1: shared pack and lanes 1 to 5 (RD-G, 2 of 5)

Author: `ai-eng-lead`, 20 Nov 2026. `develop` at `16e61549`. Docs only. Part 2 is `KNOWLEDGE-PACKS-2.md` (lanes 6 to 10, queue order). Karma pastes the pack id into the brief (`BRIEF-TEMPLATE.md` section 5); the agent reads the files in the order given. Tags [V] verified at that sha or command, [E] estimate, [U] unverified.

## How to read a pack
- Card ids come from the locked pack at `450bcb4a` (`git show origin/docs/prd-lock-v1-20nov:docs/product/prd/<file>`). Where a design file and a card disagree, the card wins (CR-66, `docs/agents/cto/RULINGS.md:632`) [V].
- "Design" means `docs/tdd/new-scope/<file>` on `develop`. Its Facts were true on 20 Nov at about 11:30 UTC. Seven merges landed after that. Re-read every `file:line` before you rely on it (stale list in section P-0.4).
- Load a skill only where the pack says so. A skill is a procedure; a chapter is a rule list; neither replaces the card.
- Never edit `docs/BACKLOG.md`, `docs/agents/BOARD.md`, charters, memory, `agents/roster.json` or workflows from a brief.

## Pack 0: every run (read in this order, stop at the line limit)

| # | File | Take |
|---|---|---|
| 1 | `CLAUDE.md` | The constitution; privacy rules; commands; "All tests must pass" |
| 2 | `docs/engineering/PRINCIPLES.md` | One page. Open a chapter only for rule ids your change touches (AIE-R09) |
| 3 | `docs/agents/OPERATING_MODEL.md` sections 3 to 5, 8 | Memory, branch and PR rules, the journal, hard limits |
| 4 | `docs/agents/COORDINATION.md` sections 2, 3, 5, 10 | Claims, files you own, how a requirement is written (Shown, Records, Never, Decline) |
| 5 | The brief, then the pack of your lane | Brief wins over pack on scope; pack wins over memory on facts |
| 6 | `docs/tdd/new-scope/architecture.md` section 3 patterns AP-1 to AP-12 (lines 123 to 133) | Flags, one capture entry, migrations, native modules, content keys, erase hooks, sweep, budgets, no content in logs, closed registries |

### P-0.4 Facts in the designs that were stale by 20 Nov afternoon [V, each checked on `16e61549`]
| Design says | Develop now |
|---|---|
| `consent.ts:117` mints a new key per call (08-keeping.md section 3.1) | Fixed by #903 (`b27f690e`): `lib/auth/consent.ts:117` holds an answer (`answers.hold(...)`); keys in `lib/auth/consent-key.logic.ts` |
| Sign-out never calls `forgetReminders` (09-capture.md section 1.2) | Fixed by #904 (`52bba7de`): `lib/reminders/session.ts:57` |
| Planner reads no quiet flag (`prefs.ts:115-117`) | Fixed by #901 (`1838e1a8`) and #902; `prefs.ts` lines moved |
| `planner.ts:313` keys `${kind}:${date}` | Now `planner.ts:319` |
| `photos-device.test.ts:303, 392, 489` (architecture.md AP-4) | Now `:315` (`swiftProblems`), `:405` and `:517` |
| `test/helpers/find-fixture.ts` (BOARD row, PR #855) | The file is `apps/mobile/test/find-fixture.ts` |
| BL-961 is one PR "account layer" (08-keeping.md section 3.6, row 3) | Three PRs: #869 reader (merged `c1306b18`), #871 cover (open), #879 store reads (open, base is #871's branch) |

Method for every pack: a Fact in a design is a lead, not a ground truth. `git grep` the symbol before you cite it.

---

## Pack 1: Photo and media (NS-01, BL-931; NS-37, BL-932; BL-933; P-1)

Owner `mobile` (photo lane). Lenses: `principal-architect` with `security-architect`, or `compliance-engineer` on 3b (#847 section 2.1). Skills to load: `expo-native-module` (native or module-test change), `stacked-prs` (any slice), `review-gate` (reviewers).

Status [V #847 section 2.1 and `gh api pulls`]: #834 (module) and #841 (file layer) merged; #842 merge-ready; open stack #835 (base `develop`), #836, #837, #838, #839, #840 each on the slice below. Everything is behind `EXPO_PUBLIC_PHOTOS`, off in every store profile (BL-958, #896).

| # | Read | Take |
|---|---|---|
| 1 | `01-photo-with-a-letter.md` (lock) rows NS-01-R1 to R25, R45, R48 | Behaviour; R2, R17, R22: no permission prompt; R22 no PhotoKit call |
| 2 | `docs/adr/0028-photo-seal-find-on-device-data.md` D1, D4, D5 | Where pictures live, the Find view, erase order |
| 3 | `docs/tdd/new-scope/11-foundations.md` section 8 (lines 254 to 298) | Open rows: lens control (R48), export 1.7.0, iCloud progress and native Cancel (P-1) |
| 4 | `docs/tdd/new-scope/data-and-sync.md` section 1 (L11 on) | The `entry_media` row set and level of each column |
| 5 | `.claude/skills/expo-native-module/SKILL.md` sections 2 to 5 | Layout, source scans, permission and store rules |
| 6 | `apps/mobile/modules/scribe-photo/index.ts`, `ios/ScribePhotoModule.swift`, `ios/ScribePhoto.podspec` | The module is one Swift file; `requireOptionalNativeModule`; `null` handling |
| 7 | `apps/mobile/src/lib/photos/{baker,files,types}.ts` | Pure logic and the file layer on `develop` |

Tests to copy [V]: `apps/mobile/test/photos-device.test.ts` (header line 2; stand-in `test/helpers/expo-fs-standin.ts`; `swiftProblems` at `:315`; applied to each Swift file at `:405`; mutants must be caught at `:517`). `test/native-guards.test.ts`. `test/migrations.v9.test.ts` shape for L11.

Pitfalls found today:
- Podspec says iOS 16.4 (`ScribePhoto.podspec:9`), the app targets 17.0 (`app.config.ts:44`). Do not assume an API is available from the podspec [V].
- A linked module ships its permission calls in every build whatever the `EXPO_PUBLIC_*` switch says; no purpose string means ITMS-90683 (skill section 4). No `expo-image-picker` (CR-65, `RULINGS.md:621`).
- Slices retarget one by one. After a squash merge the base's commits conflict (add/add) with yours. Use the rebuild recipe, never `git merge origin/develop` on a squashed base (`stacked-prs` section 5; see `HARNESS-GAPS.md` H3).
- A slice that grows after a size exception is covered must be named to the founder: #836 grew from 704 to 995 lines (#847 section 2.1) [V].
- Caption and place ceilings count code points in the slices (eval A s1.5; BOARD row "mobile (BL-931, photo stack)"); do not re-count characters in a new slice.
- Picture is data of class L3 or worse; nothing leaves the phone without the X2 note (`security.md`; READINESS-BRIEF line 6).
- Device rows owed: picker, Cancel, iCloud wait, Live Photo, folder protection class, ten ImageIO fixtures (#847 section 2.1 "Gate" column) [V].

Files to claim (BOARD, PR #855 row "mobile (BL-931)"): files of #835 to #840 only; `packages/content/src/features/index.ts` and `packages/content/test/support/copy-surfaces.ts` have one owner in wave 1.

---

## Pack 2: Find and search (NS-02, BL-952, NS-36 for Find, NS-37)

Owner `mobile`. Lenses `principal-architect` / `compliance-engineer`. Skills: `stacked-prs`, `review-gate`.

Status [V `git log` and `gh api pulls`]: parts 1 to 5 merged (#881 `116248df` query and excerpt, #882 view and scan, #883 index and lifecycle with the account seam, #884 search and the 150 ms debounce, #885 batched rebuild). Open: #894 (6/8 words, PROPOSED, `bookSearch` pause, switch; base `develop`), #895 (7/8 wiring into repos, store and sync; base `feat/mobile-bl-952-6-words`); part 8 not seen. Flag `EXPO_PUBLIC_BOOK_SEARCH`, off.

| # | Read | Take |
|---|---|---|
| 1 | `02-find.md` (lock), P0 rows first (R1 to R23, R24 to R37 added by the lock) | Rows; R2 first row p95 300 ms; R35 batched rebuild; R37 |
| 2 | `docs/adr/0028-...md` D4, D5 | `searchable_letters` view; erase drops FTS before rows |
| 3 | `11-foundations.md` section 9 (line 299) | Find is "record only" in the design |
| 4 | `apps/mobile/src/lib/find/sources.ts:75-110` | `SEARCH_VIEW`, `searchableViewSql`, `ensureSearchView`; extra sources register here (photo text) |
| 5 | `lib/find/lifecycle.ts:5-8, 22-30` | Index stays in step inside the letter's transaction; `setIndexableBooks` is where BL-961 wires `bookVisibleTo` |
| 6 | `lib/find/search.ts:39` (`searchLetters`), `rebuild.ts:16-89` (`REBUILD_BATCH` 200, `rebuildSearchIndex`, `optimizeSearchIndex`) | Query path and idle merge |
| 7 | `lib/find/debounce.ts`, `query.ts`, `snippet.ts` | Pure rules |

Tests to copy: `apps/mobile/test/find-index.test.ts`, `find-query.test.ts`, `find-rebuild.test.ts`, `find-scan.test.ts`, `find-search.test.ts`, with `apps/mobile/test/find-fixture.ts` (not under `helpers/`).

Pitfalls:
- FTS5 shadow rows: deleting them by hand corrupts the index. Erase drops the tables before the rows go (`lifecycle.ts:5-8`; AP-6) [V].
- Another account must never be indexed: the guard is `if (!bookVisibleNow()) return 'off'` at the top of `ensureFindIndex()` and an empty `findLetters()` (PR #879 body, "Find" row) [V]. Part 7 (#895) owns those functions.
- Do not edit `lib/find/**` from BL-961; the BL-961 row says so.
- A Find fix that touches `store.ts` shares that file with BL-961 and the photo stack; whichever lands second merges `develop` (BOARD rows).
- Words are PROPOSED keys behind the flag; the words PR merges before or with its screen (AP-5).

---

## Pack 3: Account and consent (NS-10, BL-922, BL-961, BL-978; NS-07 consent rows)

Owner `mobile`. Lenses `security-architect` / `compliance-engineer` (BL-961), `principal-architect` / `security-architect` (BL-922, BL-978). Skills: `stacked-prs`, `review-gate`.

| # | Read | Take |
|---|---|---|
| 1 | `08-keeping-and-trust.md` (lock) NS-10-R0 to R14 (table near line 476), sign-out bullet line 13 | R0 never the child step; R3 and R5 second account; R7 one row per answer; ruling D1 (book stays after sign-out) |
| 2 | `14-test-plan.md` lines 52, 115, 137 | J-N2, the P0 test titles, `[X4-R1]` |
| 3 | `docs/tdd/new-scope/08-keeping.md` section 3 (lines 96 to 172) | Gaps, design, PR order, risks |
| 4 | `security.md` NSC-03 and ADR 0031 as ruled in CR-67 AX-12 (`RULINGS.md:647`) | Data half (store reads) plus screen half (cover) |
| 5 | `apps/mobile/src/lib/first-run/gate.logic.ts:109-130` | `firstRunGate`; `:123-125` opens the local book for any session [V] |
| 6 | `lib/auth/account-scope.logic.ts:34` | `bookVisibleTo` (merged #869) |
| 7 | `lib/sync/ownership.ts:49, 106` and `lib/sync/index.ts:176-182` | Mismatch refuses sync only; `releaseEmptyOwner` |
| 8 | `apps/mobile/src/app/_layout.tsx:243` | `AppLockLayer`; the account cover mounts next to it |
| 9 | `lib/auth/consent.ts:117`, `consent-key.logic.ts` | One held answer per (step, answer) |

Tests to copy: `test/account-scope.test.ts` (#869, node:sqlite, two accounts), `test/first-run-gate.test.ts`, `test/first-run-new-account.test.ts` (pins at `:152-156` to rewrite in BL-922b), `test/auth-sign-out-wait.test.ts`, `test/account-store.test.ts` and `test/account-note.test.ts` on #879.

Pitfalls:
- `_layout.tsx` is boot wiring: the `mobile` charter says never edit it outside a task that owns it. The brief's claim globs must name "account layer only" (BOARD row; OQ-8 in 08-keeping.md).
- Reads by id (`getEntry`, `getDraft`, `getChild`) stay open on purpose: the listening-copy sweep deletes copies whose draft and entry are both gone (`lib/audio-enhance/index.ts:109`, per #879 body) [U: not opened here].
- The planner guard (`currentPlan()` first line `if (!bookVisibleNow()) return [];`) lands in the BL-967 lane, not in BL-961 (Karma's ruling on #879 Review A) [V PR body].
- No email or name of A's on a shared screen (NS-10-R12). Held-screen copy is PROPOSED keys in `packages/content/src/features/account*.ts`; founder approves.
- Never say a recording is here when it is not (J-N2).

Device rows: S1-204 on two phones (`docs/qa/DEVICE_TEST_PLAN.md`), rewritten by `qa` (08-keeping.md section 3.6 row 6).

---

## Pack 4: Reminders and notifications (NS-13, NS-32, NS-46/47 days when locked, NS-48)

Owner `mobile` (reminders owner). Lenses `principal-architect` / `compliance-engineer` (`security-architect` on sign-out and cold-start). Skills: none beyond Pack 0.

| # | Read | Take |
|---|---|---|
| 1 | `09-capture.md` (lock) NS-13 rows R1 to R33 | Back-off, never-list, one a day (R19), session end (R13 to R15) |
| 2 | `11-foundations.md` (lock) NS-32-R1 to R16; design `11-foundations.md` section 2 (line 54) | The notification budget; R1b two on a day fails today |
| 3 | `docs/tdd/new-scope/09-capture.md` sections 1.2 to 1.10 (lines 29 to 110) | Facts, test table, PR order |
| 4 | `docs/design/NOTIFICATIONS.md` | Existing notification design |
| 5 | `apps/mobile/src/lib/reminders/planner.ts:319` (key `${kind}:${isoDate}`), `scheduler.ts:322` (`forgetReminders`), `session.ts:57`, `prefs.ts` | Planner, scheduler, session end |
| 6 | `apps/mobile/src/lib/erase-everything.ts:84` | Erase calls `forgetReminders` |
| 7 | `apps/mobile/package.json:40` `expo-notifications ~57.0.21` | `categoryIdentifier` and `interruptionLevel` typed in `node_modules/expo-notifications/build/Notifications.types.d.ts` (design cites `:580, 694`) [U re-check] |

Tests to copy [V ls]: `test/reminders-never-list.test.ts` (#905), `reminders-session.test.ts`, `reminders-quiet-books.test.ts`, `reminders-erase.test.ts`, `reminders-planner.test.ts`, `reminders-switch.test.ts`, `next-ask.test.ts`.

Pitfalls:
- Two kinds on one date are two notes (key includes the kind). That is NS-32-R1b / NS-13-R19; P-3 (`budget.ts`) edits `planner.ts` first and PRs 3 to 5 follow it (09-capture.md section 1.9).
- Notification text must never carry a transcript word or, with names off, a child name (R6a, R6b); `PlanInput` has no text field (type test).
- Background limits: local notifications only; no background mode or `UIBackgroundModes` without a founder decision (`expo-native-module` section 4; BL-864).
- A cold-start tap lands on Home, not the Book (`scheduler.ts` comment, design 1.2); NS-13-R9 wants the Book.
- Reminders planned on a signed-out phone is a privacy defect; session end paths are three (local finish, under-18 stop, `SIGNED_OUT`).
- Words are PROPOSED. `content` owns 31 neutral lines (R2b).

Device rows: S1-135, J-N3 to J-N5, J-N19, J-N24 (09-capture.md section 1.9, PR 6).

---

## Pack 5: Keeping and letting go (NS-08 readiness, NS-09, NS-11, NS-12)

Owner `mobile` (`sync` for the server and backup notes). Lenses `principal-architect` / `data-steward` (NS-09), `security-architect` / `compliance-engineer` (NS-08).

| # | Read | Take |
|---|---|---|
| 1 | `08-keeping-and-trust.md` (lock) NS-09-R1 to R17, NS-08-R1 to R20 | Let go always finishes; backup readiness |
| 2 | `docs/tdd/new-scope/08-keeping.md` sections 2 and 4 (lines 28 to 95, 173 to 214) | Built facts; open rows R4a, R4b, R6, R9, R15; readiness R5 to R8 |
| 3 | `docs/adr/0024-owner-backup-v1.md`, `0027-kill-safe-recording-container.md` | Backup contract; recording container |
| 4 | `apps/mobile/src/lib/capture/let-it-go.logic.ts:29` (`letItGo`), `sweep.ts:56` (`runLaunchSweep`), `sweep.logic.ts` | Three steps; launch sweep after first frame, never awaited |
| 5 | `lib/sync/merge.ts:567-569` | Another phone's let-go marks `discarding` |
| 6 | `test/backup-gate.test.ts:56` | No profile sets `EXPO_PUBLIC_BACKUP=on` |

Tests to copy: `test/sweep.disk.test.ts` (titles already `[NS-09-R1][BL-923]` at `:288`), `test/sync-held-v8.test.ts`, `test/sync-two-phone.test.ts`, `test/helpers/expo-fs-standin.ts` (undeletable set), `test/auth-sign-out-wait.test.ts`; `[NS-08-R6]` landed in #874 (`e4501012`).

Pitfalls:
- Let it go: `review.tsx` ignores the result of `letItGo` (R4a, R4b open). `announce()` runs after `InteractionManager.runAfterInteractions` or VoiceOver reads nothing (design 2.2).
- The count lives in `settings` (`discard.failures.<id>`), removed in the same transaction as the row, in three places (design 2.2 R15).
- `held.discard` may not run on production (`app.held_sync` off, U3): R7 and R8 pass on the stand-in only. Say so in the PR (design 2.7).
- Backup stays off in every profile; `scribe-keys` is excluded from autolinking (`apps/mobile/package.json:96`) [V]. A child's voice leaving the phone needs the X2 read first.
- Banned claim forms for backup copy ("never lose", "safe in the cloud", "free backup") are enforced by the backup claims rule in `packages/content/test/claims-capabilities.test.ts` (block from line 206) [V line, rule text read in part].
