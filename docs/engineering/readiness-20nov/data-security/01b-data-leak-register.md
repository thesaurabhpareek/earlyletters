# 01b Where personal information, a child's name, a transcript or audio could leak

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Pack: document 01, part b. Evidence: develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`), files and lines as cited; tags [V] [E] [U] as in 01a. This is a register of surfaces, not a threat model (that is `security-architect`'s 04). Status words: CONTROLLED (a control exists and a test or a typed limit proves it), BY DESIGN (the exposure is the feature and its rule is stated), GAP (no control found, or the control is not proven), UNKNOWN (not read).

The constitution (CLAUDE.md): no entry text, transcript, audio or child name in analytics, logs or crash reports; safety tiers stay on the device; `raw_transcript` immutable; real family details never in code, tests or fixtures.

## 1. Logs

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| L-1 | Edge Function and ops script logs | `supabase/functions/_shared/log/log.ts:1-20`, sink `:246` | letter text, names, emails, tokens, ids | CONTROLLED | one typed logger: closed event names, error codes, counts, durations, random `req_id`; no id field; exceptions reduced to code, sqlstate, status. `canary.test.ts` pushes the fictional family "Asha" through every path and fails on any direct `console.*` in a function. The only `console.log` is the sink itself [V grep] |
| L-2 | Escrow function logs | `supabase/functions/escrow/log.ts:1-8`, `handler.ts:61` | key material, ids, email | CONTROLLED | its own copy of the same rules, kept in one folder on purpose; no id, email, token, key, path field |
| L-3 | Phone console | `apps/mobile/src/lib/resilience/global-errors.ts:49` (`console.warn(line)`), header `:6-8` | an error message with a value in it | UNKNOWN | records hold kind, code, id and time only (last 20); production profile only. A line on the device console is readable through a connected Mac or a sysdiagnose, so what goes in it matters [U: the line builder was not read] |
| L-4 | Postgres and API logs (Supabase platform) | hosted setting | statements, bound values | UNKNOWN | `DATA_CLASSIFICATION.md` 4.8 says no `log_statement=all`; not readable from here [U] |
| L-5 | Storage and Auth platform logs | vendor | object names `{child}/{author}/{entry}` (L3), IP addresses, emails | GAP (vendor) | our typed logger does not reach vendor logs. Auth log retention is **Unverified** (`DATA_CLASSIFICATION.md` 4.2, DELETION spec OQ-5) |
| L-6 | Phone logs of sync and backup | `backup/local-db.ts:45`, `sync_outbox.payload` | letter text in `payload` | CONTROLLED by rule | `last_error` is "a code, never content"; the outbox `payload` is L4 and "never logged" (`migrations.ts:199-200`) [V comment; no test read] |

## 2. Errors

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| E-1 | SQL `raise exception` with a value | `20261002020000:610`, `20261023030000:114-119`, `20261023040000:139` | a name or a count | CONTROLLED | the six interpolating sites print a document key, a constraint name or a count, never content [V grep of `raise ... %`] |
| E-2 | Invite redeem re-raises the inner message and detail | `20261028010000:148-152` | detail of an unexpected inner error (for example a unique-violation key) | CONTROLLED by caller | the Edge Function `invite-redeem` turns it into a code; the logger drops message and detail (`log.ts:14-15`). A direct RPC call by the person returns the text to that person only [U: handler not read in full] |
| E-3 | PostgREST error bodies | platform | constraint and key values | BY DESIGN | the caller sees errors on their own rows; RLS applies before constraint checks for other people's rows [E: Postgres semantics, not tested here] |
| E-4 | Stored error fields | `deletion_request_steps.last_error_code`, `storage_purge_queue.last_error_code`, `deletion_requests.receipt` (`20261002020000:399`) | text from a vendor | CONTROLLED by size and by comment | codes and counts; `receipt` limited to 2048 bytes, no key list (Gap G-13) |
| E-5 | Phone migration failure | `migrations.ts:433-436` message `local_db_migration_failed:<n>` | SQLite messages can quote values | CONTROLLED | code and number only (`migrations.ts`, TDD 01 4.2 rule 2) |

## 3. Analytics, crash reports and the insights job

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| A-1 | PostHog events | `packages/analytics/src/catalog.ts:15`, `validate.ts:174` (`before_send`), `posthog.ts:172` (`persistence: 'memory'`), `:173-174` replay off | child name, dates, text, ids | CONTROLLED, and off in v1.0 | typed catalogue (SCHEMA_VERSION 8), allowlist, children only as `child_ordinal`; `EXPO_PUBLIC_ANALYTICS` off means no key and no SDK load (`lib/capabilities.ts:65`, `analytics/index.ts:41`). Only after a yes |
| A-2 | Language in analytics | `DATA_CLASSIFICATION.md` 4.7 | a language is L4 | BY DESIGN, counsel pending | one `lang` code on two events (reduction); counsel to confirm (open issue 2) |
| A-3 | Crash reports | none | n/a | CONTROLLED | no crash SDK in v1.0 (`analytics/index.ts:20` "Sentry, when added"); the fault store keeps kind, code, id, time |
| A-4 | Analytics ids at deletion | `supabase/functions/analytics-forget/handler.ts:1-12` | link of analytics id to person | CONTROLLED | ids used for one call and dropped, never written to Postgres or logs; only `ops.forget_quota` counts calls |
| A-5 | Insights job output | `scripts/insights/run.ts:22` (`assertContentFree`) | an id or email in a published note | CONTROLLED | refuses a file with anything shaped like an email, URL, UUID or token; aggregates are k = 10 (`insights.k_min`) |
| A-6 | Aggregates readable by role | `insights.*` | small groups | CONTROLLED | `service_role` and `insights_reader` only; tested in `insights_aggregates.test.mjs` |

## 4. Exports

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| X-1 | In-app export (the person's own copy) | `apps/mobile/src/lib/export/schema.ts:90` (schema 1.6.0) | the person's own L4 in plaintext | BY DESIGN | the screen says so (DATA-REQ-056); a book export holds others' letters only as the book shows them, never raw transcripts (DATA-REQ-050) |
| X-2 | Recovery export | `resilience/recovery-export.ts:30-43`, filter `recovery-export.logic.ts:33-42` | the person's own recordings and `scribe.db` (L4, plaintext) | BY DESIGN | the folder is listed whole but only `scribe.db`, `-wal`, `-shm`, `-journal` and audio files enter the ZIP; `backup-<id>.db` does not |
| X-3 | Server-built exports | none | n/a | n/a | the `exports` bucket is not created; v1.0 exports are made on the phone |
| X-4 | Ops incident and deletion scripts | `ops_incident_scope`, `ops_deletion_consent_records` | consent rows for a request | CONTROLLED | return counts, or consent rows with `profile_id` and `subject_hash` stripped (`20261108010000:96-112`) |
| X-5 | Test and design fixtures | `packages/content/test/no-real-family-data.test.ts` | real family details | CONTROLLED | stores hashes only; fixtures use "Asha" |

## 5. Backups and copies

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| B-1 | iPhone device backup | no exclusion on `scribe.db`, recordings, photos (`ScribeAudioModule.swift:94` excludes only listening copies; `packs/app-support.ts:39`, `model-files.ts:41` packs and models) | all L4 on the phone, in the person's own iCloud or computer backup | BY DESIGN | ADR 0028 D1 and NX-39 F9 choose it; Apple is the processor; the Settings words must say it (`content`) |
| B-2 | `backup-<id>.db` in that backup | `backup/local-db.ts:60-85` | upload token, wrapped file key | GAP | G-11: not excluded from the iPhone backup, no delete on Erase; flag off. RULED (B5): exclude, delete on Erase and sign-out, token to Keychain, preflight gate (01a 8.5) |
| B-3 | iCloud Keychain | `backup/keys.ts:4-6` | book keys travel to the person's other Apple devices | BY DESIGN | synchronizable item; the server never sees the key; the wrap is escrowed separately |
| B-4 | Supabase database backups | hosted | every table, including deleted rows until the backup ages out | BY DESIGN, partly unverified | off backups within 7 more days (`DATA_CLASSIFICATION.md` 2 Deletion); encryption at rest **Unverified** (LEGAL-REQ-022(c)); the daily `ops-ledger` copy lets a restore replay deletions (`purge_ledger`) |
| B-5 | `ops-ledger` bucket | `purge-worker/daily.ts:6`, `20261023000000:1611` | ids of purged records; the unwrap log copy holds person, device and book ids | CONTROLLED, with an exception | service role only, 60 days, outside database backups. The escrow copy is made before pseudonymising, so ids remain up to 60 days after an account is deleted (Gap G-16) |
| B-6 | Recording backup on the server | `entry-audio` | audio | CONTROLLED | client-side AES-256-GCM before upload (ADR 0006); the server holds ciphertext; keys open only on the phone or inside `escrow` (`escrow_wrap` not selectable by the phone, `grants.mjs:14`) |

## 6. Push, local notifications and in-app notices

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| P-1 | Remote push (APNs) | `apps/mobile/app.config.ts:96-114` | a child's name in a payload | CONTROLLED (none exists) | the build strips `aps-environment`; nothing asks for a push token; `apps/mobile/test/config.test.ts` pins it [V config; test not run]. If remote push is ever decided (the founder's call) the payload rule is: no L4, no L3, a content key and an opaque id only (`DATA_CLASSIFICATION.md` 2 Logging; D-025) |
| P-2 | Local notifications naming the child | `reminders/planner.ts:248-275`, switch `prefs.ts:41` (default false), `:117-120` (off while App lock is on) | child name on a lock screen | CONTROLLED, by choice | default off; the neutral wording is used when off; names only when the person turns it on. Open issue 4 in `DATA_CLASSIFICATION.md` |
| P-3 | Days and culture notices (designed): the lock screen | `docs/product/prd/21-days-cultural-photos-home.md` NS-46, NS-47; `13-days-culture-home.md` 4.6; ADR 0033 | a faith or culture day name, or a day name beside the child's name, on a lock screen | DESIGNED, not built [V grep: no category, no `libraryDay` in app code] | `notifications.dayNames` off by default and forced off with App lock (store PS-3 in 01a 3.1); one neutral title and one neutral body per tone, naming no day, tradition, country or child; a name only for a `publicTitleOk` day or behind the switch; no title or body in any switch state holds both a day name and a child name. Card rows: NS-47-R12, R13, R14, R37; NS-46-R36, R37. E82 adds: with names off or App lock on, no digit or age in the string (control is in `05` 3.2b, #1046) |
| P-4 | Notification budget | CR-69 A1 | n/a | n/a | 60 pending in total; owned by 07 |

### 6.1 The J-CUL-01 walk, one row per surface (added 20 Nov 2026)

The device walk J-CUL-01 (`docs/product/prd/14-test-plan.md` J-N37; card `21` section 5 and its release gate) decides what iOS does on each surface below. Until it runs, the status of every "shows a hidden body" question is UNKNOWN, as the card says (UNVERIFIED), and the flag stays off. Control column: what the design relies on, then the card row that holds it. Rows are by id; nothing is copied from the cards.

| Id | Surface | Where | What could leak | Status | Control and card row that holds it |
|---|---|---|---|---|---|
| P-5 | Notification Center and Notification Summary | iOS, after delivery | a day title or body that a hidden preview should have hidden | UNKNOWN until J-CUL-01 | the app cannot set what iOS shows here; every note carries a category with one neutral `previewPlaceholder`, none sets `hiddenPreviewsShowTitle`, a test reads the options. NS-47-R36; ADR 0033 item 1 |
| P-6 | Apple Watch mirror and CarPlay | paired device | the same text on a second screen the person may not think of | UNKNOWN until J-CUL-01 | same as P-5; the walk records what appears. NS-47-R36 |
| P-7 | Focus summary | iOS | the same text in a summary | UNKNOWN until J-CUL-01 | same as P-5. NS-47-R36 |
| P-8 | Show Previews: Never or When Unlocked | iOS setting | the day name, if the title is not hidden | DESIGNED | the placeholder is the only text shown; the walk records it. NS-47-R36 |
| P-9 | App lock on, and App lock off | `prefs.ts` (the switch that exists) and the days switch | a day name for someone who holds the phone | DESIGNED | on: every title is the neutral title, the switch is shown disabled with its reason, the stored value is set to off and cannot return when App lock turns off. Off with the switch on: the name is readable by anyone who sees the lock screen, said by the switch's help line. NS-47-R12, R13, R14; ADR 0033 item 4. Today the only built switch is `lockScreenNames` (P-2), and it does not cover days (ADR 0033 consequences) |
| P-10 | Notification identifier, payload and route | `scheduler.ts` (the convention today: payload `{source, kind}`, identifier `p.id`; not a test) | a day id, tradition, catalogue key or layer in `identifier`, `data`, `threadIdentifier`, `categoryIdentifier` or a route parameter; the date in `el.day.<isoDate>` equals the day list if a log prints identifiers | DESIGNED; GAP until the allowlist test exists (ADR 0033 context: by convention) | allowlist `{source, kind}`, opaque identifier, a test that a note carrying a day name fails it; the log canary covers identifiers and `userInfo`. NS-46-R32, R4; NS-47-R8; ADR 0033 item 3 |
| P-11 | A library fetch that varies with ticks | the days table refresh (default: bundled, refreshed by an app update) | which days a family ticked, read from request shape | DESIGNED | one file identical for every phone; a test makes the fetch with an empty store and with every day ticked and compares bytes. NS-46-R48; NS-47-R4 (no request carries a day key) |
| P-12 | A Save a copy file, and the recovery export | `lib/export/schema.ts:271` reads phone settings for its consent block (the card's cite, not re-read); `recovery-export.logic.ts:33-42` | the days list, a tradition or a country in a file the person shares | DESIGNED | a test builds a Save a copy with every key set and finds no key, day, tradition or country; one line on the Days page says the list is not in it. NS-47-R10. [V from 01b X-2] the recovery export takes only `scribe.db`, its `-wal`, `-shm`, `-journal` and audio, so `days.v1.json` is not in it; `scribe.db` does hold PS-2 and PS-3 (no tradition in either) |
| P-13 | Logs, crash reports and analytics | `log.ts` (server), phone console, `packages/analytics` | a day id, tradition, country or a notification title or body | DESIGNED; analytics off in v1.0 (A-1) | canary with synthetic keys through ask, tick, move, clear, schedule, deliver and tap: 0 hits; the typed catalogue rejects the stems; day and typed-day notes are never observed (the four never-reported kinds); store errors are logged by code only. NS-47-R8, R9, R34; NS-46-R34; ADR 0032 item 10; E82 (#1046) |
| P-14 | A synced `entries.prompt_key` | server `entries` (02a), `entry_versions`, sync push | the day that a letter was written from, as a prompt key or library version | DESIGNED | a tap on a day note shows an ordinary prompt from the existing catalogue; a test saves a letter from each library day and compares every synced field with a control letter. NS-47-R5 |
| P-15 | A restored phone, a device-to-device transfer, a second account on one phone, an offline phone after Delete account | iPhone backup (B-1), iOS transfer, BL-961 | the days file, or the fact that A had a list, reaching B or a new phone | DESIGNED; the transfer behaviour is UNKNOWN until J-CUL-01 | the days file is excluded from backup and so a restored phone is empty and, because `culture.asked` is in `scribe.db`, does not ask again (Q-FD-13 closed, CL-020); a claimed book re-keys the store and uploads nothing; sign-out clears it first and B reads nothing and is asked afresh; the `[X4-R1]` enumeration covers it; `notifications.dayNames` scope is open (01a C-12) and `days.clearedNote` scope is open (C-13); an offline phone keeps its store until its session ends, and no line claims otherwise. NS-47-R6, R7, R15, R16, R17; FR-PRV-14 |
| P-16 | The app-switcher snapshot | iOS | the Days page, Browse, day detail, ask slip or a day named on Home in the snapshot | DESIGNED | blank snapshot on those screens with or without App lock (E18); Home names a day only when it is today. NS-47-R26 |

## 7. Email

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| M-1 | Deletion emails | `purge-worker/emails.ts:8-9` | child name, letter text | CONTROLLED | values are dates, the request reference (L2) and public links only; contributor notice not sent |
| M-2 | Restore and key-use emails | `escrow/restore.ts:112-117` | request id, a stop link | BY DESIGN | the stop link carries a bearer token (`stopUrl`); the email goes to the account address; no content. Treat the message as sensitive (04 owns) |
| M-3 | Auth emails (sign-in link, new device) | `packages/emails/src/templates/auth/*` | email address, device wording | UNKNOWN | templates exist; which sender sends each (Supabase Auth or a function) was not traced [U]; 07 owns the content rules |
| M-4 | Resend retention | vendor | message data | BY DESIGN | 30 days (`DATA_CLASSIFICATION.md` 4.8) |

## 8. URLs, deep links and ids in transit

| Id | Surface | Where | What could leak | Status | Control and proof |
|---|---|---|---|---|---|
| U-1 | Invite link | `lib/family/invite-link.logic.ts:5-7, 34` | the token | CONTROLLED | `https://<origin>/j#t=<token>`: the token is in the fragment, which a browser never sends; `/j?t=` alone is refused |
| U-2 | Invite preview | `peek_invite` `20261015010000:193` | who invited whom | BY DESIGN | returns the inviter's signature and role only, no child name; token has 244 random bits. A failed call rolls back its own rate-limit count, so wrong guesses are not limited (`20261015010000:151`): the format floor and entropy are the control [V comment] |
| U-3 | Storage object names | `entry-photos`, `entry-audio` | person and book ids | BY DESIGN | ids are not secrets between members; they are L3 and never in logs we write |

## 9. Reading access that is wider than "the author"

| Id | Surface | Where | Reader | Status |
|---|---|---|---|---|
| R-1 | `children.name`, `nickname`, `photo_path` | column grant, `grants.mjs:15-17` | every member, contributors included | BY DESIGN; whether grandparents see the child's name is product's (DATA_CLASSIFICATION open issue 3, D-039 covers dates) |
| R-2 | `profiles.display_name`, `signs_as` | `profiles_self_or_co_guardian` | people who share a book | BY DESIGN |
| R-3 | `book_entries` | `20261015030000` | members, for letters in the book | BY DESIGN; no raw transcript, edits, hash, language, author edits, locked spans, pack ref |
| R-4 | Dashboard and `postgres` role | hosted | anyone with project access | UNKNOWN; `security-architect` 03 owns break-glass and staff access |

## Not checked (rows P-3 and P-5 to P-16, 20 Nov 2026)

- Nothing was run: no test, no device, no simulator. Every status is read from the cards and ADRs on develop `f102aac39b79`; "not built" rests on one `git grep` of `apps`, `packages` and `supabase`.
- What iOS shows on Notification Center, Notification Summary, an Apple Watch mirror, CarPlay and a Focus summary with a hidden preview is not known to me or to the card; the J-CUL-01 walk decides (UNKNOWN).
- Whether iOS carries an excluded file in a device-to-device transfer, and whether the pending notification list sits in a device backup, are not verified.
- `scheduler.ts`, `prefs.ts` and `lib/export/schema.ts:271` were not re-read; the first two are cited from ADR 0033 and the third from the card. The days module, `budget.ts` and the store do not exist to read.
- The levels in 01a 3.1 are the cards' and ADR 0032's; they are PROPOSED until `privacy` rules them, and `docs/legal/DATA_CLASSIFICATION.md` is not edited here (PR #873 owns it).
- Counsel's readings (Q109 to Q122 in #1057, LEGAL-REQ-065 to 068 in #1058, FR-CMP rows in #1056) were not read for this change.

## Gaps found here

G-5 to G-21 are in 01a section 7. New in this file: none. The register adds evidence to G-9 (L-5, U-3), G-11 (B-2), G-13 (E-4) and G-16 (B-5).

## Questions for the council

- Q-b1 (CISO) Exclude `backup-<id>.db` from the iPhone backup and delete it on Erase. Default: yes; `mobile` change, before `EXPO_PUBLIC_BACKUP` goes on.
- Q-b2 (CPO-privacy) Put the vendor-log gap (L-5) in the vendor table of 06 with its retention. Default: yes.
- Q-b3 (CISO, founder) If remote push is ever decided, the first PR is a rule file (payload fields allowed: none of L3 or L4), before any entitlement. Default: no remote push in v1.0; the founder decides later.
- Q-b4 (CCO) Confirm Supabase encryption at rest in writing before launch (LEGAL-REQ-022(c)). Default: ask the vendor; nothing here can verify it.

### Council answers (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013, branch `docs/decisions-closed-20nov`, until it merges) and the CDO and CISO return (`cdo-ciso.md`, working file, cited as "CDO return").

- Q-b1: RULED (B5). Both parts: exclude `backup-<id>.db` from the device backup and delete it on Erase and on sign-out of that account. Add: `upload_token` to the Keychain (this-device-only class) or stop persisting it; a test that fails if the file is created without the exclusion flag; the preflight gate of 01a 8.5 so `EXPO_PUBLIC_BACKUP` cannot go on first (C7). `mobile` builds it. [V] none of this exists today: `setExcludedFromBackup` is called for packs and models only (`packs/app-support.ts:38`, `model-files.ts:43`).
- Q-b2: AGREE (CDO return). Vendor-log gap L-5 goes in the vendor table of 06.
- Q-b3: AGREED (B1). "Not in 1.0", not "never"; never for security alerts. If it is ever decided, the first PR is a rule file allowing no L3 or L4 field in a payload, before any entitlement, key or table. [V] P-1 holds: the entitlement is stripped and nothing asks for a token.
- Q-b4: AGREE (CDO return). Ask Supabase in writing for encryption at rest; [U] until the founder has the reply.
- B-4 and B-5 (hosted backups, `ops-ledger`): the purged-id guard (G-23, 01a 8.2) is a new copy of a deleted letter's id in hashed form only; it is not a list and is never joined to a person or book (C5).
- A1 (Supabase Pro) is the founder's. `docs/legal/data-policy.md` lines 185 and 212 say Pro daily backups while production is on Free [V per the record]; nothing public about server backups until A1 closes.
