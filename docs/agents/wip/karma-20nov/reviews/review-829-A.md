## Review A at 60aca10fb91d0b650e416790286dea39dcf6fe28: PASS WITH NOTES

Lens A: accuracy against the repo and GitHub, backlog rows, dispatcher behaviour, plan and sizing, ids. Round 4.

### What I ran
- Head check: `gh api .../pulls/829 --jq .head.sha` = 60aca10f, at the start and again at 00:38Z. It equals the fetched branch tip.
- Read: both a8d7baa3 reviews, the author note of 00:24:46Z, the PR body, the whole delta `git diff 97f86abb 60aca10f` (4 files, +32/-31), BACKLOG 3522-3714, 13 sections 2 to 6, 20 sections 1 to 7, BOARD:97-98, the P0 register (14:80-100), card rows NS-11, NS-15, NS-21, NS-22, NS-23, lib.mjs 55-150, dispatch.mjs 60-110 and 225-260.
- Merge 97f86abb: parents a8d7baa3 and 5dc025d3. `git diff a8d7baa3 97f86abb` is the same as `git diff 5f5dfaf4 5dc025d3` (develop's #831 and #832, 17 files, +295/-30). The only text difference is the BOARD hunk context. `git merge-tree --write-tree a8d7baa3 5dc025d3` differs from 97f86abb only in BOARD.md, where the conflict was. BOARD:97 (Karma row) and BOARD:98 (#832 mobile row) are both kept. Nothing else was taken wrongly.
- GitHub now:
  - #832 merged 00:15:11Z as 5dc025d338f76c788d4f666b68ee6025e47c277b.
  - #796 closed unmerged 00:04:27Z.
  - #833 to #840 open, not draft, stacked: #833 on develop, then each on the branch below (photo-1-picker-pin, 2-native-module, 3-store, 3b-stored-copy, 4a-pending, 4-capture, 4c-letter-page, 5-lens).
  - #758 draft (last update 10 Nov). #798 draft at e7d399b3.
  - #795 merged 11 Nov. It added 01-photo-with-a-letter.md.
  - PR size on GitHub: +1,807/-2 in 17 files. That matches body:30.
- Dispatcher check: scratch worktree at 60aca10f. I loaded scripts/agents/lib.mjs and ran parseBacklog, eligibility and primaryOwner on the real docs/BACKLOG.md.
  - (a) As it stands, eligible among BL-922 to BL-949 and BL-868: BL-922 (mobile), BL-927 (design-systems), BL-929 (qa), BL-935 (user-research), BL-949 (legal) and BL-868 (data-architect, an older row). No open PR title or branch takes any of them. The 13 held rows all read "blocked on a non-backlog item" (BL-944 "mode pair").
  - (b) Copy with BL-922 to 931, 935, 936, 949 and BL-868 set done: no row in BL-922 to BL-949 is eligible. The fixpoint is reached at once.
  - (c) I removed only "founder read: waits for ... in chat" from each of the 13 statuses, as a release PR would. BL-943 became ready. Rows whose only other item was a backlog id became "blocked (BL-xxx)". Before wave 1 is done, only BL-943 joins the list. After wave 1 is done, BL-937, BL-943 and BL-948 are eligible. Then the fixpoint holds: BL-932, 933, 938, 939, 941, 942, 946 and 947 stay "blocked on a non-backlog item", BL-944 is a pair row, and BL-945 waits on BL-944. So wave 3 rows still wait for photo slices 3 and 4 and Find, even after the founder hold is lifted.
  - BOARD:97 says the dispatcher hands out exactly BL-922, 927, 929, 935 and 949. That is what (a) gives for this pack's rows.
- `node --test scripts/trace.test.mjs scripts/agents/*.test.mjs`: 170 pass, 0 fail, exit 0 (Node 22.23.4).
- `node scripts/agents/check.mjs`: "agent team is consistent", exit 0 (26 agents, 473 backlog tasks).
- ASCII: no non-ASCII character in added lines of the delta, the whole PR (5dc025d3...60aca10f), the BOARD merge hunk or the PR body.
- Paren balance: every Status line in the section is balanced.
- The worktree and my scripts were removed. No repo file was changed and nothing was posted.

### Status of earlier must-fix items

Review A at a8d7baa3:
1. Conflict and stale facts. Fixed.
   - The merge is clean and keeps both BOARD rows (above). mergeable_state is clean.
   - BL-923 and BL-924 say done with the #832 merge sha (BACKLOG:3527, :3536). 13:106, 20:71, 20:131 and BOARD:97 match.
   - BL-931 now says #796 is closed and the work is eight stacked PRs, #833 to #840 (BACKLOG:3586, :3589). 20:26 and 20:78 match. 20:131 no longer counts slices 3 and 4 twice, and 20:132 drops them from wave 2.
2. Release step and the X1 order. Fixed. BL-939 (:3640), BL-941 (:3654), BL-942 (:3661) and BL-946 (:3689) now carry "then photo slices 3 and 4 and Find land, closed question X1", as BL-944 (:3675) and BL-947 (:3696) do. Run (c) confirms the release PR in 13:131 and body:33 now hands out no wave 3 row early.
3. Done lines. Fixed. BL-942 "R1 to R9 pass" (:3665), BL-945 "R1 to R11 pass" (:3686) and BL-946 "R1a to R8 pass" (:3693) now match their Satisfies ranges. Every card row in those ranges exists. One label is off (Note 4).

Review B at a8d7baa3:
- Note 1 (wave 3 gate on four rows): fixed, as item 2 above.
- Note 2 (Done lines narrower than Satisfies): fixed, as item 3 above.
- Note 6 (stale since #832 merged): fixed, as item 1 above.

### New findings

Must fix: none. Nothing below makes the dispatcher hand out a wrong row or the founder act wrongly.

Notes
1. Slice 5 (#840) is in two waves, and a backlog cycle came back.
   - BL-931 (:3587) and 13:106 now put all photo slices in wave 1 with no founder hold. But 13:108 still lists "NS-01 slice 5" in wave 3. 13:64 and 13:121 still say slice 5 waits for NS-37.
   - NS-37 is BL-932 (N-06, 20:79). BL-932 says "Depends on: BL-931" (:3593). The new BL-931 Done line (:3590) is "every slice is merged", so BL-932 now waits for #840. Before this delta it waited for the PRs to be open. If Karma holds #840 for NS-37, as 13:121 says, BL-932 never becomes eligible. 15:38 says this cycle is gone.
   - Under the ruling in my brief (wave 1 as a whole), #840 merges first, so the dispatcher hands out nothing wrong. Fix in one line: drop slice 5 from 13:108 and the NS-37 edge from 13:64 and 13:121, or make BL-932 depend on slice 2 in its text only, as 20:79 intends. BL-933 has the same whole-row wait on BL-931 (:3600).
2. #833 is due to close, but BL-931 still builds on it.
   - BL-931 (:3586, :3589) and BOARD:97 name eight PRs, #833 to #840, and call slice 1 (#833) "release tooling and preflight". #833 is titled "the picker pin, licences and preflight", and #834 is stacked on its branch.
   - My brief says Karma ruled for PHPicker inside scribe-photo and that #833 will close. The row cites "Karma ruling, 20 Nov", but I found it neither in RULINGS.md on develop nor on #833 or #834 (two Review A/B CHANGES comments only). Name where it is recorded.
   - When #833 closes, say what carries the preflight change, that #834 is retargeted, and how many PRs remain. "Every slice is merged" (:3590) cannot hold for a closed PR.
3. BL-938 and BL-948 sit in "3 and later" (20:133) without the X1 gate.
   - BL-938 (NS-22, wave 3 by 13:108) waits only for "PR #798 merged" (:3633). That text holds it now. But whoever edits it once #798 merges has no note to wait for photo slices 3 and 4.
   - BL-948 becomes eligible as soon as BL-929 is done (run c). 13:106 puts NS-33 and NS-34 in wave 1. It is a docs row, so early release is harmless, but 20:133 and 13:106 disagree.
4. BL-942 Done (:3665) says "including the P0 row R8". The P0 register (14:90) lists NS-11-R5, not R8. R8 is part of the P0 journey J-N19, as Satisfies (:3662) says. Since Done covers R1 to R9, nothing is lost. Fix the label, or add R8 to the register.
5. Small stale items in this delta.
   - 20:137 says wave 1 is "about 30 to 40 counted reviews". The table (20:131) now says 36 to 44.
   - 20:90, :91 and :95 still say C-20, C-07 and C-25 are "Not broken down". 20:149 now says BL-944 to BL-947 break them down. The author note says this was fixed. Only 20:149 was changed.
   - BL-927 Scope (:3562) says the lens control "exists only in #796". #796 is closed, and the lens is in #840. BL-927 is ready, so an agent will read this. It says "not here", so it does no harm.
   - The delta removed the blank line between BL-931's Plan line (:3591) and the BL-932 heading (:3592). parseBacklog still splits the rows correctly.
   - BOARD:98 (#832's own row, from develop) still says "active; PR into develop to follow". It is not this PR's row.
6. Still open from earlier rounds:
   - 13:48 still says NS-32 is "already in review". #758 is a draft (13:90 and 13:106 say so).
   - 20:3 and 20:21 say "at 22:15 UTC" (19 Nov). Rows below now carry 20 Nov facts. BACKLOG:3524 says facts were read on 09a104da.
   - 20:5 says BL-923 to BL-941.
   - BACKLOG:3522, 20:127 and 20:147 say "waves 1 and 2". The section now covers waves 1 to 4.
   - 13:131 says "Rows BL-923 to BL-949 meet that". BL-938 still has no fails-on-old-code line, and docs rows have none.
   - BL-928 Done says "those tests pass" (:3570), but one test is named.
   - BL-770 is cited (:3669, 20:28, 20:74) but is not a row on develop.
   - BL-945 is sized M (:3682). 13:50 says L.
   - 20:131 puts #798 Find in wave 1. 13:107 has "NS-02 lands" in wave 2.
   - Body:21 says "Wave 1 rows are ready". BL-925, 926, 928, 930, 931 and 936 are not.
7. Checked and correct:
   - 13:109 now says X1 puts the spike after the pilot and leaves Share unordered. This matches develop's README:7.
   - BL-937 (:3627) cites NS-21-R1 to R5, and BL-938 (:3634) cites NS-22-R1 to R4. Both ranges exist in 10:33-38 and 10:67-70.
   - BL-947 now says wave 4 (:3696), as 13:109 does.
   - BL-931 sizes L, as 13:64 does. "Photo is rank 12" matches 20:81.

### CI and merge state at 60aca10f
- 11 check-runs, all completed with success (latest: required at 00:28:15Z). They include applied migrations unchanged, compliance-fence (two runs), tests and content rules, typecheck, database rules, edge functions, B-8, install and agent team consistent. Vercel status: success.
- Branch protection on develop requires applied migrations unchanged, required and compliance-fence (strict false). All three are green.
- mergeable true, mergeable_state clean.
- Body:33 still holds. Merge waits for the founder's approval in chat, his acceptance of the size exception and two counted reviews at this head.

### Not verified
- The live dispatcher. I ran lib.mjs on the file, not dispatch.mjs against GitHub. Agent caps, claims and daily runs were not modelled.
- Karma's PHPicker ruling. I have it only from my brief. When #833 will close.
- CI and review state of #833 to #840 beyond titles, bases and the comments listed.
- The founder's chat. Whether he has approved anything or accepted the size exception.
- Card rows beyond those cited. VISION, 00, 11, 12, 15 and the roadmap beyond the lines cited. Device runs and Apple rules.

Reviewer: independent of the author (CR-44).
