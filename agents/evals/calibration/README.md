# Reviewer calibration set (RB-11)

Eight patches against one pinned commit of `develop`: six with one seeded defect each, two clean. They check that the red team still tells a bad patch from a good one (see `docs/agents/hardening/reviewer-calibration.md`). The answer key is `key.json`; `score.mjs` marks a reviewer against it.

Pinned base: `6bfb94a9e8f24e47c092a5e920e2ec6e06e02b77` (develop, 28 Oct 2026). Apply with `git worktree add --detach <dir> 6bfb94a9e8f2 && git -C <dir> apply patches/<name>.patch`. If the base moves on and a patch stops applying, re-pin and regenerate; do not edit a patch by hand without redoing `PROOF.txt`.

| Patch | Defect | Caught by | Key verdict |
|---|---|---|---|
| d1-sql-policy-leak | new migration re-creates `entries_select` without `is_child_member`: cross-family read | `npm run test:db` | fix first |
| d2-verify-bypass | `verifyEdits` skips `checkEdit` for rule edits | `npm test -w packages/core` | fix first |
| d3-content-rule | onboarding copy promises a nightly streak | `npm test -w packages/content` | fix first |
| d4-trust-spoof | `isTrusted` trusts any login ending `[bot]` | `node --test scripts/agents/lib.test.mjs` | fix first |
| d5-applied-migration-edit | adds an index to an applied migration | `.github/scripts/migration-guard.mjs` | fix first |
| d6-privacy-leak | `console.warn` with the child's name | grep (`console.` in `apps/mobile/src` is 0 on the base) | fix first |
| c1-trust-tests | adds tests for `isTrusted` (test only) | passes | ship |
| c2-rule-edits-verified | two tests: a rule edit that adds a negation or changes tense is still refused (test only) | passes | ship |

Evidence that each patch behaves as keyed is in `PROOF.txt`.

## Running a reviewer on it

Give the reviewer one patch at a time (the diff only, never `key.json`, `PROOF.txt` or this file; the key sits in the same repo, so run the reviewer from a checkout of the base commit that does not contain `agents/evals/calibration/`). Record its review as `{patch, verdict, findings:[{file, line, end_line?, severity}]}` with verdict `ship` or `fix first` and severity `blocker | major | minor | nit`. Collect the eight into a JSON array and run:

```
node agents/evals/calibration/score.mjs reviews.json [--slack 2] [--fp-min major] [--json]
node --test agents/evals/calibration/score.test.mjs
```

Lines are post-image lines (the file as patched). Matching is by file and line overlap with the seeded range plus 2 lines of slack, never by wording. Output: recall of seeded defects, false positives (findings that match no seeded defect, at `--fp-min` severity or worse; default `major`), and verdict accuracy. Several findings on one defect count once. A patch that was not reviewed is listed and left out of the totals.

## Worked example

`example/worked-example.findings.json` is an invented reviewer, not a real review. It finds d1, d2, d5 and d6, misses d3 (and ships it) and d4 (its one finding is on the wrong line), and wrongly blocks c2:

```
patch                       verdict (key)            found/seeded  false pos
c1-trust-tests              ship (ship)              0/0           0
c2-rule-edits-verified      fix first (ship)         0/0           1   WRONG VERDICT
d1-sql-policy-leak          fix first (fix first)    1/1           0
d2-verify-bypass            fix first (fix first)    1/1           0
d3-content-rule             ship (fix first)         0/1           0   WRONG VERDICT
d4-trust-spoof              fix first (fix first)    0/1           1
d5-applied-migration-edit   fix first (fix first)    1/1           0
d6-privacy-leak             fix first (fix first)    1/1           0
recall of seeded defects: 67%
false positives: 2
verdict accuracy: 75% (clean patches shipped: 1/2)
```

Recall is 4 of 6. The false positives are c2's wrong block and d4's off-target finding; the duplicate on d2 and the nit on d2 add none. Verdict accuracy is 6 of 8.

## Reading the result

A reviewer that blocks everything scores 75% verdict accuracy and 0 on clean patches shipped, so look at `cleanShipped` and recall, not accuracy alone. The set is small (6 defects): treat one run as a smoke signal, and rerun with fresh reviewer runs before drawing a trend. Each defect is a single-line, single-file change on purpose; it measures the floor of detection, not the ceiling.
