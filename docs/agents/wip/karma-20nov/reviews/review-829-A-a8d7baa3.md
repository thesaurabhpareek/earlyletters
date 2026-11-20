## Review A at a8d7baa39e88ecc5362f72b4c58fd5530cd5942e: CHANGES

Lens A: accuracy against the repo and GitHub, backlog rows, dispatcher behaviour, plan and sizing, ids. Round 3.

### What I ran
- Head check: `gh api .../pulls/829 --jq .head.sha` = a8d7baa3 = the fetched branch tip. Checked again at 00:18Z; it had not moved.
- Read: both bf03bed0 reviews, the author note of 00:02:31Z, the PR body, the whole delta `git diff bf03bed0..a8d7baa3` (5 files, +34/-32), BACKLOG 3521-3712, 13 sections 4 to 6, 20 sections 1 to 7, BOARD:97, the card rows for NS-11, NS-13, NS-14, NS-15, NS-23, NS-24, the 14 journeys and P0 register, lib.mjs 55-150.
- Dispatcher check: scratch worktree at a8d7baa3. I loaded scripts/agents/lib.mjs and ran parseBacklog and eligibility on the real docs/BACKLOG.md.
  - (a) As it stands, eligible among BL-922 to BL-949 and BL-868: BL-922, BL-927, BL-929, BL-935, BL-949 and BL-868. All wave 1 (BL-868 is an older row). Every held row reads "blocked on a non-backlog item".
  - (b) Copy with every wave-1 row (BL-922 to 931, 935, 936, 949) and BL-868 set done: no row in BL-922 to BL-949 is eligible. No wave-2-or-later row comes out eligible. I then marked each newly eligible row done and ran again: the fixpoint is reached at once.
  - (c) Extra: the same file with only the "founder read: ..." text removed, as a release PR would do. BL-941 and BL-942 (wave 3) become eligible at once, with BL-943 (wave 2). After wave 1 is done, BL-937 and BL-948 follow, then BL-939 and BL-946 once BL-937 is done. BL-944, 945 and 947 stay held by their X1 text. See Must fix 2.
- Flag name: `EXPO_PUBLIC_SAVE_A_COPY` (BACKLOG:3661) is marked "name proposed". grep of apps/mobile finds 24 EXPO_PUBLIC_ names, none the same or close. In docs it appears only once.
- `node --test scripts/trace.test.mjs scripts/agents/*.test.mjs`: 170 pass, 0 fail, exit 0 (Node 22.23.4; no node_modules needed).
- `node scripts/agents/check.mjs`: "agent team is consistent", exit 0.
- ASCII: no non-ASCII character in added lines of the delta, the whole PR (5f5dfaf4..a8d7baa3) or the PR body.
- Paren balance: every Status line in the section is balanced.
- `git merge-tree` against current develop: CONFLICT (see Must fix 1).

### Status of earlier must-fix items

Review A at bf03bed0:
1. Wave-2 hold leaks. Fixed. Every held status now starts "blocked (founder read: ...; then ...)" (BACKLOG:3593, 3600, 3626, 3632, 3638, 3652, 3659, 3666, 3673, 3680, 3687, 3694, 3701). lib.mjs:101-102 reads that parenthetical and returns null blockers. BL-933 carries the hold. BL-928 is wave 1 (blocked on BL-927 only, :3565), which matches 13:106, 20:73, 20:131 and BOARD:97. The unbalanced ")" is gone.
2. Pointers to superseded rows. Fixed. 20:84 names NS-11 and BL-942, 20:88 names NS-14 and BL-941, 08:206 names BL-942. No other BL-934 or BL-940 mention is left outside the two superseded rows.
3. 20 section 5 used the old waves. Fixed in substance. 20:131-133 follow 13 section 4. BOARD:97 now says only wave 1 is ready. Small sizing points are in Notes.

Review B at bf03bed0:
1. Hold leak and wave gates. Partly fixed. The leak is fixed (above), and BL-928 lost the hold. Not done: the "wave 3, after photo slices 3 and 4 and Find land" gate on BL-939, 941, 942 and 946. See Must fix 2. BL-947 still says wave 3 (:3694), but 13:109 puts NS-24 in wave 4 (Note).
2. P0 rows for J-N19. Partly fixed. Satisfies now cite the full cards: BL-942 NS-11-R1 to R9 (:3660), BL-943 NS-13-R1 to R17 (:3667), BL-945 NS-15-R1 to R11 (:3681), BL-946 NS-23-R1a to R8 (:3688). Every cited row exists in the cards (08:189-198, 09:45-71, 09:150-167, 10:110-118). The Done lines were not changed. See Must fix 3.
3. BL-942 flag. Fixed (:3661). Name proposed, no collision, off in production, off outside the founder's family until he approves the words. That matches RR-3 at 14:104.
4. Size line. Fixed. Body line 30 says +1,806 / -2 in 17 files, which matches GitHub and git numstat, and asks the founder to accept. Body line 33 says merge waits for his approval in chat, then two counted reviews and green CI.

### New findings

Must fix
1. The PR no longer merges, and its in-flight facts went stale after the push. This is not an author error: develop moved at 00:15Z.
   - #832 merged at 00:15:11Z as 5dc025d3. GitHub now reports mergeable false, mergeable_state dirty. The conflict is in docs/agents/BOARD.md. #832 added a mobile row after line 96, and this PR adds the Karma row at the same place. Keep both rows.
   - With #832 merged, BL-923 and BL-924 are done. These lines still say in review: BACKLOG:3526, :3535, 13:106, 20:71, 20:131 and BOARD:97.
   - #796 was closed at 00:04:27Z. BL-931 is now eight open PRs, #833 to #840 (slices 3 and 4 split into 3a, 3b, 4a, 4b, 4c), not five. BACKLOG:3585 (#796 at 8a026397, slice 1 on a branch), :3589 (five PRs), 20:26 and 20:131 (five slices) need a refresh.
   - None of this makes the dispatcher hand out a wrong row. But a merge needs the conflict fixed and a new head, so fix the facts in the same push.
2. The release step, as written, breaks the X1 order that the last two rounds fixed.
   - 13:131 and body line 33 say Karma releases the held rows "by one status-change PR". Only BL-944 and BL-947 carry the X1 gate text. My run (c) shows the result: BL-941 (whose book) and BL-942 (save a copy), both wave 3, become eligible on the same day as wave 2. BL-939 (Share) and BL-946 (one past letter) follow as soon as BL-937 is done. None of this waits for photo slices 3 and 4 or Find to land, which 13:108 and BL-944 require.
   - Fix one way, in a line: add "then wave 3, after photo slices 3 and 4 and Find land, closed question X1" to BL-939, 941, 942 and 946, as BL-944 and 947 already carry. Or say in 13:131 that the release PR sets wave 3 and later rows to that gate, not to ready. BL-945 is covered through BL-944.
3. Three Done lines still stop short of the rows their Satisfies lines now name, and two of the missing rows are P0.
   - BL-942 Done "R1 to R7 pass" (:3663): R8 (J-N19) and R9 are left out.
   - BL-945 Done "R1 to R7 pass" (:3684): R8 to R11 are left out. R11 is P0 (14:93).
   - BL-946 Done "R1 to R6 pass" (:3691): R7 and R8 are left out. R8 is P0 (14:97), and the card numbers R1 as R1a and R1b.
   - An agent can close any of these rows with a P0 row untested. 14:104 needs a test for each P0 row before the flag turns on. Fix: make each Done line match its Satisfies range, and name J-N19 in BL-942 and BL-946, as Review B asked. BL-943's "unit rows pass" (:3670) already covers R11 and R12.

Notes
- 13:109 says "X1 puts it before Share and Firsts". But 13:108 puts NS-05 Level 1 (Share) in wave 3, ahead of the spike in wave 4. The rank also has Share at 18 and the spike at 20. README:7 on develop says X1 does not order Share. Drop "Share and", or move one of them.
- 13:131 adds "rows without a Plan line need no install, device or founder step unless their Done line says so". BL-942 needs the founder's word approval, but that is in its Scope, not its Done line, and it has no Plan line. BL-943 is titled "proven on a phone", and NS-13-R7, R9 and R16 are device rows, but it has no Plan line and its Done line names no device run. "Rows BL-923 to BL-949 meet that" is still not true of every row: BL-937 and BL-938 have no Satisfies line, and BL-938 has no fails-on-old-code line.
- 20 section 5:
  - Wave 1 counts BL-931 as five PRs, and wave 2 counts "BL-931 slices 3 and 4" again (20:131-132). It is now eight PRs in all.
  - The heading (20:127) still says "waves 1 and 2", and the table now covers wave 3 and later.
  - Wave 1 PRs are 17 or 18 by my count, which fits "16 to 20".
- Slices 3 and 4 are wave 2 by 13:107, and they are now open for review as #835 to #839, under BL-931 (wave 1). The hold covers backlog rows, not these PRs. Say whether they may merge before the founder approves the requirements.
- BOARD:97 lists as "ready for the harness" BL-925 (needs-decision), BL-930 (mode pair) and BL-936 (in-review, mode pair). The dispatcher hands out none of them. It does not list BL-922, which is ready.
- BL-947 says wave 3 (:3694), but 13:109 puts NS-24 in wave 4.
- BL-928 Done says "those tests pass" (:3569), but only one test is named.
- 13:48 and 13:90 still call NS-32 "in review", but 13:106 now says #758 has been a draft since 10 Nov. #758 is a draft, last updated 10 Nov. 20:78 and 20:82 still call #798 "in review" or "mid-review", but it is a draft (20:25 says so).
- These earlier notes are still open:
  - 20:3 and 20:21 still say "at 22:15 UTC".
  - 20:5 says BL-923 to BL-941.
  - The BACKLOG section title (:3521) and 20:147 say "waves 1 and 2".
  - 20:90, :91, :95 and :149 say C-20, C-07 and C-25 are not broken down, but BL-944 to BL-947 break them down.
  - BL-770 is cited (:3667, 20:28, 20:74) but is not a row on develop.
  - BL-931 is sized M and BL-945 M, against 13:11 and 13:50.
- 20:84's new reason ("beside the phone's own iCloud backup if that is on") matches 08:160, F08-REQ-013 and council finding 15:47.
- The author's own check (BL-925 to 929, 931, 937, 944 and BL-868 set done gives only BL-922, 935 and 949) agrees with my run.

### CI at a8d7baa3
11 check-runs, all completed with success: required (00:09:54Z), typecheck, B-8, edge functions, database rules, tests and content rules, compliance-fence (two runs), applied migrations unchanged, install, agent team consistent. Vercel status success. Branch protection on develop requires applied migrations unchanged, required and compliance-fence (strict false), and all three succeeded. Required CI is green at this head. The PR is still blocked by the conflict, and CI will run again on the new head.

### Not verified
- The live dispatcher run. I ran lib.mjs on the file, not dispatch.mjs against GitHub. takenIds does not matter here: the rows exist only on this branch until merge.
- Whether BL-931 is now done (eight PRs open, CI on them not read), and whether #833 to #840 stack on each other.
- The founder's chat, so whether he has approved anything or accepted the size exception.
- Card rows beyond those cited. VISION, 00, 10, 11, 12 and 15 beyond the lines cited. Device runs and Apple rules.

Reviewer: independent of the author (CR-44).
