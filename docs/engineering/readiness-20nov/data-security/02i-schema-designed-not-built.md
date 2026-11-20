# 02i Schema reference: designed, not built

Status: draft for the council, 20 Nov 2026. Author: `data-architect`. Everything here is a design in a merged document on develop `4d33978f` (cited code and migration paths unchanged at `12c55d66`) or a proposal named in it; none of it is in `supabase/migrations` or `migrations.ts` at that sha. Mark: DESIGNED-NOT-BUILT. Every level is PROPOSED until `privacy` rules it, and the cards win over the designs (CR-66): where a design and a card disagree I write a Conflict line. The designs are `docs/tdd/new-scope/data-and-sync.md` (DS), `12-first-run*.md`, `13-days-culture-home.md`, `14-media-library-video.md`, `17-days-prs-and-amendments.md`, ADR 0028, and CR-69 A2 and A4 (`docs/agents/cto/RULINGS.md:694-`). Open PRs (#835, #836, #424) were not re-read at their heads; their numbers come from the designs [U]. Part of 02 (legend in 02a).

## 0. What is applied, and what is only merged

`.github/migrations-applied.txt` records two migrations as applied to a hosted project: `20260930000000_scribe_core.sql` and `20261001000000_scribe_hardening.sql`. The other 29 files on develop (everything in 02a to 02f except the core tables) are merged and tested but not recorded as applied [V: `comm` of that list against `ls supabase/migrations`]. DS section 0 item 7 says staging and production have never been migrated by CI and the founder applies them (D-041). So the schema in 02a to 02f is the schema the code expects; the hosted schema is the core file plus its hardening until the founder applies the rest [U: no hosted project was read]. This is the first finding in 01a.

## 1. Phone database (scribe.db, local migrations after the latest on develop)

| Id | Object | Source | Columns (type, null, default) and PROPOSED level | Retention, deletion, test |
|---|---|---|---|---|
| L11 | `entry_media` (table, 3 indexes) | ADR 0028 D1; PR #835 | id TEXT pk L2; entry_id TEXT L3; draft_id TEXT L3 (exactly one of the two is set); kind TEXT not null L2; ext TEXT not null L2; bytes INTEGER not null L2; sha256 TEXT not null L4 (hash of a picture); width, height INTEGER L2; photo_text TEXT L4 (the parent's words, CHECK ceiling); place TEXT L4 (typed, CHECK ceiling); added_at TEXT not null L2. Unique index `entry_media_one_photo_idx` on COALESCE(entry_id, draft_id) | with the letter or draft; row hidden when its letter is tombstoned (no `deleted_at` column); Erase everything and sweep delete files and rows. Test: `photos-device.test.ts` (#836) and the upgrade test DS asks for [U] |
| (no id) | `entry_media` rebuild for NS-52 | CR-69 A2, A11; doc 14 section 4 | kind CHECK in photo, video; ext coupled (photo jpg; video mp4, mov); `position` INTEGER not null default 0 L2; `duration_ms` INTEGER null L2; unique index dropped, plain index `entry_media_owner_pos_idx`. A new local migration after L11 (its number comes from merge order, A11; `data-and-sync.md` writes no L-number for it); the `searchable_letters` view is dropped first | as L11. CHECK ceilings are 2240 and 960 code points in DS L11 (amended on develop) and in doc 14 F1 (no conflict; #835's head not read [U], card row NS-01-R54). The two coupling triggers of doc 14 2.1 (`entry_media_video_needs_duration`, `entry_media_photo_no_duration`) belong to it |
| L12 | `entries.first_mark`, `drafts.first_mark` L3; `first_label` L4 | DS 2.1, NS-06 A | TEXT, null; no index | with the letter; test `firsts` per DS |
| L13 | three seal columns L4 on entries and drafts; `sync_books.seal_watermark` L2; `entries_seal_idx` | DS 2.1, NS-06 B | names are in eval A s1.2 on a branch I did not read [U]; watermark is the composite "<instant>|<id>" | with the letter; test `seal_publish` per DS |
| L14 | `drafts.author_signs_as` L3 | DS 2.1, NS-16 | TEXT, null | with the draft |
| L15 | `entries.words_withheld`, `drafts.words_withheld` L4; table `withheld_words` | DS 2.1, NS-17 | flag columns; the table keeps the withheld output out of every reader | with the letter; needs a card row [DS R14] |

## 2. Server (new migrations; each needs the founder's `approve-migration` and a red-team review)

| Id | Object | Source | Change and PROPOSED level | Test and risk |
|---|---|---|---|---|
| S1 | trigger `entries_15_photo_closed` / `entries_photo_closed()` (SCPHO); drop policies `entry_photos_author_insert` and `_update` | DS 2.3, NS-01-R61 | refuse a non-null `photo_path` on insert and a change to a non-null on update; an unchanged value passes (DS CK8). Closes Gap G-9. Timing (C4): GF, merged together with photo slices #835 to #840, founder applies; test on a database built from all files | `photo_bucket_closed.test.mjs` (to write); about 280 lines, 5 files (DS 3.6) |
| H1 | hooks `sync_private.entry_groups_apply`, `entry_own_extra`, `public.entries_extra_content` | DS 2.3 | restate `sync_push`, `sync_pull`, `entries_family_rules()` once so later column PRs stay small | existing sync tests; question OQ-K1 |
| S2 | `entries` and `held_drafts` `first_mark` L3, `first_label` L4 (320 code point ceiling) | DS 2.3 | author sees it on other phones through `to_jsonb(h)` | `firsts` |
| S3 | `held_drafts.words_withheld` L4; `held_drafts_stamp()` allows `raw_transcript` null only with the flag | DS 2.3 | | to write |
| S4 | seal columns L4 on `entries`; `book_entries` gains the seal clause; `entries_seal_open_idx`; `v_now := now()` (CK10) | DS 2.3 | a seal opens only at whole or half-hour instants; `book_entries` is the view members read, so a wrong clause is a leak | `seal_publish` |
| S5 | `entry_versions` gains `edit_level`, `author_edits` L4, `locked_spans` L4; definer `entry_versions_list`, `entry_version_remove` (refuses under a legal hold, writes an ids-only audit row) | DS 2.3 | unscheduled | to write |
| F28 | `20261031000000_compliance_gates.sql` (PR #424): `public.hook_before_user_created(event jsonb)`, `ops.restricted_jurisdictions` L1, `ops.compliance_check_counts` L2, `ops.geo_ip_ranges`, `ops.geo_ip_meta` (`12-first-run.md:98`), `ops.country_of`; the hook is granted to `supabase_auth_admin` only (`12-first-run.md:104`) | `12-first-run.md` 0.1, 3.3 | reads the IP in memory, stores no IP; refuses only a `scope = 'country'`, `status = 'block'` row; fails open. Timestamp sorts before `20261109000000`, so it must be re-stamped (`12-first-run.md` FS-14) | needs a hosted dashboard step to enable; sanctions fail-open is counsel's |
| W1 | `withdraw_sensitive_data` (FP-19) | `12-first-run-5.md` FP-19 | a withdrawal argument and a deletion path for sensitive-data consent; not built | counsel and product first (CF-9) |
| X1 | storage buckets `child-photos`, `inbox`, `avatars`, `exports` | `DATA_CLASSIFICATION.md` 4.4 | named in code, not created (Gap G-10) | per card |
| S6 | table `public.security_events` (name PROPOSED): its own store, not a new action in `audit_events` (C3) (design only; written after the founder says start) | CDO return, C3(b); SEC-R24 | service role only, no grant to `anon` or `authenticated`; retention 12 months (D-021; counsel confirms); no person id in clear (a keyed hash, L3 PROPOSED); `kind` a closed enum; counts only. Minimum kinds: wrong-code bursts, global invite pause tripped, step-up failures, restore requests, deletion requests refused, ceiling hit on alert mail. Gap G-24, gate GF | grant listed in `grants.mjs`; test: no role but the service function reads it. The PR names the reader and the threshold or it does not merge; recommended reader `ops` on a schedule the founder sets, founder confirms (open) |
| S7 | one migration with writers for `export_created`, `legal_hold_placed`, `legal_hold_released`, `support_access` (allowed by the check at `20261002020000:315-320`, written by no function [V grep]). Gap G-24, gate GF (design only; written after the founder says start) | C3(a); 05 Q6 | `detail` keys on an allowlist, content-free; support and break-glass acts also write `ops.audit_log` first ("no row, no act", 03 section 9) | one allow and one deny test per writer |
| S8 | table `purged_letter_fingerprints` (name PROPOSED; `SCPRG` stays the error-code name): permanent purged-id guard, a 16-byte keyed hash (HMAC, key a database secret the founder sets: Vault [U] or a no-grant `sync_private` config row read only by definer functions; 01a 8.2) of a deleted letter's id and no other column; `entries_not_purged` and the book purge check consult it after `purge_ledger` (01a 8.2). Gap G-23, gate GF [E] | C5 | L2 PROPOSED; no person id, no book id, never joined, no grant. Design only; written after the founder says start; not applied until counsel and the privacy chief approve the retention wording | test: a stale phone replays a deleted letter at day 61 and is refused (fails today) |
| S9 | one migration: the 10 missing column comments on `insights._letters` and `_book_family` (G-2, gate G10 [E]); drop `grant insights_reader to authenticator` (`20261004300000:35-37`, G-26, gate GF [E]) (design only; written after the founder says start) | CDO return 01a Q-2; C9 | levels as `privacy` rules (`_letters` holds `entry_id`, `author_id`, `child_id`, L3) | `classification.test.mjs` widened (01a 8.4); grants test |
| S10 | device table for the new-device email (name PROPOSED): one row per account and device, keyed hash of the device id (HMAC; key a database secret, as S8), first seen, last seen; service role only | E78, NS-08-R21; 01a C-10 | L3 PROPOSED, deleted with the account; adds data (device ids), which is why it is gated before the backup flip, not built for 1.0. Design only; written after the founder says start | `grants.mjs`; test: a first device sends nothing, an unseen device sends once |
| S11 | alert-cap state (name PROPOSED): per account, an hourly count, a day count and a folded-summary marker; no content, no address | E81 (CR-71 D2) | L2 PROPOSED, service role only; needed only if an alert sender exists (NS-08-R21 or later), so nothing for 1.0. Design only; written after the founder says start | test: 6th in an hour folds, 21st in a day stops, a sign-in code is never capped |
| S12 | definer function `export_own_audit_rows()` (name PROPOSED): returns the caller's `audit_events` and `deletion_requests` rows, another member as "another member", `detail` filtered to allowed keys (G-13) | E74, FR-PRV-03 | no new table, no grant on the tables; EXECUTE for `authenticated` only, listed in `grants.mjs`. Design only; written after the founder says start | allow test (own rows), deny test (another person's rows), export-file test for no content |

## 3. Phone settings keys and secure items (no table change)

| Key or item | Source | PROPOSED L | Note |
|---|---|---|---|
| discard.failures.<draft id> (K1) | NS-09 | L3 | count; key holds a draft id |
| newPhoneLine.dismissed (K2); copySlip.<child id>.<year> (K3) | NS-10, NS-11 | L2; L3 | K3 key holds a book id |
| reminders.onSince (K4); signAs.recent (K5) | NS-13, NS-16 | L2; L3 | K5 holds signatures |
| typedDay.<yyyy-mm-dd>, typedDay.showWords (K6, K7) | NS-18 | L3, L2 | a date beside a day name inherits the day's class |
| home.pastLetters, home.pastLetter.dismissedOn (K8, K9) | NS-23 | L3, L2 | letter ids |
| culture.asked.<ownerKey> | `13-days-culture-home.md` 4.6 | L2 | `done`; owner key is 16 hex of SHA-256 of the user id |
| notifications.dayNames | same | L3 | effective value is stored AND NOT app lock |
| days.clearedNote | same | L1 | one-shot, deleted after showing |
| asks.daysPermission | same | L1 | the one iOS ask |
| asks.daysAskShown | `data-and-sync.md` 2.2 | L1 | whether the days ask was shown |
| update.serverRequiredFor | `data-and-sync.md` 2.2 (12-A9) | L2 | settings; the build an update line was shown for |
| scribe.auth.codePausedUntil | `12-first-run.md` 0.1 | L2 | Keychain; one time value, no address |

## 4. The two on-device files (CR-69 A4)

CR-69 A4 fixes one pattern for two files outside `scribe.db`: write order create-empty, set backup exclusion, read back, write bytes, read back after rename and on every open; a false read-back deletes the file and the store refuses to write; leftover temp files are swept at launch; clear order on sign-out and Erase is delete the file first, before `forgetReminders` and any await; every read checks the owner key and fails closed; file protection no weaker than `scribe.db`; a `'local'` file is adopted only at the claim step by the same person.

| | Days store | Moments index |
|---|---|---|
| Path | `Application Support/days/days.v1.json` (`13-days-culture-home.md` 4.1) | `Application Support/moments/moments.json` (`14-media-library-video.md` 3) |
| Cards | NS-46, NS-47 | NS-51-R6, R23, R24 |
| Level | L4 for the whole file (NS-47-R1) | L4 (`16-media-flags-tests-prs.md` section 3 data classes) |
| Fields (PROPOSED; moments adds `builtAt`, `14-media-library-video.md:75`) | v INTEGER; owner TEXT ('local' or 16 hex); dismissedOn 'YYYY-MM-DD' optional; ticked map of day id to {move {date, always, year}, authority, offYear[]}; hemisphere 'n' or 's' optional. Ids and overrides only, never a copied date | v; owner (account scope); optIn; paused; moments (at most 30, at most 6 identifiers each); albums. About 10 KB |
| Backup | excluded, read back | excluded, read back |
| Retention | until untick, Clear all, sign-out, another account, Erase, Delete account | until Pause (empties and rewrites in one rename), Turn off (deletes), sign-out, Erase |
| Sync, export | none; never exported (NS-47-R10) | none |
| Tests | `days-store.test.ts`, `[NS-47-R6]`, `[NS-47-R11]` import boundary (`16-days-tests.md`) | `moments-index.test.ts` (`16-media-flags-tests-prs.md:49`) |
| Conflict | none | Conflict C-9 (resolved by CR-69 A4): card R6 says "in the phone database"; R23 says excluded from backup; one SQLite file cannot be both, so CR-69 A4 makes it a file (`14-media-library-video.md` 3) |

Pictures and videos (L11 and the media folders) are in the iPhone backup by decision (ADR 0028 D1, NX-39 F9, doc 14 2.4). They are L4 and the label in 01a says so.

## Questions for the council

- Q-i1 (CPO, CLO) The days store and the moments index are L4 files holding a person's culture or places. Default: L4, excluded from backup, never exported, as the cards say.
- Q-i2 (CDO) Which of L12 to L15 and S2 to S5 ship before v1.0? Default: the order in DS 3.6; no migration starts until the founder says so.
- Q-i3 (CPO-privacy) Confirm `entry_media.kind`, `ext`, `bytes` as L2 (DS OQ-P2 default L2) rather than L1.

### Council answers (20 Nov 2026)

Source: `DECISIONS-20nov.md` (PR #1013, branch `docs/decisions-closed-20nov`, until it merges) and the CDO and CISO return (`cdo-ciso.md`, working file, "CDO return"). Gates and numbered gaps: 01a section 8.

- Q-i1: AGREE L4 and excluded from backup. "Never exported" needs the product owner and counsel: it is the person's own content, and an export that omits it may not answer an access request (COUNSEL, one word).
- Q-i2: AGREE the order in DS 3.6; no migration starts until the founder says so.
- Q-i3: AGREE L2 for `entry_media.kind`, `ext`, `bytes` (never L1; L1 is public).
- S1 timing and S6 to S9 (section 2): see the rows added there. S6 to S9 are design only: each migration is written after the founder says start and applied only by the founder. Nothing in section 2 is built or applied.
