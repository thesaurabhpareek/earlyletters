## Review A at 2bd764656482512bc900586f2ae98278134a5d0c: PASS WITH NOTES

Delta since my PASS WITH NOTES at 16d2b21e: one line, row 20 (qa). It drops `docs/prd/v2/06-nfr.md` and says product edits rows 42 and 216 for BL-930. That matches BL-930 on the lock branch ("an interactive session as `product` writes it"). No other line changed. The head was read live at 11:40 UTC; it was committed at 11:30:21 UTC. CI at the head: 10 of 10 success. The review of 16d2b21e follows and still holds.

Lens A: correctness and accuracy. This re-review covers the delta since my CHANGES at b13d2da0: c6a86942 (board fixes), then 16d2b21e (develop merged in).
- PR diff against develop 1400718b: `docs/agents/BOARD.md` only, +25 -11.
- The 11 deletions are status changes on 11 older rows. The develop merge brings only develop's own files; this PR's diff stays on BOARD.md.
- Head read live at 11:29 UTC; committed 11:19:26 UTC. CI at the head: 10 of 10 success.

### Ran
- `git diff b13d2da0 c6a86942` and `git diff origin/develop...16d2b21e`.
- Every row of Active claims parsed: 5 cells each.
- gh api on every PR cited as evidence in the released rows.
- File lists of #798 and of the five stack branches `feat/mobile-bl-952-{1-query,2-view,3-index,4-search,5-rebuild}`.

### Must-fix 1 (live claims): closed
Each released row's evidence matches GitHub:
- Row 36 S17: #163 merged d182e929 (1 Nov). #136 closed unmerged 31 Oct; #81 and #82 closed unmerged 28 Oct.
- Row 37 S19: #176 merged 5a1f5c4d and #123 merged 34ea292e (16 Oct). #143 closed unmerged.
- Row 38 S20: #145 merged dae722dd and #144 merged e187f8e2 (23 Oct). #205 merged 218955d7. #134 closed unmerged. The claim stays only on #30 (`.github/**`, open) and #105 (`apps/web/**`, open). No wave-1 row claims those files.
- Row 39: #109 merged 35fa82ea (31 Oct). #110 closed unmerged (1 Nov). #112 is still open but outside every wave-1 glob.
- Rows 61 and 63: released, with reasons. #81 and #82 are closed.
- Row 66: #481 merged c922a8b9, #483 merged f5f82879, #494 merged 150e3137. Its later `lib/reminders/**` claim is released to the BL-967 row.
- Rows 110, 112, 113 and 114: #828 merged 5f5dfaf4, #832 merged 5dc025d3, #834 merged 76a4a5d7, #841 merged 1513b265.

### Must-fix 2 (one owner per file): closed
- Row 13 (photo stack) is now the only owner of `(tabs)/book.tsx`, `features/index.ts` and `copy-surfaces.ts`. Row 12 names them as not its own, and row 23 points to row 13.
- `store.ts` is a declared share by function across rows 12, 13 and 14, with the second lander merging develop. This follows the row 78 precedent.
- `docs/qa/DEVICE_TEST_PLAN.md` is split: row S1-205 goes to Find, Part 4 to the build 9 row.

### Must-fix 3 (Find row globs): closed
- `app/find*` is gone.
- Every file #798 changes is in row 12, except these, which are named or acceptable:
  - the three files row 13 owns, stated in the row with a wait-or-hand-over rule;
  - `docs/agents/BOARD.md`;
  - `docs/agents/checkins/mobile.md`, the old shared check-in.
- Every file on the five stack branches matches row 12. `test/find-fixture.ts` falls under `test/find-*`.

### My notes from b13d2da0: taken
- BL-967 now names only NS-13-R14. The quiet-books and consent-key work carries no BL id.
- Row 21 (BL-958) claims `eas.json`, `preflight-production.mjs` and `release-config.test.ts`.
- Row 22 (BL-927) narrows to `toast.tsx` and `toast.logic.ts`.
- Row 20 (BL-930): `docs/prd/v2/06-nfr.md` is left to product, after Review B.
- Row 24 (legal) excludes #53's `QUESTION_PACK.md`.

### Notes (none blocking)
1. Row 65 (coverage agent, 15 Oct, still active) claims "new test files only under apps/mobile/test and packages/*/test". Wave-1 rows add new tests there: `find-*`, `consent-*`, `store-flags.test.ts`, `toast-large-text.test.ts` and `ns09-copy.test.ts`. Release row 65 or narrow it next time the board is touched.
2. #798 also edits `docs/agents/checkins/mobile.md`, which row 12 does not list. Harmless, since check-ins are per agent.
3. #740 and #780 (open, no board row) still change `lib/first-run/**`, and #758 changes `lib/reminders/**`. Row 14 and row 15 owners should know before they edit.

Must fix: none.

### Not verified
- Work in flight off GitHub for any released row.
- Branches with no open PR, other than the five Find stack branches.

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.
Reviewer: independent of the author (CR-44).
