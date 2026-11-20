## Review A at cd5a02c001ee26e8f3d66be63c450f9c4a0f772a: PASS WITH NOTES

Lens A: correctness and accuracy. At this sha: one row added to `docs/agents/BOARD.md` (:11), 1 file, +1 -0.

Head moved. The PR head is now 25495d0bff4d6b0a72acb9ad969d451a8200fd72 (commit "wave 1 claim rows", 05:41 UTC), which adds 13 more rows (+13 -0). This verdict is for cd5a02c0 as asked, so it does not count at the current head (review-gate section 5). The row reviewed here is unchanged at 25495d0b (the delta deletes nothing). The 13 new rows are not reviewed here.

### Read
- PR body (gh api pulls/855, now with "Round 2"). The diff `origin/develop...cd5a02c0`.
- `docs/agents/BOARD.md` at cd5a02c0: :1-11 (header, "append-only except for your own claim line", the column header `| Agent | Area | Files (globs) | Since (UTC) | Status |`), every row of Active claims (:10-101). `docs/agents/COORDINATION.md` section 2 (:14-26).
- PR #846: open, head 450bcb4a9efb4bf73991ee134d91662658de2426. PR #847: open, files include `docs/product/prd/17-engineering-project-plan.md`.
- Branch `docs/eng-eval-20nov` at 6c011919: `docs/engineering/eval-20nov/README.md:1-9` and the first lines of A, B and C; eval C section 1.4 (:83-104).
- `docs/adr/` on develop 20553b18; `RULINGS.md` on develop (CR-64 and CR-65 present).

### Ran
- `node scripts/agents/next-id.mjs`: `"ADR":"0029"` (develop and every open PR counted).
- `node scripts/agents/id-collisions.mjs`: no ADR line in its output (it reports old BL and D collisions only).
- Scanned all 172 open PRs' file lists (two pages) for `docs/adr/`: none adds an ADR file.
- Parsed the row: 5 cells, the same 5 columns as the header; ASCII only; no `|` inside a cell.
- Check-runs at cd5a02c0: all completed, success.

### Facts in the row, checked
- "#846 at 450bcb4a": matches #846's head.
- "the task plan #847" and `docs/product/prd/17-engineering-project-plan.md (#847)`: #847 adds that file.
- "docs/tdd/new-scope/** (new)": `docs/tdd/` exists on develop, `new-scope/` does not. Correct.
- "RULINGS.md (CR-64 on)": CR-64 and CR-65 are on develop. No live claim on CR-64 on: row 93 claims "CR-37 only".
- "docs/engineering/eval-20nov/A to C, branch docs/eng-eval-20nov": the three files and a README are on that branch.
- "input to these designs ..., not a second design": the README says so in its first line, "Inputs to the engineering thread's designs in `docs/tdd/new-scope/` and plan #847, not a parallel design" (README.md:3). The PR body's "the product thread's own README ... says the same" is accurate.
- "ADR 0029 to 0039 ... as eval C s1.4 proposes": eval C section 1.4 lists eleven ADRs, 0029 to 0039 (:87-99), and says 0029 is the next free number (:85). develop's ADRs run to 0028, then 0101; next-id.mjs agrees, 0029.
- Since 2026-11-20, status active: format matches the other rows.

### Findings, most serious first
1. Info, process. The head moved after this sha (above). Karma needs a new Review A at 25495d0b, or the 13 rows split out.
2. Low. The three eval files do not call themselves input. Their titles say "engineering design" (A:1 "Data and sync engineering design", B:1 "Mobile client engineering design", C:1 "... delivery design", C:5 "Status: design proposal"). Only the README frames them as input. The row is a claim of how they will be used, so it is not wrong; when the branch lands, the titles could say "evaluation" to match. The branch has no open PR, so the row points at a branch that can be deleted.
3. Low. The reservation of ADR 0029 to 0039 lives only in this board row. `next-id.mjs` and `id-collisions.mjs` read develop and open PRs, not BOARD rows, so they still hand out 0029 to anyone. Stubs in `docs/adr/` (or a line the tools read) would make the reservation real.
4. Info. Placement: the row is the second row of the table, while the 19 and 20 Nov claims were added at its end (:97-101). COORDINATION.md section 2 sets no position and BOARD.md:3 forbids only editing other lines, so this follows the rules; the 10 Nov design-systems row sits at the top too.
5. Info. Globs overlap no live claim. Row 56 claims `docs/agents/**` but was narrowed on 28 Oct to #112's files; row 98 (docs/product/prd) is done; "docs/agents/BOARD.md (this row)" is the pattern other rows use.

Must fix: none.

### Not verified
- The 13 rows added at 25495d0b.
- That no unpublished branch (outside an open PR) has taken ADR 0029.

This PASS WITH NOTES holds at this exact sha, which is no longer the PR head. Re-read at the new head.
Reviewer: independent of the author (CR-44).
