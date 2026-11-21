# Knowledge packs, part 2: lanes 6 to 10 and reviewer batching (RD-G, 3 of 5)

Author: `ai-eng-lead`, 20 Nov 2026. `develop` at `16e61549`. Docs only. Part 1 is `KNOWLEDGE-PACKS.md` (Pack 0 is read on every run, and the list of designs' stale Facts is its section P-0.4). Tags [V], [E], [U] as in part 1.

---

## Pack 6: Capture and typed days (NS-13 captured in Pack 4; NS-14 to NS-20, NS-04, NS-35, NS-18)

Owner `mobile`. Lenses `principal-architect` / `compliance-engineer`. Wave 1 has no new capture row; waves 3 and 4 do (#847 sections 2.5, 2.6). This pack is for the first run that touches `startCapture`, the Home slips or typed days, and for the NS-04 spike. Skills: none; `expo-native-module` if hands-free adds Swift.

| # | Read | Take |
|---|---|---|
| 1 | `09-capture.md` (lock) NS-14, NS-15, NS-18 rows; `04-hands-free-capture-spike.md` EX-3 | Whose book, a letter for another day, typed days; no `UIBackgroundModes` without the founder |
| 2 | `docs/tdd/new-scope/09-capture.md` sections 2 to 4 (lines 128 to 164) | Outlines for NS-14, NS-15, NS-04 spike |
| 3 | `docs/tdd/new-scope/architecture.md` AP-2, AP-10, AP-12 (lines 124, 132, 134 area) | One capture entry; fail-closed registries; one shared letter-word text field |
| 4 | `docs/design/e2e/A-capture/DESIGN.md`, `MOTION.md` (branch `docs/e2e-ux-20nov`, 9e78eecd) | Screens A-S01 to A-S14 and their states; T-SHEET, T-COVER, T-LAUNCH [U: INDEX read, area files not read] |
| 5 | `apps/mobile/src/lib/capture/start-capture.ts:24` (`startCapture`), `start-capture.logic.ts:18-22` (`HOME_CAPTURE_SOURCES`, `CAPTURE_SOURCES`) | A new source is added in the PR of its handler |
| 6 | `lib/capture/busy.ts:20, 25` (`captureBusy`, `onCaptureBusy`) | Nothing decodes or regenerates while a take runs |
| 7 | `lib/capture/sweep.ts:56`, `app/_layout.tsx:194` (per AP-7) | Launch sweep after first frame, not awaited |

Tests to copy: `test/navigation-one-entry.test.ts:198, 234` (fails on any other push of `/listen` or `/write`; it proves it can fail), `test/no-system-indexing.test.ts:104`, `test/sweep.disk.test.ts`.

Pitfalls:
- Only Home starts a letter (NS-35, built #828). Doorways are reserved sources; a doorway lands through `app/+native-intent.tsx` (AP-2).
- Every field whose text becomes a letter's words uses one shared input with a letter variant (AP-12): writing tools (ruling D2), `[X6-R1]`, autocorrect set once. React Native 0.86.3 has no prop for the system writing tools (README of `docs/tdd/new-scope`, finding table) [V quoted from README].
- No machine writes a person's words. Typed-day words, From name and a spoken-for-by name are the person's.
- Time: a Home slip must register (AP-10); an unregistered slip fails the `[FRAME-SLIP]` test.
- Hands-free is a spike with no ship date; do not wire a background mode (BL-864).

---

## Pack 7: Reading, family and share (NS-21 to NS-31, NS-05, NS-06)

Owner `mobile`; `design-systems` for `components/ui/**` (`ListSection titleLevel`, D1). Lenses `principal-architect` / `design-systems`; `security-architect` for share and seal. Wave 2: NS-21. Wave 3: NS-22, 23, 05.

| # | Read | Take |
|---|---|---|
| 1 | `10-reading-and-family.md` (lock) NS-21-R1 to R14 | Fixed row order, who can read it, no author controls on another parent's letter (R11), writing tools (R12), no donation (R13) |
| 2 | `docs/tdd/new-scope/10-reading-and-family.md` sections 1.1 to 1.12 (lines 27 to 106) | Row model `LETTER_ROWS`, PR order; conflicts C1 (R9 beats R10), C2 (picture stays after the words), C4 (confirm with `product`) |
| 3 | `docs/design/e2e/B-book-and-reading/DESIGN.md`, `MOTION.md`, `WORDS.md` | Screens and motion (B area) [U: not read] |
| 4 | `apps/mobile/src/app/letter/[id].tsx:219` (dateline heading, BL-928), `:127`, `:413`, `:458` per design | The page today; `own &&` hides a list from the other parent |
| 5 | `apps/mobile/src/components/ui/list-row.tsx` (`ListSection` title heading, `min-h-11`) | Use the library row; do not hand-roll (mobile charter "Never") |
| 6 | `apps/mobile/src/lib/family/` (`members.logic.ts`, `share.ts`, `entry.logic.ts`) and `lib/store.ts` `listMembers` | Other readers of a book |
| 7 | `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md`, `04-FIRSTS-AND-SEALED-11nov.md` | Specs for NS-05 and NS-06 |
| 8 | Seal rule: `10-reading-and-family.md` section 5; architecture.md AP-11 | One `isOpen(entry, nowUtc)` in `packages/core` plus the SQL expression, with a parity test |

Tests to copy: `test/no-system-indexing.test.ts` for the `[X6-R1]` scan (extended by #868, `4234fe1c`); `components/book/letter-words.logic.ts` and its `.test.ts` for the pure-model-plus-test shape; server `supabase/tests/rls.test.mjs` and `security_family.test.mjs` for author-only rules.

Pitfalls:
- Heading levels: a source scan of `letter/[id].tsx` and the list title (design 1.10), a web journey for `getByRole('heading', {level})`, and a rotor walk on SE 3 (device). The Node test cannot prove a rotor.
- `toggleInBook` ignores the boolean from `setEntryInBook` and shows the new state on a failed write (design 1.2 Fact; card s6 Failed row forbids) [U re-check on `develop`].
- The Share slot is empty until NS-05 passes its own predicate (`lib/share/eligibility.ts`, not yet on `develop`) [V ls shows no `lib/share`].
- Sealed letters and Firsts need the opening rule in two places (phone, SQL) in one PR (NSC-09); an Find clause lands with them.
- Words are PROPOSED: `letterPage.*` keys in `packages/content/src/features/letter-page.en.ts` (design 1.3). Content PR merges first (conflict C5).

---

## Pack 8: Foundations: accessibility, speed budgets, data rules (NS-33, NS-34, NS-36, NS-37, NS-35)

Owners: `design-systems` (BL-927, tokens), `mobile` (BL-928, BL-984), `qa` (BL-929, BL-930, device sheets), `privacy` and `data-architect` (NS-36). Lenses vary; all BL-927/928/930 rows have `design-systems`, `qa` or `principal-architect` as A or B (#847 section 2.3).

| # | Read | Take |
|---|---|---|
| 1 | `11-foundations.md` (lock) NS-33-R1 to R16, NS-34-R1 to R8, NS-37-R1 to R8 | P0: NS-33 R1 to R10, R12, R15, R16; NS-37 R2, R4, R5 |
| 2 | `docs/tdd/new-scope/11-foundations.md` sections 3 and 4 (lines 86 to 172) | Fixes by row; the NS-34 target table and rules |
| 3 | `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` (BL-927, #867) | Each fix by file and line |
| 4 | `docs/design/system/FOUNDATIONS.md`, `COMPONENTS.md`, `MOTION.md`, `tokens.v2.json` (branch `docs/e2e-ux-20nov`) | New tokens (not merged): [U: not read] |
| 5 | `docs/qa/DEVICE_TEST_PLAN.md:31` (S1-204 row) and `:85` (S1-03 60 fps frame count) | The run-sheet shape |
| 6 | `apps/mobile/src/components/ui/text.tsx:16, 101` (`asHeading`), `lamp.tsx:129` (`useReducedMotion`), `fonts.ts:72` (`faceForClassName`) | Heading role, Reduce Motion, weight-to-face map |
| 7 | `packages/design-tokens/test/tokens.test.ts:90-113` | Contrast tests copy this shape |
| 8 | `docs/design/specs/NS-33-...` plus `docs/tdd/09-accessibility-design-system.md` | Existing a11y design |

Tests to copy: `test/toast-large-text.test.ts` (BL-927, #877), `a11y.logic.test.ts` (`src/lib/a11y.logic.test.ts`), `test/a11y-headings.test.ts` (named in design, [U exists]).

Pitfalls:
- A Node timing test is a tripwire, never evidence for a speed row (11-foundations.md section 4 "Rules"). A missed or unmeasured row holds its feature (NS-34-R2).
- No `perf` EAS profile, no markers (AP-8): an SE 3 run by hand. `apps/mobile/src/dev/asha-seed.ts` holds a few letters, not a 1,000-letter, 300-picture book [V ls and design].
- Bold Text is read nowhere (`faceForClassName` maps weight utilities only) and Tiro Devanagari has no bold face; do a device check first (BL-984).
- Do not claim accessibility features to the App Store until the walk passes (design OQ default: none).
- `accessibilityIgnoresInvertColors` is set nowhere; `PhotoFrame` and the cover symbol need it (R11).
- Separate the proof: CI proves the text, token or source scan; a phone proves VoiceOver, AX5 layout, Voice Control, thermal, battery.

---

## Pack 9: Data and sync (local migrations, server migrations, contracts)

Owner: `data-architect` (migrations, RLS, tests), `sync` (contracts, engine, functions), `mobile` for phone migrations. Lenses `data-steward` / `security-architect`. Skills: none; read chapters 02 and 03 by rule id.

| # | Read | Take |
|---|---|---|
| 1 | `docs/tdd/new-scope/data-and-sync.md` sections 1, 2.1 to 2.6 (lines 22 to 84) | Register of phone migrations L11 to L15, server S1 to S5, field groups, export, erase |
| 2 | Same file section 6 (line 150) | F4: CI has never migrated staging or production; checklist |
| 3 | `docs/engineering/03-database-and-schema.md`, `02-api-and-contracts.md` by rule id | Migration, grant and contract rules |
| 4 | `docs/adr/0025-sync-protocol-v1.md`, `0028-photo-seal-find-on-device-data.md` | Protocol; on-device data |
| 5 | `apps/mobile/src/lib/db/migrations.ts:57` (`MIGRATIONS`), `:393` (v10, newest on `develop`), `:430` (`LATEST_VERSION`) | Append the next number; defaults only |
| 6 | `apps/mobile/src/lib/sync/merge.ts:567-569, 622-643` | Pull handling; an own row with no queued op takes server values |
| 7 | `supabase/APPLY.md`, `.github/migrations-applied.txt` | Never edit an applied migration (CLAUDE.md; migration guard) |
| 8 | `supabase/tests/grants.mjs`, `function_rpc_contract.test.mjs`, `sync_v1_server.test.mjs`, `v1_wire_contract.test.mjs` | Where grants and the wire contract are tested |
| 9 | `packages/api/src/server/sync.ts`, `packages/api/test/contract-drift.test.ts:93` | Closed codes; SQLSTATE rules drift test |

Tests to copy: `test/migrations.v9.test.ts` and `test/migrations.test.ts:247` (every earlier schema migrates with row counts and hashes unchanged); `test/sync-two-phone.test.ts` with `test/helpers/sync-v1-standin.ts`.

Pitfalls:
- Local latest is v10 on `develop`; v11 is in #835. CR-64 decides it ships with or without `EXPO_PUBLIC_PHOTOS` (`RULINGS.md:610`) [V].
- A local mirror of a synced column also clears `sync_books.cursor` so the next pull re-reads (AP-3); test that an old row gains the value after one pull (AX-6).
- Every new table, view or function in `public` needs its grant in its own migration and in `supabase/tests/grants.mjs` (CLAUDE.md).
- New SQLSTATE: add to the chapter 02 registry and `SQLSTATE_RULES` in the same PR; the drift test fails otherwise.
- `raw_transcript` is immutable by trigger; no cascade across authors.
- Agents never apply a migration or touch a remote project; D-041: red-team plus the founder's `approve-migration` label. Say so in the PR.
- Production may not run `held.discard` (U3 in design 08-keeping.md): do not claim server behaviour you read only in a file.

---

## Pack 10: Platform, CI and release (NS-07 gates, flags, BL-958, BL-964, BL-975)

Owner `ops` (flags, preflight, `docs/ops/**`), `qa` (trace, harness). Workflow edits are proposals under `docs/ops/proposed/` for the founder. Lenses `security-architect` / `principal-architect` (flags), `compliance-engineer` / `security-architect` (label guard). Skills: `review-gate`, `stacked-prs`.

| # | Read | Take |
|---|---|---|
| 1 | `docs/engineering/ENFORCEMENT.md`, `docs/ops/RELEASE.md`, `docs/release/ENVIRONMENTS.md` | What CI enforces; release shape |
| 2 | `docs/tdd/new-scope/architecture.md` AP-1 (line 123) | Flags: literal `process.env.EXPO_PUBLIC_*` in `capabilities.ts`; `capabilities.test.ts:242` pins the list |
| 3 | `apps/mobile/src/lib/capabilities.ts:115` (`parseServerFeatures`), `:186` (`buildFlagEnabled`), `:266` (`mayRun`) | Build flags and kill switches; a pause only stops |
| 4 | `apps/mobile/scripts/preflight-production.mjs:178-188`, `preflight-testflight.mjs`, `preflight-keepsafe.mjs` | Backup and flag checks; testflight preflight only warns |
| 5 | `scripts/agents/merge-queue.mjs:58-61, 72-74, 192-200` | WATCH-RED, WAIT-CI, WAIT-QUIET; native paths; macOS checks |
| 6 | `.github/workflows/ci.yml:13-15`, `.github/workflows/ios-compile.yml:46-48, 323-324` | Concurrency and cancel-in-progress; the 90-minute `launch` job on `macos-26` |
| 7 | `.claude/skills/review-gate/SKILL.md`, `stacked-prs/SKILL.md` | Review header; rebuild recipe |
| 8 | `docs/DEVELOPMENT.md:15` | Stacked PRs name their base; retarget on merge |
| 9 | `packages/api/src/remote-config.ts:57-60` (kill-switch keys) | Additive keys; unknown key must not break an older config |

Tests to copy: `apps/mobile/test/release-config.test.ts`, `test/store-flags.test.ts` (BL-958), `test/capabilities.test.ts`, `test/backup-gate.test.ts:56`.

Pitfalls:
- A native path or `package-lock.json` change makes the macOS checks required; a red macOS check holds the merge (`merge-queue.mjs` WATCH-RED). Batch native changes into one candidate (AP-4).
- A flag must be written out in full or Expo does not inline it; a flag in a JSON file cannot be inlined (AP-1 correction 1).
- Flags stay off in every store profile until the founder approves the words (G3). A pause key exists only where the card names one (AP-1 correction 2).
- Any new package with native iOS code: read `node_modules/<pkg>/ios` for permission calls first (`expo-native-module` section 4); new dependency needs the founder's approval (AIE-R21).
- Never push to `develop` or `main`; releases are tags, version only in `apps/mobile/version.json` (CLAUDE.md, once #109 lands).

---

## 11. Reviewer batching (the two scarce reviewers)

Rule: queue by boundary, not by PR number. [E] from #847 section 4.4 limits (2 runs a day each).

| Reviewer | Batch 1 (one sitting) | Batch 2 | Batch 3 |
|---|---|---|---|
| `security-architect` | Account boundary: BL-961 #871 and #879, BL-922a, BL-978a | Native: #842 hardening, #835 store, #837 picker, P-1 | Backup and flags: BL-976 follow-ups, BL-958, BL-962 |
| `data-steward` | Migrations: #835, BL-959, BL-868 | Rules tests: P-4a, P-4b, P-5 | Export: BL-933, BL-945 |
| `compliance-engineer` | Words and labels: BL-925, BL-965, BL-975 | Reminders: NS-13 PR 1 to 5 | Photo stored copy #836 |

Each batch shares one set of files to read, so the second review in a batch costs less (E). Reviews bind to the full head sha; a head that moves voids them (`review-gate` section 5; `HARNESS-GAPS.md` H4).

## 12. Cites checked

The count for all five files is at the end of `HARNESS-GAPS.md` (90 locations resolve; 63 read by hand; 60 held as written, 3 corrected). Not read in full: cards 21 to 27 (unlocked), `docs/design/e2e/*` and `docs/design/system/*` bodies, eval A to C bodies. Marked [U] where a line was not re-read.
