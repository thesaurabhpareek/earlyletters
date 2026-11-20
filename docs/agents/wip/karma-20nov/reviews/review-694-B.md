## Review B at 2c3a22fb30e0960c8d5a796f4de29f6faf41db2a: CHANGES

Lens B (records, rules, consistency). PR 694 head read with gh api = 2c3a22fb (matches the sha given). Base 25daad04; two commits (8b53ed91, 2c3a22fb). Diff is docs/BACKLOG.md and docs/DECISIONS.md only (+26/-11); no docs/legal, code, workflow or package file touched. A PASS would hold only with required CI green at this exact head: it is (below). The must-fix items are small wording and PR-body fixes, not a disagreement with the direction.

### What I ran and read
- `git diff --stat`, `git diff --check` (clean), added lines scanned for bytes >= 0x80 (none; no em/en dash, curly quote, ellipsis, emoji). No child name, no real family detail; "Asha" only, as the fictional family.
- `node scripts/agents/check.mjs` in my worktree: "26 agents, 396 backlog tasks ... agent team is consistent".
- `parseBacklog` on the PR's BACKLOG.md: BL-586 and BL-782 both parse as status `deferred`, BL-783 as `needs-founder`, mode `pair`. `eligibility()` (scripts/agents/lib.mjs:121-130) returns not-eligible for anything that is not `ready` or `blocked`, so both stay out of dispatch (read, not called).
- CI at this head (check-runs): 10 of 10 success (required, database rules, tests and content rules, edge functions, typecheck, no e2e seam, compliance-fence, install, agent team consistent, applied migrations unchanged).
- `git merge-tree --write-tree origin/develop 2c3a22fb`: clean (develop is now 19a3c8d7; the two commits since the base do not touch these files). No other open PR adds BL-783 (#684 ends at BL-774, #599 at BL-726, #621 BL-727/728).
- Spot-checked every file:line cited in BL-775 to BL-777, BL-780, BL-783 at this sha: all land (settings/index.tsx:145,147,148,175; strings.en.ts:745,1273,1304,803; pages.en.ts:199,223; account.en.ts:112,216,254; family.en.ts:58; resend.ts 90-91,158-159,196-197,207-208; F17:208; erase.tsx:22; erase-everything.ts:88). `cmp` shows docs/legal/beta and apps/web/content/legal copies identical; sha256 pins match at legal-beta.test.ts:21-22, legal-served.test.ts:19-20, legal-versions.e2e.ts:18-19. `git grep 0.9.0 -- supabase` finds nothing. #614 is merged (e229f2c6).

### Records and rules: what holds
- D-144: CCO-6 is at exec/RULINGS.md:119 and came in with #520 (`git log -S` finds 73fcc1ea), so the new wording is true. "The deferral that has a row" is accurate (BL-387 at BACKLOG.md:1182 also names BL-782).
- BL-782 -> `deferred (...)` matches how BL-586 uses the status (BACKLOG.md:2863; both fit the legend's `deferred (release, ...)` and neither carries a FUTURE id). Problem line says the CTO ruling is "in the PR conversation and not in cto/RULINGS.md, so this row is its only record" (:2963). I confirmed cto/RULINGS.md has no Face ID or passcode ruling dated 8 Nov. It does not cite the ruling as a repo record.
- BL-783 edits no docs/legal and routes the legal part to the founder (D-132, not delegated: docs/legal and changing what users are promised). App path is right: Your letters group (strings.en.ts:1278), Export your book (:1304), Delete account its own row above Help, signed-in only (index.tsx:175). CR-60 rule at cto/RULINGS.md:548 is quoted correctly, and POLICY_VERSIONING.md:69 is flagged for the founder rather than decided (CR-60 itself says its rule does not rest on that file). Re-pin steps and the 0.9.1 fallback match CR-60.
- Nothing in the PR promises users anything new; BL-782 and BL-783 describe work, not commitments.

### Must-fix
1. BL-783 reads as a complete grep result but is not (BACKLOG.md:2968-2976). It says "Checked ... with git grep -n 'Your data'" and item 4 lists three files "outside this row's files". The same grep also hits docs/legal/privacy-policy.md:114,127 (3.0.0, draft-for-counsel; the 0.9.0 privacy text says it was cut from it, 0.9.0.md:7), docs/legal/delete-account-page.md:32,36 (draft-for-counsel, "for: the words of delete-account-copy.ts") and docs/legal/in-app-disclosures.md:37. All are docs/legal, so founder-merged, yet Who and Requirement name only docs/legal/beta. Either list them and put them in the founder's PR, or say the list is not exhaustive and that counsel drafts are left for the counsel pass. Also `docs/store/compliance/data-and-account-deletion.md:88` is the App Review notes line (it goes to Apple); it is named with no owner and no acceptance. Give it one.
2. BL-783 acceptance bullet 2 (BACKLOG.md:2979) cannot pass for the part the row says "can go first". Its grep covers `apps/web`, which includes apps/web/content/legal/{terms,privacy}/0.9.0.md:98/:117; those keep "Settings, Your data" until the founder merges. Scope the grep to `packages/content/src apps/web/src`, or point the bullet at bullet 1.
3. The PR body does not match the diff. Commit 2c3a22fb adds two changes the body never mentions: BL-780 `strings.en.ts:1283` -> `whereLive.footer` (correct: footer is at strings.en.ts:1356 inside `whereLive` at :1332; :1283 is an unrelated comment), and D-144 Follow-ups widened from BL-775 to BL-781 to "BL-775 to BL-783" (DECISIONS.md:1120). Everything else in the body matches (BL-775 to BL-781 wording, :52 -> :148, BL-782 status/Who/Mode/blank lines, BL-783 contents and the two extra findings). Add both to the body.

### Should-fix (cheap, not blocking on their own)
- BL-782 Status line (:2961) says "CTO ruling of 8 Nov 2026" bare; the caveat sits only in the Problem line. Add "in the #520 conversation, not in the repo" to the status, or have Karma record it as a CR in cto/RULINGS.md so the repo holds it. Note the edit closes a CPO needs-decision on the strength of that unrecorded ruling.
- "design 2.12 (a Project document, not in the repository)" (:2963): docs/design/COMPONENTS.md has a section 2.12 (Sheet), so a reader will find one. The code means proposals/account-security/design.md 2.12 (strings.en.ts:880; no proposals/ directory exists in the repo). Say that.
- BL-783: "no policy_versions row exists (git grep 0.9.0 -- supabase finds none)" proves only that no migration or seed inserts one; the hosted project was not checked. Say "no migration inserts one".
- D-144 Follow-ups now include BL-783, but BL-783's source is #614 and its Extends line does not name D-144. D-144 is a founder-decided entry (DECISIONS.md:7); the edits touch only Karma's cross-reference fields, so the founder's words and decision are intact.

### Nits
- BL-783 is needs-founder as a whole while its text says the `pages.en.ts` and email part can go first; splitting the row would let that part move.
- The section title still says "8 Nov 2026 rulings"; the header paragraph does explain the 9 Nov row.

### Not verified
- Design 2.12 and the CTO's 8 Nov ruling themselves (both outside the repo); whether the hosted Supabase project has a policy_versions row; the #616 hash table contents (I confirmed only that the body mentions hashes); full `npm test`, `test:db`, typecheck (docs only, not run). No device step is needed; the device plan (S1-133) already covers Erase everything.

Reviewer: independent of the author (CR-44).
