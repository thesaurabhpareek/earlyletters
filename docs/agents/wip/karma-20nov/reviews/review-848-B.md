## Review B at 5e5c901f43944f171e53b8b924f1d7fec182e38f: PASS WITH NOTES
<!-- agent:red-team -->

Lens B (governance, safety of agent instructions, founder approvals, prompt injection, constitution), third round. Delta-only re-review of 0264066f to 5e5c901f: one commit, `docs(agents): skills answer Review A round 2 on #848`, 3 files. Judged against `develop` 1513b265907b, which adds #841 since my last round and does not touch `merge-queue.mjs`, `.claude/**` or `RULINGS.md`. Model: claude-opus-5-5, the same family as the author (AIE-R19).

Independence: I share no context with the author's session. This scratchpad also holds the author's worktrees for the three branches, so the commissioning session is probably the author's parent or the merger: independence of method, not of identity (CTO skill section 4).

This is the finished review. An unfinished draft of it was posted to #848 at 05:30:28Z, and #848 merged at 05:30:40Z. See "After the merge" below.

### Read
- `git diff 0264066f 5e5c901f`:
  - `review-gate`: the table row and two bullets in section 2.
  - `stacked-prs`: rebuild step 2 and the 8a026397 evidence.
  - `expo-native-module`: the WATCH-RED line number.
- `scripts/agents/merge-queue.mjs` on `develop` 1513b265: lines 19 to 26, 58, 75, 80, 82 and 84 to 90.
- The #828 merge time and merge commit, and the commit date of 8a026397.
- After the merge: the #848 comments, `merged_at` and `merge_commit_sha`.

### Ran
- At 5e5c901f:
  - `node scripts/agents/check.mjs`: the agent team is consistent.
  - `node --test scripts/agents/*.test.mjs`: 149 of 149 pass.
  - js-yaml parses all three skill front matters.
- 0264066f is an ancestor of 5e5c901f, so no force push.
- `git merge-tree --write-tree` against `develop` 1513b265 is clean.
- Byte scan: 0 non-ASCII characters in the 173 added lines.
- The new staging step, in a throwaway repo in the scratchpad (not this repo):
  - `git apply --3way` stages each file that applied cleanly (`M`, `A`) and leaves a conflicted file unmerged (`UU`).
  - `git write-tree` refuses while any path is unmerged.
  - After the resolved file is added by name, the tree holds only the patch's files. An untracked `artifact.log` stays `??` and is not in the tree.

### CI at the head (settled 05:32:48Z; head quiet 618 s)
- Every check-run at 5e5c901f is completed and success, including the newest run of each required check: `applied migrations unchanged` (05:23:35Z), `compliance-fence` (05:24:21Z) and `required` (05:26:50Z).
- `typecheck`, `tests and content rules`, `database rules`, Deno, B-8 and `install` also succeeded.

### The delta, against the questions
1. **Nothing widens a permission or bypasses a gate.** The changes are fact fixes: line numbers, how the queue reads the body, and a corrected example. The staging change narrows what a rebuild can commit: untracked test artifacts can no longer be committed. That closes my round 2 note 3.
2. **The marker on line 2 is still sound.** "A marker line is not a `Must fix:` line, so it does not change the verdict" is correct: `<!-- agent:<handle> -->` cannot match `MUST_FIX_LINE` (merge-queue.mjs:80). The lane warning is unchanged.
3. **The CR-63 wording is right.** The skill says the queue "reads the header and verdict only from line 1, and reads the body only for a `Must fix:` line, which can take a pass away (CR-63; merge-queue.mjs:80-90)". That matches `REVIEW_RE` (75), `MUST_FIX_LINE` (80) and `effectiveVerdict` (84 to 90).
4. **The cited lines are right on `develop`:** the rules comment at 19 to 26, the pass logic at 75 to 90, WATCH-RED at 58. This closes my round 2 note 2 for this PR.
5. **The evidence correction is verified.**
   - #828 merged at 2026-11-19T22:40:39Z as 5f5dfaf4.
   - 8a026397 was committed at 22:46:37Z, six minutes later, on #828's branch head a80648d4. It is not a rebuild onto an unmerged base.
   - The skill now says no rebuild onto an unmerged base is on record. That is honest: that branch of the recipe has no precedent yet.

Must fix: none.

### Notes (most serious first)
1. **One sentence is slightly imprecise.** "Reads the body only for a `Must fix:` line" leaves out that the body is also read for the other accepted "no must-fix" phrasings (`NO_MUST_FIX`, merge-queue.mjs:82). The tool's own header comment (lines 23 to 25) says the same thing as the skill, and the skill tells reviewers to write the exact `Must fix: none.` line. Fix both together, or leave it.
2. **Unchanged from round 2.**
   - The lane condition covers counted review headers only; the wider test belongs in #851 and AIE-G11.
   - #851 is a record, not a hold: a test-backed `isFounderComment` guard should land before any switch-on.
   - The labels `agent:ai-eng-lead` and `from:agent` were never added.

### After the merge (process finding for Karma and the founder)
1. **An unfinished draft of this review was posted as the counted Review B.** It went up at 05:30:28Z, 13 seconds before the merge. It is identical to my working file at that moment, plus a "Generated by Claude Code" footer, and its CI section reads "Pending when this file was first written".
   - I had not handed it back. Only a report delivered through the hand-off is a finished review.
   - Its verdict and findings stand unchanged, now with CI confirmed. But the record holds a lens B whose CI check was still open when it was counted.
   - Fix: post only reviews the reviewer has handed back, or have reviewers draft outside the shared folder. Add a one-line note on #848 pointing to this final text.
2. **#848 merged before the head was quiet for 10 minutes.**
   - The head was committed at 05:22:30Z and merged at 05:30:40Z, 8 min 10 s later.
   - The review-gate skill (section 2), LESSONS-2026-11-08 line 10 (CR-44) and `merge-queue.mjs` WAIT-QUIET (default 10 minutes) make a quiet head part of READY, so the queue would have shown WAIT-QUIET, not READY.
   - The substantive gate did hold. Review A (principal-architect session) and Review B were both `PASS WITH NOTES` with `Must fix: none.` at 5e5c901f. Required CI was green from 05:26:50Z. The squash commit 8343d119 carries the reviewed tree: `git diff 5e5c901f 8343d119 -- .claude/skills` is empty.
   - So no harm landed. But it is the first merge under the skill that states the rule, and it did not follow it. Record it in Karma's next rulings or notes PR, so the gate is not read as optional.

### Not verified
- That the REST update takes a `base` field; the skill already says this is unverified.
- The value of `AGENTS_ENABLED`; the proxy refused the read.

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.
Reviewer: independent of the author (CR-44).
