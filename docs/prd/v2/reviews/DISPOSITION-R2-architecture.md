# Disposition of critique round 2: architecture and privacy lane

Date: Thu 15 Oct 2026. Branch `docs/prd-v2`. Lane: principal architect. Files edited in this lane: `03-goals-and-principles.md` (promise wording only), `06-nfr.md`, `features/F02-account.md`, `F04-capture.md` (held drafts and durability only), `F06-faithful-edit.md` (promise question only), `F08-recordings.md`, `F11-co-parent.md`, `F14-plus.md` (held-draft rows and free backup only), `F15-export.md`, `F16-sync.md`, `F17-settings-privacy.md`, `F19-content-config.md`. Code claims were checked on `origin/develop` at ed16ca3. No requirement ID was renumbered; new requirements took the next free number in each file.

## Defaults used (the founder has not answered; each is marked in the specs as a default awaiting confirmation)

1. **Recording backup is free for everyone** (F08 Q2, T07 passed without an answer). Written into F08 4, 6.5 F, "Plus or free", Q2; F14 4 and F14-REQ-022.
2. **A voice-only letter saved before its model arrives counts toward the free letters only once its words exist and the author keeps it from Review.** Written into F16 6.2 I (`waiting_letter`) and F14-REQ-039; it matches F14-REQ-037 and F04-REQ-044 as already written.

## Code facts checked for this round

- `purge_due()` and `prepare_account_purge()` enqueue `entry-photos` prefixes only; `mirrorPrefixes` copies only `{child}/` and `{child}/{author}/` prefixes into other buckets; a single-object queue row is removed only in its own bucket (`purge-worker/storage.ts` `drainRows`, `purge-worker/lib/buckets.ts`). `entry-audio` is `since: 'v1.1'`.
- `purge_ledger.entity_type` allows `entry`, `child`, `profile`, `storage_object` only (`20261002020000_data_governance.sql` line 818). `purge-worker/daily.ts` copies the ledger to the `ops-ledger` bucket because that bucket is outside database backups.
- A letter keeps its draft id as its entry id (`review.tsx` passes `id: draft.id`; `letters.ts` `voiceOnlyEntry` uses `draft.id`; `store.ts` `saveLetterFromDraft` counts `draftId` in the ledger).
- `recorder.ts` header: expo-file-system has no fsync; AVAudioRecorder closing the file hands it to the OS. No fsync exists in `apps/mobile/modules/` (`scribe-audio`, `scribe-files`, `scribe-store`); there is no `scribe-audio-decode` module, which F04 11.1 named until today.
- `apps/mobile/eas.json`: `testflight` uses EAS environment `preview` and channel `preview`; every profile sets `EXPO_PUBLIC_SERVER_FEATURES=off`.
- `20261004100000_sync_engine.sql`: `sync_op_receipts_own_insert` policy for `authenticated` (line 170); `sync_push` is security invoker (line 477). No migration sets a timeout, uses an Auth hook or touches `auth.sessions`.

## R8 findings

| ID | P | Disposition | Where | Notes |
|---|---|---|---|---|
| R2A-01 | P0 | Fixed | F08 6.5 C (steps 6, 7, "What we can prove"), 6.5 server objects, 6.7 `backup.sheetBody`, F08-REQ-014, new F08-REQ-042; F17 6.2 B, F17-REQ-027, 8.3; 03 promise item 3 and PS4; 06 sections 7 and 12 | The claim is now scoped to what the system proves: "We use it only through our recovery service, which logs every use and emails you each time." `escrow_unwraps` is append-only by trigger (two checked exceptions: pseudonymise at deletion, 24-month retention), copied daily to `ops-ledger/escrow/`, and every BK opened emails the account, including rotation and `legal` unless an order forbids it. The honest limit (offline use of the key with a database copy) is stated for the Privacy Policy. F17-REQ-027 now allows only this scoped line. Cloud KMS left for a later ADR |
| R2A-02 | P0 | Fixed | F08 6.5 key table, 6.5 G1 to G5 (one custody story), F08-REQ-034, F08 8, 11.1, WP-F08-B4, WP-F08-B8, Q9, A6, A7; 06 section 12 and 15; F17 8.2 item 6 (b); F19 kill-switch row | One custody story: generated with networking off, two numbered tamper-evident paper copies in two places, no password manager. The key runs only in a separate Supabase project `scribe-escrow` with one function and three secrets; `escrow_svc` in the main project can execute four definer functions and read no table. Enforcement: a Management API release check over both projects (no `ESCROW_` secret or `escrow` function in the main project; nothing else in `scribe-escrow`; every deployed function matches the repo), a grant test, vendored imports with no remote specifier, deploys from CI with the founder's approval. Cost about $25 a month added to 06 section 15 |
| R2A-03 | P1 | Fixed | F08 6.5 server objects (`object_path`), 6.5 D4, F08-REQ-024, U34, WP-F08-B3p; F16-REQ-024; F17 6.2 L row 2, 8.4 | Erase and the 30-day purge look up `audio_blobs` by entry id and purge the exact `object_path` with ledger rows, in an S02 migration to `purge_due` and the erase op. Acceptance is the R8 test (tombstone, advance 30 days, zero objects and rows) |
| R2A-04 | P1 | Fixed | F08 6.5 key table, 6.5 A5, D5, D6, E, `backup_discard`, F08-REQ-032, new F08-REQ-043, U33; F04 section 8 row and F04-REQ-009 | A letter keeps its draft id (built). `backup_begin` requires an `entries` or `held_drafts` row, so a draft that never reached the server never uploads. Let it go sends `held.discard`; a weekly sweep catches crash orphans after 30 days |
| R2A-05 | P1 | Fixed | New F16 6.2 I, F16-REQ-028 (contract), new F16-REQ-029, U30 to U32, section 8, WP-F16-17; F04 section 8; F14-REQ-039, section 8, WP-F14-22; F15 `waiting/` row; F17 8.4 | `held_drafts` defined once: kinds, columns, author-only RLS, consent gate, immutable raw transcript, words group compare and set, ops, pull section, delete on keep, purge, export, data map. F06 section 8 still says review state on a draft never leaves the phone: outside this lane's F06 scope, handed off below |
| R2A-06 | P1 | Fixed | F02-REQ-017 Rev, new F02-REQ-025, F02 6.2 step 4, U33, section 8 row, WP-F02-13; 06 sections 3 and 12 | The server records each Auth session at its first token (custom access token hook, or a trigger on `auth.sessions` if allowed; [A] for WP-F02-13) and queues the email; data RPCs refuse a session with no row (`SCSES`, new), so a modified client cannot skip it. `backup_devices` is for escrow only |
| R2A-07 | P1 | Fixed | F08 6.5 C2, C3, U27, U27c, F08-REQ-029, Q7; F11-REQ-029 | With an enrolled device the hold is 72 h unless it approves; with none, 24 h. Enrolled devices get an in-app sheet and a time-sensitive push. Residual risk (inbox taken and only phone lost) named in U27c and the ADR row |
| R2A-08 | P1 | Fixed | F08 6.5 C4, 6.1, 6.7, U27b, F08-REQ-042; F02-REQ-017, U33b; 06 section 12 | Both emails link to `earlyletters.com/stop`, which acts only when a button posts a single-use token. Acceptance: a scanner that loads the page and runs scripts causes zero cancellations and zero sign-outs |
| R2A-09 | P1 | Fixed | F08 6.5 server objects (`restore_requests`), 6.5 B3, C1 to C5; new F11-REQ-029 and the push ADR row | Step-up is checked at request only; release needs no new sign-in because the BK is sealed to the requesting device. New push kind `restore_request` |
| R2A-10 | P1 | Partly fixed here; rest handed off | F08-REQ-039 and WP-F08-B3 now own the `backup` row in `policy_documents`; WP-F08-B8 asks for a T milestone | F08's names stay canonical (B5b restore, B5c settings row). 08 must adopt them, move B5d into wave 2 or T25 a week, and add the escrow ceremony milestone before T23 |
| R2A-11 | P1 | Fixed | F16 6.2 A step 4, 6.2 C, section 3, F16-REQ-017, WP-F16-06, A3, section 9 load row; 06 section 4 row 1, section 16 load row, Q9 | Pull every 15 s while a shared book is open (30 s otherwise), push debounce 2 s, clock from save tap on A to row rendered on B. The parts at their own p95 add to about 17.7 s, so p95 30 s can pass. `sync_pull` load doubles to 5 per s at 1k; tests at 14 per s |
| R2A-12 | P1 | Fixed in 06; 07 and 08 to cite | 06 section 6 G4 row, Q8 | Sessions count on RC-equivalent builds (same native fingerprint, JS diff only in copy) from the freeze build at T29, plus device scripts: about 720 sessions by T34 at R8's own rate, about 500 with half-rate holidays. A native change restarts the count; under 300 at T34, the founder decides |
| R2A-13 | P1 | Fixed in 06; 07, 08, 09 to cite | 06 section 12 last row, Q11 | One position: scoped external test on staging Mon 23 Nov to Fri 4 Dec (between T23 and T27), two fenced fix slots in wave 3, backup not on for C1 while a high escrow or deletion finding is open, report is a G4 input; full test before C2, paid marketing or 1,000 families. Default awaiting the founder's approval of the cost at T15 |
| R2A-14 | P1 | Fixed in 06 and F16; 07 to cite | 06 sections 3 and 16, Q10; F16 section 9 gate line | One position (default awaiting 08 Q8 at T15): G4 is a 1-hour 1x run with the 20-family backup burst, the escrow limit test and the freshness probe; the 2x run with the 4-hour soak gates C2, paid marketing or 1,000 families. The "section 14 loads" pointer now says section 16 |
| R2A-15 | P1 | Fixed | F16 section 9 environment matrix, new F16-REQ-030, WP-F16-19 | `testflight` moves to EAS environment `production` and a new `testflight` channel; staging uses a drill escrow key and an email allowlist; CI checks URLs and key versions per profile and that staging never holds the production key |
| R2A-16 | P1 | Fixed | F16 6.2 F step 2b; F08 6.5 G5; 06 section 7 restore drill row; F17 8.4 new row and named exceptions | The drill runs in staging with synthetic families and a drill key. A production-data drill gets no escrow secret, is deleted within 24 h with audit rows, and is named in 8.4 and the Policy. The separate escrow project means RB-8 never copies the escrow secret |
| R2A-17 | P1 | Fixed | F16 6.2 F step 2a, new F16-REQ-031, WP-F16-18; F17 6.2 L row 1, 8.4; 06 section 7 | Ledger kinds added for held drafts, backup rows, restore requests, push tokens, the status record and sessions seen; RB-8 replays them; the reminder scheduler and push sender check deletion before each send; the drill includes a deleted account with those rows |
| R2A-18 | P1 | Fixed in F17; 08 to keep WP-F17-15 | F17 4, 6.2 F2, U38, F17-REQ-026, WP-F17-15 | Signed-in Erase everything wipes this phone only and is not a ledger reset (matches F14-REQ-026); the signed-out reset stays in v1.0 for DATA-REQ-024. 08 6.4 must not cut WP-F17-15 without a counsel row in 09 |
| R2A-19 | P1 | Fixed | 06 section 2.2 save row; F04 4, 6.2 step 5, U05, 9, 11.1 (the false `scribe-audio-decode` row corrected), new F04-REQ-048, WP-F04-18 | The budget now names what the code does (file closed, size read back, SHA-256). A forced-reboot case (20 takes) is added to DL-01; if it loses a file, `F_FULLFSYNC` lands in `scribe-audio` and the 06 wording gains fsync back |
| R2A-20 | P2 | Handed off | F14-REQ-043 and the status report ADR | Outside this lane's F14 scope (held-draft rows and free backup only). The fix (native hash with a per-profile server-issued salt; "pseudonymous" in the Policy) goes to the F14 owner |
| R2A-21 | P2 | Fixed | 06 section 12 purchase allowlist row | `environment` added to the allowlist |
| R2A-22 | P2 | Fixed | 06 section 0 battery method, section 10 battery rows | Method: `batteryLevel` across a scripted run long enough that the total budget is several steps; Energy Log and MetricKit explain a miss. F04 section 9's `batteryLevel` row now agrees with 06, so F04 needs no change |
| R2A-23 | P2 | Fixed | F16 6.2 C, F16-REQ-027; F08 6.5 G4, F08-REQ-030; 06 section 4 | App roles keep the platform `statement_timeout`; purge, rotation, retention and backfills commit in batches under 1 s; the alert covers every role |
| R2A-24 | P2 | Fixed in F08; 08 and 09 to cite | F08 6.5 C8 | One definition: restores per 30 days and keys per day, with the two-children example. 08 line 639 and 09 R-19 still say "3 unwraps a month" |
| R2A-25 | P2 | Fixed | F16 6.2 A step 6, F16-REQ-003, U29, WP-F16-04 | `sync_claim_op(op_id)` security definer helper; the direct insert policy is dropped; test in WP-F16-04 |
| R2A-26 | P2 | Fixed | F08 6.5 server objects, F08-REQ-039 | `backup_begin` and `backup_store_key` raise `SCCON` without an active `backup` act (or the sensitive-data act if counsel answers F08 Q6 that way) |
| R2A-27 | P2 | Fixed in 06; 08 and 09 to cite | 06 section 12 outside-sign-in row | F02-REQ-024 is the only checklist; 08 T16 and 09 R-17 must cite it instead of restating it |
| R2A-28 | P2 | Fixed in 06; F05 handed off | 06 sections 1, 6, 14 | Sentry rows now read "only if F18 Q2 adds it". F05 section 8's "recording never leaves the phone" row is outside this lane's files |
| R2A-29 | P2 | Handed off | F05 section 8 | F16 already keeps `stt_meta` author-only (PRD-REQ-004); F05's member-readable alignment row should move to F34. Outside this lane's files |

## R7 items handled in this lane

| ID | Disposition | Where |
|---|---|---|
| R2P-02 (WP-F17-15 part) | Fixed in F17; 08 to keep it | F17 4, WP-F17-15 marked P0 and staying in v1.0 |
| R2P-03 | Fixed | F02 2, 6.1 rows and re-offer rule, ask table, 6.2 header and step 1, A-REQ-013 Rev, PRD-REQ-001 source: DR-12 B, matching 09 and F13-REQ-023 |
| R2P-04 | No change in F08 | F08 names are canonical; 08 adopts them (with R2A-10) |
| R2P-07 | Fixed | 03 promise sentence and item 1; F06 4.2 new "What we may promise about the words" and `review.subtitle`. Letters stay clean by default, so the promise says the words are yours and every fix is shown and undoable; "exactly as said" names only the `verbatim` level. BRAND.md and the F21 listing line still say "exactly", handed off |
| R2P-09 | Fixed | F08 3 new metric with a T34 decision rule, 6.4 re-offer rule, C-REQ-018 Rev, 6.7 keys, WP-F08-06 (not in 08 6.3) |
| R2P-11 (F11 part) | Fixed | F11 3 target now "set after C1", matching 03 4.2 |
| R2P-15 | Fixed | F11 1 now says Family Sharing covers both parents only inside one Apple Family and separated parents each pay |
| R2P-17 (A-REQ-014 part) | Fixed | A-REQ-014 Rev (M2): no "free tries" |
| R2P-18 (F02 part) | Fixed | F02 Q1, Q3 to T07; Q4 to T15; Q5 to T26. F04 dates are outside this lane's F04 scope |

## For the delivery and decisions agent (`08`, `05`, `07`, `09`, README, section 7 and 12 ID mappings)

New or changed work packages that need a slot or a milestone:
- **WP-F16-17** held drafts on the server (S02, S03), before WP-F14-22 and before the signed-in held note ships.
- **WP-F16-18** ledger kinds and RB-8 replay (S02, S07), before the T19 restore drill.
- **WP-F16-19** environment matrix and its CI check (S20), before T21.
- **WP-F04-18** `F_FULLFSYNC`, conditional on F04-REQ-048 failing on the device.
- **WP-F08-06** keep-safe card with the backup re-offer (S13) is not in 08 6.3.
- **WP-F08-B8** escrow ceremony and the `scribe-escrow` project need a T milestone before T23 (R2A-10).
- **WP-F08-B3, B3p, B4** grew (restore requests, append-only log and daily copy, exact-path purge, sweep, `account-stop`, isolation check); re-check their slot sizes.
- **WP-F02-13** grew (Auth hook, `account_sessions_seen`, `SCSES`, `account-stop` with F08).
- F11-REQ-029 adds the `restore_request` push kind to WP-F11-09f.

Positions this lane set in 06 that 07, 08 and 09 must cite rather than restate:
- External security test window (06 section 12) and its T15 cost decision.
- Load gate at G4 versus C2 (06 section 16), which answers 08 Q8 by default.
- G4 crash-signature rule on RC-equivalent builds from T29 (06 section 6).
- Escrow limits in F08 6.5 C8 units (08 line 639, 09 R-19).
- Escrow custody in F08 6.5 G1 and G2: the 08 backup ADR row ("generated offline, two sealed copies apart") now matches G1 but must add the separate `scribe-escrow` project and drop "at most 3 unwraps a month" and the unscoped "every use logged"; 09 R-19 says the same two things.
- The outside-sign-in checklist lives only in F02-REQ-024 (08 T16, 09 R-17).
- F08 work-package names (B5b restore, B5c settings row) in 08 T23, wave 3 and 6.3; B5d wave versus T25.
- WP-F17-15 stays in v1.0 (08 6.4).

Outside this lane's files, for their owners or the coordinator:
- F06 section 8 "Review state on the draft ... Never": now false for held drafts (F16 6.2 I carries the words group, author edits and locks).
- F05 section 8 recording row (R2A-28) and alignment row (R2A-29).
- F14-REQ-043 `sub_ref` salt (R2A-20).
- F21: the `/stop` page (F08 6.5 C4) and the listing line that says "kept exactly" (R2P-07).
- `reviews/STALE-OUTSIDE-PRD.md`: `packages/content/BRAND.md` positioning line; `docs/qa/DEVICE_TEST_PLAN.md` DL-01 forced-reboot row (F04-REQ-048); `apps/mobile/eas.json` `testflight` profile (F16 section 9).
- 03 section 4.4 fixed costs predate M14 and now also miss the escrow project (R2P-12, 06 section 15).
