## Review A at bf03bed0a45f759213cd4c3685d2f83862b9d563: CHANGES

Lens A: accuracy against the repo and GitHub, backlog rows, engineering plan and sizing, ids.

### What I checked and ran
- Head: `gh api .../pulls/829 .head.sha` = bf03bed0 = `origin/docs/new-scope-final-rank-and-tasks-19nov`. I checked it again at 23:59:58Z and it had not moved. Base develop is a17254f6 and the merge-base is 5f5dfaf4. There are two commits since bb07317d: 864015bd (answers Review B) and bf03bed0 (answers Review A). The delta is 7 files, +52/-52. The whole PR is 17 files, +1,804/-2, and git numstat and gh api agree.
- Read: both reviews at bb07317d; both author comments (23:43:18Z and 23:44:40Z); the PR body; the whole delta; the BACKLOG section (3521-3712); 13 and 20 in full; the roadmap; 00 section 10; 15:1-26; and the P0 register (14:81-104). In `scripts/agents/lib.mjs`: parseBacklog, parseStatusLine, parseBlockers, eligibility, takenIds and queueFor. In `dispatch.mjs`: lines 72-77 and 241-246.
- Ran in a scratch worktree at bf03bed0, with no node_modules needed:
  - `node --test scripts/trace.test.mjs scripts/agents/*.test.mjs`: 170 pass, 0 fail, exit 0.
  - `node scripts/agents/check.mjs`: "agent team is consistent", exit 0.
  - ASCII check: no non-ASCII added line in 5f5dfaf4..bf03bed0 or in the delta.
  - `git merge-tree --write-tree origin/develop bf03bed0`: clean.
- Dispatcher simulation: I loaded lib.mjs at the head and parsed the real BACKLOG.md. I ran eligibility on BL-923 to BL-949. Then, round by round, I marked each newly eligible row done and ran it again. I also tested two other status forms against lib.mjs.
- CI at bf03bed0: there are 11 check-runs, and the latest run of each name succeeded: required, compliance-fence, applied migrations unchanged, tests and content rules, typecheck, database rules, agent team consistent, edge functions, install, and B-8. One compliance-fence run was cancelled at 23:44:31Z; its rerun succeeded at 23:44:44Z. Branch protection on develop requires three checks (applied migrations unchanged, required, compliance-fence), and all three succeeded. mergeable_state is clean. Required CI is green.

### Status of earlier must-fix items

Lens A at bb07317d:
1. Stale in-flight lines. Fixed.
   - 20:14, :23 and :80 say #828 merged as 5f5dfaf4. True: it merged at 22:40:39Z.
   - 20:15, :24, :76 and :77 say ADR 0028 was accepted under CR-62 (#831, a17254f6). True: #831 merged at 23:19:06Z, and CR-62 is at RULINGS.md:570 on develop.
   - 20:26 says #796 is at 8a026397. True, and it is a draft.
   - 13:87 says NS-35 is done, and wave 1 at 13:106 no longer lists the NS-35 or NS-36 reviews. BOARD:97 is rewritten.
   - Left: 20:3 and 20:21 still time the state "at 22:15 UTC" (see Notes).
2. BL-923, BL-924 and BL-931 statuses. Fixed. BACKLOG:3526 and :3535 say in-review (PR #832). #832 is open and not a draft, at head 3e3b3eaa, and its title carries BL-923 and BL-924. BL-931 (:3585) is in-progress, so eligibility rejects it whatever takenIds holds (lib.mjs:128-129).
3. BL-933. Fixed. :3600 says blocked (BL-868; BL-931 slice 3) and depends on BL-868 and BL-931, and :3601 cites CR-62. The BL-868 row and the CR-62 note are on develop (BACKLOG.md:3395, :3403).
4. BL-934 and BL-940. Partly fixed.
   - Both rows are marked superseded (:3607, :3645).
   - BL-941 cites NS-14-R1 to R7 with no dependency (:3652-3653), and the card has R1 to R7 (09:106-112).
   - BL-942 no longer waits on BL-934 (:3659).
   - Not done: 20:84, 20:88 and 08-keeping-and-trust.md:206 still point at BL-934 and BL-940. Carried as Must fix 2.
5. Size exception. Fixed: the body has a "Size exception:" line. Its "about 1,500 added lines" is low, since GitHub reports 1,804 (see Notes).
6. BL-948 to J-N27. Fixed at BACKLOG:3703 and README:22. The P0 device journeys it names match 14:55-63.
7. The lens control fix. Fixed.
   - BL-927 (:3561) drops it.
   - BL-928 (:3568) drops the radio check.
   - BL-931 slice 5 (:3588) carries it and cites NS-33-R3, which is the right row (11:31).
   - Side effect: BL-927 still says "four fixes" but lists three. BL-928 says "the four fixes" and "those tests", but only one test is left (see Notes).

Lens B at bb07317d:
1. Wave order follows X1. Fixed in 13:106-108, in ROADMAP:15-16 and in the rows (BL-944 at :3673 and BL-947 at :3694 are now blocked). It did not reach 20 section 5 (20:127-135) or the first clause of BOARD:97, which still describe the old wave 2 (Must fix 3).
2. BL-943 keys on made, not kept. Fixed at :3668. This matches 09:17 and NS-13-R8 (09:53).
3. Council record. Partly fixed. 00:170-179 now matches 15:3, :5 and :26: two passes, the CMO in pass 1, the CBO not run. B also asked that 00:3 and VISION:3 say one Claude session wrote the pack, and they still do not. Lens B should judge this one.
4. Journeys to J-N27. Fixed (same as A item 6).

Notes from the earlier rounds that were taken:
- BL-936 reads in-review (:3620).
- BL-942 no longer depends on BL-937, so 13:41 "none" now holds.
- 20:71 no longer calls BL-926 ready.
- The 08-save-a-copy name collision and the NS-14 duplicate went away with the superseded rows.

Notes from the earlier rounds that were not taken (all still true at the head):
- BL-931 is sized M, but it includes a native module, which is L under 13:11.
- BL-945 is sized M, but 13:50 sizes NS-15 L.
- 20:90, :91, :95 and :147 say C-20, C-07 and C-25 are not broken down. BL-944 to BL-947 break them down.
- 13:48, :90 and :106 call NS-32 (#758) in review, but #758 has been a draft, untouched, since 10 Nov. 13:65, 20:78 and 20:82 do the same for #798, which is also a draft.
- BL-770 is cited at BACKLOG:3667, 20:28 and 20:74 but is not a row on develop.
- 14:3 says `scripts/trace.mjs` finds the bracketed ids. Develop's trace.mjs:37 reads only REQ and NFR ids.
- BL-942 cites `[NS-11-R6]`, but the card has R6a and R6b (08:194-195).
- B's notes I checked are not taken either:
  - VISION:50 has no "proposed".
  - 20:141 still says spec 07 "waits".
  - 10:206 gives NS-29 rank 38, but 20:106 gives rank 37.
  - 10:176 covers store builds only.
  - ROADMAP:3 still says the draft "replaces" FUTURE.md's dates.

### New findings

Must fix
1. The wave-2 hold does not stop the dispatcher for six rows.
   - How it leaks: lib.mjs:101 reads only the first parenthetical in the status text. parseBlockers (lib.mjs:106-110) treats it as a blocker list when it holds nothing but BL ids. eligibility (lib.mjs:124-127) then passes once those ids are done. The text after "); and wave 2 or later: ..." is never read. So a row written "blocked (BL-xxx); and wave 2 or later ..." is held only until BL-xxx is done:
     - BL-928 (:3565), after BL-927, which is ready now.
     - BL-948 (:3701), after BL-929, which is ready now.
     - BL-937 (:3626), after BL-928.
     - BL-939 (:3638, Share, wave 3) and BL-946 (:3687, one past letter, wave 3), after BL-937.
     - BL-945 (:3680, another day, wave 3), once BL-944 is marked done.
   - The simulation on the real BACKLOG at the head hands out:
     - round 1: BL-927, 929, 935 and 949;
     - round 2: BL-928 and BL-948;
     - round 3: BL-937;
     - round 4: BL-939 and BL-946;
     - BL-945 once BL-944 is done.
     That breaks Karma's ruling and 13:131.
   - Rows held correctly: BL-932, 938, 941, 942, 943, 944 and 947, because their first parenthetical has other text. BL-933 is also held, but only by the words "slice 3".
   - Fix: put the hold inside the first parenthetical, for example `blocked (founder approval of the requirements; BL-927)`. Or use a status word other than ready or blocked, for example `held (...)`. I tested both forms against lib.mjs, and both stay ineligible after the BL row they name is done.
   - The status lines also have an unbalanced ")" (:3565 and the others), which is how the hold fell outside the parenthetical.
   - BL-933 (:3600) is wave 2 by 20:133 but carries no founder hold. It releases as soon as someone edits out "slice 3", so add the hold.
   - BL-928 is wave 1 in 13:106 (NS-33) and 20:73 ("Ready: BL-927, then BL-928"), but its status says wave 2 or later. Pick one and make 13, 20 and BOARD:97 agree. If BL-928 stays wave 1, BL-937 needs a real hold all the more.
2. Carried from A item 4. These lines still point at superseded rows:
   - 20:84: "Needs a requirement first: BL-934".
   - 20:88: "Needs a requirement: BL-940, then BL-941".
   - 08-keeping-and-trust.md:206: "BL-934 writes the remaining rows; build row to follow".
   Point them at NS-11 and BL-942, and at NS-14 and BL-941.
3. 20 section 5 (20:127-135), the review-load sizing by wave, still uses the old waves.
   - Line 131 lists as "ready now" BL-923 and 924 (in review), 931 (in progress) and 934 (superseded).
   - Line 132 lists #828 (merged) and #797 (accepted) as in flight.
   - Line 133 puts BL-938, 939 and 941 in wave 2, but 13:108 puts NS-22, NS-05 and NS-14 in wave 3. It also lists the superseded BL-940 and leaves out BL-943 (NS-13, wave 2 in 13:107).
   - So the section contradicts the X1 fix the founder is asked to read.
   - BOARD:97 also opens with "Ready for the harness once merged: waves 1 and 2" before it says wave 2 is held.

Notes
- 13:131 now says "Rows BL-923 to BL-949 meet that". Only BL-923, 924, 925, 929, 931 and 935 have a Plan line (install, device, founder). The claim was already false for BL-941 and now covers more rows.
- P0 rows with no backlog row (I missed these at bb07317d):
  - BL-943 (:3667) stops at NS-13-R10, so the P0 rows NS-13-R11, R12, R14 and R15 (14:91) have no backlog row.
  - BL-945 (:3681) leaves out P0 NS-15-R11 (14:93).
  - BL-946 (:3688) leaves out P0 NS-23-R8 (14:97), and it cites R1 where the card has R1a and R1b.
  - BL-942 (:3660) leaves out NS-11-R8, which is part of the P0 journey J-N19.
  14:104 needs a backlog row for each before its flag turns on. The rows are held, so this can be fixed when they are released.
- BL-947 (:3694) says wave 3, but 13:109 puts NS-24 in wave 4.
- 13:108 says "in rank order: save a copy, whose book, share, another day, one past letter". The ranks are save a copy 15, share 18, whose book 19, one past letter 21 and another day 22 (20:84-91).
- 20:3 and 20:21 still say "at 22:15 UTC", though the table reports #831 merged at 23:19Z. 20:5 still says "BL-923 to BL-941 for the first two waves". The BACKLOG section title (:3521) says "waves 1 and 2", but the section now holds rows up to wave 4.
- BOARD:97 lists BL-925 (needs-decision, :3544) and BL-936 (in-review, :3620) as "ready".
- No row or step says who changes the held statuses once the founder approves, or whether that is one PR. Name the owner (Karma or `product`).
- PR body:
  - "Size exception: about 1,500 added lines": GitHub reports 1,804.
  - The Merge section names two reviews, green CI and Karma. It leaves out the founder's approval in chat, which the author's 23:44Z comment says merge also waits for.
- BL-931's status (:3585) names Karma, but the slice-1 branch's board claim (commit 50eed36e) names `mobile`. I did not verify who runs the split.

### GitHub state behind the delta's claims (gh api REST, 23:50 to 23:59 UTC, 19 Nov)
- #828: merged 22:40:39Z, merge sha 5f5dfaf4. Matches.
- #831: merged 23:19:06Z, merge sha a17254f6, and CR-62 is on develop. Matches.
- #832: open, not a draft, head 3e3b3eaa, title "(BL-923, BL-924)". Matches; the pack names no head.
- #797: open, a draft, head 1bee878b. Matches as a state. That the ready click is the founder's step is unverified; CR-62 does not say so.
- #798: open, a draft, head e7d399b3, 280 files. Matches 20:16 and 20:25.
- #796: open, a draft, head 8a026397, 317 files. Matches.
- #827: open, not a draft, head 2ddf86ab. Matches 20:30.
- Branch `feat/mobile-photo-1-picker-pin`: head 50eed36e (23:17:03Z), no PR. Matches "slice 1 on" the branch.
- #758: a draft, last updated 10 Nov. This contradicts "in review" (see Notes).

### Not verified
- Who runs the photo split, and whether the founder must mark #797 ready.
- The live dispatcher: I ran lib.mjs on the file, not dispatch.mjs against GitHub.
- Card rows beyond those cited here; VISION, 00, 10, 12 and 15 beyond the lines cited.
- Device runs and Apple rules.
- Whether branch protection needs the branch updated to a17254f6. mergeable_state clean suggests not.

Reviewer: independent of the author (CR-44).
