# Checks and balances: how quality stays honest

Owner: qa. Written 20 Nov 2026 for the execution-readiness run. Docs only; nothing here changes code, a workflow or a rule that is already ruled.
Tags: [V] verified (file and line, sha or command output), [E] estimate with its basis, [U] unverified, Rec = a proposal with its basis. The locked cards at `450bcb4a` win over this file; `14-test-plan.md` wins over our designs.

## 0. What this file is for

Engineers (mostly agents) build to the rows in the four `TEST-CASE-CATALOGUE-*.md` files. Reviewers use this file to tell a test that proves a row from a test that cannot fail. The founder needs one sentence: a green build means a row is proven only when its test went red on the old code, died to its mutant, and says so in the PR body.

Card revision covered: locked pack v1.0 at `450bcb4a`; the newer inputs branch (`40c6eb4a`, cards 19, 21, 27 locked rev 2, PRs #934 and #935) is not reconciled.

Real figure: 36 tested, not 39: 3 of trace's "tested" rows (NS-01-R4, NS-01-R9a, NS-07-C28-13) come from trace's own fixtures (`scripts/trace.test.mjs`) and are not citations in app tests [V, grep of bracketed ids outside `scripts/`].

Where we start (to reproduce: check out develop `16e61549`, put the cards from `450bcb4a` and its `14-test-plan.md` in one folder, run `node scripts/trace.mjs --no-write --register <folder>/14-test-plan.md --out <file>`; its NS section prints the 296 / 39 / 13 / 244 / 269 counts. The baseline of 8 files and 73 tests comes from the #835 to #838 reviews' full `apps/mobile` runs; I did not re-run it [U]): 296 P0 rows; 39 tested, 13 named only as a device row, 244 untested; 269 with no backlog row [V, command output, 20 Nov]. The cites that exist are not yet checked against C-01; see section 9.

## 1. The six facts that shaped these rules

Each one is a defect a reviewer found in the photo stack, quoted from the PR comments (principal-architect reviews, 20 Nov).

| # | What went wrong | Where | The rule it makes |
|---|---|---|---|
| F1 | The flag-off proof stayed green with the switch check deleted, because in Node the native module is always absent, so a second guard returned early | #837 Review A at d0a04fe1, must-fix 1: `device.ts:59` check removed, 78 of 78 pass [V, PR comment] | C-05 |
| F2 | The erase test ran on an empty file store: two mutants of NS-01-R16c survived, so a P0 row had no test that could fail | #835 Review B at 447611c2, must-fix 1 [V, PR comment] | C-06 |
| F3 | A frozen object was compared with itself and never passed to any photo function; the store under test had no `entries` table | #839 Review A at 2d3994e7, must-fix 1 (NS-01-R8, mutant P1 stayed green over 167 tests) [V, PR comment] | C-07 |
| F4 | Four calls that the PR added (`discardPendingPhoto` in Close, Let it go, Home focus; `commitPendingPhoto` in Keep) had no test that fails without them | #838 Review A at 0f253840, must-fix 1 [V, PR comment] | C-04, C-08 |
| F5 | A test named "drops the JFIF thumbnail" never checked it, and a take-back test never reached the take-back | #836 Review B at 68d82717, must-fix 1 and 2 (mutants S4, S7, C2, C4 survived) [V, PR comment] | C-03, C-09 |
| F6 | A test of "the prompt does not depend on the picture" built three pictures and never passed them to `selectPrompt`; a source parse took 10 to 19 s against vitest's 5 s default and failed when the runner was loaded | #838 Review A, notes N1 and N2 [V, PR comment] | C-09, C-14 |

Two more patterns come from develop itself. A test cites a row in parentheses, `(NS-10-R3)`, so trace does not see it (`apps/mobile/test/account-scope.test.ts:47` [V]). A test whose title cites `[NS-33-R4]` scans source for truncation while the row also asks for 44 pt and a phone run (`a11y-ax5.test.ts:73` against the card, `docs/product/prd/11-foundations.md:265` [V]).

## 2. Rules for a test that proves a row

Status of the C-nn rules: all of them, and the refuse list in section 8, are Rec (qa proposals built from the reviews and the rulings cited). Only ruling T1 (C-01), CODE-R02 to R04 and CR-63 are already ruled. Adopting them is for Karma and the stewards.

**C-01 One cite means the whole row (ruling T1 of P-8).** A test puts `[NS-nn-Rn]` in its title only if it fails when any clause of that row's Given, When, Then is broken. A set of tests may prove a row together: each cites the row, and exactly one of them (the one nearest the others) carries a set comment. A partial test cites nothing; it uses its own backlog id. How P-8 applied it: `docs/agents/checkins/qa-p8.md:2` [V]; PR #888 body, row NS-09-R3 [V]; the comment is at `apps/mobile/test/sweep.disk.test.ts:416` [V].

Set comment, exact form (Rec; copies the form already merged):
```
// NS-09-R3 is proven by this set together, each citing it: <file>:<line> (<what it proves>) and <file>:<line> (<what it proves>)
```
A reviewer checks the set by union: list every clause of the row, tick each against one member. An unticked clause means the row is partial and the cite comes off.

**C-02 Title form.** `[NS-nn-Rn] <what the parent would see or what must not happen>`; the card's title column is the source. More ids go in more brackets, `[NS-01-R4][NX-39-R14] ...`. Never parentheses, never a comma list in one bracket (trace reads brackets only: `scripts/trace.mjs:533` [V]). A row with a letter suffix (`R4a`, `R4b`) cites its own suffix: the card title for NS-09-R4b says `[NS-09-R4]` (`docs/product/prd/08-keeping-and-trust.md:304` [V]); the catalogue uses `[NS-09-R4b]` and the card needs the fix (section 10, conflict 1).

**C-03 Fail-before evidence.** Every behaviour change and every new P0 test ships with proof that the test is red on the old code (CODE-R04, `docs/engineering/01-code-and-change.md:35` [V]). Three accepted forms, in this order of strength:
1. The test runs red on `origin/develop` source (`git checkout origin/develop -- <changed source files>`, run, restore). Paste the failing assertion line.
2. The one removed line: delete the new line of source, run, paste the failing assertion, restore. Use when the change is new code with no old version.
3. A recorded mutant (C-05) that undoes the change.
Not accepted: "the test is new, so it failed before the code existed" (a missing import is not a failing assertion); a screenshot; a run on a different branch.

**C-04 Every added call has a test that dies without it.** For each call, branch or guard a PR adds, there is a mutant that deletes it and a test that goes red (F4). A screen that needs five calls on leave paths moves them into one tested function, for example `leaveCapture()`, so a test pins one thing (reviewer suggestion at #838, Must fix 1 [V]).

**C-05 Mutation check by hand (all P0 rows, now).** The catalogue gives one starting mutant per row, not one per clause. The author applies each mutant alone, runs only the named test files, sees red, restores, and pastes a table. Minimum per row: the catalogue's mutant plus one more for every further clause the row has (the author adds them; the reviewer checks the count against the card row); for a number or ceiling, one mutant on each side (`140`, `141`, `139`); for a flag, the switch check removed while every other guard stands (F1). Table form in the PR body (it is the form the reviewers already use):
```
| Row | Mutant (file:line, what changed) | Files run | Result (red at <file>:<line>) |
```
Restore evidence: `git diff --stat` empty for source after the last mutant. The reviewer re-runs at least two mutants of their choice, one of them from the author's table and one of their own (as in #835: 28 mutants; #836: G1 to G9; #837: M1 to M11 [V]).
A surviving mutant is a Must fix. It is never explained away in the PR body.

**C-06 Seed before you erase (preconditions).** A test that proves absence (deleted, erased, not written, not found) first asserts the thing exists, then acts, then asserts it is gone. The arrange step uses the real store on node SQLite and a real file in the temp disk, not an empty store (F2). Add `expect(fileExists).toBe(true)` before the act.

**C-07 The code under test must receive the input.** A fixture is passed to the function or store being tested; a comparison of a value with a copy of itself, or a spy that is never wired in, is refused (F3). For "byte-identical before and after", read the row from the real table before and after and compare every named column.

**C-08 Flag and switch proofs stand the other guards up.** To prove a switch off removes a behaviour, make every other reason for the behaviour to be absent untrue: the native module present, the permission granted, the remote config reachable. Then run three cases: switch off with everything else present (nothing happens), switch on with everything present (it happens), switch on with one other guard missing (nothing). The first case fails when the switch check is deleted (F1). Reset module latches between cases (`vi.resetModules()`).

**C-09 A source scan has a positive control and a mutant.** A scan that finds nothing proves nothing until the same scan is shown to find a planted example. Every `S` line of the catalogue names the planted fixture (a string, a call, an import) that must make the scan fail. Scans parse with a plain text pre-filter first and set an explicit timeout when they parse with the TypeScript compiler (F6). A scan that checks a call exists (`toContain('letItGo(')`) is not a proof of behaviour; pair it with a behaviour test and cite both as a set (C-01).

**C-10 No test against a stand-in without saying so.** A test that runs against a fake server, an in-memory store, a fake clock for a thing the row needs real, or Node where the row needs a phone, carries `[stand-in]` in its title. Trace then counts the row **partial**, not tested (`scripts/trace.mjs:523, 626, 689` [V]); the row stays "partly built" until a real run passes (`14-test-plan.md:28` [V]). Typical stand-ins: the two-phone rows (NS-09-R8, NS-10-R6), RN heading level (design P7: React Native on iOS carries no level, Unverified, `docs/tdd/new-scope/11-foundations.md:349` [V]), the native image cap.

**C-11 Fixtures.** Asha only (CLAUDE.md privacy rules). Shared helpers live in `apps/mobile/test/helpers/`; the sync and server fixtures in `supabase/tests/`. A canary string for log tests is a made-up word that cannot occur in any string table. `packages/content/test/no-real-family-data.test.ts` runs on every PR [V, file listing]; it stores hashes only.

**C-12 Determinism.** No `Date.now()`, `new Date()` or time zone read inside a test body without an injected clock; no sleeps; no network; no random without a seed. Fuzz runs use `SCRIBE_FUZZ_SEED` (`.github/README.md` fuzz paragraph [V]); a failure prints its seed and run count and the author reproduces with them.

## 3. Flake policy

1. A test that fails once and passes on rerun is a defect in the test or the code, never "CI noise". No retry wrapper is added to any suite (Rec; CODE-R03 forbids loosening: `01-code-and-change.md:33` [V]).
2. Within one working day the author of the flaky test (or the lane that owns the file) reproduces it with the printed seed, or with `--repeat` style loops, finds the cause and fixes the cause. The fix is its own commit with the reason in the PR body (CODE-R03).
3. While it is open a backlog row names the test and the cause hypothesis. The test stays on; it is not skipped. Skips are caught by `scripts/qa/skip-guard.mjs` [V, file listing]; adding one is a refusal item (section 8).
4. Hunting: qa reruns each suite with new fuzz seeds weekly and before every store candidate (charter, standing duty 2). A run that fails under a new seed is a bug report with the seed.
5. Timing causes first: an unbounded wait, a real clock, a shared temp path, test order. The AST scan at #838 N1 is the pattern: fix with a pre-filter and an explicit timeout, never by raising the default for everyone.

## 4. Timing and size limits (all Rec unless a source is cited)

| Thing | Limit | Basis |
|---|---|---|
| CI end to end | under 10 minutes for the Linux jobs (the macOS simulator job takes about 20 minutes and is outside this budget [E, reviewer figure]); split a slow job, do not raise its timeout | qa charter; `.github/README.md:63` "Keeping CI under 10 minutes" [V] |
| One unit test | under 200 ms typical; vitest default 5 s is the ceiling | Rec; F6 shows the default bites under load |
| One integration test on node SQLite | under 2 s | Rec |
| A parse of all of `src` | set the timeout in the test (15 s) and pre-filter by text | #838 N1 [V, PR comment] |
| A new mutant run (hand) | the named files only; under 60 s | Rec |
| PR size | 400 changed lines and 20 files, not counting lockfile, generated files, test data (CODE-R02) | `01-code-and-change.md:31` [V] |
| New function / file | about 50 / 300 lines; files already over (`store.ts` 1,380 at the stack top) must not grow (CODE-R06) | `01-code-and-change.md:41` [V]; #839 N3 says store.ts grew 21 lines [V, PR comment] |
| One test file | under 400 lines; split by row group | Rec |
| Evidence file | one per run at `docs/qa/evidence/<date>-<build>-<phone>.md` | `14-test-plan.md:90` [V] |

## 5. Mutation checks: by hand now, in CI later

**Now (by hand).** C-05. The catalogue's "Mutant that must turn it red" column is the starting list; the author adds more for any clause it misses.

**Later (Rec, after the library review RD-F; install nothing before).** A small custom runner is the cheaper first step, because every P0 mutant here is a one-line change in a known file:
1. `docs/qa/mutants/<card>.json`: `{ row, file, find, replace, tests: [files] }`, one record per catalogue mutant.
2. `scripts/qa/mutate.mjs` (about 80 lines): copy the file to a temp name, apply find and replace once, run only the named test files with vitest, expect a non-zero exit, restore in a `finally`, print survivors, exit 1 on a survivor.
3. Run nightly and on any PR that touches a file a record names, not on every PR. Budget: under 5 minutes for the P0 set [E: about 300 records at under 1 s of vitest each when only one file runs, unmeasured].
4. A general tool (Stryker or an equivalent) is considered only when RD-F has checked the vitest runner, React Native files and licence. Unverified: whether it handles `apps/mobile` under Expo SDK 57 without a custom transform [U].
A surviving record blocks gate G7 (section 7) for its row.

## 6. The trace ratchet (BL-964 follows)

Rec: `scripts/trace.mjs --check` for NS rows fails a PR when (a) the count of untested P0 rows rises, (b) a bracketed id is defined nowhere, (c) a P0 row is dropped from `14-test-plan.md` section 7 without the card changing, or (d) a title cites a row that the PR's own catalogue line marks GAP. Report mode stays the default until the founder decides (07 Q8, `docs/TRACE.md` headline paragraph [V]). `#878` already prints each NS P0 row as tested, partial, journey, device or untested [V, `trace.mjs:689`].

## 7. The gates, G0 to G11 and what each blocks

G0 to G6 are locked (`14-test-plan.md:96`, "Gates, in order" [V]). G7 to G11 are proposals (Rec) that name checks which already exist or are planned, so they can be read in one list; adopt or change them in the next docs PR. Note: "G11" in card 07 is a research-gap id (`NS-07-G11`, the label guard), not a gate in this list.

| Gate | What must be true | Blocks | Source |
|---|---|---|---|
| G0 | `trace.mjs` sees NS ids; every P0 row has a test and a backlog row | any NS flag on outside the founder's family | 14:96 [V]; BL-964 |
| G1 | On-device data rules (ADR 0028, PR #797) and the export schema they need are merged | any picture, seal or first written on a store build | 14:96 [V] |
| G2 | The counsel reads each card names are on file | the store build that carries that card | 14:96 [V] |
| G3 | The founder has approved the words | the flag that shows them | 14:96 [V] |
| G4 | Every P0 device row passes on the candidate (waivers: 14 section 6) | the store build | 14:96, 98 [V] |
| G5 | Privacy label and claims inventory match what the build sends | the store build | 14:96 [V] |
| G6 | No `production` flag is on while its card has an open P0 | the store build, via `preflight-production` | 14:96 [V]; no row for `EXPO_PUBLIC_PHOTOS` today, #837 note N1 [V, PR comment] |
| G7 (Rec) | A PR into `develop`: CI `required`, compliance-fence and applied-migrations-unchanged green; typecheck, content tests, `test:db` and `test:functions` when their paths change; C-03 and C-05 evidence in the PR body. The sandbox baseline (8 files, 73 tests red, 5 known tsc errors) is a rule for agents working in the sandbox, checked by reviewers; CI has no such baseline and is not a gate on it | the merge (CR-63 review plus CI, D-132) | `docs/agents/cto/RULINGS.md:594`; `docs/DECISIONS.md:655` [V] |
| G8 (Rec) | Applied production migrations recorded (`.github/migrations-applied.txt`, `supabase/APPLY.md`) | a release PR and tag | plan P-7 "release gate G8", `17-engineering-project-plan.md:266` [V, plan refreshed to 458fae46] |
| G9 (Rec) | Mutant list green for every P0 row the build carries (section 5), once the runner exists | a store candidate | this file |
| G10 (Rec) | Performance and accessibility numbers recorded against the budgets (NS-34 run sheet), each met or missed; a miss holds the feature (NS-34-R2) | the feature, then the build | card `docs/product/prd/11-foundations.md:416` [V] |
| G11 (Rec) | Upgrade test: last store build to candidate with a seeded 1,000-letter Asha book; export round trip on the old and new schema | a store candidate | 14:42 "Every store candidate" [V] |

## 8. What a reviewer must refuse (Rec)

Refuse and mark CHANGES (a must-fix, so the verdict cannot be `PASS WITH NOTES`: CR-63, `RULINGS.md:594` [V]) when any of these is true:
1. A test cites a row it does not wholly prove and is not part of a labelled set (C-01).
2. A P0 row has no recorded mutant table, or a mutant survived (C-05).
3. The test passes with the line it claims to prove deleted (C-03, F1).
4. The arrange step builds an empty store for an absence proof (C-06, F2).
5. The fixture never reaches the code under test (C-07, F3).
6. A call the PR adds has no test that dies without it (C-04, F4).
7. A scan has no positive control (C-09).
8. A stand-in is not titled as one (C-10).
9. `skip`, `todo`, `only`, a loosened assertion, a longer timeout to hide slowness, or a deleted test (CODE-R03; `scripts/qa/skip-guard.mjs`).
10. A real name, letter, picture or voice in a fixture, screenshot, log or trace (CLAUDE.md; NS-01-R62, NS-34-R5).
11. A string a parent reads that is not a PROPOSED content key and does not pass `npm test -w packages/content`.
12. A new `console.*`, log, breadcrumb or analytics call that carries content or a path (OBS-R02; `ENFORCEMENT.md` row [V]).
13. More than 400 changed lines or 20 files without `Size exception:` in the body (CODE-R02).
14. The PR claims "device" proof without an evidence file on an Asha install (`14-test-plan.md:90` [V]).
15. A flag on in `production` with an open P0 on its card (G6).

## 9. Review checklist, lens A and lens B

Two independent reviews count (CR-44, named at `docs/agents/cto/RULINGS.md:580`, and D-107, `docs/DECISIONS.md:630` [V]; the text of CR-44 itself was not found [U]); a review's first line is `## Review A|B at <40-char sha>: PASS | PASS WITH NOTES | CHANGES`, and `PASS WITH NOTES` counts only with `Must fix: none.` (CR-63 [V]). In the photo stack the lenses were: A = tests that fail on old code, correctness, shape, data lifecycle; B = privacy or security, accessibility, code shape (#835 to #840 [V, PR comments]). The checklist below fixes what each lens must tick, whoever holds it.

**Lens A: does the test prove the row, and does the data stay whole?**
- [ ] Read the head sha from the API at the start and before posting (reviews do this: #837 round 2 [V]).
- [ ] For every row in `Satisfies:`, open the catalogue line; the test title matches the card; C-01 holds.
- [ ] Fail-before evidence present for each new test (C-03); I re-ran one.
- [ ] Mutant table present; I applied two, one of them my own (C-05).
- [ ] Absence proofs seed first (C-06); fixtures reach the code (C-07); flag proofs stand other guards up (C-08).
- [ ] Data: migration order, grants, classification, trigger tuples, erase and let-go paths, sweeps on the real store (chapters 03 and 04).
- [ ] Sandbox baseline unchanged: 8 files, 73 tests red, nothing new; `tsc` 5 known errors; `npm test -w packages/content` passes (as run in #835 to #838 reviews [V]).
- [ ] Size and shape (CODE-R02, R06, R09).

**Lens B: what leaves the phone, who can read it, who can use it?**
- [ ] No content in logs, analytics, crash, URLs or notifications; the canary test names the new fields (NS-01-R51, NS-02-R15).
- [ ] No new network call; nothing donated to the system (`[X6-R1]` scan covers the new files).
- [ ] Second account, sign-out, erase, deletion and export paths read for the new data (`[X4-R1]`).
- [ ] Switch and remote-pause behaviour: screens go, data rights stay (NS-01-R19).
- [ ] VoiceOver order and states, 44 pt, AX5, Reduce Motion, contrast through tokens, Smart Invert, dark mode; each as a unit test where it can be, else a device row on the run sheet.
- [ ] Words a parent reads are PROPOSED content keys and the PR has `needs:founder`.
- [ ] What only a phone can prove is listed under "Not verified" (every merged review did).

## 10. Conflicts and card defects sent to product

1. NS-09-R4b: the card's test title says `[NS-09-R4]` (`docs/product/prd/08-keeping-and-trust.md:304`); the row id is R4b. Fix the title or the id.
2. NS-36-R4 and NS-36-R6 carry no test title ("the acceptance record", "inventory check", card `docs/product/prd/11-foundations.md:678, 680`); trace cannot cite them. Rec titles are in catalogue A.
3. NS-32-R4b says plan notices up to 4 plus 60 budgeted, 64 in all; the design keeps 60 in total (`docs/tdd/new-scope/11-foundations.md:343`, Conflict P1). Reword the Given before anyone writes the test.
4. NS-01-R50, NS-21-R12 and NS-06-A22 say "off, or the row stays open". A row cannot go green by an open finding. Rec: the test asserts the native prop; if React Native has none, the test is titled `[stand-in]` and the row stays partial.
5. NS-33-R16 (P0) needs an XCUITest audit that no harness provides (`docs/tdd/new-scope/11-foundations.md:334`). Until it exists the stand-in is a hand run of Accessibility Inspector, recorded as `[stand-in]`.
6. NS-33-R1 asks for a level 1 heading; React Native on iOS carries no level (`docs/tdd/new-scope/11-foundations.md:349`, P7, Unverified). The best test is the heading role plus a device read; the title says so.

## 11. Samples checked for this file

Cites sampled and checked: 49 file and line cites, checked by a script that opens each file and matches the line (49 held), plus 6 reviewer passages read in full from PR #835 to #839 comments. Not checked: PR comment text beyond the quoted passages; `ENFORCEMENT.md` rows after the first 60 lines; the P-8 ruling's own text (only its application in `qa-p8.md` and PR #888 was read) [U].
