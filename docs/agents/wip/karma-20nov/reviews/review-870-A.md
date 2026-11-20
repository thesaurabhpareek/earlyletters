## Review A at 985c42df9e585c9b0831de8c95847ee7b9849e90: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness and accuracy. BL-965: `docs/content/words-packet-20nov.md`, the founder words packet (87 rows in Parts 1 to 3, plus Part 4). Round 3: this replaces my reviews at c91efe35 and ebc29f5b.

Must fix: none.

## Correction to my round 2

At ebc29f5b, a misplaced edit had written the new NS-09 rows 1 and 2 over the Summary table's Part 1 and Part 2 rows. The NS-09 table still held the old words for rows 1 and 2. I wrote that row 1 matched #866, and that was wrong: I read the changed line, not where it sat. 985c42df fixes it.

## What changed since ebc29f5b, and whether it holds

- The Summary table matches round 1 again (no diff against c91efe35 in that table): Part 1 is Build 13, 26 lines, with rows 1, 6, 7 and 8 holding the cut; Part 2 is Build 14, 43 lines, with row 27 first.
- The NS-09 table (lines 30 and 31) now holds the new rows 1 and 2. Row 1's A matches #866's head b981114e word for word ("{app} will try again the next time it starts."). Row 2 sends every option to counsel, with the K2 reason (`merge.ts:585-591`, `sync_v1_server.sql:782-784`).
- The "Checked" line says 126 strings again; that does not change any row.
- Structure: 87 numbered rows plus the 4 Summary rows. Each row number 1 to 87 appears once outside the Summary. ASCII scan: clean.

## Still true from round 2 (checked again at this head)

- Must fix 1 of round 1 is fixed. Rows 17 and 69 (and row 6) say "Yes" and are on the counsel list. Rows 41 and 77 are claims rows.
- Must fix 2 is fixed. Row 51 is "right after row 15 and before row 16"; row 16 is "sentence 2, or sentence 3 when row 51 shows". This matches e2e C (C WORDS:50-52, :62).
- Rows 13 and 14 carry #871's words (head 46608dd4, `components/account/copy.ts:12, 14`). The e2e E difference (OQ-5, K8) is stated.
- My round 1 notes are answered:
  - Part 4 NS-06 names #847 Q3 and the card's B17 questions (06:502-507).
  - Row 50 adds `onPhoneBodyBackupOff` and `privacy-policy.md:37`.
  - Row 21 has its Differs line.
  - Rows 6 and 8 state e2e C's and e2e E's keys.
  - The hint keys all use `A11yHint`.
  - Row 18 corrects e2e D's plan key.
  - The "For Karma" bullet and Part 4 NS-12 (Q108) are corrected.
- Row 52's cite (ADR 0028 line 192) holds on develop.

## Findings

1. Note: row 13 ("This phone has a book from another account") says where a book is, so by the packet's own test it is a counsel line. It is marked for a privacy read only and is not on the counsel list. That is defensible while #871's screen and OQ-5 wait on the founder and privacy. Say in one line why counsel need not read it, or add it back.
2. Note: row 24 says no record of the founder's earlier approval was found. The founder should read row 24 as an ask, not a status.

## Not verified
- The engineering designs (TDD 08, 09, 10, 11, privacy, architecture): not in the repo.
- The author's run of the packet's strings through the rules tests (174 of 174). Mine was a word scan only.

CI at 985c42df: every check is complete and green ("required" included); one compliance-fence run was cancelled by a later run, which passed. The head is more than 10 minutes old.

Reviewer: independent of the author (CR-44).
