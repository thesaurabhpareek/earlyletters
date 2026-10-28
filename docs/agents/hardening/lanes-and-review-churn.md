# Lanes and review churn (owner: ops)

Two hardening modules, both called by `scripts/agents/dispatch.mjs` through `hctx()`.
Tests: `scripts/agents/lane.test.mjs`, `scripts/agents/reviewfp.test.mjs` (fixtures, no network).

## Lanes (`scripts/agents/lane.mjs`)

Problem: from 15 Oct, the 4-hourly scheduled lane ran several times. Each run ended after about
a minute with no board update, claim, journal or receipt, and nobody noticed.

- Every dispatcher run calls `recordTick`, which stores `state.lanes[<lane>] = { at, run }`.
- The lane is `actions` in Actions mode. With `--local` it is `AGENTS_LANE` (only the 4-hourly scheduled task sets it so far; other schedules are other threads and
  unverified), or `local` when unset. Names are cleaned to `[A-Za-z0-9._-]`, 40 characters at most.
- Dry runs tick too, but a dry run never writes the board (dispatch.mjs writes only when
  `!DRY && board`), so their ticks are never saved.
- The board shows a `## Lanes` section: each lane's last tick in UTC and its age. A lane silent
  for more than 8 hours reads "quiet since <time>; check its scheduled task".
- A lane silent for more than 14 days is dropped from the state, so a retired lane leaves the board
  after two weeks of warnings.
- A tick only lands if the run reaches the dispatcher and writes the board. A lane that dies
  earlier stops ticking, which is exactly what the 8-hour warning catches.
- Limit: two lanes that write the board at the same moment can lose one tick (read, modify,
  write). With a 4-hour lane, one lost tick still stays at or under the 8-hour threshold.

## Review fingerprints (`scripts/agents/reviewfp.mjs`)

Problem: when develop is merged into a PR its head SHA changes, and the red team is queued to
review content it has already reviewed.

- `recordAssigned` (red-team review assigned) stores `state.reviewfp[<pr>] = { sha, fp }`.
- `fp` is a sha1 over the sorted `filename + "\n" + patch` from one call to
  `GET /repos/{repo}/pulls/{n}/files?per_page=100`. Hunk header line numbers are removed first,
  so lines that develop adds above the PR's edits do not change it. Context lines stay in.
- The fingerprint is unknown (stored as `null`, never matches) when the call fails, when the
  page has 100 files (there may be more), or when a file has changed lines but no patch or a
  short patch (GitHub leaves out large diffs). A file with no patch and no changed lines (binary,
  pure rename) counts by its status and blob sha.
- `equivalentReviewed` is true only when a trusted `<!-- red-team:<recorded sha> -->` review or
  comment exists, the recorded fp is known, and it equals the current fp. Its order: no state, or
  state at the current head, means no call; the review check reuses `prFacts`; only then the
  one files call. Results are cached per PR head for the run.
- Entries for PRs that are no longer open are dropped on every call.
- A match is recorded against the new head as `state.reviewfp[<pr>].carried = { sha, verdict, at }`
  (the verdict and date of the review it inherits) and shown on the board under "Same changes as a
  reviewed head", with both heads. `boardLines` runs on every tick, so the record exists whether or
  not the red team was free. A head whose changes differ is recorded as `differs`, so its files call
  is not repeated. `pause.mjs` leaves a carried head out of "Awaiting re-review".
- A match saves the red team's run only. Nothing is posted on the new head, and the merge rule
  (`docs/agents/COORDINATION.md` section 6, D-107 and D-117) reads reviews on the current head, so
  the board line is a fingerprint match, not a review.

What the fingerprint cannot see (a skipped head can still have changed behaviour):
- Anything outside the PR's own diff against its merge base. A rebase or develop merge that changes
  code the PR's lines depend on keeps the fingerprint unless the change falls inside a hunk's
  context lines. This is by design: the fingerprint is the PR's own changes.
- Where a hunk sits, when its context lines and section heading are identical, because the line
  numbers are stripped: the same added line in the second of two identical blocks gives the same
  fingerprint as in the first. A changed context line, added line, heading or extra file each
  changes it.
- File modes. The files API patch carries no `old mode` or `new mode` lines, and the blob sha
  ignores the mode, so flipping an executable bit keeps the fingerprint.

Checked against the live repo on 18 Oct 2026 (PR #38, one file, docs/marketing/LAUNCH_PLAN.md):
- The fingerprint built from `git diff <merge-base>...<head>` for head fde5be3 matches the files
  API exactly (f79ad99), so the API diffs against the merge base.
- Develop merges keep it: 03c6316 (reviewed) and 5c21d00 (merge) both give 9463370; 4d33713 and
  081fa60 (merge) both give c325be2.
- #38 needs its new review: 02d1a5b, 4d33713 and fde5be3 changed the plan after the 03c6316
  review. That is real new content, not churn.
- PR #2: binary files have no patch and 0 changes, a 4,258-line JSON file has no patch, and
  the first page holds 100 files. All three cases are covered by the rules above.

Not covered (dispatch.mjs, orchestrator):
- The D-041 path (`firstD041Target`) checks `red-team:<current sha>` only, so it still churns.
- The board's red-team verdict and "fix first" read only the current head.
- No backfill: a PR is protected from its next assigned review onward.
