## Review B at 2a5125a992903460a51556f936a10b8fd54b60ce: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens: privacy and compliance (chapters 07 and 08, the data-rights runbook, privacy claims, consent, deletion, new vendors). File: `docs/tdd/new-scope/privacy.md` (274 lines, ASCII only). Head checked live; commit `2a5125a9` at 11:12 UTC on 20 Nov. CI on the head: green, all 9 checks passed (finished by 11:23 UTC; head over 10 minutes old when I finalised).

Must fix: none.

The earlier must-fix is closed. Review B at `a789fc99` found that OQ-F8's default ("Yes", with defaults "in force until answered") would weaken PRIV-R01. The only change since that head is OQ-F8's default, one line (`git diff a789fc99 2a5125a9`: 1 insertion, 1 deletion). It now reads: no change until the founder approves; until then each PR that adds a stored key or column carries its own inventory row in the same PR (PRIV-R01, NS-36-R6), and the founder merges that PR. That keeps the MUST rule and the P0 card row as they are, and it covers phone keys that have no flag, such as `reminders.onSince`. K-2 and section 4 stay as recommendations to Karma and the founder, and no longer act as a rule in force.

What I checked, with cites. These are unchanged since `a789fc99`: 41 sampled, 39 hold.
- Server: `scribe_core.sql:213`, `sync_v1_server.sql:598`, `backup_server.sql:677`, `classification.test.mjs:24`. The `entry-photos` client policies are at `security_and_family.sql:228-236`.
- App code on develop (`20553b18`): `share-text.ts:8`, `merge.ts:843-848`, `recovery-export.logic.ts:1-4, 34`, `gate.logic.ts:123-125`, `ownership.ts:49`, `consent.ts:117`. The server reads the idempotency key at `20261108000000_consent_record_fields.sql:158`, so "no server change" for the consent retry holds.
- Docs: `privacy-policy.md:17-25, 21, 35, 45, 55, 58, 90`; `app-store-privacy-labels.md:45, 54, 57, 84, 117, 127`; `data-policy.md:90-92, 123`; `DELETION_AND_EXPORT_SPEC.md:335, 337`; `DATA_CLASSIFICATION.md:28, 597`; ADR 0028 `:34-35, :183-184`.
- PR heads and the locked pack: `store.ts:1311, 1328` on #839; `README.md:41` and `00-product-frame.md:85` at `450bcb4a`.
- Did not hold: line 145, "no PR yet" (#854 was opened at 05:34 UTC); line 207, `photo_bucket_closed.test.mjs` listed as if it exists (it does not yet, `security.md:56`).

What leaves the phone: every "Leaves" cell I could test holds against develop, except the NS-17 row (note 2). No upload path for pictures; reminders are local and the preflight refuses `aps-environment`; `author_signs_as` syncs insert-only; earlier versions are already on the server.

Founder and counsel boundaries: nothing in the file decides a founder or counsel question now. No date is set. No word a parent reads is approved (new keys are PROPOSED). Every legal reading is a question. X2 is respected: NS-05 Level 1 is text only and Arm W is held.

Notes (most serious first; carried from the first review, none addressed at this head):
1. CR-67 AX-10. Section 0 item 5 and section 1.4 still call NS-12's export a "ruling". CR-67 sends it to the founder: not exported until then. CR-67 wins until the next touch. The spec gap at `DELETION_AND_EXPORT_SPEC.md:337` stays on the founder's list either way.
2. CR-67 AX-5. The NS-17 row (line 39) says "Leaves: Flag only", the flag is on `held_drafts`, and "the server copy emptied at the mark". All three assume S3. Under the rule in force (never push a flagged take until it has typed words), nothing about that take leaves the phone.
3. Section 4 says BL-960 "supersedes" #854 and #799. #873 is now stacked on #854 and folds #799, so update line 145 to match #873.
4. "X2" names two different rules (`README.md:41` against `16-council-review-round-2.md:71`). Qualify each use.
5. Conflict P-3 is a label answer, so it goes to the founder and to counsel Q54, not only to product (CR-66).
6. The placeholder key has two names: `notifications.previewPlaceholder` here and `reminders.previewPlaceholder` in `11-foundations.md` (#864).
7. Section 4 item 1 says "version 11"; develop is at version 10. #873 already words it as "10 on develop; 11 with #835 and #836".
8. NS-18. "Deleted the day after delivery" in this file, against "at the first re-plan after the date" in `09-capture.md` section 5. The re-plan needs the app to open.

Buildability: unchanged and sufficient. Section 5 gives each control a test and an owner. Section 4 lists the inventory rows that #873 now carries.

Not verified: anything on a phone; the eval A to C cites; whether Apple's privacy-label definitions have changed since 15 Oct.

Reviewer: independent of the author (CR-44).
