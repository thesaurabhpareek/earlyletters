---
chapter: 08
title: Data rights and legal requests
owner: compliance-engineer
reviewers: [security-architect, data-steward]
status: adopted
last_reviewed: 2026-10-03
applies_to: supabase/migrations/** (deletion, purge, holds, consent), apps/mobile/src/**/delete*, apps/mobile/src/**/export*, docs/support/**, ops scripts
---

# 08. Data rights and legal requests

## Purpose

This is the engineering runbook for every request a person or an authority makes about data we hold: delete, export, access, correct, withdraw consent, forget analytics, and legal process. A family must be able to trust that "delete" means gone on a stated timeline, that nobody else can delete their words, and that we never open a letter for anyone without counsel. Data mechanics (tombstones, purge, ledger, cascades) are chapter 03; the retention schedule is chapter 04; this chapter is intake, verification, scope, execution, deadlines and proof.

I am not a lawyer. Every timeline below is an engineering reading of a source, to be confirmed with counsel.

## Principles

1. **Self-serve first.** Every right a user can exercise in the app is built there; support handles only what the app cannot. *Why:* Apple 5.1.1(v) and fewer chances for a human mistake.
2. **Verify control, not identity theatre.** We confirm the requester controls the account; we never act on an email alone for anything destructive. *Why:* a forged deletion destroys a child's letters forever.
3. **Authors own their words.** A request reaches only the requester's own data and the books they solely parent. *Why:* DATA-REQ-012, DATA-REQ-015; the equals rule.
4. **Every request leaves a content-free trail.** Receipt, verification, action and completion are timestamped with ids and enums only. *Why:* LEGAL-REQ-036; the trail is our proof.
5. **Counsel decides legal process.** Engineering preserves; it never discloses, searches or notifies on its own judgment. *Why:* register CR-112, LEGAL-REQ-057.

## Rules

**DSR-R01 (MUST)** Every request type has exactly one execution path, listed in the request matrix below; support never edits rows by hand or runs ad hoc SQL against user data. *Why:* one path is testable and auditable. *Enforced by:* review (compliance-engineer); service-role scripts through one runbook wrapper `not yet: TDD 05 section 7.7` (`ops/lib/runbook.mjs` does not exist).

**DSR-R02 (MUST)** Before any destructive action requested outside the app (email, `/delete-account` form), support verifies control of the account email by sending a sign-in link or code to it and waiting for it to be used. A request that cannot be verified within 30 days is closed as unverifiable. *Why:* LEGAL-REQ-036, DATA-REQ-021, privacy policy section 14. *Enforced by:* review; runbook `not yet: PDATA-02 follow-on` (no `privacy_requests` table yet).

**DSR-R03 (MUST)** In-app destructive requests re-authenticate when the session is older than 24 hours, then type-to-confirm. *Why:* DATA-REQ-019 step 5; spec OQ-7. *Enforced by:* `not yet` (deletion UI not built).

**DSR-R04 (MUST NOT)** Delete, edit or hide another author's letter as a result of anyone else's request. A parent removes a family letter from the book only by "set aside"; only a sole parent deletes a whole book. *Why:* DATA-REQ-014, -015, -017. *Enforced by:* `request_book_deletion()`, `delete_entry()` and `child_members_guard` in `supabase/migrations/20261002020000_data_governance.sql`, tested in `supabase/tests/data_governance.test.mjs` (enforced in repo; not applied live, DB-03). Bypass risk: DB-01 (`book_entries` writable view) `pending PR #32`; DB-17 (dashboard user delete cascades letters) `not yet`.

**DSR-R05 (MUST)** Every request outside the app gets a request-log row (see Request log) at receipt, and every state change is timestamped. *Why:* LEGAL-REQ-036. *Enforced by:* `not yet: TDD 05 section 7.8` (`privacy_requests` is designed, not built). Until it exists, the founder keeps the log in the support mailbox with the same fields and no content.

**DSR-R06 (MUST)** Account deletion uses `request_account_deletion` then `purge_due` and the purge worker, in the step order of DELETION_AND_EXPORT_SPEC section 2.6.3, and completes only after the verification checks of DATA-REQ-034. *Why:* DATA-REQ-020, -034. *Enforced by:* SQL functions and `finalize_account_deletion` guard (repo); the worker is `not yet: PDATA-02`. **Today nothing executes deletion after day 30.**

**DSR-R07 (MUST)** Deletion propagates to every copy we control: Postgres, Storage, devices (on next sync or launch), processors, and backups by age. *Why:* DATA-REQ-011, -023, -030, -033; LEGAL-REQ-032. *Enforced by:* `not yet: PPRIV-01` (devices never purge tombstones), `not yet: PDATA-04` (`analytics-forget` not built), `not yet: PDATA-02` (Storage and processors).

**DSR-R08 (MUST)** Every completed request yields proof: an `audit_events` row with an allowed action, and for account deletion a `deletion_requests.receipt` (counts and step outcomes, at most 2 KB, never content) plus the three transactional emails. *Why:* DATA-REQ-025, DATA-REQ-045. *Enforced by:* table checks in `data_governance.sql` (enforced in repo); emails `not yet` (no email provider wired).

**DSR-R09 (MUST)** A purged id never comes back: a stale device cannot resurrect a deleted letter. *Why:* DB-02. *Enforced by:* `pending PR #32` (SQLSTATE `SCPRG`, permanent purged-id set).

**DSR-R10 (MUST)** A legal hold is placed only by the founder or counsel, names one scope (`profile`, `child` or `entry`), carries a `matter_ref` and a `review_by` date, and pauses purge for that scope only. It is released as soon as the duty ends and reviewed no later than `review_by`. *Why:* DELETION_AND_EXPORT_SPEC section 3, DATA-REQ-035; data-policy section 7. *Enforced by:* `legal_holds` table, `is_held()` and `purge_due()` in `data_governance.sql`, test "legal hold blocks purge" in `supabase/tests/data_governance.test.mjs` (enforced in repo). Gaps: nothing writes `legal_hold_placed` or `legal_hold_released` audit events and nothing alerts on a passed `review_by` (`not yet`).

**DSR-R11 (MUST)** Preservation for legal process uses only the preservation script (snapshot to a restricted bucket, 90-day expiry, audit-logged), run on counsel's written instruction. No other access path exists. *Why:* LEGAL-REQ-057. *Enforced by:* `not yet: LEGAL-REQ-057` (P1).

**DSR-R12 (MUST)** Track two clocks per request: our published SLA and the statutory outer limit. Acknowledge within 10 days; complete within 45 days of receipt; an extension of up to 45 more is sent before day 45 with the reason. *Why:* privacy policy section 14; LEGAL-REQ-031; CCPA (see Deadlines). *Enforced by:* `not yet` (needs the request log and a daily overdue query).

**DSR-R13 (MUST)** Tell users the honest backup window: deleted data is off live systems within 31 days of the request, off backups within 38, and processors within 45. A change to Supabase backup or PITR settings updates `data-policy.md` section 5 and privacy policy section 10 first. *Why:* DATA-REQ-030, DATA-REQ-036. *Enforced by:* review; monitoring query `not yet: PDATA-06`.

**DSR-R14 (SHOULD)** Answer an access request by pointing to Export everything (DATA-REQ-050 to -052) or, without the phone, a server export link (DATA-REQ-054), rather than a hand-built file. *Why:* one tested path; the export is complete by design.

## Request matrix

Intake channels: in-app (Settings > Your data, Settings > Privacy), the `/delete-account` page (static plus email at v1.0, D-042), and the privacy email (`{PRIVACY_EMAIL}`; `packages/brand/index.ts` still has a placeholder `supportEmail`).

| Request | Intake | Verify | Scope | Execution path | Proof |
|---|---|---|---|---|---|
| Delete a letter | In-app | Signed-in author | Own letter only | `delete_entry`, `restore_entry`, `purge_due` (spec 2.2; DATA-REQ-010, -011, -013) | `entry_deleted`, `purge_run`, `purge_ledger` |
| Delete a book | In-app | Signed-in parent | Two parents: own letters plus leave; sole parent: whole book, contributors get export link | `request_book_deletion`, `cancel_book_deletion` (spec 2.3; DATA-REQ-014, -053) | `book_deletion_requested`, `book_purged` |
| Leave a family | In-app | Signed-in member | Own membership; letters stay or are set aside, never deleted | delete on `child_members` with `child_members_guard` (`SCLPG` for last parent) (spec 2.4; DATA-REQ-016) | `left_book` |
| Remove a contributor | In-app, parent | Signed-in parent | Access only; letters stay or are set aside | spec 2.5 (DATA-REQ-017); RPC `not yet: PSEC-01` (WS-02) | `member_removed` |
| Delete account | In-app; `/delete-account`; email | In-app re-auth; email: link to account address | Own letters, sole-parent books, profile, processors | `request_account_deletion`, `cancel_account_deletion`, purge worker (spec 2.6; DATA-REQ-019 to -027) | receipt, `account_deletion_*` events, emails |
| Export / access | In-app; email | As above | Own letters in full; others' in-book letters as final text only (spec 4.1) | Export everything (DATA-REQ-050 to -056); server export P1 | `export_created` (P1) |
| Correction | In-app; email | As above | Own profile and own letters' final text; `raw_transcript` never changes | User edits in app; support fixes profile fields only through a runbook | request log |
| Withdraw consent | In-app (two taps); email | As above | That consent | `record_policy_act` (`settings_toggle` or `support_assisted`) (LEGAL-REQ-008) | `policy_acceptances` row |
| Analytics forget | In-app, at deletion request | Session, or signed deleted-account token | Current and retired analytics ids on the phone | `analytics-forget` (TDD 05 section 7.4; PDATA-04) `not yet` | count-only log |
| Legal process | Email to privacy address | Counsel validates the process | Named accounts only | Counsel review, then hold (DSR-R10) or preservation (DSR-R11) | hold row, request log |

Email-only requesters cannot reach analytics data: we hold no link between the analytics id and the account (TDD 05 section 5.6, counsel question OQ-L13).

## Deadlines

Engineering reading, confirm with counsel. Which laws apply to a US-first, iOS-only launch (D-013) is a counsel question; the product applies the strictest of these to everyone.

| Source | Reading |
|---|---|
| California AG CCPA page | Respond to know, delete and correct requests within 45 calendar days; one extension of 45 more with notice. Verification data may be used only for verification. |
| CCPA regulations as approved in 2020 (AG final text, section 999.313) | Confirm receipt within 10 business days; the 45 days run from receipt, not from verification. Account holders may be verified through existing authentication (999.324). Later CPPA renumbering not opened this run. |
| GDPR Article 12(3) and 12(4) | One month, extendable by two months for complex requests with reasons. Not in scope for a US-only launch unless counsel says otherwise. |
| GDPR Article 17(3) | Erasure need not cover data kept for legal claims; this is the closest analogue to our hold rule. |
| Apple account deletion guidance | In-app initiation; delays allowed if the user is told how long and gets a confirmation; email or phone may be used only for verification. |
| Washington AG MHMDA page | Deletion right reaches archived and backup systems; no timeline stated on that page. |

Our published promise (privacy policy section 14, consumer health data notice section 6) is the operating SLA: acknowledge in 10 days, complete in 45.

## Request log

One row per non-self-serve request, service role only, retained 3 years after completion (TDD 05 section 7.8). Fields: id, kind, channel, received, acknowledged, verified (method), extended, completed, outcome enum, profile id (nulled at deletion), ticket ref. **No free text, no email body, no letter content.** The mailbox holds the correspondence; the log holds the proof.

## Never

- Never disclose letter content, audio or photos to anyone other than their author without valid legal process reviewed by counsel.
- Never notify, or withhold notice from, a user about legal process contrary to counsel's advice.
- Never search or read content to answer a request beyond its scope. Access requests are answered by export, not by staff reading letters.
- Never delete from the Supabase dashboard (DB-17: it cascades letters and skips the flow).
- Never put content in a request log, ticket title, audit detail or receipt.

## How to apply it

**Support handling an emailed deletion request:** open a log row; acknowledge (template); send the verification link to the account address; on verification, run the support deletion path with `source='support'` and a ticket ref (DATA-REQ-027); record completion; the user receives the standard receipts.

**Engineer changing a deletion or consent path:** cite the DATA-REQ ids the change satisfies; add a test in `supabase/tests/`; confirm the request matrix row still holds; ask compliance-engineer for review.

Response templates belong in `docs/support/` (owned by `support`); none exist yet. Handoff filed in the draft notes.

## Exceptions

Only the founder grants an exception, with counsel's written note for anything touching a statutory clock, verification, or legal process. Recorded as a `D-###` or in the request log's ticket. Under-13 discovery may skip the 30-day grace when counsel requires it (DATA-REQ-027, spec OQ-12).

## Open questions

1. **Which laws apply at launch (counsel):** CCPA thresholds, other state laws, MHMDA, for a US-only app.
2. **Legal hold notice (counsel):** may a held user still see deletion as done (data-policy section 7)?
3. **Co-parent account deletion and shared books (counsel, spec OQ-1).**
4. **Analytics on cancelled deletion (counsel, TDD 05 OQ-L3):** PostHog data deleted at request time cannot be restored.
5. **Spec drift (founder):** the `deletion_request_steps.step` check still lists `revenuecat`, while the spec (v1.1.0) and ADR 0013 say `appstore_mapping`. Fix in a pending migration.

## References

Repo: `docs/legal/DELETION_AND_EXPORT_SPEC.md` sections 2 to 4 and 8, DATA-REQ-010 to -036, -045, -050 to -056; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-029 to -036, -056, -057; `docs/legal/data-policy.md` sections 5 and 7; `docs/legal/privacy-policy.md` section 14; `docs/legal/consumer-health-data-notice.md` section 6; `docs/legal/compliance-register.md` CR-112, CR-113; `docs/tdd/05-privacy-compliance.md` sections 5.6, 7.4, 7.5, 7.8, 13; `supabase/migrations/20261002020000_data_governance.sql`, `20261003020000_purge_batching.sql`; `supabase/tests/data_governance.test.mjs`; D-006, D-013, D-042; findings PDATA-02, PDATA-04, PPRIV-01, DB-01, DB-02, DB-03, DB-17, PSEC-01.

External (engineering reading, confirm with counsel):
- California AG, CCPA, https://oag.ca.gov/privacy/ccpa, checked 2026-10-03.
- California AG, CCPA final regulation text (2020), https://oag.ca.gov/sites/all/files/agweb/pdfs/privacy/oal-sub-final-text-of-regs.pdf, checked 2026-10-03. The current CPPA text at https://cppa.ca.gov/regulations/ could not be fetched this run.
- GDPR, Regulation (EU) 2016/679, Articles 12 and 17, https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679, checked 2026-10-03.
- Apple, App Review Guidelines 5.1.1(v), https://developer.apple.com/app-store/review/guidelines/, checked 2026-10-03.
- Apple, Offering account deletion in your app, https://developer.apple.com/support/offering-account-deletion-in-your-app/, checked 2026-10-03.
- Washington AG, My Health My Data Act, https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy, checked 2026-10-03.
