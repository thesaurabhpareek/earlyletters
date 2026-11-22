-- Held drafts are checked at write time like letters (review A on #253, comment 6375873410, notes
-- N1 and N2; the contract's PulledHeldSectionSchema in packages/api/src/server/sync.ts; ADR 0025
-- section 9: a held draft has "the same consent gate, validation and raw-transcript immutability as
-- entries").
--
-- PENDING: not yet applied. Apply after 20261023020000_purge_legal_holds.sql (#251), following
-- supabase/APPLY.md (section "File 22"). Never edits an earlier file. Redefines no function and adds
-- no column: five check constraints on public.held_drafts, nothing else. Refuses a second run, and a
-- run before 20261016000000 (55000).
--
-- The gap. held_drafts (20261016000000) has no check on capture_mode, edit_level or its three jsonb
-- layers, and held.upsert stores them as sent. The app's pull parser (PulledHeldSectionSchema) drops a
-- held row the contract refuses and counts it; the server keeps the row and the cursor moves past it,
-- so a phone without its own copy (a new phone, or one after a restore epoch) never shows that draft
-- (N1). The same values reach the `current` of a refused held.upsert or Keep (sync_private.held_state),
-- which ConflictCurrentSchema refuses, so the whole push answer is invalid and the refusal the person
-- must resolve never arrives (N2).
--
-- The fix: the checks `entries` has, in the way `entries` has them (check constraints; sync_push
-- validates no letter column itself), and exactly what the contract accepts for a held row
-- (PulledHeldSchema, HeldDraftData), no stricter and no looser:
--   capture_mode   'spoken', 'typed' or 'mixed'      entries: the same list (20260930000000)
--   edit_level     null, 'clean' or 'verbatim'       entries: the same list, never null; a held draft
--                                                    may have no words yet, so null stays allowed
--   machine_edits  null or a JSON array              entries: not null, no shape check (see below)
--   author_edits   null or a JSON array              entries: the same, plus a 64 KB cap
--   locked_spans   null or a JSON array              entries: the same, plus a 16 KB cap
-- Already checked by 20261016000000: kind, occurred_precision, base_direction, the sizes of the words
-- and of machine_edits (held_drafts_sizes). Every other column the contract reads is typed by its
-- column (text, boolean, int, date, timestamptz), so a held row that passes these checks parses.
-- Not added, on purpose, because the contract does not carry them for a held row: the entries caps on
-- author_edits and locked_spans (the push batch's 256 KB cap bounds both), and the entries checks on
-- language and pack_ref. A Keep of such a draft still meets the entries checks, as before.
-- A jsonb 'null' (not SQL null) is refused, as entries refuse it in author_edits and locked_spans; no
-- client path writes one (held.upsert turns JSON null into SQL null, and so does PostgREST).
--
-- How a refusal is answered. A violation is a check_violation (23514, the code entries answer), raised
-- by the insert or update in held.upsert, so sync_push answers that op {op, ok: false, code: '23514'}
-- (no message, no value), changes nothing for it, and goes on with the rest of the batch. The phone
-- keeps the draft and the op in rejected_writes (apps/mobile merge.ts), but nothing is shown yet: the
-- only signal is SyncStatus.rejected, which no screen reads, and held drafts have no rejected state
-- (letters do). WP-F16-01 must surface SyncStatus.rejected and give held drafts a rejected state. The
-- constraint names name the column, never a value. Every held row a write leaves passes the checks, so
-- once they are validated every `current` built from a held row (held_state, keep_check, held_dup, the
-- dup_answer of a refused Keep) parses. One gap stays in entries, outside this file:
-- entries.machine_edits has no array check, so held_state's fallback `current` (the author's letter,
-- when no held row is left) can still carry a letter's non-array machine_edits.
--
-- Existing rows. Never deleted or rewritten (the constitution). Each check is added NOT VALID (new and
-- changed rows are checked from now on), then the rows already stored that it refuses are counted,
-- and it is validated only when that count is 0. Otherwise it stays NOT VALID, a warning names it and
-- the count (counts and constraint names only, never an id or a value: CLAUDE.md privacy), and APPLY.md
-- File 22 says what to do. A row that fails a NOT VALID check cannot be updated until a write brings
-- valid values, and one that keeps the bad value is refused 23514 like any other. A bad capture_mode
-- heals with the next upload (every upload writes it). A row that fails a words check (edit_level,
-- machine_edits, author_edits, locked_spans) heals only with an upload that changes the words on the
-- current base: held_upsert keeps the stored layers for a date-only or a stale words upload
-- (20261016000000), so both of those are refused 23514. Deletes (let go, Keep, Erase now, leaving, the purges) are
-- never checked. Until such a row heals, a Keep of it refused as a words conflict still carries its
-- words in `current` (keep_check, held_state), bad edit_level or machine_edits included (N2, as before).
--
-- New SQLSTATEs: none. Reused: 23514 (check violation), 55000 (second run, or a run before file 17).
-- Tests: supabase/tests/held_drafts_write_checks.test.mjs (new). Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once, after 20261016000000 ----------------------------------------
do $$
begin
  if to_regclass('public.held_drafts') is null then
    raise exception '20261023030000 needs 20261016000000 first (public.held_drafts is missing)' using errcode = '55000';
  end if;
  if exists (select 1 from pg_constraint
              where conrelid = 'public.held_drafts'::regclass and conname = 'held_drafts_capture_mode_check') then
    raise exception '20261023030000_held_drafts_write_checks.sql is already applied (held_drafts_capture_mode_check exists)'
      using errcode = '55000';
  end if;
end;
$$;

-- --- 1. The checks, NOT VALID: every insert and update from now on ------------
alter table public.held_drafts add constraint held_drafts_capture_mode_check
  check (capture_mode in ('spoken', 'typed', 'mixed')) not valid;
alter table public.held_drafts add constraint held_drafts_edit_level_check
  check (edit_level is null or edit_level in ('clean', 'verbatim')) not valid;
alter table public.held_drafts add constraint held_drafts_machine_edits_shape
  check (machine_edits is null or jsonb_typeof(machine_edits) = 'array') not valid;
alter table public.held_drafts add constraint held_drafts_author_edits_shape
  check (author_edits is null or jsonb_typeof(author_edits) = 'array') not valid;
alter table public.held_drafts add constraint held_drafts_locked_spans_shape
  check (locked_spans is null or jsonb_typeof(locked_spans) = 'array') not valid;

-- --- 2. The rows already stored: count, then validate only a check none fails --
-- Each count reads the expression Postgres stored for the constraint, so it is exactly what the
-- check refuses (a check refuses a row only when its expression is false, never when it is null).
do $$
declare
  c record;
  v_bad bigint;
  v_open text[] := '{}';
begin
  for c in
    select k.conname, pg_get_expr(k.conbin, k.conrelid) as expr
      from pg_constraint k
     where k.conrelid = 'public.held_drafts'::regclass
       and k.conname in ('held_drafts_capture_mode_check', 'held_drafts_edit_level_check', 'held_drafts_machine_edits_shape',
                         'held_drafts_author_edits_shape', 'held_drafts_locked_spans_shape')
     order by k.conname
  loop
    execute format('select count(*) from public.held_drafts where (%s) is false', c.expr) into v_bad;
    if v_bad = 0 then
      execute format('alter table public.held_drafts validate constraint %I', c.conname);
      raise notice '%: 0 stored held drafts fail it; validated', c.conname;
    else
      v_open := v_open || c.conname::text;
      raise warning '%: % stored held drafts fail it; left NOT VALID, no row changed (supabase/APPLY.md, File 22)',
        c.conname, v_bad;
    end if;
  end loop;
  if cardinality(v_open) > 0 then
    raise warning 'held_drafts checks left NOT VALID: %', array_to_string(v_open, ', ');
  end if;
end;
$$;

comment on constraint held_drafts_capture_mode_check on public.held_drafts is
  'The entries list (20261023030000); PulledHeldSchema.capture_mode. 23514 on a write.';
comment on constraint held_drafts_edit_level_check on public.held_drafts is
  'The entries list, or null while a held draft has no words (20261023030000). 23514 on a write.';
comment on constraint held_drafts_machine_edits_shape on public.held_drafts is
  'Null or a JSON array, as the contract reads it (20261023030000). 23514 on a write.';
comment on constraint held_drafts_author_edits_shape on public.held_drafts is
  'Null or a JSON array, as entries_author_edits_shape without its cap (20261023030000). 23514 on a write.';
comment on constraint held_drafts_locked_spans_shape on public.held_drafts is
  'Null or a JSON array, as entries_locked_spans_shape without its cap (20261023030000). 23514 on a write.';
