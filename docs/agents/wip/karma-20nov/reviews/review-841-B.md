## Review B at 7d99361b9e151bfbeb995342547d6319dae846e6: PASS WITH NOTES

Lens B, confirm round: nothing security-relevant changed in the merge, and the name guards still hold. PR #841 is BL-931 slice 2b, the photo file layer in `apps/mobile/src/lib/photos/files.ts`. Its last counted reviews were "## Review A at 0307ae4e" and "## Review B at 0307ae4e", both PASS WITH NOTES. Since then #834 squash-merged into develop as 76a4a5d7, #841 was retargeted to develop, and develop was merged in as 7d99361b.

I confirmed the head with `gh api repos/thesaurabhpareek/earlyletters/pulls/841 --jq .head.sha` three times: at the start, after the test runs, and after CI finished. Each time it was 7d99361b9e151bfbeb995342547d6319dae846e6, and the base is develop.

Summary:
- The merge changed nothing in apps/.
- The PR's own apps/ patch against develop is byte-identical to the patch that was reviewed at 0307ae4e.
- The merge brought in only develop's 17 docs files. BOARD.md is a clean union of the two sides.
- The remove() name guard is still pinned: deleting it turns the M1 remove test red.
- Required CI is green.
- There is no must-fix.

### What I ran and found

1. Nothing in apps/ changed since 0307ae4e.
   - `git diff 0307ae4e84cf87dec21e31faf0ece311965bbe09 7d99361b9e151bfbeb995342547d6319dae846e6 -- apps/` is 0 bytes, and its `--stat` is empty.
   - Stronger checks:
     - `git diff 44dd950e 76a4a5d7 -- apps/` is 0 bytes. #834's squash on develop is exactly the slice-2 head (44dd950e) that the 0307ae4e reviews covered.
     - The PR's own apps/ patch against its new base (`git diff 76a4a5d7 7d99361b -- apps/`) is the same, apart from index lines, as the reviewed patch against its old base (`git diff 44dd950e 0307ae4e -- apps/`).
     - Both patches have the same `git patch-id --stable`: a1113810a653512702d055cdc21c3a2d6ad1181e.
     - They cover the same 4 files: files.ts, types.ts, test/helpers/expo-fs-standin.ts and test/photos-device.test.ts. The diff adds 347 lines and removes 3; that count includes the BOARD.md line.

2. The guards, in a scratch worktree at 7d99361b.
   - Set-up: `git worktree add --detach .../scratchpad/wt841-B 7d99361b`, with node_modules hard-linked using `cp -al` from /home/user/earlyletters for the root, apps/mobile and packages/content (the only package that has one).
   - Baseline: `npx vitest run test/photos-device.test.ts` in apps/mobile gives 1 file and 18 of 18 tests passing.
   - The requested mutation: I deleted `if (!safeName(path)) return;` from remove() (files.ts:81), and `git diff` showed that one line removed. Result: 1 failed and 17 passed. The failing test is the M1 remove test, "[C9] remove() refuses every name but <id>.jpg: ... (review M1, the remove half)" (photos-device.test.ts:85). It fails at :97 with "AssertionError: database: expected false to be true". Without the guard, `remove('../../../Documents/SQLite/scribe.db')` deletes the database.
   - Restored with `git checkout -- src/lib/photos/files.ts`. `git diff --quiet` and `git status` were clean, and the re-run gave 18 of 18.
   - An extra control I added: I deleted the write() guard (files.ts:73) and got 2 failed and 16 passed. The failures are :60 (the stored copy and the separator refusal) and :72 (M1, the write half). I restored the file, confirmed it was clean, and the re-run gave 18 of 18.
   - At the end I removed the worktree with `git worktree remove --force` and pruned. The main checkout's node_modules is intact: the root has 624 entries, and apps/mobile/node_modules holds only its `.vite` folder dated 8 Nov, as before. `git status` in /home/user/earlyletters is clean.

3. The merge brought in only develop's own changes.
   - 7d99361b has two parents: 0307ae4e (the reviewed head) and 76a4a5d7 (#834's squash). 76a4a5d7 is an ancestor of origin/develop.
   - `git diff --stat 0307ae4e 7d99361b` lists 17 files, all under docs/, with 1807 lines added and 2 removed: BACKLOG.md, agents/BOARD.md, agents/checkins/karma-cpo.md, product/VISION.md, product/prd/00, 05, 08 to 15 and README.md, roadmap/ROADMAP-2026-12-to-2027-05.md, and one next/20 stack-rank file.
   - The same 17 files appear in `git diff --stat 44dd950e 76a4a5d7`, the develop docs that landed since the old base. No file in the merge is outside develop's change set, and nothing is under apps/, packages/, supabase/ or .github/.
   - For 16 of the 17 files, the head's blob equals develop's blob (76a4a5d7).
   - `git diff-tree --cc 7d99361b` names only docs/agents/BOARD.md as differing from both parents. That is the only file where the merge combined the two sides.
   - BOARD.md is a clean union: develop's "Karma with the CPO role" row plus this PR's own "BL-931 slice 2b" row. There is no other edit.
   - A secret-pattern scan of the added lines in the merge diff found 0 matches. It looked for JWT prefixes, service_role, sk_live and sk_test, BEGIN-key blocks, AKIA, ghp_, xox and api_key.

4. Check-runs at 7d99361b, read after CI finished at about 04:31 UTC.
   - develop's required contexts, from the branch-protection API (strict=false), are `applied migrations unchanged`, `required` and `compliance-fence`.
   - On the live runs, all three are success:
     - `required` and `compliance-fence`: CI run 44674476558 and Compliance fence run 44674476723.
     - `applied migrations unchanged`: both Migration guard runs.
   - The other CI jobs on 44674476558 are also success: install, typecheck, tests and content rules, database rules, edge functions and ops scripts (Deno), and no e2e seam in store bundles (B-8).
   - Also success: agent team consistent (twice) and native files changed?.
   - "iOS simulator build (no signing)" was skipped. That is correct, because the merge brings in no native file.
   - The combined status (Vercel) is success.

### Notes
- N1, stale checks:
  - The check list at the head also shows `required: failure` (and cancelled jobs) from CI run 44674475574.
  - That run, and Compliance fence run 44674474155 (cancelled), were started at 04:27:01-02 and cancelled within seconds when the duplicate trigger after the base change (04:26) started the live runs.
  - The live `required` is success. Whoever merges should read the live run, not the first `required` row the API returns.
- N2, develop has moved:
  - develop is now d5a2676b (#827). It is one commit past 76a4a5d7 and touches only docs/DECISIONS.md and docs/release/FOUNDER_QUEUE.md.
  - Branch protection is not strict, so no update is required. Nothing security-relevant is involved.
- N3, carried over unchanged:
  - Round 2's Note 1 still applies, because files.ts is identical: a remove() guard weakened to a bare `.jpg` suffix check survives the suite.
  - Also, the M1 write test (:72) stays green when only the remove() guard is deleted, because in the stand-in `.`, `..` and `""` resolve to the folder, and `exists` is false for a folder. The remove half is pinned by :85 alone, as Review A at 0307ae4e already recorded.
  - Neither is new, and neither blocks.
- N4: "store-profile Release launch" (iOS compile run 44674476582) is still queued. It is not a required context. The PR body asks for it before Karma merges.

I changed no repo file and posted nothing.

Reviewer: independent of the author (CR-44).
