## Review A at 774d3e135af6973210b44642f58cf5208bbe0b69: PASS WITH NOTES

Lens A: accuracy against the repo and GitHub. Round 5. Earlier rounds: ce7a5245 PASS WITH NOTES; a0f8a90b, 94603780 and e42fb07c CHANGES.

- **Head:** PR #847 at 774d3e13, confirmed from the API. Committed 06:04:47 UTC, one commit on e42fb07c (+9 -8).
- **Size:** 3 files, +771 -0: 768 lines in file 17, 2 in 13 and 1 in README.
- **Merge and text:** merges cleanly with develop 20553b18. Added lines are ASCII only.
- **CI:** read at 06:14:51 UTC, with the head 10 minutes old. Every check passed, including `required` (06:09:20), `compliance-fence` and `applied migrations unchanged`. Mergeable: clean.

Line numbers below are file 17 at the head.

### What I checked

- `git diff e42fb07c 774d3e13`, all 17 changed lines, and the lines around them.
- **Must fix 1 from round 4 is fixed.** P-4's NS-09-R6 (P1, not built, M8) now holds the cut beside BL-978's NS-10-R7, in each place the coordinator named:
  - Q1 (17:600), D9 (17:272) and the 3a bullet (17:391);
  - the graph edge `P4 -- "NS-09-R6 fix, P1" --> CUT` (17:309);
  - the P-4 build cell, and 17:464.
  - 17:438 no longer claims a single P1 failure. It says that the BL-964 trace lists every untested P1 row and that each one found failing joins the list.
- **The K3 conflict is real.** `apps/mobile/src/app/settings/storage.tsx:24-28` at develop 20553b18 says "Letters and recordings never appear here and are never touched". NS-09-R6 puts a stuck-recording line and Remove now in Storage. Naming that for product, with the cut waiting for either the row or the ruling (17:391), is right.
- **The R7 fix lane is named** (17:390). The `quiet books, consent key, BL-967` row on #855 claims "one consent key per answer".
- **NS-13-R14 is treated as never-list by default** (17:413). It is consistent with the stricter-by-default rule used for [X4-R1] and [X6-R1], and changes nothing in the cut, since BL-967 already holds it.
- **Silence rule** (17:600): "If he does not answer, 3a's table as recommended holds the cut." This closes my round-4 note 3. It also settles note 2: by that rule, risk 6's "failing rows hold the cut" (17:682) now agrees with 3a.
- **Graph:** only one edge changed style, no node or edge was added, and it is still acyclic.

### Findings

Must fix: none.

Notes:

1. **The PR body on GitHub is one push behind.** Its Size section says "+770 lines: 767 in file 17". The head is +771 with 768 in file 17. Update the line, and the size exception (Q5), before merge.

2. **Round-4 notes 1 and 4 are still open; neither changes the cut.**
   - NS-09-R9 (wording) and R15 (missing) are not marked "Fails" in 3a's Today column (17:423), and the failing-row lists leave them out (17:682, Not verified). Under the new silence rule the recommended fix still holds the cut, so this is labelling only.
   - M23 (17:714) still does not record that 14:14 makes a failing P1 row block a store build while 14:98 lists only P0. The plan now leans on 14:14 twice (R7 and R6).

3. **The K3 conflict is recorded only in 3a** (17:391). The design draft that names it is not in the repo. M8 (NS-09-R6 has no row) is where product will look, so add "R6's Storage line conflicts with `storage.tsx:24-28` (K3)" there.

### Not verified

- The 08-keeping and 09-capture drafts themselves (not in the repo). I checked their code facts at develop for NS-10-R3, NS-10-R7, NS-13-R14 and K3.
- Rendering of the mermaid edge labels.
- Device rows and the [E] estimates.
- Everything I verified in rounds 1 to 4 and did not re-read here: the heads, the counts, the cites at 450bcb4a and the capacity arithmetic. None of them changed in this commit.

Reviewer: independent of the author (CR-44).
