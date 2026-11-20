## Review A at 1dfee17f8b8085167c3240e42e9745a41ee1a7c9: PASS WITH NOTES

Delta review A of PR 692 (docs only). Head confirmed by gh api: 1dfee17f, one commit on 2a33acab. `git diff 2a33acab 1dfee17f`: BACKLOG.md (+4 -4) and DECISIONS.md (+5 -5), nothing else. develop is still 461b9645; #520 is still a28a64e2 (strings and cited lines checked last round, unchanged since). Worktree at the new sha, since removed.

### Last round's five items
1. D-132 citation for the #616 merge: fixed. The index row now says "Karma's, under CR-60: #616 and #652 merged to `develop` on his selection alone", and the entry says the merge rests on his paraphrased selection alone, that D-132 does not cover it, and that he may ask for a revert with CR-60 as the way back. Facts checked: D-132 lists `docs/legal/**` under "Not delegated"; gh api pulls/616/files lists docs/legal/beta/privacy-0.9.0.md, terms-0.9.0.md and POLICY_VERSIONING.md; CR-60 "Way back" says revert #652 and #616 before a deploy. The two D-132 mentions left in D-144 (lines 1111, 1113) are correct (the carve-out, and "Karma's reading" of what users are promised).
2. Build-timing sentence: gone. No "build 11" or "build 12" in D-144 or any added line.
3. BL-781 path: now "Settings > Your letters". Its aside is true: #520's erase-everything.ts:88, BL-387's scope and F17-settings-privacy.md:208 still say "Your data", while settings/index.tsx:152 on #520 places the row last in Your letters.
4. BL-778: Mode pair. parseBacklog gives mode=pair, eligibility {ok:false, reason:"mode pair"}, so the dispatcher stays off it. The cited rule holds: HARNESS.md line 121 sits in section 6 ("Creating an agent") and says the dispatcher never assigns the web lane's tasks; BACKLOG.md:24 says it skips `pair`.
5. BL-387 note: present in the BACKLOG intro and in D-144 Follow-ups; BL-387 is `ready` (line 1181) and BL-775 and BL-781 parse as blocked with blockers [BL-387].

### What I ran
- Parsed all seven rows: BL-775 and BL-781 blocked by BL-387; BL-776 and BL-777 needs-decision; BL-778 pair; BL-779 ready/agent (eligible, owner ops); BL-780 human. Task count 394.
- node --test scripts/agents/*.test.mjs scripts/trace.test.mjs "compliance/**/*.test.mjs": 159 pass. check.mjs consistent. trace.mjs --no-write exit 0. billing-plan + qa-release-catalog: 50 pass. packages/content: 13 files, 309 pass.
- Ids: refetched all 143 open PRs and their patches. No PR opened, closed or moved except #692. D-144 appears only in #664's "free" remark; BL-775 to BL-781 and D-145 up are used nowhere.
- 0 non-ASCII bytes on added lines; diff --check clean.
- merge-tree: clean against develop 461b9645 and #520 a28a64e2. Against #576: DECISIONS.md only, the same two keep-both hunks.
- CI at 1dfee17f: when I first looked three jobs were in progress; I waited, and all 10 finished green including "required". The one compliance-fence "cancelled" is the earlier superseded run (00:08:09, replaced by a success at 00:08:12). mergeable_state clean. A PASS holds only while required CI stays green at this exact head.

### Must-fix
None.

### Nits (not blocking)
- The index row calls the #616/#652 merge "Karma's" while the same sentence says it rests on his selection; the section heading "Karma's, not the founder's" has the same tension. Reads fine because the reason is stated.
- BACKLOG.md:35 defines `pair` as "interactive session with the founder"; BL-778 uses it to keep the dispatcher off and explains why in its Who line.
- BL-387 is still eligible for the dispatcher (ok:true) while #520 is open, so an agent could start it again. Setting it to `in-progress` (a status the dispatcher skips, and BL-775/781's blocker still waits for `done`) would close that; outside this PR's scope.

### Not verified
The founder's option labels as typed (session only). BL-776 on a phone. Apple's TestFlight feedback rules. Hosting env vars. capabilities.test.ts not run (environment failure in round one, unrelated to docs). No device step applies to a docs PR.

Reviewer: independent of the author (CR-44).
