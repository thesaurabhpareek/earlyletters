# F16 Sync, devices and restore

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 11 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P6 Future reader (durability) |
| Existing IDs | A-REQ-015, A-REQ-032, A-REQ-033, B-NFR-003, B-NFR-009, PRD-REQ-004, PRD-REQ-014, DATA-REQ-010, DATA-REQ-011, DATA-REQ-013, DATA-REQ-023, DATA-REQ-030, DATA-REQ-031, DATA-REQ-032, DATA-REQ-040 to DATA-REQ-046, LEGAL-REQ-001, LEGAL-REQ-006, LEGAL-REQ-009, LEGAL-REQ-014, LEGAL-REQ-024, LEGAL-REQ-032, LEGAL-REQ-040; K-39; D-023, D-024, D-033, D-035, D-041, D-055, D-068, D-073, D-085; PRD 7.2, 7.3, 7.4, 7.8; ADR 0004; BL-022, BL-052, BL-107, BL-111, BL-173, BL-174, BL-175, BL-177, BL-236, BL-244, BL-247, BL-282, BL-331 |
| Depends on | F02 (account, session, re-ownership), F17 (consents), F19 (remote config kill switch `killSwitches.sync`, ADR 0016, D-068), F11 and F12 (what is shared), F08 (audio and its encrypted backup) |
| Status | Draft V2, 3 Oct 2026. Rewritten 13 Oct 2026 after critique round 1 (R2 AR-01 to AR-03, AR-14, AR-31, AR-32; R5 EQ-20): sections 6.2, 7, 8 and 11 now describe the protocol as built in `20261004100000_sync_engine.sql` and `20261005000000`, and name the deltas as work packages. Revised 15 Oct 2026 after critique round 2 (R8 R2A-05, -11, -15 to -17, -23, -25; `reviews/DISPOSITION-R2-architecture.md`): held drafts on the server (6.2 I), a 15 s pull for shared books, the environment matrix, ledger kinds and drill rules |

## 1. Why

- [S] Across 104 negative or mixed reviews of 11 memory and journal products, 41 (39%) are about bugs, crashes, sync or lost work; 9 describe work that vanished [S] R2 section 0 item 1. Sync overwriting work across devices is one of the named stories, mostly at Day One [S] R2-S16, theme T8.
- [F] Upload resilience is a fix competitors shipped late: FirstChapter added retry and background upload in v1.0.6; FamilyAlbum users report uploads stop when the app closes; earlier StoryCorps versions lost uploads [F] R1-S4, [S] R1-S12, R1-S31.
- [F] Letters are author-owned and `raw_transcript` is immutable by trigger, so write conflicts are rare and narrow [F] `supabase/migrations/20261002020000_data_governance.sql` (`entries_guard_immutable`); TDD 10 section 2.
- [F] Under a sync engine that treats the server as truth for downloaded rows, a database restore could delete the newest letters from every device [F] TDD 06 P-1.
- [D] **D-023 is decided** (founder, 3 Oct 2026): outbox push and cursor pull on expo-sqlite and Supabase, with a restore epoch; PowerSync is revisited at 10k families or when attachment sync outgrows the simple queue (`docs/DECISIONS.md` D-023 update; ADR 0004 status note).
- [F] Built on `develop` (13 Oct), green in CI, never run against a configured project or two real phones: client `apps/mobile/src/lib/sync/` (`engine.ts`, `outbox.ts`, `merge.ts`, `ownership.ts`, `signal.ts`, `types.ts`), a local migration with `sync_outbox`, rejected writes, per-book cursors and server versions; server `supabase/migrations/20261004100000_sync_engine.sql` (`sync_push`, `sync_pull`, `sync_books`, `sync_op_receipts`, `sync_epochs`, `sync_begin_epoch`, `sync_housekeeping`, `sync_rate_windows`) amended by `20261005000000_family_cap_language_idempotency.sql` (field group `language`, counters only through `rate_hit`). Tests: `supabase/tests/sync_engine.test.mjs`, `sync_perf.test.mjs`. Neither migration is applied to any project (`.github/migrations-applied.txt`).
- [F] **The built conflict rule is last writer wins, and that breaks a promise this spec makes.** The server applies an edit whatever its `base`; `base` only sets a `conflict` flag in the result (`20261004100000_sync_engine.sql` header "Conflicts: last writer wins by server arrival, per field group", and the line that computes `v_conflict`). The client never reads the flag: `types.ts` documents `base` as "conflict flag only" and no other file in `lib/sync` uses `conflict`; `merge.ts` states "Last writer wins by server arrival, per field group". Two offline edits of one letter on two phones: the later push replaces the earlier words, which survive only in server `entry_versions`, which the author never sees. This is a P0 gap; section 6.2 E specifies the fix and WP-F16-14 and WP-F16-15 build it.
- [D] Sync ships in v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9. The full scope stays in v1.0 and the date moves (M15).
- [F] On 13 Oct the build still never starts sync: `startSync()` returns at once while `EXPO_PUBLIC_SERVER_FEATURES` is off, as it is in every `eas.json` profile (`lib/capabilities.ts`). The release profiles flip to `on` per M14; the switch stays as the kill path.
- [D] `book_access` (D-024) is not in v1.0: BACKLOG BL-175 is deferred to v1.2 by D-055, no migration creates it, and `sync_pull` authorises through `child_members`, `is_child_member` and the `book_entries` view. This spec, F11 and 06 use the built authorisation (R2 AR-03).
- [D] Audio: the owner's own recordings get an encrypted backup in v1.0 (D-073, M16); family members hearing each other's recordings stays v1.1. The backup travels in its own upload queue of ciphertext objects (F08 section 6.5), not in sync ops. Sync carries only `audio_kept_on_device`.
- [D] Durable erase (D-085): with sync on, the phone never purges by its own clock (`purgeExpired` and `eraseEntry` return at once when `capabilities.sync` is true, `store.ts`); the server's `deleted_at` plus 30 days rules (DELETION_AND_EXPORT_SPEC 2.2 step 7).

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
| Letters lost or silently changed | Zero (gate, PRD 7.5) | Chaos suite, kill-during-push 500 of 500, the two-phone conflict test (WP-F16-11), restore drill | n/a |
| Ops never dropped | 100% reach the server or the rejected list (TDD 06 2.2) | Integration tests; L2 counts | n/a |
| Letter on one phone visible on the co-parent's phone, both in the foreground with the shared book open; clock from save tap to row rendered | p95 30 s, p99 60 s with a 15 s pull (gate, Rev of PRD 7.3; section 6.2 C; R8 R2A-11) | Two-client probe in the load test; two-phone script | n/a |
| New phone: book list | p95 10 s (PRD 7.3) | Device run | n/a |
| New phone: one year of text (about 240 letters) | p95 30 s on LTE (PRD 7.3) | Device run | n/a |
| `sync_failed` per active device per week | Under 0.5 [A] | Device analytics | Consenting users only |
| Rejected writes per 1,000 ops | Under 1 [A] | Server count of permanent SQLSTATEs (L2) | n/a |
| Word conflicts shown to an author per 1,000 text pushes | Watched, no target (A1) | Server count of `conflict` results | n/a |

## 4. Scope

**In v1.0**
- Outbox push and per-book cursor pull on expo-sqlite (D-023), with op ids, rejected-write handling and restore epochs, as built.
- Authorisation as built: `child_members`, `is_child_member`, `is_child_parent`, the `book_entries` view with its column allowlist, and RLS. One parity suite proves `sync_pull` returns exactly what RLS and `book_entries` allow.
- What syncs: own letters (all columns in the wire contract), other parents' in-book letters (the `book_entries` allowlist), books and their members, per-person prefs, deletion and restore.
- The word conflict protocol: compare and set on the words group, both versions kept, the author chooses (6.2 E). Not built today (P0 gap).
- New-phone restore of text; audio from the owner's encrypted backup when on (F08 section 6.5), else from the iPhone's own backup or an export.
- Sign-out, account switch and revocation.
- A visible offline queue: "Not sent yet".
- A frozen v1.0 wire contract in `packages/api` with an API version (WP-F16-01, WP-F16-16).

**Later**
- v1.1: shared voice (F31) and photo upload; revisit PowerSync at 10k families or when attachment sync outgrows the simple queue (D-023).
- v1.1: Supabase Realtime broadcast per book (ids only) for foreground phones, to bring freshness toward PRD 7.3's p95 5 s (Q2).
- v1.1: in-app import of an export ZIP to bring recordings back [R] (Q4).
- v1.2: `book_access` table (D-024, BL-175, D-055), if a v1.1 role model needs it.

**Never**
- A machine merge of anyone's words (TDD 02 3.6: no CRDT, no text merge).
- A client deleting its own letters because the server lacks them (TDD 06 P-1).
- Service keys in the app (B15).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Day One | Own cloud, end-to-end encrypted; unlimited devices on paid tiers [F] R1-S23 | Latest release improved iOS 18 sync [F] R1-S6 | Overwrites across devices, missing entries [S] R2-S16 | **Avoid** silent overwrite: keep both versions and let the author pick [R] |
| Apple Journal | iCloud sync across devices [F] R1-S5 | 4.8 (327K) | Slower than rivals [S] R1-S5 | Neutral |
| Apple Voice Memos | iCloud sync of recordings [F] R1-S64 | 4.8 (1.1M) | n/a | v1.0 adds an encrypted backup of the owner's recordings (D-073, F08); family members do not hear each other until v1.1; say so plainly |
| FirstChapter | Upload on weak connections, retry [F] R1-S4 | n/a | n/a | **Match** the outbox with retry [R] |
| FamilyAlbum | Cloud storage | 4.9 (375K) | Uploads stop if the app closes [S] R1-S12 | **Avoid**: the outbox survives kill and reboot [R] |
| Tinybeans | n/a | n/a | 9 GB of data overnight [S] R2-S14 | **Avoid**: text-only sync; byte caps (section 9) [R] |
| Qeepsake | Inactive free accounts deactivated after a year with notice [F] R1-S44 | n/a | n/a | **Avoid** any inactivity cleanup of content (LEGAL-REQ-033) [R] |

## 6. Experience

### 6.1 Entry points
Sync has no screen of its own. It shows in three places:
- A letter row and the letter view: "Not sent yet" while its ops wait (new `sync.notSent`).
- Settings > Sync (new row under Account, F17): status line, last synced time, counts, paused reason, Try now.
- A note on the letter for a word conflict (6.2 E) and a one-time notice for a rejected write.

### 6.2 Happy path

#### A. Push (outbox), as built
1. A local write (save, edit, take out of book, delete, restore, book or prefs change) runs in one SQLite transaction that also inserts a row in the local `sync_outbox` (built, `outbox.ts`). The op holds a device-made UUIDv7 op id, a type, the target id, the field groups it changes (`changed`), and `base`: the server version (`v`) this device last saw for the letter (`entries.server_version` locally).
2. Consecutive edits of one letter that never left the phone collapse into one op (newest snapshot, union of field groups). An op that may have reached the server is never changed again (built).
3. A letter waiting for its words is held out of the outbox; its raw transcript is set once, later (built, `outbox.ts` header). Whether a voice-only letter may sync with an empty transcript slot is F05 Q7; the backup rule in F08 section 6.5 does not depend on the answer.
4. The sync client runs when signed in, consented and online: after first frame, after each local write (debounced 2 s [R]), on foreground, on network regain, and when iOS grants background time [A].
5. It sends up to 50 ops, at most 256 KB, in order, to `sync_push(p_ops jsonb)` (built; security invoker, so RLS, the consent gate and every trigger apply). Op types: `entry.upsert`, `entry.reupload`, `entry.delete`, `entry.restore`, `book.first_run`, `book.create`, `book.update`, `prefs.upsert`.
6. The server writes a receipt for each op id before running it, through the security definer helper `sync_claim_op(op_id)` (new, R8 R2A-25); clients lose direct insert on `sync_op_receipts`, applies each op in its own subtransaction and returns one result per op: `ok: true` with `dup`, `applied`, `conflict` or `missing` and the server state (`entry` with `v`, `updated_at`, `deleted_at`, `in_book`, `approval`), or `ok: false` with the SQLSTATE and, for a purged letter, `gone`. `SCCON` stops the batch with `paused` and the missing consents; a transient class (40, 53, 55, 57, 58, XX) stops it with `stopped`. No result ever carries a message or detail.
7. The client stores the returned `v` and server fields, marks the letter synced when no op is left, and removes the op. Delta (WP-F16-15): after an op for a letter applies, every later queued op for that letter has its `base` set to the returned `v`, because it descends from the version this device just wrote.

#### B. Pull (per-book cursor), as built
1. The client calls `sync_pull(p_since jsonb, p_limit int)` (built; security definer, `require_user()`, never takes a profile id). `p_since` is `{epoch, books: {<child id>: {cursor, access, meta, have: {n, sum}, verify, ids}}}`; `{}` is a first pull. At most 100 books per call; `p_limit` 1 to 500 rows across books.
2. Per book the response carries rows after the book's cursor: own letters whole, in any state; other people's letters only through `book_entries` (the B F9 and K-09 column allowlist). The cursor is `<xid8>:<uuid>`: rows are served by (`sync_xid`, id) below `pg_snapshot_xmin`, so a row committed late is never skipped; a long transaction delays sync and never loses a row.
3. Removal is a digest, not stubs. The last page of a book carries `visible`: a count and a 48-bit sum of the id suffixes of the caller's own letters plus the letters by others the caller may read. The phone compares it with its own copy and, on a difference, asks again with `ids: true` for the full list and drops what is not on it. An own deleted letter arrives as a tombstone with `deleted_at`. Another person's letter that stops being readable is never sent as a row.
4. A change of the caller's access to a book returns `repull: true`, and the server serves that book from the start. A book the caller left, was removed from or that was deleted arrives in `gone` with `reason` `not_member` or `deleted`; the client deletes other people's rows and the book's shared details and keeps its own letters (DATA-REQ-016).
5. Book details travel as `meta` (name, nickname, birthday month and day for family, date of birth and due date for parents, members with signatures) with a `meta_hash`, sent only when it changed.
6. Repeated delivery is harmless: apply is idempotent by id and `v`.
7. Delta (security review M5, in BL-331): the changed-since check that decides whether to compute the digest must look only at the caller's readable rows, so a co-parent cannot learn when the other parent writes a private letter. WP-F16-04 holds the regression test.

#### C. When pulls run, and the freshness bar
After first frame, on foreground, after a successful push, after a co-parent letter push arrives while the app is in the foreground (F11; the push carries no ids, it only wakes a pull), and on Settings > Sync > Try now. While the app is in the foreground with a **shared** book open (a book with another parent), it pulls every 15 s; with a book that has only this author, every 30 s (R8 R2A-11). Those are the two intervals, used in the load targets too.

The gate is therefore: a letter saved on one phone appears on the other parent's phone, both in the foreground with the shared book open and online, within p95 30 s and p99 60 s. The clock runs from the save tap on phone A to the row rendered on phone B. Why it can pass: push debounce 2 s, `sync_push` p95 800 ms, the wait for B's next pull (uniform over 0 to 15 s, so p95 14.25 s), `sync_pull` p95 300 ms and local apply under 300 ms add up to about 17.7 s when every part is at its own p95, inside the 30 s bar with room for LTE jitter (R8 R2A-11). A phone in the background sees the letter at its next foreground. PRD 7.3's p95 5 s is not reachable without a server-to-client channel: polling cannot meet it, and a passive push runs app code only in the foreground (R2 AR-14). Realtime broadcast is Q2 for v1.1.

The watermark has an operating rule: one long transaction anywhere stalls every pull past it, not only app transactions (R8 R2A-23). App roles keep the platform's default `statement_timeout` (R8 reports Supabase documents 8 s for `authenticated` [A: confirmed in WP-F16-10]; we do not loosen it) and get `idle_in_transaction_session_timeout` 30 s [R]. Server jobs that write many rows (purge batches, escrow rotation, retention, migrations that backfill) commit in batches that each finish in under 1 s. An alert fires when the oldest running transaction of any role is older than 30 s (WP-F16-10, 06 section 4).

#### D. New phone
1. Sign in (F02). Consent state is read from the server (`my_sync_gate()`, exists).
2. `sync_books()` (exists) lists books; pull from an empty `p_since`, book list first, then letters per book in pages.
3. Letters with `audio_kept_on_device = true` whose audio is not on this phone show F08's "not on this phone" state. If the owner's backup is on, recordings arrive per F08 section 6.5 B. If this phone was restored from an iCloud device backup, the files are already there and match by entry id against `audio_blobs` (F08), not by a synced hash: the wire contract carries no `audio_sha256` (R2 AR-32).
4. Settings > Sync shows "{n} letters on this phone" when done.

#### E. Conflicts: the protocol the code must implement

**The rule.** For the words of a letter, the server compares before it writes, both versions are kept, and the author chooses. For every other field the later arrival wins and the earlier value is recorded where a history exists. Nothing merges or picks between two people's words; only the author of both versions is ever asked.

**Words group (`text`: `final_text`, `machine_edits`, `edit_level`, which always travel together).**
1. The client sends `base` = the `v` it last saw or wrote for this letter (6.2 A step 7).
2. Server (delta, WP-F16-14): if the row exists, `text` is in `changed` and the row's `sync_xid` is greater than `base` and was not written by the current transaction, the server does not apply the `text` group. It applies the op's other groups by the later-arrival rule, writes the receipt, and returns `ok: true, applied: true or false, conflict: true, conflict_groups: ["text"]` plus `current`: the server's `final_text`, `machine_edits`, `edit_level` and `v`. These are the caller's own words, so returning them leaks nothing.
3. Client (delta, WP-F16-15): on `conflict` it keeps the server version as the letter, stores its own words in a local `sync_conflicts` row (new) with the letter id, its text group, the server `v` it now rebases on and the device time, and shows the note. It never re-sends its version unless the author picks it.
4. The author sees on that letter only: "This letter was changed on your other phone. Your version from this phone is kept too." with two buttons, "Use this phone's version" and "Keep the other one" (new `sync.conflict.title`, `.body`, `.useMine`, `.keepTheirs`). Use this phone's version enqueues an `entry.upsert` with `changed: ["text"]` and `base` = the current `v`; the server applies it (the earlier words stay in `entry_versions`). Keep the other one deletes the conflict row. The conflict row is also in export (DATA-REQ-043) until the author picks.
5. An older app that sends no `base` keeps today's behaviour. `p_api_version` (WP-F16-16) lets the server refuse a pre-protocol build once the protocol ships: older builds get `SCVER` and `sync.updateNeeded`.

| # | Conflict | Can it happen at v1.0? | Resolution | What the person sees |
|---|---|---|---|---|
| C1 | Same author edits the same letter's words on two devices offline | Yes, rare | Words group protocol above | Note on the letter, author only |
| C2 | Same author toggles in book, `occurred_on`, `sounds_like_me` or `language` on two devices | Yes | Later arrival wins per group (as built); `in_book` changes are kept in `entry_versions` (existing trigger) | Letter follows the server; no note |
| C3 | Edit on one device, delete on another | Yes | Delete wins: a tombstoned row refuses the edit; the op goes to the rejected list with its text | "This letter was deleted on another phone. Restore it with your edit?" Restore and apply my edit (DATA-REQ-043) |
| C4 | Delete and restore on two devices | Yes | Later arrival wins; both audited (built) | Letter state follows the server |
| C5 | Two parents edit the same book setting (name, nickname, date of birth, due date, "Family can read") | Yes | Later arrival wins per field (as built, `book.update` has no base). The other parent sees a one-time note naming who changed what (F12 owns the note and any undo, R3 DX-12) | F12 copy |
| C6 | Person-per-child prefs edited on two devices | Yes | Later arrival wins (as built) | Nothing |
| C7 | Words and machine edits arriving separately | Prevented | One field group by construction: `changed` names groups, never columns (built) | Never |
| C8 | Membership ended while writes are queued | Yes | Refused by RLS (`42501`) or `SCDEL` for a deleted book; op to the rejected list; content stays local and in export | "{n} letters could not be sent to {child}'s book. They are safe on this phone." (new `sync.rejected.book`) |
| C9 | Consent withdrawn or missing | Yes | `SCCON` pauses the batch; nothing is rejected (built) | Settings > Sync: paused, with a link to Privacy |
| C10 | Two parents act on the same family letter | No (contributors hidden, B1) | First action wins (built) | n/a |
| C11 | Immutable column differs | Impossible by design | `SCIMM` (built); a client bug | n/a |
| C12 | Clock skew | Yes | Server clock for every lifecycle column; device clock only for `captured_at` and `occurred_on` (TDD 02 3.6) | Dates the author chose stay as chosen |
| C13 | Server restored to an earlier point | Rare | Restore epoch (6.2 F) | "Checking your book" in Settings > Sync during the re-upload |
| C14 | A purged letter id pushed again | Yes, from a phone that missed the delete | `entries_not_purged` refuses with `SCDEL` detail `purged`; result carries `gone` (built) | The letter leaves this phone |

#### F. Restore epoch, as built
1. `sync_epochs` (built) holds one row per epoch with `started_at`, `restore_point` and `reason` (`initial`, `database_restore`, `drill`); readable by every signed-in person; written only by `sync_begin_epoch()` (service role).
2. Restore runbook (RB-8): restore into a new project; set the main project's function secrets again (never an escrow secret: the escrow key lives only in `scribe-escrow`, F08 6.5 G2); copy the Storage buckets; recreate the `escrow_svc` role and update its connection string in the escrow project; replay the purge ledger for every kind it holds (DATA-REQ-030; the kinds are in step 2a); call `sync_begin_epoch('database_restore', <restore point>)`; reopen.
2a. **Ledger kinds for the M14 build (R8 R2A-17).** `purge_ledger.entity_type` allows only `entry`, `child`, `profile` and `storage_object` today (`20261002020000_data_governance.sql`). An S02 migration adds `held_draft`, `audio_blob`, `backup_key` (a `child_keys` row), `backup_device`, `restore_request`, `push_token`, `subscription_status` and `session_seen`, and every path that deletes one of those rows writes its ledger row in the same transaction. RB-8 replays each kind. The reminder-email scheduler (F14) and the push sender (F11) check `deletion_requests` and the replayed ledger before each send, so a restored status record never emails a person who left.
2b. **Drills (R8 R2A-16).** The quarterly drill runs in staging with synthetic Asha families and a drill-only escrow key version. When a drill must restore production data, the scratch project gets no escrow secret, is deleted within 24 hours, and the restore and the deletion each write an `ops.audit_log` row; drill projects are a row in the F17 8.4 deletion matrix and are named in the Privacy Policy.
3. A pull with an older epoch, or with a cursor ahead of the server's transaction counter, answers `reset` with `reason` `epoch` or `cursor_ahead`. The client deletes nothing: it re-uploads every own letter the server once held (`entry.reupload` with `known_at` = the server `updated_at` it last saw) and pulls every book from the start. A re-upload applies only when the server copy is older than what the phone knew and was not edited since the epoch began; between two re-uploads the newer `known_at` wins (`entries.sync_restored_from`).
4. Other people's letters the restored server lacks stay on the phone marked as waiting for their author for 30 days, then leave (TDD 06 6.3; co-members cannot re-upload others' letters, RLS forbids it).
5. On a reset the backup client re-checks every recording it believes uploaded against `audio_blobs` and re-uploads missing ones (F08 section 6.5, R2 AR-08).

#### G. Sign-out, account switch, revocation

| Event | Behaviour |
|---|---|
| Sign out | Waits until the outbox is empty (A-REQ-033, F02-REQ-001). Then removes other people's letters, photos and shared book details from the phone. Own letters and recordings stay on the phone as local letters. Signing in again with the same account resumes from a full pull |
| Sign in with a different account on a phone that holds another account's rows | Refused at v1.0 (one account per install; `account_mismatch` phase, built). Choices: sign in as the previous account, or Remove the other account's letters from this phone, which offers export first and then deletes them locally |
| Refresh rejected or Apple credential revoked | App keeps working locally; outbox keeps; "Sign in again to keep your book in sync" (TDD 04 3.2.2) |
| Account deleted | DATA-REQ-023: one local export offered, then local wipe (F17 section 8 matrix) |
| Left, removed or undone membership | `gone` with `not_member` in the next pull (6.2 B step 4) |
| Kill switch `killSwitches.sync` in the signed remote config (ADR 0016 section 5.1; D-068 supersedes D-035's table) | Push and pull stop; outbox keeps; local use unchanged; resumes when on. No consumer exists today (F19-REQ-011, WP-F19-12) |

#### H. The visible queue
- Letter row: "Not sent yet" (new `sync.notSent`) while any op for it waits, never during the first 10 s after save (avoids flicker).
- Settings > Sync shows one line: "All letters are in your book" (new `sync.allSent`), or "{n} not sent yet" plus the reason: offline, signed out, waiting for consent, paused by us (kill switch), or "{n} could not be sent" with View.
- View lists rejected writes by letter date and book, with the recovery action from the C table. Rejected content and conflict copies are in export (DATA-REQ-043).
- Copy follows VOICE: never "failed" or fear words; "safe on this phone" is true and stated.

#### I. Held drafts on the server (R8 R2A-05; F14-REQ-039)

This is the one definition of the server row for letters that are not in `entries` yet. The sync protocol ADR (T15) cites it; F04, F06, F08, F14, F15 and F17 point here.

**What gets a row.** For a signed-in, consented author only:
- `held_letter`: a draft whose Save was held at the Keep gate (F14 6.2 B).
- `waiting_letter`: a voice-only letter saved before its model arrived, or whose words reached the Keep gate and were left waiting. It exists only while the built rule holds voice-only letters out of the outbox (6.2 A step 3); if F05 Q7 lets them sync as `entries` with an empty transcript, this kind is not used. **Default awaiting founder confirmation:** a `waiting_letter` never counts toward the free letters; it counts once its words exist and the author keeps it from Review (F14-REQ-037, M17).
- `held_words`: words for a voice-only letter that is already an `entries` row on the server, left waiting at the Keep gate. Used only if F05 Q7 lets voice-only letters into `entries`.
Drafts that were never held (a take in progress, a typed draft the author has not tried to save, a draft waiting to be read back) never get a row: they stay on the phone (F04 section 8).

**Table `held_drafts` (new, S02 migration).** `id` uuid primary key: the draft id, which becomes `entries.id` when kept (built: the entry id is the draft id). `author_id`, `child_id`, `kind` (the three above), `capture_mode`, `created_at` (device capture time), `occurred_on`, `occurred_precision`, `language`, `base_direction`, `prompt_key`, `in_book_choice` (the destination the author picked when held, nullable), `raw_transcript` (nullable; once non-empty it is immutable, same trigger as `entries`), the words group `final_text`, `machine_edits`, `edit_level`, `author_edits`, `locked_spans` (they travel together, F16-REQ-011), `typed_text`, `engine_version`, `pack_ref`, `audio_kept_on_device`, `sync_xid`, `v`, `updated_at`. Review state that is only screen state (which change rows are expanded, scroll position) is not stored.
- **Access.** RLS: select, insert, update and delete only where `author_id = auth.uid()` and the author is a parent of `child_id`. Never in `book_entries`, never in another member's pull, never readable by the other parent (F14 section 8).
- **Consent.** The same `require_content_consent` gate as `entries`: a push without Terms and sensitive-data consent pauses with `SCCON`.
- **Validation.** The same value-free validation trigger and size caps as `entries` (F16-REQ-020).
- **Wire.** Ops `held.upsert` (whole row, words group by compare and set as in 6.2 E) and `held.discard`; own `held_drafts` rows arrive in the author's pull in a `held` section with the same cursor rules. `entry.upsert` for an id with a `held_drafts` row deletes that row in the same transaction, so a kept letter never exists twice.
- **Purge.** `held.discard` deletes the row and, through `backup_discard`, the recording's `audio_blobs` row and object (F08 6.5 D5), and writes `held_draft` in `purge_ledger`. Account deletion and a sole parent's book purge delete the rows. A held draft never expires on its own (F04-REQ-027).
- **Restore on a new phone.** Pulled rows become local drafts in the waiting row (F14-REQ-041); their recordings arrive through F08 6.5 B.
- **Export.** The phone's own copy goes under `waiting/` (F15-REQ-018); a row not yet pulled to this phone is not in the export, and the export README says so.
- **Data map.** L4 row in `docs/legal/DATA_CLASSIFICATION.md` and a row in `DELETION_AND_EXPORT_SPEC.md` in the same PR (DATA-REQ-001).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F16-U01 | Offline for days | Outbox grows; nothing blocks capture, review, save or reading (PRD 7.3) | "Not sent yet" | Automatic on reconnect | Integration, airplane mode 72 h simulated |
| F16-U02 | App killed mid-push | Ops stay until the server result is stored; retry is idempotent by op id | Nothing | Automatic | Chaos: kill during push, 500 iterations |
| F16-U03 | Response lost after the server applied | Retry returns `dup` | Nothing | n/a | `[DATA-REQ-044] duplicate push applies once` |
| F16-U04 | Reboot with ops queued | Outbox is in SQLite with `synchronous = FULL` (`expo-adapter.ts`, exists) | Nothing | n/a | Device test |
| F16-U05 | Server 5xx, timeout or `stopped` | Backoff 1 s to 5 min with jitter; order kept (TDD 02 3.5) | Nothing until 1 h, then Settings shows "waiting for our server" | Automatic | Fault injection |
| F16-U06 | `SCRAT` from the rate limit | Back off and retry; order kept | Nothing | Automatic | Unit |
| F16-U07 | One op permanently rejected | Moved to the rejected list; the queue continues (FM3 poison op) | One notice per book per day | Action from C table | `[DATA-REQ-043] rejected op does not block the queue` |
| F16-U08 | Low storage | Pull pauses below 200 MB free [A]; push continues | Settings: "This phone is almost full" (`errors.storageLow`, exists) | Free space | Unit with mocked free space |
| F16-U09 | Background time cut off | Batch stops at a boundary; resumes next foreground | Nothing | n/a | Device test |
| F16-U10 | Interruption during sync (call, Siri) | Sync is not audio; continues | Nothing | n/a | n/a |
| F16-U11 | Word conflict (C1) | Server keeps its words; client keeps a conflict copy | Author note on the letter | Pick a version | `[F16-REQ-010]` two-device test |
| F16-U11b | Same phone edits a letter twice; the first op applies while the second waits | Second op rebased to the returned `v`; no conflict | Nothing | n/a | `[F16-REQ-025]` unit: two queued edits never raise a conflict on one device |
| F16-U12 | Book deleted on the other phone while writing | Save is local; push `SCDEL`; rejected | C8 notice | Export or keep local | Integration |
| F16-U13 | Consent missing | Queue paused, not rejected | Settings paused line | Consent | `SCCON` tests (exist) |
| F16-U14 | Duplicate taps on Try now | One sync run at a time (mutex) | One spinner | n/a | Unit |
| F16-U15 | App update with a new API version while ops wait | Server accepts the current and previous version (F16-REQ-019) | Nothing | n/a | Contract test N-1 |
| F16-U16 | Build below the oldest supported API version | `SCVER`; sync stops; local use continues | "Update the app to keep your book in sync" (new `sync.updateNeeded`) | Update | Unit |
| F16-U17 | New phone without iCloud backup | Text returns; audio returns from the owner's encrypted backup if it was on (F08-REQ-023), else not | F08 state per letter | Backup, or an export kept elsewhere | Durability drill BL-284; WP-F08-B6 |
| F16-U17b | Erase now in a build with sync on | Today `eraseEntry` returns false and nothing is erased: the server path is not built | Letter stays on the shelf until the server purge | Gap: WP-F16-13; F17 hides Erase now in sync builds until it ships (F17-REQ-025) | Unit plus sync test |
| F16-U18 | New phone restored from iCloud device backup | Database and audio return with the backup; session does not (Keychain `THIS_DEVICE_ONLY`, TDD 04 3.2.1) | Sign in; pull reconciles | n/a | Durability drill |
| F16-U19 | Server restore | Restore epoch flow | "Checking your book" | Automatic | Restore drill BL-247 |
| F16-U20 | Raw transcript hash mismatch after push | Report count (L2); re-download the row; never overwrite local text silently | Nothing | Support if repeated | `[DATA-REQ-046]` |
| F16-U21 | Co-parent takes a letter out of the book | Digest differs; the id list drops it on the reader's phone | Letter disappears | n/a | `[LEGAL-REQ-032]` |
| F16-U22 | Reader left the book | `gone` `not_member`; others' rows purged; own stay | The book moves to "Letters to {child}" | n/a | Integration |
| F16-U23 | Signed out | No sync; local use; Keep the book sheet rules (F02) | Settings: "Sign in to keep your book" | Sign in | n/a |
| F16-U24 | VoiceOver and AX5 on Settings > Sync, the rejected list and the conflict note | Labels and wrapping (PRD 7.6) | Full text | n/a | AX5 by the device script until the render harness lands (R5 EQ-04) |
| F16-U25 | iPhone SE 3 with a 5-year book (1,200 letters) | Paged pull; local apply in transactions of 200 | Book usable during pull | n/a | Device run, 5-year fixture |
| F16-U26 | Clock on the phone set years ahead | Server clock wins for lifecycle; `captured_at` checked within 1 day ahead | Nothing | n/a | Unit |
| F16-U27 | Two accounts on one phone | Refused (6.2 G) | Choice sheet | Export then remove | Integration |
| F16-U28 | A long transaction holds the watermark | Pulls return no new rows past it; timeouts end it within 30 s; alert at 30 s | Nothing beyond normal delay | Automatic | DB test with a held transaction |
| F16-U29 | Another account pre-inserts this person's op id (security review L1) | Today the op reports `dup` and is dropped. After BL-331: receipts keyed by (`profile_id`, `op_id`), written only by `sync_claim_op` inside `sync_push`; direct insert revoked | Nothing | n/a | Regression test from the review PoC F4 |
| F16-U30 | Held letter, phone replaced, signed in | `held_drafts` rows pull to the new phone as waiting letters; recordings return through F08 | The waiting row | n/a | `[F16-REQ-029]` two-phone case |
| F16-U31 | Author lets a synced held draft go while offline | `held.discard` waits in the outbox; the server row stays until it arrives; nothing else reads it | Draft gone on this phone | Automatic on reconnect | `[F16-REQ-029]` |
| F16-U32 | The other parent pulls while the author has held drafts | No `held` section, no digest change, no timing difference for the other parent | Nothing | n/a | `[F16-REQ-008]` parity matrix row |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| DATA-REQ-043 | P0 | Sync conflict rules; no op silently dropped | Given a permanent SQLSTATE (`SC***`, `23***`, `42501`), Then the op moves to the rejected list and the queue continues; given a transient error, Then retry keeps order | DELETION spec |
| F16-REQ-082 | P0 | Same-author word edits from two devices are compare and set, not last writer wins; the losing version is kept and shown to the author | As F16-REQ-010 | D-023, R2-S16, R2 AR-02; slice of DATA-REQ-043 (home the DATA-REQ-043 row above in this table), renamed in round 2 (R9 R2D-04) |
| DATA-REQ-044 | P0 | Idempotent writes | Given an op retried 5 times, Then one server effect and one audit row | DELETION spec |
| F16-REQ-083 | P0 | Corruption detection on text | Given a forced mismatch, Then a count is reported and the row is re-downloaded | DELETION spec; slice of DATA-REQ-046 (home F08), renamed in round 2 (R9 R2D-04) |
| DATA-REQ-030, DATA-REQ-031 | P0, P1 | Restore with ledger replay; quarterly drill | Given a drill with two synthetic devices, Then zero letters lost on either device | DELETION spec, TDD 06 6.3 |
| DATA-REQ-032 Rev (D-023) | P0 | Sync layer deletion: a purged or removed row reaches no device | Given a purged letter, When a fresh install of a former reader pulls, Then no row for it; given a push of its id, Then `SCDEL` detail `purged` | DELETION spec |
| F16-REQ-080 | P0 | Re-ownership in one transaction before any sync | Given a crash mid-transaction, Then nothing changed (F02) | A; slice of A-REQ-015 (home F02), renamed in round 2 (R9 R2D-04) |
| F16-REQ-081 | P0 | Sign-out and revocation only after unsynced letters sync | Given 3 queued ops, When Sign out, Then the session stays until the queue is empty | A, F02-REQ-001; slice of A-REQ-033 (home F02), renamed in round 2 (R9 R2D-04) |
| B-NFR-003 Rev (D-023) | P0 | Every RLS rule has an access test and the pull RPC has a parity test | As F16-REQ-008 | B, ADR 0004 |
| F16-REQ-085 | P0 | Working material author-only in pull | Given another member's pull, Then no `raw_transcript`, `machine_edits`, `stt_meta`, `deleted_reason` or `language` on others' rows (`book_entries` allowlist) | PRD; slice of PRD-REQ-004 (home F06), renamed in round 2 (R9 R2D-04) |
| LEGAL-REQ-001, F16-REQ-086 | P0 | No content row accepted before Terms with age and sensitive-data consent | Push returns `paused` with `SCCON` (built in triggers) | ENGINEERING_REQUIREMENTS; slice of LEGAL-REQ-006 (home F17), renamed in round 2 (R9 R2D-04) |
| F16-REQ-084 | P0 | Deletion and removal reach every member device | Given take-out by the author, Then the reader's row is gone after one pull | ENGINEERING_REQUIREMENTS; slice of LEGAL-REQ-032 (home F17), renamed in round 2 (R9 R2D-04) |
| F16-REQ-001 | P0 | Local `sync_outbox`: one row per op with op id, lane, type, target, book, payload, created time; written in the same transaction as the data change | Given a kill between data write and outbox write in a fault test, Then both or neither exist | D-023, DATA-REQ-048; built |
| F16-REQ-002 | P0, Rev | `sync_push(p_ops)` applies up to 50 ops (256 KB) per call in order, each in a subtransaction, returning a typed per-op result; `SCCON` pauses and transient classes stop the batch | Given a batch where op 3 is rejected, Then ops 1, 2, 4 to 50 apply and op 3 returns its SQLSTATE and no message | TDD 06 3.2; built |
| F16-REQ-003 | P0, Rev (R2A-25) | Op receipts `sync_op_receipts` keyed by (`profile_id`, `op_id`), written only by the security definer helper `sync_claim_op(op_id)` called from `sync_push`; the `sync_op_receipts_own_insert` policy is dropped; kept 30 days | Given the same op id twice from one person, Then the second returns `dup`; given another person's account inserting that op id first, Then the victim's op still applies; given a client `insert` into `sync_op_receipts`, Then refused (test in WP-F16-04) | B15; security review L1; BL-331; R8 R2A-25 |
| F16-REQ-004 | P0 | `entries.sync_xid` stamped by trigger; pull serves rows below `pg_snapshot_xmin` | Given two concurrent transactions committing out of order, Then a puller never skips the later-committed row (two-connection test) | D-023; built, two-connection proof owed (WP-F16-00) |
| F16-REQ-005 | P0, Rev (AR-03) | `sync_pull` returns per book: own rows whole, others' rows through `book_entries` only, the digest, `repull` on an access change, `gone` books | Given the fixture families, Then each caller's pull equals the expected set exactly | D-024 Rev (D-055); built |
| F16-REQ-006 | P0, Rev (AR-03) | Authorisation through `child_members`, `is_child_member`, `is_child_parent` and `book_entries`; no `book_access` table in v1.0 | Given a leave, Then the next pull returns the book in `gone` with `not_member` and no other person's row for it | D-055; R2 AR-03 |
| F16-REQ-007 | P0 | An access change re-pulls that whole book | Given a parent joins, Then their first pull returns every in-book letter of that book | D-023; built |
| F16-REQ-008 | P0 | Parity and cross-child leak suite: for each fixture user, `sync_pull` returns exactly what RLS and `book_entries` allow | Given the matrix (author, other parent, left parent, undone joiner, stranger, sibling book), Then zero differences; runs on every PR touching `supabase/**` | LEGAL-REQ-024, BL-195 |
| F16-REQ-009 | P0 | Take-out, tombstone and removal reach other members through the digest and `gone`; the client deletes local copies and cached photos | p95 60 s online, foreground | LEGAL-REQ-032 |
| F16-REQ-010 | P0, new protocol | Compare and set on the words group; conflict keeps both and asks the author (6.2 E) | Given phone A and phone B of one author, both offline, editing one letter's words, When A then B push, Then the server keeps A's words, B receives `conflict` with A's words, B shows the note, both versions survive a kill of B, and Use this phone's version makes B's words current with A's in `entry_versions`. Gate in WP-F16-11 | R2 AR-02; R2-S16 |
| F16-REQ-011 | P0 | Words, `machine_edits` and `edit_level` change only as one group | Given an op whose `changed` names a column instead of a group, Then `22023` | TDD 02 3.6; built |
| F16-REQ-012 | P0 | Restore epoch flow (6.2 F) | Restore drill: zero own rows deleted locally; others' rows kept 30 days as waiting | TDD 06 6.3 |
| F16-REQ-013 | P0 | New phone pull: book list first, then letters in pages | Book list p95 10 s; one year p95 30 s on LTE | PRD 7.3 |
| F16-REQ-014 | P0, Rev (D-073) | No audio, listening copy or photo bytes in any sync request; the owner's backup uses its own ciphertext path | Network capture of the E2E suite: zero audio bodies in `sync_push` or `sync_pull` | D-073 |
| F16-REQ-015 | P0 | Sign-out and account switch per 6.2 G | Given sign-out, Then own letters and audio remain, others' rows are gone | A-REQ-033, DATA-REQ-023 |
| F16-REQ-016 | P0 | "Not sent yet" on letter rows and a Settings > Sync line with reason and counts | Given 3 queued ops offline, Then the row and Settings show them within 10 s | B-NFR-009, PRD 7.4 |
| F16-REQ-017 | P0, Rev (AR-14, R2A-11) | Pull triggers per 6.2 C; foreground interval 15 s with a shared book open, 30 s otherwise; push debounce 2 s | Two-client probe over 200 or more letters, both foreground with the shared book open, clock from save tap on A to row rendered on B: p95 30 s, p99 60 s (p99 gated only with 1,000 or more samples, 06 section 0) | PRD 7.3 Rev; R8 R2A-11 |
| F16-REQ-018 | P0 | Kill switch `killSwitches.sync` honoured within 5 minutes on active clients; outbox kept | Staging drill per release | D-068, ADR 0016, LEGAL-REQ-040 |
| F16-REQ-019 | P0 | `sync_push` and `sync_pull` take an API version; the server supports the current and previous version; older builds get `SCVER` (new) and the app shows `sync.updateNeeded` | Contract test with N-1 fixtures | B15, TDD 02 6.2; not built |
| F16-REQ-020 | P0 | Logs carry only route template, SQLSTATE, durations, counts and a random request id; results never carry a message or detail | Log canary over the E2E run finds zero Asha fixture strings, letter text or ids | LEGAL-REQ-014, BL-244 |
| F16-REQ-021 | P0 | Rate limits inside the RPCs through `rate_hit` (security definer): `sync_push` 60 and `sync_pull` 120 per user per rolling minute; clients cannot write the counters | Given 61 pushes in a minute, Then `SCRAT`; given a client update of its own counter, Then refused | B15, security review M3; built in `20261005000000` |
| F16-REQ-022 | P0 | The app uses only the publishable key plus the user JWT; no service key in the bundle | Secret scan of the built bundle finds none | B15, LEGAL-REQ-026 |
| F16-REQ-023 | P0 | Rejected writes and conflict copies are kept until the user resolves them, and included in export | Given a rejected letter and a conflict copy, Then export contains both | DATA-REQ-043, LEGAL-REQ-034 |
| F16-REQ-024 | P0, Rev (R2A-03) | Durable erase in a sync build (D-085) | Given Erase now on a synced letter, Then an erase op reaches the server, which purges the row and the backup object at the exact `audio_blobs.object_path` (F08-REQ-024) within the DELETION_AND_EXPORT_SPEC window, and no device keeps a copy after its next pull | D-085; DATA-REQ-011; R8 R2A-03 |
| F16-REQ-025 | P0, new | Queued ops for a letter are rebased to the `v` returned for an earlier op of the same letter from the same device | Given two edits queued on one phone, When the first applies, Then the second carries the new `v` and the server reports no conflict | R2 AR-02 |
| F16-REQ-026 | P0, new | The pull digest's changed-since check reads only the caller's readable rows | Given a co-parent pulling with a wrong `have` while the other parent writes a private letter, Then the response is the same as with no write | Security review M5; BL-331 |
| F16-REQ-027 | P0, Rev (R2A-23) | Watermark operating limits: app roles keep the platform `statement_timeout` default and get `idle_in_transaction_session_timeout` 30 s; purge, rotation, retention and backfill jobs commit in batches under 1 s each; alert when the oldest running transaction of any role exceeds 30 s | Given a test transaction held idle for 31 s by an app role, Then it is ended. Given a service-role transaction held for 31 s, Then the alert row exists. Given the purge worker on a 10,000-row fixture, Then no single transaction runs 1 s or longer | R2 AR-14; R8 R2A-23 |
| F16-REQ-028 | P0, new | The v1.0 wire contract is frozen in `packages/api` with every column the server has or v1.0 specs need (nullable where not yet used): `language`, `author_edits`, `locked_spans`, `pack_ref`, `occurred_precision`, and the `held.upsert` and `held.discard` ops with the `held` pull section (6.2 I) | Given the contract test, Then the client types, the SQL op parser and the pull row match field for field | R2 AR-31; R8 R2A-05 |
| F16-REQ-029 | P0, new | Held drafts sync per 6.2 I: author-only `held_drafts` rows with consent, validation, immutable raw transcript, compare and set on words, purge on discard and the parity row | Given a signed-in author with 2 held letters and backup on, When the phone is replaced and the author signs in on a new phone, Then both return as waiting letters with equal text and audio hashes. Given the other parent's pull, Then 0 `held_drafts` rows and an unchanged digest. Given `held.discard`, Then the row, its `audio_blobs` row and object are gone and `purge_ledger` has `held_draft`. Given a push without consent, Then `SCCON`. Given a second `raw_transcript` write once non-empty, Then `SCIMM`. Given `entry.upsert` for a held id, Then the `held_drafts` row is gone in the same transaction | R8 R2A-05; F14-REQ-039 |
| F16-REQ-030 | P0, new | Environment matrix per section 9 is enforced in CI | Given a `testflight` or `production` build, Then the bundle carries the production Supabase URL and the production escrow public key version; given a `development` or `preview` build, Then the staging URL and the drill key; given the staging project, Then no secret holds the production escrow key (Management API check) | R8 R2A-15 |
| F16-REQ-031 | P0, new | Every M14 deletion is ledgered and replayed (6.2 F step 2a) | Given the WP-F16-08 drill with a deleted account that had backup rows, a held draft, a push token and a status record before the restore point, When RB-8 runs, Then none of those rows exists after replay and the reminder scheduler sends that account 0 emails | R8 R2A-17 |

### Inherited requirements whose home is this spec (round 2)

These IDs were cited in V2 with no definition row (R9 R2D-06). The text is taken from the source named in the last column; that source still governs the full wording. Each P0 row has a work package and a test in section 12.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| LEGAL-REQ-021 | P0 | Encryption in transit: TLS 1.2 or later, no App Transport Security exception | Given a build, When Info.plist is inspected, Then no ATS exception exists | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-021 |
| DATA-REQ-005 | P0 | Region: the Supabase project is in us-west-1; no sync vendor (D-023); no new storage location without an inventory update | Given staging and production, Then each project region is recorded as us-west-1 in the evidence file | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-005 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| `sync_outbox` (local, built): op payloads | L4 | Device only (iOS Data Protection) | App | Until applied or moved to the rejected list |
| Rejected writes (local, built) | L4 | Device only | Author | Until resolved |
| `sync_conflicts` (local, new): the author's other version of a letter's words | L4 | Device only | Author | Until the author picks |
| `entries.sync_xid`, `sync_restored_from` (built) | L2 | Postgres; `v` on the device | Row readers | Life of row |
| `sync_op_receipts` (built; key change in BL-331) | L2 with L3 profile id | Postgres | Owner | 30 days (`sync_push` trims own, `sync_housekeeping` trims all) |
| `sync_epochs` (built) | L2 | Postgres | Everyone signed in (epoch only) | Permanent |
| `sync_rate_windows` (built, unlogged) | L2 with L3 profile id | Postgres | Owner reads; `rate_hit` writes | Rolling window |
| Cursors, digests and last sync time | L2 | Device | App | Install |

What never leaves the phone in v1.0: listening copies, drafts that were never held (6.2 I), safety tiers, the outbox, rejected writes and conflict copies as tables. Held and waiting letters of a signed-in author leave only as author-only `held_drafts` rows (6.2 I; L4, Postgres, author only, until kept, discarded or account deletion). Audio leaves only as the owner's encrypted backup when on (F08). PowerSync is not used, so no sync processor holds L4 data (TDD 05 OQ-L15 is moot under D-023). Account deletion clears every server row above that references the person (F17 section 8 matrix).

## 9. Non-functional requirements

**API budgets (B15, PRD 7.2, measured at the client, US, good LTE)**

| Endpoint | p95 / p99 | Auth | Idempotency | Rate limit | Payload cap |
|---|---|---|---|---|---|
| `sync_push(p_ops)` (built) | 800 ms / 2 s | User JWT, RLS (security invoker) | Op id receipt | 60 per user per minute | 50 ops, 256 KB |
| `sync_pull(p_since, p_limit)` (built) | 300 ms / 800 ms per page | User JWT; `require_user()`, `book_entries` | Read; safe to repeat | 120 per user per minute | 500 rows, 100 books |
| `sync_books()` (built) | 300 ms / 800 ms | User JWT | Read | Through `rate_hit` (BL-332) | small |
| `create_child`, `create_first_run_children` (built) | 500 ms / 1.2 s | User JWT | Client id | 20 per user per day | 6 children |
| `create_child_invite`, `accept_child_invite`, `leave_child`, `remove_child_member` | 500 ms / 1.2 s | User JWT | Idempotency key header (built in `20261005000000`) | F11 | small |
| `delete_entry`, `restore_entry` (built) | 500 ms / 1.2 s | User JWT | Naturally idempotent | 120 per user per hour | 1 KB |
| `my_sync_gate`, `policy_actions_needed` (built) | 300 ms / 800 ms | User JWT | Read | 60 per user per hour | 4 KB |
| Signed remote config read (ADR 0016 section 6) | 300 ms (`public_document`, ADR 0017) | Public, no JWT; ETag | Read | n/a | 4 KB |

Error budget: under 0.1% 5xx per endpoint class over 28 days (TDD 06 2.3). Request ids: the client sends a random `x-request-id` (UUIDv7) on every call and keeps it in on-device diagnostics; Edge Functions log it; whether the Supabase API gateway logs custom headers is Unverified (Q5). Region: one US region (B15, DATA-REQ-005).

**Load targets (PRD 7.8 recomputed without contributors)** [A] unless marked

| Target | 1k families (launch) | 100k families | Change from PRD 7.8 |
|---|---|---|---|
| Accounts per family | 1.5 (at most 2 parents, D-069; 25% or more second-parent goal) | 1.5 | Was 2.2 with contributors |
| MAU | 1.5k | 150k | Was 2.2k / 220k |
| Concurrent sync clients at peak (5% of MAU) | 75; test at 200 (kept) | 7.5k | Was 200 / 11k |
| Entry writes, peak 15 min | 5 per s (test load kept) | 50 per s (kept) | Unchanged |
| `sync_pull` calls at peak (one per 15 s per concurrent client with a shared book open, the worst case; 6.2 C) | 5 per s; test at 14 per s (200 clients) | 500 per s | New; doubled by R8 R2A-11 |
| Write RPCs (invites, leave) | 1 per s | 10 per s | Was 2 / 20 |
| Encrypted audio uploads (owner backup, steady state) | About 0.1 per s at peak [A: 40 recordings per family per month, 50% of families backing up] | About 10 per s | Was 1 / 10 (B7); F08 section 9 holds the limits |
| First-enable upload burst | One family's whole history at once (year 1 about 480 objects, 230 MB); test 20 families enabling at once | n/a | New (R2 AR-15) |
| Escrow unwraps | Under 1 per hour [A] | Under 30 per hour [A] | New; F08 section 9 |
| Status report writes (D-080) | F14 owns the number | F14 | New |
| Children's books (1.3 per family) | 1.3k | 130k | Unchanged |
| Letters after 12 months (240 per family) | 240k | 24M | Unchanged |
| Database size (about 10 KB per letter, TDD 06 3.4) | About 3 GB | About 290 GB; about 120 GB if `stt_meta` stays on the device (Q3) | PRD said 8 GB / 150 GB |
| Analytics events (40% consent, 150 per user per month) | About 90k per month | About 9M per month | Was 130k / 13M |

Gate (one position with 06 section 16; default awaiting the founder's answer to 08 Q8 at T15): before App Review submission (G4), a 1-hour run in staging at 1x the 1k peak targets, including the 20-family first-enable burst, the escrow limit test and the two-client freshness probe; section 3 budgets are read there at p95, and at p99 only where 1,000 or more samples exist. The full load test at 2 times the 1k targets with a 4-hour soak (BL-282, WP-F16-12) gates the C2 public link, paid marketing or 1,000 families, whichever comes first. 2 times 100k before passing 25k families (PRD 7.8).

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
| staging | `scribe-staging` (BL-107) | CI from `develop` with the `approve-migration` label (08 section 7; R2 AR-21) | Synthetic Asha families, load data |
| prod | `scribe-prod` | CI on a `db-v*` tag, after the founder's approval | Real families |
| escrow | `scribe-escrow` (new, F08 6.5 G2) | No tables of ours; the only migration-like change is the `escrow` function deploy, from CI on a release tag with the founder's approval | None: one function and three secrets |

**Which build talks to which project (R8 R2A-15).** On `develop` today the `testflight` profile in `apps/mobile/eas.json` uses EAS environment `preview` and channel `preview`, the same as internal preview builds, so C1 families would land wherever `preview` points. From the M14 switch-on, the matrix is [R]:

| EAS profile | EAS environment | Update channel | Supabase project | Escrow public key | Email sending | Analytics |
|---|---|---|---|---|---|---|
| `development` | `development` | `development` | `scribe-staging` | Drill key | Only to an allowlist of test addresses | None |
| `preview` (internal builds) | `preview` | `preview` | `scribe-staging` | Drill key | Allowlist only | Separate staging project, or none |
| `testflight` (C1 families, real letters from T22) | `production` (change from `preview`) | `testflight` (new, so an update for internal builds never reaches families) | `scribe-prod` | Production key | On | Production project, consent-gated |
| `production` | `production` | `production` | `scribe-prod` | Production key | On | Production project, consent-gated |

A CI check enforces the matrix (F16-REQ-030); S20 owns the `eas.json` change.

Rules: agents never apply a migration to a remote project; any PR touching `supabase/**` or auth needs an independent review run and the founder's `approve-migration` label (D-041). Database changes are new files only; applied files in `.github/migrations-applied.txt` are never edited. A function defined in another stream's migration is changed only by S02 (R2 AR-16).

## 10. Analytics

| Event | Properties | Question |
|---|---|---|
| `sync_failed` (exists) | `reason: network / auth / conflict / server / unknown` | Where does sync break? |
| `error_shown` (exists) | new codes `sync_rejected`, `sync_conflict`, `sync_update_needed` | How often do people meet each state? |
| Server aggregates (BL-024, L2 counts) | ops applied, duplicates, word conflicts, rejections by SQLSTATE, pull pages, resets | Contract health without device consent |

## 11. How we build it (with the architect)

| Part | Files | Status 13 Oct |
|---|---|---|
| Wire contract | `apps/mobile/src/lib/sync/types.ts` today; moves to `packages/api/src/sync.ts` (new) with an API version (WP-F16-01, WP-F16-16) | Types built in the app; not in `packages/api`; no API version |
| Local store | `apps/mobile/src/lib/db/migrations.ts` (append a version; the coordinator assigns the number, R2 AR-37): `sync_conflicts` | Outbox, rejected writes, cursors built; conflicts table not built |
| Sync client | `apps/mobile/src/lib/sync/` (`engine.ts`, `outbox.ts`, `merge.ts`, `ownership.ts`, `signal.ts`) | Built; conflict handling and rebase not built |
| Server | `20261004100000_sync_engine.sql`, `20261005000000_family_cap_language_idempotency.sql`; deltas in a new S02 migration: receipts keyed by person (L1), digest check over readable rows (M5), words compare and set, `p_api_version`, role timeouts | Built and pending apply; deltas not built |
| Tests | `supabase/tests/sync_engine.test.mjs`, `sync_perf.test.mjs` (built); `sync_parity.test.mjs`, `sync_conflict.test.mjs` (new); client unit tests; chaos suite (BL-177) | Partly built |

**Sequencing.** Order only; dates live in `08-delivery.md` section 5. (1) The sync ADR below. (2) BL-331 deltas and the words compare and set in one S02 migration. (3) Client rebase and conflict handling (S03). (4) API version and contract freeze. (5) Two-phone conflict test, chaos suite, restore drill.

**Riskiest unknowns and spikes**
1. The watermark on hosted Supabase: `pg_current_xact_id` and `pg_snapshot_xmin` work in PGlite (tests green); a two-connection proof on a real project is owed (WP-F16-00).
2. Background sync from Expo (BGTaskScheduler wrapper) is Unverified; v1.0 does not depend on it.
3. Freshness without Realtime: measured in the two-client probe against the 30 s bar with the 15 s pull (6.2 C).

**ADRs required before build** (numbers per `08-delivery.md` section 8.1: next free 0020 or later, checked against open branches; matches R2's list)

| ADR | Content | Closes | Blocks |
|---|---|---|---|
| Sync protocol v1 (supersedes ADR 0004) | Ops and results as built, `sync_xid` watermark and its operating limits, digest removal, restore epochs, receipts keyed by person, API versioning and N-1, the words compare and set (6.2 E), the frozen v1.0 wire contract | R2 AR-01, AR-02, AR-14 (watermark), AR-31 | WP-F16-14 to -16 |
| Account deletion across systems | Owned by F17 section 11 | R2 AR-22, AR-23 | WP-F16-13 server part |
| M14 capabilities and kill switches (amends ADR 0016) | Owned by F19 section 11 | R2 AR-12, AR-27, AR-28 | WP-F19-12 |

## 12. Work packages

Status is what `develop` holds on 13 Oct 2026. All of it is v1.0 (M14); none of it runs until the release profiles set `EXPO_PUBLIC_SERVER_FEATURES=on`. File ownership follows `08-delivery.md` section 3.3; a path here owned by another stream is a request.

| WP | Scope | Stream | Owns files or folders | Depends on | Done when | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|---|
| WP-F16-00 | Watermark proof on a real project | S02 with S03 | `experiments/sync-watermark/` | Staging project | Two-connection test on staging proves no skipped row; findings in PR; `[DATA-REQ-005]` | Pair. BL-173 | Partly built: watermark in SQL, PGlite tests green | none |
| WP-F16-01 | Move the sync contract into `packages/api` | S07 | `packages/api/src/sync.ts` (new), its test | Sync ADR | Type tests; the app imports the contract from `packages/api`; `[F16-REQ-028]` | Agent | Not built | none |
| WP-F16-02 | `book_access` table | none | n/a | n/a | n/a | n/a | Removed from v1.0 (D-055; R2 AR-03) | none |
| WP-F16-03 | Server protocol | S02 | Migrations listed in section 11 | none | `[F16-REQ-002]`, `[F16-REQ-004]`, `[F16-REQ-005]`, `[F16-REQ-011]`, `[DATA-REQ-044]`; `[F16-REQ-003]`, `[F16-REQ-006]`, `[F16-REQ-007]`, `[LEGAL-REQ-001]`; `[F16-REQ-086]` | Agent, `approve-migration`. BL-173 | Built in `20261004100000` and `20261005000000`, not applied | none |
| WP-F16-04 | Parity, leak and M5 regression suite | S02 with S19 | `supabase/tests/sync_parity.test.mjs` (new) | WP-F16-03 | `[F16-REQ-008]` (with the `held_drafts` row), `[F16-REQ-026]`, `[F16-REQ-003]` direct-insert refusal; `[DATA-REQ-032]`, `[F16-REQ-014]`, `[F16-REQ-022]`, `[LEGAL-REQ-021]`; `[F16-REQ-083]`, `[F16-REQ-085]` | Agent. BL-195 | Partly built: `access_matrix.test.mjs`, `sync_engine.test.mjs` | none |
| WP-F16-05 | Local schema and outbox writes | S03 | `lib/db/migrations.ts`, `lib/sync/outbox.ts` | BL-111 | `[F16-REQ-001]` fault test; migrator fixtures v0 to head | Agent. BL-174 | Built | none |
| WP-F16-06 | Push and pull client, apply, scheduler at 15 s (shared book open) and 30 s intervals, push debounce 2 s | S03 | `lib/sync/engine.ts`, `merge.ts`, `signal.ts` | WP-F16-03, WP-F16-05 | `[F16-REQ-009]`, `[F16-REQ-013]`, `[F16-REQ-017]`, kill-during-push 500 of 500; `[F16-REQ-080]` | Agent. BL-174 | Built; interval not checked against 30 s; switch off in release profiles | S1-22 two phones |
| WP-F16-07 | Rejected writes and Settings > Sync screen | S03 with S14 | Settings > Sync screen, `lib/sync/` status | WP-F16-06 | `[F16-REQ-016]`, `[F16-REQ-023]` | Agent | Partly built: rejected writes stored; no screen | none |
| WP-F16-08 | Restore epoch drill, with the backup re-check | S03, founder | Runbook RB-8 (`docs/runbooks/`, request) | WP-F16-06, BL-107, WP-F08-B5a | `[F16-REQ-012]` drill passes in staging, including one escrow restore end to end with the drill key (F08); `[F16-REQ-031]` deleted-account case; `[DATA-REQ-030]`, `[DATA-REQ-031]` | Pair. BL-247 | Partly built: client re-upload and held rows in `merge.ts`; drill not run | Staging drill |
| WP-F16-09 | Sign-out, account switch, revocation | S01 with S03 | `lib/auth/machine.logic.ts` | WP-F16-06, WP-F02-09 | `[F16-REQ-015]`, `[F16-REQ-081]` | Agent | Partly built: sign-out waits for the outbox; device check owed | S2-14 |
| WP-F16-10 | Value-free validation, rate limits, role timeouts, batch-size rule for server jobs and the long-transaction alert for every role | S02 | New migration; `ops-health` alert row | WP-F16-03 | `[F16-REQ-020]`, `[F16-REQ-021]`, `[F16-REQ-027]` | Agent, `approve-migration` | Partly built: `rate_hit`; timeouts and alert not built | none |
| WP-F16-11 | Chaos suite and the two-phone conflict gate | S19 with S03 | CLI stack in CI; `docs/qa/` two-phone script (request) | WP-F16-15 | Offline, kill, duplicate push, reorder; `[F16-REQ-010]` on two phones; freshness p95 30 s | Agent plus human. BL-177 | Not run | S1-22 |
| WP-F16-12 | Load test at 2 times the 1k targets with the backup burst | S19 | k6 scripts | WP-F16-06, staging | Section 9 targets at 2x | Agent. BL-282 | Not run; 08 Q8 | none |
| WP-F16-13 | Erase op for a synced letter (D-085) | S02 server, S03 client | `store.ts` `eraseEntry` sync branch, `lib/sync/outbox.ts`, new migration | WP-F16-06 | `[F16-REQ-024]`; `[LEGAL-REQ-032]`; `[F16-REQ-084]` | Agent, `approve-migration` | Not built | none |
| WP-F16-14 | Words compare and set, server | S02 | New migration (`sync_push` redefined by S02 only), `supabase/tests/sync_conflict.test.mjs` (new) | Sync ADR | `[F16-REQ-010]` server half: the conflicting text group is not applied, `conflict_groups` and `current` returned, other groups applied; `[F16-REQ-082]` | Agent, `approve-migration` | Not built (P0 gap) | none |
| WP-F16-15 | Conflict handling and rebase, client | S03 | `lib/sync/merge.ts`, `outbox.ts`, `types.ts`, local migration for `sync_conflicts`, conflict note component (request to S13 for the letter view slot) | WP-F16-14 contract | `[F16-REQ-010]` client half, `[F16-REQ-025]`, `[F16-REQ-023]`; `[DATA-REQ-043]` (exists in `apps/mobile/test/sync-outbox.test.ts`) | Agent | Not built (P0 gap) | S1-22 |
| WP-F16-16 | API version and N-1 support | S02 server, S03 client, S07 contract | `sync_push` and `sync_pull` signatures (new overloads), `packages/api/src/sync.ts` | WP-F16-01 | `[F16-REQ-019]` contract test with N-1 fixtures | Agent, `approve-migration` | Not built | none |
| WP-F16-17 | Held drafts on the server (6.2 I): `held_drafts` table, RLS, consent and immutability triggers, `held.upsert` and `held.discard` ops, `held` pull section, the delete-on-keep rule, client apply into local drafts | S02 server, S03 client | New S02 migration; `lib/sync/outbox.ts`, `merge.ts`; `packages/api/src/sync.ts` | Sync ADR (T15), WP-F16-01, WP-F16-03 | `[F16-REQ-029]`, `[F16-REQ-028]` contract rows, `[F14-REQ-039]` two-phone case | Agent, `approve-migration` | Not built (new, R8 R2A-05; request to the delivery lane for a slot) | S1-22 two phones |
| WP-F16-18 | Ledger kinds for M14 rows and their replay in RB-8; scheduler and push sender check deletion before each send | S02, S07 | New S02 migration; `purge-worker/`; RB-8 (request) | WP-F16-08 | `[F16-REQ-031]` | Agent, `approve-migration` | Not built (new, R8 R2A-17) | Staging drill |
| WP-F16-19 | Environment matrix: `testflight` profile to EAS environment `production` and channel `testflight`; CI check of URLs and escrow key versions per profile | S20 | `apps/mobile/eas.json`, `.github/workflows/` | M14 capabilities ADR | `[F16-REQ-030]` | Agent | Not built (new, R8 R2A-15) | none |

## 13. Open questions and assumptions

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 D-023: outbox and cursor on expo-sqlite | Decided (founder, 3 Oct) | n/a |
| Q2 Realtime broadcast per book (ids only) for foreground phones, to reach p95 5 s | Founder with S03, v1.1 planning | Adds a channel authorised by `is_child_member`; 06 section 4 freshness row |
| Q3 Do per-token timestamps in `stt_meta` sync to the server at all? | Data architect with F05 owner, milestone in 08 | Database size at 100k: 290 GB or 120 GB |
| Q4 In-app import of an export ZIP to bring recordings back | Founder, v1.1 planning | F15 and F08 |
| Q5 Does the Supabase API gateway log custom request headers and paths with ids (TDD 06 C-1)? | Privacy counsel and data architect, before beta C1 | Request-id design and data map row |
| Q6 Book-setting conflicts (C5): later arrival plus a note, or compare and set like words? Spec default: later arrival plus F12's note | Founder with F12 owner | C5 row; F12 |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Same-author two-device word edits are rare | Server conflict count in C1 |
| A2 | 1.5 accounts per family | Server aggregate after 8 weeks |
| A3 | A 15 s foreground pull for shared books stays inside Supabase plan limits at 7.5k concurrent | Load test at the 100k profile before 25k families |

## 14. Sources

- Decisions: `docs/prd/v2/_AUTHORING.md` (B2, B7, B15, M14, M15, M16); `docs/agents/BRIEF-2026-10-03.md` items 9, 17; `docs/DECISIONS.md` D-023, D-024, D-033, D-035, D-041, D-055, D-068, D-073, D-085; ADR `docs/adr/0004-sync-engine.md` (status note); `08-delivery.md` sections 3.3, 7, 8.1.
- Round 2: `reviews/R8-round2-architecture-privacy.md` R2A-05, -11, -15 to -17, -23, -25; `apps/mobile/eas.json` on `origin/develop` ed16ca3 (profiles, environments, channels); `20261004100000_sync_engine.sql` lines 170 (`sync_op_receipts_own_insert`) and 477 (security invoker); `20261002020000_data_governance.sql` (`purge_ledger.entity_type`).
- Reviews: `reviews/R2-architect.md` AR-01 to AR-03, AR-08, AR-14 to AR-16, AR-21, AR-31, AR-32, AR-37; `reviews/R5-eng-qa.md` EQ-04, EQ-20; `docs/reviews/2026-10-04-security-privacy.md` M3, M5, L1.
- Code read 13 Oct 2026: `apps/mobile/src/lib/sync/types.ts`, `outbox.ts`, `merge.ts`, `engine.ts`; `apps/mobile/src/lib/capabilities.ts`; `apps/mobile/src/lib/store.ts`; `supabase/migrations/20261004100000_sync_engine.sql` (header, sections 1 to 6, `sync_push`), `20261005000000_family_cap_language_idempotency.sql` (header, `c_groups`); `20261002020000_data_governance.sql` (`book_entries`, `is_child_parent`); `20260930000000_scribe_core.sql` (`is_child_member`, `entry_versions`); `.github/migrations-applied.txt`.
- Requirements: `docs/prd/PRD.md` K-39, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 7.10; `docs/prd/A-entry-and-auth.md` A-REQ-015, -032, -033; `docs/prd/B-first-run-and-family.md` B-NFR-003, -009; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-010 to -016, -023, -030 to -032, -040 to -048; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-001, -006, -009, -014, -024, -026, -032, -034, -040.
- Technical: `docs/tdd/02-sync-backend.md` 2.2, 3.2 to 3.6, 6; `docs/tdd/04-security-identity.md` 3.2; `docs/tdd/06-performance-reliability.md` 2.2, 2.3, 3.1 to 3.4, 6.3; `docs/BACKLOG.md` BL-022, -024, -107, -111, -173 to -177, -195, -244, -247, -282, -284, -331, -332.
- Research: `research/R1-competitors-by-feature.md` F16 (R1-S4, R1-S5, R1-S6, R1-S12, R1-S23, R1-S31, R1-S44, R1-S64); `research/R2-customer-evidence.md` section 0 item 1, T8, R2-S14, R2-S16.
