# ADR 0025: Sync protocol v1 (outbox push, cursor pull, words compare and set)

- **Status:** Proposed, 15 Oct 2026, revised the same day after the first review round and S02's and S07's branches (draft for T13; decided at T15, or the spec default in PRD V2 F16 stands). Numbered 0025 by the coordinator on 16 Oct 2026 (0023 is #139's, 0024 is #150's; this record was drafted as 0023).
- **Deciders:** founder (D-023 is decided; this records how it is built). Architecture review: delivery lead, data and mobile review agents.
- **Authors:** S03 (local store and sync) with S02 (database and access rules) for the server half.
- **Supersedes:** ADR 0004 for v1.0 once accepted (D-023: outbox and cursor on expo-sqlite; PowerSync revisited at 10k families).
- **Closes:** R2 AR-01, AR-02, AR-14 (watermark), AR-31, AR-32; R3 DX-01; R8 R2A-05, R2A-25.
- **Related:** PRD V2 `docs/prd/v2/features/F16-sync.md` sections 6.2, 7, 11 and 12; `08-delivery.md` sections 3.3, 4 and 8.1; DECISIONS D-023, D-055, D-068, D-073, D-085, D-100, D-103; `supabase/migrations/20261004100000_sync_engine.sql`, `20261005000000_family_cap_language_idempotency.sql`; `apps/mobile/src/lib/sync/`.

## Context

Sync is built on `develop` and green in CI, but it has never run against a configured project or two real phones (F16 section 1). The alpha on Thu 29 Oct 2026 (D-106) is the first time two parents' phones sync letters, books and held drafts through the staging server. Three things stop the built engine from keeping F16's promise that nothing is lost or silently overwritten:

1. **Last writer wins on words.** The server applies an edit whatever its `base`; two offline edits of one letter on two phones of the same author lose the earlier words to `entry_versions`, which the author never sees (F16 section 1, the P0 gap).
2. **The wire contract lives only in the app** (`lib/sync/types.ts`), with no API version, and lacks the columns v1.0 needs (`language` mapping on the phone, `occurred_precision`, `base_direction`, held drafts).
3. **Held letters live only on one phone.** A letter held at the Keep gate, or a voice-only letter waiting for words, is lost with the phone (R3 DX-01, F14-REQ-039).

This record states the protocol as built, then the v1 changes, who builds each part, and what is still open. Fields marked "as built" are in the migrations above; "v1" fields are new.

## Decision

### 1. Transport and authorisation (as built)

- Two RPCs: `sync_push(p_ops jsonb)` (security invoker: RLS, the consent gate and every trigger apply) and `sync_pull(p_since jsonb, p_limit int)` (security definer, `require_user()`, never takes a profile id). `sync_books()` lists books without letters.
- Rate limits inside the RPCs through `rate_hit` (push 60, pull 120 per user per rolling minute; `SCRAT`). Payload caps: 50 ops and 256 KB per push; 500 rows and 100 books per pull.
- Authorisation through `child_members`, `is_child_member`, `is_child_parent` and the `book_entries` view; no `book_access` table in v1.0 (D-055).
- Results carry ids, versions and the caller's own words only. A per-op error carries a SQLSTATE, never a message or detail.

### 2. Ops and results

| Op | Data | Status |
|---|---|---|
| `entry.upsert` | full letter snapshot; `changed` names field groups; `base` (section 5) | as built; v1 compare and set |
| `entry.reupload` | restore re-upload with `known_at` | as built |
| `entry.delete`, `entry.restore` | none | as built |
| `book.first_run`, `book.create`, `book.update` | book fields | as built |
| `prefs.upsert` | `signs_as`, `include_in_reminders` | as built |
| `held.upsert`, `held.discard` | an author-only held draft (section 9) | v1, WP-F16-17 |

Per-op result: `{op, ok: true, dup?, applied?, conflict?, missing?, entry?}` or `{op, ok: false, code, gone?}` (as built). v1 adds three fields, all optional so an older server or client ignores them:

- `conflict_groups: ['text']`: groups the server did not apply because they changed since `base`.
- `current: {final_text, machine_edits, edit_level, v}`: the server's words whenever they changed since `base` (a refused words group, or an op that carried no words). These are the caller's own words (RLS limits the row to its author), so nothing leaks.
- `applied_v`: on a duplicate, the version the op wrote when it first applied (from its receipt), only when that version holds this phone's words. A duplicate of an op whose first answer was a words conflict (refused, or `current` returned) carries no `applied_v`: it answers `conflict_groups` (when refused) and `current` again, with the letter's words now. A lost answer must never turn a refusal into a rebase on words the phone never saw.

`SCCON` pauses the batch, transient classes (40, 53, 55, 57, 58, XX) stop it (as built).

### 3. Versions and the pull cursor (as built)

`entries.sync_xid` is the writing transaction's id (`xid8`). The pull serves, per book, rows with `(sync_xid, id)` after the cursor and below `pg_snapshot_xmin`, so a late commit is never skipped. Operating rule (S02, WP-F16-10): app roles keep the platform `statement_timeout` and get `idle_in_transaction_session_timeout` 30 s; server jobs commit in batches under 1 s; an alert fires when the oldest running transaction of any role passes 30 s. The two-connection proof on a hosted project is WP-F16-00.

### 4. Removal, restore and receipts (as built, with S02's fixes)

- Removal is a digest (count and 48-bit sum of readable ids) with an `ids` round on a difference; another person's letter that stops being readable is never sent as a row. The changed-since check must read only the caller's readable rows (security review M5, F16-REQ-026; S02 in BL-331).
- Restore epochs: a pull with an older epoch or a cursor ahead of the server answers `reset`; the phone deletes nothing, re-uploads its own letters (lane 0) and pulls every book again (TDD 06 P-1).
- Op receipts are keyed by (`profile_id`, `op_id`) and written only by a security definer helper (`sync_claim_op`, BL-331 L1; F16-REQ-003). v1 adds `applied_v` to the receipt.
- **Deletions during a consent pause** (LEGAL-REQ-009; final review B-1). When `sync_push` answers `paused`, the op that met `SCCON` and every op after it did not apply, so the phone treats them as never sent. A delete made during the pause then drops them, as it drops any upload that never left. When the server takes a delete, every upload of that letter queued before it is dropped too. Either way, an upload that waited out the pause never brings a deleted letter back.
- **The local purge in a sync build** (D-085; final review B5). The server's clock rules every letter it holds. A deleted letter the server never held, or no longer holds, with nothing queued for it, is erased by the phone's own 30 day clock (`entries.expiredLocalOnlyIds`), with nothing sent. Otherwise it would wait in Recently deleted forever.

### 5. The words compare and set (v1; F16 6.2 E; WP-F16-14 server, WP-F16-15 client)

**Server rule.** For `entry.upsert` with a `base` on an existing row: if the words group changed since `base` by another transaction, the `text` group is not applied (the other groups are, by later arrival), and the result carries `conflict_groups: ['text']` and `current`. If the op did not carry `text`, everything applies and `current` is returned too. A duplicate returns `applied_v`. No `base` (an older app): unchanged, later arrival wins.

**What "changed since base" reads.** This record proposes a words version, `entries.text_xid` (`xid8`, stamped by trigger only when `final_text`, `machine_edits` or `edit_level` change), instead of `sync_xid` as F16 6.2 E step 2 words it. Xid order is not commit order: a writer with an older xid can commit words after a newer transaction already answered a phone with `v`, so the trigger stamps `old.sync_xid + 1` when the writer's xid is not past it, and a phone's base never passes over words it has not seen (a false note at worst). A per-row words counter would be cleaner but changes what `base` means on the wire; S02 may choose it with WP-F16-16. With `sync_xid`, another phone taking a letter out of the book would raise a words conflict and show the author a note about words nobody changed (F16 C2 says later arrival, no note). If S02 keeps `sync_xid`, the client below still keeps every version; only those false notes appear.

**Phone rules** (`lib/sync/outbox.ts`, `merge.ts`):

1. `base` is the server version this phone's words descend from. A new op behind another queued upsert of the same letter inherits that op's base; otherwise it takes `entries.server_version`.
2. A push batch carries at most one op per letter. It ends before a letter's second op, so queue order is kept exactly and the next op leaves only after the answer rebased it.
3. After an op applies, every later queued upsert of the letter is rebased on the version it wrote (F16-REQ-025). A duplicate rebases only on `applied_v`, never on the current version, which may hold another phone's words. `base` is the one field the outbox rewrites after a send: the server reads it only when it first applies an op, and a duplicate ignores it. This is safe only because `applied_v` is the version this phone's own words produced (section 2); with no `applied_v` nothing is rebased. With only a restore-time `entry.reupload` queued, a new edit's base is `'0'`, because a pull may have moved `server_version` past words this phone keeps for the server to judge (final review A-M1), and a duplicate of a words op with neither `applied_v` nor `current` (a receipt older than v1) leaves `server_version` where it was. A base only moves forward: a late duplicate's older `applied_v` never takes it back. After a conflict the phone records the later of the row's version and `current.v`, since it holds those words.
4. When `current` arrives and this phone's words were refused, or it still has its own words queued for that letter, this phone's latest words become a **conflict copy**, queued ops stop carrying words (an op left with no group is dropped), and the letter follows the server's words. Identical words make no copy. With nothing of its own queued, the phone takes `current` silently.
5. A pull that brings newer words for a letter with ops queued takes the words when none of those ops changes words, and rebases them; otherwise it keeps the local words for the server to judge. Other groups keep the queued value (the later writer).
6. A conflict copy is a row in the local `rejected_writes` table with code `conflict` and the phone's whole snapshot. That table already has the needed life cycle (kept on the phone, never uploaded, until the person acts); export carries every copy word for word in `data/other-versions.json` (export format 1.1.0, F16-REQ-023), and local schema numbers are fixed (`08-delivery.md` section 4), so no new table is added. F16 section 11 names a `sync_conflicts` table; this replaces it.
7. The author sees one note per letter (new strings below). "Use this phone's version" writes the copy's words back and queues `entry.upsert` with `changed: ['text']` on the current base; the server applies it and keeps the other words in `entry_versions`. "Keep the other one" deletes the copy. Erasing a letter deletes its copies.

Nothing ever merges two versions of words, and only the author of both is asked (F16 section 4 "Never").

### 6. Other field groups (as built)

`in_book`, `sounds_like_me`, `occurred_on` and `language`: later arrival wins per group; `in_book` changes stay in `entry_versions`. Book settings (`book.update`, C5) and per-person prefs (C6): later arrival wins per field; the one-time note about the other parent's change is F12's (R3 DX-12, F16 Q6).

### 7. Letter language and the v1.0 columns (G-26, WP-F04-03, WP-F04-14)

- The phone stores a BCP-47 tag (`en-GB`); the server holds one of seven codes (`packages/core` `LANGUAGE_CODES`) in `entries.language`, author-only (never in `book_entries`). The phone sends the primary code when it is one of the seven, and omits the key otherwise, so an op never fails the server's check and never clears another phone's value. It keeps its finer tag while the server names the same language.
- `occurred_precision` travels with `occurred_on`, `base_direction` with `text`. The server ignores both until S02 adds the columns (WP-F04-14).

### 8. API version (v1, WP-F16-16; not built)

`sync_push` and `sync_pull` gain `p_api_version`. The server accepts the current and previous version; an older build gets `SCVER` and the phone shows `sync.updateNeeded`. Protocol v1 is version 1; today's build is version 0. Until this ships, a v0 build keeps last writer wins, which is no worse than today.

### 9. Held drafts as author-only rows (v1, WP-F16-17 and WP-F14-22; F16 6.2 I)

A held letter, or a voice-only letter waiting for words, of a signed-in, consented author syncs as a `held_drafts` row: author-only RLS, never in `book_entries` or another member's pull, the same consent gate, validation and raw-transcript immutability as `entries`. Ops `held.upsert` (words by the same compare and set) and `held.discard`; own rows arrive in a `held` section of the author's pull with the same cursor rules; `entry.upsert` for an id with a `held_drafts` row deletes that row in the same transaction. On the phone the held marker and server version are local schema v8 (`08-delivery.md` section 4), which follows v7.

How the client does it (v8):
- **What goes up.** Only a draft the author held at the Keep gate (`store.holdDraft`, `drafts.held_kind`) and a voice-only letter waiting for its words (`kind` `waiting_letter`), and only once signed in. A take in progress, a typed draft never saved and a draft waiting to be read back never leave the phone. Every change to a held draft queues one whole-row `held.upsert` in the same transaction; an unsent one is rewritten in place. Letting a held draft go queues `held.discard` only if the server may hold the row; it still goes during a consent pause (LEGAL-REQ-009).
- **Older server.** Held ops leave only once a pull has carried a `held` section (`sync.heldServer`); against a server without held drafts they wait in the outbox instead of being refused as an unknown op type, and everything else syncs as before.
- **Order.** The one-op-per-letter rule (section 2) covers `held.*` too: a draft and the letter it becomes share the id, so a later upload, or the `entry.upsert` that keeps it, leaves only after the earlier answer.
- **Words.** `held.upsert` carries `base`: the held row's last `v`, or the base of an upload of the draft still queued. It says truthfully which groups it changes. `text` is included only when the typed words differ from the words the server last had (`drafts.held_typed`), so a date, language or direction change never raises a words conflict, and the server compares and writes the words only for an op that carries `text` (final review B-3). After an answer, the version this phone's words descend from becomes `held_v`. For a duplicate that is only `applied_v`, the version the op wrote (on the held receipt), never the row as it is now, which may hold another phone's words; with no `applied_v` nothing moves (final review A-B1). A refusal makes a conflict copy only when this phone changed the words, and a `current` without `typed_text` leaves the typed words as they are. The server compares the words group plus `typed_text` (for a typed held draft the typed text is the only copy of the author's words) against the row's words version; refused, the other fields apply and the answer carries `conflict_groups` `['text']` and `current` (with `typed_text`). The phone keeps its words as a conflict copy (`rejected_writes`, code `conflict`, payload type `held.upsert`; `ConflictCopy.draft`), the draft follows the server's words, and the author picks with the same `resolveConflict`. A duplicate repeats the refusal (held receipt outcome).
- **Keep compared with the held words** (review K blocking 1; agreed with S02 for #208). The `entry.upsert` that makes the letter from a held draft or a waiting letter carries a top-level `held_base` next to `base`: the held row's last `v` this phone knew (`held_v`), or `'0'` when none came back. Under the held row's lock, the server refuses the Keep as a words conflict when the held row's words version (`text_xid`) is newer than `held_base` and its words (`final_text`, or `typed_text` when there is none) differ from the Keep's. Then no letter is made and the held row stays. The answer is `applied: false`, `conflict_groups: ['text']`, `current` with the held words (`final_text`, `machine_edits`, `edit_level`, `typed_text`, and `v` = their words version) and `held`, with no `entry`. A duplicate repeats it. The phone handles it as for an entry: its own words become a conflict copy, the letter takes the held words, and the Keep goes again with `held_base = current.v`. The letter then exists everywhere while the author chooses with `resolveConflict`. A null or absent `held_base` counts as 0 (review K re-check: no words may be left only in `entry_versions`; every client that syncs held drafts sends it). A `held_base` queued behind an unanswered held upload moves forward to that upload's version, as a let-go's base does. A Keep onto a letter another phone already made from the draft is a compare and set against that letter, with `held_base` standing in for `base` (table row C below).
- **Keep.** `entry.upsert` for the id deletes the held row on the server and leaves a `kept` marker; another phone of the author drops its draft and the letter takes that phone's recording if it has one. If that phone had changed the draft's typed words (its own upload was still queued, or met the kept letter and got `held: null`), they become a conflict copy of the letter, so nothing is lost and the author can pick them; a copy that matches the kept words is dropped. A draft this phone was letting go is not adopted. A late `held.upsert` for a kept id is a no-op (`held: null`).
- **Let go.** Letting a held draft go removes every copy of its words this phone keeps in `rejected_writes`. `held.discard` carries `base`, the last version this phone saw. The server keeps the row when its words changed since (`kept`), and the phone that let it go gets it back from its next pull, so a later edit on another phone wins over a let-go in either order (final review B-2). A let-go queued behind an upload whose answer has not come yet takes that upload's version once it is known, forward only (re-check A-R1). A repeated `held.discard` answers what the first answer said, `kept: true` included, and the phone then pulls the draft back (review K blocking 2). When the server takes a discard, every upload of that draft queued before it is dropped, so an upload that waited out a consent pause never brings it back (final review A-B2). A pulled row for a draft with its own ops queued never moves its `held_v`.
- **Pull.** The request carries `held: { cursor }` (an older server ignores it). A pulled `held_letter` becomes a held draft in the waiting row, a `waiting_letter` a letter waiting for its words (recordings return through F08). `gone` rows: `discarded` marks the draft `discarding` for the launch sweep (a waiting letter goes to Recently deleted), `kept` adopts. Nothing is erased in the pull. A draft with its own upload queued keeps its own values. A restore epoch re-sends every held row the server once held.
- **Server stand-in.** `apps/mobile/test/helpers/sync-v1-held-standin.sql` plus anchored edits (`SYNC_PUSH_HELD_EDITS`) is the request to S02 in runnable form: the table, RLS (author and parent of the book), the consent gate, SCIMM on a second raw transcript, `held_drafts_gone` (ids and times only), the delete-on-keep trigger, the Keep's compare (with a held row, or with the letter another phone kept first, whose provenance stands), the repeats of the table below, the switch, and a `sync_pull` that adds the `held` section only when asked, so the other parent's pull and digest do not change. Not in it (S02): `purge_ledger` `held_draft`, `backup_discard` of the recording (F08 6.5 D5), account deletion and book purge of the rows, the legal hold and the id lock. S02's migration (#208) replaces it; the same tests run against both.
- **Held-draft sync switched off** (`held_off`). The server can turn held-draft sync off without a build (the switch below). A `held.upsert` or `held.discard` answered `{ok: true, applied: false, held_off: true}` stays in the outbox, not done, with its op id: the phone clears `sync.heldServer`, so no held op leaves again until a pull carries a `held` section, and then the same op id applies. On a first send the op is reset to never sent, so a later edit rewrites it in place and a let-go of a draft the server never had sends nothing. A retry is left as sent: the server answers `held_off` before it reads the receipt, so an op whose first answer was lost may already have applied under that id; an edit then queues a new op (the retry answers `dup`, the edit applies), and a let-go sends its discard, rebased on the version the upload wrote. Letters, Keep and Erase now are not held ops and keep syncing. A Keep while held ops wait goes on its own; the upload that waits then meets the letter (`held: null`) once the switch is on.
- **After a second Keep** (table row C). The phone keeps its words as a conflict copy, the letter follows the server's words, and the letter takes the server's `raw_transcript`, `engine_version` and `captured_at` from its own pull row (a pulled own letter's raw transcript, engine and capture time replace the phone's, and those of its uploads still queued). `current` stays words only. An edit that leaves before that pull row arrives carries the phone's own raw transcript and is refused `SCIMM`. For a letter the server holds, the words of an upload refused `SCIMM` become a conflict copy the author sees, never a plain refused write, because the next pull gives the letter the server's words; "Use this phone's version" then sends them again with the letter's provenance (review K re-check 4). Any `SCIMM` on a letter the server holds becomes a copy, not only in that window. With another cause (for example a client bug that changed the phone's raw transcript), no pull row brings the server's words, so the letter keeps showing this phone's words until a newer server row arrives, and "Keep the other one" lets the copy go while the letter still shows them. That is a lag, not a loss: the server keeps its words, the copy stays until the author chooses, nothing is queued, and a newer row brings the server's words and its provenance (`[table C, note: an upload refused SCIMM for another reason]`). In the second-Keep window itself the pull row comes in the same sync, so there is no lag unless that pull fails too.

#### The held draft state table (agreed with S02; server half #208, client half here)

One held draft id, one author, two of the author's phones. P sends the op; Q is the other phone. W_P is P's words for the draft; W_S is the words the server holds for the id. "Words" means the words group plus `typed_text`. "Known" means P's `held_base` (for Keep) or `base` (for held ops) equals the server's words version v; "stale" means it is lower, because another phone changed the words after P last saw them. A null or absent `held_base` counts as 0.

**Invariant.** Every version of the author's words ends up either on the server (in the letter or the held row) or in a conflict copy (`rejected_writes`, code `conflict`) on the phone that wrote it, which the author sees and resolves with `resolveConflict`. `entry_versions` only holds words the author replaced by choice (an edit, an in-book change, or "Use this phone's version"); no words are left only in a refused write the author cannot see. A let-go is the author's choice too: it takes the draft's words and this phone's copies of them, unless an upload still queued on another phone brings them back (a later edit beats a let-go). The one deliberate exception is Erase now (the rows with `entry.erase`, and every row of E): it destroys the words on every phone, as its copy promises (F16-U17b, final review B4 and B6).

**Order.** Ops for one id are serialised by the per-letter lock on the server (Keep, `held.upsert`, Erase now and a direct `held_drafts` insert), and one person's pushes by the per-person lock, so any interleaving of two phones gives the answers of one of the sequential cells below. On the phone, one op per id per batch (section 2).

**Two client rules every cell assumes.**
- **(c1)** `held_v` and `held_base` move only to the words version this phone's own words produced: `held.v` of an answer to an op that carried `text` and was not refused, `applied_v` on a repeat, or `current.v` once the phone has taken those words into a draft still on it. Never from a refused answer's `held.v`, nor from an op without `text`, nor from a refusal that arrives after the draft was kept or let go on this phone (nothing took those words; review K re-check R3).
- **(c2)** `applied: false` with no `entry` is a refusal, whatever `current` says. The phone keeps its words as a conflict copy (when `current` names other words) or keeps them in the letter (when `current` is null), and sends the Keep again.

**A. None** (no held row, letter or marker: the first upload)

| P sends | Server answers | P ends with | Q ends with | The words live in |
|---|---|---|---|---|
| `held.upsert` | row made at v; `held {v}`; receipt `applied_v` | `held_v` = v | the held draft, at its next pull | held row (W_P) |
| `held.discard` (its upload never arrived, and waits) | `missing`; nothing changes | let go; the upload queued before it is dropped | nothing | nowhere (let go before it reached the server) |
| Keep | letter made from W_P; `applied: true, entry` | the letter | the letter, at its next pull | letter (W_P) |
| `entry.erase` (a waiting letter never uploaded) | `missing` | erased | nothing | nowhere (erase) |

**B. Held at v** (held row with words W_S at words version v)

| P sends | Server answers | P ends with | Q ends with | The words live in |
|---|---|---|---|---|
| `held.upsert` with `text`, base known | words written at v'; `held {v'}` | `held_v` = v' | W_P, at its next pull | held row (W_P) |
| `held.upsert` with `text`, base stale, W_P differs | text refused, other fields applied; `conflict_groups ['text']`, `current {final_text, machine_edits, edit_level, typed_text, v}`, `held` | W_P as a conflict copy; the draft takes W_S; `held_v` = `current.v` (c1) | W_S, and the other fields at its next pull | held row (W_S); P's copy (W_P) |
| `held.upsert` with `text`, base stale, W_P differs, and P kept or let go the draft while the upload was on the way | as the row above | nothing takes the words, so `held_v`, the queued Keep's `held_base` and the queued let-go's `base` stay (c1): the Keep is refused and c2 keeps both versions (the Keep rows below); the let-go is answered `kept` and the draft comes back with W_S | as those rows | letter or held row (W_S); P's copy (W_P) |
| `held.upsert` with `text`, base stale, W_P equals W_S | applied (nothing to refuse); `held {v'}` | `held_v` = v' | unchanged | held row |
| `held.upsert` without `text` (a date) | other fields applied, words version stays v; `held {v''}` | `held_v` unchanged (c1); W_S at its pull | the date, at its next pull | held row (W_S) |
| `held.discard`, base known | row deleted, marker `discarded`, ledger `held_draft`; `{}` | the draft gone | at its next pull `gone: discarded`: the draft and its copies go, unless Q has its own upload queued, which goes up (row D) and brings the draft back | nowhere: the author let go |
| `held.discard`, base stale, or under a legal hold | row stays; `kept: true` | the draft back with W_S at its next pull | unchanged | held row (W_S) |
| Keep, `held_base` known, or W_P equals W_S | letter made from W_P, row deleted, marker `kept`; `applied: true, entry` | the letter | at its next pull `gone: kept`: adopts the letter; words Q had changed become a conflict copy of it | letter (W_P); Q's copy if any |
| Keep, `held_base` stale, W_P differs | nothing written, row stays; `applied: false, conflict: true, conflict_groups ['text'], current {..., typed_text, v}, held, entry: null` | (c2) W_P as a conflict copy; the letter takes W_S; the Keep goes again with `held_base` = `current.v` and makes the letter (the row above) | the letter, at its next pull | letter (W_S); P's copy (W_P) |
| Keep with no `held_base` key (no shipped client) | compared as `held_base` 0: the row above | as above | as above | as above; nothing only in `entry_versions` |
| `entry.erase` (a waiting letter) | row deleted, marker `erased`, erasure recorded; `erased` (`deferred` under a legal hold, row kept) | erased | at its next pull `gone: erased`: erased, whatever it has queued (an upload of it is refused `SCDEL` first) | nowhere (erase) |

**C. Kept as a letter at v** (the author's letter with W_S at words version v, marker `kept`, no held row: another phone kept it first)

| P sends | Server answers | P ends with | Q ends with | The words live in |
|---|---|---|---|---|
| `held.upsert` (any base) | nothing written; `held: null` | at its pull `gone: kept`: the draft adopts the letter; changed words become a conflict copy of it (identical words make none) | unchanged | letter (W_S); P's copy (W_P) |
| `held.discard` | `missing`; the letter stays (a Keep beats a let-go, in either order) | the letter, at its next pull | unchanged | letter (W_S) |
| Keep (its `held_base` is a held version, so stale against the letter) | compare and set against the letter, `held_base` standing in for `base`: text refused, other groups by later arrival (section 6); the first keep's `raw_transcript`, `engine_version`, `captured_at` and `pack_ref` stand (never `SCIMM`, the same for any op whose words are refused); `applied: true, conflict: true, conflict_groups ['text'], current {final_text, machine_edits, edit_level, v}, entry` | W_P as a conflict copy (none if identical); the letter follows W_S and takes the server's raw transcript, engine version and capture time from its own pull row | unchanged words; the other groups at its next pull | letter (W_S); P's copy (W_P) |
| An edit of the letter after the Keep above, sent before its pull row arrived (it carries P's raw transcript) | `SCIMM` | the edit becomes a conflict copy; the pull gives the letter W_S and the server's provenance; picked, the edit goes again with that provenance and applies. An edit still queued when the pull row arrives takes the provenance and applies as the letter | the picked words, at its next pull | letter (W_S, or the edit once picked); P's copies |
| Keep sent again after taking W_S (`held_base` = the letter's version; a refused Keep's repeat named the letter) | nothing newer: applies, the words are the same | the letter | unchanged | letter (W_S); P's copy |
| `entry.erase` | letter purged, marker `erased`, erasure recorded; `erased` (`deferred` under a hold) | erased | erased at its next pull | nowhere (erase) |

**D. Discarded** (marker `discarded`, no row, no letter)

| P sends | Server answers | P ends with | Q ends with | The words live in |
|---|---|---|---|---|
| `held.upsert` (Q let go; P had changed it, its upload waiting) | row made again from W_P, marker cleared; `held {v}` | `held_v` = v | the draft back, at its next pull (a later edit beats a let-go) | held row (W_P) |
| `held.discard` | `missing` | gone | gone | nowhere (let go) |
| Keep | letter made from W_P (no held row to compare); `applied: true, entry` | the letter | the letter, at its next pull (a Keep beats a let-go) | letter (W_P) |
| `entry.erase` (a waiting letter let go on Q) | marker becomes `erased`, erasure recorded; `erased` | erased | its Recently deleted copy erased at its next pull | nowhere (erase) |

**E. Erased** (marker `erased`, this author's erasure recorded)

| P sends | Server answers | P ends with | Q ends with | The words live in |
|---|---|---|---|---|
| `held.upsert` | `SCDEL` `purged`, `gone: true` | erases its copy (draft, copies and queue) | erased | nowhere (erase) |
| `held.discard` | `missing` | gone | erased | nowhere |
| Keep | `SCDEL` `purged`, `gone: true` | its letter leaves the shelf, and the erase marker in the same sync's pull erases it (refused write and queue too) | erased | nowhere (erase) |
| `entry.erase` | `erased` | erased | erased | nowhere |

**Repeats after a lost answer** (the op committed; the receipt answers, and the op never runs twice; receipts keep flags, versions and ids, never words)

| First answer was | The repeat answers | P then |
|---|---|---|
| `held.upsert` applied | `dup, held, applied_v` | rebases on `applied_v` only (c1): an upload queued behind it is compared from there |
| `held.upsert` refused | `dup, conflict_groups ['text'], current`, with `current` recomputed from whatever holds the id's words now: the held row, else the author's letter, else null (let go or erased); `held` (null when gone) | a conflict copy as for the first answer; from the letter, its pull adopts the letter and makes the copy; with `current` null, it keeps its words as a copy and pulls (a let-go then takes them, an erase erases them) |
| `held.discard` `{}`, `kept` or `missing` | `dup` and the same answer | as for the first answer (`kept` brings the draft back) |
| Keep applied | `dup, entry, applied_v` | rebases on `applied_v` only |
| Keep refused by the held row (B) | `dup, applied: false, conflict: true, conflict_groups ['text'], entry: null`, `current` recomputed as above, `held` | (c2) a copy and the letter takes `current` when there is one; the Keep goes again with `held_base` = `current.v` (or unchanged with `current` null) and lands in row B, C, D or E by what exists |
| Keep refused by the letter (C) | `dup, entry, conflict_groups ['text'], current` (the letter's words now) | as for the first answer |
| `entry.erase` `erased`, `deferred` or `missing` | `dup` and the same answer | as for the first answer |

**The switch.** Held-draft sync can be turned off on the server without a build: the database setting `app.held_sync = 'off'` (unset or `on` means on). While it is off, the pull never sends the `held` section; `held.upsert` and `held.discard` answer `{ok: true, applied: false, held_off: true}`, change nothing and are not claimed; held drafts stay on the phone as in build 1 (the `held_off` bullet above); letters, Keep (with its compare against any held row the server still has) and Erase now keep working. If this table is not green in `sync-two-phone` by Fri 23 Oct 2026, build 2 ships with the switch off.

**Tests.** Every server cell is a check in `supabase/tests/sync_v1_server.test.mjs` section 7d (#208). Every cell end to end, real client and server, two phones of one author, is a case in `apps/mobile/test/sync-two-phone.test.ts` (`[table A ...]` to `[table repeat ...]` and `[switch off]`, 37 cases for the 36 cells and the switch, plus one for the `SCIMM` lag note), run against the stand-in on `develop` and against #208's migration. Against the previous heads (client `a8a84f5`, server `f9c83ba`), 9 of the first 35 cases fail; the other 26 guard behaviour that did not change in that round (review K re-check). The two cells added for review K's re-check (a refusal after the draft left the phone, and an edit before a second Keep's pull row) fail against the client at `21d2fe5`.

### 10. Kill paths

- **The build switch** (D-100): with `EXPO_PUBLIC_SERVER_FEATURES` off, `startSync()` wires nothing, so no listener, engine, client or request exists (`test/sync-switch-off.test.ts`). The outbox keeps any ops an earlier server-on build left, and they go when sync returns.
- **The remote switch** `killSwitches.sync` in the signed remote config (ADR 0016; F16-REQ-018): read before every push round and pull page; while on, no new request is made (one already in flight completes and its answer is applied), the phase is `paused_server` and the outbox keeps every op; a config change that lifts it wakes sync at once. If the switch cannot be read at all, sync stays paused (fail closed): a kill switch that silently stops working is worse than a visible pause. A stale config is not that case (the remote client serves its cached or bundled copy).

### 11. The free letters (M17, D-103)

The server never counts letters (D-080). On the phone a letter counts only when it is this account's own (or has no author yet), its words exist, and the author kept it with the words on screen; the other parent's synced letters never count (`db/repos/ledger.ts`). Words the machine wrote later wait as `transcript_status = 'unreviewed'` until the author keeps them.

### 12. Erase now in a sync build (WP-F16-13; F16-REQ-024, D-085)

Before this, "Erase now" returned false with sync on, and the server copy stayed until the 30 day purge, although the copy says the letter is erased for good (F16-U17b).

- **Phone.** `store.eraseEntry` erases the file first, then, in one transaction, the row and one `entry.erase` (the id only, never words), and only when the server may hold the letter: it has a server version or an op of it ever left the phone. A letter the server never had is erased here with nothing sent. The op waits in its own lane (`ERASE_LANE`), after every other op, so it never holds up the queue. It still goes during a consent pause (a deletion). Only the author's own letters can be erased. A pull never brings back a letter whose erase is still queued.
- **Server** (S02; stand-in `apps/mobile/test/helpers/sync-v1-erase-standin.sql` plus `SYNC_PUSH_ERASE_EDITS` and `SYNC_PULL_ERASE_EDITS`). `entry.erase` purges the author's own letter now, the way `purge_due` does after 30 days: the photo is queued for the storage purge, `purge_ledger` gets `entry` (so a restore replay never brings it back), and the row and its `entry_versions` go. The letter's tombstone need not have arrived first, because the phone drops a delete still queued with the row. A missing letter and another person's letter get the same answer, `missing`, and nothing changes, so a retry is a no-op and nobody learns that someone else's letter exists. Under a legal hold the letter is kept, tombstoned, until the hold lifts (`deferred`). An `entry_erasures` marker (ids only) makes the next pull of that book recompute its removal digest, so every phone learns at its next pull, not at the daily verify.
- **The author's other phones.** A letter the server no longer holds that was already deleted on this phone becomes `erased`. The store erases it (file, then row, nothing sent) after every pull (`afterPull`) and at launch, and it leaves Recently deleted at once. A letter still live on this phone (it missed the delete) goes to Recently deleted, as before. The other parent's copy of an in-book letter leaves their phone by the same digest.
- **A voice-only letter waiting for its words** lives on the server only as a held row with no words (or, once let go, a marker). Erase now sends `entry.erase` for it as for any letter. With no `entries` row, the server deletes the held row and sets the `held_drafts_gone` marker to `erased`. Every phone of the author then erases its copy, whether it is waiting or in Recently deleted, whatever is queued for it, and nothing is left there to restore (final review B4). A waiting letter always sends the erase, since a let-go one leaves only the marker; the server answers `missing` when it holds nothing.
- **A letter still live on a phone that missed the delete** goes to Recently deleted there (`gone`). Erase now works there with nothing sent, and the phone's own 30 day purge erases it (section 4), because the server holds nothing left to time.
- **An erase outlives the 60 day forget** (final review B6; re-check B-R1). An upload for an id the author erased is refused as `SCDEL` `purged`, because `entry_erasures` records the erasure (and must outlive `purge_ledger`'s 60 days, and be written by `purge_due` too). The refusal is never "a base and no row": a server restore also produces that, and it must re-upload the letter. A held upload for an id whose marker says `erased` is refused the same way, and the marker is never cleared by a held row made again. The phone that sent it puts a letter with words in Recently deleted (`gone`), where its own 30 day purge erases it (the bullet above), and erases its copy of a waiting letter, so a Restore made offline never undoes Erase now (re-check B-R2).
- **Queueing is local** (final review A-M2). The erase is queued whenever a signed-in owner exists, even in a build with server features off, as every other upload is, so it goes when sync returns.
- **Older server.** A server whose `sync_push` does not know `entry.erase` answers `22023`. The erase then waits in its lane and is tried again after 6 hours. It is not a refused write, and it is not counted as pending work, so it never holds a consent pause or the drain. The letter is already gone from this phone, and the server's 30 day purge still applies meanwhile.

## Consequences

- Two offline edits of one letter can no longer overwrite each other silently; the cost is a note the author must answer, expected to be rare (F16 A1).
- One op per letter per batch costs an extra round trip only when a letter has two queued ops (a restore, or an edit after a lost answer).
- The protocol works with today's server: the new result fields are optional, so the client behaves as before against `20261005000000`, and gains compare and set the day S02's migration is applied. Staging must hold `20261005000000` before a v1 client syncs (the `language` group is refused by older servers).
- A second phone of the same author cannot tell that pulled machine words are still unreviewed (section 11 gap), so it may count such a letter one keep early. Fix: a review mark on the wire (request to S02 and S07 below).
- Local schema v7 moves the signature and the reminder switch to `child_member_prefs` but keeps `children.signs_as` and `children.reminders_on` in place, written as a mirror of the prefs value and never read (review L on #166). A v6 build (build 1) reads those columns by name, and the "update the app" screen for a newer file (MOB-09) does not exist yet; dropping them would leave a tester who rolls back with a Book that cannot list its books. The two columns and the mirror go in the first schema version after MOB-09 ships.

## Alternatives considered

- **Keep last writer wins** (as built): breaks F16-REQ-010; rejected by R2 AR-02.
- **Compare on `sync_xid`** (F16 6.2 E as worded): simpler, but raises false words conflicts from book and date changes; kept as the fallback.
- **A new local `sync_conflicts` table** (F16 section 11): needs an unassigned local schema number after v10; `rejected_writes` already has the life cycle.
- **Merging words** (CRDT, three-way text merge): never (TDD 02 3.6, F16 section 4).

## Requests

To S02 (server; fenced, founder merge). Read against `origin/feat/db-v1-gate` at 2e89559 (PR #140). (1) WP-F16-14 as the stand-in states it in runnable form (`apps/mobile/test/helpers/sync-v1-standin.sql` for the new objects, `sync-v1-standin.ts` for six anchored edits to the newest `sync_push`, so the request is exactly the delta over S02's body and is tested against both `20261005000000` and the R-17 gate's `20261015030000`, PR #140): `entries.text_xid` and its trigger, the compare and set in `sync_push` with a row lock (`select ... for update`), `conflict_groups`, `current`, and on receipts `applied_v` plus the words-conflict outcome, so a duplicate repeats a refusal (section 2), written by a definer helper in a schema the API does not expose (`sync_private`), never a client RPC; `text_xid` never behind a version already handed out (section 5); (2) WP-F16-17 `held_drafts` with `held.upsert`, `held.discard` and the `held` pull section, per section 9, as `sync-v1-held-standin.sql` and `SYNC_PUSH_HELD_EDITS` state it (tested on both develop and PR #140's `sync_push`): the words compare includes `typed_text`, `current` carries `typed_text`, a `held_drafts_gone` marker (`discarded` or `kept`) arrives in the author's held section for a phone that pulled before, and the purge pieces of F16 6.2 I (`purge_ledger` `held_draft`, `backup_discard`); (3) WP-F04-14 `occurred_precision` and `base_direction` on `entries` and `book_entries` (`base_direction` readable by members): built in PR #140 (`20261015030000`), which parks WP-F16-14 and WP-F16-17 until this ADR is decided; (4) WP-F16-13 Erase now as `sync-v1-erase-standin.sql`, `SYNC_PUSH_ERASE_EDITS` and `SYNC_PULL_ERASE_EDITS` state it (section 12), plus the recording's backup object at `audio_blobs.object_path` (F08-REQ-024); `entry_erasures` is never trimmed sooner than item (6) allows; (5) a nullable review mark on `entries` (for example `words_reviewed_at timestamptz`, L2, author-only) so section 11 holds on every phone; (6) refuse an `entry.upsert` for an id with a recorded erasure (`entry_erasures`, kept at least as long as the longest offline window and written by `purge_due` too), never on a base alone, which a restore also produces (section 12; the 60 day forget); (7) apply `20261005000000`, the gate files and the v1 migration to staging before the alpha build.

To S07 (contract). `origin/feat/platform-v1-contracts` at a16731f (`packages/api/src/server/sync.ts`) matches this record field for field (`conflict_groups`, `current`, `base`, the held ops, the `held` pull section and its `gone` rows). Requests: (1) add `applied_v` (optional string) to `PushResultOkSchema`, and optional `typed_text` to `current` for `held.upsert` answers; (2) the `base` comment says "the row's `v` above `base`": make it "the words version above `base`" per section 5, or keep `sync_xid` as the stated fallback; (3) once it merges, the app imports these types from `@scribe/api/server` (type-only, so an off build evaluates nothing) and `lib/sync/types.ts` goes (WP-F16-01).

## Open questions

1. Q6 in F16: book-setting conflicts stay later arrival plus F12's note (spec default)?
2. `held.upsert` uses compare and set in this record (section 9), with `typed_text` in the compare; the spec's words group leaves `typed_text` out. Confirm, or accept later arrival for typed held drafts.
3. `p_api_version`: refuse version 0 as soon as v1 ships, or after one release?

## Sources

PRD V2 F16 (sections 6.2 A to I, 6.3, 7, 11, 12), F04 section 11.3, F12 section 7, F14 sections 6.2 and 7 (on `origin/docs/prd-v2`); `08-delivery.md` sections 3.3, 4, 5.2, 5.3, 6.3, 8.1; DECISIONS D-023, D-100, D-103, D-106 (PR #128 branch); `supabase/migrations/20261004100000_sync_engine.sql` (sections 1 to 7) and `20261005000000_family_cap_language_idempotency.sql` (sections 4, `sync_push`, `sync_pull`); `apps/mobile/src/lib/sync/` on `develop` at 4183844.
