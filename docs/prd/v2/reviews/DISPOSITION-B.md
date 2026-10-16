# Disposition B: critique round 1, architecture and trust files

Reviser: principal architect (revision lane B). Date: 13 to 14 Oct 2026. Branch `docs/prd-v2`, not committed.

Files owned by lane B: `06-nfr.md`, `features/F02-account.md`, `F08-recordings.md`, `F11-co-parent.md`, `F16-sync.md`, `F17-settings-privacy.md`, `F19-content-config.md`. Every P0 and P1 finding that names one of these files is listed below, plus the P2 rows that were cheap. Code claims were re-checked against the working tree on 13 Oct (`apps/mobile/src`, `packages/api`, `packages/core`, `supabase/migrations`, `supabase/functions`, `docs/adr`). Lint: `node docs/prd/v2/tools/lint.mjs docs/prd/v2` on the seven files: clean.

Actions: **Fixed** (the spec now says what the finding asks, or a stronger version), **Fixed differently** (the problem is closed another way; reason given), **Raised** (turned into an open question with an owner, because it needs the founder or counsel), **Rejected** (reason given), **Other lane** (the fix belongs in a file lane B does not own; what B did in its own files is noted).

## R2 Architect

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| AR-01 | P0 | Fixed | F16 | Sections 6.2, 7, 8, 9, 11 rewritten to the built protocol and its names (`sync_push(p_ops)`, `sync_pull(p_since, p_limit)`, `sync_xid`, `sync_op_receipts`, `sync_epochs`, digest removal, `gone` books). Real deltas are WP-F16-14 to -16 (conflict, rebase, API version) plus BL-331 items. Sync protocol ADR listed |
| AR-02 | P0 | Fixed | F16, 06 | 1 states the built rule is last writer wins and marks it a P0 gap. 6.2 E specifies compare and set on the words group, `conflict_groups` and `current` in the result, a local `sync_conflicts` row, author chooses, rebase of queued ops (F16-REQ-010, -025). Other groups keep later arrival. Two-phone gate in WP-F16-11; 06 section 4 and 7 rows |
| AR-03 | P0 | Fixed | F16, F11, 06 | No `book_access` in v1.0 (D-055, BL-175). F16-REQ-005 and -006, 06 section 3, F11 header, 6.2 B step 6, U21, PRD-REQ-014, data model and sequencing now use `child_members`, `is_child_member`, `book_entries`. WP-F16-02 removed; WP-F11-01 no longer depends on it |
| AR-04 | P0 | Fixed | F11 | M17 stated; the ledger bug cited (`ledger.ts` `countPresent`, `letter-ledger.logic.ts`). F11-REQ-025 with the 30-letter join test, U33, U34, WP-F11-14 (S06 with S03); gates the switch flip, also in F02-REQ-024. F14 owns the voice-only half |
| AR-05 | P0 | Fixed | F08 | New key model: book key per (child, author, version), Keychain account `<profile_id>:<child_id>`, `child_keys` primary key (`child_id`, `profile_id`, `key_version`), device X25519 pair per install, never-create rule (F08-REQ-021, -027, -028). ADR 0006 amendment required before WP-F08-B2 |
| AR-06 | P1 | Fixed | F08, F02 | 6.5 C: sign-in within 10 minutes, email at request with Stop link, 24 h hold unless an enrolled device approves, 3 restores per 30 days, completion email, escrow not deployed before BL-347 and the new-device email (F08-REQ-029, -034; F02-REQ-017). "Same sign-in method as enrolment" not adopted: a person who lost their phone may only have the email route; the 24 h hold and email cover the takeover case |
| AR-07 | P1 | Fixed | F08, F16, 06 | 6.5 G: offline ceremony, two sealed copies, versioned escrow key, rotation in the function with log rows, RB-8 copies secrets and buckets, drill includes one escrow restore (F08-REQ-030, WP-F08-B8) |
| AR-08 | P1 | Fixed | F08, F16 | Self-describing object header with the wrapped file key; re-check and re-upload after an epoch reset (F08-REQ-031; F16 6.2 F step 5) |
| AR-09 | P1 | Fixed | F08, F17 | 6.5 D only-in-backup count and Bring them here first before backup off or account deletion; delete only with a matching local hash or a confirmed count (F08-REQ-035; F17 6.2 E step 4b, U37) |
| AR-10 | P1 | Fixed differently | F08 | Upload does not wait for the server row (so held and voice-only letters back up, which also answers R3 DX-01's backup part); moves rewrap the file key and move the object instead of being refused, because F12 allows moves and the child id is no longer in the AAD (6.5 E, F08-REQ-032) |
| AR-11 | P1 | Fixed | F08, 06, F16 | 20 MB object limit, `pending` row policy, 5 GB per account, 600 begins per hour (F08-REQ-033); rows in 06 sections 3 and 16 and F16 section 9 |
| AR-12 | P1 | Fixed | F19, F08 | Build flags `capabilities.backup`, `capabilities.statusReport`; switches `backupUploads`, `escrow`, `statusReport` with consumers (F19-REQ-011, -025; F08-REQ-041; WP-F19-16, -12b, -12r) |
| AR-13 | P1 | Other lane | F14 | Status report contract is F14's. 06 section 3 has a status-report row pointing to F14; F17 8.4 has its deletion row |
| AR-14 | P1 | Fixed | F16, 06 | Freshness gate restated as p95 30 s, p99 60 s with both phones in the foreground, one 30 s interval; Realtime is F16 Q2 for v1.1. Statement and idle timeouts plus oldest-transaction alert (F16-REQ-027; 06 sections 4, 14) |
| AR-15 | P1 | Fixed | 06, F16, F08 | Budgets for escrow, backup RPCs, upload, status report, push, email; first-enable burst as a load scenario |
| AR-16 | P1 | Other lane, partly | 08 | Coordination rule is 08's. Lane B's specs now say shared functions (`sync_push`, `prepare_account_purge`) are changed only by S02 (F16 section 9, F08 11.1, F17 WP-F17-17) |
| AR-17 | P1 | Other lane, partly | 08 | Lane B's specs follow the moves: `settings/backup.tsx` under S05 split from `storage.tsx` (F08, F17), purge worker under S07, `config.toml` and `aps-environment` requested from S02 and S20 (F08, F11) |
| AR-18 | P1 | Fixed | F08, F11, F17, F19 | WP-F08-B5 split into B5a to B5d, B3p split out; WP-F11-09 into -09s, -09f, -09c; WP-F19-12 into five; WP-F17-07 narrowed to additions. WP-F06-07 and WP-F14-15 are other lanes |
| AR-19 | P1 | Raised | F08 | F08 Q8 and 11.3 point to the founder decision; the date lives in 08 |
| AR-20 | P1 | Other lane | 08, 05 | Merge cap and ranked list |
| AR-21 | P1 | Other lane, partly | 08 | F16 section 9 environments now say staging deploys from `develop` with the label and production on a `db-v*` tag |
| AR-22 | P1 | Fixed | F17, F08 | Deletion matrix in F17 8.4 covering backup tables, Storage, Keychain on each device, push tables, receipts, status record, consent records, escrow log; worker rows WP-F17-17 and WP-F08-B3p; `entry-audio` to v1.0; Keychain behaviour stated plainly |
| AR-23 | P1 | Fixed | F17 | Erase everything is P0 with server semantics: signed out wipes and resets the ledger; signed in offers account deletion or this phone only (6.2 F, F17-REQ-026, DATA-REQ-024 Rev) |
| AR-24 | P1 | Fixed | F08 | Mic purpose string drops its second sentence: F08-REQ-036, owner S16, counsel; claims table in 6.5. F04 section 8 row is another lane |
| AR-25 | P1 | Fixed in lane B's ADR lists | F16, F08, F19 | ADR 0004 superseded by the sync protocol ADR, ADR 0006 amended, ADR 0016 accepted with deltas in the capabilities ADR. ADR 0013 and 0017 are F14 and 08 work |
| AR-26 | P1 | Fixed | 06 | G4 is zero unresolved crash signatures over at least 300 RC sessions [A]; 99.8% moves to G5 post-release (06 section 6, Q8) |
| AR-27 | P1 | Fixed | F19, 06 | `stale-while-revalidate=30` and a 2-minute foreground refresh (F19-REQ-026, WP-F19-15); F19-REQ-008 reworded so a newer signed document can lift a switch; consumers listed |
| AR-28 | P1 | Fixed | F19 | Two keys from the first ceremony and a rotation runbook (F19-REQ-002 Rev, WP-F19-01) |
| AR-29 | P2 | Other lane | F05 | Not in lane B's files |
| AR-30 | P2 | Fixed | 06 | One device run protocol in section 0; transcription and battery rows cite it |
| AR-31 | P2 | Fixed | F16 | Frozen v1.0 wire contract with every column (F16-REQ-028, WP-F16-01). The F06 author-layer timing is F06's |
| AR-32 | P2 | Fixed | F16, F08 | Claims deleted: `audio_sha256` does not sync; new-phone matching uses entry id and the local hash; restore checks use the hash inside the encrypted header |
| AR-33 | P2 | Fixed | F08 | No plaintext hash on the server; ciphertext hash only |
| AR-34 | P2 | Fixed | F08 | 64 KiB AES-GCM segments with counter nonces; `backup-tmp` with protection class and launch sweep |
| AR-35 | P2 | Fixed | F08 | Lapse keeps backup restorable; no inactivity deletion (LEGAL-REQ-033) |
| AR-36 | P2 | Fixed in lane B | F08, F16, F17, F19, F11, F02 | Sequencing paragraphs are order only and point to 08 section 5. F05, F06, F14 are other lanes |
| AR-37 | P2 | Fixed in lane B | F16 | Local schema version numbers removed. F04, F05, F06 are other lanes |
| AR-38 | P2 | Fixed | F17 | WP-F17-07 and -11 point to `lib/account-deletion/` and the built `purge-worker`; section 11 updated |

## R4 Privacy, trust and safety

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| PT-01 | P0 | Fixed as requirements | F08 | Claims table in 6.5 and F08-REQ-036 to -038 with owners (S16, S17, S20) and counsel, covering the mic string, Privacy Policy, Terms 6.2 and 12.4, health notice, in-app disclosures, label. The legal files themselves are outside the PRD; the coordinator adds them to `reviews/STALE-OUTSIDE-PRD.md` (lane B does not own that file) |
| PT-02 | P0 | Fixed | F08 | "Only the family's keys" removed from section 3; copy per M16 (encrypted, recovery key under limited logged use, never listened to, sold or used to train); banned phrases listed; own consent act. PT-02's suggested sentence ("we could open them, and we only would for a legal order") was replaced by M16's founder wording; the honest limit sentence in 6.5 C and the Policy carries the legal-order case |
| PT-03 | P0 | Fixed | F17, F08, 06 | Staff line replaced with a provable one; "every access is logged" returns only after database audit, the escrow-secret release check and a quarterly review (F17 8.2 item 6, F17-REQ-027, WP-F17-16; F08-REQ-034) |
| PT-04 | P0 | Other lane | F21 | Website hotfix |
| PT-05 | P0 | Other lane, partly | COUNSEL_PACKET, 08 | Lane B lists every legal file the M14 build changes (F08 6.5 table) so S17's delta can use it |
| PT-06 | P0 | Other lane, partly | README, `_AUTHORING.md` | Source-order rule is not lane B's. F17's legal note now says a founder decision that collides with a legal duty builds the legal default and goes to counsel; ENGINEERING_REQUIREMENTS 1.3.0 is in F08's claims table |
| PT-07 | P0 | Fixed | 06 | Section 12 row is an allowlist of the D-080 and D-081 fields with a schema test; the ban stays for receipts, JWS, ids in clear, prices, `appAccountToken` |
| PT-08 | P0 | Raised, partly fixed | F17, F02 | (a) routing of signed-out buyers raised in F02 6.1 and U35 for counsel; (b) billing-notice record after deletion: F17 6.2 E step 4 spec default keep, 8.4 row, Q14; (c) renewal projection is F14's |
| PT-09 | P1 | Raised | F17, F02 | Consent record linked or pseudonymised per counsel (F17 8.4, Q14; F02 section 8). BL-342 gate is F14's |
| PT-10, PT-11 | P1 | Other lane | F14, F01 | Not in lane B's files |
| PT-12 | P1 | Fixed | F02 | No `age_signal` sent until counsel answers (6.2 step 4, section 8, Q6 moved to the counsel delta). DR-10 date is 09's |
| PT-13 | P1 | Other lane, partly | F14, F21 | F11's Family Sharing copy now says the letter "waits on this phone", not "safe"; no "playable" claim about a co-parent's letters in lane B's files |
| PT-14 | P1 | Fixed | F11 | Leave sheet with no preselected choice, Continue disabled (F11-REQ-028) |
| PT-15 | P1 | Fixed | F11 | Can't-take-back line on leave, take-out and safety removal; 30-day stale-phone hide (U35, F11-REQ-027, WP-F11-16) |
| PT-16, PT-17 | P1 | Other lane, raised | F20 | F11 Q6 now names F20 runbooks S-8 and S-9 and counsel |
| PT-18 | P1 | Other lane | F20, F12 | Not in lane B's files |
| PT-19 | P1 | Fixed | F02, F08 | New-device email P0 and before any escrow release (F02-REQ-017); 24 h hold with Stop link (F08-REQ-029); 8-digit 15-minute codes as spec default (A-REQ-018 Rev, Q2) |
| PT-20 | P1 | Fixed | F02 | Link accepted only with a pending request and PKCE, refused while another account is signed in, claim only after consent and a masked-email tap, consent shown to existing accounts too (F02-REQ-018 to -020, U11, U27, U34). Gate includes BL-332 and BL-349 (F02-REQ-024); R-17's own row is 09's |
| PT-21 | P1 | Fixed | 06 | Scoped external test before submission is a gate; full test at the old triggers |
| PT-22 | P1 | Fixed, counsel raised | F08, F17 | `backup` consent act recorded at turn-on, listed and withdrawable (F08-REQ-039, F17 6.2 B step 4, U40); counsel may fold it into sensitive-data consent (F08 Q6). Turn-off default: two equal choices, not a default to delete, because deleting the only off-phone copy by default conflicts with AR-09; counsel can change it |
| PT-23 | P1 | Fixed, counsel raised | F17 | Withdrawal sheet states what stays on the server, delete option first (F17-REQ-030); Q4 must be answered before any outside family signs in |
| PT-24 | P1 | Fixed as requirements | F17, F08 | F17 8.5 lists the label rows 1.4.0 must change; F17-REQ-028, F08-REQ-038; F08 Q4 moved to the counsel delta. F21-REQ-007 owns the App Store entry |
| PT-25, PT-26 | P1 | Other lane | F21 | Lane B's own claims tables (F17 8.3, F08 6.5) carry their sentences |
| PT-27 | P1 | Fixed | F17, F16 | Erase now hidden in sync builds with "Erased on {date}" until WP-F16-13 ships (F17-REQ-025, U39; F16-U17b) |
| PT-28 | P1 | Fixed | F17 | Ids kept through the execution wipe and retried; receipt marks `unconfirmed` (F17-REQ-029). The 90-day PostHog retention is F18's |
| PT-29 | P1 | Fixed | F17 | Web deletion page item 3 lists the status and consent records; the "none exist" line is gone |
| PT-30, PT-31 | P1 | Other lane | 09, 08 | Not in lane B's files |
| PT-32 | P1 | Fixed | F02 | M14 pass; "Audio does not restore" and "free tries" lines replaced. Stale-list rows are the coordinator's |
| PT-33 | P2 | Other lane | F20 | Support mailbox row added to F17 8.4 only |
| PT-34 | P2 | Fixed | F17, F08 | Named exceptions (pseudonymised audit and escrow logs, consent records, receipt, suppression hash) listed in 8.4 and shown on the deletion screen, web page and Policy |
| PT-35 | P2 | Other lane | F21 | Review notes |

## R1, R3, R5 findings that name lane B's files

| ID | Sev | Action | File | Notes |
|---|---|---|---|---|
| PL-01 | P0 | Other lane | 05, 08 | Cut order is 05 and 08's; F08 Q8 points at the backup decision |
| PL-02 | P0 | Raised with a default | F08 | Spec default changed to free [R]; founder Q2; if Plus, `03` principle 6 and M1 claims change in the same PR |
| PL-03 | P0 | Fixed in lane B, partly | F16, F08, F17, F19, F02, F11 | Sequencing is order only; F17 and F08 question dates are milestones in 08. F02 Q1, Q3 to Q5 keep their decision days (16 and 23 Oct, 4 Dec), which are founder meetings, not build dates |
| PL-04 | P0 | Fixed | F02 | M14 pass; BL-347, BL-330, BL-322, BL-331 as P0 requirements; R-17 gate as F02-REQ-024 |
| PL-09 | P1 | Other lane, raised | F11 | DR-16 is 09 and F14's; F11 Q12 records it and M17 settles what counts |
| PL-10 | P1 | Fixed | F11 | U03 offers the PDF route; Q10 for the wider design |
| PL-19 | P1 | Raised | F02 | DR-12 is the founder's in 09; F02 notes the recommendation and that only the order table changes |
| PL-20 | P2 | Raised | F02 | Q7 to rename the sheet |
| DX-01 | P0 | Fixed for backup | F08 | Held letters back up (6.5 E, F08-REQ-032, U31). Export and sign-out parts are F15 and F14 |
| DX-04 | P0 | Raised with a default | F08 | Default free [R]; off until turned on, offered once after sign-in, because PT-22 asks for its own consent; founder Q2 |
| DX-07 | P0 | Fixed in lane B | F02 | "free tries", "Plus feature tapped while signed out", "Audio does not restore" removed. Lint rule is the tools owner's |
| DX-10, DX-20 | P1 | Raised | F11 | Q11: the language label needs `entries.language` readable by members, which the APPLY.md decision keeps author-only; recommendation yes |
| DX-11 | P1 | Fixed | F11 | Co-parent gate copy names Family Sharing and links Apple's help before purchase; M17 removes the false count |
| DX-12 | P1 | Fixed differently | F16, F11 | Later arrival kept for book settings (as built); the one-time note and undo belong to F12 (F16 C5, F11-U36, F16 Q6) |
| DX-15 | P1 | Fixed | F02 | Ask table for the first 14 days with a one-per-day cap |
| DX-19 | P1 | Fixed | F11 | As PL-10 |
| DX-23 | P1 | Partly fixed | F08 | Restore waiting and approval copy written; the shared loading component is S15's |
| DX-25 | P1 | Fixed | F08 | First drafts for every `backup.*` key |
| DX-29 | P1 | Fixed | F11 | Reading claim relabelled [A] |
| DX-33 | P2 | Fixed | F08 | Remento shows as Trustpilot, web link, not an app |
| DX-38 | P2 | Raised | F08 | U10 notes the volume ramp for F10 and F08 design |
| EQ-04 | P0 | Fixed in lane B | F16, F08 | AX5 rows read "device script until the render harness lands" |
| EQ-05 | P0 | Fixed for PRD-REQ-001 | F02 | F02 is the one home; others cite it. Other duplicated IDs are other lanes |
| EQ-17 | P1 | Fixed | F19, 06, F17 | One key registry in F19 6.5; snake_case names retired; 06 uses `killSwitches.sync` |
| EQ-19 | P1 | Fixed | F02 | Session defined; ask table |
| EQ-20 | P1 | Fixed | 06, F16 | Same access path everywhere; 07's parity bullet is another lane |
| EQ-21 | P1 | Fixed | F08 | B5 split |
| EQ-30 | P2 | Fixed | 06 | Missing `perf` profile stated; rows gate only when 07 lists them for that RC |
| EQ-01 to EQ-03, EQ-06 to EQ-08, EQ-14, EQ-23, EQ-25 to EQ-27 | Various | Other lane | 07, 08, BACKLOG | Lane B's WP tables gained a stream column in F16 and F08 and say 08 section 3.3 governs ownership |

## Facts found while revising (for the coordinator)

- `SCCAP` has no rule in `packages/api/src/envelope.ts` `classifySqlstate`, so the app shows `unknown` for a full book (F11-REQ-026).
- No `statement_timeout` or `idle_in_transaction_session_timeout` is set anywhere under `supabase/` (F16-REQ-027).
- `CACHE_POLICY.remoteConfig` is `max-age=60, stale-while-revalidate=3600` and `CLIENT_REFRESH_MS.remoteConfig` is 4 minutes (F19-REQ-026).
- `lib/auth/passkey.ts` exists behind `EXPO_PUBLIC_PASSKEYS`, set by no profile.
- Files outside the PRD that must join `reviews/STALE-OUTSIDE-PRD.md`: the legal set in F08 6.5's claims table, `purge-worker/lib/buckets.ts` (`entry-audio` v1.1), `packages/content/src/permissions.en.ts` and `apps/mobile/src/lib/permission-copy.ts` (mic string).
- Cross-lane references other lanes should keep stable: F02-REQ-017, F02-REQ-024, F08-REQ-034 to -041, F11-REQ-025, F16-REQ-010, F16-REQ-017, F17-REQ-025 to -030, F19-REQ-025, F19-REQ-026.
