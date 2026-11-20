# BRIEF BL-964: the trace ratchet (gate G0) and trace.mjs reading `docs/product/prd`

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: the locked cards (ids NS-01 to NS-37, `14-test-plan.md` section 7) are on `develop`: #846 is a draft at `450bcb4a`, so develop's cards give only 55 P0 rows and print about 30 "NS id defined nowhere" lines for ids tests already cite [V trace run on develop]. Report mode (#878) is merged; the ratchet is the open part. Founder: whether `--check` blocks merges (07 Q8) and when #846 merges. Conflict to product: FR-QAL-02 wants `functions/*.md` and card 19 read too; they are UNLOCKED (inputs branch `bee01360`), so the ratchet reads only the locked cards 00 to 12 until product rules.**

```
BRIEF BL-964                                      Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: qa (owner of scripts/trace.mjs)   Lane: Pack 10 (+ qa)   Build: 13 (G0 is a store-build gate)   Wave: 1

1. GOAL: When a pull request makes the count of untested P0 rows rise, cites an id no card defines, or drops a P0 row from `14-test-plan.md` section 7 without the card changing, `node scripts/trace.mjs --check` exits 1 naming the ids; on `develop` as it stands it exits 0.

2. CARD ROWS and TEST TITLES: gate G0 (14-test-plan.md:96), council F1; BACKLOG BL-964 (locked pack BACKLOG.md:3811: "Fails on old code: trace.test.mjs gains a fixture card with one NS row").
   Tests in scripts/trace.test.mjs (exists; runs in root `npm test`, package.json:11 [V]):
     [G0] a P0 row that is new and untested fails --check            [G0] an existing untested P0 row only reports
     [G0] a cited NS id that no card defines fails --check            [G0] a P0 row dropped from section 7 with the card unchanged fails
     [G0] a lettered row (R9a), a split row (G11-1a), X4-R1 and FRAME-SLIP are all read
   Red on develop: `trace.mjs:27` "Report mode (default) never exits non-zero"; --check covers only the v2 ids (defined twice, cited but undefined).

3. FILES
   Touch: scripts/trace.mjs, scripts/trace.test.mjs, docs/ops/trace-baseline.json (new; the set of untested P0 ids, only shrinks), docs/TRACE.md (generated, `--no-write` in CI so only by hand), docs/agents/checkins/qa-bl-964.md
   Never: any card or `14-test-plan.md` (product's); test files (BRIEF P-8-9 retitles); `.github/workflows/**` (turning --check into a blocking step is the founder's paste; today `npm test` ends with `node scripts/trace.mjs --no-write`).
   Shared file: scripts/trace.mjs is also read by BRIEF QA-TITLES (title lint); whichever lands second merges develop.

4. READING PACK: Pack 10; CHECKS-AND-BALANCES.md sections 1, 6 (#924); CODE-QUALITY-GATES.md G3 (#930); trace.mjs header lines 1-30 and NS block lines 520-713; locked 14-test-plan.md sections 6 and 7 (`git show origin/docs/prd-lock-v1-20nov:docs/product/prd/14-test-plan.md`).

5. CODE ENTRY POINTS (verified at 16e61549)
   scripts/trace.mjs:27-28     "Report mode (default) never exits non-zero. --check exits 1 when an ID is defined in two specs or a cited ID is defined nowhere"
   scripts/trace.mjs:520-526   NS_SOURCE: NS, NX, X-nn-Rn, FRAME-SLIP shapes; `[stand-in]` makes a row partial
   scripts/trace.mjs:533       `nsBracketed`: test titles count only bracketed ids; :689 the report line
   scripts/trace.mjs:714-724   flags: --check, --no-write, --json, --out, --repo, --register (default docs/product/prd/14-test-plan.md)
   Today on develop: "246 acceptance rows in 13 cards, 55 P0: 14 tested, 0 partial, 6 device, 35 untested; 39 P0 with no backlog row" [V run]. The locked pack counts 296 P0: 39 tested, 13 device, 244 untested, 269 with no backlog row (CHECKS-AND-BALANCES.md line 10, run with --register at the lock [V by qa]).

6. DATA AND SECURITY: none. Reads docs and test titles, prints ids. Boundary: none. Fail closed: an unreadable register = exit 2, never pass. Privacy line: no test content in output.

7. LIBRARIES: none (Node built-ins).
8. BUDGETS: under 5 seconds (today about 1 s [V in MEASUREMENT-PLAN]).

9a. REVIEW B FIX: "only shrinks" must be enforced, not promised: the author of a PR can edit `docs/ops/trace-baseline.json` in the same PR. So `--check` compares the baseline with the BASE branch's copy (`git show origin/<base>:docs/ops/trace-baseline.json`) and fails when any id was added. Mutant test: `[G0] a PR that adds an id to the baseline fails --check` (red if the base comparison is removed).
9. ACCEPTANCE: the four rules (a) to (d) of CHECKS-AND-BALANCES section 6 with `--json` for CI; the baseline file; exit codes 0, 1, 2; the report names the P0 rows with no backlog row (39 today). Done also means red on mutant: flip the comparison (`>` to `>=`) in the untested-count rule and the "only reports" test goes red.

10. PR BREAKDOWN: PR 1 retarget and `--json` (read the locked cards by `--register` path) ~150 lines, 2 files; PR 2 ratchet + baseline ~200 lines, 3 files | base develop | `--check` not used by CI yet (flag-off proof: `npm test` output unchanged).

11. LENSES: A principal-architect (`scripts/*.mjs`), B ai-eng-lead (it enforces AIE rules) [E]. The base-branch baseline compare needs the single `unit` fetch step of BRIEF CI-PIN section 10 (founder); trace.test.mjs is in the root `node --test` list (package.json:11 [V]), so the new tests run in CI.

12. ORDER: PR 1 now; PR 2 after #846 merges. Before BRIEF QA-TITLES; before the Build 13 device sheet needs G0. Blocked by #846 (product/founder) and the founder's 07 Q8.

13. DONE: [ ] `node --test scripts/trace.test.mjs`; [ ] `npm test` baseline; [ ] ASCII; [ ] PR body per HARNESS-RUN; [ ] journal #7 (qa); [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing; G0 counts tests and backlog rows, not device runs (G4).

15. STOP AND ASK: a card id the regex cannot read (NS-09-R4b title says R4: CHECKS-AND-BALANCES section 10 item 1, product's fix); the founder wants `--check` blocking before #846; the 39 rows with no backlog row need rows (product).

16. HARNESS: journal #7; marker `<!-- journal run:sess-20261120-qa-964 agent:qa -->`; branch qa/trace-bl-964-ratchet; labels agent:qa, from:agent.
```
