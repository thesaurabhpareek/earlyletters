## Review B at 47acaacc70353b4cd6af020eb43a077516b22a77: PASS WITH NOTES

Lens B: governance. Does this weaken the merge gate, and is the ruling sound. Round 2. The head was confirmed by REST at the start and again before writing: 47acaacc70353b4cd6af020eb43a077516b22a77. Base and merge base are develop e9dca86c. My round 1 was CHANGES at 3447065461988eae85409805215c2bb897d6ebf2. The delta 3447065..47acaac is 3 files, +52 -19: CR-63 rewritten, `effectiveVerdict` added to merge-queue.mjs, and the strict test case rewritten.

Must fix: none.

### What I read
- `git diff 3447065 47acaac` and `git diff origin/develop...47acaac` (3 files, +75 -21), plus merge-queue.mjs:18-120 at head.
- CR-63 as rewritten (RULINGS.md:594-608).
- My round-1 review, the page.mjs and README:31 guard it cites, and `.claude/agents/red-team.md` standing duties.

### What I ran
- In my own worktree at 47acaacc:
  - `node --test scripts/agents/merge-queue.test.mjs`: 29/29.
  - `node --test scripts/agents/*.test.mjs`: 149/149.
  - `check.mjs`: consistent.
- Five mutants. Each turns test 20 red (28/1), and the file was restored afterwards:
  1. Drop the PASS WITH NOTES requirement.
  2. Ignore an open Must-fix line.
  3. Treat every body as saying none.
  4. Apply the open Must-fix rule to PASS WITH NOTES only.
  5. Never accept the three none-phrases.
- `effectiveVerdict` on 20 hand-made bodies (results below).
- The real 211 PASS WITH NOTES review comments since 1 Nov: 86 count, 125 show `no "Must fix: none" line`, and 0 show `open Must fix`.
- The 19 reviews at the merged heads CR-63 cites: 17 count, 2 do not (see Note 1).
- A scratch prototype outside the repo (Note 1). I changed no repo file.
- `git merge-tree` with develop e9dca86c: clean. 0 non-ASCII in added lines.

### Round-1 must-fix: closed
- The Ruling now says: "Anything that must change before merge makes the verdict `CHANGES`. A `PASS WITH NOTES` review says so in its body with a line `Must fix: none.`" The tool checks this.
- A `Must fix:` line naming something takes a pass away, for PASS too (test 20 and my probes).
- The rewrite also took up my round-1 notes:
  - It is now T2 with a pre-mortem.
  - The #306 wording is exact ("one `PASS` plus a red-team 'ship'"). #764, #826 and #738 are added.
  - It cites the page.mjs guard.
  - Carrying notes forward now has an owner (Karma's follow-up docs PR).
- The body is read only to take a pass away, never to make one. So the "later lines cannot change the result" design still holds for every other word.

### The question asked: can the accepted phrasings be faked without the "Must fix:" form?
Yes, in two different ways. Only the first is the residual that pre-mortem item 3 describes.

**(a) Real prose. All of these count at head:**
- "Must fix: none." followed by "This must be fixed before merge: the RLS grant." in the notes.
- "Must fix: none, except the RLS grant must change". The tool tests the rest of the line with `/^none\b/`.
- "Must fix (new): X" and "Must-fix items: X" next to a "Must fix: none." line, because a qualifier before the colon is not read.

This residual is acceptable as item 3 describes. A script cannot read intent. Scanning the body for words like "must" or "before merge" brings back the false warnings that scripts/status/README.md:33 documents ("Thanks, merging.", "the test fails on the previous code"). The defence that remains is the second, independent lens and Karma reading the body before the merge (Note 2).

**(b) A structured list in the house heading form. This is not prose, and the tool does not read it:**
- `## Must fix` or `### Must fix` on its own line, then the items. The regex needs a colon, so the heading form is invisible to it. At head:
  - "PASS" + "### Must fix / 1. the RLS grant" counts.
  - "PASS WITH NOTES" + "### Must fix / 1. the RLS grant" fails closed. But if any incidental "no must" text appears anywhere in the body, it counts. Examples: "Lens A found no must-fix." in a recap, or "the schema has no must-have column". `NO_MUST_FIX` is a substring match over the whole body.
- This form is in real use: 25 of the 211 comments, including #764 Review B and #834 Review A at their merged heads.
- It is the honest-mistake shape #306 had: a PASS WITH NOTES whose body lists what must change. It is cheap to read (Note 1).
- I do not hold the merge on it, for three reasons:
  - At head, every path through this gap needs a self-contradicting review: a PASS over a must-fix list, or a PASS WITH NOTES whose body also says there is no must-fix.
  - No case is looser than develop, where line 1 alone decides.
  - The common honest case (PASS WITH NOTES + heading + items, no recap phrase) already fails closed.
- Close it in the next push, or in the follow-up docs PR's batch.

### Notes
1. **Read the heading form in both directions. This fixes a gap and a false block together.**
   - In `effectiveVerdict`, treat a line matching `^[ \t>*_#-]*must[ -]fix(?:es)?[ \t*_]*$` (case-insensitive) as a Must-fix line whose content is the next non-blank line. Then "### Must fix / None." is none, and "### Must fix / 1. X" is an open Must fix, for PASS too.
   - My scratch prototype of exactly this (outside the repo, `NO_MUST_FIX` unchanged) has these results:
     - corpus counts rise from 86 to 102;
     - `open Must fix` stays at 0 on the 211 real reviews;
     - all four heading probes come out right;
     - #764 Review B ("## Must fix / None.") and #834 Review A ("### Must fix / None.") count.
   - At head, those two reviews show `PASS WITH NOTES (no "Must fix: none" line)`. Both are in CR-63's own precedent list. So the Ruling's "the tool also accepts the forms reviews here have used" overstates what the tool does: it accepts the three phrases it names, not the heading form.
   - Add two asserts: heading plus None counts; heading plus an item is open, for PASS.
   - Keep `NO_MUST_FIX` loose. Once both structured forms are read, it matters only when no Must-fix line exists at all, which is case (a). Anchoring it to its own line would drop corpus counts to 68 for no gain.
2. **Pre-mortem item 3 names a check that does not exist yet.**
   - "The red team's periodic sample of merged reviews" has no cadence, no size and no home. `.claude/agents/red-team.md` standing duty 1 audits merged PRs against the constitution, privacy, access, tests and scope checklist. It does not cover review bodies against their verdicts, and the charter is founder-owned (AIE-R03).
   - As written, Karma's principle 1 calls this "a wish".
   - A concrete version at no new cost: Karma's follow-up docs PR (item 2) lists each merged counted review whose notes contain "before merge", "must be fixed", "must change" or "blocks". The person reading that list is the check.
   - Also ask the founder to add "review bodies against verdicts" to the red-team audit duty.
   - Separately, Karma's own pre-merge read of the body stays the real control. Say so in item 3.
3. **"Notes carried" is owned but not specified.** "After each batch of merges" has no size or deadline. A line such as "within one working day of a merge, or before the next freeze, whichever is first" would make item 2 checkable.
4. **"Any `Must fix:` line that names something" also catches report lines.**
   - Examples: "- Must fix: fixed in round 3", a quoted "> Must fix: X" from an earlier round, and "Must fix: 0". All show `open Must fix`.
   - This fails closed, and the corpus has 0 such cases today. Reviewers reporting earlier rounds should write "Earlier must-fix 1: fixed", which the regex does not read. One line in the ruling would tell them.
5. **Old reviews and stale shas.**
   - "Reviews posted before this entry merges are read by Karma from their bodies" is right. The tool cannot tell the date, so after merge it will show older PASS WITH NOTES reviews on open PRs as BLOCKED-REVIEW. Expect that on the queue.
   - An older-sha PASS WITH NOTES without the line is no longer "stale", so the row reads NEEDS-REVIEW instead of STALE-REVIEW. This is cosmetic.
6. **Carried from round 1, unchanged.**
   - merge-queue.mjs:55, :56, :63, :116 and :288 still say "counted PASS", "both PASS" and "PASS only at an older sha". `REVIEW_RE` (:75) is still unused.
   - Two weaknesses existed before this PR: lens letters are text, so any OWNER session can clear a CHANGES; and verdicts posted with `gh pr review` are not read.
   - The follow-up list from round 1 still stands: CTO SKILL.md:132; page.mjs:63/:134 and README:31; OPERATING_MODEL.md:83 and the red-team and steward charters' ship / fix first vocabulary; AIE-R19; COORDINATION.md section 6.

### Authority and gate (unchanged from round 1, rechecked against the rewrite)
- CR-63 is within Karma's authority under D-132 ("Gates and limits (Karma's reading; the founder may reverse it): ... two independent counted reviews on the current head, green CI ..."). D-117's rule is "not the founder's words; the founder may reverse any of it".
- The rewrite keeps two reviews, the head, CI and the fence. It is now T2, as the CTO skill's "take the higher one" asks.
- Against develop, the gate is stricter, not weaker. Develop counts PASS on line 1 alone. Head adds a body check that can only take a pass away, plus a stated duty to write CHANGES.

### CI at 47acaacc (REST, 04:54 UTC)
- All three contexts develop requires are success: `applied migrations unchanged` (04:51:10Z), `compliance-fence` (04:51:05Z and 04:51:19Z) and `required` (04:54:23Z).
- Also success: tests and content rules, typecheck, database rules, edge functions, B-8, install, agent team consistent.

### Not verified
- The full `npm test` and typecheck locally. I ran only the agent-script tests; CI's `required` and typecheck are green.
- Whether the red-team standing audit runs on any schedule today (Note 2).
- Corpus figures come from running the head's own `parseReview` and my scratch prototype over 211 comments. I read by hand only the 19 merged-head reviews and the two false blocks.
- Whether Karma's thread reads review bodies before acting on READY. The ruling now says it does for old reviews only.

Reviewer: independent of the author (CR-44).
