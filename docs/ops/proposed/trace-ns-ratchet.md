# Proposed CI step: the NS trace ratchet (BL-964, gate G0)

Agents cannot edit `.github/workflows/`. Under BL-1869 this step goes into the `unit` job of `ci.yml`, after `npm test`, as Karma's commit (a GitHub write under CR-176 item 5); only if the session proxy refuses a workflow-file write does it become the account holder's own edit in the GitHub web editor, listed in `docs/release/FOUNDER_QUEUE.md`. The plain `--check` question is ruled (CR-229, below): the step is applied as drafted once `node scripts/trace.mjs --no-write --check` exits 0 on `develop`.

```yaml
      - name: Trace ratchet (NS rows, gate G0)
        run: |
        env:
          BASE_REF: ${{ github.base_ref }}
        run: |
          set -euo pipefail
          git fetch --depth=1 origin "$BASE_REF"
          # Fail closed: develop and main both hold the baseline, so a base copy that cannot be read fails the step.
          git show "origin/$BASE_REF:docs/ops/trace-ns-baseline.txt" > "$RUNNER_TEMP/ns-base.txt"
          node scripts/trace.mjs --no-write --check --ns-base "$RUNNER_TEMP/ns-base.txt"
```

What it fails on. Plain `--check` exits 1 on any of these (`scripts/trace.mjs`, `main`, the `failed` and `nsFail` lines):
- a v2 id defined in two specs, or cited and defined nowhere (`docs/prd/v2`);
- NS `added`: a P0 row (or cross-cutting id) with no test title that is not in `docs/ops/trace-ns-baseline.txt`, or a bracketed NS id in a test title that no card defines and the baseline does not list;
- NS `gone`: a baseline line whose row was removed or lowered from P0, or whose cited id vanished, until the author runs `--update-ns-baseline` (it only shrinks);
- NS `grown`: a baseline line the base branch's copy lacks (only with `--ns-base`);
- a baseline deleted while the base branch has one;
- an `--ns-base` file that does not exist (exit 1);
- a card or register the NS parser cannot read: under `--check` the error is thrown and the script exits 2 (in report mode it is logged and skipped).

A P0 row is open when nothing marks it covered (`scripts/trace.mjs:668-669`, read at `:830`): no active test title cites its id, no `[stand-in]` title cites it (status `partial`), no e2e-web journey cites it (`journey`), and its card does not mark it as a device row (`device`). A baseline line is `stale` when its id is no longer open. `it.fails`, `it.todo` and `.skip` titles are not active (`scripts/trace.mjs:241`, and `:634` skips them), but a describe title is, and so is a passing test of another clause of the row, so a row can read as stale while its main clause is still red or not built. A stale line is logged as `stale baseline line` and does not fail. Six stale lines are kept on purpose for that reason (NS-21-R12, NS-01-R50, NS-44-R1, NS-17-R5, NS-17-R7, NS-17-R8; CR-228 names each test and line). The log line still says to delete every stale line, so whoever runs `--update-ns-baseline` puts those six back in the same commit. The gate therefore proves that every P0 row is either covered in one of those four ways or listed in the baseline. It does not prove that a cited row's test passes in full, that a `[stand-in]` test proves the whole row, or that a device row was ever run on a device: on develop `f7b4ca9e` 16 P0 device rows and one partial row pass this way with no active test title and no baseline line (counted by Review A on #2052), and their proof is the device run sheets and the review of each stand-in, not this gate.

What the step trusts. Only the baseline's base copy comes from the target branch. The step runs the PR's own `scripts/trace.mjs`, `ci.yml`, cards and NS register, so a PR can weaken the gate it is checked by, for example by moving the register so the NS half finds nothing and exits 0. That is covered by review, not by the step: under CR-229 a PR that changes `scripts/trace.mjs`, `scripts/trace.test.mjs`, `docs/ops/trace-ns-baseline.txt` or the NS register (`docs/product/prd/14-test-plan.md`) needs one of its two counted reviews from the `security` or `security-architect` lens, as `.github/**` already does under CR-73.

How the base copy is taken. The step reads `docs/ops/trace-ns-baseline.txt` from `origin/<base branch>` at the time the job runs, so `grown` compares the PR's baseline with the target branch's tip. A one-time seed (CR-227, CR-228) adds lines, so the PR that carries it reads as `grown` against the base copy it starts from; it can pass only when it merges before the step is applied, after which the seed is in every later base copy. That is why the step waited for #2050, which merged on 27 Nov 2026 (below).

## Failures on develop (BL-2033, full checkout, 24 Nov 2026)

Command, on `develop` at `89ccadd1` (a full checkout with every test file): `node scripts/trace.mjs --no-write --check --ns-base <develop's own copy of the baseline>`. Exit 1.

| Cause | Lines | Which |
|---|---|---|
| v2 id defined in two specs | 0 | none |
| v2 id cited, defined nowhere | 0 | none: PR #1843 merged on 24 Nov 2026 at 06:13 UTC and defined F14-REQ-043a and b and F16-REQ-029a to c |
| NS `added` | 176 | 174 NS-53 rows (G01, G03, G04, G05 and 170 R rows); NS-21-R12b (a title no card defines); NS-51-R43 (a P0 row with no test title) |
| NS `gone` | 0 | none |
| NS `grown` | 0 | none (the base copy is develop's own) |
| stale baseline line (report only) | 67 | lines whose id an active test title now cites (a describe title counts; `it.fails` and `it.todo` titles do not); they do not fail. Six of them still have their main clause in `it.fails` or `it.todo` (see above) |

So the five v2 ids no longer stand in the way. Every failure left is the NS ratchet's own, and all 176 are cleared by the BL-2238 pull request (#2050): three NS-53 rows (R1, R221, R247) and NS-51-R43 get their ids on the tests that carry them; NS-21-R12b is retitled `[NS-21-R12]`; NS-53-R56's priority cell is corrected to DROPPED, as its own text says (a data fix, not a test id); the other 170 NS-53 rows are seeded once under CR-228; and 61 of the 67 stale lines are deleted, the six above kept.

The same commands, run again on 25 Nov 2026 (full checkouts):

| Where | Command | Exit | What it prints |
|---|---|---|---|
| develop `ba8f3357` | `--no-write --check` | 1 | 176 `added`, 67 stale |
| develop `ba8f3357` | `--no-write --check --ns-base <copy of develop's baseline>` | 1 | 176 `added`, 0 `grown`, 67 stale |
| #2050 at `9af68366` | `--no-write --check` | 0 | 0 FAIL, 6 stale (the six kept lines) |
| #2050 at `9af68366` | `--no-write --check --ns-base <copy of develop's baseline>` | 1 | 170 `grown` (the NS-53 seed: "was added to the baseline; it may only shrink"), 6 stale |
| #2050 at `9af68366` | `--no-write --check --ns-base <copy of #2050's own baseline>` | 0 | 0 FAIL, 6 stale |

The fourth row is what the drafted step would have printed on #2050's own PR, and the fifth is what it prints on later PRs once develop's copy holds the seed. So the step was to be applied only after #2050 merged, never before.

After #2050 merged (27 Nov 2026, full checkout of this branch merged with develop `f7b4ca9e`, whose baseline is the same file):

| Where | Command | Exit | What it prints |
|---|---|---|---|
| develop `f7b4ca9e` | `--no-write --check` | 0 | 0 FAIL, 15 stale (the six kept lines, and nine whose ids tests merged since now cite) |
| develop `f7b4ca9e` | `--no-write --check --ns-base <copy of develop's baseline>` | 0 | 0 FAIL, 0 `grown`, 15 stale |
| develop `f7b4ca9e` | `--no-write --check --ns-base <a file that does not exist>` | 1 | the missing base file |

So BL-1869 can apply the step as drafted now.

## The two ways to a step that fails only on the ratchet

(a) Make plain `--check` exit 0 on `develop`, then apply the step as drafted. The v2 half is done (#1843); the NS half is #2050.

(b) Add a ratchet-only flag or scope to `scripts/trace.mjs` (a code row, owner qa engineer, with its own test), so CI does not wait on the v2 or NS clean-up.

Recommended and ruled: (a). See CR-229 in `docs/agents/cto/RULINGS.md`. (b) would add a second path through `main` for a problem that no longer exists, and a ratchet-only step would let a duplicate or undefined v2 id merge unseen. The answer to 07 Q8 (whether `--check` blocks merges) is yes, through this step, once #2050 has merged and BL-1869 applies it. What it blocks is a P0 row neither covered nor listed. A row whose main clause is in `it.fails` or `it.todo` still passes when a describe title or a test of another clause cites it, which CR-229 records as a revisit trigger.
