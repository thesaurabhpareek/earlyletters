# ADR 0023: Sync protocol v1 (outbox push, cursor pull, words compare and set)

- **Status:** Proposed, 15 Oct 2026 (draft for T13; decided at T15, or the spec default in PRD V2 F16 stands). The number is the next free one after 0018 to 0022 on develop and the open merge train; the coordinator confirms it at merge.
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

### 5. The words compare and set (v1; F16 6.2 E; WP-F16-14 server, WP-F16-15 client)

**Server rule.** For `entry.upsert` with a `base` on an existing row: if the words group changed since `base` by another transaction, the `text` group is not applied (the other groups are, by later arrival), and the result carries `conflict_groups: ['text']` and `current`. If the op did not carry `text`, everything applies and `current` is returned too. A duplicate returns `applied_v`. No `base` (an older app): unchanged, later arrival wins.

**What "changed since base" reads.** This record proposes a words version, `entries.text_xid` (`xid8`, stamped by trigger only when `final_text`, `machine_edits` or `edit_level` change), instead of `sync_xid` as F16 6.2 E step 2 words it. Xid order is not commit order: a writer with an older xid can commit words after a newer transaction already answered a phone with `v`, so the trigger stamps `old.sync_xid + 1` when the writer's xid is not past it, and a phone's base never passes over words it has not seen (a false note at worst). A per-row words counter would be cleaner but changes what `base` means on the wire; S02 may choose it with WP-F16-16. With `sync_xid`, another phone taking a letter out of the book would raise a words conflict and show the author a note about words nobody changed (F16 C2 says later arrival, no note). If S02 keeps `sync_xid`, the client below still keeps every version; only those false notes appear.

**Phone rules** (`lib/sync/outbox.ts`, `merge.ts`):

1. `base` is the server version this phone's words descend from. A new op behind another queued upsert of the same letter inherits that op's base; otherwise it takes `entries.server_version`.
2. A push batch carries at most one op per letter. It ends before a letter's second op, so queue order is kept exactly and the next op leaves only after the answer rebased it.
3. After an op applies, every later queued upsert of the letter is rebased on the version it wrote (F16-REQ-025). A duplicate rebases only on `applied_v`, never on the current version, which may hold another phone's words. `base` is the one field the outbox rewrites after a send: the server reads it only when it first applies an op, and a duplicate ignores it. This is safe only because `applied_v` is the version this phone's own words produced (section 2); with no `applied_v` nothing is rebased.
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

A held letter, or a voice-only letter waiting for words, of a signed-in, consented author syncs as a `held_drafts` row: author-only RLS, never in `book_entries` or another member's pull, the same consent gate, validation and raw-transcript immutability as `entries`. Ops `held.upsert` (words by the same compare and set) and `held.discard`; own rows arrive in a `held` section of the author's pull with the same cursor rules; `entry.upsert` for an id with a `held_drafts` row deletes that row in the same transaction. On the phone the held marker and server version are local schema v8 (`08-delivery.md` section 4), which follows v7; the client part lands in that PR.

### 10. Kill paths

- **The build switch** (D-100): with `EXPO_PUBLIC_SERVER_FEATURES` off, `startSync()` wires nothing, so no listener, engine, client or request exists (`test/sync-switch-off.test.ts`). The outbox keeps any ops an earlier server-on build left, and they go when sync returns.
- **The remote switch** `killSwitches.sync` in the signed remote config (ADR 0016; F16-REQ-018): read at the start of every cycle; while on, no request is made, the phase is `paused_server` and the outbox keeps every op. An unreadable config never stops sync (the remote client serves its cached or bundled copy).

### 11. The free letters (M17, D-103)

The server never counts letters (D-080). On the phone a letter counts only when it is this account's own (or has no author yet), its words exist, and the author kept it with the words on screen; the other parent's synced letters never count (`db/repos/ledger.ts`). Words the machine wrote later wait as `transcript_status = 'unreviewed'` until the author keeps them.

## Consequences

- Two offline edits of one letter can no longer overwrite each other silently; the cost is a note the author must answer, expected to be rare (F16 A1).
- One op per letter per batch costs an extra round trip only when a letter has two queued ops (a restore, or an edit after a lost answer).
- The protocol works with today's server: the new result fields are optional, so the client behaves as before against `20261005000000`, and gains compare and set the day S02's migration is applied. Staging must hold `20261005000000` before a v1 client syncs (the `language` group is refused by older servers).
- A second phone of the same author cannot tell that pulled machine words are still unreviewed (section 11 gap), so it may count such a letter one keep early. Fix: a review mark on the wire (request to S02 and S07 below).

## Alternatives considered

- **Keep last writer wins** (as built): breaks F16-REQ-010; rejected by R2 AR-02.
- **Compare on `sync_xid`** (F16 6.2 E as worded): simpler, but raises false words conflicts from book and date changes; kept as the fallback.
- **A new local `sync_conflicts` table** (F16 section 11): needs an unassigned local schema number after v10; `rejected_writes` already has the life cycle.
- **Merging words** (CRDT, three-way text merge): never (TDD 02 3.6, F16 section 4).

## Requests

To S02 (server; fenced, founder merge): (1) WP-F16-14 as the stand-in states it in runnable form (`apps/mobile/test/helpers/sync-v1-standin.sql` for the new objects, `sync-v1-standin.ts` for six anchored edits to the newest `sync_push`, so the request is exactly the delta over S02's body and is tested against both `20261005000000` and the R-17 gate's `20261015030000`, PR #140): `entries.text_xid` and its trigger, the compare and set in `sync_push` with a row lock (`select ... for update`), `conflict_groups`, `current`, and on receipts `applied_v` plus the words-conflict outcome, so a duplicate repeats a refusal (section 2), written by a definer helper in a schema the API does not expose (`sync_private`), never a client RPC; `text_xid` never behind a version already handed out (section 5); (2) WP-F16-17 `held_drafts` with `held.upsert`, `held.discard` and the `held` pull section, per section 9; (3) WP-F04-14 `occurred_precision` and `base_direction` on `entries` and `book_entries` (`base_direction` readable by members): built in PR #140 (`20261015030000`), which parks WP-F16-14 and WP-F16-17 until this ADR is decided; (4) a nullable review mark on `entries` (for example `words_reviewed_at timestamptz`, L2, author-only) so section 11 holds on every phone; (5) apply `20261005000000` and the v1 migration to staging before the alpha build.

To S07 (contract): put the types in `lib/sync/types.ts` into `packages/api/src/sync.ts` with the v1 fields (`conflict_groups`, `current`, `applied_v`, `language`, `occurred_precision`, `base_direction`, the held ops and section) and an API version (WP-F16-01, WP-F16-16).

## Open questions

1. Q6 in F16: book-setting conflicts stay later arrival plus F12's note (spec default)?
2. Does `held.upsert` need compare and set in v1.0, or is later arrival enough for drafts that only the author's own phones edit?
3. `p_api_version`: refuse version 0 as soon as v1 ships, or after one release?

## Sources

PRD V2 F16 (sections 6.2 A to I, 6.3, 7, 11, 12), F04 section 11.3, F12 section 7, F14 sections 6.2 and 7 (on `origin/docs/prd-v2`); `08-delivery.md` sections 3.3, 4, 5.2, 5.3, 6.3, 8.1; DECISIONS D-023, D-100, D-103, D-106 (PR #128 branch); `supabase/migrations/20261004100000_sync_engine.sql` (sections 1 to 7) and `20261005000000_family_cap_language_idempotency.sql` (sections 4, `sync_push`, `sync_pull`); `apps/mobile/src/lib/sync/` on `develop` at 4183844.
