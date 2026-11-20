## Review B at d178068ca285da23bef156a548966fb19dacd19d: PASS WITH NOTES

Lens B, confirm review: the merge of develop into #842 changed nothing security-relevant, and the Swift scan still guards. This is a re-confirmation of "Review B at 96c226ac" (PASS WITH NOTES) after #841 squash-merged (1513b265) and #842 was retargeted to develop. I did not write this PR.

Must fix: none.

Head: `gh api repos/thesaurabhpareek/earlyletters/pulls/842 --jq .head.sha` returned d178068ca285da23bef156a548966fb19dacd19d at the start and again at 05:22 UTC, after CI finished. Base is develop at 1513b265. d178068c is a two-parent merge: 96c226ac (the reviewed head) and 1513b265 (develop).

### Check 1: apps/ is byte-identical to the reviewed head
- `git diff 96c226ac d178068c -- apps/` is empty (0 bytes).
- The `apps` tree hash is cc1339ac at both 96c226ac and d178068c.
- `git diff --quiet 96c226ac d178068c -- apps packages package-lock.json package.json supabase .github/scripts` exits 0: none of these changed.

### Check 2: the scan at the head, and that it still bites
I made a scratch worktree at d178068c, with node_modules hard-linked (`cp -al`) from the repo for the root, apps/mobile and packages/content. The other packages have no node_modules.
- `npx vitest run test/photos-device.test.ts` (apps/mobile): 1 file, 19 of 19 pass. The positive control holds 98 mutants.
- Mutation 1, the scan: I reverted the *at family in the POSIX ban (test:331). The regex became `rename|renamex_np|link|symlink|unlink|clonefile|...|mkdir|...`, with no `\w*` suffixes, no `linkat`, no `openat\w*` and no `AT_FDCWD`.
  - Result: 1 failed, 18 passed.
  - The positive control goes red at "renameatx_np over the JPEG: expected 0 to be greater than 0".
  - The real module still passes the scan, so the ban has no false hit.
- Mutation 2, a lifecycle line in the Swift: I put viewDidDisappear back to an unconditional `session.cancel()`, the pre-2c line (Swift:310).
  - Result: 2 failed, 17 passed.
  - The scan test reports "not exactly once: the sheet leaving, and only leaving, answers a Cancel".
  - The positive control's `swap` precondition also goes red.
- Mutation 3, a lifecycle line in the Swift: I put back dismiss-before-answer in `picker(_:didFinishPicking:)` (Swift:257-258).
  - Result: 2 failed, 17 passed.
  - The scan reports "not exactly once: a pick or Cancel answers, then closes the sheet".
- Mutation 4, a lifecycle pin in the scan: I removed the viewDidDisappear entry from PINNED (test:278).
  - Result: 1 failed, 18 passed.
  - The positive control goes red at "a sheet dismissed by code never answers: expected 0 to be greater than 0".
- After each mutation I restored the file with `git checkout`. The final rerun was 19 of 19, and `git diff --quiet HEAD` was clean.
- The worktree is removed (`git worktree remove --force`). The repo working tree is clean, and the repo's node_modules are intact.

### Check 3: the merge brought in only develop's changes
- `git diff --stat 96c226ac d178068c` lists 24 files, +2191/-28.
  - 21 of them are docs.
  - The other three: `.github/workflows/ios-compile.yml` (#844) and `scripts/agents/merge-queue.{mjs,test.mjs}` (#845).
  - Nothing is under apps/, packages/ or supabase/.
- 23 of the 24 files are byte-identical to develop (1513b265). The one exception is `docs/agents/BOARD.md`: the merge kept develop's added Karma row and the PR's own slice 2c row.
- The commits brought in (`git log 96c226ac..1513b265`) are #841, #844, #845, #797, #827, #834 and #829.
- Merge resolution:
  - `git merge-tree --write-tree 96c226ac 1513b265` reports add/add conflicts in ScribePhotoModule.swift, photos/types.ts and photos-device.test.ts, and a content conflict in BOARD.md. That is expected when a squash merge meets a stacked branch.
  - The apps/ side was resolved to the PR side. That loses nothing from #841, by these hashes:
    - #841's head 7d99361b, the common base 0307ae4e and develop 1513b265 all have the apps tree e1c291c8;
    - #841's only commit after 0307ae4e is a docs-and-#834 merge of develop, with no apps/ change.
- Net PR diff against develop: `git diff 1513b265 d178068c` is the same 4 files, +68/-20, as the reviewed diff `0307ae4e..96c226ac`. The sha256 of the apps/ patch is identical between the two (f0b9cd24...).
  - It has 0 non-ASCII added lines.
  - It touches no plist, entitlement, app.config, eas.json, package, podspec, workflow, supabase or packages/ path.
- Develop's non-doc changes, read for security:
  - ios-compile.yml (#844) only greps the xcodebuild log for linker errors in the `compile` job. It is still `pull_request` (not `_target`), with `permissions: contents: read` and no `secrets.` reference. The `launch` job is byte-identical to 96c226ac.
  - merge-queue.mjs (#845) is agent tooling (CR-63: PASS WITH NOTES counts only with "Must fix: none"). It does not touch the app.

### Check 4: check-runs at d178068c (REST, read 05:22 UTC)
- **Required contexts are green** (branch protection on develop: "applied migrations unchanged", "required", "compliance-fence"):
  - `required` is success (job 136102559766, 05:21:59Z).
  - `compliance-fence` is success (136100835282).
  - `applied migrations unchanged` is success (both runs).
  - An earlier `required` failure (136100832446) belongs to CI run 44679999431. Concurrency cancelled that run when two `pull_request` events arrived for the retarget. GitHub reads the newest run, so the failure is superseded.
- **Other CI jobs are green:** typecheck, tests and content rules, database rules, edge functions and ops scripts (Deno), no e2e seam in store bundles (B-8), install, and agent team consistent.
- **Still waiting:**
  - `store-profile Release launch (testflight env, no seam, 20 s)` (136100835321) is QUEUED on a macOS runner and had not started.
  - `iOS simulator build (no signing)` (136101030314) is also queued.
  - Their inputs (apps/, packages/, package-lock.json, .github/scripts, and the launch job's own definition) are byte-identical to 96c226ac. There, the Release launch succeeded and the Debug simulator build failed at the app link, as develop does.

### Notes (none blocks)
- N1: The two macOS checks are still queued. The merge queue holds a PR that touches apps/mobile/modules/ at WAIT-CI until both succeed (merge-queue.mjs:197), so the gate does not depend on this review.
- N2: The notes from "Review B at 96c226ac" stand unchanged, because the code is byte-identical:
  - N-B3d: two bypass classes, shadowing a pinned name and building a banned name at run time;
  - N-P3: the covered-then-removed sheet waits for the next pickOne. This is availability only.

Reviewer: independent of the author (CR-44).
