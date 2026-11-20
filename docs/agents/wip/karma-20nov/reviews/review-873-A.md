## Review A at 6f1d9fa0e7e8b349d5304ecda476c0fe20491933: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness of facts, code shape. BL-960 data inventory, stacked on #854 (base `docs/photo-inventory-rows` at 47c1467f). The founder merges it. I reviewed da5496ca (CHANGES, two must-fixes), then the delta to 6f1d9fa0 (+5 / -3 in the two legal files, plus one check-in line).

Must fix: none.

## My two must-fixes at da5496ca, now fixed

1. The DATA_CLASSIFICATION 4.3 table is whole again. The `mustBeL4` paragraph now follows the `waitlist` row with a blank line between them, and `member_return_links`, `child_key_grants` and `waitlist` sit inside the table again.
2. The row that said "No name, date, text or id" now lists only `newPhone.arrival` and `review.defaultView`, and both hold that statement.
   - `plus.statusReport` is now L3, with what it holds. The cites hold: `status-report.logic.ts:51, 65-86` on develop. Rule 1.1.4, person identifiers are L3, is at DATA_CLASSIFICATION section 1.1 item 4. The row also records the L2 code comment at `:18`; handoff #886 to `mobile` covers it.
   - `plus.notesSeen` is now L3, because a note id carries a renewal or trial-end date. That matches the server: `subscription_status.renewal_date` and `trial_end` are commented L3 (`20261016001000_subscription_status.sql:123-124`). The cites hold: `plan-reminders.logic.ts:190, 292, 339` and `plan-notice.tsx:30`. L3 is stricter than the L2 I suggested, and it is consistent with the server.
- My note 1 is fixed too: data-policy 4.3 `entry-photos` now says "every client insert and update", which matches ADR 0028 D6 (the author delete policy stays). My note 2 went to `data-architect` as handoff #887.

## What I checked (carried from da5496ca; the delta touches none of these rows)

- Facts: 87 cites checked against develop `1400718b` or the named PR head. At this head all hold, including the corrected row at line 799 and the 6 new cites in the delta.
  - Backup migration: `20261023000000_backup_server.sql` (eight tables, the bucket at `:677`, the sweep at `:1567`).
  - `APPLY.md:25`, `buckets.ts:39`, `daily.ts:14, 26, 31`, and the ten `eas.json` flag lines.
  - Sync, governance, invite and subscription migrations, and `scribe_core.sql:209-216, 291, 294, 299`.
  - App code: recovery export, backup, ledger, reminders, all 14 settings keys, local schema versions 5 to 10.
- Status labels:
  - "On develop": every row checked is on develop.
  - "In PR #n": #798 is open at `7f36031a`, and its cites hold there. #835, #836 and #839 are open at the heads named.
  - "Planned": none of 14 planned identifiers exists on develop.
- #854: this PR changes none of #854's rows. ADR 0028 Q4, Q5, D3a and D6 agree with the rows.
- D-159 and docs/ops: the cites hold.
  - `free-tier-ops.md:9` says the Free plan has no automatic backups.
  - `free-tier-ops.md:76-86` covers the restore limit.
  - `staging-backup-free.md:31-36, 76-78` covers the drill copy.
  - `supabase-backup.yml:1-22, 240-244` gives the schemas and `retention-days: 7`.
  - `DECISIONS.md:666` is D-159.
- Format: ASCII only in added lines. +154 / -29 in 3 files.

## Notes

1. The DC 4.1 regeneration and the K-2 paired-PR rule are proposals in the body, not edits. Each still needs a BL row.

## Not verified

- Whether the backup workflow runs in the private repository, and Supabase's pricing page (the PR quotes the runbook's reading of 8 Nov).
- That counsel ids Q6, Q45 and Q51 keep their numbers in packet 1.7.0.

CI at 6f1d9fa0 (11:56 UTC): every check completed and green, including "tests and content rules", "database rules", "web e2e" and "required". The head was committed at 11:45 UTC, so it was more than 10 minutes old when I finalised this file.

Reviewer: independent of the author (CR-44).
