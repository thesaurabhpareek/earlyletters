# Theme NX-34: Every new family's recordings are kept safe, free

Readiness: 19 of 28 (author's score, `data-architect`; `qa` to confirm against the 14-point Definition of Ready). Remains: the founder's answers B-1 to B-4 below; counsel on the voice of a child (B-5); the escrow key ceremony and the separate `scribe-escrow` project do not exist for production yet (searched 9 Nov, section "What already exists"); the Swift module has never been compiled; two phones for the restore drill; design draws the "kept safe" row state.

| | |
|---|---|
| Working label | NX-34 (working id, see `_CONVENTIONS.md`). Assigns no BL, D or CR id. |
| Refines | F08 (recordings, section 6.5 backup), F17 (privacy), F19-REQ-025 (per-feature flag), DATA-REQ-001, -002, -048, LEGAL-REQ-024, AL-06, DL-03. Builds on NX-07 (letters on a new phone), NX-08 (withdrawal), NX-04 (delete account and erase phone), NX-01 (hosted backend). Implements D-104 item 2 as confirmed in D-111 item 6 ("backup is free for everyone in v1.0 and does not gate on Plus"), and the founder's chat decision of Mon 9 Nov 2026 that new customers' recordings back up free. |
| Tag | EVIDENCE that the server half and the phone half exist in the repo (read 9 Nov, tree `0a613585`) and have never run against a hosted project or on two phones. HYPOTHESIS: that free is affordable at scale (the cost model below is arithmetic on stated assumptions, not data). |
| Size | M to L. Almost all of it is built. What is new: switching it on, one small additive migration, the cost watch, the label and counsel work, and the proof on real phones. |
| Gate | Founder (B-1 to B-4). Counsel (B-5, the backup copy, the label). `approve-migration` label on the migration PR (D-041), set by the founder only. |
| Order | After NX-01 (hosted project exists), NX-02 (sign-in), NX-08 (withdrawal), NX-04 (delete). Before any marketing that says "free backup". |

## What the parent will see and do

A new parent records a letter. When they are online on Wi-Fi with the app open, the recording is quietly copied away so a lost or replaced phone does not lose their child's voice. Nothing to buy. The letter shows "Kept safe" once the copy is confirmed and "On this phone" until then. On a new phone, after sign-in, the words come first and the recordings follow on their own, oldest first, each with a plain state. Recording never waits for any of this.

## Decisions already on record (do not reopen here)

- D-104 item 2, confirmed by D-111 item 6: backup is free and does not gate on Plus. The code has no Plus check anywhere in the backup path (searched 9 Nov: `plus|entitle|subscription` in `supabase/migrations/20261023000000_backup_server.sql` and `apps/mobile/src/lib/backup/*.ts` finds only the words "plus" in two comments). OPEN-02 in `docs/backlog/FUTURE.md` (lines 66, 163, 205) still says "Plus backup and restore" and G-19 waits on it. That text is out of date against D-111 item 6 and the 9 Nov chat; `product` reconciles it. This file does not edit it.
- D-102 and ADR 0024 (status Proposed in its header, 15 Oct): recordings are encrypted on the phone before they leave it; we keep an escrow recovery key in a separate project; the copy claims only what that provides.
- D-033 (Recommended, needs founder OK): the phone's own iCloud device backup stays as the other free copy. It does not conflict with this theme; it changes the words (see "Effect on D-033").

## What already exists (read 9 Nov, branch `docs/next-roadmap-8nov` at `0a613585`)

| Piece | Where | State |
|---|---|---|
| Server tables, RPCs, bucket, Storage policies | `supabase/migrations/20261023000000_backup_server.sql` (`audio_blobs`, `backup_usage`, `child_keys`, `backup_devices`, `restore_requests`, `escrow_unwraps`, `backup_begin`, `backup_confirm`, `backup_discard`, `backup_delete_all`, bucket `entry-audio`) | On develop. `.github/migrations-applied.txt` lists only `20260930000000_scribe_core.sql` and `20261001000000_scribe_hardening.sql`, so it has applied to no remote project. |
| Phone: keys, queue, resumable upload, restore | `apps/mobile/src/lib/backup/` (`queue.ts`, `tus.ts`, `restore.ts`, `service.ts`, `format.ts`, `gate.ts`), `apps/mobile/modules/scribe-keys/`, `apps/mobile/src/app/settings/backup.tsx`, `packages/content/src/features/backup.en.ts` | Merged, flag off. ADR 0024 section 6: the native module is excluded from autolinking and "has never been compiled". |
| Switch | `apps/mobile/src/lib/capabilities.ts` line 122 (`EXPO_PUBLIC_BACKUP`), `apps/mobile/app.config.ts` line 165 | `apps/mobile/eas.json` sets `"EXPO_PUBLIC_BACKUP": "off"` in all five profiles (lines 16, 34, 48, 62, 77). |
| Server kill switch | `backup_switch_on('backup')` in the migration; contract `packages/api/src/kill-switches.ts` (`backupUploads`, `escrow`) | Exists. Reading, restoring, discarding and deleting are never switched off. |
| Tests | `supabase/tests/audio_backup.test.mjs`, `audio_backup_escrow.test.mjs`, `audio_backup_purge.test.mjs`; `apps/mobile/test/backup-*.test.ts` named in ADR 0024 | Exist; run only in the local embedded database. |
| Docs | ADR 0024, ADR 0006 (amended), ADR 0005 (audio format), `docs/ops/BACKUP_RUNBOOK.md`, `docs/ops/runbooks/restore-drill.md`, `docs/ops/runbooks/staging-backup-free.md` (this one is the database dump for staging, not recordings) | Exist. |

## The design in plain words

1. **What is kept.** The recording only, as an encrypted file. The letter's words, dates, edits and the original's SHA-256 already travel by the sync path (NX-07, F16) under the sensitive-data consent. Backup adds no text. The original's hash is inside the encrypted file (ADR 0024 section 3, segment 0) and also on the letter row, so a restore can check the bytes.
2. **When.** After the letter row is on the server (`backup_begin` refuses a letter the server does not have), on Wi-Fi unless the person turned on cellular, with the app in the foreground, never while recording, reviewing or playing (ADR 0024 section 4 gates). No charging requirement in v1; section "Battery and data" explains why.
3. **How.** Seal on the phone, `backup_begin` reserves the exact size, resumable (tus) upload in 6 MiB parts with the person's own sign-in token, `backup_confirm` checks the stored size, then the letter shows "Kept safe". Every step is safe to repeat (ADR 0024 section 4, eight kill points tested).
4. **Where.** Private bucket `entry-audio`, one object per recording at `{child}/{author}/{entry}.m4a.enc`. Row level security: the author reads and writes only their own rows and paths; a pending row is required to write; confirmed objects are never replaced. The service-role key never reaches the phone (the phone holds the anon key and the person's token; `service_role` holds no table privilege on the backup tables, `supabase/tests/audio_backup.test.mjs`).
5. **Keys.** Not invented here. Per ADR 0024: a book key per (child, author) in the author's iCloud Keychain; a copy sealed on the phone to an escrow public key, openable only by the `escrow` function in the separate `scribe-escrow` project, with every use logged and emailed. The copy says only what that provides.
6. **New phone.** Sign in, the words arrive by sync, then recordings come back in the background, oldest first, on Wi-Fi, one at a time, each hashed against the letter before it is trusted. Until a recording arrives the letter shows the NX-07 audio-elsewhere line and no play button.
7. **Limits.** A fixed quota per account, a request rate limit and a cap on reservations in flight (all built), plus a cost watch that tells the founder before the plan's included storage runs out (new). At the quota the parent keeps recording and nothing is ever deleted.
8. **Stopping.** Withdrawing the backup consent stops new copies at the server, not just on the phone. Deleting the account purges rows and objects through the existing purge queue, idempotently.

## The check

Every row has a test title in "Trace and tests". "Fails on old code" states the tree's behaviour today (9 Nov), never the status of a pull request.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-34-R1 | EVIDENCE | Given the profile that builds the public release, When the build config is read, Then `EXPO_PUBLIC_BACKUP` is `on` only together with `EXPO_PUBLIC_SERVER_FEATURES` `on` and a bundled escrow public key, and the same profile in `development` and `preview` stays `off` unless a founder-signed line in `docs/release` says otherwise. | `apps/mobile/eas.json` has `"off"` in all 5 profiles today. | F19-REQ-025; ADR 0024 section 6 |
| NX-34-R2 | EVIDENCE (guard) | Given an Asha account with no Plus row, no subscription and an active `backup` consent, When it runs `backup_begin` then `backup_confirm` for a 1,000 byte recording, Then `state` is `confirmed`, `backup_usage.used_bytes` is 1000 and no entitlement is read. | Not a fail-first row. It passes today by design and pins D-111 item 6: it fails the day anyone adds an entitlement check. | D-111 item 6 |
| NX-34-R3 | EVIDENCE | Given an account whose `sensitive-data` consent was withdrawn (NX-08) and whose `backup` consent is active, When it runs `backup_begin`, and When it inserts into `entry-audio` at the path of an existing pending row, Then the first raises `SCCON` (detail `sensitive-data`), the second is refused by the Storage policy, and 0 new `audio_blobs` rows and 0 objects exist. | `backup_begin` and `backup_object_writable` check only `has_active_consent(uid, 'backup')` (migration lines 690 and 864, searched 9 Nov). A parent who stops syncing can still send audio for letters the server already holds. | NX-08; LEGAL-REQ-006 |
| NX-34-R4 | EVIDENCE | Given a new account (no `backup_usage` row), When `backup_begin` first runs, Then `quota_bytes` equals the founder's chosen free quota (B-1; the model uses 2 GiB, 2147483648 bytes, as the recommended option). Accounts that already have a row keep theirs. | The column default is 5368709120 (5 GiB, migration line 301). Only fails on old code if B-1 picks a value other than 5 GiB; if the founder keeps 5 GiB the row is a guard. | 06-nfr Backup write RPC row (5 GB per account) |
| NX-34-R5 | EVIDENCE | Given an account at its quota, When it runs `backup_begin` for a new recording, Then it raises `SCQTA`; 0 `audio_blobs` rows, 0 `storage.objects` and 0 `storage_purge_queue` rows change; reading and restoring every existing recording still works; and the phone shows `backup.quotaReached` while the letter stays "On this phone". | The raise exists (migration line 914); a test that proves nothing is deleted and reads still work is not named for it (`audio_backup.test.mjs` titles carry other ids). Add the bracket. | Never delete a parent's recording |
| NX-34-R6 | EVIDENCE | Given `ops_backup_footprint()` called by the service role, Then it returns total confirmed bytes, the count of accounts with backup rows, the count at 80% or more of their quota, and the count of reservations older than 24 hours, and nothing else (0 ids, 0 paths); called as `authenticated` or `anon` it raises `42501`. | No such function exists (searched `supabase/migrations`, 9 Nov). | DATA-REQ-048; section "Cost" |
| NX-34-R7 | EVIDENCE | Given a withdrawn `backup` consent, When the phone or a script tries a Storage insert, `backup_begin`, or `backup_confirm` for a new row, Then each is refused; Then reads and `backup_delete_all` still work; Then objects already stored are kept until the parent chooses "Delete the backup" or deletes the account. | Behaviour is built (`backup_object_writable`, migration line 685); no test names the stored-audio-stays half. | NX-08; ADR 0024 section 4 |
| NX-34-R8 | EVIDENCE | Given an account with 3 confirmed recordings and a deletion request, When `prepare_account_purge` and `finalize_account_deletion` run, and When they run a second time after a simulated crash between them, Then 0 `audio_blobs` rows, 0 `storage.objects` in `entry-audio` for that account, and every queue row `done_at` set; the second run changes 0 rows and raises nothing. | Purge exists (`audio_blobs_after_change`, migration line 534; `audio_backup_purge.test.mjs`); a second-run idempotency case after a crash is not named. | NX-04; DATA-REQ purge |
| NX-34-R9 | EVIDENCE | Given a letter deleted, then 30 days pass (`purge_due`), Then its `audio_blobs` row and object are gone, the id is in `purge_ledger`, and `backup_begin` for that id raises `SCDEL` (detail `purged`) forever. | Built; the 30-day path through `purge_due` is covered for entries, not named for audio. | DATA-REQ purge; NX-04 |
| NX-34-R10 | EVIDENCE | Given a downloaded recording whose bytes differ from the original's SHA-256 (one flipped bit), When restore checks it, Then the file is discarded, tried once more, then the letter shows "On the other phone" and no play button; 0 files are written at the final path. | Built in `restore.ts` (ADR 0024 section 4, restore step 3); never run against a real Storage (**U**, the tus and download path). | Integrity by the existing hash |
| NX-34-R11 | EVIDENCE | Given backup is blocked (offline, kill switch on, quota full, no key, signed out), When a parent records and keeps a 2-minute letter, Then the keep completes with the same steps and the local save commit p95 is within 200 ms (DATA-REQ-048); 0 recording code awaits the backup service. | Backup is off, so it has never been exercised alongside recording. The import graph test (`test/backup-gate.test.ts`) covers the flag, not the timing. | Offline-first |
| NX-34-R12 | EVIDENCE | Given every string a parent can read about backup (Settings row, screen, letter row, quota line, restore states), When the content rules run, Then none contains "sync", "upload", "bucket", "cloud", "server", "encrypt" outside the one counsel-approved sheet, an em dash, a count of what is left, or fear or loss words; the letter row says only "Kept safe" or "On this phone". | `backup.en.ts` has "Back up my recordings", "Backed up {date}", "Backing up"; the per-letter "Kept safe" and "On this phone" keys do not exist (searched 9 Nov). | BRAND.md glossary; CLAUDE.md content rules |
| NX-34-R13 | EVIDENCE | Given a new phone with 120 recordings on the server, When the parent signs in on Wi-Fi, Then the words appear first, recordings return oldest first one at a time, the Settings line shows a plain state ("Bringing your recordings to this phone"), a recording that cannot arrive yet shows "On the other phone", a kill at any point leaves no half file, and the next launch resumes. | Built (`restore.ts`); never run on a phone against a hosted project. | NX-07-R8; AL-06 |
| NX-34-R14 | EVIDENCE | Given 601 `backup_begin` calls in one hour, Then the 601st raises `SCRAT` (detail `begin`); given 20 pending reservations, Then the 21st raises `SCRAT` (detail `pending`); given a recording over 20 MiB of ciphertext (about 44 minutes), Then it is refused (`22023`) and the phone keeps it "On this phone" with `backup.someKeptHere`. | Built (migration lines 922 to 929 and the 20 MiB checks); add the brackets. A recording over 44 minutes is not backed up: **UNVERIFIED** whether the recorder caps a take below that (searched `apps/mobile/src/lib/capture`, found no maximum). | 06-nfr Backup write RPC row |
| NX-34-R15 | HYPOTHESIS | Given the first-enable burst of `06-nfr.md` section 16 (20 families, about 480 objects and 230 MB each) on the throwaway project, When the 1-hour G4 run executes, Then it passes. This row states no latency of its own. | G4 has no evidence file (NX-07-R6). | Feasibility R12 |
| NX-34-R16 | HYPOTHESIS | Given the label review, When the build 12 label is filled, Then 'Audio Data', linked to the user, not used for tracking, purpose App Functionality, is declared in the same release that turns the flag on (LEGAL-REQ-042). Test: none, review (`privacy`, counsel). | `docs/legal/app-store-privacy-labels.md` line 55 says "No until backup ships, then Yes". | Effect on the label |

## Door lines (a person agrees to something)

The existing sheet (`backup.sheetBody`, `backup.turnOnButton`) is the door. Free does not remove it: ENGINEERING_REQUIREMENTS line 509 says backup is off until the owner turns it on, from one sheet in words counsel approves, and `has_active_consent(uid, 'backup')` is checked on the server. Free changes the price, not the consent. The wording below states what the sheet must still do; counsel owns the words.

**Shown:** one sheet, before anything leaves the phone, in this order: that this is free; that recordings are encrypted on this phone first; that we keep a recovery key so they can come back on a new phone and use it only through a logged service that emails the owner each time; that we never listen to, sell or use them to train models; that other family members cannot hear them yet; what stays if they turn it off. Uses the existing `backup.sheetBody` and `backup.sheetNotIncluded`; the "this is free" line is `new` and `content` writes it (D-111 item 6 allows it). No fear or urgency, no count of what is left.
**Records:** one `policy_acceptances` row for document `backup`, action `accept`, with the version, method, surface, build, OS major, platform, language and the hash of the sheet shown (PRIV-R21, BL-577 fields). Withdrawal records `withdraw` on the same document through the existing consent path (the `backup` document has `needs_affirmative_act` true, migration line 142).
**Never:** send a byte before the act is recorded; pre-tick; bundle with Terms or with the sensitive-data consent; start on sign-in; claim "end-to-end", "only you can play them", "only your family's keys", or an unscoped "every use is logged" (`apps/mobile/test/backup-copy.test.ts` refuses these).
**Decline and withdraw:** Declining leaves the app whole: record, keep, read, export, and the phone's own iCloud device backup (D-033). "Turn off backup" stops new copies at once and says what stays ("What's backed up stays, and can come back on a new phone": `backup.offBody`). "Delete the backup" removes the parent's stored recordings after a count and a fresh sign-in (`backup_delete_all(p_expected_confirmed)`, sign-in within 10 minutes). Turning off never deletes a recording that exists only in the backup without a prompt that offers to bring it to the phone first (06-nfr "Backup is never the only copy deleted without a prompt", F08-REQ-035).

### Is the child's voice covered by the sensitive-data consent today?

No. The `sensitive-data` text (`docs/legal/POLICY_VERSIONING.md` line 20) is about "health and other sensitive details" in letters. Nothing in NX-08 or in `sensitive-row.ts` mentions audio. Audio of a child's voice therefore rests on its own `backup` consent. Because a recording only goes up for a letter the server holds, the server must also require the sensitive-data consent (R3), so that NX-08's "Stop syncing" really stops audio too. Whether a child's voice is itself "sensitive" or a "biometric" category is a counsel question (B-5), not a conclusion here.

## Resumable upload, failure and retry

- tus resumable endpoint, 6 MiB parts, the person's token; `x-upsert: true` only while the row is `pending`. A 2-minute letter is about 0.96 MB (see Cost), one part. Budget: a 2-minute letter on Wi-Fi in 10 s (06-nfr Storage upload row, marked [A], an assumption).
- Wi-Fi is checked before every part; leaving Wi-Fi stops at the next part and resumes from the saved offset.
- A refused step backs off; after 8 refusals in a row (`write_rpc.maxAttempts`) the recording rests until the next launch. A Storage 400, 401 or 403 sends the job back to begin again, not into a loop.
- `SCCON`, `SCQTA`, `SCBKO` (kill switch), `SCDEL` (deleted or deleting) pause or end the job without data loss; the letter stays "On this phone".
- A reservation not finished in 24 hours is dropped by the daily sweep (`backup_svc_sweep`), which releases its quota.
- After a server restore, a recording the phone believes confirmed but the server no longer lists goes again (F08-U30). This matters for plan F4: Supabase's database backups and PITR do not include Storage objects (see Plan).

## Storage layout and rules

- Bucket `entry-audio`: private, 20971520 byte limit, `application/octet-stream` only (migration line 677). Path `{child_id}/{author_id}/{entry_id}.m4a.enc`, enforced by a check constraint. (The suffix says `.m4a` although iOS now records ADTS `.aac`, ADR 0027; the file inside is encrypted, so the suffix is a label only. Left alone: renaming would break the constraint and every stored path.)
- Per account and per child by construction: the first path segment is the book, the second the author. `entry_audio_owner_read` allows only paths of the caller's own `audio_blobs` rows; the restrictive `entry_audio_no_anonymous` blocks anonymous sessions. Another parent of the same book cannot read it in v1 (owner-only, D-073).
- Service role: holds no table privilege on the backup tables. Only `backup_svc_stop`, `backup_svc_sweep`, `backup_svc_unwraps_between` and the purge worker functions are executable by it (`supabase/tests/grants.mjs` `SERVICE_ROLE_FUNCTIONS`). The key never ships in the app; the phone has the anon key and the person's token.

## Encryption, and who holds what

| Layer | What the repo says | What Supabase says |
|---|---|---|
| In transit | The phone talks to Storage over HTTPS | "accept only HTTPS connections using TLS 1.2 or TLS 1.3", Supabase platform security page, read 9 Nov 2026 (https://supabase.com/docs/guides/security/platform-security). That sentence covers the HTTP APIs, which the page lists as including Storage. |
| Before it leaves the phone | AES-256-GCM per recording, file key wrapped by the book key (ADR 0024 sections 2 and 3). The server stores ciphertext only (06-nfr line 322 test: zero plaintext audio bytes in any request). | Not applicable. |
| At rest on the provider | Not claimed by us beyond the above. | **UNVERIFIED.** The platform security page and the Storage ownership page, both read 9 Nov, say nothing about encryption at rest. Do not write "encrypted at rest by Supabase" anywhere until `security-architect` reads Supabase's own statement. The recordings are ciphertext before they arrive, so the claim is not needed for the file contents. |
| Keys | Book key: author's iCloud Keychain. Device key: that phone's Keychain, never synced. Escrow wrap: sealed on the phone to the escrow public key; only the `escrow` function in `scribe-escrow` can open it, logging each use (append-only `escrow_unwraps`, copied daily to `ops-ledger`). | Supabase holds no key to the recordings. ADR 0024 section 5 states the honest limit: someone holding the escrow private key plus copies of the database and bucket could open recordings offline with no log. |

No new custody scheme is proposed. ADR 0024 stays Proposed in its header; it needs the founder's yes before the flag turns on (B-4).

## Restore on a new phone

- Words and the edit list first, by sync (NX-07-R1). Recordings after, by `restore.ts`.
- Default: restore all, in the background, oldest first, one download at a time, Wi-Fi unless cellular is on, foreground only. A recording is bytes-checked against the letter's own hash before it is trusted. A file already on the phone is never overwritten (a different one is kept and flagged).
- Option not built: restore a recording only when the parent taps play. Not recommended: it needs a play-time download decision on cellular, and a year of recordings is about 230 MB (Cost), small enough to bring back whole.
- Progress: a plain line in Settings ("Bringing your recordings to this phone", `backup.restoreLooking`); the letter row says "On the other phone" until its file lands, then plays. Never a count of what is missing.
- Partial states: some arrived and some waiting on a key (`backup.restoreWaiting`); stopped by the parent (`restoreStopped`); signed out (`restoreSignInAgain`). A killed run leaves no half file and resumes.
- A new phone asks escrow for the book key unless iCloud Keychain brings it within 2 minutes. Holds: 72 hours if another enrolled phone exists, 24 hours if none; limits 3 new-device restores per account per rolling 30 days (ADR 0024 section 5). A parent who loses their only phone and their iCloud Keychain waits up to 24 hours: say so plainly (`restoreWaiting` does).

## What the screen says (parent vocabulary only)

Per letter: "Kept safe" (confirmed copy) and "On this phone" (not yet, or never). On a phone without the file: the NX-07 line "On the other phone". Settings row: the existing "Back up my recordings" with On or Off, and the quiet states already in `backup.en.ts` (`backingUp`, `waitingWifi`, `paused`, `lastBackedUp`). No "sync", "upload", "bucket", "cloud", "server" or "encrypted" except on the counsel-approved sheet. Whether "Back up" is a glossary word is `content`'s call against BRAND.md (CR-25). New keys, all `new` unless marked: `backup.letter.keptSafe`, `backup.letter.onThisPhone`, `backup.sheetFree`. Existing and reused: `backup.title`, `quotaReached`, `someKeptHere`, `waitingWifi`, `paused`, `offBody`, `restoreLooking`, `restoreWaiting`. A registered string is flagged for counsel: the sheet body and `sheetFree`.

At the quota the person sees `backup.quotaReached` ("New recordings are not being backed up. Write to us and we'll help.") and `Write to us`. Recording, keeping, reading and exporting carry on. Their older recordings stay kept safe. Nothing is deleted. That line says nothing about price or Plus (D-111 item 6, and no hint of a paywall: the quota is a safety limit, not a sales moment). If the founder later picks option C below, the sentence about Plus is new copy and needs `product`, `content` and counsel.

## Retention

Kept until: the parent turns on "Delete the backup"; the letter is erased or its 30-day deleted period ends; the book is deleted; or the account is deleted (30-day purge, NX-04). Turning backup off keeps what is stored. An account that goes quiet keeps its recordings; no inactivity deletion is proposed (it would delete a parent's recording; the model shows the cost of keeping is cents). Legal holds are respected by the backup delete paths (`backup_row_held`, migration line 197). `purge_ledger` keeps ids only. Retention of `escrow_unwraps` is 24 months (ADR 0024 section 5).

## Battery and data

- Foreground only, so no background battery drain by design. Cost of that choice: a parent who rarely opens the app after recording sees "On this phone" longer. A background task is out of scope for v1 and would be a new requirement (iOS background limits, **U**).
- No "charging only" rule: a 2-minute letter is about 1 MB, a seal and a single upload, and the work happens while the app is already open. A first-enable backlog of a year (about 480 objects, 230 MB per 06-nfr section 16) runs one at a time on Wi-Fi; `mobile` measures the battery and heat cost of the backlog on the iPhone SE 3 (new device row) before the flag turns on.
- Cellular is off by default (`backup.cellularTitle`); when on, the same limits apply.
- Tus part size 6 MiB; the phone's data use is the file size plus about 0.03% overhead (below).

## Offline-first guarantee

Recording, keeping, reading and exporting never wait on backup. The only entry from the rest of the app is `lib/backup/gate.ts`; with the flag off the native module is never looked up. With the flag on, a backup state of blocked, waiting or failed changes only the letter's second line (R11). Server writes go through the outbox pattern of NX-07; the backup queue lives in its own `backup.db` per account and is rebuilt from the letters and `audio_blobs`.

## Abuse limits so free cannot be abused

Built, per account: quota (5 GiB column default today); 600 `backup_begin` per rolling hour; 20 reservations in flight; 20 MiB per object; author-only paths; 20 books created per person per day (D-111 item 8); anonymous sessions blocked. New: `ops_backup_footprint()` for the cost watch (R6) and an alert at 70% of the plan's included storage. Not built and not proposed here: per-IP limits (belongs to NX-02 and the sign-in work). Worst case from one hostile account at the quota: 5 GiB x $0.0213 = about $0.11 a month, 2 GiB = about $0.05 (Cost). A farm of 1,000 hostile accounts at 5 GiB: about $114 a month, bounded by how many accounts can be created, which Apple and email sign-in and NX-02 limit. The `backupUploads` switch stops all uploads at once.

## Cost model

### Facts read today

- Recorder: AAC-LC, mono, 64 kbps, 48 kHz (`apps/mobile/src/lib/capture/recorder.ts` header comment and ADR 0005). 64,000 bits per second = 8,000 bytes per second = **480,000 bytes per minute = 0.48 MB per minute** (decimal MB). The file comment in `recorder.ts` agrees ("0.48 MB/min"). iOS now writes ADTS (ADR 0027); the codec and bitrate are the same.
- Encrypted object overhead: a 112 byte header, a 64 byte first segment, and 16 bytes per 64 KiB segment (ADR 0024 section 3): about 0.03%. Ignored below.
- Largest object: 20 MiB = about 43.7 minutes of audio. Free quota options: 2 GiB = 4,474 minutes = 74.6 hours; 5 GiB = 11,185 minutes = 186.4 hours.
- Supabase prices, read 9 Nov 2026 at https://supabase.com/pricing: Pro "From $25" a month; file storage 100 GB included then $0.0213 per GB; egress 250 GB included then $0.09 per GB; cached egress 250 GB then $0.03 per GB; PITR add-on $100 a month per 7 days of retention; Pro spend cap on by default and can be turned off. Free plan: 1 GB storage, 5 GB egress. Max file upload shown as 50 MB on Free, 500 GB on Pro. Storage billing, read at https://supabase.com/docs/guides/platform/manage-your-usage/storage-size on 9 Nov: charged in GB-hours at $0.00002919 per GB-hour (stated as $0.0213 per GB a month), averaged over the billing period, only usage over the plan's quota is charged. Whether a GB is 1000 MB or 1024 MB: **UNVERIFIED**; the model uses 1 GB = 1000 MB, which is the cautious side by about 7% on the plan's included amount.
- The cost of an object that was deleted: **UNVERIFIED** (the page does not say).
- Database size for the metadata is negligible: one `audio_blobs` row is a few hundred bytes (about 0.3 KB, an estimate).

### Assumptions (written down; each is mine unless marked)

| # | Assumption | Basis |
|---|---|---|
| A1 | Base family records 40 minutes a month of spoken letters. Low: 20. Heavy: 120 (30 minutes a week). | 40 is TDD 06 section 4.1 [A]; low and heavy are mine |
| A2 | Share of active families that turn backup on: 60% base, 100% for the ceiling. | Mine. Free and one sheet; ARCHITECTURE used 50% when it was Plus-only |
| A3 | Families keep recording and keep their backup for the whole period; none leave. | Mine; overstates cost (no churn, no purge) |
| A4 | All families are the same age (all started at month 0). | Mine; overstates cost against a ramp |
| A5 | Restores: 5% of families restore their full history in a year. | TDD 06 section 4.2 [A] |
| A6 | Storage is billed on average GB over the month; no deletes. | Supabase page above |

### Per family

| | 40 min/month, after 12 months | 40 min, 36 months | 120 min, 36 months |
|---|---|---|---|
| Added a month | 19.2 MB | 19.2 MB | 57.6 MB |
| Stored | 0.230 GB | 0.691 GB | 2.074 GB |
| Storage cost a month, if all of it is billed (over the included amount) | $0.0049 | $0.0147 | $0.0442 |
| One full restore (egress, if over the included amount) | $0.021 | $0.062 | $0.187 |

So, per active family per month: **about half a cent after a year, about a cent and a half after three years, about four cents for a heavy family after three years**, and **$0 marginal while the project is under the 100 GB included**. This is storage and egress only. The $25 plan fee, compute, PITR and the escrow project are fixed costs shared by everything and are not attributed to backup.

### Fleet (A2 60%, A3, A4; storage only, over 100 GB at $0.0213)

| Families | 40 min, 12 months | 40 min, 36 months | 100% on, 120 min, 36 months (ceiling) |
|---|---|---|---|
| 100 | 13.8 GB, $0 | 41.5 GB, $0 | 207.4 GB, $2.29 a month |
| 1,000 | 138.2 GB, $0.81 a month | 414.7 GB, $6.70 a month | 2,073.6 GB, $42.04 a month |
| 10,000 | 1,382.4 GB, $27.32 a month | 4,147.2 GB, $86.21 a month | 20,736 GB, $439.55 a month |

Reading the table: 100 families cost $0 in the base case and about $2.29 a month at the ceiling. All figures are storage over the included 100 GB, no churn (A3, A4), so they lean high.

Egress: restores at 5% of families a year are about 0.05 x F x 0.23 GB. At 10,000 families that is about 115 GB a year, inside the 250 GB included a month. A launch-month spike (10% of 10,000 families restoring at once, 1,000 x 0.23 GB = 230 GB) would still fit. Playback of backed-up audio is not in this theme (owner-only, D-073), so no playback egress.

### Break-even and options

- Under the plan's included 100 GB, free costs $0 extra. At the base case (A1, A2, A3, A4) the included storage runs out at: 1,000 families in month 8.7; 10,000 families in month 0.9 (about 4 weeks); 100 families never within three years. At 100% on and 120 minutes: 1,000 families in month 1.7, 10,000 in month 0.2.
- After that every extra GB is $0.0213 a month, forever, so cost grows with age, not with signups. Free pays for itself against a Plus price only if a recording-heavy family converts; this file has no conversion data (HYPOTHESIS, `product` to size, not me).
- Worst case per account is bounded by the quota: 5 GiB = $0.114 a month; 2 GiB = $0.046 a month.

Options for the founder (B-1). I recommend; I do not decide.

| Option | What the parent gets | Worst case per account a month | Cost at 10,000 families, 36 months, base case | Notes |
|---|---|---|---|---|
| A. As built | Free, 5 GiB (186 hours) | $0.114 | $86 | No migration. A later cut would be unkind: lowering a quota on existing accounts stops their backup. |
| B. Free, 2 GiB (74.6 hours) for accounts created from build 12; raise later by support or a forward migration | Free, about 7 years at A1 | $0.046 | $86 (base case does not reach 2 GiB) | One small migration changes the column default for new rows only. Raising later is kind; lowering later is not, so start lower. **Recommended.** |
| C. First N hours free, then Plus (for example N = 50, 1.44 GB) | Free to 50 hours, more with Plus | Free part $0.031; Plus part unbounded unless capped | Same | Needs a server proof of Plus (Q-008 option (c) in the old plan; `payments` confirms what exists), copy that mentions Plus at the limit, and counsel on a paywall around a child's voice. Contradicts the plain reading of D-111 item 6 unless the founder amends it. Not recommended for launch. |
| D. Free forever, no cap | Unlimited | Unbounded | Unbounded | Not recommended. Cost is the only reason for the quota; abuse is the other. |

Why B: a 5 GiB cap is 23 years of the base family's speech and protects nothing; 2 GiB is still 7 years, 5 times a heavy family's first year, and the cost watch plus support can raise it for anyone who reaches it. The quota is a safety limit, and the line at the limit never mentions money.

### What must be true about the Supabase plan (F4)

- Production runs on Pro, not Free. Free has 1 GB of storage (`pricing`, 9 Nov) and no backups; the staging backup runbook says Free includes none. One year of 100 families is 13.8 GB, so Free cannot hold this.
- PITR is on (F4: Pro with PITR; $100 a month for 7 days, `pricing`, 9 Nov). The backup docs say "PITR is available on all compute sizes" (https://supabase.com/docs/guides/platform/backups, 9 Nov); older notes in the repo (TDD 06 section 4.3) assumed otherwise, so `ops` reads the dashboard at the time.
- **Neither daily backups nor PITR include Storage objects.** The backups page, read 9 Nov: "Database backups do not include objects you store via the Storage API," and an old backup does not bring back deleted objects. So a database restore recovers `audio_blobs` rows but not ciphertext deleted or lost. The phone re-uploads what the server no longer lists (F08-U30), which is the only recovery for a lost object when the phone still has the file. For a lost phone and a lost object there is no second copy. Options for the founder to weigh (B-3): accept and say so internally; or a second-provider ciphertext copy (TDD 06 OQ-4, about $20 a month at 10,000 families by that file's estimate, provider **UNVERIFIED**). Not decided here.
- The spend cap is on by default on Pro. Whether a cap blocks Storage overage, and what uploads do when it trips, is **UNVERIFIED**. Until read, the phone treats a refused upload as "wait" (it does, `SCBKO` and the 400/401/403 rules), so a tripped cap shows "On this phone", not an error. The founder decides cap on or off (B-3); with it on, the cost watch alert at 70% of the included 100 GB should fire first.
- The escrow project is separate. Its plan and cost are not in this model (**UNVERIFIED**; ADR 0024 requires it exist for restore).
- The production project is not the throwaway project. The migration reaches production only from CI on a tag (D-041).

## Effect on the App Privacy label and on D-033

- Label: with the flag on in the shipped build, Data Linked to You gains **Audio Data** (user's voice or sound recordings, `docs/legal/app-store-privacy-labels.md` line 55 and section 80) for App Functionality, linked to the user, not used for tracking. The doc also adds Device ID for backup (`backup_devices` holds a random device id and a public key; `privacy` confirms). The label must change in the same release that turns the flag on, not after (LEGAL-REQ-042). If build 12 ships with the flag off, the label stays as is; a later build that turns it on takes the label change with it. `privacy` owns the labels; this file only states the dependency.
- D-033 (Recommended, needs founder OK): the phone's own iCloud device backup stays; this feature is the free second copy that works when the parent has no iCloud space or a new phone with no iCloud backup. The D-033 sentence "on this phone and in your iPhone's own backup, if you use one" and the new letter state "Kept safe" must not contradict: "Kept safe" means our confirmed copy only; `content` reconciles. Recordings in `Documents` stay in the device backup; the ciphertext in `backup-tmp/` is excluded from it (ADR 0024 section 3).

## Counsel questions (questions only; no conclusions)

1. A young child's voice recorded by a parent and stored by us: does any children's-data rule treat it differently, even though the account holder is an adult and the app is for adults (18 and over)? (Frame: COPPA and state children's privacy laws as the reason to ask, not as a view.)
2. Is a child's voice a "biometric identifier" or "sensitive" category under any state law we are exposed to (California, Illinois, Texas, Washington, Connecticut), given we do not analyse it for identity?
3. Does the `backup` consent act need to be separate from the `sensitive-data` consent, or may one sheet carry both? Today they are two documents.
4. CCPA/CPRA: is the recording "personal information" we must list for deletion and access, and does the 30-day purge and the 60-day forget (D-111 item 7) meet the timing?
5. The recovery key we hold (D-102): is the sentence "we use it only through our recovery service, which logs every use and emails you each time" fair, given the offline limit in ADR 0024 section 5? (Counsel packet Q42 already holds backup with escrow.)
6. Is a free feature without a payment attached any different for consent or label purposes?
7. If the founder chooses option C later, does limiting storage of a child's voice behind a subscription raise any issue?
8. Supabase as a processor for audio ciphertext: is `docs/legal/subprocessors.md` complete, and is the escrow project a separate processor line?

## Migrations and grants needed

One new migration, additive, named by `data-architect` with the next timestamp after the newest on `develop` (today the newest in the tree is `20261028010000_invite_redeem_by_code.sql`; the migration guard fails a file that sorts before the newest applied one). Contents:

1. `backup_begin` and `backup_object_writable`: add `has_active_consent(uid, 'sensitive-data')` next to the `backup` check (R3). `create or replace`, same signatures, grants unchanged.
2. If B-1 is option B: `alter table public.backup_usage alter column quota_bytes set default 2147483648`. Existing rows untouched.
3. New function `public.ops_backup_footprint()` (security definer, `search_path` pinned), returning counts and byte totals only. `revoke all ... from public, anon, authenticated`; `grant execute ... to service_role`. Add `'ops_backup_footprint()'` to `SERVICE_ROLE_FUNCTIONS` in `supabase/tests/grants.mjs` in the same PR (CLAUDE.md rule on grants). An access-matrix cell: `authenticated` and `anon` denied with `42501` (the deny test).
4. No new column and no new table, so no classification label to add (DATA-REQ-001, -002); `supabase/tests/classification.test.mjs` must stay green. If a column is added later it carries its class and level in the same PR. Existing labels for the backup tables are already in the migration comments (`audio_blobs` L3 and L4, `backup_usage` L2).
5. Index and query budget: `audio_blobs_author_idx (author_id, state)` serves the phone's list (pages of 500, ordered by creation time) and the pending-count check; `audio_blobs_child_idx` and `audio_blobs_key_idx` serve cascades. `ops_backup_footprint()` is a single aggregate over `backup_usage` and `audio_blobs`: run it from the daily ops job, not per request; at 10,000 accounts and about 7 million rows by year 3 (10,000 x 40 min / 2 min x 36) it should be a sequential scan of a few seconds on the service role; `data-architect` states the measured plan in the PR (**not measured today**). Server reads must stay under the budgets in 06-nfr (backup RPCs 500 ms p50 and 1.2 s p95).
6. PR body says: touches `supabase/**`, needs red-team review and the founder's `approve-migration` label (D-041). `data-architect` never adds the label and never applies anything to a remote project.

## Rollout flag and rollback

- Flag: `EXPO_PUBLIC_BACKUP=on` in the build 12 profile only with the gates in R1, plus the server `backup` kill switch `backupUploads` for an instant stop and `escrow` for the restore side (60 second cache, LEGAL-REQ-040).
- Order: migration applied to the throwaway project, restore drill AL-06 passes on two phones (NX-07-R8, DL-03), counsel signs the sheet and the label, founder yes on ADR 0024, then the production migration through CI on a tag, then a build with the flag on.
- Rollback: switch `backupUploads` off (uploads stop, reads, restores and deletes keep working), then a forward fix. A build with the flag off hides the row and never touches the native module. Stored ciphertext stays until the parent deletes it. Never drop `entry-audio` or its rows as a rollback.

## Edge cases

Two phones of one author racing to make the book key (settled by the key check, ADR 0024 rule 3); a second account on one phone (own `backup-<profile>.db`); a letter erased while its upload is pending (`SCDEL`); a letter in Recently deleted (`backup_begin` refuses until restored); iCloud Keychain off; a recording changed after capture (never sent); disk full while restoring; clock change; a device with iOS below 17 (backup reports unsupported, `isSupported()` false, ADR 0024 section 7); the Swift module not compiling (the flag stays off).

## Analytics events (opt-in, content-free)

None new. `restore_result` and `sync_failed` are in the catalog (NX-07). Backup uploads send no analytics event; nothing is sent in 1.0 (D-124). The cost watch is server side and counts only.

## Device rows

Existing: AL-06 (restore drill), DL-03, B2-4, S1-22, S1-28. New, placeholders for `qa` to number: "backup on, Wi-Fi, record 3 letters, each shows Kept safe"; "airplane mode while recording, nothing blocks"; "kill the app mid-upload, relaunch, one confirmed copy"; "new phone shows words, then recordings oldest first"; "turn backup off, then delete the backup with the count"; "quota reached shows the quiet line and recording continues"; "battery and heat of a 480 recording first backup on the iPhone SE 3". Scan of open pull requests on 9 Nov (GitHub REST, titles only; the patch contents were not read, because the connector blocked the patch listing): #622 and #685 are about the staging and production database dump, not recordings; no open pull request title mentions audio backup. A patch-level scan is still to do before the PR (`qa`).

## Owner lanes

| Lane | Owns |
|---|---|
| `data-architect` | The migration, grants, access-matrix cells, the footprint function, R3 to R9 and R14 tests |
| `mobile` | Flag in the profile (R1), "Kept safe" and "On this phone" states, R10, R11, R13 tests, battery measurement, the Swift module compile |
| `sync` | Pull-row contract if audio-elsewhere needs a field (NX-07) |
| `ops` | The cost watch and alert at 70% of included storage, Pro with PITR, the production project, the escrow project and ceremony runbook |
| `security-architect` | The Supabase at-rest statement, key custody review, red-team of the migration |
| `privacy` | The label, the data map rows, the classification, counsel packet |
| `content` | The three new keys and the free line; counsel for the sheet |
| `product` | OPEN-02 reconciliation, option B/C, any Plus copy |
| `qa` | Device rows, the two-phone drill, the trace |
| Founder | B-1 to B-4, the `approve-migration` label, the two phones |

## Engineering block

| Line | This theme |
|---|---|
| API contract (`packages/api`) | Existing: `backup_begin`, `backup_confirm`, `backup_discard`, `backup_delete_all`, restore and key routes. No new type. `ops_backup_footprint` is a service-role function and has no client contract. |
| Budget (`06-nfr.md`) | Backup write RPC 500 ms p50 and 1.2 s p95; 600 begin a call per account an hour; 5 GB per account (changes with B-1, `06-nfr` row to update by `product`); Storage upload of a 2-minute letter on Wi-Fi in 10 s [A]; local save commit p95 200 ms (DATA-REQ-048, client side); G4 load run with the first-enable burst. |
| Accessibility | "Kept safe" and "On this phone" are text, not colour or an icon alone; AX5 with 0 clipped lines; VoiceOver reads the state with the letter; Reduce Motion: no motion in the progress line. |
| Switch, off behaviour, noticed by | `EXPO_PUBLIC_BACKUP`, `backupUploads`, `escrow`. Off: uploads wait, restores continue, the letter stays "On this phone". Noticed by: `ops_backup_footprint`, `ops-health` rejected writes, purge backlog. Rollback as above. |
| Data class and retention | Audio ciphertext L4 (`entry-audio`), `audio_blobs` L3 and L4 wrapped keys, `backup_usage` L2, `child_keys` L4 wrapped, `escrow_unwraps` L3 (06-nfr line 352). Retention as in "Retention". |
| Schema and grants | As in "Migrations and grants needed". |
| Analytics events | None new. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path. Existing files get a bracket added to an existing test where the behaviour is already tested.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-34-R1 | F19-REQ-025 | mobile unit (proposed `apps/mobile/test/backup-profile.test.ts`); `[NX-34-R1] the public release profile turns backup on only with server features on and a bundled escrow key` | none |
| NX-34-R2 | D-111 item 6 | db test (add to `supabase/tests/audio_backup.test.mjs`); `[NX-34-R2] an account with no Plus and no subscription completes backup_begin and backup_confirm` | none |
| NX-34-R3 | LEGAL-REQ-006; NX-08 | db test (proposed `supabase/tests/audio_backup_consent.test.mjs`); `[NX-34-R3] withdrawn sensitive-data stops backup_begin and the Storage insert` | none |
| NX-34-R4 | 06-nfr Backup write RPC | db test (same file as R3); `[NX-34-R4] a new account gets the chosen free quota and an old account keeps its own` | none |
| NX-34-R5 | F08 6.5 F | db test (`audio_backup.test.mjs`); `[NX-34-R5] at the quota nothing is deleted and reads still work` | quota device row |
| NX-34-R6 | DATA-REQ-048 | db test (`audio_backup.test.mjs`) and `supabase/tests/grants.mjs`; `[NX-34-R6] ops_backup_footprint answers the service role only and returns no ids` | ops: daily job output |
| NX-34-R7 | NX-08 | db test (`audio_backup_consent.test.mjs`); `[NX-34-R7] withdrawn backup consent blocks new copies, keeps stored ones, and delete still works` | turn-off device row |
| NX-34-R8 | DATA-REQ purge; NX-04 | db test (`audio_backup_purge.test.mjs`); `[NX-34-R8] account purge run twice after a crash leaves 0 rows and 0 objects` | DL-05 |
| NX-34-R9 | DATA-REQ purge | db test (`audio_backup_purge.test.mjs`); `[NX-34-R9] the 30-day purge removes the recording and refuses its id forever` | none |
| NX-34-R10 | F08-U20 | mobile unit (`apps/mobile/test/backup-restore.test.ts`); `[NX-34-R10] a restored file whose hash differs is discarded and the letter shows On the other phone` | AL-06 |
| NX-34-R11 | DATA-REQ-048 | mobile unit (proposed `apps/mobile/test/backup-offline-first.test.ts`); `[NX-34-R11] keeping a letter never waits on backup in any blocked state` | airplane-mode row |
| NX-34-R12 | CR-25; content rules | content test (`packages/content/test/rules.test.ts` or `apps/mobile/test/backup-copy.test.ts`); `[NX-34-R12] backup strings use parent words only` | none |
| NX-34-R13 | NX-07-R8; F08 6.5 B | restore drill `docs/ops/runbooks/restore-drill.md`; Test: none, drill | AL-06, new restore row |
| NX-34-R14 | 06-nfr Backup write RPC | db test (`audio_backup.test.mjs`); `[NX-34-R14] the 601st begin, the 21st pending and an over-limit object are refused` | none |
| NX-34-R15 | feasibility R12 | k6 scenario on the throwaway project; `[NX-34-R15] G4 load run with the first-enable burst passes` | none |
| NX-34-R16 | LEGAL-REQ-042 | Test: none, review (`privacy`, counsel) | none |

Trace: NX-34-R1..R16 -> F08, F08-REQ-025, -031, -033, -035, -039, F16, F17, F19-REQ-025, DATA-REQ-001, -002, -048, LEGAL-REQ-006, -024, -042, AL-06, DL-03.

## Founder-only decisions and Blocked on

Blocked on (the file stays "not ready" until answered; everything else is finished):

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | Free quota per account: A (5 GiB as built), B (2 GiB for new accounts), C (N hours then Plus), D (none) | Founder | B | R4, copy at the limit |
| B-2 | Does free mean the sheet still appears and is opt-in, or on by default with the consent at sign-up? | Founder, counsel | Opt-in from the one sheet; free removes the price, not the consent (ENGINEERING_REQUIREMENTS line 509) | R1, door lines |
| B-3 | Pro with PITR confirmed (F4); spend cap on or off; accept that Storage objects have no Supabase-side backup or add a second copy | Founder | Pro and PITR yes; cap on with the 70% alert; accept for build 12, revisit at 1,000 families | Plan section |
| B-4 | Yes to ADR 0024 (Proposed), the escrow ceremony and the separate `scribe-escrow` project for production | Founder, `security-architect` | Yes, before the flag; without it the app fails closed and backup cannot turn on | R1, R13 |
| B-5 | Counsel on a child's voice (questions 1 to 8) | Counsel | Hold the flag off in the first public build if answers are not back; the app is whole without it | R16, door lines |

Also the founder's: the `approve-migration` label; the two phones; OPEN-02 wording (`product`).

## Not verified

- Supabase encryption at rest (neither page read says anything). The stored cost of deleted objects. Whether a GB is 1000 or 1024 MB. Whether the spend cap blocks Storage overage. Whether PITR needs a compute size (the backups page read today says all sizes; older repo notes disagree). The escrow project's plan and cost. Any second-provider copy price.
- The tus path and download path on a real Storage (ADR 0024 marks it **U**); the Swift module has never been compiled; battery, heat and time of the first backup on the iPhone SE 3; whether the recorder caps a take below 44 minutes.
- All uptake, minutes and retention numbers are assumptions A1 to A6, not data. The 7 million row figure is arithmetic on them.
- Open pull request patches were not read.
