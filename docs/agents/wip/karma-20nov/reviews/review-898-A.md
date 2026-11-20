## Review A at c7e4b48b66e9b6bf71fb0748c6e2d49da5d0e8d5: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Third look. c7e4b48b merges origin/develop into 2849f55a after #897 was squash-merged as `450857dc`. The base is now `develop`; 4 files, +160 -8 (under CODE-R02).

Must fix: none.

### What I checked
- This head adds no change of its own. `git diff origin/develop c7e4b48b`, `git diff 450857dc c7e4b48b` and `git diff 307b56b2 2849f55a` have the same stable patch-id (`a4ccd2db`). `450857dc` is on develop, and `git diff 307b56b2 450857dc` touches neither `scripts/release/label-effect.mjs` nor its test, so the squash kept part 1 exactly as I reviewed it at `307b56b2`.
- My review at `2849f55a` therefore carries over. I reran the parts that depend on develop, which has moved:
  - `npx vitest run test/label-effect.test.ts` in a worktree of this head: 33 pass.
  - `--base origin/develop --head 450bcb4a` (the lock): exit 0, `Label guard: pass (18 card files read)`.
  - `--base origin/develop --head origin/develop` (develop at `450857dc`): exit 1, exactly 33 `FAIL G11-2` lines and no other FAIL. The PR's "33 pre-lock cards" still holds.
- The diff against develop is the 4 files of part 2 only: script, test, `docs/ops/LABEL_GUARD.md`, `docs/ops/proposed/workflows/label-guard.yml`.

### Notes
1. Low. My two open notes from `2849f55a` (cards read from the base would pass the tests; an unreadable card passes as empty) are still true at this head. #906, stacked on it, closes both (review 906-A).
2. Info, carried. A label line under a non-card heading that follows a card counts for that card. No locked file has that shape.

### Not verified
- The job on GitHub: it lives under `docs/ops/proposed/`, so CI does not run it.
- Full apps/mobile suite locally; relied on CI.

CI at this head (12:54 UTC): `required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8 all success; `store-profile Release launch` (macOS) queued. The head was more than 10 minutes old when I finished.

Reviewer: independent of the author (CR-44).
