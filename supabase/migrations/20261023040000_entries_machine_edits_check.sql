-- A letter is checked at write time for an array machine_edits (the gap the #254 owner found and
-- recorded in 20261023030000_held_drafts_write_checks.sql, "One gap stays in entries"; the
-- contract's PulledRowSchema and ConflictCurrentSchema in packages/api/src/server/sync.ts).
--
-- PENDING: not yet applied. Apply after 20261023030000_held_drafts_write_checks.sql (#254),
-- following supabase/APPLY.md (section "File 23"). Never edits an earlier file. Redefines no
-- function and adds no column: one check constraint on public.entries, nothing else. Refuses a
-- second run, a run before 20261023030000, and a run while a stored letter fails the check (55000);
-- a refused run changes nothing and records nothing.
--
-- The gap. entries.machine_edits (20260930000000) is `jsonb not null default '[]'` with no shape
-- check, while author_edits and locked_spans have one (20261015030000). entry.upsert and
-- entry.reupload store `coalesce(d -> 'machine_edits', '[]')` as sent (20261016000000), and an
-- author can also write the column straight through the Data API (entries_author_insert and
-- entries_author_update; INSERT and UPDATE are granted to authenticated). So a JSON null, an
-- object, a string, a number or a boolean can be stored today. The contract refuses every one of
-- them for a letter: an own row carries machine_edits as an optional array (PulledRowSchema), and
-- a book's rows are one array (PulledBookSchema), so one such letter makes the author's whole pull
-- answer invalid, every book in it, on every phone of the author, until the row changes. That is
-- worse than the held-draft case of #254, where one row is dropped and counted. The same value
-- reaches each `current` built from the letter (the words refusal of an entry.upsert, dup_outcome,
-- and held_state's fallback when no held row is left), which ConflictCurrentSchema refuses (null
-- or an array), so the whole push answer is invalid and the refusal the person must resolve never
-- arrives. Another member's pull never carries machine_edits (book_entries leaves it out), so only
-- the author's own sync breaks.
--
-- The fix: entries_machine_edits_shape, `check (jsonb_typeof(machine_edits) = 'array')`, as entries
-- has its other checks (check constraints; sync_push validates no letter column itself), and
-- exactly what the contract accepts for a letter, no stricter and no looser: any JSON array, with
-- no size cap of its own (EntryData.machine_edits is unknown[]; the push batch's 256 KB cap bounds
-- it) and no check on the elements (the contract reads them as unknown). No null branch: the
-- column is not null, so SQL null is refused already (23502), and a letter's machine_edits is never
-- null on the wire (PulledRowSchema: optional, not nullable).
--
-- How a refusal is answered. A violation is a check_violation (23514, the code every entries check
-- answers), raised by the insert in entry.upsert or entry.reupload, so sync_push answers that op
-- {op, ok: false, code: '23514'} (no message, no value), changes nothing for it (the op's block
-- rolls back, its receipt with it, so a Keep leaves its held row as it was) and goes on with the
-- rest of the batch. The insert row is checked before Postgres meets the stored letter, so an op
-- whose machine_edits is not an array is refused whole even when it does not name the text group,
-- as a bad author_edits or locked_spans already is. A JSON null is not a SQL null: sync_push keeps
-- `d -> 'machine_edits'` as the jsonb value null, which the not null passes, so it was stored
-- before this file and is 23514 now. An absent key is '[]', as before. sync_push itself never
-- writes a SQL null into the column; a direct Data API write of null is 23502 (not_null_violation),
-- as before, and sync_push answers any 23502 the same way, {op, ok: false, code: '23502'}. The app
-- treats both as a permanent refusal (classifySqlstate: reject): the phone keeps the letter and the
-- op in rejected_writes and marks the letter rejected (apps/mobile merge.ts, sync_state
-- 'rejected'); the letter stays on the phone, but no screen shows that state yet (WP-F16-01, as
-- for held drafts). No app path sends anything but an array (outbox.ts entrySnapshot), so this
-- answers only a writer that is not the app. The constraint name names the column, never a value.
--
-- Other jsonb columns, against what the contract reads (sync.ts):
--   entries.author_edits, locked_spans    pulled (PulledRowSchema)          null or an array, checked
--                                                                           in 20261015030000
--   held_drafts.machine_edits, author_edits, locked_spans
--                                         pulled, and in a held `current`   null or an array, checked
--                                                                           in 20261023030000
--   entries.stt_meta                      never pulled or answered          no check
--   entry_versions.machine_edits          never pulled or answered          no check
--   sync_op_receipts.answer               answered again on a duplicate     written only by the
--                                                                           server; no client grant
-- entry_versions (20261002020000, nullable) is read by no pull, push answer or RPC the app calls,
-- so no value in it can make the contract refuse anything, and its writers copy a checked value
-- already (entries_record_version: the letter's old machine_edits; entries_drop_held: a held
-- draft's, null or an array).
--
-- Existing rows. Never deleted or rewritten (the constitution). In one statement the check is added
-- NOT VALID, the stored letters it refuses are counted, and it is validated when that count is 0.
-- When the count is not 0 the statement raises 55000 with the count and the constraint name only
-- (never an id or a value: CLAUDE.md privacy), so the whole file rolls back: no constraint, no
-- history row, no row changed. APPLY.md File 23 escalates the count; a repair is a decision, never
-- an operator step. File 22 leaves such a check NOT VALID instead. On entries that is not safe: a
-- NOT VALID check still refuses every update of a row that fails it, and those updates include the
-- deletion and membership paths (reviews A and B on #258):
--   cancel_account_deletion updates all of the author's letters (20261005000000:472): it is
--     refused, the request stays scheduled, and the account is purged on day 30 although the
--     person cancelled;
--   finalize_account_deletion clears reviewed_by on other authors' letters (20261003020000:170):
--     the request sticks in executing after the Auth user is gone;
--   Erase now under a legal hold tombstones with an UPDATE (20261016000000:898): 23514 instead of
--     deferred;
--   undo_parent_join (20261015020000:435), review_family_letter (20261003000000:521) and
--     request_book_deletion with a co-parent (20261003000000:672) are refused over another
--     person's letter;
--   a failing letter in Recently deleted cannot heal by upload (entries_guard answers SCTMB,
--     20261016000000:218; restore_entry 23514, 20261015000000:858).
-- Once the file is applied no stored letter can fail the check (every insert and update is
-- checked), so none of these can happen afterwards.
--
-- One transaction. The main block is one statement, so the add, the count, the validate and the
-- comment commit or roll back together however the file is run. The pinned CLI (2.119.0,
-- deploy-db.yml) also sends a file with no transaction control and no index, vacuum or cluster
-- statement as one batch with one Sync, its history insert last (apps/cli-go/pkg/migration/file.go
-- ExecBatch; apps/cli/src/command-internal/migration-apply.ts execMigrationBatch), so a refused
-- run records nothing; the test harness runs a file as one implicit transaction too.
--
-- Locks. The add takes ACCESS EXCLUSIVE on entries until the file commits, with up to two scans
-- (the count, the validate), and while it waits for that lock every pull and push queues behind
-- it. So the block first sets lock_timeout to 5 s, local to this transaction (files 20 to 22 set
-- none): on a busy table the file fails with Postgres's own 55P03 (lock_not_available), nothing
-- changed and nothing recorded, and APPLY.md File 23 says to retry.
--
-- New SQLSTATEs: none. Reused: 23514 (check violation), 55000 (second run, a run before file 22, or a
-- stored letter that fails the check).
-- Tests: supabase/tests/entries_machine_edits_check.test.mjs (new). Fictional family "Asha" only.

-- --- 0. Run once, after 20261023030000 ----------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = to_regclass('public.held_drafts') and conname = 'held_drafts_capture_mode_check') then
    raise exception '20261023040000 needs 20261023030000 first (held_drafts_capture_mode_check is missing)' using errcode = '55000';
  end if;
  if exists (select 1 from pg_constraint
              where conrelid = 'public.entries'::regclass and conname = 'entries_machine_edits_shape') then
    raise exception '20261023040000_entries_machine_edits_check.sql is already applied (entries_machine_edits_shape exists)'
      using errcode = '55000';
  end if;
end;
$$;

-- --- 1. One statement: add NOT VALID, count, then validate at 0 or refuse the file --
-- The count reads the expression Postgres stored for the constraint, so it is exactly what the
-- check refuses (a check refuses a row only when its expression is false, never when it is null).
do $$
declare
  v_expr text;
  v_bad bigint;
begin
  -- Never wait long for the exclusive lock: every pull and push would queue behind the wait.
  perform set_config('lock_timeout', '5s', true);
  alter table public.entries add constraint entries_machine_edits_shape
    check (jsonb_typeof(machine_edits) = 'array') not valid;
  select pg_get_expr(k.conbin, k.conrelid) into v_expr
    from pg_constraint k
   where k.conrelid = 'public.entries'::regclass and k.conname = 'entries_machine_edits_shape';
  execute format('select count(*) from public.entries where (%s) is false', v_expr) into v_bad;
  if v_bad <> 0 then
    raise exception 'entries_machine_edits_shape: % stored letters fail it; nothing applied, no row changed (supabase/APPLY.md, File 23)',
      v_bad using errcode = '55000';
  end if;
  alter table public.entries validate constraint entries_machine_edits_shape;
  comment on constraint entries_machine_edits_shape on public.entries is
    'A JSON array, as the contract reads a letter''s machine_edits (20261023040000). 23514 on a write.';
  raise notice 'entries_machine_edits_shape: 0 stored letters fail it; validated';
end;
$$;
