# Proposed CI step: the NS trace ratchet (BL-964, gate G0)

Agents cannot edit `.github/workflows/`. Under BL-1869 this step goes into the `unit` job of `ci.yml`, after `npm test`, as Karma's commit (a GitHub write under CR-176 item 5); only if the session proxy refuses a workflow-file write does it become the account holder's own edit in the GitHub web editor, listed in `docs/release/FOUNDER_QUEUE.md`. The plain `--check` question is ruled (CR-229, below): the step is applied as drafted once `node scripts/trace.mjs --no-write --check` exits 0 on `develop`.

```yaml
      - name: Trace ratchet (NS rows, gate G0)
        run: |
          git fetch --depth=1 origin "${{ github.base_ref }}"
          BASE=()
          if git show "origin/${{ github.base_ref }}:docs/ops/trace-ns-baseline.txt" > "$RUNNER_TEMP/ns-base.txt"; then
            BASE=(--ns-base "$RUNNER_TEMP/ns-base.txt")
          fi   # the first PR that adds the baseline has no base copy
          node scripts/trace.mjs --no-write --check "${BASE[@]}"
```

What it fails on. Plain `--check` exits 1 on any of these (`scripts/trace.mjs`, `main`, the `failed` and `nsFail` lines):
- a v2 id defined in two specs, or cited and defined nowhere (`docs/prd/v2`);
- NS `added`: a P0 row (or cross-cutting id) with no test title that is not in `docs/ops/trace-ns-baseline.txt`, or a bracketed NS id in a test title that no card defines and the baseline does not list;
- NS `gone`: a baseline line whose row was removed or lowered from P0, or whose cited id vanished, until the author runs `--update-ns-baseline` (it only shrinks);
- NS `grown`: a baseline line the base branch's copy lacks (only with `--ns-base`);
- a baseline deleted while the base branch has one.

A baseline line whose row now has a test is reported as `stale baseline line` and does not fail.

## Failures on develop (BL-2033, full checkout, 24 Nov 2026)

Command, on `develop` at `89ccadd1` (a full checkout with every test file): `node scripts/trace.mjs --no-write --check --ns-base <develop's own copy of the baseline>`. Exit 1.

| Cause | Lines | Which |
|---|---|---|
| v2 id defined in two specs | 0 | none |
| v2 id cited, defined nowhere | 0 | none: PR #1843 merged on 24 Nov 2026 at 06:13 UTC and defined F14-REQ-043a and b and F16-REQ-029a to c |
| NS `added` | 176 | 174 NS-53 rows (G01, G03, G04, G05 and 170 R rows); NS-21-R12b (a title no card defines); NS-51-R43 (a P0 row with no test title) |
| NS `gone` | 0 | none |
| NS `grown` | 0 | none (the base copy is develop's own) |
| stale baseline line (report only) | 67 | rows that have a test now; they do not fail |

So the five v2 ids no longer stand in the way. Every failure left is the NS ratchet's own, and all 176 are cleared by the BL-2238 pull request (#2050): four rows get their ids on the tests that prove them, two ids are fixed at their source, the other 170 NS-53 rows are seeded once under CR-228, and the 67 stale lines are deleted. On that branch the same command exits 0.

## The two ways to a step that fails only on the ratchet

(a) Make plain `--check` exit 0 on `develop`, then apply the step as drafted. The v2 half is done (#1843); the NS half is #2050.

(b) Add a ratchet-only flag or scope to `scripts/trace.mjs` (a code row, owner qa engineer, with its own test), so CI does not wait on the v2 or NS clean-up.

Recommended and ruled: (a). See CR-229 in `docs/agents/cto/RULINGS.md`. (b) would add a second path through `main` for a problem that no longer exists, and a ratchet-only step would let a duplicate or undefined v2 id merge unseen. The answer to 07 Q8 (whether `--check` blocks merges) is yes, through this step, once #2050 has merged and BL-1869 applies it.
