## Review A at 0cf7f4140f4a7836e4cf2fe0bc378f1266d50081: PASS WITH NOTES

Lens A (accuracy: every changed line true against its cited source; nothing breaks the harness). Re-review of PR #849 at its new head. I reviewed the delta from 57b7fb38e411d4e749a64693a7dae0f6cd883b5e (my last review, CHANGES) and judged it against `develop` d5d121784ab49160657c1ef42bf4bda35cfbcd99, which now has #845 (CR-63) and #844; the branch is still based on e9dca86c. Reviewer: `principal-architect` steward session. This PR edits my own charter. I wrote none of it.

### Read

- `git diff 57b7fb38 0cf7f414`: four lines in four charters, `analytics.md:23`, `ops.md:24`, `red-team.md:24` and `sync.md:22`. Also the updated PR body, including the "You own" list and the `data-policy.md` section 4 paragraph.
- Sources for the delta, on `develop` d5d12178:
  - `apps/mobile/src/lib/capture/start-capture.ts:7-8, 28-30`, the only `trackCaptureStarted(` call in `apps/mobile/src`.
  - `packages/analytics/src/catalog.ts:444-528`: eight events in the capture area.
  - `docs/agents/cto/RULINGS.md:594-608` (CR-63 as merged).
  - `scripts/agents/merge-queue.mjs:19-26, 75-105`.
  - ADR 0025 header (Status: Proposed; "Supersedes: ADR 0004 for v1.0 once accepted").
  - `docs/DECISIONS.md:342` (D-023 decided).
  - `docs/agents/OPERATING_MODEL.md:58, 83`; handoff #851.

### Ran (scratch worktrees, removed after)

- At the head: `node scripts/agents/check.mjs` exit 0 ("agent team is consistent", 26 agents, 473 tasks); `node --test scripts/agents/*.test.mjs` 149 pass, 0 fail.
- Head plus `develop` d5d12178 (scratch merge, no conflicts): check.mjs exit 0; 149 pass. A+B+C plus `develop`: check.mjs exit 0; 149 pass.
- Real-family-data scan: 11 pass. Added lines are ASCII only. Largest charter: 63 lines (under 90, AIE-R03). No front matter line changed.
- CI at the head: required `applied migrations unchanged`, `required` and `compliance-fence` all success (one earlier `compliance-fence` run was cancelled; the newest, 136097388931, is success); `agent team consistent` and every other check-run success; `mergeable_state: clean`.
- While I reviewed, `develop` moved to 1513b265 (#841: app code, tests, `docs/agents/BOARD.md`). `git merge-tree` against it is still clean. No harness script, ruling or instruction file changed.

### Previous findings at 57b7fb38: status

- The old must-fix at `analytics.md:23` is closed and true. The line now says `capture_started` is sent only by `startCapture`, with `source: 'tonight'`, never the control (`start-capture.ts:7-8, 28-30`), and that the catalog's capture area has eight events (`catalog.ts:444-528`).
- Old note 2 is closed: the body now lists the four "You own" lines.
- Old note 3 is answered: the body proposes `privacy` for the `data-policy.md` section 4 rows and leaves the call to the founder or Karma.
- Old note 4 is closed for `ops.md`, which now states the CR-63 rule instead of the tool's state.
- Old note 5 is closed: `red-team.md` now cites the merge queue, not the dispatcher's state.
- Old notes 6 and 7 are declined in the body. Note 7 is mine to take.

### Findings

Must fix: none.

Notes (do not block):

1. `red-team.md:24` cites `scripts/agents/merge-queue.mjs:72` for "a review whose line 1 is a marker ... is read but not counted". That is true in the PR's own tree (e9dca86c, where line 72 is `REVIEW_RE`). On `develop` d5d12178, line 72 is `MACOS_CHECKS`; the first-line match is `parseReview` at `:101-104` (with `REVIEW_RE` at `:75`). Re-cite after the branch takes `develop`. A charter change needs the founder, so cite the function name rather than a line.
2. `red-team.md:24` tells the red team to post a lens review "header on line 1 and your marker on line 2". This contradicts `OPERATING_MODEL.md:58` (section 4) and `:83` (section 6), a higher layer under AIE-R01. The line says so and points to #851, and the founder's approval of this PR (AIE-R21) is where he can settle it. If he approves the charter but not the `OPERATING_MODEL.md` wording, the two layers still disagree.
3. `ops.md:24` and `red-team.md:24` match CR-63 as merged: `PASS`, or `PASS WITH NOTES` with `Must fix: none`, counts. `sync.md:22` ("0025 ... Proposed; D-023 decided", 0004 until 0025 is accepted) matches the ADR 0025 header and `DECISIONS.md:342`.
4. Earlier notes still open, by the author's choice, none blocking: time-bound row and PR ids in the "New scope" lines, which need a founder-approved PR to refresh; the seventh "How you work" line in `data-steward.md:33`; and `principal-architect.md:25, 33` (ADR 0004; the `packages/api/**` review path versus the roster's `scripts/*.mjs`), which I will take as owner.
5. Merge gate, unchanged: this PR edits 17 other agents' charters, so it merges only with the founder's approval on the PR in his own words (AIE-R21; `OPERATING_MODEL.md` section 8). D-132 alone is not enough.

Not verified:

- No live agent run with these charters. "Loads" means `check.mjs` and the harness tests only.

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.

Reviewer: independent of the author (CR-44).
