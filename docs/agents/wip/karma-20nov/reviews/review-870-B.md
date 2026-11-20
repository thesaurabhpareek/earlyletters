## Review B at 985c42df9e585c9b0831de8c95847ee7b9849e90: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy, compliance and promises to users (chapters 07 PRIV, 08 DSR). Third look. It follows my reviews at `c91efe35` (two must-fixes) and `ebc29f5b` (one must-fix: the NS-09 rows had landed in the Summary table). File: `docs/content/words-packet-20nov.md` (228 lines). Head committed 12:13:43 UTC, read live at 12:24 UTC (unchanged). CI on the head: complete. Nine checks pass, including `required` and the content rules. One duplicate `compliance-fence` run was cancelled, and its sibling run passed.

Must fix: none.

## What changed since my last review
- Summary (lines 15-20): the Part 1 and Part 2 rows match `c91efe35` exactly. The whole-file diff against `c91efe35` no longer touches the Summary table.
- NS-09 table (lines 30-31):
  - Row 1 recommends A, "This recording is still on this phone. {app} will try again the next time it starts." B, the card's "{app} will finish removing it", is marked as a promise of completion that the code cannot ensure (R15 and R6 are not built, and Remove now can fail again). The Counsel column says "Under B, a promise of completion".
  - Row 2's Counsel column covers every option, for the K2 case (`sync_v1_server.sql:782-784`, `merge.ts:585-591`; counsel Q51(h) on #872).
  - Both rows match #866 at `b981114e` word for word, key for key.
- Earlier fixes still hold, read across the whole-file diff against `c91efe35` (31 lines added, 29 removed):
  - Rows 13 and 14 are #871's words and keys, and both go to the privacy read.
  - Rows 17 and 69 go to counsel and are on the counsel list (line 221), with rows 1, 2 and 6.
  - Rows 41 and 77 are claims rows.
  - Row 24 says that no approval record was found.
  - Row 53 asks `legal` to register the live page now (PRIV-R17).
  - The key renames to the `A11yHint` suffix (rows 5, 8 and 85) match #866.

## What I checked
Facts. I re-checked 10 cites on `develop` (`1400718b`) and on #866 and #871. All 10 hold: `sweep.ts:152-153`; `merge.ts:585-591`; `sync_v1_server.sql:782-784`; `auth.en.ts:294` (`signOut`); #871 `copy.ts` at `46608dd4` (title and body); #866 `strings.en.ts` at `b981114e` (rows 1, 2 and 5); ADR 0028 `:192`; `pages.en.ts:240`; `privacy-policy.md:37`.

Boundaries: nothing is presented as approved. Every line still waits for the founder. ASCII only. No real family detail and no child name.

## Notes
1. The "Checked" line now says 126 strings, "re-run after the reviews". `ebc29f5b` said 127. I could not re-run the uncommitted pass, so the count is the author's.

## Not verified
- The e2e drafts on `docs/e2e-ux-20nov` (the Differs keys for rows 6 and 8, and the row 21 source line).

Reviewer: independent of the author (CR-44).
