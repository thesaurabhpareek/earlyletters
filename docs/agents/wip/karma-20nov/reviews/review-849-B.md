## Review B at 0cf7f4140f4a7836e4cf2fe0bc378f1266d50081: PASS WITH NOTES
<!-- agent:red-team -->

Lens B (governance, safety of agent instructions, founder approvals, prompt injection, constitution), second round. Re-review of the delta from 57b7fb38 to 0cf7f414 (one commit, `docs(agents): charters answer Review A and B on #849`), plus the updated PR body. Judged against `develop` d5d121784ab49160657c1ef42bf4bda35cfbcd99, which holds #845 and CR-63. Model: claude-opus-5-5, the same family as the author (AIE-R19).

Conflict disclosure: this review runs as the red-team role, and the PR edits `.claude/agents/red-team.md`, my own charter. Independence: I share no context with the author's session. This scratchpad also holds the author's worktrees for the three branches, so the commissioning session is probably the author's parent or the merger: independence of method, not of identity (CTO skill section 4).

### Read
- The delta, `git diff 57b7fb38 0cf7f414` (4 charters, +4/-4): `analytics.md`, `ops.md`, `red-team.md`, `sync.md`.
- The updated PR body, including its approval paragraph, its table, and the section "Answers to Review A and Review B at 57b7fb38".
- Handoff #851.
- CR-63 on `develop` (`RULINGS.md:594`), and `merge-queue.mjs` on `develop` (`REVIEW_RE` at line 75).
- The ADR 0025 header.

### Ran
- At the new head: `node scripts/agents/check.mjs` reports the agent team consistent, and `node --test scripts/agents/*.test.mjs` passes 149 of 149.
- A byte scan of the 31 added lines against `develop` finds no non-ASCII characters.
- The old head is an ancestor of the new head, so there was no force push.
- `git merge-tree` against d5d12178 is clean, and `mergeable_state` is clean.
- Required CI at 0cf7f414 is success on the newest run of each check: `applied migrations unchanged`, `required` and `compliance-fence`. An earlier `compliance-fence` run, started at 05:07:42Z, was cancelled, and the run at 05:07:45Z succeeded. `agent team consistent` and `tests and content rules` are also success.
- Labels: `needs:founder`.

### Round 1 notes
1. Approval and labels.
   - The body now states the full basis: OPERATING_MODEL section 8, HARNESS section 8 and the author's own charter forbid the edit, and only the founder's approval on the PR lifts that. The approval must be in his own words, with no session marker and no "Generated" footer, and a relay does not count.
   - `needs:founder` is on.
   - `agent:ai-eng-lead` and `from:agent` are not on. The body leaves them for whoever holds the PR.
2. Body accuracy: handled. The four "You own" changes are listed, and the paragraph saying what the approval lifts is accurate. The body also discloses that `data-policy.md` section 4 now has no charter owner, while CR-62 item 4 still points an edit there. That is an honest disclosure; the proposal goes to the founder or Karma.
3. `red-team.md:24`: handled. The line now reads:
   > When Karma asks you for Lens A or B, post in that format, header on line 1 and your marker on line 2. A review whose line 1 is a marker, as below, is read but not counted (`scripts/agents/merge-queue.mjs:72`); the conflict with `OPERATING_MODEL.md` sections 4 and 6 is with the founder (#851).

   That removes the contradiction inside the file: lens work uses the header format, and the D-041 marker review stays as written. The question of whether a red-team `fix first` on a D-041 path holds a merge is left to the founder, as the body says, and is not settled by implication. Good.
4. `ops.md:24`: handled. It now states the rule, "`PASS`, or `PASS WITH NOTES` with `Must fix: none`, counts, CR-63", not the tool's state.
5. `sync.md:22`: handled ("Proposed; D-023 decided", and 0004 holds until 0025 is accepted).
6. to 8. Stated as not taken: the D-041 clause on the new intake lines, the device-table overlap, and the roster's `review_paths` changes. The body says the roster proposals are "in the readiness report for the founder". I cannot see that report, so make sure it reaches him in a form he reads (note 3).

### The questions asked this round
- **Does anything new widen a permission or bypass a gate?** No.
  - `red-team.md` adds a format instruction for lens work only.
  - `ops.md` restates CR-63.
  - `sync.md` narrows its reading of ADR 0025.
  - `analytics.md` corrects a fact: `capture_started` comes only from `startCapture` (I did not re-verify the line numbers).
  - No `tools:`, `model:`, Mission, standing-duty or Never line changed.
- **Is the marker on line 2 sound for this charter?** Yes, as an interim step. The verdict stays on line 1, which is all the merge queue reads for the verdict, and the marker does not match the `Must fix:` reader. It does not fix `isFounderComment`. That gap is covered by review-gate's lane warning and #851 (see my #848 review, note 1 and the #851 answer).
- **Is the CR-63 wording right?** Yes, in `ops.md:24` and as cited in `red-team.md:24`.

### What still stands before Karma merges (AIE-R21)
Unchanged from round 1, and now spelled out correctly in the body:
- (a) The founder's approval on this PR, in his own words, typed by him. A relay does not count, and neither does D-117.
- (b) Review A and Review B counted at the current head under CR-63, and green required CI. `merge-queue.mjs` on `develop` now counts `PASS WITH NOTES` with `Must fix: none`, so no hand count is needed.
- (c) Neither lens is ai-eng-lead or Karma. security-architect, which has `.claude/**` in its `review_paths`, should read it.
- (d) `needs:founder` is now on.
- (e) Merge order: #848 first, then this PR. #845 is already merged.

Must fix: none.

### Notes (most serious first)
1. **The founder's approval is the merge condition** (item (a)). Nothing in the diff replaces it.
2. **`red-team.md:24` cites `scripts/agents/merge-queue.mjs:72`.** On `develop` after #845, `REVIEW_RE` is at line 75 and line 72 is `MACOS_CHECKS`. Cite `REVIEW_RE` by name (AIE-R07).
3. **Roster changes are the founder's** (AIE-R21; CODEOWNERS `/agents/`): the `data-steward` `review_paths` for `data-map.yaml` and `DATA_CLASSIFICATION.md`, and `security-architect` for `apps/mobile/modules/**`. #851 covers only the review format. If the readiness report is not somewhere he reads, open a `needs:founder` handoff for them (AIE-R29).
4. **Labels.** Add `agent:ai-eng-lead` and `from:agent`; both labels exist in the repository.

### Not verified
- The `analytics.md:23` line numbers (`start-capture.ts:7-8, 28-30`; `catalog.ts:444-528`).
- The readiness report's contents and who received it.
- Whether a Review A exists at 0cf7f414.
- Full `npm test` and typecheck locally. The PR is docs only, and CI is green at the head.

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.
Reviewer: independent of the author (CR-44).
