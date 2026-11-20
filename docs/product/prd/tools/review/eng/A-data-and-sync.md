# A. Data and sync engineering design for the locked pack

Status: WORKING-INPUT (engineering evaluation behind errata E1 to E32; findings applied in C18) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: reading section 8, which 18-errata-after-lock.md cites; otherwise do not load.

Author: `data-architect` (for Karma, CTO). Written 20 Nov 2026. Read-only: nothing committed, pushed, applied or posted.
Basis: the lock worktree `/home/claude/wt/E` at `450bcb4a9` (develop merged at `736197dfe`), cards `00` to `16`, `docs/BACKLOG.md` (BL-922 to BL-949, BL-952 to BL-987), ADR 0028 as merged, and open PRs #835 (head `f55be7b8`), #836 (`3395e5a6`), #798 (`7f36031a`) read through `gh api` (REST). #797 is merged: `merged_at 2026-11-20T04:28:36Z`, merge commit `e9dca86c`; the ADR is at `docs/adr/0028-photo-seal-find-on-device-data.md` in the worktree.

Labels: [R] read in code or a PR diff this session, with file:line; UNVERIFIED means not read in code, not run, or depends on a device or library I did not open. Nothing was run: no `npm run test:db`, no device, no FTS5 build. Fixtures and examples use the fictional Asha family only.

---

## 0. What this file decides, in one table

| # | Decision | Where |
|---|---|---|
| 1 | Five local migrations after today's 10: 11 photos (#835, fix its CHECKs before merge), 12 Firsts, 13 seal, 14 the From name on drafts, 15 withheld words. Numbers are taken at merge; the later PR renumbers on rebase. | 1.2 |
| 2 | Five server migrations, in this order: photo write-deny, Firsts, held words withheld, seal, earlier-versions RPCs. Each one that restates a function rebases on the previous restatement. | 1.4, 5 |
| 3 | Seal publication: option (b), the pull clause, with four corrections to the card's spec (composite watermark, no 45-day lower clamp, last page only, old clients get a full window). Recorded as an ADR 0028 amendment in the seal PR. | 2.3 |
| 4 | Export minors in merge order: 1.7.0 photos, 1.8.0 Firsts, 1.9.0 seals (1.8.0 only if seals merge before Firsts). NS-12, NS-16, NS-15 need no bump. | 3 |
| 5 | Every database length ceiling counts code points and is set high enough that the app's grapheme limit always fits; the From name is the one field the app also counts in code points. | 1.5 |
| 6 | NS-09 D7 needs no server migration: `held_discard` already deletes the row and its words in the acknowledging request. NS-17 does need one: `held_drafts` refuses nulling `raw_transcript` today. | 1.4 S0, S3 |

## 0.1 Facts that move since the cards were written

1. ADR 0028 merged on `develop` at 04:28 UTC on 20 Nov (#797, `e9dca86c`). Gate G1's ADR half is met; the cards still cite "ADR 0028 (PR #797)". The ADR still says L2 for `entry_media.entry_id`, `draft_id` and `letter_search_rows.*` (`docs/adr/0028-photo-seal-find-on-device-data.md:34-35, 184`) [R], so BL-959 is still open for the ADR. #836 already changes the migration 11 comment to L3 for `entry_id` and `draft_id` (#836 patch to `apps/mobile/src/lib/db/migrations.ts`, hunk at `:435-441`) [R], so only the ADR half of BL-959 remains once #836 merges.
2. After `20261023060000_explicit_grants.sql`, `book_entries` has no grant to any API role (`20261023060000_explicit_grants.sql:49-53`; `supabase/tests/grants.mjs:5-11` lists no `book_entries`) [R]. It is read only inside definer code (`sync_pull`). The cards (NS-06 A10 step 3, B10 step 4) say to "re-run the revoke and grant block" of `20261015030000_v1_wire_contract_columns.sql:251-253`, whose last line is `grant select on public.book_entries to authenticated` (`:253`) [R]. Copying it would re-open the view to every signed-in client and fail `explicit_grants.test.mjs`. Every view replace in this pack restates the revoke only: `revoke all on public.book_entries from public, anon, authenticated, service_role;`.
3. The cards cite `20261016000000_sync_v1_server.sql:1589-1602` as "the held section's builder". Those lines build the caller's own rows for a book they left or that was deleted (the `gone` section) [R]. The held section is built with `to_jsonb(h) - 'author_id' - 'sync_xid' - 'text_xid'` at `:1635` [R], so any new `held_drafts` column reaches the author's other phones with no change to `sync_pull`. Both places matter, for different reasons (1.4).
4. Migration 11 in #835 has `CHECK (photo_text IS NULL OR length(photo_text) <= 140)` and `place ... <= 60` [R, #835 patch]. SQLite `length()` on text counts characters (code points), not grapheme clusters. #836's `capTyped` caps at 140 code points while keeping whole clusters (`apps/mobile/src/lib/photos/text.ts` in #836) [R]. Together they cap photo words at 140 code points, not 140 graphemes. That fails NS-01-R54, which wants a grapheme limit and a database ceiling that admits it. #835 is not merged, so the fix is in the PR, before any phone runs migration 11 (1.5).
5. `held_drafts.raw_transcript` cannot be nulled once set: `held_drafts_stamp` raises `SCIMM` when a non-empty value changes (`20261016000000_sync_v1_server.sql:506-507`), and `held_upsert` keeps the old value when the push sends null or empty (`raw_transcript = coalesce(nullif(d ->> 'raw_transcript', ''), h.raw_transcript)`, `:722`) [R]. NS-17-R8's "the next push sets them null" does not work on today's server. Answer to BL-987's `data-architect` question: no; migration S3 below is required.
6. NS-09 D7 is already true on the server. `held_discard` deletes the held row in the acknowledging request (`:771-788`), and the trigger leaves only an id marker in `held_drafts_gone` and an id in `purge_ledger` (`:538-584`, `:351-358`) [R]. Two cases keep the words, by design: a stale base (another phone edited later, answer `{ kept: true }`) and a legal hold (`:782-784`) [R]. The card should name both.
7. `sync_pull` serves rows while a Terms version is outstanding. It calls `require_user()` and `rate_hit('pull')` only (`:1305`, `:1367`); `require_user()` checks sign-in and anonymity, not consent (`20261003000000_security_and_family.sql:62-74`) [R]. NS-10's "Decline: nothing downloads" is therefore a phone rule. Answer to the BL-987 `sync` question, from code; `sync` confirms.
8. The phone does not schema-check the pull answer: `engine.ts:241` casts the result `call<PullResponse>('sync_pull', ...)` [R], and `packages/api`'s `PullResponseSchema` and `PulledRowSchema` are `v.object` (`packages/api/src/server/sync.ts:583, 785`), which strip unknown keys [R]. An old build ignores a new key such as `seal_watermark`. That answers BL-987's "tolerates an unknown response key" for the shipped code; whether `mergeRows` ignores unknown row keys is read-level only (it reads named fields) and `sync` confirms.
9. `.github/migrations-applied.txt` lists two files, `20260930000000` and `20261001000000` [R], while `supabase/APPLY.md:8-34` lists files 3 to 32 as pending. Which files `scribe-prod` and `scribe-staging` hold is UNVERIFIED here (project docs mention a production bring-up; I may not read production). Every new file below sorts after the newest file in the folder, `20261109000000_child_name_optional.sql`, whatever the applied list says (DB-R08).

---

## 1. Inventory of schema changes

### 1.1 Baseline

| Store | Today |
|---|---|
| Phone `scribe.db` | Version 10, the `agreements` table (`apps/mobile/src/lib/db/migrations.ts:392-427`); `LATEST_VERSION` at `:430`; a newer file is never migrated (`:455`, `{ newer: true }`) [R] |
| Open phone migration | 11 `entry_media` in #835 [R] |
| Server | Newest file `20261109000000_child_name_optional.sql` [R] |
| Content trigger | `entries_family_rules()`; latest tuple `20261015030000_v1_wire_contract_columns.sql:174-186` [R] |
| `book_entries` | Latest `20261015030000_v1_wire_contract_columns.sql:229-249`, security barrier, no API grant after file 25 [R] |
| `sync_push` | `20261016000000_sync_v1_server.sql:931`; groups `c_groups` at `:936`; an unknown group raises `22023` at `:1031-1033` [R] |
| `sync_pull` | Same file `:1302`; own rows `:1477-1496`; others' rows through `book_entries` `:1498`; visibility `:1505`; cursor `:1512-1513`; left-book own rows `:1587-1602`; held section `:1626-1655` [R] |
| Contract | `FIELD_GROUPS` `sync.ts:94`, `FIELD_GROUP_COLUMNS` `:98-104`, `IMMUTABLE_COLUMNS` `:154`, `INSERT_ONLY_COLUMNS` `:157`, `AUTHOR_ONLY_COLUMNS` `:160-163`, `ENTRY_DATA_KEYS` `:263-267`; phone `ALL_GROUPS` `apps/mobile/src/lib/sync/types.ts:51`, `entrySnapshot` `outbox.ts:161-184` [R] |
| Export | `EXPORT_SCHEMA_VERSION = '1.6.0'`, `photo: null`, `counts.photos` (`apps/mobile/src/lib/export/schema.ts`, header `:16-89`) [R] |

### 1.2 Phone SQLite migrations (append-only; one transaction per step)

Every step: columns only or a new table; no existing row changes; nothing queued to the outbox; the level of each column in the migration comment (DB-R25, ADR 0028 D1); a `migrations.v<N>.test.ts` in the shape of NS-01-R35 (a v<N-1> database with 1,000 letters, drafts, agreements and outbox rows is byte-identical after, nothing queued). SQLite `ALTER TABLE ... ADD COLUMN` with a `CHECK` is UNVERIFIED on the SDK 57 SQLite for existing rows; the rules below are enforced in the repo functions and tested there, and a `CHECK` is added only on new tables.

| No. | Name | Contents | Class | Serves |
|---|---|---|---|---|
| 11 | `entry_media` (#835, BL-931 slice 3) | Table as ADR 0028 D1 (`id`, `entry_id`, `draft_id`, `kind`, `ext`, `bytes`, `sha256`, `width`, `height`, `photo_text`, `place`, `added_at`; exactly one of `entry_id` and `draft_id`); `entry_media_entry_idx`, `entry_media_draft_idx`, unique `entry_media_one_photo_idx` on `COALESCE(entry_id, draft_id)`. **Change before merge:** `photo_text` ceiling `length(photo_text) <= 1120` and `place <= 480` (code points; 8 per grapheme, 1.5); comment ids L3 as #836 already writes. | file and `sha256`, `photo_text`, `place` L4; `entry_id`, `draft_id` L3; `id`, `width`, `height`, `added_at` L2; `kind`, `ext`, `bytes` L2 (as #836 writes) | NS-01-R4, R8, R15, R16a to R16c, R21a, R35, R36, R54; NS-36-R1a to R1c |
| 12 | Firsts (BL-968) | `entries.first_mark INTEGER NOT NULL DEFAULT 0`, `entries.first_label TEXT`; the same pair on `drafts`. No index: the lens reads at most 1,200 rows of one book; add `entries_first_idx (child_id, occurred_on) WHERE first_mark = 1 AND deleted_at IS NULL` only if NS-06-A24 misses on an SE 3 (DB-R22). | `first_mark` L3, `first_label` L4 | NS-06-A1, A6, A14, A16, A25 |
| 13 | Seal (BL-969, BL-970) | `entries.seal_opens_at TEXT` (`YYYY-MM-DDTHH:MM:SSZ`), `entries.seal_opens_on TEXT` (`YYYY-MM-DD`), `entries.seal_cleared_at TEXT`; `drafts.seal_opens_at`, `drafts.seal_opens_on`; index `entries_seal_idx ON entries (seal_opens_at) WHERE seal_opens_at IS NOT NULL AND seal_cleared_at IS NULL` (ADR 0028 D3a); `sync_books.seal_watermark TEXT` (option (b), 2.3). | seal columns L4; `seal_watermark` L2 | NS-06-B1, B1b, B2, B12, B24; NS-36-R3 |
| 14 | From name on the draft (BL-980) | `drafts.author_signs_as TEXT` (the server's column name, DB-R25). The names-used-before list stays a settings key, `signAs.recent`. | L3 | NS-16-R1, R13, R14; card's "app killed mid-flow" row |
| 15 | Withheld words (NS-17; no BL row yet, BL-987 asks) | `drafts.words_withheld INTEGER NOT NULL DEFAULT 0`, `entries.words_withheld INTEGER NOT NULL DEFAULT 0` (a voice-only letter kept while its take is withheld keeps the draft's id); new table `withheld_words (id TEXT PRIMARY KEY NOT NULL, raw_transcript TEXT NOT NULL, language TEXT, withheld_at TEXT NOT NULL)` keyed by the take's id. The mark moves the machine output into `withheld_words` and blanks `drafts.raw_transcript` in one transaction, so no existing reader (Find, export, share, the push mapper, the PDF) can reach it by construction. | `words_withheld` L4 (it says the take was in a language the build does not hear; the same class as `drafts.language`, `migrations.ts:270`; `privacy` confirms); `withheld_words.*` L4 | NS-17-R5, R7, R8, R9; D10 |

No migration (by design):
- Find index: `letter_search`, `letter_search_rows`, view `searchable_letters` are made by `ensureSearchIndex` (ADR 0028 D1, D4; #798 `lib/find/lifecycle.ts`, `lib/find/sources.ts:84-121` at `7f36031a`) [R]. The seal build adds its clause through `registerFindExtraSource`'s `visibleSql` (`sources.ts:98`) [R]; the Firsts build registers `first_label` as an extra source.
- List and page copies (NS-37): files `photos/<media_id>-512.jpg` and `-1280.jpg`, derived from `entry_media.id`. The sweep's name rule widens from `<id>.jpg` to `<id>(-512|-1280)?.jpg`; a derivative with no stored copy is a stray.
- NS-12 versions: held in memory for the open letter only; no cache table (fewer L4 stores).
- Settings keys (table `settings`, 1.3).

### 1.3 Phone-only keys and files the pack adds (never synced, never exported)

| Key or file | Card | Class | Sign-out (D1) | Erase everything / account deletion on this phone |
|---|---|---|---|---|
| `reminders.onSince` | NS-13 | L2 | cleared with `reminders.*` (NS-13-R14) | removed |
| `typedDay.<yyyy-mm-dd>`, `typedDay.showWords` | NS-18 | L4, L2 | removed (NS-18-R6) | removed |
| `discard.failures.<draft id>` | NS-09 | L3 id, L2 count | kept (the draft is A's, held for A) | removed |
| `find.dirtyAt`, `find.secureDelete` | NS-02 | L2, L1 | kept with the index | removed with the dropped index |
| `copySlip.<child id>.<year>` | NS-11 | L3, L2 | removed (card inventory) | removed |
| `home.pastLetters`, `home.pastLetter.dismissedOn` | NS-23 | L2 | kept (D1) | removed |
| `newPhoneLine.dismissed` | NS-10 | L2 | removed | removed |
| `signAs.recent` (at most 20) | NS-16 | L3 | removed (NS-16-R15) | removed |
| `photos/<media_id>.jpg`, `-512.jpg`, `-1280.jpg` | NS-01, NS-37 | L4 | kept (D1, NS-01-R30) | folder deleted by listing |
| `Caches/ImagePicker/*`, `Caches/ScribePhoto/*` | NS-01 | L4 | swept at launch | deleted |

The notification budget (NS-32) adds no key: `lib/reminders/budget.ts` is a code registry (card section 10). The plan notices keep their built keys.

### 1.4 Server migrations, in merge order

Common to every file: no `begin;` or `commit;` (DB-R10); every new function `revoke execute ... from public, anon` (and `authenticated` for trigger functions) in the same file (DB-R14); every new column and every new view column carries `comment on column ... 'L<n> ...'` (DQ-R01; `supabase/tests/classification.test.mjs:19-21` checks view columns too) [R]; `supabase/APPLY.md` gains a section (DB-R11); red-team review and the founder's `approve-migration` label (D-041). Proposed timestamps are placeholders: the real one is taken when the PR opens and must sort after the newest file at merge.

**S0. No migration for NS-09 D7, NS-10, NS-16, NS-02, NS-13, NS-18, NS-32, NS-37, NS-15, NS-05, NS-07.** Evidence for D7 and NS-10 in 0.1 items 6 and 7. NS-16: `author_signs_as` exists with `char_length <= 30` (`20261002020000_data_governance.sql:95`), is insert-only (`sync.ts:157`) and is in `book_entries` (`20261015030000:230`) and the content tuple (`:175, :181`) [R].

**S1. `20261121000000_photo_bucket_closed.sql` (BL-870; ADR 0028 D6).**
- Drop `entry_photos_author_insert` and `entry_photos_author_update` on `storage.objects` (created `20260930000000_scribe_core.sql:294-300`, last altered `20261028000000_pg_temp_last_and_purged_photos.sql:88-101`) [R]. Keep `entry_photos_author_delete` and `entry_photos_read` for the purge path and any legacy object.
- Trigger `entries_15_photo_closed before insert or update on public.entries`, function `entries_photo_closed()`: for `current_user in ('authenticated', 'anon')`, a non-null `photo_path` raises `SCPHO`. Revoke the function from `public, anon, authenticated`.
- Before-trigger order on `entries` after S1, S2, S4 (Postgres fires by name): `entries_12_seal_guard`, `entries_15_photo_closed`, `entries_family_rules`, `entries_guard`, `entries_insert_guard`, `entries_language_guard`, `entries_not_purged`, `entries_sync_xid`, `entries_touch`, `entries_unshared` (names from `grep "create trigger" ... on public.entries`) [R]. DB-R04 wants the order pinned by a test; the pin test is pending (#26), so S1's test asserts the list.
- No column, no grant, no `grants.mjs` change. Error code `SCPHO` registered in `docs/engineering/02-api-and-contracts.md` with `sync`.
- Contract (`sync`): `photo_path` narrowed to null on push (`sync.ts:618` types it `v.nullish(str)`) [R].
- Serves NS-01-R61, R15 (server half), NS-36-R1d. Required before `EXPO_PUBLIC_PHOTOS` is on in `production`.

**S2. `20261124000000_entries_firsts.sql` (BL-968; NS-06 Part A).**
1. `alter table public.entries add column first_mark boolean not null default false, add column first_label text;` constraints `entries_first_label_len check (first_label is null or (first_mark and char_length(first_label) between 1 and 320))` and `entries_first_not_quiet check (not first_mark or kind <> 'not_much')`. Comments `L3 parent's own mark that a letter is a first`, `L4 parent-typed label of a first (free text)`. Ceiling 320, not the card's PROPOSED 200: see 1.5.
2. The same two columns on `public.held_drafts` with the same two checks (the held table has `kind in ('held_letter', 'waiting_letter', 'held_words')`, `:304`, so the quiet-day check does not apply there; a held draft is never a quiet day). Comments L3 and L4. Card A11 says a draft's mark travels "with the held draft's own sync"; the card's step list omits these columns. They reach the author's other phones through `to_jsonb(h)` (`:1635`) with no `sync_pull` change for that section.
3. Replace `entries_family_rules()` with both tuples gaining `new.first_mark, new.first_label` and `old.first_mark, old.first_label` (body from `20261015030000:155-225`).
4. `create or replace view public.book_entries` with `e.first_mark, e.first_label` appended after `e.base_direction` (a replace may only append); same `where` clause; comments on both view columns (L3, L4); restate `revoke all on public.book_entries from public, anon, authenticated, service_role;` and nothing else (0.1 item 2).
5. Replace `sync_private.held_upsert` (`:680-750`) to write `first_mark` and `first_label` from the op (not part of the words version: `held_drafts_stamp` keeps its six-column words tuple).
6. Replace `sync_push` with group `first` in `c_groups` and in the insert and update lists (`first_mark = case when 'first' = any(v_changed) then excluded.first_mark else e.first_mark end`, likewise the label) and in the no-op comparison tuple (`:1144-1162` pattern).
7. Replace `sync_pull`: the own-row builder (`:1496`, second `jsonb_build_object`) and the left-book own-row builder (`:1602`) gain `'first_mark', p.first_mark, 'first_label', p.first_label`. Others' rows get them through `book_entries` at `:1498`.
8. `supabase/tests/classification.test.mjs:24`: `first_label` joins `mustBeL4`.
- No new function, so no grant and no `grants.mjs` line. No index (the server never filters by `first_mark`).
- Serves NS-06-A2a (server half), A6, A8, A13, A16, A17, A19, A23; NS-36-R10, R11.

**S3. `20261126000000_held_words_withheld.sql` (NS-17-R8; needs a BL row).**
1. `alter table public.held_drafts add column words_withheld boolean not null default false;` comment `L4 the take was marked as another language; its machine output is withheld (D10), author-only`. It reaches the author's other phones through `to_jsonb(h)`.
2. Replace `held_drafts_stamp()` (`:497-525`): `raw_transcript` may go from a non-empty value to null only when `new.words_withheld` is true and `old.words_withheld` is false, in the same update; to any other value it still raises `SCIMM`. The constitution's rule (the words as heard never change) holds in the narrow sense: nothing is rewritten; the server copy is removed while the phone keeps the original under D10. Karma rules on this reading before the PR opens (risk R6).
3. Replace `held_upsert()`: an op carrying `words_withheld: true` sets the flag and nulls `raw_transcript`, `final_text`, `machine_edits`, `edit_level`, `author_edits`, `locked_spans`; on a row already withheld, any incoming `raw_transcript`, `final_text`, `machine_edits` is ignored (a stale phone that never saw the mark cannot upload the words again; today the stamp trigger would allow it because the old value is null). `typed_text` still applies: the parent may type the words (NS-17-R9).
4. The flag is never cleared by a client. A language that later ships transcribes the take again on the phone into a new draft state; the held row's words arrive from that phone as a new value of `final_text` only after the parent sees them on Review.
- No new public function; no grant. Classification: the new column comment.
- Serves NS-17-R7, R8 and the card's "already pushed" row.

**S4. `20261127000000_entries_seal.sql` (BL-969; NS-06 Part B; ADR 0028 D3, D3a).**
1. Columns `seal_opens_at timestamptz`, `seal_opens_on date`, `seal_cleared_at timestamptz`, each `comment ... 'L4 ...'`; CHECK `entries_seal_pair` exactly as ADR 0028 D3a (`docs/adr/0028...:128-133`) [R].
2. Trigger `entries_12_seal_guard before insert or update on public.entries`, function `entries_seal_guard()` revoked from `public, anon, authenticated`. Rules: the pair may go from null to a value only when `kind <> 'not_much'` (`SCSEL`); a set pair never changes and never returns to null, compared by value so a rewrite of the unchanged pair passes; any non-null client `seal_cleared_at` is replaced by `now()`, an already-set `seal_cleared_at` is kept as it was (so a retried Open now changes nothing, NS-06-B14), and a `seal_cleared_at` on a row with a null pair raises `SCSEL`; a past instant is accepted. Applies to every role except the purge path (it never writes the pair).
3. Replace `entries_family_rules()`: both tuples gain the three columns (on top of S2's tuple).
4. Replace `book_entries`: column list exactly as S2 left it (no seal column, NS-06-B20); inside the non-author branch, beside `e.deleted_at is null`: `and (e.seal_opens_at is null or e.seal_cleared_at is not null or e.seal_opens_at <= now())`. The author branch is unchanged, so the author's own row is always visible to them. Restate the revoke only.
5. Replace `sync_push` (on top of S2): group `seal` with `seal_opens_at`, `seal_opens_on`, `seal_cleared_at`.
6. Replace `sync_pull` (on top of S2): the own-row and left-book own-row builders gain the three keys; the publication clause of 2.3.
7. Index for option (b): `entries_seal_open_idx on public.entries (child_id, seal_opens_at) where seal_opens_at is not null and seal_cleared_at is null` (comment the access pattern; DB-R21, DB-R22). ADR 0028's `entries_seal_due_idx` is for option (a) only and is not created.
8. `classification.test.mjs:24`: the three names join `mustBeL4`.
9. `docs/legal/data-policy.md:91` row `sealed_until` becomes the three columns, class C; `DATA_CLASSIFICATION.md` in the same PR (NS-36-R6; founder merges `docs/legal/**`).
- No new public function under option (b), so no grant and no `grants.mjs` line. (Option (a) would add `publish_opened_seals()` with a `service_role` grant inside the `do $$ ... if exists (select 1 from pg_roles where rolname = 'service_role')` form and a row in `SERVICE_ROLE_FUNCTIONS`, `grants.mjs:18-32`.)
- Error code `SCSEL` registered with `sync`.
- D6 holds by construction: an account-deletion request tombstones every own letter at the request (`20261005000000_family_cap_language_idempotency.sql:435-436`, `deleted_reason = 'account_deletion'`) [R], and the non-author branch requires `deleted_at is null`.
- Serves NS-06-B1, B8, B8b, B10, B12 to B16, B18, B20 to B23; NS-36-R1a, R1b (server half), R11.

**S5. `20261130000000_entry_versions_read.sql` (BL-979; NS-12; blocked on counsel Q51, Q32, Q48).**
1. `entry_versions` gains `edit_level text`, `author_edits jsonb`, `locked_spans jsonb` (comments L2, L4, L4, as on `entries`, `20261015030000:837-839` and `data_governance.sql:1115`) [R]. Today a version holds only `final_text`, `in_book`, `machine_edits`, `superseded_by` (`scribe_core.sql:155-161`; `data_governance.sql:172-173`) [R], which is not the whole `text` group (`sync.ts:99`), so a faithful restore needs the other three.
2. Replace `entries_record_version()` (`data_governance.sql:175-186`) [R] to record the three.
3. `public.entry_versions_list(p_entry uuid, p_before timestamptz default null, p_limit int default 20) returns table (id uuid, created_at timestamptz, final_text text, machine_edits jsonb, edit_level text, author_edits jsonb, locked_spans jsonb, restorable boolean)`: `security definer`, `set search_path = pg_catalog, public, pg_temp`, comment saying why definer (`entry_versions` has no API grant after file 25, `explicit_grants.sql:51`) [R]; `require_user()`; returns rows only when the caller is the letter's author and the letter is live; keeps only versions whose `final_text` differs from the next newer state (the version trigger also fires on an `in_book`-only change, `data_governance.sql:178-180`) [R]; newest first; keyset by `(created_at, id)` for Show all; `restorable` is `edit_level is not null`. Grant execute to `authenticated`.
4. `public.entry_version_remove(p_version uuid) returns jsonb`: definer, same `search_path`; author of the live letter only; refuses under a legal hold (`public.is_held('entry', ...)`, used at `sync_v1_server.sql:1878-1881`) [R]; deletes the one row; idempotent (`{ missing: true }` on a second call); writes a content-free `audit_events` row (`entry_version_removed`, ids only). Grant execute to `authenticated`.
5. The existing index `entry_versions_entry_idx (entry_id, created_at)` (`scribe_core.sql:162`) [R] serves both.
- `grants.mjs` has no list for functions granted to `authenticated` (it holds table `GRANTS`, `COLUMNS` and `SERVICE_ROLE_FUNCTIONS` only, `grants.mjs:5-32`) [R]. CLAUDE.md asks for "a line in grants.mjs" for every new public object. Hand-off to `qa` (the harness owner): add `AUTHENTICATED_FUNCTIONS` so these two RPCs, and the existing ones, are listed and compared; until then the access matrix carries their allow and deny cells.
- Restore needs no new RPC: the phone sends `entry.upsert` with `changed: ['text']`, the version's five group values and the current `v` as base; compare and set applies (`WORDS_GROUP`, `sync.ts:107`), and the trigger records the replaced state as a new version (NS-12-R2).
- Serves NS-12-R1, R2, R3, R6, R8.

### 1.5 Length rules: the database counts code points, the app counts graphemes

The rule (BL-957): the app limit is in grapheme clusters through one helper in `packages/core`; the database ceiling is in code points and is a safety net against unbounded rows, never the product limit, so it must admit every value the app accepts. One grapheme can be many code points (a Devanagari conjunct cluster is 3 to 6; an emoji ZWJ family sequence 7 or more). I use 8 code points per grapheme.

| Field | App limit | Database ceiling now | Proposed ceiling | Note |
|---|---|---|---|---|
| `entry_media.photo_text` (phone) | 140 graphemes | `length <= 140` (#835) | `length <= 1120` | Fix in #835 before merge; #836 `capTyped` must count graphemes, not code points |
| `entry_media.place` (phone) | 60 graphemes | `length <= 60` | `length <= 480` | same |
| `entries.first_label`, `held_drafts.first_label` | 40 graphemes | none yet | `char_length between 1 and 320` | Card A23 PROPOSES 200, tested with Devanagari only; 320 also admits labels with emoji (NS-01-R54's own fixture mix) |
| `entries.author_signs_as` | 30 code points | `char_length <= 30` (`data_governance.sql:95`) | unchanged | NS-16 counts the database's way on purpose (card R1, R6). The BL-957 helper must not apply its grapheme rule here: a 30-grapheme Devanagari name over 30 code points would fail the CHECK, and a failed check rejects the whole `entry.upsert` op for good, so the letter would never sync |
| `typedDay.<date>` words | 1 to 80 | settings value, no ceiling | none | phone only |

Property test (fast-check style, Asha fixtures): for random strings of Devanagari with conjuncts, Arabic, CJK and emoji at each limit, the helper accepts at the limit and refuses one more, and every accepted value passes the SQL ceiling (run against the SQLite CHECK and, in `supabase/tests`, against Postgres `char_length`).

### 1.6 Classification of new data (`privacy` confirms; X10 fixed)

| Data | Level | Store |
|---|---|---|
| Stored copy, list copy, page copy, temporary copies | L4 | phone files |
| `entry_media.sha256`, `photo_text`, `place` | L4 | phone |
| `entry_media.entry_id`, `draft_id`; `letter_search_rows.entry_id` | L3 (DATA_CLASSIFICATION rule 5) | phone |
| `letter_search.body`, `.extra` | L4 (derived) | phone |
| `first_mark` | L3 | server, phone |
| `first_label` | L4 | server, phone, Find `extra` |
| `seal_opens_at`, `seal_opens_on`, `seal_cleared_at` | L4 | server (author-only), author's phones |
| `seal_watermark` | L2 | phone sync state |
| `words_withheld`, `withheld_words.*` | L4 | phone; `held_drafts.words_withheld` server |
| `entry_versions.edit_level` / `author_edits`, `locked_spans` | L2 / L4 | server |
| `drafts.author_signs_as`, `signAs.recent` | L3 | phone |

---

## 2. Sync design

### 2.1 Field groups and column lists after the pack

| Group | Columns | Rule | New? |
|---|---|---|---|
| `text` | `final_text`, `machine_edits`, `edit_level`, `author_edits`, `locked_spans` (+ shared `base_direction`, `words_reviewed_at`) | compare and set on `text_xid` | as built (`sync.ts:98-104, 136-147`) |
| `in_book` | `in_book` | later arrival wins | as built |
| `sounds_like_me` | `sounds_like_me` | later arrival wins | as built |
| `occurred_on` | `occurred_on`, `occurred_precision` | later arrival wins | as built; NS-15 uses it unchanged |
| `language` | `language` | later arrival wins | as built |
| `first` | `first_mark`, `first_label` | later arrival wins for the group | S2 |
| `seal` | `seal_opens_at`, `seal_opens_on`, `seal_cleared_at` | write once; the server guard decides; `seal_cleared_at` is a request the server stamps | S4 |

- `INSERT_ONLY_COLUMNS` (`sync.ts:157`): unchanged; `author_signs_as` stays insert-only (NS-16). The seal pair is not insert-only (it may be set on an already-kept letter, NS-06-B3 scope) but is write-once by the guard.
- `IMMUTABLE_COLUMNS` (`sync.ts:154`): unchanged.
- `AUTHOR_ONLY_COLUMNS` (`sync.ts:160-163`): add `seal_opens_at`, `seal_opens_on`, `seal_cleared_at` (no other reader ever receives them). `first_mark`, `first_label` are not author-only: the other parent reads them through `book_entries` on a visible letter (NS-06-A17).
- `ENTRY_DATA_KEYS` (`sync.ts:263-267`) and `EntryData`: add the five keys; the drift test compares them with what `sync_push` reads.
- `PulledRowSchema` (`sync.ts:583`): optional `first_mark`, `first_label`, and own-row-only `seal_*`. `PulledHeldSchema` (`sync.ts:691`): optional `first_mark`, `first_label`, `words_withheld`.
- Phone: `FieldGroup` and `ALL_GROUPS` (`types.ts:50-51`) gain `first`, `seal`; `entrySnapshot` (`outbox.ts:161-184`) gains the five keys; `photo_path` is never in the snapshot (it is not today, `outbox.ts:161-184`) [R].

Ordering rule for deployment: a phone that sends `changed: ['first']` or `['seal']` to a server without S2 or S4 gets `22023 unknown field group` (`sync_v1_server.sql:1031-1033`) [R], a permanent rejected write. So S2 is applied to production before any build with `EXPO_PUBLIC_FIRSTS` on reaches anyone outside the founder's family, and S4 before `EXPO_PUBLIC_SEALED_LETTERS`. The preflight check (BL-958 pattern) refuses a production profile with the flag on until the migration is recorded in `.github/migrations-applied.txt`.

### 2.2 How the phone merges the new groups

- `first`: as any non-words group (`merge.ts:9-13`) [R]: later arrival wins; a letter with a queued op keeps its local group; a server tombstone wins over queued ops. Unmark then Undo are two writes, both queued, applied in order.
- `seal`: own rows only. The local repo mirrors the guard: a set local pair is never overwritten by a different pair from a pull except after this phone's own seal op was refused (`SCSEL` in `rejected_writes`), in which case the server's pair replaces the local one at the next pull (two of the author's phones sealed the same letter offline for different days: first arrival wins everywhere). `seal_cleared_at` is never cleared locally; a pulled non-null value always applies.
- Held drafts: the held section row carries `first_mark`, `first_label`, `words_withheld` (S2, S3). `applyHeldRows` applies the mark to the local draft; on `words_withheld = 1` it moves any local machine output into `withheld_words` and blanks the draft's `raw_transcript`, the same step the mark runs locally. This is the one place a pull changes a local `raw_transcript`, and only to move it aside (`merge.ts:17` says "raw_transcript is never changed once set" [R]; the merge comment changes to say this).
- Find: every merge that touches a letter calls `reconcileSearch` in the same transaction (#798 `lib/sync/engine.ts`) [R]; an opened seal row arriving from the pull enters the index there.

### 2.3 Seal publication (B10.1): option (b), with corrections

The problem is as the card states (F13): the cursor is `entries.sync_xid`, stamped only by a write (`sync_v1_server.sql:145-168`), the incremental page reads `(sync_xid, id)` after the cursor (`:1504-1507`), and a page that ends sets the cursor to the snapshot's `xmin` (`:1512-1513`) [R]. A sealed row that another reader's pull skipped is never fetched again without a write. One more piece of evidence the card does not give: the digest path cannot heal it. When the reader's digest no longer matches, the phone asks for `ids`, and `reconcileIds` only removes rows the server no longer lists; it never fetches a missing one (`apps/mobile/src/lib/sync/merge.ts:764-776`) [R]. Without a mechanism the reader would send `ids: true` on every pull and never get the letter.

**Choice: option (b)**, the pull clause, the card's default and BL-969's scope. Option (a) stays excluded: it needs `pg_cron` and `pg_net` proven on the production plan (UNVERIFIED) and a write on the author's row. I record a third option, (c), in risk R2 for Karma.

Four corrections to the card's (b) spec, each a bug found by reading it against the code:

1. **Ties at the cap.** The card caps the extra rows at `p_limit` and, when capped, sets `seal_watermark` to "the latest `seal_opens_at` returned", with the next window half-open `(seal_since, now]`. Seals for one day by one author share the same instant (a local midnight), so rows with the same `seal_opens_at` as the last one returned would fall outside the next window and be lost forever. Fix: a composite watermark in the cursor's own format, `"<iso instant>|<uuid>"`, and keyset order `(seal_opens_at, id)`.
2. **The 45-day lower clamp.** The card clamps `seal_since` to now minus 45 days. A reader who pulled on day 0 (cursor past the sealed row), was offline 60 days, and whose letter opened on day 10, sends `seal_since` = day 0, clamped to day 15: the row opened on day 10 is never fetched. Fix: no lower clamp on a supplied `seal_since`. The scan is bounded by the partial index (only rows still `seal_cleared_at is null`, per book) and by the cursor.
3. **Old clients.** The card makes an absent `seal_since` on a non-fresh pull mean now minus 45 days. A co-parent on a build from before the seal build, offline longer than that, has the same loss as in 2. Fix: absent on a non-fresh pull means no lower bound; such a phone gets every opened, uncleared seal at or before its cursor on every pull until it updates (the merge ignores a row it holds at the same `v`; the cost is a handful of rows per book, measured in `sync_perf`).
4. **Pages.** Emit the extra rows, and the watermark, only on the book's last page (`not v_more`), so a paginated pull does not send them on every page.

The spec as built:

- Request (per book in `p_since.books`): optional `seal_since`, a string `"<iso>|<uuid>"` the server sent earlier. Malformed raises `22023` with the existing `bad book request`. Later than the server's now is treated as now.
- Server, inside the book loop of `sync_pull`, after the normal page, when `not v_more` and the request is not fresh:
  ```sql
  -- v_now := statement_timestamp() read once per call; v_ss_at, v_ss_id from seal_since (null when absent)
  select ... from entries e
   where e.child_id = b.id
     and e.author_id <> v_uid
     and e.seal_opens_at is not null and e.seal_cleared_at is null
     and e.seal_opens_at <= v_now
     and (v_ss_at is null or (e.seal_opens_at, e.id) > (v_ss_at, v_ss_id))
     and (e.sync_xid, e.id) <= (v_after_x, v_after_i)          -- newer rows come in the normal page
     and exists (select 1 from book_entries be where be.id = e.id)
   order by e.seal_opens_at, e.id
   limit 500
  ```
  Each row is built exactly as others' rows are today, `(select to_jsonb(be) - 'search' from book_entries be where be.id = e.id) || {'own': false, 'v': e.sync_xid}`, and appended to the book's `rows`. They never move `cursor`.
- Response (per book, on the last page): `seal_watermark`. When fewer than 500 rows came back, it is `"<v_now iso>|ffffffff-ffff-ffff-ffff-ffffffffffff"`; when 500 came back, it is the last row's `"<seal_opens_at>|<id>"` and the book's `more` is true, so the phone pulls again.
- Fresh pull (no cursor, or `repull`): no extra rows (the fresh read already returns every readable row); the response still carries a watermark of now.
- Security: the window is only a lower bound and every row passes `book_entries`, so a forged `seal_since` can only fetch rows the caller may already read; opening is decided by the server's clock (NS-06-B16).
- Phone: stores `seal_watermark` per book in `sync_books.seal_watermark` (local migration 13) in the same transaction as the cursor; sends it back as `seal_since`; clears it with the cursor on reset, repull, sign-out and Erase everything. A row whose id it holds at the same `v` is ignored; an unknown id is inserted; the cursor never moves backwards.
- Cost: one range scan of `entries_seal_open_idx` per book per pull; `sync_perf.test.mjs` gains a book with 1,000 letters and 20 opened seals, inside the existing `read_rpc` budget (300 ms, `sync_perf.test.mjs:5`) [R].
- Recorded as an ADR 0028 amendment in the S4 PR body and the ADR (D3 publication paragraph), with B10.1's "default (b)" now an explicit choice.

### 2.4 Idempotency and conflicts

| Write | Idempotency | Conflict rule |
|---|---|---|
| Mark or unmark a first | op id receipt (`sync_op_receipts`); the group write is a set, so a replay is the same | later arrival wins for the group (NS-06-A8, A16, A19) |
| Seal | op id; the guard compares values, so the unchanged pair passes again | first arrival wins; a changed pair is `SCSEL` for good |
| Open now | op id; `seal_cleared_at` kept once set | none (monotonic) |
| Restore a version | an `entry.upsert` with a base: compare and set | words conflict copy as today (`data/other-versions.json`) |
| Remove a version | `entry_version_remove` returns `{ missing: true }` on a repeat | none; author only |
| Withhold words | `held.upsert` with `words_withheld: true`; a repeat on a withheld row changes nothing | the flag wins over any later machine words |
| Let go of a held draft | `held.discard` with a base (`:771-788`) | a later edit elsewhere keeps the row (`kept: true`) |

Queued ops are bound to the account that made them (`[X4-R1]`, NS-09-R11, BL-961): the outbox is never sent under another account.

### 2.5 What never syncs

`entry_media` rows and every picture file (NS-01-R15; S1 enforces the server half); typed photo words and place (NS-01-R26); the Find index, its view and its settings (NS-02-R31); the query; typed days and every reminder setting (NS-13-R22, NS-18); `discard.failures.*`, `copySlip.*`, `home.*`, `newPhoneLine.dismissed`, `signAs.recent`; `withheld_words` (the server's held copy is emptied, S3); the seal pair on a draft before Keep (ADR 0028 D3a); the version list cache. `seal_watermark` travels as a request field and is never data.

---

## 3. Export schema versions

Rule, from the `export/schema.ts` header (`:6-10`, `:16-27`) [R]: adding an optional field is a minor bump; each v1 minor closes its objects (`additionalProperties: false`), so an older schema rejects a newer file, and every export is read with the schema it carries in `schema/export-v1.schema.json`; each v1 minor reads every earlier v1 file. A PR that bumps freezes the current golden under `__golden__/export-asha/_v<old>/` first (ADR 0028 D2 step 1). Two PRs never claim one minor: whichever merges second takes the next number (the header's own precedent, `:36-37`).

| Version | Adds | PR | Gate |
|---|---|---|---|
| 1.7.0 | `ExportEntry.photo` becomes `ExportPhoto \| null` = `{ file, bytes, sha256, width, height, text, place }`; files at `photos/<entry_id>/<media_id>.jpg`; `counts.photos` = files written, excluding Recently deleted; manifest `files` lists each photo; `verify.ts` checks them like audio (ADR 0028 D2) | BL-933 | BL-868 fix to `DELETION_AND_EXPORT_SPEC.md:335` in a PR for the founder |
| 1.8.0 | `first: { label: string \| null }` per letter, absent when not marked (NS-06-A7) | BL-968 | merges after 1.7.0 |
| 1.9.0 | `seal_opens_at`, `seal_opens_on`, `seal_cleared_at` per letter, author's export only (NS-06-B5); 1.8.0 if the seal build merges before Firsts | BL-969/BL-970 | after S4 |

No bump: NS-15 (`occurred_on`, `occurred_precision` since 1.5.0), NS-16 (`author.signs_as` exists), NS-12 (versions not exported, the card's default), NS-37 (copies never exported). NS-17: a withheld take exports as audio with no words; whether `ExportWaitingLetter` (1.6.0) allows a waiting letter with no `waiting/<id>.txt` is UNVERIFIED; if it requires the file, a `words_withheld: true` marker is a minor bump of its own.

Inside the author's ZIP, a sealed letter that has not opened: `entries.json` and its text file carry the words (B5 exception, FS-R11); `book/<child>.pdf` and `index.html` show the "hidden until" row and no words (B2, B5). This split is my reading of B2 plus B5; `product` confirms `index.html`.

Tests for every bump: the new golden validates against its own schema; the previous frozen golden validates against the new schema; the new golden is rejected by the previous schema (NS-36-R7). The Asha snapshot grows by one item per bump: a letter with a picture ("Asha and the rain boots", place "the back step") and one in Recently deleted that must not appear (1.7.0); a first labelled "laughed out loud" and one with no label (1.8.0); one sealed letter not yet open and one opened by Open now (1.9.0).

---

## 4. Deletion and lifecycle, per new data

| Data | Delete (Recently deleted) | Restore | Purge (30 days or Delete now) | Let go (draft) | Erase everything / account deletion on this phone | Sign-out (D1) | Server account deletion | Sweeps |
|---|---|---|---|---|---|---|---|---|
| Stored copy, 512, 1280, `entry_media` row | hidden by join on `entries.deleted_at`, no picture write | back by the same join | files first (all three), then row, then index row (ADR 0028 D5; NS-37-R5) | files, then row | folder deleted by listing; Find index dropped before rows | kept | nothing on the server; phone text says so (NS-01-R31) | file without row deleted; row without file removed; derivative without stored copy deleted; missing derivative regenerated; both Caches folders emptied at launch |
| Photo words, place | with the row; index in the same transaction | back | with the row | with the row | as above | kept | n/a | as the row |
| Find index rows | terms removed in the letter's transaction | added back | map row removed | n/a (drafts not indexed) | tables dropped, never row-deleted (NS-02-R18) | kept; X4 isolates | n/a | `optimize` at the next idle catch-up, bytes gone within 24 h (NS-02-R30) |
| `first_mark`, `first_label` | tombstone with the letter; hidden from lens and Find | back | row purge (server and phone) | with the draft; a held row by `held.discard` | removed with rows | kept | tombstoned at the request, purged at the deadline | none |
| Seal columns | tombstone; Recently deleted shows the day and no words (B25) | back; a restore is a write, so others get it by cursor if open | purge | the draft's pair goes with it | removed | kept, still hidden by the same rule | tombstoned at request; never published (D6, B18) | none |
| `seal_watermark` | n/a | n/a | n/a | n/a | removed with sync state | cleared with the cursor | n/a | n/a |
| `entry_versions` rows | stay with the tombstoned letter; list RPC returns nothing for a deleted letter | available again | cascade with the letter (`purge_due`, `sync_v1_server.sql:1968`) [R] | n/a | n/a (server only) | n/a | cascade | none; the author may remove one (D8) |
| `withheld_words`, `words_withheld` | with the letter | back | removed with the letter | removed with the draft | removed | kept (D1) | `held_drafts` row purged with the account | none |
| `held_drafts` words (server) | n/a | n/a | n/a | deleted in the acknowledging request (D7) unless `kept` or under hold | n/a | queued discard held for the same account (NS-09-R11) | cascade | n/a |
| From name | with the letter | back | with the letter | the draft column goes with the draft | names list removed | names list removed (NS-16-R15) | purged with the letters | none |
| Typed days | n/a | n/a | n/a | n/a | removed | removed (NS-18-R6) | n/a | deleted the day after delivery (NS-18-R7) |

The discarding-drafts sweep (#832, BL-923) is unchanged; BL-977 adds only the persistent failure counter.

---

## 5. Ordering, dependencies, parallel lanes, rollback

Dependency chain (an arrow means "must merge first"):

```
#835 (migration 11, CHECK fix) -> #836 (stored copy, capTyped by graphemes) -> #837..#840
   -> BL-932 (512/1280 copies, sweep name rule) -> BL-956 (lens reads 512)
   -> BL-933 (export 1.7.0; needs BL-868 in a founder PR)
S1 photo write-deny            (independent; before EXPO_PUBLIC_PHOTOS in production)
BL-952 Find (no migration)     (independent of photos; the photo source registers only when migration 11 exists)
S2 Firsts + local 12 + export 1.8.0  (after BL-939 and the study BL-981; after 1.7.0)
S3 held words withheld + local 15    (restates held_upsert on top of S2)
S4 seal + local 13 + export 1.9.0    (restates sync_push, sync_pull, book_entries, entries_family_rules on top of S2)
S5 entry_versions RPCs               (independent of S2 to S4; counsel-gated)
local 14 (From name)                 (independent; counsel-gated)
```

- Parallel now: S1, BL-952, the photo stack, BL-957's helper, BL-958, BL-960 (inventory), BL-959 (ADR text).
- Serial by function restatement: S2 then S3 then S4 for `held_upsert`; S2 then S4 for `sync_push`, `sync_pull`, `book_entries`, `entries_family_rules`. If gates reorder them (for example S4 before S3), the later file rebases its function bodies on the earlier one and its timestamp moves after it. The S4 PR states "function bodies diffed against <previous file>" with the diff in the body.
- Size: restating `sync_push` (`:931-1301`, about 370 lines) and `sync_pull` (`:1302-1668`, about 366 lines) puts S2 and S4 over the 400-line limit (CODE-R02). The restated bodies are mechanical copies; each PR asks for the founder's size exception with a machine diff of the function bodies against the previous definition, as the photo PRs did.
- Local migration numbers are taken at merge in this order of likelihood: 11 photos, 12 Firsts, then 13 to 15 in whichever order seals, NS-17 and NS-16 merge.
- Server before flag: each server migration is applied to production (CI on a tag, D-041) before the build whose flag needs it is on outside the founder's family (2.1).

Rollback: a flag off hides surfaces and leaves data; remote pauses (`killSwitches.photos`, `killSwitches.bookSearch`) can only hide; no migration is ever reversed; a local migration is never undone (`migrate()` refuses a newer file, `migrations.ts:455`). Specific cases:
- Seal: turning `EXPO_PUBLIC_SEALED_LETTERS` off hides only the seal control; the visibility rule, the hidden row, Open now and the server clause stay in every build that has the columns (B9 last row). The `book_entries` clause is never removed while any row has a pair, or sealed words would publish early.
- Firsts: flag off hides control and lens; marks still sync and export.
- Find: flag off drops the index at the next launch (NS-02-R43).
- S3 and S5: dormant without a client using them.

---

## 6. Tests and what they prove

### 6.1 SQL tests in `supabase/tests` (embedded Postgres; `run.mjs` picks up every `*.test.mjs`, `run.mjs:13`) [R]

| File | Cells (deny first) | P0 rows |
|---|---|---|
| `photo_bucket_closed.test.mjs` (new) | author insert and update into `entry-photos` refused (own folder, other author, other family, non-member, anon); `photo_path` non-null refused with `SCPHO` by direct update and by `sync_push`; null passes; legacy object readable and deletable by its author; purge queue still consumes it. `access_matrix.test.mjs` and `data_governance.test.mjs` move their legacy-object setup to the system role (ADR 0028 D6 item 4). Trigger order list asserted. | NS-01-R61, NS-36-R1d, NS-01-R15 (server) |
| `firsts.test.mjs` (new) | non-author write of `first` refused; quiet-day mark refused; label without mark refused; label at 40 Devanagari and 40 Arabic graphemes passes and 321 code points fails; a non-consented `first_label` write refused by `entries_family_rules`; the other parent sees mark and label through `sync_pull` on an in-book letter and nothing on a private one; unmark leaves `final_text`, `raw_transcript` byte-identical; retried op applies once; held row carries the mark to the author's other session | NS-06-A2a, A13, A17; NS-36-R10, R11 |
| `seal_publish.test.mjs` (new) | B8: other member 0 rows before the instant and cursor past the row; B8b steps 1 to 8 with a 3 s instant; B16 with a forged client time; B20 view hides row and has no seal column; B21 consent gate; B22 `entries_select` still author-only (`data_governance.sql:202-203`); B18 account-deletion request then instant: 0 rows ever; B10 quiet day; re-seal and changed pair `SCSEL`; past instant accepted and open at next pull; CHECK window at UTC+14 and UTC-12 and a 05:30 offset; Open now retried stamps once; forged `seal_since` fetches nothing unreadable; **regressions for the corrections**: two seals with one instant and a cap of 1 both arrive; a reader whose `seal_since` is 60 days old gets a row opened 50 days ago; an absent `seal_since` on a non-fresh pull gets it; extra rows appear on the last page only | NS-06-B8, B8b, B10, B16, B18, B20, B21, B22, B23 |
| `held_withhold.test.mjs` (new) | `raw_transcript` non-empty to null refused without the flag (`SCIMM`); withhold nulls the six word columns; a stale op with words after the withhold leaves them null; `typed_text` still applies; the held section row shows `words_withheld` and no words; repeat is a no-op | NS-17-R8 |
| `entry_versions_read.test.mjs` (new) | list: author gets deduped versions newest first; co-parent, contributor, anon and a second family get nothing (allow and deny cells, DB-R12); deleted letter returns nothing; remove: author only, legal hold refused, repeat `{ missing: true }`, audit row has ids only; a restore through `sync_push` adds a version and leaves `raw_transcript` and `machine_edits` as stored | NS-12-R2, R3, R6, R8 |
| `sync_v1_server.test.mjs` (add) | `[NS-09-R14]`: after `held.discard` with a current base, no `held_drafts` row, `held_drafts_gone` holds only id and kind, `purge_ledger` only the id; with a stale base `kept: true` | NS-09-R14 |
| `classification.test.mjs` (edit) | `mustBeL4` gains `first_label`, `seal_opens_at`, `seal_opens_on`, `seal_cleared_at`; view columns commented | NS-06-B23, NS-36-R10 |
| `explicit_grants.test.mjs` (unchanged, must stay green) | `book_entries` still has no API grant after S2 and S4; new RPCs listed once `qa` adds `AUTHENTICATED_FUNCTIONS` | DB-R13 |
| `sync_perf.test.mjs` (add) | 1,000 letters and 20 opened seals per book; pull inside `read_rpc` | NS-06 B10.1 cost line |

### 6.2 Phone tests (`apps/mobile/test`, node SQLite)

- `migrations.v11.test.ts` to `v15`: byte-identical upgrade, nothing queued, new columns and indexes exist (NS-01-R35 and its siblings).
- Photo lifecycle and sweep with the derivative name rule (NS-01-R16a to R16c, R36, R52, R55; NS-37-R5; NS-36-R1a to R1c).
- `[X4-R1]` over the store with two seeded accounts, extended to `entry_media`, the index, marks, seals, withheld words and settings (NS-01-R29, NS-02-R24, NS-06-A25, B17).
- Merge: `first` later-arrival; `seal` refused-then-adopt; held row with `words_withheld` moves words aside; applying one pull page twice equals once (seal extra rows).
- Export goldens per section 3 (NS-01-R14, NS-36-R2, R5, R7, NS-06-A7, B5).
- `[NS-01-R15]` and `[NS-01-R26]`: the outbox payload for a letter with a picture has `photo_path` absent or null and no `photo_text`, `place` or `photo` key.

### 6.3 Property tests

| Property | Generator | Rows |
|---|---|---|
| Grapheme helper and database ceilings agree (1.5) | Devanagari conjuncts, Arabic, CJK, emoji, mixed | NS-01-R54, NS-06-A23, NS-16-R1, R6; BL-957 |
| One opening rule: the TypeScript `isVisibleTo` and the SQL clause in `searchable_letters` and `book_entries` give the same answer | random `(seal_opens_at, seal_cleared_at, now)` triples, zone offsets including half hours | NS-06-B6, NS-02-R16b, R16c |
| The instant is the local midnight of the chosen day and lies in the CHECK window | random days and IANA zones | NS-06-B1, B1b |
| Index path equals scan path | 200 Devanagari and Arabic fixtures plus random Latin | NS-02-R19, R29 |
| Export round trip: write, validate with own schema, reject with previous | random Asha books | NS-36-R7 |

---

## 7. Risks and open questions (each with my default)

| # | Risk or question | Default |
|---|---|---|
| R1 | Migration 11's CHECKs and #836's cap count code points, so a 140-grapheme Devanagari caption is refused or cut (NS-01-R54). | Fix in #835 and #836 before merge (1.5). After merge it would need migration 12 to rebuild the table. |
| R2 | Seal publication. (b) adds a contract field, phone state and four edge cases (2.3). A third option, (c) "lazy republish inside `sync_pull`" (the pull restamps due rows of the caller's books with `updated_at = now()` under `for update skip locked`, and appends them), needs no contract change and heals old builds, but writes inside a read, and B8b step 7 would see one duplicate row. | (b) with the four corrections; (c) only if Karma rules it, with B8b amended. |
| R3 | Restating `sync_push` and `sync_pull` in S2 and S4 breaks the 400-line limit and invites copy drift. | Founder size exception per PR with a function-body diff; S4 rebases on S2. |
| R4 | The cards' grant instruction for `book_entries` would re-open the view (0.1 item 2). | Revoke only; `explicit_grants.test.mjs` proves it. |
| R5 | `entry_versions` lacks `edit_level`, `author_edits`, `locked_spans`, so versions made before S5 cannot be restored faithfully. | Versions recorded after S5 are restorable; older ones are view-only (`restorable = false`). `mobile` and `product` confirm. |
| R6 | D8 (author may remove a version) and S3 (server copy of withheld words emptied) both touch CLAUDE.md's "every edit is stored and reversible" and "raw_transcript is immutable". The words as heard stay on the phone in both cases and nothing is rewritten. | Karma records a constitution reading before S3 and S5 open; counsel Q51 for retention. |
| R7 | An old build on the author's second phone strips the seal keys and shows a sealed letter open to the author; an `entry.reupload` from such a build after a restore epoch would recreate the row without its seal and publish it at once. | Residual, documented; revisit if a restore epoch ever runs. Mitigation if needed: `sync_push` refuses a reupload of an id whose purge ledger shows a seal (needs a ledger column). |
| R8 | NS-16: `held_drafts` has no `author_signs_as` (`:300-330`), so a held draft kept on another of the author's phones is signed as the parent. | Accept for this pack; the card names the limit. A held column is a later, small server change. |
| R9 | `grants.mjs` cannot list functions granted to `authenticated`. | Hand-off to `qa` for `AUTHENTICATED_FUNCTIONS`; access matrix cells meanwhile. |
| R10 | Which migrations production holds is UNVERIFIED (0.1 item 9). | Every new file sorts after `20261109000000`; the founder's CI tag applies them in order. |
| R11 | `ALTER TABLE ADD COLUMN` with `CHECK` on the SDK 57 SQLite (UNVERIFIED). | No CHECK on added columns; repo functions enforce and test. |
| R12 | FTS5 and its `secure-delete` option on SDK 57 (UNVERIFIED, NS-02 card). | The scan path ships alone if absent (NS-02-R19). |
| R13 | The kill-switch header says each switch "only stops a server-dependent feature" (`packages/api/src/kill-switches.ts:1-8`) [R], while NS-01 and NS-02 use `photos` and `bookSearch` to hide local surfaces and NS-06 Part A refuses a pause for that reason. | Amend the header in #798 or #837 to "may hide a surface; never turns one on, never stops export or deletion"; whether #798's 5-line change does this is UNVERIFIED. |
| R14 | NS-17 has no backlog row for its server and local migrations. | `product` adds one; owner `data-architect` with `sync`. |
| Q1 | Firsts ceiling: 320 (mine) or 200 (card, PROPOSED)? | 320, unless the property test passes at 200 for the full fixture set. |
| Q2 | Is `index.html` inside the author's ZIP treated like the PDF for a closed seal? | Yes: no words until open. |
| Q3 | Export of earlier versions (NS-12). | Not exported (card default). |

---

## 8. Places where a card or a backlog row is wrong, with the evidence

1. **NS-06 A10 step 3 and B10 step 4** say to re-run the revoke and grant block at `20261015030000:251-253`. Line 253 grants `select` on `book_entries` to `authenticated`, which `20261023060000_explicit_grants.sql:49-53` removed on purpose. Follow it and the view is open to every client and `explicit_grants.test.mjs` fails.
2. **NS-06 A10 step 4 and B10 step 5** call `sync_v1_server.sql:1589-1602` "the held section's builder". It is the left-book own-row builder; the held section is `to_jsonb(h)` at `:1635` and needs no edit for new `held_drafts` columns. B10 step 5's "always-null keys so both shapes match" is unnecessary. A10 also omits the `held_drafts.first_mark` and `first_label` columns its own inventory (A11) requires.
3. **NS-06 B10.1 option (b) spec** loses rows: the capped watermark drops ties at one instant, and the 45-day clamp drops seals that opened while a reader was offline longer than that (2.3 corrections 1 to 3).
4. **NS-36 section 23** defaults seal publication to "the job in ADR 0028 D3, if `pg_cron` is available", while NS-06 OQ-B2 and B10.1 default to option (b) and BL-969 scopes (b). Two defaults for one choice; (b) stands.
5. **NS-36-R5 (P0)** fixes "seal fields arrive in 1.8.0" while NS-06-A7 and BL-968 put Firsts in 1.8.0 and wave order (engineering plan, wave 4 Firsts, wave 5 seals) makes Firsts first. A P0 row should not name a version number that depends on merge order; "the next free minor" as in A7 and B5.
6. **BL-969 and BL-970 contradict NS-06 Part B**: BL-969 names `sealed_until (DATE)` (the card has `seal_opens_on` and `seal_cleared_at`), and its read clause `seal_opens_at IS NULL OR seal_opens_at <= now() OR author_id = auth.uid()` omits `seal_cleared_at`, so Open now would not publish; BL-970 says "Open now nulls both columns", which the card's guard refuses with `SCSEL` (a set pair never changes) and which would erase the record of the day. The card wins; the rows need a fix PR.
7. **NS-17 section 10 and R8**: "if a push already went, the next push sets them null on the server" cannot happen: `held_drafts_stamp` raises `SCIMM` (`:506-507`) and `held_upsert` keeps the old value on a null or empty push (`:722`). A server migration is needed (S3); the card says "server none if the null update is allowed", and it is not.
8. **NS-09 R14 and D7** read as if a server change may be needed. `held_discard` already purges row and words in the acknowledging request (`:771-788`); the card should name the two exceptions (`kept` on a stale base, legal hold).
9. **NS-10 OQ** ("does `sync_pull` serve rows while consent is outstanding"): it does; `sync_pull` checks sign-in only (`:1305`, `security_and_family.sql:62-74`). The decline rule is a phone rule.
10. **BL-957** says the app counts graphemes for every typed field including the From name; NS-16-R1 and R6 count code points on purpose. Applying the grapheme rule to the name lets a Devanagari name pass the app and fail the server CHECK, which rejects the whole letter op for good.
11. **NS-01 section 10, NS-02 section 10, NS-36-R4** treat ADR 0028 as unmerged; it merged at 04:28 UTC on 20 Nov. The X10 L3 fix is still missing in the ADR text (`:34-35, :184`).
12. **NS-06 A23** proposes a 200 code point ceiling for a 40-grapheme label; that fails a label with a few emoji family sequences, which NS-01-R54 treats as a case to support. 320 is my proposal (Q1).
