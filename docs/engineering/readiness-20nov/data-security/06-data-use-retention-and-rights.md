# 06. Data use, retention and rights

Owner: `privacy`. Written 20 Nov 2026. Companion: `05-audit-logging-and-reporting.md` (what is logged, who reads it). Inventory and columns: document 01 and 02 (`data-architect`); access paths: document 03; secrets and endpoints: document 04; customer messages: document 07.
Status: draft for the council. It changes no code, no migration, no legal text, no word a parent reads. I am a Claude role, not a lawyer; every legal reading is marked for counsel.
Tags: [V] verified (file and line read on `origin/develop` at `4d33978f`), [E] estimate with its basis, [U] unverified. Rec = my proposal.
Levels: `docs/legal/DATA_CLASSIFICATION.md` (DC) 1.5.0, L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted. DC section numbers stand in for the data-architect's inventory ids until document 01 lands. Matrix rows below (M1 to M12) are rows of this file, not new levels: each names the DC level and DC section it comes from.

## 0. What we promise, in the words the code must prove

Published sentences that this file and the code must keep true [V `docs/legal/privacy-policy.md:72, 82-84`]: we never listen to recordings; we do not sell your information or share it for advertising; we do not use letters, recordings or names to train models; we use sensitive information only to provide the service. Deleted data leaves live systems within 31 days of the request, backups within 38, processors within 45 [V `data-policy.md:187`, DATA-REQ-036]. Every row below is a test target for these.

Order of precedence when two sources disagree: cards (CR-66), then the function files, then the legal documents, then chapters 07, 08 and 10. A disagreement is a Conflict line (section 11), not a silent choice.

## 1. The where-can-it-be-used matrix

Cell codes: **A** allowed; **C<n>** allowed with condition n (section 2); **F** forbidden; **F-X2** forbidden until X2 (security read plus counsel read) is satisfied; for text, until a founder decision (C10). Sources are given per row and per condition, not per cell. Default is F: a purpose not listed for a row does not exist. A row's level decides its ceiling: L4 is F for every purpose that is not "product" or "legal requests" unless a condition says otherwise.

| Row | Data (DC level, section) | Product | Support | Analytics | Security | Debugging | Reporting | Marketing | AI features | Legal requests |
|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Public: legal texts, prompt library, store text, packs (L1; DC 4.4, 4.6) | A | A | A | A | A | A | A | A | A |
| M2 | Counts, enums, codes, durations, SQLSTATE, random request id, allowlisted analytics properties (L2; DC 4.7, 4.9) | A | A | C1 | A | A | C2 | C3 | A | A |
| M3 | Account identity: email, auth subject ids, display name, signature, relation (L3; DC 4.1.1 `profiles`, 4.2) | A | C4 | F | C5 | C6 | F | C7 | F | C8 |
| M4 | Identifiers and paths: person, book and letter ids, object paths, device and install ids (L3; DC 1.1 rules 4, 5; 4.1, 4.3.1) | A | C4 | F | C5 | C6 | F | F | F | C8 |
| M5 | Consent and process records: `policy_acceptances`, `deletion_requests`, `legal_holds`, `subscription_consents`, `audit_events`, `ops.audit_log`, `escrow_unwraps` (L3; DC 4.1) | A | C4 | F | C5 | C6 | C2 | F | F | C8 |
| M6 | Network and device facts: IP address, user agent, locale, request headers (L3; DC 4.2, 4.8) | F | F | F | C9 | F | F | F | F | C8 |
| M7 | Letter content: `final_text`, `raw_transcript`, `machine_edits`, `stt_meta`, versions, held drafts, search index (L4; DC 4.1.1 `entries`, `entry_versions`) | A | F | F | F | F | F | F | F-X2 | C8 |
| M8 | Audio and photos, on the phone and in private buckets (L4; DC 4.4, 4.6, 4.3.1) | A | F | F | F | F | F | F | F-X2 | C8 |
| M9 | The child and family: name, nickname, birthday, due date, languages, goals, dictionary terms, sealed dates (L4; DC 1.1 rules 6, 7; `children`, `dictionary_terms`) | A | F | F | F | F | F | F | F-X2 | C8 |
| M10 | Secrets and keys: sessions, invite tokens, escrow and wrapped keys, Apple refresh token, signing and service keys (L4; DC 1.1 rule 8) | A | F | F | C11 | F | F | F | F | F |
| M11 | Safety tiers (L4; DC 4.6; device only) | A | F | F | F | F | F | F | F | F |
| M12 | Plan state on the phone (`plus.cache`, StoreKit result) (L3; DC open issue 9) | A | F | C1 | F | F | C2 | F | F | F |

The product column for M7 to M9 means the person's own phone and the paths the cards define (author, co-members through `book_entries`, backup, export), never a staff or vendor path.

## 2. The conditions

| Id | Condition | Source |
|---|---|---|
| C1 | Only an event in the typed catalogue, after a yes on the consent sheet, in a build whose flag is on; random analytics id only; never in 1.0.x. | `packages/analytics/src/validate.ts:25, 71-80`; LEGAL-REQ-003, -017; FR-DAT-01 [V] |
| C2 | Counts only; every published cut is 0 or at least 10 families (k = 10); no date that re-identifies a person; no per-person row. In the 1.0 line the sources are the ones in `05` section 6.1. | DC 4.9; FR-DAT-08, -28 [V] |
| C3 | A count may inform a decision; it is never put in an email, a store page or an ad as a number about "you" or "families like you" without the claims check (FR-MKT-01). No retargeting, no lookalike, no ad network. | LEGAL-REQ-016; FR-MKT-01, -07 [V] |
| C4 | (FR-BKO-02 is a spec, not built code.) The person's own request, a ticket reference, and the narrow summary function (sign-in provider, created and last sign-in date, consent current, book count and role, deletion status, hold flag, open invites). No email, no book name, no child name, no letter text, no path in the summary. Reached only through an `ops.audit_log` row written first. | FR-BKO-02 (new row; not built) [V row text]; LEGAL-REQ-025 |
| C5 | Incident or abuse handling only: by request id, time window and SQLSTATE first; a person id only through an audited runbook; the finding is counts and codes. | OBS-R14; `scripts/ops/lib/runbook.ts:1-29` [V] |
| C6 | Only through an audited runbook and a ticket; the finding is written as codes and counts; never pasted into a ticket, chat, log or PR. | OBS-R14; `docs/ops/runbooks/data-requests-by-email.md` section 0 [V] |
| C7 | Only an address the person gave for that purpose and has not withdrawn (the website waitlist). It sits at Resend, is never joined to an account, and is deleted on request. App users get transactional mail only until counsel and the founder decide otherwise. | `subprocessors.md` (Resend row); `data-policy.md:187`; LEGAL-REQ-053 [V]; question Q5 |
| C8 | Counsel has validated the request and named the scope. Engineering only preserves (hold, or the preservation script when built). Engineering never searches, reads, discloses or notifies on its own judgment. | chapter 08 DSR-R10, R11, "Never"; LEGAL-REQ-057 [V] |
| C9 | A vendor may hold an IP address in its own log (Supabase Auth, Vercel, Cloudflare). We copy none into our tables. The country check uses the address in memory and drops it; only daily counts by outcome and jurisdiction code remain, 2 years. | FR-PRV-26; D-131, D-136 [V row text] |
| C10 | **X2 first.** A child's voice or picture leaving the phone needs a security read and a counsel read first (X2; ruling 3; `docs/product/prd/00-product-frame.md:91`; E23 in `18-errata-after-lock.md:31` extends the same two reads to a picture sent to another person). So the AI-features cells for audio and photos (M8) are F-X2: forbidden until both reads are done. This pack also recommends, and X2 does not say, that letter text and child data (M7, M9) stay forbidden for cloud AI until a founder decision; the cells say F-X2 for the same reason. This is a ceiling for a decision not taken. On the person's own device for 1.0 (on-device speech and the faithful-edit engine) it is allowed. If the reads are done and the founder decides yes, a provider also needs: the person's AI-processing consent, the minimum content, identifiers stripped, zero retention, no training, a signed processing agreement, a data-map row. No feature writes, rewrites, summarises or shapes a person's words, whatever the provider. | CLAUDE.md constitution; LEGAL-REQ-020 [V `ENGINEERING_REQUIREMENTS.md:168-173`]; DC section 2 "Processors"; FR-AIS-01, -02 |
| C11 | A secret is read only by the holder named in document 04, in the store named there, and never leaves it. A rotation or a break-glass use writes an `ops.audit_log` row (`key_change`, `break_glass`). | `docs/ops/SECURITY.md` section 1; FR-BKO-20 [V] |

## 3. The same matrix, as the code proves it

Where a cell is F, name the test or the missing test. Missing means a gap (section 10).

| Purpose | What stops it | Test or guard | State |
|---|---|---|---|
| Analytics gets only L2 | catalogue has no type for text, id or date | `packages/analytics/test/catalog.test.ts`, `analytics.test.ts` | [V] file names; run not repeated here |
| Analytics not before consent | `defaultOptIn: false`, queue cleared on revoke | `posthog.ts:163-171`, `client.ts:158-165` | [V] |
| Analytics absent from 1.0.x | no `posthog-react-native` dependency, flag off | `apps/mobile/test/analytics-off-v1.test.ts`; `preflight-production` check proposed by FR-PRV-31 | test [V]; the dependency check is a card row, not built [U] |
| Logs hold no content | closed logger, no free-text field | `_shared/log/log.ts:141-198`; `canary.test.ts` | [V] |
| Support never needs content | summary function with canaries | FR-BKO-02 | not built |
| Support mail carries no content | fixed subject, empty body | FR-SUP-03, FR-PRV-12 (`packages/brand/index.ts:61` builds a bare `mailto:`) | true today [V], pin test not built |
| Debug reads no content | no L4 grant to any API role; Postgres `DETAIL` not exported | `supabase/migrations/20261023060000_explicit_grants.sql:49-56`; chapter 10 OBS-R02 | grants [V]; log verbosity [U] |
| Marketing uses no app data | no ad SDK, no join between waitlist and accounts | LEGAL-REQ-016 denylist test | card row; denylist test [U] |
| Legal requests read nothing | no staff tool shows L4; no disclosure path | LEGAL-REQ-025, -057 | script not built |
| Letter content never to a model | no cloud AI path in 1.0.x | build flags; DC 4.8 "v1.1" | [V DC]; code scan for AI endpoints [U] |

## 4. Retention and deletion schedule

Periods marked "proposed" (unconfirmed sign-up 7 days, crash events 90 days, analytics 12 months, support mail 2 years) are proposals, not law.

One schedule. Periods are the ones in force or proposed in `data-policy.md` section 6 and DATA-REQ-060 to -066; where a period is only proposed it says so. "Job" is what removes the record; a console setting is recorded in a runbook, never done from memory (DATA-REQ-006).

| Record (table or store) | DC | Kept for | Then | Job and proof |
|---|---|---|---|---|
| Letters, versions, held drafts, photos (`entries`, `entry_versions`, bucket `entry-photos`) | L4 | until the author deletes, or the book's sole parent deletes the book, or the account is deleted | 30-day tombstone, purge | `purge_due`; `purge_ledger`; `entry_deleted` and `purge_run` audit rows [V `20261108020000:157-171`] |
| Books (`children`, members, prefs, invites, dictionary) | L4/L3 | until a sole parent deletes, or account deletion | 30-day tombstone, purge; a kept book holds only name and dates while a former member's letters remain (`purged_at`) | `purge_due` steps 1 and 2b [V `:128-193`]; `book_purged` |
| Recording backup (`audio_blobs`, bucket `entry-audio`, `child_keys`, `backup_*`, `restore_*`) | L4/L3 | account life; pending upload 24 h; orphan 30 days; restore requests 90 days after final state | purge, Storage delete, ledger | `backup_svc_sweep`; DC 4.3.1 [V] |
| Account (`auth.users`, `profiles`) | L3 | until the person deletes | 30-day grace, then the worker's steps (section 5) | `purge-worker`; receipt [V chapter 08 DSR-R06] |
| Inactive accounts | L3 | no automatic deletion in v1 | n/a | counsel to confirm (OQ-11) [V `data-policy.md:197`] |
| Unconfirmed sign-up row (an email that never entered its code) | L3 | 7 days proposed | purge | FR-PRV-05 (card row; not built) |
| Invites and return-link hashes | L3 | 90 days after expiry, use or revocation | delete | `purge_due` [V `20261108020000:208`] |
| `audit_events` | L3 | 24 months | delete, actor nulled at account deletion | `purge_due` under `app.retention_purge` [V `:211-214`] |
| `ops.audit_log`, security events | L3 | 12 months | delete | `ops_retention` [V `20261004200000:363-371`] |
| `escrow_unwraps` | L3 | 24 months as built; Rec 12 to match D-021 (section 14.1) | delete | purge job; period open (Q51), "as built, not approved" |
| `deletion_requests`, receipts | L3/L2 | 3 years after completion | delete | `purge_due` [V `:209-210`] |
| `policy_acceptances` | L3 | account life, then pseudonymised, then 3 years | delete | `purge_due` [V `:213`] |
| `subscription_consents` | L3 | 3 years after pseudonymisation | delete | `20261016001000:133-148` [V] |
| `purge_ledger`, bucket `ops-ledger` | L3 | 60 days | delete | `purge_due` [V `:217`] |
| `storage_purge_queue` | L3 | 7 days after done | delete | `purge_due` [V `:218`] |
| Server exports (`exports/`, P1) | L4 | 7 days | delete | not built (DATA-REQ-054) |
| Analytics events (when on) | L2 | 12 months proposed | provider deletion | console setting; `analytics-forget` [V code, console U] |
| Crash events (when a crash SDK exists) | L2 | 90 days proposed | provider deletion | none today |
| Sent email at Resend | L3 | 30 days after sending | vendor roll-off | the deletion-complete email is held to about day 60 [V `data-policy.md:187`] |
| Support mail | L4 | 2 years after the last message (proposed) | delete | founder, by hand; weekly card [U] |
| Request log (non-self-serve requests) | L3 | 3 years after completion | delete | founder file today; a table once volume passes the FR-BKO-11 trigger |
| Tester round raw answers | founder sheet | 90 days after the round | delete, one dated line in the repo | FR-DAT-05 [V] |
| Database backups | L4 | Free plan: no Supabase backup; the nightly dump, 7 days in a private repo, age-encrypted | roll-off | FR-PRV-08; `free-tier-ops.md`; `reliability.md:43` [V]. If Pro or PITR is bought, the window in every promise changes first (DSR-R13) |
| Phone (`scribe.db`, files) | L4 | until the person erases, or a purge sync, or the launch purge after the shelf period | local erase | `apps/mobile/src/lib/store.ts` launch purge [V chapter 08 DSR-R07]; purge on sync not verified in code |

Published promise check: live 31 days = 30-day grace plus one day; backups 38 days = 31 plus the 7-day dump; processors 45 days = 31 plus 14; Resend about day 60 is the one named exception [V `data-policy.md:187`]. If the dump window grows past 7 days the 38-day sentence is false; a test is not built [U].

## 5. Erasure

Paths [V `DELETION_AND_EXPORT_SPEC.md` 2.6.3 table; chapter 08 request matrix]:

| What the person does | Path | Proof |
|---|---|---|
| Deletes a letter | `delete_entry`, 30 days in Recently deleted, `restore_entry`, `purge_due` | `entry_deleted`, `purge_run`, ledger row |
| Deletes a book (sole parent) | `request_book_deletion`, `cancel_book_deletion`; contributors get a 30-day server export link | `book_deletion_requested`, `book_purged` |
| Leaves a family | delete on `child_members`; their letters stay or are set aside | `left_book` |
| Deletes the account | `request_account_deletion`; 30-day change of mind; `purge_due` hands it to the worker; steps `prepare`, `storage_objects`, `apple_token_revoke`, `posthog` (at request time), `email_provider`, `receipt_email`, `auth_user`, then `finalize_account_deletion`; each retried with backoff for 7 days then the founder is alerted | receipt (counts, at most 2 KB), three emails, `account_deletion_*` audit rows |
| Withdraws consent | `record_policy_act`; writes stop at once; what happens to letters already on the server is PQ-1, open | `policy_acceptances` row |
| Turns analytics off | revoke retires the id; `analytics-forget` asks PostHog to delete the retired and current ids | count-only log |

Rules that never bend:
1. A purged id must never return: a stale phone must not resurrect a deleted letter (DB-02, DSR-R09). Today it is enforced for 60 days only: entry and book ids are refused while their `purge_ledger` row exists (`20261004100000_sync_engine.sql:119`, `20261016000000_sync_v1_server.sql:400, 420`, `20261003010000:271`, `20261004000000:52`, `20261023000000_backup_server.sql:883`). What is missing is the permanent guard after day 60 (`SCPRG`, which appears in no migration or test under `supabase/`); do not rebuild the 60-day check; finding 9.
2. A held scope is skipped by purge and by account deletion until the hold is released (`legal_holds`, `purge_due`; DATA-REQ-035) [V `20261108020000:130-133, 160`].
3. No request deletes, edits or hides another author's letter (DSR-R04).
4. Deleting from the Supabase dashboard is forbidden: it cascades letters and skips every step (DB-17).
5. A restore from the nightly dump replays the ledger before any phone syncs (FR-PRV-09) [card row; ledger bucket exists, 60 days]. The honest limit while production is on Free: up to 24 hours of deletions can return after the project is lost; where it is said is counsel's call; default the incident notice, not the policy (PQ-10, CL-081).
6. Under-18 or under-13 discovery: the underage runbook applies and may skip the 30-day grace on counsel's word (DATA-REQ-027, chapter 08 Exceptions) [V `docs/ops/runbooks/underage-account.md` exists].

Not live yet [V chapter 08 DSR-R06, `APPLY.md:48`]: the worker is built and tested; deploying it and its cron to a live project is a founder step (D-041). Until then nothing executes account deletion after day 30 on a live project, and no policy sentence may say it does.

## 6. Export (access and portability)

| Question | Answer | Source |
|---|---|---|
| Who | the signed-in person, from the phone, in any plan state, offline | DATA-REQ-052 |
| What | own letters in full (raw transcript, final text, every edit, engine version, versions where server-held); other people's letters in the book as final text only; profile, consent history, memberships; audio and photos on the phone; `manifest.json` with SHA-256 per file and counts | DATA-REQ-050, -051; FR-AIS-05; FR-PRV-03, -21 [V] |
| Format | a ZIP on the phone, plaintext by design, said on the export screen; deleted from app temp after the share sheet closes | DATA-REQ-056; DC 4.6 |
| Before a deletion | Export is the primary action on the step before Confirm | DATA-REQ-053 |
| Without the phone | server-built export (P1): text only, a signed link for 7 days, object deleted after 7 days, an `export_created` audit row with counts and a manifest hash | DATA-REQ-054; the audit action exists but nothing writes it (`05` finding 1) |
| An access request by email | answered by pointing to Save a copy or the server export, never by staff reading or sending letters; no attachment of content from our side | DSR-R14; `docs/ops/runbooks/data-requests-by-email.md` section 0 [V] |
| Server-held rows about the person (`audit_events`, `deletion_requests`) | counsel decides if an access request reaches them (PQ-5); default yes, in `account.json` | FR-PRV-03; PQ-5 |
| Correction | the person edits their own letters and profile; `raw_transcript` never changes; the From name is insert-only today (PQ-4) | chapter 08 matrix; FR-PRV-22 |
| Deadlines | acknowledge within 10 business days, answer within 45 days from receipt, one extension of 45 with reason before day 45 (engineering reading, counsel to confirm) | DSR-R12; privacy policy "Your rights" section |
| Who may not | anyone but the author for raw transcripts; a co-parent for the other's letters | DATA-REQ-003, -012, -015 |

## 7. Legal requests

1. Intake: the privacy address, or any mail that looks like process. One founder reads it. No action, no disclosure and no reply until counsel says so; the `legal_date` is the day it arrived. The founder tells the CLO the kind and date, never the email [V `docs/ops/runbooks/data-requests-by-email.md` section 0; FR-BKO-16].
2. Validate: counsel decides whether it is valid process, which account it names, and whether the person is told. Engineering never decides notice (DSR "Never").
3. Preserve: a hold on one scope (`profile`, `child` or `entry`) with `matter_ref` and `review_by`, placed by the founder or counsel (`legal_holds`, no API reader) [V DSR-R10]. The preservation script (snapshot to a restricted bucket, 90-day expiry, audit row, no one reads content) is LEGAL-REQ-057, P1, not built. Until it exists no preservation beyond a hold is possible; say so to counsel rather than improvise.
4. Disclose: only counsel, only the named scope. What we hold in readable form: account email and ids (L3), letters as `final_text` and `raw_transcript` in Postgres (L4), photos in private buckets (L4). Recordings in backup are client-encrypted; the recovery service holds a key that can open them (D-102; DC 4.3.1 `escrow_wrap`). Whether and how that is described to a court is counsel's; I do not characterise it beyond the code.
5. Record: one request-log row with kind, dates and outcome; no content. Holds write `legal_hold_placed` and `legal_hold_released` audit rows once someone builds that (`05` finding 1).
6. Never: bulk exports to an authority without counsel; a search of content to answer a request; a statement that an address has or has no account (IAM-R09); using hold data for any other purpose (`data-policy.md` section 7).
7. Breach or suspected leak is a different path: `docs/ops/runbooks/suspected-data-leak.md` and `incident-notification.md`, and the affected-user count by `ops_incident_scope` (counts per category, never content) [V `20261004200000:400`].

## 8. Vendors and what each may receive

"May receive" is a ceiling. "Never" is forbidden even by mistake. A new vendor, a new data class to an old vendor, or a new region needs a row here, in `docs/legal/subprocessors.md`, in the privacy policy and the label first (DATA-REQ-001, -005). I adopt none.

| Vendor | Role | May receive | Never | Deletion and retention | Source |
|---|---|---|---|---|---|
| Supabase (US region; Postgres, Auth, Storage, Edge Functions; a separate project for the recovery key when backup ships) | system of record | M3 to M5, M7 to M9 in tables and buckets; M10 only as hashes or wrapped values | plaintext keys in logs; statement logging | purge, Storage delete; backups per section 4 | `subprocessors.md`; DATA-REQ-005; APPLY.md |
| Apple (Sign in with Apple, StoreKit, App Store Connect, iCloud device backup) | sign-in, purchases, crash counts | what Apple already holds; the refresh token we keep encrypted is for revoking only | purchase history on our servers (none exists, ADR 0013) | revoke at deletion (`apple_token_revoke`) | `DELETION_AND_EXPORT_SPEC.md` 2.6.3 [V] |
| Resend | email delivery (sign-in codes, receipts, security and deletion mails) | address, our email text | letter content, child name or any L4 in subject or body | 30 days at the vendor | LEGAL-REQ-053; `data-policy.md:187` |
| Cloudflare R2 and Hugging Face | packs, config, speech models | IP, user agent, the file requested | any account id | provider window [U] | DC 4.8; `PACKS_HOSTING.md` |
| Vercel | website | visit logs; waitlist address | app data | 1 hour to 1 day [V/U] | `reliability.md:34` |
| PostHog (not in any 1.0.x build) | opt-in analytics | M2 through the catalogue, random id | M3 to M11 | 12 months; `analytics-forget` | `posthog.ts`; `data-policy.md` 4.5 |
| GitHub | code, CI, the age-encrypted nightly dump | the encrypted dump; fixtures | an unencrypted production row; a secret | dump 7 days | FR-PRV-08; counsel PQ-3 |
| AI provider (none in 1.0.x) | optional cloud assistance, v1.1 or later; **FORBIDDEN until X2** (a security read and a counsel read before a child's voice or picture leaves the phone, `00-product-frame.md:91`; this pack also recommends a founder decision before any letter text goes) | nothing today. After X2: minimum content for one task, with the AI-processing consent, identifiers stripped | a child's voice or picture before X2 (and letter text before a founder decision, this pack's recommendation); anything under C10 not met; training; retention | zero retention | LEGAL-REQ-020; DC section 2; C10 |
| Support mailbox (the founder's mail) | support | what the person writes | a request for letter text, a child name, ID, birth date or payment detail | 2 years after last message (proposed) | FR-SUP-09; `data-requests-by-email.md` |

The AI-provider row is a ceiling for a founder decision not yet taken, and is forbidden until X2. Today no letter text, recording, photo or child name goes to any model provider.

## 9. Operating rules for engineers

1. Adding a column, table, bucket, device store, SDK or event: its level, its row in the matrix of section 1 (or confirmation it fits an existing row), its retention and deletion path, and a test. The database part is a CI gate (`classification.test.mjs`); the rest is review.
2. Adding a purpose to a row (for example, analytics on M12): a Conflict line to `privacy`, then the founder; never a code-only change.
3. A bug report is solved from the request id, SQLSTATE and the Asha fixtures. If a fix needs a real row, the founder reads it under C6 and the PR says only that he did.
4. Never test with real family data; the canary strings are Asha's.
5. Never weaken a consent gate or a deletion guarantee to ship faster. A change to either is a fenced PR with `cco_review` (CR-27).

## 10. Findings (gaps and risks, with file and line)

1. Policy text and code disagree about holds: `data-policy.md:223` says staff read held data only with a logged `support_access` event; no code writes that action (`05` finding 1) [V].
2. Production deletion is not running: only migration files 1 and 2 are applied and the worker is not deployed (`APPLY.md:48`; chapter 08 DSR-R06) [V]. Any parent-facing deletion promise is ahead of the system until D-041.
3. Backups under Free are a 7-day encrypted dump in a private repo, not Supabase backups; `data-policy.md:212` still describes Pro daily backups [V `reliability.md:43`, FR-PRV-08]. The 38-day promise holds only while the dump stays 7 days.
4. No reader for `audit_events` (`05` finding 3): an access request that includes it needs a definer function (PQ-5).
5. The preservation script (LEGAL-REQ-057) and the support summary function (FR-BKO-02) are not built; the first legal request or support lookup would be improvised.
6. Letter-level "withdraw consent" has no decided effect on server rows already held (PQ-1) [V].
7. Unconfirmed sign-up rows have no purge (FR-PRV-05, not built); an address kept without a purpose [V row text].
8. Nothing proves the 31, 38 and 45 day clocks end to end; the monitoring query is not built (DSR-R13) [V chapter 08].
9. The permanent purged-id guard (`SCPRG`) is not in the database: a stale phone's outbox could re-insert a letter purged more than 60 days ago [E basis: `purge_ledger` is deleted at 60 days, `20261108020000:217`; `ops-ledger` bucket 60 days; no migration holds `SCPRG`]. Highest-priority data-architect item in this file.

## 11. Conflicts (written, not silently resolved)

| Id | Where | Conflict | Sent to |
|---|---|---|---|
| C06-1 | `data-policy.md:212` vs `reliability.md:43` and FR-PRV-08 | Policy: Pro daily backups, 7 days. Production: Free plan, no Supabase backups, nightly dump 7 days | `legal`, `ops` |
| C06-2 | `data-policy.md:223` vs code | `support_access` audit event is not written (finding 1) | `legal`, `data-architect` |
| C06-3 | D-021 (12 months for key-unwrap logs) vs DC 4.3.1 (24 months) | open as COUNSEL_PACKET Q51; Rec 12 months, section 14.1 | counsel |
| C06-4 | `subprocessors.md` vs FR-PRV-08 | GitHub holds an encrypted dump; not named (PQ-3) | `legal` |
| C06-5 | chapter 08 DSR-R09 says `SCPRG` is `pending PR #32`; no file in `supabase/` mentions it | the purged-id guard is not in the repo; finding 9 | `data-architect`, `compliance-engineer` |
| C06-6 | `DELETION_AND_EXPORT_SPEC.md` 2.6.3 (steps `powersync_verify` and `appstore_mapping` retired) vs `log.ts:67-73` and chapter 08 open question 6 | `STEP_NAMES` still lists `revenuecat` and `powersync_verify`; the `deletion_request_steps.step` check still lists `revenuecat` | `data-architect` |

## 12. Questions for the council (default in brackets)

| Id | To | Question | Default |
|---|---|---|---|
| Q1 | counsel | May a parent's own audit and deletion rows be part of an access answer (PQ-5)? | Yes, in `account.json` |
| Q2 | counsel, founder | What happens to server rows when sensitive-data consent is withdrawn (PQ-1)? | Writes stop at once; nothing is deleted by withdrawal alone; the person can delete |
| Q3 | counsel | Does an encrypted nightly dump at GitHub make GitHub a processor (PQ-3)? | Name it in the providers page anyway |
| Q4 | founder | Pro plan (7-day backup, 7-day logs) before the first store build? | No change until the founder decides; decide with Q1 of `05` |
| Q5 | CMO, counsel | May app users ever get marketing email? | No. Transactional only; waitlist list kept apart |
| Q6 | CLO | Who writes the legal-request intake wording and the appeal path (no repo text says how an appeal is handled)? | `legal`; engineering supplies the facts in section 7 |
| Q7 | CDO | Which period for inactive accounts (OQ-11)? | None in v1 (a keepsake is opened years later) |
| Q8 | CPrivO | Is a count of "families with a language" at k = 10 acceptable as L2 (DC open issue 2)? | Yes, as built; counsel confirms |

## 13. How I checked this file

Cites sampled: 24 (read this session). Held: 22. Two did not hold as written in their source: the 7-day Pro backup sentence against production (C06-1) and the `SCPRG` guard that chapter 08 names (C06-5). Sampled: `20261108020000:128-218`; `20261004200000:363-400`; `20261016001000:133-148`; `supabase/migrations/20261023060000_explicit_grants.sql:49-56`; `posthog.ts:163-171`; `log.ts:67-73, 141-198`; `runbook.ts:1-29`; `APPLY.md:48`; `privacy-policy.md:72, 82-84`; `data-policy.md:147-160, 175-232`; `DELETION_AND_EXPORT_SPEC.md` DATA-REQ-035, -050 to -056, 2.6.3; `ENGINEERING_REQUIREMENTS.md:168-173, 479-483`; `docs/ops/runbooks/data-requests-by-email.md` section 0; `subprocessors.md`; DC 1, 2, 4.1 to 4.9; chapter 08 rules and matrix; chapter 10 OBS rules; FR-BKO-02, -04, -05, -16, FR-PRV-03, -05, -08, -12, -26, -31, FR-DAT-01, -05, -28, FR-REL-26 text rows. Not verified: any live vendor console; Deno and database test runs; the `preflight-production` check for FR-PRV-31; whether the underage runbook says what I summarised beyond its existence.

## 14. Council amendments (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013) ids; council returns by CPrivO/CCO/CLO, CDO/CISO, and CMO/CFO/CBO/CAIO (not yet on `develop`; cited by their item id). Gates: G13 = before the Build 13 cut; GF = before the first outside family signs in; G10 = before 1.0. Gate letters marked [E] are my proposal; the decisions record names only those it names. Nothing here is a date, a legal reading, or a parent-facing word.

### 14.1 B7: retention, holds, processors (COUNSEL)

- Q51 (B7a): Rec build the key-unwrap log (`escrow_unwraps`) at 12 months to match D-021 before any apply, so the build never contradicts a decision silently. Counsel (CQ2) says if a longer clock is needed; the founder then amends D-021. Lengthening later is one-way, shortening now is cheap (nothing runs live: `APPLY.md:48` [V]).
- Every period in section 4 stays "as built, not approved". No period appears in the privacy policy, the store listing or the app until counsel and the founder answer. Gate for publishing any period: G10 [E]; for the Q51 change in code: before the apply (A2), so GF.
- Unconfirmed sign-up rows have no purge job (FR-PRV-05, not built; finding 7) [V].
- The 14 counsel questions are in appendix A with their exact wording.

### 14.2 B2: cloud AI for a child's voice, picture or letter text

Forbidden until X2 (security read and counsel read, `00-product-frame.md` line 91) and, for letter text, a founder decision (B2, AGREED). CAIO conditions, all three before X2 can close, none a gate for 1.0 because nothing leaves the phone today:
1. Consent design written by the Chief Privacy Officer seat, shown before any send (PRIV-R21 lines Shown, Records, Never, Decline).
2. A named processor with a no-training term in writing (counsel reads it; CQ14 is pre-staged).
3. A test that no outbound host outside the allow-list is reachable in the production profile. Rec: a preflight check beside `preflight-production`; G13 [E], because it also proves "nothing leaves the phone" for the first store build.

### 14.3 A3: the consent gate (RULED)

`app.consent_fields_required` (`20261108000000_consent_record_fields.sql:33, 77`) [V] stays the founder's setting. "Zero null `app_build` sheet acts for 14 days" is trivially true with one family testing, so the gate is all of: (a) at least N consent acts, N set by `data-architect` and written here before the setting is touched (no number is invented in this file); (b) acts from more than one device and from at least the minimum build, or the update line, that writes `rendered_sha256` and `locale`; (c) zero nulls for 14 days over (a) and (b). Then the founder turns the setting on and records the date. Gate GF [E].

### 14.4 E5: public claims gaps (COUNSEL; the founder merges)

Owners `legal` and `privacy`. Rule: nothing about server backups goes public until A1 (Supabase Pro) closes. A claims registry (D-123, LEGAL-REQ-044) is a founder call. Gates are [E].

| # | Gap | What the code says | Owner | Gate |
|---|---|---|---|---|
| 1 | "No analytics": absolute wording turns false the day A4 is reversed | `packages/analytics`, the consent sheet, `analytics-forget` and the `posthog` deletion step ship dormant behind a flag; say "in this version"; policy, label and site change in the same release as any switch-on | `legal`, `privacy` | G13 |
| 2 | Backups: "and in your iPhone's own backup" is true and also means data sits in iCloud (B4); any server-backup sentence is unproven on Free | hold every server-backup sentence until A1 | `legal`, `privacy` | GF; nothing public before A1 |
| 3 | Deletion time: store notes say 30 days; chain is 31 live, 38 backups, 45 processors, Resend about day 60, and up to 24 hours of deletions can return after a restore on Free | counsel decides where the longer windows and the 24 hours are said (CQ12) | `legal` | G13 for the store line; GF for the policy |
| 4 | No public page says how to delete app data; no deletion route in `apps/web`; check the live listing does not carry the build 2 "Delete account" text | in-app deletion exists only with accounts | `legal`, `privacy` | GF |
| 5 | Site says "never used to train AI"; names AI, "never" is a practice not code | Rec "Never used to train machine learning models"; founder and counsel (CQ14 context) | `legal` | G13 |
| 6 | "Exactly as you said it" live on site and welcome email, held from the store (D-125 item 9) | site follows the store hold; founder merges to `main` | `legal` | G13 |

Also: "kept on the phone that made them" is true only without device backup. PROPOSED, counsel reads first (CQ11): add "and your iPhone backup if you use one".

### 14.5 `data-policy.md:212` Free-plan conflict (C06-1, restated)

`data-policy.md:212` reads "7 days (Pro daily backups)" [V]; production is on Free with a 7-day encrypted nightly dump and no Supabase backups (`reliability.md:43`; FR-PRV-08). The sentence is false until A1 closes and must not be published; `docs/legal/**` is the founder's, so I do not edit it. If Pro or PITR is bought, its window (7, 14 or 28 days) replaces 7 in every promise before the policy is updated (the row's own rule). `data-policy.md:224` (`support_access`) stays unpublished until a writer exists (C06-2). Owner `legal`; gate GF.

### 14.6 Live system versus what we say (CLO G1)

- `safety_events` is created in file 1 (`20260930000000_scribe_core.sql:178`) [V] and dropped only in `20261002020000_data_governance.sql:277` [V]. `APPLY.md:48` says only files 1 and 2 are applied on `early-letters` [V], so the hosted project can still hold the table that CLAUDE.md says must not exist (safety tiers stay on the phone). I cannot see the live project: this needs a live query (does `public.safety_events` exist, row count) by the founder with `data-architect`, recorded with a date. Until then the claim "the safety tier has no server table" is true of the repo only. If it exists and holds rows, drop after a dump (CDO A2 snapshot rule). Gate GF.
- Same limit for retention jobs, audit guards and deletion: none runs in production until the apply (finding 2).
- After the apply: run the access matrix and grants tests against the live project and record the date.

### 14.7 Gates per item

| Item | G13 | GF | G10 |
|---|---|---|---|
| B8 allowlist and own-rows export (05 3.2a) | | build | |
| B7 Q51 in code at 12 | | before apply | |
| B7 any period published | | | counsel and founder answered |
| B2 no-unlisted-host preflight test | build | | |
| B2 cloud AI itself | forbidden until X2 | forbidden | forbidden |
| A3 consent floor | | rule in place before the setting is turned on | |
| E5 gaps 1, 3 (store line), 5, 6 | fix or hold | | |
| E5 gaps 2, 3 (policy), 4 | | fix or hold | |
| `data-policy.md:212` | | not published; correct after A1 | |
| `safety_events` live check | | query recorded | |

### Appendix A. The 14 counsel questions (exact wording, CPrivO/CCO/CLO return section 9)

Counsel must confirm every reading; we are Claude roles, not lawyers. CCO could not read the FTC page in the session ([U]).

CQ1 Entity and 5.1.1(ix). "Apple guideline 5.1.1(ix) says apps that 'require sensitive user information should be submitted by a legal entity'. We are an individual publisher, our label declares Sensitive Info (the due date) and letters may hold health details. Does the app fall under 5.1.1(ix), and should the founder form an entity before submission or by D-004's 27 Nov date?" (packet Q1)
CQ2 Q51. "For a log of every opening of a family's recovery key, is 12 months or 24 months the right retention period, and does a dispute or access request need the longer one?"
CQ3 PQ-3. "Is GitHub a processor for an age-encrypted nightly dump it cannot decrypt, and what must we say in the subprocessor list and the policy?"
CQ4 PQ-5. "Does an access or portability request reach our audit and deletion rows about the requester, and is answering through the Save a copy export enough?"
CQ5 PQ-1. "When a person withdraws sensitive-data consent, what must happen to letters and child data already on our servers (delete, hold, or keep until they delete)?"
CQ6 Q57(e). "Is a sign-up country check that fails open on lookup error acceptable given the blocked-country list and the Terms confirmation, or must it fail closed?"
CQ7 Notices. "(a) Does Apple guideline 4.5.4 apply to local notifications as well as push? (b) Are our security alerts and the single deletion-completion email 'transactional' for CAN-SPAM, so no unsubscribe is needed? (c) May the completion email go after the account is deleted?" (CCO could not read the FTC page this session: [U].)
CQ8 Label. "Does a salted, per-account, app-made device hash stored for new-device alerts make us declare 'Device ID' (linked) in the App Privacy answers? And does Apple's 'collect' cover a copy of app data in a person's own iPhone backup?" (packet Q7)
CQ9 Legal holds and requests. "What must we do on a hold's release, what may we say about staff reading held data, and what is the minimum process for a subpoena or custody-dispute request for letters before a preservation tool exists?" (packet Q27)
CQ10 Notice at collection. "Do the two sentences at sign-up (NS-42-R18) satisfy notice duties together with the policy and the Consumer Health Data notice under Washington and Connecticut law, and may the consumer health notice be linked from them?" (packet Q2, Q3, Q20)
CQ11 Q17 and the device backup. "May we say recordings 'stay on this phone' when a person's own iPhone backup can hold a copy, and what is the least misleading wording?"
CQ12 Free-plan restore. "Where should we state that up to 24 hours of deletions can return after a restore from the nightly dump (privacy policy, or only the incident notice), and does that affect the 31 and 38 day deletion promises?" (PQ-10)
CQ13 Inactive accounts. "Is keeping an inactive account and its letters indefinitely, with no automatic deletion, acceptable if the policy says so, or must a period be set?" (OQ-11, Q26)
CQ14 Pre-staged only if the founder ever opens cloud AI: "Is sending letter text to a zero-retention processor 'sharing' of consumer health data under the state laws in the register, and what consent does it need besides Apple 5.1.2(i)?"

Amendment cites re-read on `origin/develop`: `data-policy.md:212, 224` (re-read on develop after #854 moved them one line); `20261108000000:33, 77`; `scribe_core.sql:178`; `data_governance.sql:277`; `APPLY.md:48`: 6 of 6 held. Not verified: any live project state (safety_events, plan, applied files), FTC and Supabase pages, counsel readings, and the council returns themselves (not on `develop`).
