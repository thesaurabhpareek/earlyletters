## Review A at 2a33acab50be3c20aef591025ad2dfcf9f7b50e3: CHANGES

Delta review A of PR 692 (docs only). Head confirmed by gh api: 2a33acab, one commit on 718513c7. `git diff 718513c7 2a33acab`: BACKLOG.md and DECISIONS.md only (+40 -33); CR-60 untouched, so my first-round CR-60 checks stand. Worktree at the new sha. develop is still 461b9645. #520 moved to a28a64e2 (was 3ae9eab2); see below.

### What I ran
- Strings: all 6 strings D-144 quotes are byte-identical to copy.settings.erase on #520's new head a28a64e2, and the whole erase block is identical to 3ae9eab2. a28a64e2 is a merge of develop (#614, #679). The lines cited for BL-775 to BL-777 still hold on it: store.ts:1030, erase-everything.ts:124, erase.tsx:80, erase-all.test.ts:588. D-144 and the BACKLOG intro still say "3ae9eab2", which is true of where they were read.
- Ids: refetched all 143 open PRs and scanned their patches (D-138..150, BL-770..800). Same set; only #520 and #692 heads moved. D-144 and BL-775 to BL-781 are used by no other PR (#664 only prints "D-144 free"). next-id.mjs at this head prints BL-782 and D-145 (it counts #692 itself); id-collisions earlier showed no clash for #692.
- node --test scripts/agents/*.test.mjs scripts/trace.test.mjs "compliance/**/*.test.mjs": 159 pass. check.mjs consistent (394 tasks). trace.mjs --no-write exit 0. mobile billing-plan + qa-release-catalog: 50 pass. packages/content: 13 files, 309 pass.
- parseBacklog/eligibility on the new rows: BL-775 and BL-781 blocked, blockers [BL-387], not eligible; BL-776/777 needs-decision; BL-780 human; BL-778 and BL-779 ready, owner platform (ops), eligible.
- Added lines: 0 non-ASCII bytes; the only " -- " matches are `git grep ... -- apps .github` pathspecs in code spans. diff --check clean.
- merge-tree: clean against current develop and #520 head. Against #576: DECISIONS.md only, the same two hunks (D-140 vs D-144 row and entry), keep-both.
- CI at 2a33acab: 11 check runs, all success except one compliance-fence run that is cancelled at 00:00:06 and superseded by a success at 00:00:19; "required" success. mergeable_state clean. A PASS holds only while required CI stays green at this exact head.

### Round-one items
Item 2 attribution: fixed (D-144 now splits founder / Karma's / open / fact, and its internal references are consistent, no dangling "item N"). Q58 to Q74: matches #598 (head dc799fb9: Q58 to Q60 TestFlight, Q61 to Q74). BL-775 S1: legend (BACKLOG.md:2530) puts "can lose a word" at S0, S1 is "before any sign-in outside the family"; the reason given (warned on the failed line, needs a failed erase the person started, CCO-6 "Open, not blocking") is accurate. BL-779: BL-237 exists (line 663, "Remainder ready: a privacy_requests log (a dated spreadsheet is acceptable at v1.0 volume, TDD 10 section 7)") and the request-matrix claims match chapter 08 (email routes, `record_policy_act` support_assisted, correction "through a runbook"). BL-780: FT-18 exists (FOUNDER_TASKS.md:207, "Send counsel the v1.0 package and the question list", still unchecked). BL-387 exists (line 1181) and the parser reads "blocked (BL-387)" as a blocker. BL-778: `git grep LEGAL_CONTENT_DIR -- apps .github` finds only documents.ts:49; vercel.json has only installCommand and the build is `next build`, no hash step; the curl check is in CR-60. `design-systems` is a roster handle.

### Must-fix
1. D-144 "Karma's, not the founder's" (and the index row) says #616 and #652 were merged "on the strength of his selection ... and D-132, which gives merge decisions to Karma". D-132 lists `docs/legal/**` as "Not delegated ... a founder merge", and #616 changes docs/legal/beta/*.md and docs/legal/POLICY_VERSIONING.md (gh api pulls/616/files). So D-132 cannot be the authority for #616 and the entry would become a false precedent. Say the merge rests on his selection of that option (a paraphrase) alone, note that D-132 does not cover docs/legal, and keep "he may reverse it".

### Should-fix
2. D-144 item 1, under "Decided by the founder": "It ships in the build that follows build 11". "Build 11" appears nowhere in the repo or any open PR patch (I searched develop and all 142 patches); his recorded label says only "Ship with the three edits". Confirm from the session and move the sentence out of the founder bullet (or say it is from the session), or drop it. Same class as round one's "build 12".
3. BL-781 names the surface "Settings > Your data > Erase everything on this phone". After #614 the row is in Your letters (#520 settings/index.tsx:152, S1-133 (d)); "Your data" was removed from settingsHome.sections. Change the path.
4. BL-778 is now Owner: platform, Mode: agent, Status: ready, so the dispatcher assigns it to `ops` (eligibility ok), while its Who line says the web lane (outside the roster) makes the change. HARNESS.md:121 and roster.json say the dispatcher never assigns the website thread's tasks. Either keep Owner: web lane, or make it Mode: pair/human, or say ops is meant to edit apps/web.
5. BL-387 stays `ready` (also on #520's head), so BL-775 and BL-781 never unblock, and an agent could pick BL-387 up again. Say in the rows or D-144 follow-ups that BL-387 is marked done when #520 merges.

### Not verified
"Build 11" and the founder's labels as typed (session only). BL-776 on a phone. Apple's TestFlight rules. Hosting env vars. capabilities.test.ts not rerun this round (environment failure last round, unrelated to docs). No device step applies to a docs PR.

Reviewer: independent of the author (CR-44).
