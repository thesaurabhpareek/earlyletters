# F16 Sync, devices and restore

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 11 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P6 Future reader (durability) |
| Existing IDs | A-REQ-015, A-REQ-032, A-REQ-033, B-NFR-003, B-NFR-009, PRD-REQ-004, PRD-REQ-014, DATA-REQ-010, DATA-REQ-011, DATA-REQ-013, DATA-REQ-023, DATA-REQ-030, DATA-REQ-031, DATA-REQ-032, DATA-REQ-040 to DATA-REQ-046, LEGAL-REQ-001, LEGAL-REQ-006, LEGAL-REQ-009, LEGAL-REQ-014, LEGAL-REQ-024, LEGAL-REQ-032, LEGAL-REQ-040; K-39; D-023, D-024, D-033, D-035, D-041; PRD 7.2, 7.3, 7.4, 7.8; ADR 0004; BL-022, BL-052, BL-107, BL-111, BL-173, BL-174, BL-175, BL-177, BL-236, BL-244, BL-247, BL-282 |
| Depends on | F02 (account, session, re-ownership), F17 (consents), F19 (remote config `sync_enabled`), F11 and F12 (what is shared), F08 (audio stays local) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [S] Across 104 negative or mixed reviews of 11 memory and journal products, 41 (39%) are about bugs, crashes, sync or lost work; 9 describe work that vanished [S] R2 section 0 item 1. Sync overwriting work across devices is one of the named stories, mostly at Day One [S] R2-S16, theme T8.
- [F] Upload resilience is a fix competitors shipped late: FirstChapter added retry and background upload in v1.0.6; FamilyAlbum users report uploads stop when the app closes; earlier StoryCorps versions lost uploads [F] R1-S4, [S] R1-S12, R1-S31.
- [F] Letters are author-owned and `raw_transcript` is immutable by trigger, so write conflicts are rare and narrow [F] `supabase/migrations/20261002020000_data_governance.sql` (`entries_guard_immutable`); TDD 10 section 2.
- [F] Under a sync engine that treats the server as truth for downloaded rows, a database restore could delete the newest letters from every device [F] TDD 06 P-1.
- [D] D-023 recommends outbox push and cursor pull on the expo-sqlite store the app already ships, one visibility predicate `book_access` (D-024), and a restore epoch. Founder answer due 16 Oct; this spec builds the default (`09-decisions-and-risks.md`, "Still open").
- [D] No audio leaves the phone in v1.0 (B7). Text, edits and metadata sync; recordings come back on a new phone only from the user's own device backup or their export (D-033).

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P1 | Saves at night, often offline or on weak Wi-Fi; may get a new phone in year 2 | Fears losing what they made (R2 section 5); never thinks about sync |
| P2 | Reads the other parent's letters on their own phone | Wants new letters to appear without doing anything |
| P1 with two devices | iPhone plus a second iPhone or an iPad running the iPhone app [A] | Edits the same letter on both, rarely |
| Founder as operator | A bad migration or a restore | One person, phone alerts (TDD 06 2.3) |

## 3. What we are solving

**Outcome.** Every letter reaches the family's server copy and the other parent's phone, nothing is ever lost or silently overwritten, and a new phone gets every letter's text back.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Letters lost or silently changed | Zero (gate, PRD 7.5) | Chaos suite, kill-during-save 500 of 500, restore drill | n/a |
| Ops never dropped | 100% reach the server or `rejected_writes` (TDD 06 2.2) | Integration tests; L2 counts | n/a |
| Letter on one phone visible on the co-parent's online phone | p95 5 s, p99 30 s (PRD 7.3, gate) | Two-client probe in load test | n/a |
| New phone: book list | p95 10 s (PRD 7.3) | Device run | n/a |
| New phone: one year of text (about 240 letters) | p95 30 s on LTE (PRD 7.3) | Device run | n/a |
| `sync_failed` per active device per week | Under 0.5 [A] | Device analytics | Consenting users only |
| Rejected writes per 1,000 ops | Under 1 [A] | Server count of permanent SQLSTATEs (L2) | n/a |

## 4. Scope

**In v1.0**
- Outbox push and cursor pull on expo-sqlite (D-023), with idempotency keys, rejected-write handling and a restore epoch.
- One visibility predicate, `book_access` (D-024), shared by RLS, `book_entries` and the pull RPC.
- What syncs: own letters (all columns), other parents' in-book letters (allowlisted columns), books, memberships, per-person prefs, dictionary terms, invites (F11), deletion request state.
- Conflict rules with no silent overwrite (6.2 E).
- New-phone restore of text; audio through device backup or export only.
- Sign-out, account switch and revocation.
- A visible offline queue: "Not sent yet".
- API standards (B15), typed contracts in `packages/api` (new), two environments and the agent fence (D-041), load targets recomputed.

**Later**
- v1.1: audio and photo upload queue for shared voice and backup (F31); revisit PowerSync at 10k families or when attachment sync outgrows the simple queue (D-023).
- v1.1: in-app import of an export ZIP to bring recordings back [R] (Q4).
- Later: realtime push of changes; v1.0 pulls on triggers (6.2 C).

**Never**
- A machine merge of anyone's words (TDD 02 3.6: no CRDT, no text merge).
- A client deleting its own letters because the server lacks them (TDD 06 P-1).
- Service keys in the app (B15).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Day One | Own cloud, end-to-end encrypted; unlimited devices on paid tiers [F] R1-S23 | Latest release improved iOS 18 sync [F] R1-S6 | Overwrites across devices, missing entries [S] R2-S16 | **Avoid** silent overwrite: keep both versions and let the author pick [R] |
| Apple Journal | iCloud sync across devices [F] R1-S5 | 4.8 (327K) | Slower than rivals [S] R1-S5 | Neutral |
| Apple Voice Memos | iCloud sync of recordings [F] R1-S64 | 4.8 (1.1M) | n/a | Our audio stays on the phone in v1.0 (B7); say so plainly |
| FirstChapter | Upload on weak connections, retry [F] R1-S4 | n/a | n/a | **Match** the outbox with retry [R] |
| FamilyAlbum | Cloud storage | 4.9 (375K) | Uploads stop if the app closes [S] R1-S12 | **Avoid**: the outbox survives kill and reboot [R] |
| Tinybeans | n/a | n/a | 9 GB of data overnight [S] R2-S14 | **Avoid**: text-only sync; byte caps (section 9) [R] |
| Qeepsake | Inactive free accounts deactivated after a year with notice [F] R1-S44 | n/a | n/a | **Avoid** any inactivity cleanup of content (LEGAL-REQ-033) [R] |

## 6. Experience

### 6.1 Entry points
Sync has no screen of its own. It shows in three places:
- A letter row and the letter view: "Not sent yet" while its ops wait (new `sync.notSent`).
- Settings > Sync (new row under Account, F17): status line, last synced time, counts, paused reason, Try now.
- One-time notices for a rejected write or an edit conflict (6.2 E).

### 6.2 Happy path

#### A. Push (outbox)
1. A local write (save, edit, take out of book, delete, restore, settings change, invite) runs in one SQLite transaction that also inserts an op into the local `outbox` table (new). The op holds an idempotency key (UUIDv7), op kind, target id, the changed field group, and `base_seq` (the `server_seq` the edit was based on; null for inserts).
2. The sync client runs when signed in, consented and online: after first frame, after each local write (debounced 2 s), on foreground, on network regain, and when iOS grants background time [A] (BGTaskScheduler through Expo is a spike, 11).
3. It sends up to 50 ops (256 KB cap) in order to `sync_push(p_api_version, p_batch)` (new RPC, security invoker, so RLS and every trigger apply).
4. The server applies each op in its own savepoint and returns one result per op: `applied` with the new `server_seq` and server-owned fields (`deleted_at`, `raw_sha256`, `approval`), `duplicate` (idempotency key seen; returns the stored result), `conflict` with the current server row (6.2 E), or `rejected` with the SQLSTATE.
5. The client marks applied rows `synced`, stores server fields, compares `raw_sha256` with its own hash (DATA-REQ-046), and removes the op.

#### B. Pull (cursor)
1. The client calls `sync_pull(p_api_version, p_cursor, p_restore_epoch, p_limit)` (new RPC, security definer reading `book_access`; never takes a profile id).
2. It returns, ordered by commit: own rows of every synced table, other people's rows visible through `book_access` (allowlisted columns only, same as `book_entries`), and a `gone` stub (`id`, `child_id` only) for any row in a readable book whose change made it no longer visible to the caller (taken out of the book, tombstoned).
3. It returns `books_removed`: child ids that left the caller's `book_access` since the cursor (left, removed, undone join, book deleted). The client deletes other people's rows, photos and shared book details for those books; own letters stay (DATA-REQ-016).
4. A membership or visibility change for a book triggers a full re-pull of that book (about 240 rows a year, D-023).
5. The new cursor is returned only up to a safe watermark (11, riskiest unknown 1), so a row committed late is never skipped. Repeated delivery is harmless: apply is idempotent by id and `server_seq`.

#### C. When pulls run
After first frame, on foreground (at most every 30 s), after a successful push, after a co-parent letter push arrives (F11; the push carries no ids, it only wakes a pull), and on Settings > Sync > Try now. A foreground app with an open book pulls every 60 s [A]; this meets PRD 7.3 p95 5 s only together with the push wake-up, which is measured in the load probe (Q2).

#### D. New phone
1. Sign in (F02). Consent state is read from the server (`my_sync_gate()`, exists).
2. Pull from cursor zero: book list first (children, memberships, prefs), then letters newest first per book, in pages of 200.
3. Letters with `audio_kept_on_device = true` whose audio is not on this phone show F08's "not on this phone" state (`recordings.notOnThisPhone`, F08). If the user restored this phone from an iCloud device backup, the audio files are already there and match by entry id and `audio_sha256` (D-033).
4. Settings > Sync shows "{n} letters on this phone" when done.

#### E. Conflicts: every case and how it resolves

| # | Conflict | Can it happen at v1.0? | Resolution | What the person sees |
|---|---|---|---|---|
| C1 | Same author edits the same letter's words on two devices offline | Yes, rare (two devices) | Push of words carries `base_seq`. Server applies only if the row's `server_seq` equals `base_seq`; else returns `conflict` with the current row. The client keeps the server version as the letter and stores its own text as a local conflict copy | On that letter, author only: "This letter was changed on your other phone. Your version from this phone is saved." with Use this version and Keep the current one (new `sync.conflict.*`). Use this version re-pushes with the new base. Both versions also live in `entry_versions` once applied |
| C2 | Same author toggles in book on two devices | Yes | Same compare-and-set as C1 on the `in_book` field group | Same note; one tap to apply again |
| C3 | Edit on one device, delete on another | Yes | Delete wins; the edit returns `SCTMB` (exists); op goes to `rejected_writes` with the edited text | "This letter was deleted on another phone. Restore it with your edit?" Restore and apply my edit (DATA-REQ-043) |
| C4 | Delete and restore on two devices | Yes | Last arrival wins; both audited (exists) | Letter state follows the server |
| C5 | Two parents edit the same book setting (name, nickname, date, photo, look, hidden) | Yes | Compare-and-set per field on `children` with `base_seq`; on conflict the server value stands | "{child}'s {setting} was changed on another phone." with the current value and Change it again (new `sync.conflict.bookSetting`) |
| C6 | Person-per-child prefs edited on two devices | Yes | Same as C5 on `child_member_prefs` | Same pattern |
| C7 | Words of a letter and its machine edits arriving from different devices | Prevented | Words, `machine_edits` and `edit_level` always travel as one field group (TDD 02 3.6); a push that changes one of them alone is rejected `SCPAIR` (new) | Never seen; a client bug if it fires |
| C8 | Membership ended while writes are queued | Yes | Insert or update refused by RLS (`42501`) or `SCDEL` for a deleted book; op to `rejected_writes`; content stays local and in export | "{n} letters could not be sent to {child}'s book. They are safe on this phone." (new `sync.rejected.book`) |
| C9 | Consent withdrawn or missing | Yes | `SCCON` pauses the queue; nothing is rejected (exists, APPLY.md) | Settings > Sync: paused, with a link to Privacy |
| C10 | Two parents act on the same family letter | No (contributors hidden, B1) | First action wins (exists) | n/a |
| C11 | Immutable column differs | Impossible by design | `SCIMM` (exists); a client bug | n/a |
| C12 | Clock skew | Yes | Server clock for every lifecycle column; device clock only for `captured_at` and `occurred_on` (TDD 02 3.6) | Dates the author chose stay as chosen |
| C13 | Server restored to an earlier point | Rare | Restore epoch (6.2 F) | "Checking your book" in Settings > Sync during the re-upload |

Nothing in this table merges, rewords or picks between two people's words. The only choice ever offered is to the author of both versions.

#### F. Restore epoch
1. `sync_state` (new single-row table, L2) holds `restore_epoch` and `restore_point`.
2. Restore runbook (RB-8): restore into a new project, replay the purge ledger (DATA-REQ-030), bump the epoch, set the restore point, reopen.
3. A client sees a higher epoch in the pull response. It pauses applying `gone` stubs and `books_removed`, re-pushes every own row and tombstone changed after `restore_point` minus 1 hour (inserts are idempotent; immutable columns are identical, so `SCIMM` cannot fire), then resets the cursor and pulls fully.
4. Own rows absent on the server are never deleted locally. Other people's rows the server no longer has stay on the phone marked "waiting for its author" for 30 days, then leave (TDD 06 6.3; co-members cannot re-upload others' letters, RLS forbids it).

#### G. Sign-out, account switch, revocation

| Event | Behaviour |
|---|---|
| Sign out | Waits until the outbox is empty (A-REQ-033, F02-REQ-001). Then removes other people's letters, photos and shared book details from the phone. Own letters and recordings stay on the phone as local letters (the user's own words; audio exists only here). Signing in again with the same account resumes from a full pull |
| Sign in with a different account on a phone that holds another account's rows | Refused at v1.0 (one account per install). Choices: sign in as the previous account, or Remove the other account's letters from this phone, which offers export first and then deletes them locally |
| Refresh rejected or Apple credential revoked | App keeps working locally; outbox keeps; "Sign in again to keep your book in sync" (TDD 04 3.2.2) |
| Account deleted | DATA-REQ-023: one local export offered, then local wipe |
| Left, removed or undone membership | `books_removed` in the next pull (6.2 B step 3) |
| Kill switch `sync_enabled = false` (D-035) | Push and pull stop; outbox keeps; local use unchanged; resumes when on |

#### H. The visible queue
- Letter row: "Not sent yet" (new `sync.notSent`) while any op for it waits, never during the first 10 s after save (avoids flicker).
- Settings > Sync shows one line: "All letters are in your book" (new `sync.allSent`), or "{n} not sent yet" plus the reason: offline, signed out, waiting for consent, paused by us (kill switch), or "{n} could not be sent" with View.
- View lists rejected writes by letter date and book, with the recovery action from the C table. Rejected content is in export (DATA-REQ-043).
- Copy follows VOICE: never "failed" or fear words; "safe on this phone" is true and stated.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F16-U01 | Offline for days | Outbox grows; nothing blocks capture, review, save or reading (PRD 7.3) | "Not sent yet" | Automatic on reconnect | Integration, airplane mode 72 h simulated |
| F16-U02 | App killed mid-push | Ops stay until the server result is stored; retry is idempotent by key | Nothing | Automatic | Chaos: kill during push, 500 iterations |
| F16-U03 | Response lost after the server applied | Retry returns `duplicate` with the stored result | Nothing | n/a | `[DATA-REQ-044] duplicate push applies once` |
| F16-U04 | Reboot with ops queued | Outbox is in SQLite with `synchronous = FULL` (`expo-adapter.ts`, exists) | Nothing | n/a | Device test |
| F16-U05 | Server 5xx or timeout | Backoff 1 s to 5 min with jitter; order kept (TDD 02 3.5) | Nothing until 1 h, then Settings shows "waiting for our server" | Automatic | Fault injection |
| F16-U06 | `429` from rate limit | Wait for `retry_after`; order kept | Nothing | Automatic | Unit |
| F16-U07 | One op permanently rejected | Moved to `rejected_writes`; the queue continues (FM3 poison op) | One notice per book per day | Action from C table | `[DATA-REQ-043] rejected op does not block the queue` |
| F16-U08 | Low storage | Pull pauses below 200 MB free [A]; push continues | Settings: "This phone is almost full" (`errors.storageLow`, exists) | Free space | Unit with mocked free space |
| F16-U09 | Background time cut off | Batch stops at a boundary; resumes next foreground | Nothing | n/a | Device test |
| F16-U10 | Interruption during sync (call, Siri) | Sync is not audio; continues | Nothing | n/a | n/a |
| F16-U11 | Edit conflict (C1, C2) | Conflict copy kept | Author note on the letter | Pick a version | `[F16-REQ-010]` two-device test |
| F16-U12 | Book deleted on the other phone while writing | Save is local; push `SCDEL`; rejected | C8 notice | Export or keep local | Integration |
| F16-U13 | Consent missing | Queue paused, not rejected | Settings paused line | Consent | `SCCON` tests (exist) |
| F16-U14 | Duplicate taps on Try now | One sync run at a time (mutex) | One spinner | n/a | Unit |
| F16-U15 | App update with a new API version while ops wait | Server accepts N and N-1 (F16-REQ-019) | Nothing | n/a | Contract test N-1 |
| F16-U16 | Build below `min_supported_build` | Sync stops; local use continues | "Update the app to keep your book in sync" (new `sync.updateNeeded`) | Update | Unit |
| F16-U17 | New phone without iCloud backup | Text returns; audio does not | F08 state per letter | Export kept elsewhere; v1.1 backup | Durability drill BL-284 |
| F16-U18 | New phone restored from iCloud device backup | Database and audio return with the backup; session does not (Keychain `THIS_DEVICE_ONLY`, TDD 04 3.2.1) | Sign in; pull reconciles | n/a | Durability drill |
| F16-U19 | Server restore | Restore epoch flow | "Checking your book" | Automatic | Restore drill BL-247 |
| F16-U20 | Raw transcript hash mismatch after push | Report count (L2); re-download the row; never overwrite local text silently | Nothing | Support if repeated | `[DATA-REQ-046]` |
| F16-U21 | Co-parent takes a letter out of the book | `gone` stub removes it on the reader's phone | Letter disappears | n/a | `[LEGAL-REQ-032]` |
| F16-U22 | Reader left the book | `books_removed`; others' rows purged; own stay | The book moves to "Letters to {child}" | n/a | Integration |
| F16-U23 | Signed out | No sync; local use; Keep the book sheet rules (F02) | Settings: "Sign in to keep your book" | Sign in | n/a |
| F16-U24 | VoiceOver and AX5 on Settings > Sync and the rejected list | Labels and wrapping (PRD 7.6) | Full text | n/a | AX5 component test |
| F16-U25 | iPhone SE 3 with a 5-year book (1,200 letters) | Paged pull; local apply in transactions of 200 | Book usable during pull | n/a | Device run, 5-year fixture |
| F16-U26 | Clock on the phone set years ahead | Server clock wins for lifecycle; `captured_at` checked within 1 day ahead (existing UUIDv7 check pattern) | Nothing | n/a | Unit |
| F16-U27 | Two accounts on one phone | Refused (6.2 G) | Choice sheet | Export then remove | Integration |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| DATA-REQ-043 | P0 | Sync conflict rules; no op silently dropped | Given a permanent SQLSTATE (`SC***`, `23***`, `42501`), Then the op moves to `rejected_writes` and the queue continues; given a transient error, Then retry keeps order | DELETION spec |
| DATA-REQ-043 Rev (D-023) | P0 | Same author edits from two devices are compare-and-set, not last-writer-wins; the losing version is kept and shown to the author | As F16-REQ-010 | D-023, R2-S16 |
| DATA-REQ-044 | P0 | Idempotent writes | Given an op retried 5 times, Then one server effect and one audit row | DELETION spec |
| DATA-REQ-046 | P0 | Corruption detection on text | Given a forced mismatch, Then a count is reported and the row is re-downloaded | DELETION spec |
| DATA-REQ-030, DATA-REQ-031 | P0, P1 | Restore with ledger replay; quarterly drill | Given a drill with two synthetic devices, Then zero letters lost on either device | DELETION spec, TDD 06 6.3 |
| DATA-REQ-032 Rev (D-023) | P0 | Sync layer deletion: a purged or removed row reaches no device | Given a purged letter, When a fresh install of a former reader pulls, Then no row for it | DELETION spec |
| A-REQ-015 | P0 | Re-ownership in one transaction before any sync | Given a crash mid-transaction, Then nothing changed (F02) | A |
| A-REQ-033 | P0 | Sign-out and revocation only after unsynced letters sync | Given 3 queued ops, When Sign out, Then the session stays until the queue is empty | A, F02-REQ-001 |
| B-NFR-003 Rev (D-023) | P0 | Every RLS rule has an access test and the pull RPC has a parity test | As F16-REQ-008 | B, ADR 0004 |
| PRD-REQ-004 | P0 | Working material author-only in pull | Given another member's pull, Then no `raw_transcript`, `raw_sha256`, `machine_edits`, `stt_meta`, `deleted_reason`, `entries.language` (if added by F04) | PRD |
| LEGAL-REQ-001, LEGAL-REQ-006 | P0 | No content row accepted before Terms with age and sensitive-data consent | Push returns `SCCON` and pauses (exists in triggers) | ENGINEERING_REQUIREMENTS |
| LEGAL-REQ-032 | P0 | Deletion and removal reach every member device | Given take-out by the author, Then the reader's row is gone within one pull | ENGINEERING_REQUIREMENTS |
| F16-REQ-001 | P0 | Local `outbox` table: one row per op with key, kind, target, field group, `base_seq`, created time; written in the same transaction as the data change | Given a kill between data write and outbox write in a fault test, Then both or neither exist | D-023, DATA-REQ-048 |
| F16-REQ-002 | P0 | `sync_push` applies up to 50 ops per call in order, each in a savepoint, returning a typed per-op result | Given a batch where op 3 is rejected, Then ops 1, 2, 4 to 50 apply and op 3 returns its SQLSTATE | TDD 06 3.2 |
| F16-REQ-003 | P0 | Idempotency ledger `sync_ops` (new, server): key, profile, result, created; kept 30 days | Given the same key twice, Then the second returns `duplicate` with the first result | B15 |
| F16-REQ-004 | P0 | `server_seq` and a commit watermark on every synced table, set by trigger | Given two concurrent transactions committing out of order, Then a puller never skips the later-committed row (concurrency test) | D-023 |
| F16-REQ-005 | P0 | `sync_pull` returns own rows, visible rows (allowlisted columns), `gone` stubs and `books_removed`, paged | Given the fixture families, Then each caller's pull equals the expected set exactly | D-024 |
| F16-REQ-006 | P0 | `book_access(child_id, profile_id, role, sees_book, sees_pending)` maintained by triggers on `child_members` and `children`; RLS helpers, `book_entries` and `sync_pull` read it | Given a leave, Then the `book_access` row is gone in the same transaction | D-024, TDD 02 3.2 |
| F16-REQ-007 | P0 | A membership or visibility change re-pulls that whole book | Given a parent joins, Then their first pull returns every in-book letter of that book | D-023 |
| F16-REQ-008 | P0 | Parity and cross-child leak suite: for each fixture user, `sync_pull` returns exactly what RLS and `book_entries` allow | Given the matrix (author, other parent, left parent, stranger, sibling book), Then zero differences; runs on every PR touching `supabase/**` | LEGAL-REQ-024, BL-195 |
| F16-REQ-009 | P0 | Take-out, tombstone and removal propagate as `gone` stubs or `books_removed`; the client deletes local copies and cached photos | p95 60 s online (PRD 7.3) | LEGAL-REQ-032 |
| F16-REQ-010 | P0 | Compare-and-set for field groups (words with edits, in book, each book setting, each pref) with `base_seq`; conflict keeps both and asks the author (C1, C2, C5, C6) | Given two devices editing one letter offline, Then neither version is lost and the author sees the note on the second device | R2-S16 |
| F16-REQ-011 | P0 | Words, `machine_edits` and `edit_level` push as one group; a partial change is rejected `SCPAIR` | Given a push of `final_text` alone after an edit list change, Then `SCPAIR` | TDD 02 3.6 |
| F16-REQ-012 | P0 | Restore epoch flow (6.2 F) | Restore drill: zero own rows deleted locally; others' rows kept 30 days as waiting | TDD 06 6.3 |
| F16-REQ-013 | P0 | New phone pull order: books, then letters newest first, pages of 200 | Book list p95 10 s; one year p95 30 s on LTE | PRD 7.3 |
| F16-REQ-014 | P0 | No audio, listening copy or photo bytes in any v1.0 sync request | Network capture of the E2E suite: zero audio bodies | B7 |
| F16-REQ-015 | P0 | Sign-out and account switch per 6.2 G | Given sign-out, Then own letters and audio remain, others' rows are gone | A-REQ-033, DATA-REQ-023 |
| F16-REQ-016 | P0 | "Not sent yet" on letter rows and a Settings > Sync line with reason and counts | Given 3 queued ops offline, Then the row and Settings show them within 10 s | B-NFR-009, PRD 7.4 |
| F16-REQ-017 | P0 | Pull triggers per 6.2 C | Two-client probe: p95 5 s, p99 30 s with the app foreground | PRD 7.3 |
| F16-REQ-018 | P0 | Kill switch `sync_enabled` honoured within 5 minutes on active clients; outbox kept | Staging drill per release | D-035, LEGAL-REQ-040 |
| F16-REQ-019 | P0 | Every RPC takes `p_api_version`; the server supports the current and previous version; older builds get `SCVER` (new) and the app shows `sync.updateNeeded` | Contract test with N-1 fixtures | B15, TDD 02 6.2 |
| F16-REQ-020 | P0 | Logs carry only route template, SQLSTATE, durations, counts and a random request id; Postgres never echoes content (value-free validation trigger) | Log canary over the E2E run finds zero Asha fixture strings, letter text or ids | LEGAL-REQ-014, BL-244 |
| F16-REQ-021 | P0 | Rate limits in the RPCs through `rate_limits` (hashed keys): `sync_push` 60 per user per minute, `sync_pull` 120 per user per minute | Given 61 pushes in a minute, Then `SCRAT` with `retry_after` | B15, TDD 06 3.2 |
| F16-REQ-022 | P0 | The app uses only the publishable key plus the user JWT; no service key in the bundle | Secret scan of the built bundle finds none | B15, LEGAL-REQ-026 |
| F16-REQ-023 | P0 | Rejected writes are kept until the user resolves them, and included in export | Given a rejected letter, Then export contains it | DATA-REQ-043, LEGAL-REQ-034 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| `outbox` (local, new): op payloads | L4 | Device only (iOS Data Protection) | App | Until applied or moved to `rejected_writes` |
| `rejected_writes` (local, new) | L4 | Device only | Author | Until resolved |
| Local conflict copies (new) | L4 | Device only | Author | Until the author picks |
| `book_access` (new) | L3 | Postgres | Own rows only; read by RLS helpers | Life of membership |
| `server_seq`, commit watermark columns (new) | L2 | Postgres, device | Row readers | Life of row |
| `sync_ops` (new) | L2 with L3 profile id | Postgres, service role and owner | Owner through `sync_push` results | 30 days |
| `sync_state` (new, one row) | L2 | Postgres | Everyone signed in (epoch only) | Permanent |
| Cursor and last sync time | L2 | Device | App | Install |

What never leaves the phone in v1.0: audio, listening copies, drafts, safety tiers, the outbox and rejected writes as tables, the Read together count. PowerSync is not used, so no sync processor holds L4 data (TDD 05 OQ-L15 is moot under D-023).

## 9. Non-functional requirements

**API budgets (B15, PRD 7.2, measured at the client, US, good LTE)**

| Endpoint | p95 / p99 | Auth | Idempotency | Rate limit | Payload cap |
|---|---|---|---|---|---|
| `sync_push` (new RPC) | 800 ms / 2 s | User JWT, RLS (security invoker) | Op key in `sync_ops` | 60 per user per minute | 50 ops, 256 KB |
| `sync_pull` (new RPC) | 300 ms / 800 ms per page | User JWT; reads `book_access` for `auth.uid()` only | Read; safe to repeat | 120 per user per minute | 200 rows per page |
| `create_child`, `create_first_run_children` (exist) | 500 ms / 1.2 s | User JWT | Client id | 20 per user per day | 6 children |
| `create_child_invite`, `accept_child_invite`, `leave_child` | 500 ms / 1.2 s | User JWT | Invite id or token | F11 | small |
| `delete_entry`, `restore_entry` (exist) | 500 ms / 1.2 s | User JWT | Naturally idempotent (exists) | 120 per user per hour | 1 KB |
| `my_sync_gate`, `policy_actions_needed` (exist) | 300 ms / 800 ms | User JWT | Read | 60 per user per hour | 4 KB |
| `app_config` read (D-035) | 300 ms | Publishable key; CDN or edge cache with ETag (B15) | Read | n/a | 4 KB |

Error budget: under 0.1% 5xx per endpoint class over 28 days (TDD 06 2.3). Request ids: the client sends a random `x-request-id` (UUIDv7) on every call and keeps it in on-device diagnostics; Edge Functions log it; whether the Supabase API gateway logs custom headers is Unverified (Q5). Region: one US region (B15, DATA-REQ-005).

**Load targets (PRD 7.8 recomputed without contributors and audio uploads)** [A] unless marked

| Target | 1k families (launch) | 100k families | Change from PRD 7.8 |
|---|---|---|---|
| Accounts per family | 1.5 (at most 2 parents, D2 in F11; 25% or more second-parent goal) | 1.5 | Was 2.2 with contributors |
| MAU | 1.5k | 150k | Was 2.2k / 220k |
| Concurrent sync clients at peak (5% of MAU) | 75; test at 200 (kept) | 7.5k | Was 200 / 11k |
| Entry writes, peak 15 min | 5 per s (test load kept) | 50 per s (kept) | Unchanged: letters per family drive it |
| `sync_pull` calls at peak (one per 30 s per concurrent client) | 2.5 per s; test at 7 per s | 250 per s | New |
| Write RPCs (invites, leave) | 1 per s | 10 per s | Was 2 / 20 (no approvals) |
| Encrypted audio uploads | 0 | 0 | Was 1 / 10 (B7) |
| Store webhooks | 0 | 0 | Was 10 / 300 per minute (B2) |
| Server notice emails | 0 (DR-02 default A is on device) | 0 | Was 100 / 5k per day |
| Children's books (1.3 per family) | 1.3k | 130k | Unchanged |
| Letters after 12 months (240 per family) | 240k | 24M | Unchanged |
| Database size (about 10 KB per letter, TDD 06 3.4) | About 3 GB | About 290 GB; about 120 GB if `stt_meta` stays on the device (Q3) | PRD said 8 GB / 150 GB |
| Cumulative server audio | 0 | 0 | Was 115 GB / 11.4 TB |
| Analytics events (40% consent, 150 per user per month) | About 90k per month | About 9M per month | Was 130k / 13M |

Gate: load test at 2 times the 1k targets before public launch (BL-282); 2 times 100k before passing 25k families (PRD 7.8).

**Device budgets**

| Item | Budget |
|---|---|
| Sync never blocks capture, review, save or reading | Always (PRD 7.3, gate) |
| Local apply of a 200-row page on iPhone SE 3 | Under 300 ms [A], off the UI thread |
| Data per active user per month | Under 5 MB [A]; a full 5-year pull about 12 MB (TDD 06 3.2) |
| Battery | No background work except OS-granted sync time (PRD 7.7) |

**Environments and the agent fence (D-041)**

| Env | Project | Who applies migrations | Data |
|---|---|---|---|
| local | PGlite harness (`npm run test:db`) and the Supabase CLI stack in CI | Tests only | Asha fixtures |
| staging | `scribe-staging` (BL-107) | CI, `supabase db push` on merge to the release branch | Synthetic Asha families, load data |
| prod | `scribe-prod` | CI on a release tag, after the founder's approval | Real families |

Rules: agents never apply a migration to a remote project; any PR touching `supabase/**` or auth needs an independent review run and the founder's `approve-migration` label; unattended runs stay paused for those paths until CI and branch protection are on (D-041). Database changes are new files only; applied files in `.github/migrations-applied.txt` are never edited (migration guard workflow). The pending pack (`20261002010000` to `20261003020000`) goes to staging first.

## 10. Analytics

| Event | Properties | Question |
|---|---|---|
| `sync_failed` (exists) | `reason: network / auth / conflict / server / unknown` | Where does sync break? |
| `error_shown` (exists) | new codes `sync_rejected`, `sync_conflict`, `sync_update_needed` | How often do people meet each state? |
| Server aggregates (BL-024, L2 counts) | ops applied, duplicates, conflicts, rejections by SQLSTATE, pull pages | Contract health without device consent |

## 11. How we build it (with the architect)

| Part | Files (new unless stated) | Notes |
|---|---|---|
| Contracts | `packages/api/` (new workspace): `src/sync.ts`, `src/errors.ts`, `src/version.ts`; DB types generated with `supabase gen types` | Op kinds, field groups, per-op results, SQLSTATE enum shared by client and tests. A runtime validator with a permissive licence chosen in WP-F16-01 against installed sources |
| Local store | `apps/mobile/src/lib/db/migrations.ts` (exists, append a version): `outbox`, `rejected_writes`, `conflict_copies`, `sync_meta`; `entries.sync_state`, `server_seq` | Through the `LocalStore` interface (BL-111) |
| Sync client | `apps/mobile/src/lib/sync/` (new): `push.ts`, `pull.ts`, `scheduler.ts`, `apply.ts`, `restore.ts` | Pure logic testable in Node against `SqlDb` (`apps/mobile/src/lib/db/sql.ts`, exists) |
| Server migrations (indicative names; the data architect assigns timestamps after the newest applied file) | `..._book_access.sql` (BL-175); `..._sync_seq_and_rpcs.sql` (`server_seq`, watermark, `sync_push`, `sync_pull`, `sync_ops`, `sync_state`, `SCPAIR`, `SCVER`); value-free validation (BL-244); `rate_limits` (BL-236) | Expand then contract for two app releases (TDD 02 6.2) |
| Tests | `supabase/tests/sync_contract.test.mjs`, `sync_parity.test.mjs`, client unit tests, chaos suite in the CLI stack (BL-177) | Titles carry requirement ids |

Fixes the store needs first (TDD 02 3.4, verified in `apps/mobile/src/lib/store.ts`): `undeleteEntry` must become an RPC-backed restore; local `children` loses per-person columns (F12-REQ-004); `birthday` maps to `date_of_birth`.

**Riskiest unknowns and spikes**
1. The commit watermark. Sequence values are taken in transaction order, not commit order, so a plain `server_seq > cursor` pull can skip a row. Proposed: store `pg_current_xact_id()` per row and serve only rows whose transaction id is below `pg_snapshot_xmin(pg_current_snapshot())`, then advance the cursor to that bound. Availability of these functions on hosted Supabase and in PGlite is Unverified. Spike WP-F16-00 with a two-connection concurrency test.
2. Background sync from Expo (BGTaskScheduler wrapper) is Unverified; v1.0 does not depend on it.
3. PRD 7.3 p95 5 s without realtime: depends on the F11 push wake-up and foreground pulls; measured in the two-client probe.

## 12. Work packages

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F16-00 | Spike: commit watermark and concurrency | Sync owner, data architect | `experiments/sync-watermark/` | none | Two-connection test proves no skipped row; findings in PR | Pair. BL-173 |
| WP-F16-01 | `packages/api` skeleton and sync contracts | Platform engineer | `packages/api/` | none | Type tests; workspace builds | Agent |
| WP-F16-02 | `book_access` table, triggers, `book_entries` and helpers rebuilt on it | Data architect | Migration, `supabase/tests/visibility_matrix.test.mjs` | Pending pack in staging | Existing access tests green; perf test no regression (APPLY.md budgets) | Agent, `approve-migration`. BL-175 |
| WP-F16-03 | `server_seq`, watermark, `sync_push`, `sync_pull`, `sync_ops`, `sync_state` | Data architect | Migration, `supabase/tests/sync_contract.test.mjs` | WP-F16-00, WP-F16-02 | `[F16-REQ-002]` to `[F16-REQ-005]`, `[F16-REQ-011]`, `[F16-REQ-019]`, `[DATA-REQ-044]` | Agent, `approve-migration`. BL-173 |
| WP-F16-04 | Parity and leak suite | Security engineer, QA | `supabase/tests/sync_parity.test.mjs` | WP-F16-03 | `[F16-REQ-008]` | Agent. BL-195 |
| WP-F16-05 | Local schema and outbox writes | Mobile engineer | `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/sync/outbox.ts` | BL-111 | `[F16-REQ-001]` fault test; migrator fixtures | Agent. BL-174 |
| WP-F16-06 | Push and pull client, apply, scheduler | Sync owner | `apps/mobile/src/lib/sync/` | WP-F16-03, WP-F16-05 | `[F16-REQ-009]`, `[F16-REQ-013]`, `[F16-REQ-017]`, kill-during-push 500 of 500 | Agent. BL-174 |
| WP-F16-07 | Conflicts and rejected writes UI | Mobile engineer | `apps/mobile/src/lib/sync/conflicts.ts`, Settings > Sync screen, `copy.ts` | WP-F16-06 | `[F16-REQ-010]`, `[F16-REQ-016]`, `[F16-REQ-023]` | Agent |
| WP-F16-08 | Restore epoch client and drill | Data architect, sync owner | `apps/mobile/src/lib/sync/restore.ts`, runbook RB-8 | WP-F16-06, BL-107 | `[F16-REQ-012]` drill passes in staging | Pair. BL-247 |
| WP-F16-09 | Sign-out, account switch, revocation | Mobile engineer | `apps/mobile/src/lib/auth/session.ts` (F02 owns; coordinate) | WP-F16-06, WP-F02-09 | `[F16-REQ-015]`, `[A-REQ-033]` | Agent |
| WP-F16-10 | Value-free validation and rate limits | Data architect | Migrations (BL-244, BL-236) | Pending pack | `[F16-REQ-020]` oversize letter canary; `[F16-REQ-021]` | Agent, `approve-migration` |
| WP-F16-11 | Chaos suite and two-phone script | QA, sync owner | CLI stack in CI | WP-F16-06 | Offline, kill, duplicate push, reorder; manual two-phone p95 5 s | Agent plus human. BL-177 |
| WP-F16-12 | Load test at 2 times the 1k targets | QA | k6 scripts | WP-F16-06, staging | Section 9 targets at 2x | Agent. BL-282 |

## 13. Open questions and assumptions

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 D-023: outbox and cursor on expo-sqlite instead of PowerSync | Founder, 16 Oct | If PowerSync: ADR 0004 path, op-sqlite migration, vendor no-training clause (TDD 05 OQ-L15) |
| Q2 Is foreground polling plus the F11 push wake-up enough for p95 5 s, or is Supabase Realtime needed? | Sync owner, after the week 8 probe | Adds a realtime channel scoped by `book_access` |
| Q3 Do per-token timestamps in `stt_meta` sync to the server at all? | Data architect with F05 owner, 30 Oct | Database size at 100k: 290 GB or 120 GB |
| Q4 In-app import of an export ZIP to bring recordings back | Founder, v1.1 planning | F15 and F08 |
| Q5 Does the Supabase API gateway log custom request headers and paths with ids (TDD 06 C-1)? | Privacy counsel and data architect, before beta C1 | Request-id design and data map row |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Same-author two-device edits are rare | Server conflict count in C1 |
| A2 | 1.5 accounts per family | Server aggregate after 8 weeks |
| A3 | Pull every 30 s on foreground stays inside Supabase plan limits at 7.5k concurrent | Load test at 100k profile before 25k families |

## 14. Sources

- Decisions: `docs/prd/v2/_AUTHORING.md` (B2, B7, B15); `docs/agents/BRIEF-2026-10-03.md` items 9, 17 and coordination rules; `docs/DECISIONS.md` D-023, D-024, D-033, D-035, D-041; `09-decisions-and-risks.md` DR-02, "Still open"; ADR `docs/adr/0004-sync-engine.md` (status note).
- Requirements: `docs/prd/PRD.md` K-39, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 7.10; `docs/prd/A-entry-and-auth.md` A-REQ-015, -032, -033; `docs/prd/B-first-run-and-family.md` B-NFR-003, -009; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-010 to -016, -023, -030 to -032, -040 to -048; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-001, -006, -009, -014, -024, -026, -032, -034, -040.
- Technical: `docs/tdd/02-sync-backend.md` 2.2, 3.2 to 3.6, 6, 7, 8; `docs/tdd/01-mobile-client.md` 3.2.2 to 3.2.6; `docs/tdd/04-security-identity.md` 3.2; `docs/tdd/06-performance-reliability.md` 2.2, 2.3, 3.1 to 3.4, 5.3, 5.4, 6.3; `docs/tdd/10-red-team-critique.md` section 2; `docs/BACKLOG.md` BL-022, -024, -052, -107, -111, -173 to -177, -195, -236, -244, -247, -282, -284; `supabase/APPLY.md` (error codes, perf budgets).
- Code and schema: `supabase/migrations/20261002020000_data_governance.sql`, `20261003000000_security_and_family.sql`, `20261003010000_children_and_entitlements.sql`; `supabase/tests/security_family.test.mjs`; `.github/migrations-applied.txt`, `.github/README.md`; `apps/mobile/src/lib/store.ts`; `apps/mobile/src/lib/db/migrations.ts`, `sql.ts`, `expo-adapter.ts`; `packages/analytics/src/catalog.ts`; `packages/content/src/strings.en.ts` (`errors.*`).
- Research: `research/R1-competitors-by-feature.md` F16 (R1-S4, R1-S5, R1-S6, R1-S12, R1-S23, R1-S31, R1-S44, R1-S64); `research/R2-customer-evidence.md` section 0 item 1, T7, T8, R2-S14, R2-S16.
