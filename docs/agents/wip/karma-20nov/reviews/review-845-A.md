## Review A at 47acaacc70353b4cd6af020eb43a077516b22a77: PASS WITH NOTES

Lens A, re-review after the red team's CHANGES: correctness of the merge-queue.mjs change (HV2-B32) and the accuracy of the rewritten CR-63. Read-only: no repo file changed, nothing posted.

Must fix: none.

The tool does what the rewritten CR-63 says. The body is read only to take a pass away; untrusted handling is unchanged; tests and CI are green. Its own header comment now describes the body check more strictly than the code applies it (note N1).

### What I ran
- `gh api repos/thesaurabhpareek/earlyletters/pulls/845 --jq .head.sha` = 47acaacc70353b4cd6af020eb43a077516b22a77. `git diff 3447065..47acaacc` (my last reviewed head) changes RULINGS.md, merge-queue.mjs (+27 -6) and the test (+24 -6).
- Detached worktree at 47acaacc under the session scratchpad (removed at the end).
- `node --test scripts/agents/merge-queue.test.mjs`: 29/29. `node --test scripts/agents/*.test.mjs`: 149/149 (11 files). Node 22.23.4.
- 11 mutations of merge-queue.mjs, one at a time, each restored with `git checkout` (results in section 2).
- A probe script (outside the repo) that imports the module and runs `parseReview`/`reviewState` on 27 edge-case bodies.
- A survey: every `PASS WITH NOTES` review at the merged head of the 27 PRs merged into develop since #705 on at least one such review (51 reviews), read through the new `parseReview`.
- Live table, GET only: `node scripts/agents/merge-queue.mjs --json` at 47acaacc, and in the same minute the copies at 3447065 and at origin/develop (via `git show`). Each gave 58 rows, exit 0, no notices.
- REST reads: comments on #306, #595, #798, #841, #844, #845, #847 and the 27 merged PRs; #306's GitHub reviews; check-runs at 47acaacc.
- `node scripts/agents/id-collisions.mjs --pr 845` at head: "PR #845 adds no id that develop or another open PR already has."

### 1. The rule in code (merge-queue.mjs at 47acaacc)
- `PASSING` :77 and `passes` :78 are unchanged: exact match on `PASS` or `PASS WITH NOTES`.
- `effectiveVerdict` :84-90:
  - It returns the stated word unchanged when that word is not a pass (:85). So the body can only remove a pass.
  - It collects every line matching `MUST_FIX_LINE` (:80; anchored, multiline, case-insensitive; bullet, quote, bold and heading marks allowed before it, a colon required).
  - Any such line whose text after the colon does not start with "none" gives `<word> (open Must fix)` (:87), for `PASS` too.
  - A `PASS WITH NOTES` with no such line and no `NO_MUST_FIX` phrase (:82) gives `<word> (no "Must fix: none" line)` (:88).
- `parseReview` :101-105 is the only caller. `word` is the effective verdict and `stated` the first-line word (:104). `stated` is returned but nothing reads it except one test (test:59).
- Met, blocked and stale all still go through `passes(r.word)`: latest :133, stale :134, blocked :137, A/B :139-140. So the body check reaches every decision.
  - The blocked note :285 prints the reason suffix, for example `A=PASS WITH NOTES (no "Must fix: none" line)`.
  - An older-sha `PASS WITH NOTES` without the line is no longer counted as a stale pass, so the row reads NEEDS-REVIEW rather than STALE-REVIEW when nothing else is at an older sha. That is display only.
- Untrusted authors: :129-132 unchanged. Probe: an untrusted `PASS WITH NOTES` with a "Must fix: none." line at head is still held back (A=false, untrusted=["A"]).
- Probe results, every one as the ruling reads:
  - `CHANGES` with a "Must fix: none." line stays CHANGES, and `FAIL` with "No Must." stays FAIL.
  - "**Must fix**: none" and "**Must fix:** none" count, and so does CRLF.
  - A must-fix line that is empty, "nothing" or "(none)" removes the pass (fail closed).
  - A must-fix line inside a code fence or a `>` quote also removes the pass (fail closed).
  - A double space ("Must  fix: none") does not count.
- Where the body check does not reach (see N3): a heading without a colon ("### Must fix" then a list) is not read. A numbered "1. Must fix: X" is not read. A `NO_MUST_FIX` phrase anywhere in the body rescues a `PASS WITH NOTES`, even in a sentence like "Lens B found no Must; I have one". "Musts: 1" and "Must-fix items: 1" under a plain `PASS` are not read.

### 2. Tests and mutations
Each mutation below turns test 20 red (28/29):
- M1 `PASSING = ["PASS"]`, the strict rule.
- M2 no body check at all.
- M3 the open "Must fix:" check dropped.
- M4 only a literal "Must fix: none" line accepted.
- M5 `NO_MUST_FIX` never matches.
- M6 the open check applied only to `PASS WITH NOTES`.
- M7 any "none" line wins over a line naming something.
- M8 no leading bullet or bold allowed.
- M9 no multiline flag.

Two survive at 29/29 (N4):
- M10 lets the body MAKE a pass: `CHANGES` plus "must fix: none" becomes `PASS`. This is the invariant CR-63 and the header state ("never to make one"), and no test pins it.
- M11 accepts "none" anywhere after the colon instead of at the start.

### 3. Live table at 47acaacc: which open PRs change, and why
53 of 58 rows are identical under all three versions (develop, 3447065, 47acaacc). The five that differ:
- **#841 (7d99361b)**: READY at 3447065, BLOCKED-REVIEW at 47acaacc. develop also gives BLOCKED-REVIEW, but with both lenses blocked.
  - Lens B at head is met: "- There is no must-fix.".
  - Lens A at head (OWNER, 04:32:13Z) is a confirm-round review with no Must line and no surveyed phrase, so it shows `PASS WITH NOTES (no "Must fix: none" line)`.
  - Its body (checks 1 to 4 "HOLDS") names no must-fix. This is the pre-merge case CR-63 hands to Karma.
- **#844 (27b963df)**: READY at 3447065, BLOCKED-REVIEW at 47acaacc. develop gives BLOCKED-REVIEW too.
  - Lens B: "Must fix: none." makes it met.
  - Lens A (OWNER, 04:28:21Z) writes "### Must fix", a blank line, then "None.". That is a heading without a colon, so it is not read as a none line. Same pre-merge case.
- **#847 (ce7a5245)**: BLOCKED-REVIEW in all three, because lens B at head says `CHANGES`.
  - Lens A ("Must fix: none. Nothing below is a wrong dependency ...") is now met.
  - develop listed it as blocked.
- **#798 (7f36031a)**: STALE-REVIEW in all three. The lowercase `b` that 3447065 showed is gone: B's older-sha `PASS WITH NOTES` at e7d399b3 uses "### Must fix" / "None.", so it is not a counted stale pass. Display only.
- **#845 itself**: STALE-REVIEW at both PR heads. My Review A at 3447065 counts as an older-sha pass through its "No Must." phrase. develop shows NEEDS-REVIEW because it never counts `PASS WITH NOTES`.

The #841 and #844 verdicts are what CR-63's ruling text says: the tool's reading applies from the merge on, and Karma reads the older reviews from their bodies.

### 4. CR-63 text (RULINGS.md:594-608 at head)
- Precedents are correct by REST:
  - #828, #829, #831, #832, #834 and #797 merged on two `PASS WITH NOTES`, and #827 on one.
  - #764, #826 and #738 merged on two each.
  - #306 merged at 8604b5c on `## Review A at 8604b5c: PASS` plus a red-team review at 8604b5c whose verdict line is "Verdict: ship".
- "#595 had exactly that shape": confirmed. #595's Review A at 8ba2a711 (08:27Z) was `PASS WITH NOTES` with acceptance item 2 "**Not met, and deferred in the PR body.**" and "Notes, none blocking". The new tool refuses both #595 `PASS WITH NOTES` lenses (no none line). I did not re-read #306 at f54b6f2: those reviews live in the coordinator's hold comment.
- The status-page claim holds: `scripts/status/README.md:31` and `page.test.mjs:102` (a `PASS WITH NOTES` with "One Must" gives CONDITIONAL).
- The ruling's forms match the code: "Must fix: none." plus the three surveyed phrases. "Any `Must fix:` line that names something takes the pass away, for PASS too" matches :87.
- "Door: `PASSING` and the two patterns are three lines" matches :77, :80 and :82.
- Way back: setting `PASSING` to `["PASS"]` alone now leaves the open-"Must fix:" check on `PASS`. That is stricter than develop, so it fails safe (N6).
- Tier T2 is appropriate: the change touches the gate for T2 paths.
- Consistent with D-132 (DECISIONS.md:1027, "two independent counted reviews on the current head"): two lenses, the current 40-char head and trusted authors are kept. "Counted" gains a body condition, which only narrows it.
- ASCII only: no non-ASCII byte in added lines. `git diff --check` is clean. CR-63 collides with nothing.

### 5. CI at 47acaacc
- The required contexts on develop are `applied migrations unchanged`, `required` and `compliance-fence`.
- All succeeded: applied migrations unchanged 136091446338, required 136092627121, compliance-fence 136091441355 and 136091535522.
- install, agent team consistent, typecheck, tests and content rules, database rules, edge functions and ops scripts (Deno) and no e2e seam (B-8) all succeeded too.
- The diff touches no native path, so the macOS checks do not apply.

### My earlier notes N1 to N3: do they now mislead?
- **REVIEW_RE (:75).** It still encodes "a `PASS WITH NOTES` first line is a pass". That is exactly the first-line-only reading CR-63 now rejects. It is dead code (no reference), so no verdict depends on it. It misleads a reader of the code, not the table, so it is not merge-blocking. Delete it with N1.
- **Legend (:288) and held note (:286).** These do not mislead about the gate.
  - A `PASS WITH NOTES` without the line shows `-` in `rev` plus a blocked note with the reason.
  - The held note's "PASS" is imprecise for an untrusted non-pass. That predates this PR.
- **NBSP display (:285).** Less of a problem now. Every genuine `PASS WITH NOTES` that is refused carries a reason suffix, so an unexplained "PASS WITH NOTES" in a note stands out as a different string. It fails closed.

### Notes (non-blocking)
- **N1. The header comment (:23-25) describes a stricter check than the code applies.** It says later lines are "read for one thing only, the "Must fix:" line" and that a `PASS WITH NOTES` "counts only with a line `Must fix: none`".
  - In fact the code also accepts the three `NO_MUST_FIX` phrases anywhere in the body (:82, :88). That looser match is the surface CR-63's pre-mortem item 3 worries about.
  - The BLOCKED-REVIEW line (:53-54) and the `reviewState` doc (:111-112) also do not mention the body reasons.
  - The header is the tool's only usage doc (:7). Fix it with REVIEW_RE in the next push to this file, or now if #845 gets another push.
- **N2. The tool refuses the commonest honest form of "no must-fix".** Of 51 `PASS WITH NOTES` reviews at merged heads since #705, the new tool would count 21 and refuse 30, all for "no none line", none for an open must-fix.
  - The refused forms include "### Must fix" / "None." (#844 A, #841 A at 0307ae4e, #798 B, #764 B) and "**Must-fix.** None." (#753 A, #756 A, #787 A).
  - CR-63 says the tool accepts "the forms reviews here have used"; it accepts three of them, not these.
  - It fails closed and CR-63 moves reviewers to "Must fix: none.", so this is transitional. But one change would both accept the honest form and close part of N3: treat a "Must fix" line without a colon (heading or bold, optional period) as taking its text from the next non-empty line.
- **N3. Fail-open edges, all of them self-contradictory reviews.**
  - "### Must fix" followed by a list under a plain `PASS` still counts (the heading form is how CHANGES reviews here list must-fixes: #841 A at 29e35220, #847 B, #798 at e6846f23).
  - "1. Must fix: X" (numbered) is not read.
  - `NO_MUST_FIX` matches mid-sentence.
  - The pre-mortem names the second lens and the red team's sample as the check, which is fair. Anchoring `NO_MUST_FIX` to the start of a line would remove the mid-sentence case. My previous review's "... CR-63. No Must." would then need its own line.
- **N4. Missing tests.** No test pins "the body never makes a pass" (M10 survives). One assertion would do it: `CHANGES` plus "Must fix: none." stays not met. M11 shows that "none" is not checked to be at the start.
- **N5.** The precedent sentence now lists #764, #826 and #738 too. Fine.
- **N6.** "Way back" no longer returns exactly to develop's behaviour, because the open-"Must fix:" check on `PASS` stays. That is stricter, so it fails safe; say so or also name `effectiveVerdict`.

### Not verified
- The red team's description of #306's reviews at f54b6f2 (in the coordinator's hold comment, not posted as review comments).
- Whether Karma's follow-up docs PR listing uncarried notes happens. That is a process promise, not code.
- Reviewer independence on the cited merges.

Reviewer: independent of the author (CR-44).
