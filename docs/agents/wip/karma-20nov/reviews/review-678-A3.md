## Review A at e192b8a3d54fa0cde3947c7737eb3605278fe07d: PASS WITH NOTES
Final delta review of PR 678 (lens A). `gh api` confirms head e192b8a3...; it is two RULINGS.md-only commits (f27107ac, e192b8a3) on 24b606cf. `git diff 24b606cf e192b8a3` is RULINGS.md only, 6 ins / 6 del, all inside CR-60. `docs/qa/` is untouched since 1f60320b, so my first review's device-plan verdicts stand. Worktree removed.

**Develop moved while I worked:** origin/develop is now a8bf1576 (two commits on 1189fdff: #667, #668, touching `write.tsx`, two tests and +20 lines in `DEVICE_TEST_PLAN.md`). `git merge-tree --write-tree a8bf1576 <sha>` is clean (tree 68c1c50e), and clean against PR 520's head. #668 adds a Plus line to Write but does not touch `persist`, `unmount` or `background`, so the S1-36 (l) trailing-space analysis is unchanged.

**Ran:** `apps/mobile` qa-release-catalog and billing-plan (reads RULINGS): 2 files, 50 tests passed. `packages/content`: 309 passed. Whole-PR added lines (33) and the delta: 0 bytes at or above 0x80, no ` --`, no `...`; `git diff --check` clean.

**New claims, verified**
- `docs/ops/runbooks/underage-account.md` and `stuck-deletion.md` exist. The first closes an under-18 account; the second is titled "an account deletion has not finished". Caveat the ruling already covers: `underage-account.md` section 4 says opening the deletion is "not yet possible from support", which is exactly the BL-551 gap.
- BL-551 is `BACKLOG.md:2508` ("Support can open an account deletion for another person (`ops_open_account_deletion`)"); `git grep ops_open_account_deletion -- supabase` has 0 hits, so "in no migration" is true.
- No written route for withdrawing sync or for see/export/correct exists under `docs/ops` (grep for withdraw, export/correct, DSAR: nothing relevant).
- CR-20 (`RULINGS.md:261`): "there is no human approval gate today, on `develop` or on `main`", and the coordinator may merge to `main` (D-107/D-117). CR-33 (`:405`): classic protection on `develop` and `main`, "A PR is required with 0 approvals", two required checks. Live read of `main` protection today agrees (0 approvals, checks `required` and `applied migrations unchanged`, admins enforced, no force pushes). `DEVELOPMENT.md:10` names Founder as `main`'s approver.
- `AUTH_SETUP.md:34`, as now described, is exact: until `terms` and `sensitive-data` rows exist every new account stops and stays local. #616 step 6 gates the `terms` row ("insert only after step 6 passes"). This fixes my earlier note 2.
- `.gitattributes`: #652 (1189fdff) adds exactly three lines (a blank, the comment "Legal texts are published byte for byte ...", and `apps/web/content/legal/**/*.md -text`), so "the three `.gitattributes` lines" is right. This fixes note 3.
- B2-9 (`ALPHA_GO_NO_GO.md:51`) still lists `curl` of `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/delete-account` and `main (b8b52d5)`: "stale and still checks the floating pages" is true. This fixes note 4.
- "the log and open PRs already use numbers up to CR-52": develop's RULINGS tops out at CR-47, open PRs reach CR-52 (#655), and #660 cites CR-54 (`build-queue.sh:25`). True as now worded. This fixes note 1.
- "A change before the first deploy keeps 0.9.0: re-run `sha256sum`, update the pins ..." matches #616 body ("If the founder edits either text before publishing, re-run `sha256sum`, then update the test, #652's copies and pins").
- The option-list quote is now a paraphrase, labelled as such. Still unverifiable from the repo, as before.

**Must-fix:** none.

**Notes (none blocks the merge)**
1. Version rule vs `POLICY_VERSIONING.md:69` ("A version number is never reused, even for an unpublished draft that leaked"). The repo is public (`gh api` private=false), and 0.9.0 has been in git on develop since 8 Nov. The ruling's "keeps 0.9.0 before the first deploy" rests on the #616 body, not on the policy file, and a reader of line 69 could say the number is already spent. No `policy_versions` row exists, so nothing breaks either way; consider "0.9.1 if in doubt" (line 66: "When in doubt ...").
2. "both are rules, not a gate": the PR requirement on `main` is enforced by GitHub (live protection confirmed above); what it does not do is stop a deploy, because approvals are 0 and any merger can merge. The sentence's conclusion is right, its wording slightly under-sells CR-33.
3. The "missing" list names the BL-551 tool and the sync and see/export/correct routes; the texts also promise deleting TestFlight feedback by hand, and I found no written route for that either (docs/ops, docs/release). Not verified exhaustively.
4. The Debate line still quotes the founder as having said "deploy the website", while the Ruling now says the option list is paraphrased. Same for the Release phrase, which is fine as a trigger phrase.
5. Cross-references now disagree with CR-60 on counsel. The merged #652 commit message (1189fdff) and the #652 body say no release until "counsel has read the texts (CR-60)"; CR-60 now says counsel is not a condition (D-138 item 1). The PR 678 body also still says the hold lasts until "counsel has read the texts" and that the ruling is appended "exactly as the Karma ruling file wrote it", which is no longer true of the file. The merged commit cannot change; the PR 678 body should be updated before merge.
6. Carried over, device plan untouched: stale "Settings > Recordings" at `DEVICE_TEST_PLAN.md:74` and `:147`; V-10 has no way to make a past due date; S1-15b step 6 omits the Speak primer and microphone prompt. RELEASE.md line should be dropped once CR-60 closes.

**CI at this head when I looked:** 9 check-runs, 7 success; `tests and content rules` and `database rules` still in progress, no `required` run yet. A PASS holds only once `required` is green at exactly this head.

**Not verified:** the founder's answers (session only); Vercel dashboard promote/redeploy ability; anything on a phone; root `npm test`, `test:db`, `typecheck` (docs only).

Reviewer: independent of the author (CR-44).
