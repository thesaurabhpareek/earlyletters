## Review B at 774d3e135af6973210b44642f58cf5208bbe0b69: PASS WITH NOTES

Lens B, round 5 (confirm): governance and founder boundaries, wave and dependency logic, and the Q1 readings. Reviewer role: product manager and queue keeper. Read-only; nothing posted.

Head verified with `gh api .../pulls/847 --jq .head.sha` = 774d3e13, at the start and again before writing (last at 11:10:48 UTC).
- One commit since e42fb07c: 774d3e13, committed 06:04:47 UTC, +9 -8 in file 17. I waited until the head was more than 10 minutes old.
- Base e9dca86c; develop is 20553b18.
- The whole PR is 3 files, +771/-0 (768 in file 17, 2 in 13, 1 in README).

Must fix: none.

### What I read
- `git diff e42fb07c 774d3e13` (word diff) and the commit message.
- File 17 at the head: 17:124, 252, 299 (graph), 388 to 391, 413, 437 to 438, 463 and 600.
- The PR body.
- At the lock (#846, 450bcb4a): 08:305 to 308 (NS-09-R5 to R8 and their priorities).
- On develop: `apps/mobile/src/app/settings/storage.tsx:24-28`.

### My round-4 notes: all taken
- **NS-13-R14** is treated as never-list, the stricter reading, until the founder says otherwise (17:413).
- **The R7 fix lane is named.** It is built first in the quiet-books and consent-key lane claimed on #855, and BL-978 carries its NS-titled test (17:390).
- **Silence is stated.** Q1 now ends "If he does not answer, 3a's table as recommended holds the cut" (17:600).

### Review A's must-fix (NS-09-R6), from lens B
- **The priority is right.** NS-09-R6 is P1 at the lock (08:306), and the plan holds the cut on it by the same 14:14 rule as R7 (17:391, 600; graph 17:299). That is consistent, and it is inside Q1's default, which the founder can change. Accepted.
- **K3 is a founder boundary.** `storage.tsx:24-28` cites "founder decision 15": "Letters and recordings never appear here and are never touched". A card-side ruling by product cannot overturn a founder decision.
  - Product will rule within decision 15: the stuck-recording line and Remove now go on a surface other than Settings > Storage, or the Storage change goes to the founder as a question with a default.
  - Note: name decision 15 at 17:391. Otherwise the cut appears to wait only on a product ruling when part of it may be his.
- **The P1 rule can grow the cut.** 17:438 says any P1 row found failing joins the list.
  - By the same reading, two items in BL-978's own scope at the lock also look unbuilt: "retry after a lost `sync_books` answer" (NS-10-R11, P1) and "one Book-level line when backup is off" (NS-10-R13, P1).
  - Note: list them, or say why they are not failures. Either way it is consistent with 17:438's mechanism (the BL-964 trace report).

### Notes
- **N1. The PR body is one round behind.**
  - It still says "+770 lines: 767 in file 17"; the PR is +771 (768).
  - Its Q1 summary does not yet list P-4's NS-09-R6 among the rows that hold the cut, or the silence sentence.
  - The founder reads Q1 and Q5 there, so regenerate the body before he is asked. The file itself is correct.
- **N2.** The NS-13-R14 stricter reading is in 3a (17:413) but not in Q1's list of stricter readings (17:600), which names NS-10-R5 with [X4-R1] and [X6-R1] with NS-21-R13. Add it there too, so all three readings are visible in the founder's question. No effect today, because BL-967 holds the cut anyway.
- **N3. Governance is unchanged and clean:**
  - no date is set;
  - no word is approved;
  - nothing weakens a P0 or never-list row;
  - the size exceptions stay the founder's (Q4, Q5);
  - the source-of-truth naming is still marked relayed [U].
- **N4. Wave and dependency logic holds:**
  - P-4 is wave 1, owned by `mobile`, and depends on #832 (17:124);
  - the graph arrow into the cut matches the Q1 default (17:299);
  - "Where the keeping rows land" (17:463) now includes NS-09-R6.

### Size, ASCII, CI
- Added lines against develop are ASCII only (0 non-ASCII bytes).
- The size is +771 (768 + 2 + 1). The body's size line is stale (N1).
- CI at 774d3e13, read at 11:10:48 UTC: all 9 check runs succeeded, including the required `required`, `compliance-fence` and `applied migrations unchanged`. mergeable_state is clean.

### For the founder
1. Under Q1's default, Build 13 also waits for P-4's NS-09-R6, the Storage line for a recording that could not be let go. Its placement touches your decision 15 (Storage never shows letters or recordings). Product will rule within decision 15, or ask you.
2. Q5: the size exception is now +771 lines.

### Not verified
- Whether NS-10-R11 and R13 are built (read from BL-978's scope at the lock, not in code).
- The 08-keeping design K3, which is not in the repo.
- Lens-A facts.
- That the mermaid graph renders.

Reviewer: independent of the author (CR-44).
