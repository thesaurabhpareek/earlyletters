## Review B at 60aca10fb91d0b650e416790286dea39dcf6fe28: PASS WITH NOTES
Lens B: founder decisions and the constitution, words families read, privacy and counsel gates, honesty about evidence and authorship, size. Round 4.
Head verified: `gh api .../pulls/829 --jq .head.sha` = 60aca10f, at the start and again before writing. mergeable_state "clean". Whole PR against develop 5dc025d3: 17 files, +1,807/-2 (GitHub and `git diff --numstat` agree).

### What I read and ran
- Read: CLAUDE.md; VOICE.md (tone, do and don't); BRAND.md CR-25 internal-terms table; D-082, D-124, D-157 to D-160 on develop; #827 (open, clean, head 2ddf86ab; D-161, D-162); develop's PRD README:7 (X1); PRD 01:3 and NS-01-R22 (01:69); both round 3 reviews; the author note of 2026-11-20T00:24:46Z; the PR body at the head.
- Merge 97f86abb: parents a8d7baa3 and 5dc025d3. `git merge-tree --write-tree a8d7baa3 5dc025d3` gives one conflict (BOARD.md). The merge tree differs from that result only by the removed conflict markers: both rows kept verbatim. `git diff --stat a8d7baa3 97f86abb` equals `git diff --stat 5f5dfaf4 5dc025d3` (17 files, +295/-30). The merge brought only develop's changes.
- Read in full: `git diff 97f86abb 60aca10f` (4 files, +32/-31: BACKLOG, BOARD, 13, 20). At the head: BACKLOG:3522-3713; 13:44-131; 20:1-45 and :66-155; ROADMAP:1-39; BOARD:96-98; 10:43-80 and :150-154; 09:115, :159.
- Ran the dispatcher's own `parseBacklog` and `eligibility` (lib.mjs at 60aca10f) on the head BACKLOG, in my scratchpad:
  - Now: among BL-922 to BL-949, only BL-922, 927, 929, 935 and 949 are eligible (BL-868, an older row, too).
  - Every wave 1 row and BL-868 set done: nothing more is eligible.
  - Release step simulated (the "founder read: ..." text removed, wave 1 done): BL-937, 943 and 948 become eligible. BL-939, 941, 942 and 946 stay held by their X1 text, BL-944 and 947 likewise, BL-945 behind BL-944.
- gh api: #796 (closed), #798 and #758 (drafts), #832 (merged 00:15:11Z), #833 to #840 (open, stacked), #833's files and two review comments, #834 and #837 files; open PR titles for claimed BL ids; check-runs, commit status and develop's required checks at the head.
- ASCII: no non-ASCII character in added lines of the delta, the whole PR, the PR body or the author note. Word scan of the delta: no fear, loss, guilt, count, recap, rewrite, machine-writes or gendered word; the only hits are "counted" (reviews). No family name appears in the delta.
- No repo file was changed and nothing was posted.

### Earlier items at 60aca10f
Review B round 3 notes:
1. Wave 3 gate after release. Fixed. BL-939 (:3640), BL-941 (:3654), BL-942 (:3661) and BL-946 (:3689) now carry "then photo slices 3 and 4 and Find land, closed question X1" after the founder hold. My release simulation confirms they stay held.
2. Done lines. Fixed. BL-942 "R1 to R9 pass, including the P0 row R8" (:3665); BL-945 "R1 to R11 ... R11" (:3686); BL-946 "R1a to R8 ... R8" (:3693).
3. X1 and the spike. Fixed in 13, open elsewhere. 13:109 now says X1 puts the spike after the pilot, leaves Share unordered, and the rank puts Share ahead. That matches README:7. Still open: 20:40 states X1 as "the spike, Share" with no "Share is unordered"; 13:109 and 20:89 start the spike "the Monday after the Build 13 cut", while ROADMAP:17 puts it in April to May, after Share (ROADMAP:16). See Note 5.
4. Words with no flag. Open. BL-941 (:3656), BL-945 (:3684) and BL-947 (:3698) still name no flag or word approval. Held twice over, so no risk now. Fix before release.
5. Photo slices 3 and 4. Answered by Karma's ruling: BL-931 is wave 1 as a whole (:3587); 20:131-132 no longer count slices twice. New conflict on slice 5: see Note 2. 20:127 and BACKLOG:3522 still say "waves 1 and 2".
6. Stale #832 facts. Fixed: BACKLOG:3527, :3536; 13:106; 20:71; 20:131; BOARD:97.
7. 13:131 "Rows BL-923 to BL-949 meet that". Open. BL-938 (:3632-3637) has no fails-on-old-code line; docs rows have no failing test.

Review A round 3 must-fix:
1. Conflict and stale facts. Fixed. Merge 97f86abb keeps both rows; GitHub reports clean. BL-923 and 924 done; BL-931 names #796 closed and #833 to #840 (BACKLOG:3586, :3589; 20:26; 20:131).
2. Release step breaks X1. Fixed (as item 1 above).
3. Done lines short of P0 rows. Fixed (as item 2 above).

### New findings
Must fix: none.

Notes
1. The picker text runs ahead of the PRs it names, and its record is not in the repo.
   - BACKLOG:3589 says the picker is PHPickerViewController from our own `scribe-photo` module, "not a third-party package, so the binary carries no camera or photo-library permission calls". That matches Karma's ruling as given to me, and NS-01-R22 (01:69). It promises nothing to families or Apple.
   - But the eight PRs it lists do not follow it yet. #833 (head 45c35116) adds `expo-image-picker` 57.0.20 to package.json and its app.config.ts plugin line; its title is still "the picker pin". #834's module test forbids `PHPicker` in scribe-photo. #837's `picker.ts` imports `expo-image-picker`. BL-931 calls slice 1 "release tooling and preflight" and does not say that #833, #834 and #837 must change.
   - "The binary carries no ... calls" is stated as fact. Nothing checks it yet. The Done line (:3590) is met by any eight merged slices with two reviews and green CI, even with the package still pinned.
   - The ruling is cited as "Karma ruling, 20 Nov, after #833's privacy review". #833's Review B (00:17:19Z) exists. The ruling itself is in no CR on develop's RULINGS.md (last is CR-62) and in no comment on #833, #834 or #837.
   - Fix in one line each: "so that the binary carries none"; "#833, #834 and #837 change to match before slice 1 merges"; Done adds "no third-party picker package in package.json, no photo or camera usage key, and the upload email shows no ITMS-90683"; point to where the ruling is recorded.
2. Slice 5 sits in two waves and in a dependency loop. 13:106 puts "all slices" of NS-01 in wave 1, as BACKLOG:3587 and 20:131 do. 13:108 still lists "NS-01 slice 5" in wave 3, and 13:64 and :121 say slice 5 waits for NS-37. NS-37 is BL-932 (20:79), which "Depends on: BL-931" (:3593), and BL-931 is done only when every slice, #840 included, is merged (:3590). Read literally, neither can finish first. Fix: BL-932 depends on slice 2 only, as its status says, or drop slice 5's NS-37 wait in 13:64, :108 and :121. Flag stays off, so no family sees the order.
3. "Approved scope" (BACKLOG:3587). The founder set the order in X1, and photo is first in it. PRD 01 is Draft v1.1 on develop (01:3); he has not approved its rows. Say "ordered first by the founder (X1); PRD 01 on develop", not "approved scope". This is the reason the founder hold was lifted from slices 3 and 4, so the wording matters.
4. Body:21 says "Wave 1 rows are ready". BL-925 needs his words, BL-926 and 928 are blocked, BL-930 and 936 are pair rows, BL-931 is in progress. BOARD:97 has the exact list. Copy it.
5. Spike dates. 20:40 should add that X1 leaves Share unordered (README:7). 13:109 and 20:89 ("the Monday after the Build 13 cut") and ROADMAP:17 (April to May, after Share) give two start points. Pick one.
6. The PR body asks with no defaults. Body:30 asks him to accept the size exception but does not say what happens if he refuses. Body:24 lists founder decisions (backup flip, storage spend, phone, dates) with no defaults; they are on the cards. Add one line: refused means two PRs, the halves named at :30.
7. Small and stale, none blocks: 20:26 says "eight slices", but the PRs are five slices in eight PRs (BACKLOG:3589, PR titles "of 5"). 20:78 says N-11 "Done" while BL-931 is in progress (:3586). 20:81 sizes photo M; BL-931 and 13:64 say L. BL-938's gate (:3633) names Find but not photo. BL-927 (:3562) says the lens control "exists only in #796"; it is now #840. BL-928 (:3568) and 13:48 still treat #798 and #758 as in review; both are drafts. BOARD:97 says "exactly"; BL-868 is also eligible. No blank line before BL-932 (:3591-3592); the parser does not mind. Earlier carry-overs still open: 20:3 and :21 "at 22:15 UTC" (20:26 now holds a later state); 20:5 "BL-923 to BL-941"; BL-947 cites NS-24-R1 to R3 (:3697) and leaves out R4 (an empty year is not offered) and R5.
8. Otherwise clean on my lens. No family-facing word is added or approved in the delta. No fear, guilt, count or machine-writes wording. No internal term in parent text. No real family detail. No counsel gate added or removed: 13:64 still names counsel for the photo label line, and BL-935 and BL-949 still name counsel. #833's Review B named a legal hand-off (app-store-privacy-labels.md:127 "No photo picker, no new SDK"). That stays true until slice 4 code merges. BL-931 could name it; it is `legal`'s, not counsel's.

### For the founder
- Approve the pack in chat (20-final and cards 08 to 15). Default: merge waits, and nothing from wave 2 on is handed out. Say where the approval is recorded (this PR thread or a DECISIONS.md line).
- Accept or refuse the size exception: +1,807/-2 in 17 files (body:30). Default: one PR, as Karma ruled.
- Photo is now wave 1 as a whole with no hold for you (BACKLOG:3587), on Karma's reading that your X1 order covers it. Default: accept; the flag stays off and photo is alpha only until the four conditions (20:81). Say so if you want slices 3 to 5 held for you.
- The spike: after the Build 13 cut, or April to May after Share? Default: after Share, as the rank (18 before 20) and the roadmap say.
- Unchanged: merge #827 (D-161, D-162); counsel read of the pilot consent texts (BL-935, due Fri 27 Nov 2026); word approvals, BL-925 first; phones; the backup flip; release dates.

### CI and merge state
- Check-runs at 60aca10f all succeeded: required (00:28:15Z), applied migrations unchanged, compliance-fence (two runs), tests and content rules, typecheck, database rules, edge functions and ops scripts, install, agent team consistent, B-8. The commit status (Vercel) is success.
- Develop requires three checks (applied migrations unchanged, required, compliance-fence; strict false). All three are green.
- GitHub reports mergeable true, mergeable_state clean. Merge still waits for the founder's approval in chat and two counted PASS reviews at this head (body:33).

### Not verified
Karma's picker ruling and his wave 1 ruling for BL-931 (I have them only from my brief; neither is recorded on develop or on the slice PRs). The founder's chat, so whether he has approved or accepted anything. The X1 text itself (a Project doc); I read X1 only through README:7, PRD 01:3 and the design index. Whether App Store Connect rejects a binary over ITMS-90683, and whether PHPicker in scribe-photo leaves the binary free of permission calls: not run. I ran lib.mjs eligibility, not dispatch.mjs against GitHub. I did not run npm test or the agent script tests; I relied on CI. Cards were read only at the lines cited.

Reviewer: independent of the author (CR-44).
