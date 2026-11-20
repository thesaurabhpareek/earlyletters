## Review B at 6f1d9fa0e7e8b349d5304ecda476c0fe20491933: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens: privacy and compliance (PRIV-R01 inventory, PRIV-R12 vendors, PRIV-R17 claims, DSR deletion timing). PR #873 (BL-960) is stacked on #854, and the founder merges it. Head checked live; commit `6f1d9fa0` at 11:45 UTC on 20 Nov. CI on the head: green, all 13 checks passed (finished by 11:55 UTC; the head was over 10 minutes old when I finalised).

Must fix: none.

What changed since my Review B at `da5496ca` (PASS WITH NOTES): `git diff da5496ca 6f1d9fa0` touches 3 files, +7 / -4, and the added lines are ASCII only. The changes are all for Review A.
- DC 4.3: a blank line is restored so the table renders. Nothing in it changes.
- DC 4.5: `plus.statusReport` and `plus.notesSeen` move from L2 to L3. I checked both on develop:
  - `plus.statusReport` holds the owner account id, a fingerprint per purchase and pending consent facts (`status-report.logic.ts:51, 65-86`). That is purchase state tied to a person (rule 1.1.4).
  - `plus.notesSeen` (`plan-notice.tsx:30`) holds ids `plan.<kind>.<date>` (`plan-reminders.logic.ts:190, 292, 339`), and the date is a renewal or trial-end date. The server's `subscription_status.renewal_date` is L3 (`subscription_status.sql:124`), so the phone matching it is consistent.
  - Raising a level is stricter, never weaker.
  - The row says truthfully that the code comment at `status-report.logic.ts:18` still says L2. The PR says the code change is handed to `mobile` (#886).
- data-policy 4.3 `entry-photos`: "refuses every client write" becomes "refuses every client insert and update". That is narrower and matches BL-870's scope: the bucket has no client delete policy to drop (`scribe_core.sql:294, 299` are insert and update). No promise is added.

Everything from my earlier reviews still holds:
- The 7-day backup clock is limited to the GitHub dump, and the drill copy is marked open for the founder and counsel (sections 5 and 6).
- The withheld flag reaches the server only if S3 is ruled in (CR-67 AX-5).
- 52 of 52 sampled cites hold on develop at `20553b18`.
- Open founder and counsel items are quoted as open.
- No new promise to users.
- D-159's GitHub-held backup and the Free-plan restore limit are stated as facts, with the public wording left to the founder and counsel.

Notes:
1. Two follow-ups sit outside this PR. The code comment at `status-report.logic.ts:18` should say L3 (#886, `mobile`). The DATA_CLASSIFICATION 4.1 regeneration needs its own BL row (Karma).

Not verified: rows that cite #798 at `7f36031a` and #836 at `3395e5a6`; whether the nightly workflow runs in `earlyletters-backups`; whether the drill folder is excluded from Time Machine; which migrations production has applied; anything on a phone.

Reviewer: independent of the author (CR-44).
