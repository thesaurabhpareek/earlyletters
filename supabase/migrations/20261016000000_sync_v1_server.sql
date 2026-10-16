-- Sync protocol v1, the server half (docs/adr/0025-sync-protocol-v1.md on the sync
-- stack; PRD V2 F16 sections 6.2 E and I; handoffs #154, #187, #196, #197, #198):
--   WP-F16-14  the words compare and set (entries.text_xid, the receipt outcome);
--   WP-F16-17  held drafts on the server (held_drafts, held.upsert, held.discard,
--              the held pull section, purge_ledger 'held_draft');
--   WP-F16-13  Erase now in a sync build (entry.erase, the erasure record);
--   M17        the review mark (entries.words_reviewed_at, ADR 0025 section 11);
--   B6         an upload never brings an erased letter back (the 60 day forget).
--
-- PENDING: not yet applied. Apply after 20261015030000_v1_wire_contract_columns.sql,
-- following supabase/APPLY.md (section "File 17"). Never edits an earlier file.
-- Redefined from their newest version: sync_push and sync_pull (20261015030000),
-- entries_set_sync_xid and entries_not_purged (20261004100000), ops_replay_ledger and ops_incident_scope
-- (20261004200000); backup_entry_exists (#151, S05's request) only when #151 has
-- created it. Refuses a second run (55000).
--
-- The stand-ins this replaces. The sync stack (PR #182 at 4abc671) tests against
-- apps/mobile/test/helpers/sync-v1-standin.sql, sync-v1-held-standin.sql,
-- sync-v1-erase-standin.sql and the anchored edits in sync-v1-standin.ts. This
-- file builds the same objects, names, answers and SQLSTATEs (the stack's
-- sync-server.ts then loads none of them: sync_push mentions conflict_groups and
-- entry.erase, and public.held_drafts exists). Differences, each on purpose:
--   a. B6 as corrected by review B's re-check: an upload is refused as gone (SCDEL,
--      detail 'purged') only when an erasure is recorded for its id: purge_ledger
--      'entry', the erasure record below, or a held marker 'erased'. The stand-in
--      refused every entry.upsert with a base for a missing id, which after a
--      database restore would refuse, and lose, a letter written after the restore
--      point. The rule lives in the insert trigger entries_not_purged, so every path
--      (entry.upsert, entry.reupload, a direct insert) obeys it.
--   b. The erasure record (sync_private.entry_erasures) outlives the 60 day ledger
--      trim: every hard delete of a letter while its book and author exist is
--      recorded (Erase now, purge_due's 30 day purge, the restore replay), so a phone
--      away longer than 60 days still cannot bring an erased letter back. It is also
--      the stand-in's digest marker. Ids and times only; it goes with the book and
--      with the author's account (foreign keys).
--   c. A held marker 'erased' refuses any later upload of that id, held or letter,
--      so an offline Restore on another phone cannot undo Erase now (#197, review B).
--      Erase now on a waiting letter also ledgers its id as 'entry' (restore replay).
--   d. entries.text_xid is null for letters written before this file and is read as
--      coalesce(text_xid, sync_xid), never lower than the words' real version: no
--      rewrite of every row (the stand-in's backfill fires every entries trigger and
--      moves every letter's version and updated_at). Only its trigger writes it.
--   e. sync_pull carries the held section itself, from the same snapshot as the
--      books, instead of a wrapper around a copy moved to sync_private.
--   f. A receipt notes applied_v only for an op that applied: a restore re-upload the
--      server did not take wrote nothing, so its duplicate never moves a base.
--   g. What the stand-ins leave to S02: purge_ledger 'held_draft' on every delete
--      path but Keep; the recording's backup (#151's backup_forget_entry, called when
--      it exists); account deletion and book purge of held rows (foreign-key cascade,
--      ledgered by trigger); legal holds on held drafts; the restore replay of the new
--      ledger kinds; the review mark; held drafts in ops_incident_scope.
--
-- Decisions asked of S02 in the handoffs:
--   - Words version: the xid stamp (text_xid), not a per-row counter, so `base` keeps
--     its meaning on the wire (#154 ask 1).
--   - A 'discarded' marker does not refuse a later held.upsert from another phone of
--     the author: the later edit wins over a let-go in either order (#187, ADR 0025
--     section 9, #197). Only 'erased' is final.
--   - entry_erasures is not trimmed by time: trimming would reopen B6. Each row is
--     two ids, an author id and two times.
--
-- New SQLSTATEs: none. Reused: SCDEL detail 'purged' (now also for a held upload of
-- an erased id), SCIMM, SCCON, 22023, 55000 (second run).
-- Fictional family "Asha" in every test (CLAUDE.md).

-- ─── 0. Run once ─────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.held_drafts') is not null then
    raise exception '20261016000000_sync_v1_server.sql is already applied (public.held_drafts exists)' using errcode = '55000';
  end if;
end;
$$;

-- ─── 1. Ledger kind 'held_draft' (F16 6.2 I, F17 section 8.4) ─────────────
-- Widen purge_ledger.entity_type by one value without dropping any value another
-- file added (#151 adds 'audio_blob' the same way, in either order).
do $$
declare
  v_def text;
  v_vals text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
    from pg_constraint c
   where c.conrelid = 'public.purge_ledger'::regclass and c.conname = 'purge_ledger_entity_type_check';
  if v_def is null then
    raise exception 'purge_ledger_entity_type_check not found; apply the earlier files first';
  end if;
  select array_agg(m[1] order by m[1]) into v_vals from regexp_matches(v_def, '''([a-z_]+)''', 'g') as m;
  if not ('held_draft' = any (v_vals)) then
    v_vals := v_vals || array['held_draft'];
    alter table public.purge_ledger drop constraint purge_ledger_entity_type_check;
    execute format('alter table public.purge_ledger add constraint purge_ledger_entity_type_check check (entity_type in (%s))',
                   (select string_agg(quote_literal(v), ', ' order by v) from unnest(v_vals) as v));
  end if;
end;
$$;

-- ─── 2. The words version and the review mark (WP-F16-14, M17) ──────────
-- text_xid: the transaction that last wrote the words group (final_text,
-- machine_edits, edit_level). The compare reads it, not sync_xid, so another
-- phone's in_book or date change never raises a words conflict (F16 C2).
alter table public.entries add column if not exists text_xid xid8;
-- words_reviewed_at: when the author kept the letter with its words on screen (M17).
-- Travels with the text group, author-only, never in book_entries.
alter table public.entries add column if not exists words_reviewed_at timestamptz;

-- Stamped by the row-version trigger (from 20261004100000; one trigger for both
-- versions, so every letter write pays for one call, not two).
create or replace function public.entries_set_sync_xid()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  new.sync_xid := pg_current_xact_id();
  if coalesce(current_setting('scribe.sync_reupload', true), '') <> 'on' then
    new.sync_restored_from := null;
  end if;
  -- WP-F16-14: the words version.
  if tg_op = 'INSERT' then
    new.text_xid := new.sync_xid;
  elsif (new.final_text, new.machine_edits, new.edit_level) is distinct from (old.final_text, old.machine_edits, old.edit_level) then
    -- The row lock orders writers, xids do not: a transaction with an older xid can commit its words
    -- after a newer one already answered a phone with v = old.sync_xid. Stamp past that version, so
    -- that phone's next base still sees these words as newer (a compare never passes over them).
    new.text_xid := case when new.sync_xid > old.sync_xid then new.sync_xid
                         else ((old.sync_xid::text)::numeric + 1)::text::xid8 end;
  else
    new.text_xid := old.text_xid;   -- only this trigger writes it (a direct update cannot move it)
  end if;
  return new;
end;
$$;

-- The receipt outcome (ADR 0025 section 2): what an op wrote, so a duplicate repeats it.
alter table public.sync_op_receipts add column if not exists applied_v xid8;
-- The op's words were refused, or it met words newer than its base: its answer carried current.
alter table public.sync_op_receipts add column if not exists words_conflict boolean not null default false;
alter table public.sync_op_receipts add column if not exists words_refused boolean not null default false;

-- ─── 3. sync_private: helpers the API never exposes ─────────────────────
-- PostgREST exposes public only (supabase/APPLY.md, File 17: never add sync_private
-- to the exposed schemas). sync_push runs as the caller, so signed-in people need
-- usage; anon gets nothing. Every object here is reached only through sync_push,
-- sync_pull or a trigger.
create schema if not exists sync_private;
revoke all on schema sync_private from public, anon;
grant usage on schema sync_private to authenticated;
comment on schema sync_private is
  'Sync helpers and the erasure record (20261016000000). Never exposed through the Data API; reached only from sync_push, sync_pull and triggers.';

-- Clients cannot write receipts (BL-331), so the outcome is noted by a definer helper.
create or replace function sync_private.note_applied(p_op uuid, p_entry uuid, p_refused boolean, p_newer boolean)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  update public.sync_op_receipts r
     set applied_v = case when p_refused or p_newer then null
                          else (select e.sync_xid from public.entries e where e.id = p_entry and e.author_id = auth.uid()) end,
         words_conflict = p_refused or p_newer,
         words_refused = p_refused
   where r.op_id = p_op and r.profile_id = auth.uid();
end;
$$;

-- What a duplicate of an entry op answers besides the letter's state: applied_v, or,
-- when the first answer was a words conflict, that answer again with the words now.
-- A lost answer never turns a refusal into a rebase on words the phone never saw.
create or replace function sync_private.dup_outcome(p_op uuid, p_entry uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  r record;
begin
  select x.applied_v, x.words_conflict, x.words_refused into r
    from public.sync_op_receipts x where x.op_id = p_op and x.profile_id = auth.uid();
  if not found then
    return '{}'::jsonb;
  end if;
  if r.words_conflict then
    return case when r.words_refused then jsonb_build_object('conflict_groups', jsonb_build_array('text')) else '{}'::jsonb end
      || coalesce((select jsonb_build_object('current', jsonb_build_object('final_text', e.final_text, 'machine_edits', e.machine_edits,
                                                                            'edit_level', e.edit_level,
                                                                            'v', coalesce(e.text_xid, e.sync_xid)::text))
                     from public.entries e where e.id = p_entry and e.author_id = auth.uid()), '{}'::jsonb);
  end if;
  return case when r.applied_v is null then '{}'::jsonb else jsonb_build_object('applied_v', r.applied_v::text) end;
end;
$$;

-- ─── 4. Held drafts (WP-F16-17; F16 6.2 I, F14-REQ-039, F16-REQ-029) ─────
-- A letter held at the Keep gate, or a voice-only letter waiting for its words, of a
-- signed-in, consented author. Author-only: never in book_entries or another
-- member's pull. The id is the letter's id (a kept draft becomes the letter).
create table public.held_drafts (
  id uuid primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  kind text not null check (kind in ('held_letter', 'waiting_letter', 'held_words')),
  capture_mode text not null,
  created_at timestamptz not null,
  occurred_on date not null,
  occurred_precision text not null default 'day' check (occurred_precision in ('day', 'month')),
  language text,
  base_direction text not null default 'ltr' check (base_direction in ('ltr', 'rtl')),
  prompt_key text,
  in_book_choice boolean,
  raw_transcript text,
  final_text text,
  machine_edits jsonb,
  edit_level text,
  author_edits jsonb,
  locked_spans jsonb,
  typed_text text,
  engine_version int,
  pack_ref text,
  audio_kept_on_device boolean not null default false,
  sync_xid xid8 not null default '0',
  text_xid xid8 not null default '0',
  updated_at timestamptz not null default now(),
  -- Size caps; a violation names the constraint, never a value.
  constraint held_drafts_sizes check (
    coalesce(length(raw_transcript), 0) <= 100000 and coalesce(length(final_text), 0) <= 100000
    and coalesce(length(typed_text), 0) <= 100000 and coalesce(length(prompt_key), 0) <= 200
    and coalesce(octet_length(machine_edits::text), 0) <= 200000)
);
create index held_drafts_author_cursor_idx on public.held_drafts (author_id, sync_xid, id);
create index held_drafts_child_idx on public.held_drafts (child_id);
alter table public.held_drafts enable row level security;
-- The author, while a parent of the book. No delete policy and no delete grant: a held
-- draft leaves only through held.discard (the base check, legal holds), Erase now,
-- Keep, leaving the book, or the account and book purges.
create policy held_drafts_author_read on public.held_drafts for select to authenticated
  using (author_id = (select auth.uid()) and public.is_child_parent(child_id));
create policy held_drafts_author_insert on public.held_drafts for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_child_parent(child_id));
create policy held_drafts_author_update on public.held_drafts for update to authenticated
  using (author_id = (select auth.uid()) and public.is_child_parent(child_id))
  with check (author_id = (select auth.uid()) and public.is_child_parent(child_id));
create policy held_drafts_no_anonymous on public.held_drafts as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
revoke all on public.held_drafts from public, anon;
revoke delete, truncate, references, trigger on public.held_drafts from authenticated;
grant select, insert, update on public.held_drafts to authenticated;   -- sync_push runs as the caller

-- What a phone of the same author needs to drop, adopt or erase its copy. Ids and
-- times only, never words. Written by definer code only (no policy, no grant).
create table public.held_drafts_gone (
  id uuid primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  gone text not null check (gone in ('discarded', 'kept', 'erased')),
  updated_at timestamptz not null default now(),
  sync_xid xid8 not null default pg_current_xact_id()
);
create index held_drafts_gone_cursor_idx on public.held_drafts_gone (author_id, sync_xid, id);
create index held_drafts_gone_child_idx on public.held_drafts_gone (child_id);
alter table public.held_drafts_gone enable row level security;   -- no policy: definer code only
revoke all on public.held_drafts_gone from public, anon, authenticated;

-- ─── 5. The erasure record (WP-F16-13, B6) ──────────────────────────────
-- One row per letter purged while its book and its author exist: Erase now, the 30
-- day purge, the restore replay. Two uses: the next pull of that book recomputes its
-- removal digest (every phone that holds the letter drops it at its next pull), and
-- no upload of that id is ever stored again, also after purge_ledger's 60 day trim.
-- Ids and times only. It goes with the book and with the author (foreign keys).
create table sync_private.entry_erasures (
  entry_id uuid primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  erased_at timestamptz not null default now(),
  sync_xid xid8 not null default pg_current_xact_id()
);
create index entry_erasures_book_idx on sync_private.entry_erasures (child_id, sync_xid);
create index entry_erasures_author_idx on sync_private.entry_erasures (author_id);
alter table sync_private.entry_erasures enable row level security;   -- no policy: definer code only
revoke all on sync_private.entry_erasures from public, anon, authenticated;

-- Whether an id was erased for good: the ledger (60 days, replayed after a restore),
-- the erasure record (kept), or a held marker 'erased'. Definer: called from triggers.
create or replace function sync_private.erasure_recorded(p_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.purge_ledger l where l.entity_type = 'entry' and l.entity_id = p_id::text)
      or exists (select 1 from sync_private.entry_erasures x where x.entry_id = p_id)
      or exists (select 1 from public.held_drafts_gone g where g.id = p_id and g.gone = 'erased');
$$;

-- From 20261004100000 (section 2); the only change is the wider rule above (written
-- out here, not called, because it runs on every letter write).
create or replace function public.entries_not_purged()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if exists (select 1 from public.purge_ledger l where l.entity_type = 'entry' and l.entity_id = new.id::text)
     or exists (select 1 from sync_private.entry_erasures x where x.entry_id = new.id)
     or exists (select 1 from public.held_drafts_gone g where g.id = new.id and g.gone = 'erased') then
    raise exception 'this letter was deleted' using errcode = 'SCDEL', detail = 'purged';
  end if;
  return new;
end;
$$;

-- Every hard delete of a letter while its book and author still exist is an erasure
-- (Erase now, purge_due, ops_replay_ledger). A delete cascaded from the book or the
-- account is not: those rows go with it.
create or replace function public.entries_note_erasure()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if exists (select 1 from public.children c where c.id = old.child_id)
     and exists (select 1 from public.profiles p where p.id = old.author_id) then
    insert into sync_private.entry_erasures as x (entry_id, child_id, author_id)
    values (old.id, old.child_id, old.author_id)
    on conflict (entry_id) do update set erased_at = now(), sync_xid = pg_current_xact_id();
  end if;
  return old;
end;
$$;
create trigger entries_note_erasure after delete on public.entries
  for each row execute function public.entries_note_erasure();

-- ─── 6. Held draft triggers ─────────────────────────────────────────────
create trigger held_drafts_consent_gate before insert or update on public.held_drafts
  for each row execute function public.client_content_gate();

-- An erased id never comes back as a held draft (#197, review B): another phone of the
-- author may still hold it, waiting or in Recently deleted.
create or replace function public.held_drafts_not_erased()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if sync_private.erasure_recorded(new.id) then
    raise exception 'this letter was erased' using errcode = 'SCDEL', detail = 'purged';
  end if;
  return new;
end;
$$;
create trigger held_drafts_not_erased before insert on public.held_drafts
  for each row execute function public.held_drafts_not_erased();

create or replace function public.held_drafts_stamp()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if new.author_id is distinct from old.author_id or new.child_id is distinct from old.child_id
       or new.created_at is distinct from old.created_at then
      raise exception 'held_drafts: author_id, child_id and created_at are immutable' using errcode = 'SCIMM';
    end if;
    if coalesce(old.raw_transcript, '') <> '' and new.raw_transcript is distinct from old.raw_transcript then
      raise exception 'held_drafts: raw_transcript is immutable once set' using errcode = 'SCIMM';
    end if;
  end if;
  new.sync_xid := pg_current_xact_id();
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.text_xid := pg_current_xact_id();
  elsif (new.final_text, new.machine_edits, new.edit_level, new.author_edits, new.locked_spans, new.typed_text)
        is distinct from (old.final_text, old.machine_edits, old.edit_level, old.author_edits, old.locked_spans, old.typed_text) then
    -- Same rule as entries.text_xid: never behind a version already handed out.
    new.text_xid := case when pg_current_xact_id() > old.sync_xid then pg_current_xact_id()
                         else ((old.sync_xid::text)::numeric + 1)::text::xid8 end;
  else
    new.text_xid := old.text_xid;
  end if;
  return new;
end;
$$;
create trigger held_drafts_stamp before insert or update on public.held_drafts
  for each row execute function public.held_drafts_stamp();

-- The markers the author's other phones read, and what goes with a held row. Definer:
-- clients cannot write markers or the ledger.
--   insert: a marker for the id goes (the draft is back, a later edit won).
--   delete, Keep (an entries row took the id): marker 'kept'; the recording stays
--     with the letter.
--   delete, any other path (let go, Erase now, account or book purge, the restore
--     replay): purge_ledger 'held_draft'; while the book and the author exist, the
--     recording's backup goes (F08 6.5 D5, #151) and the marker says 'erased' (Erase
--     now) or 'discarded'. A cascade from the book or the account leaves no marker:
--     the markers go with it.
create or replace function public.held_drafts_note_gone()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_kept boolean;
  v_live boolean;
begin
  if tg_op = 'INSERT' then
    -- A let-go marker is cleared; an erase marker never is (the insert was refused before this anyway).
    delete from public.held_drafts_gone g where g.id = new.id and g.gone <> 'erased';
    return new;
  end if;
  v_kept := exists (select 1 from public.entries e where e.id = old.id and e.author_id = old.author_id);
  v_live := exists (select 1 from public.children c where c.id = old.child_id)
            and exists (select 1 from public.profiles p where p.id = old.author_id);
  if not v_kept then
    insert into public.purge_ledger (entity_type, entity_id) values ('held_draft', old.id::text) on conflict do nothing;
    if v_live and to_regprocedure('public.backup_forget_entry(uuid)') is not null then
      execute 'select public.backup_forget_entry($1)' using old.id;
    end if;
  end if;
  if v_live then
    insert into public.held_drafts_gone as g (id, author_id, child_id, gone)
    values (old.id, old.author_id, old.child_id,
            case when current_setting('scribe.held_erase', true) = 'on' then 'erased'
                 when v_kept then 'kept' else 'discarded' end)
    on conflict (id) do update set gone = excluded.gone, updated_at = now(), sync_xid = pg_current_xact_id();
  end if;
  return old;
end;
$$;
create trigger held_drafts_gone_on_delete after delete on public.held_drafts
  for each row execute function public.held_drafts_note_gone();
create trigger held_drafts_gone_on_insert after insert on public.held_drafts
  for each row execute function public.held_drafts_note_gone();

-- Keep: the letter takes the draft's id, and its held row goes in the same transaction.
create or replace function public.entries_drop_held()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  delete from public.held_drafts h where h.id = new.id and h.author_id = new.author_id;
  return new;
end;
$$;
create trigger entries_drop_held after insert on public.entries
  for each row execute function public.entries_drop_held();

-- Leaving a book (leave_child, remove_child_member, undo_parent_join): the leaver's held
-- drafts of that book go too. They could no longer read or let go of them (RLS needs a
-- parent of the book), so they would stay on the server unreachable.
create or replace function public.child_members_drop_held()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  delete from public.held_drafts h where h.author_id = old.profile_id and h.child_id = old.child_id;
  return old;
end;
$$;
create trigger child_members_drop_held after delete on public.child_members
  for each row execute function public.child_members_drop_held();

-- ─── 7. Held draft ops (sync_push's held.upsert and held.discard) ────────
-- Whether a held id belongs to someone else (definer: RLS hides other authors' rows).
create or replace function sync_private.held_id_taken(p_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.held_drafts h where h.id = p_id and h.author_id is distinct from auth.uid());
$$;

-- Whether the caller's own held row is under a legal hold (definer: legal_holds is service-only).
create or replace function sync_private.held_on_hold(p_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.held_drafts h
                  where h.id = p_id and h.author_id = auth.uid()
                    and (public.is_held('entry', h.id) or public.is_held('profile', h.author_id) or public.is_held('child', h.child_id)));
$$;

-- What the author's phone needs after held.upsert: the row's version, and on a refusal the words it keeps.
create or replace function sync_private.held_state(p_id uuid, p_refused boolean)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public, pg_temp as $$
  select jsonb_build_object('held', (select jsonb_build_object('id', h.id, 'v', h.sync_xid::text, 'updated_at', h.updated_at)
                                       from public.held_drafts h where h.id = p_id))
         || case when p_refused then
              jsonb_build_object('conflict_groups', jsonb_build_array('text'), 'current',
                (select jsonb_build_object('final_text', h.final_text, 'machine_edits', h.machine_edits, 'edit_level', h.edit_level,
                                           'typed_text', h.typed_text, 'v', h.text_xid::text)
                   from public.held_drafts h where h.id = p_id))
            else '{}'::jsonb end;
$$;

-- The held receipt outcome (#196): applied_v is the version this op wrote, so a
-- duplicate rebases on it and never on the row as it is now (which may hold another
-- phone's words; final review A-B1). Null when its words were refused.
create or replace function sync_private.note_held(p_op uuid, p_id uuid, p_refused boolean)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  update public.sync_op_receipts r set words_conflict = p_refused, words_refused = p_refused,
         applied_v = case when p_refused then null
                          else (select h.sync_xid from public.held_drafts h where h.id = p_id and h.author_id = auth.uid()) end
   where r.op_id = p_op and r.profile_id = auth.uid();
end;
$$;

-- held.upsert (security invoker: RLS, the consent gate, the erased refusal and the
-- immutability trigger all apply). Whole row; the words (words group and typed_text)
-- by compare and set against text_xid, as entries in 6.2 E, and only when the op says
-- it changes them (`changed` holds 'text', or no `changed` at all; final review B-3):
-- words changed since base by another transaction and different from the op's are
-- not applied, the other fields are, and the answer carries conflict_groups and current.
create or replace function sync_private.held_upsert(p_op uuid, p_id uuid, o jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public, pg_temp as $$
declare
  d jsonb := coalesce(o -> 'data', '{}'::jsonb);
  v_uid uuid := auth.uid();
  v_base xid8 := nullif(o ->> 'base', '')::xid8;
  cur record;
  v_refused boolean := false;
  v_text boolean := not (o ? 'changed') or 'text' in (select jsonb_array_elements_text(o -> 'changed'));
  v_res jsonb;
begin
  if (d ->> 'id') is distinct from p_id::text then
    raise exception 'held id must match the op id' using errcode = '22023';
  end if;
  if exists (select 1 from public.entries e where e.id = p_id and e.author_id = v_uid) then
    -- Kept already (on another phone, or this op arrived late): the letter is the row now.
    return jsonb_build_object('held', null);
  end if;
  if sync_private.held_id_taken(p_id) then
    -- Another author's row (RLS hides it): one plain refusal, never a key violation that names it.
    raise exception 'held id not available' using errcode = '22023';
  end if;
  select h.text_xid, h.final_text, h.machine_edits, h.edit_level, h.author_edits, h.locked_spans, h.typed_text into cur
    from public.held_drafts h where h.id = p_id for update;
  if found then
    v_refused := v_text and cur.text_xid > coalesce(v_base, '0'::xid8) and cur.text_xid <> pg_current_xact_id()
      and (cur.final_text, cur.machine_edits, cur.edit_level, cur.author_edits, cur.locked_spans, cur.typed_text)
          is distinct from (d ->> 'final_text', nullif(d -> 'machine_edits', 'null'::jsonb), d ->> 'edit_level',
                            nullif(d -> 'author_edits', 'null'::jsonb), nullif(d -> 'locked_spans', 'null'::jsonb), d ->> 'typed_text');
    update public.held_drafts h set
      kind = d ->> 'kind', capture_mode = d ->> 'capture_mode', occurred_on = (d ->> 'occurred_on')::date,
      occurred_precision = coalesce(d ->> 'occurred_precision', 'day'), language = nullif(d ->> 'language', ''),
      base_direction = coalesce(d ->> 'base_direction', 'ltr'), prompt_key = d ->> 'prompt_key',
      in_book_choice = (d ->> 'in_book_choice')::boolean,
      raw_transcript = coalesce(nullif(d ->> 'raw_transcript', ''), h.raw_transcript),
      final_text = case when v_refused or not v_text then h.final_text else d ->> 'final_text' end,
      machine_edits = case when v_refused or not v_text then h.machine_edits else nullif(d -> 'machine_edits', 'null'::jsonb) end,
      edit_level = case when v_refused or not v_text then h.edit_level else d ->> 'edit_level' end,
      author_edits = case when v_refused or not v_text then h.author_edits else nullif(d -> 'author_edits', 'null'::jsonb) end,
      locked_spans = case when v_refused or not v_text then h.locked_spans else nullif(d -> 'locked_spans', 'null'::jsonb) end,
      typed_text = case when v_refused or not v_text then h.typed_text else d ->> 'typed_text' end,
      engine_version = (d ->> 'engine_version')::int, pack_ref = d ->> 'pack_ref',
      audio_kept_on_device = coalesce((d ->> 'audio_kept_on_device')::boolean, false),
      child_id = (d ->> 'child_id')::uuid, created_at = (d ->> 'created_at')::timestamptz
    where h.id = p_id;
  else
    insert into public.held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on, occurred_precision,
                                    language, base_direction, prompt_key, in_book_choice, raw_transcript, final_text,
                                    machine_edits, edit_level, author_edits, locked_spans, typed_text, engine_version,
                                    pack_ref, audio_kept_on_device)
    values (p_id, v_uid, (d ->> 'child_id')::uuid, d ->> 'kind', d ->> 'capture_mode', (d ->> 'created_at')::timestamptz,
            (d ->> 'occurred_on')::date, coalesce(d ->> 'occurred_precision', 'day'), nullif(d ->> 'language', ''),
            coalesce(d ->> 'base_direction', 'ltr'), d ->> 'prompt_key', (d ->> 'in_book_choice')::boolean,
            nullif(d ->> 'raw_transcript', ''), d ->> 'final_text', nullif(d -> 'machine_edits', 'null'::jsonb), d ->> 'edit_level',
            nullif(d -> 'author_edits', 'null'::jsonb), nullif(d -> 'locked_spans', 'null'::jsonb), d ->> 'typed_text',
            (d ->> 'engine_version')::int, d ->> 'pack_ref', coalesce((d ->> 'audio_kept_on_device')::boolean, false));
  end if;
  v_res := sync_private.held_state(p_id, v_refused);
  perform sync_private.note_held(p_op, p_id, v_refused);
  return v_res;
end;
$$;

-- A duplicate of a held op answers what its first answer said: applied_v, or a refusal again.
create or replace function sync_private.held_dup(p_op uuid, p_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = pg_catalog, public, pg_temp as $$
declare
  r record;
begin
  select x.words_refused, x.applied_v into r from public.sync_op_receipts x where x.op_id = p_op and x.profile_id = auth.uid();
  return sync_private.held_state(p_id, coalesce(r.words_refused, false))
    || case when r.applied_v is null then '{}'::jsonb else jsonb_build_object('applied_v', r.applied_v::text) end;
end;
$$;

-- held.discard (#197): the author let it go. Under a row lock: when the row's words
-- changed since the version this phone last saw (base; null counts as 0), the later
-- edit wins and the row stays ({ kept: true }); that phone gets it back at its next
-- pull (final review B-2). Otherwise the row goes, leaving the 'discarded' marker, the
-- ledger row and no backup (held_drafts_note_gone). A row under a legal hold stays
-- ({ kept: true } as well). Missing, or not the caller's: { missing: true }; a retry is
-- a no-op. Definer, because clients hold no delete grant on held_drafts; it acts only
-- on the caller's own row in a book they are a parent of (what RLS would allow).
create or replace function sync_private.held_discard(p_id uuid, p_base xid8)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_text xid8;
begin
  select h.text_xid into v_text from public.held_drafts h
   where h.id = p_id and h.author_id = public.require_user() and public.is_child_parent(h.child_id)
     for update;
  if not found then
    return jsonb_build_object('missing', true);
  end if;
  if v_text > coalesce(p_base, '0'::xid8) or sync_private.held_on_hold(p_id) then
    return jsonb_build_object('kept', true);
  end if;
  delete from public.held_drafts h where h.id = p_id;
  return '{}'::jsonb;
end;
$$;

-- Erase now on a voice-only letter waiting for its words: its only server copy is the
-- held row, or the marker of one let go. The row goes and the marker says 'erased', so
-- every phone of the author erases its copy, never restorable there (final review B4).
-- The id is ledgered as a letter and recorded as erased, so no upload of it is stored
-- again (B6, #197) and a restore replay purges it too. Under a legal hold the row stays
-- ({ deferred: true }). Nothing of the author's: { missing: true }.
-- Called by sync_private.erase_entry when no letter has the id.
create or replace function sync_private.erase_held(p_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_child uuid;
  v_row boolean;
begin
  select h.child_id into v_child from public.held_drafts h where h.id = p_id and h.author_id = v_uid for update;
  v_row := found;
  if not v_row then
    select g.child_id into v_child from public.held_drafts_gone g where g.id = p_id and g.author_id = v_uid for update;
    if not found then
      return jsonb_build_object('missing', true);
    end if;
  elsif sync_private.held_on_hold(p_id) then
    return jsonb_build_object('deferred', true);
  end if;
  if v_row then
    perform set_config('scribe.held_erase', 'on', true);
    delete from public.held_drafts h where h.id = p_id;
    perform set_config('scribe.held_erase', 'off', true);
  else
    update public.held_drafts_gone g set gone = 'erased', updated_at = now(), sync_xid = pg_current_xact_id()
     where g.id = p_id;
  end if;
  insert into public.purge_ledger (entity_type, entity_id) values ('entry', p_id::text) on conflict do nothing;
  insert into sync_private.entry_erasures as x (entry_id, child_id, author_id) values (p_id, v_child, v_uid)
    on conflict (entry_id) do update set erased_at = now(), sync_xid = pg_current_xact_id();
  return jsonb_build_object('erased', true);
end;
$$;

-- ─── 8. Erase now (WP-F16-13; F16-REQ-024, D-085) ───────────────────────
-- entry.erase: the author's own letter, deleted or not yet (its delete may still be
-- queued behind the erase on the phone), is purged now the way purge_due purges it
-- after 30 days: the photo goes to the storage purge queue, purge_ledger gets 'entry'
-- (so a restore replay never brings it back), the erasure record makes the next pull
-- of the book recompute its digest, and the row goes (entry_versions cascade; #151's
-- trigger takes the recording's backup). A missing letter and another person's letter
-- get the same answer, { missing: true }, and nothing changes: a retry is a no-op and
-- nobody learns that someone else's letter exists. Under a legal hold the letter is
-- kept, tombstoned, until the hold lifts ({ deferred: true }).
create or replace function sync_private.erase_entry(p_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  r record;
begin
  select e.id, e.author_id, e.child_id, e.photo_path into r from public.entries e where e.id = p_id for update;
  if not found then
    -- No letter: a voice-only letter waiting for its words lives only as a held row (or its marker).
    return sync_private.erase_held(p_id);
  end if;
  if r.author_id is distinct from v_uid then
    -- The same answer as no letter at all: nothing tells anyone that another person's letter exists.
    return jsonb_build_object('missing', true);
  end if;
  if public.entry_is_held(p_id) then
    update public.entries set deleted_at = coalesce(deleted_at, now()), deleted_reason = coalesce(deleted_reason, 'user') where id = p_id;
    return jsonb_build_object('deferred', true);
  end if;
  if r.photo_path is not null then
    perform public.enqueue_storage_purge('entry-photos', r.photo_path, false, 'entry_purge');
  end if;
  insert into public.purge_ledger (entity_type, entity_id) values ('entry', p_id::text) on conflict do nothing;
  insert into sync_private.entry_erasures as x (entry_id, child_id, author_id) values (p_id, r.child_id, r.author_id)
    on conflict (entry_id) do update set erased_at = now(), sync_xid = pg_current_xact_id();
  delete from public.entries where id = p_id;
  return jsonb_build_object('erased', true);
end;
$$;

-- ─── 9. sync_push: compare and set, held ops, Erase now ─────────────────
-- From 20261015030000. Changes, each marked with its work package:
--   WP-F16-14: two flags; the row read takes the words version under a row lock;
--     words changed since base by another transaction: the text group is not
--     applied (the others are), the answer carries conflict_groups ['text'] and
--     current; an op without text gets current too; the receipt notes the outcome
--     (applied_v, or the conflict); a duplicate repeats it (dup_outcome).
--   B6: nothing here. An upload of an erased id fails in entries_not_purged (SCDEL
--     'purged', which the result marks gone: true), whatever path inserts it.
--   M17: words_reviewed_at with the text group, only when the op carries it.
--   WP-F16-13: entry.erase.
--   WP-F16-17: held.upsert and held.discard, and their duplicate answer.
-- An older server answers 22023 to the three new op types; the phone waits (ADR 0025).
create or replace function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = pg_catalog, public, pg_temp
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  c_groups constant text[] := array['text', 'in_book', 'sounds_like_me', 'occurred_on', 'language'];
  v_epoch_at timestamptz;
  o jsonb;
  d jsonb;
  v_op uuid;
  v_type text;
  v_id uuid;
  v_changed text[];
  v_known timestamptz;
  v_deleted boolean;
  cur record;
  v_exists boolean;
  v_apply boolean;
  v_conflict boolean;
  v_newer boolean;
  v_refused boolean;
  v_new boolean;
  v_res jsonb;
  v_results jsonb := '[]'::jsonb;
  v_code text;
  v_detail text;
  v_ids uuid[];
begin
  if jsonb_typeof(p_ops) is distinct from 'array' or jsonb_array_length(p_ops) > 50 then
    raise exception 'push takes 0 to 50 ops' using errcode = '22023';
  end if;
  if octet_length(p_ops::text) > 262144 then
    raise exception 'push batch is over 256 KB' using errcode = '22023';
  end if;

  perform public.rate_hit('push');                -- 60 per minute per person (SCRAT)

  select e.started_at into v_epoch_at from sync_epochs e order by e.epoch desc limit 1;

  for o in select value from jsonb_array_elements(p_ops) loop
    v_res := '{}'::jsonb;
    begin
      if jsonb_typeof(o) is distinct from 'object' then
        raise exception 'op must be an object' using errcode = '22023';
      end if;
      v_op := (o ->> 'op')::uuid;
      v_type := o ->> 'type';
      v_id := (o ->> 'id')::uuid;
      d := coalesce(o -> 'data', '{}'::jsonb);
      if v_op is null or v_id is null or v_type is null or jsonb_typeof(d) <> 'object' then
        raise exception 'op, type, id and data are required' using errcode = '22023';
      end if;

      -- Idempotency key first: a retry of an applied op changes nothing and reports the current state.
      -- G-10: receipts are keyed by (person, op id) and written only by sync_op_claim().
      v_new := public.sync_op_claim(v_op);

      if not v_new then
        v_res := jsonb_build_object('dup', true);
        if v_type like 'entry.%' then
          v_res := v_res || coalesce(
            (select jsonb_build_object('entry', jsonb_build_object(
                      'id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at, 'deleted_at', e.deleted_at,
                      'in_book', e.in_book, 'approval', e.approval))
               from entries e where e.id = v_id),
            jsonb_build_object('missing', true))
            || sync_private.dup_outcome(v_op, v_id);
        elsif v_type like 'held.%' then
          v_res := v_res || case when v_type = 'held.upsert' then sync_private.held_dup(v_op, v_id) else '{}'::jsonb end;
        end if;
      else
        case v_type
        when 'entry.upsert', 'entry.reupload' then
          if o ? 'changed' then
            if jsonb_typeof(o -> 'changed') <> 'array' then
              raise exception 'changed must be an array' using errcode = '22023';
            end if;
            v_changed := array(select jsonb_array_elements_text(o -> 'changed'));
            if not v_changed <@ c_groups then
              raise exception 'unknown field group' using errcode = '22023';
            end if;
          else
            v_changed := c_groups;
          end if;
          -- WP-F16-14: the words version too, under a row lock, so a concurrent push of the letter waits, then compares.
          -- A letter written before 20261016000000 has no words version yet: its row version stands in (never lower).
          select e.sync_xid, coalesce(e.text_xid, e.sync_xid) as text_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur
            from entries e where e.id = v_id for update;            -- RLS: the caller's own letters only
          v_exists := found;
          v_apply := true;
          v_conflict := false;
          v_newer := false;
          v_refused := false;
          v_deleted := false;
          if v_type = 'entry.reupload' then
            v_known := (o ->> 'known_at')::timestamptz;
            if v_known is null then
              raise exception 'known_at is required for a re-upload' using errcode = '22023';
            end if;
            v_deleted := coalesce((d ->> 'deleted')::boolean, false);
            v_changed := c_groups;
            if v_exists then
              v_apply := case when cur.sync_restored_from is not null then v_known > cur.sync_restored_from
                              else cur.updated_at < v_epoch_at and v_known > cur.updated_at end;
            end if;
          elsif v_exists and nullif(o ->> 'base', '') is not null then
            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;
            v_newer := cur.text_xid > (o ->> 'base')::xid8 and cur.text_xid <> pg_current_xact_id();
            if v_newer and 'text' = any(v_changed) then
              v_changed := array_remove(v_changed, 'text');
              v_refused := true;
            end if;
          end if;

          if v_apply then
            if v_type = 'entry.reupload' then
              perform set_config('scribe.sync_reupload', 'on', true);
              if v_exists and cur.deleted_at is not null and not v_deleted then
                perform public.restore_entry(v_id);
              end if;
            end if;
            if not (v_exists and v_type = 'entry.reupload' and cur.deleted_at is not null and v_deleted) then
              insert into entries as e (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode,
                                        edit_level, prompt_key, engine_version, raw_transcript, machine_edits,
                                        final_text, in_book, sounds_like_me, author_signs_as, audio_kept_on_device,
                                        deleted_at, language,
                                        occurred_precision, base_direction, author_edits, locked_spans, pack_ref,
                                        words_reviewed_at)
              values (v_id, (d ->> 'child_id')::uuid, v_uid, d ->> 'kind', (d ->> 'occurred_on')::date,
                      (d ->> 'captured_at')::timestamptz, d ->> 'capture_mode', coalesce(d ->> 'edit_level', 'clean'),
                      d ->> 'prompt_key', (d ->> 'engine_version')::int, d ->> 'raw_transcript',
                      coalesce(d -> 'machine_edits', '[]'::jsonb), d ->> 'final_text',
                      coalesce((d ->> 'in_book')::boolean, false), (d ->> 'sounds_like_me')::boolean,
                      nullif(d ->> 'author_signs_as', ''), coalesce((d ->> 'audio_kept_on_device')::boolean, false),
                      case when v_deleted then now() end, nullif(d ->> 'language', ''),
                      -- F16-REQ-028
                      coalesce(nullif(d ->> 'occurred_precision', ''), 'day'),
                      coalesce(nullif(d ->> 'base_direction', ''), 'ltr'),
                      case when jsonb_typeof(d -> 'author_edits') = 'null' then null else d -> 'author_edits' end,
                      case when jsonb_typeof(d -> 'locked_spans') = 'null' then null else d -> 'locked_spans' end,
                      nullif(d ->> 'pack_ref', ''),
                      -- M17 (ADR 0025 section 11): the review mark travels with the words.
                      (d ->> 'words_reviewed_at')::timestamptz)
              on conflict (id) do update set
                final_text = case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                machine_edits = case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                edit_level = case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                in_book = case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                sounds_like_me = case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                occurred_on = case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                language = case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                -- F16-REQ-028: each new field only with its group and only when the op carries it.
                occurred_precision = case when 'occurred_on' = any(v_changed) and d ? 'occurred_precision'
                                          then excluded.occurred_precision else e.occurred_precision end,
                base_direction = case when ('text' = any(v_changed) or 'language' = any(v_changed)) and d ? 'base_direction'
                                      then excluded.base_direction else e.base_direction end,
                author_edits = case when 'text' = any(v_changed) and d ? 'author_edits' then excluded.author_edits else e.author_edits end,
                locked_spans = case when 'text' = any(v_changed) and d ? 'locked_spans' then excluded.locked_spans else e.locked_spans end,
                -- M17: with the text group (so never with refused words), and only when the op carries it.
                words_reviewed_at = case when 'text' = any(v_changed) and d ? 'words_reviewed_at'
                                         then excluded.words_reviewed_at else e.words_reviewed_at end,
                -- Never changed: passed through so entries_guard refuses a different value (SCIMM).
                raw_transcript = excluded.raw_transcript,
                captured_at = excluded.captured_at,
                child_id = excluded.child_id,
                engine_version = excluded.engine_version,
                pack_ref = case when d ? 'pack_ref' then excluded.pack_ref else e.pack_ref end
              where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on,
                     e.raw_transcript, e.captured_at, e.child_id, e.engine_version, e.language,
                     e.occurred_precision, e.base_direction, e.author_edits, e.locked_spans, e.pack_ref,
                     e.words_reviewed_at)
                    is distinct from
                    (case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                     case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                     case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                     case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                     case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                     case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                     excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version,
                     case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                     case when 'occurred_on' = any(v_changed) and d ? 'occurred_precision'
                          then excluded.occurred_precision else e.occurred_precision end,
                     case when ('text' = any(v_changed) or 'language' = any(v_changed)) and d ? 'base_direction'
                          then excluded.base_direction else e.base_direction end,
                     case when 'text' = any(v_changed) and d ? 'author_edits' then excluded.author_edits else e.author_edits end,
                     case when 'text' = any(v_changed) and d ? 'locked_spans' then excluded.locked_spans else e.locked_spans end,
                     case when d ? 'pack_ref' then excluded.pack_ref else e.pack_ref end,
                     case when 'text' = any(v_changed) and d ? 'words_reviewed_at'
                          then excluded.words_reviewed_at else e.words_reviewed_at end);
            end if;
            if v_type = 'entry.reupload' then
              if v_exists and cur.deleted_at is null and v_deleted then
                perform public.delete_entry(v_id);
              end if;
              update entries set sync_restored_from = v_known
               where id = v_id and sync_restored_from is distinct from v_known;
              perform set_config('scribe.sync_reupload', 'off', true);
            end if;
          end if;
          v_res := jsonb_build_object('applied', v_apply, 'conflict', v_conflict, 'entry',
            (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                       'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
               from entries e where e.id = v_id));
          if v_refused then
            v_res := v_res || jsonb_build_object('conflict_groups', jsonb_build_array('text'));
          end if;
          if v_newer then
            v_res := v_res || jsonb_build_object('current',
              (select jsonb_build_object('final_text', e.final_text, 'machine_edits', e.machine_edits,
                                         'edit_level', e.edit_level, 'v', coalesce(e.text_xid, e.sync_xid)::text)
                 from entries e where e.id = v_id));
          end if;
          -- The receipt notes what this op did (a re-upload the server did not take wrote nothing).
          if v_apply then
            perform sync_private.note_applied(v_op, v_id, v_refused, v_newer);
          end if;

        when 'entry.delete' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.delete_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'entry.restore' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.restore_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'book.first_run' then
          v_ids := public.create_first_run_children(d -> 'children');
          v_res := jsonb_build_object('books', to_jsonb(v_ids));

        when 'book.create' then
          perform public.create_child(v_id, d ->> 'name', (d ->> 'date_of_birth')::date, (d ->> 'due_date')::date);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'book.update' then
          -- G-08: through book_update(), because the caller cannot read the birth date
          -- and due date columns that the merge compares.
          perform public.book_update(v_id, d);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'prefs.upsert' then
          if exists (select 1 from jsonb_object_keys(d) x where x not in ('signs_as', 'include_in_reminders', 'notify_letters')) then
            raise exception 'unknown preference' using errcode = '22023';
          end if;
          insert into child_member_prefs as p (child_id, profile_id, signs_as, include_in_reminders, notify_letters)
          values (v_id, v_uid, nullif(btrim(d ->> 'signs_as'), ''), coalesce((d ->> 'include_in_reminders')::boolean, true),
                  coalesce((d ->> 'notify_letters')::boolean, true))
          on conflict (child_id, profile_id) do update set
            signs_as = case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
            include_in_reminders = case when d ? 'include_in_reminders' then excluded.include_in_reminders
                                        else p.include_in_reminders end,
            notify_letters = case when d ? 'notify_letters' then excluded.notify_letters else p.notify_letters end
          where (p.signs_as, p.include_in_reminders, p.notify_letters) is distinct from
                (case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
                 case when d ? 'include_in_reminders' then excluded.include_in_reminders else p.include_in_reminders end,
                 case when d ? 'notify_letters' then excluded.notify_letters else p.notify_letters end);
          v_res := jsonb_build_object('prefs', jsonb_build_object('child_id', v_id));

        when 'entry.erase' then
          v_res := sync_private.erase_entry(v_id);

        when 'held.upsert' then
          v_res := sync_private.held_upsert(v_op, v_id, o);

        when 'held.discard' then
          v_res := sync_private.held_discard(v_id, nullif(o ->> 'base', '')::xid8);

        else
          raise exception 'unknown op type' using errcode = '22023';
        end case;
      end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object('op', v_op, 'ok', true) || v_res);
    exception when others then
      get stacked diagnostics v_code = returned_sqlstate, v_detail = pg_exception_detail;
      if v_code = 'SCCON' then
        -- Ops before this one are kept; this one and the rest wait for consent.
        return jsonb_build_object('results', v_results, 'paused', true, 'stopped', false, 'consent', v_detail);
      end if;
      -- G-11: a rate limit inside an op (create_child, the first-run batch,
      -- delete_entry, restore_entry) stops the batch like a transient error, so the
      -- phone backs off and retries that op later; it is never a permanent rejection.
      if v_code = 'SCRAT' or left(v_code, 2) in ('40', '53', '55', '57', '58', 'XX') then
        return jsonb_build_object('results', v_results, 'paused', false, 'stopped', true, 'code', v_code);
      end if;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('op', left(o ->> 'op', 36), 'ok', false, 'code', v_code)
        || case when v_code = 'SCDEL' and v_detail = 'purged' then jsonb_build_object('gone', true) else '{}'::jsonb end);
    end;
  end loop;

  -- Old receipts are trimmed by sync_housekeeping() (hourly), not here: clients no longer delete receipts.
  return jsonb_build_object('results', v_results, 'paused', false, 'stopped', false);
end;
$$;

comment on function public.sync_push(jsonb) is
  'Outbox push (20261004100000). Protocol v1 (20261016000000, ADR 0025): words compare and set on text_xid under a row lock (conflict_groups, current), the receipt outcome (applied_v, or the conflict again on a duplicate), entry.erase, held.upsert and held.discard. Runs as the caller.';

-- ─── 10. sync_pull: the erasure digest check and the held section ───────
-- From 20261015030000. Changes:
--   WP-F16-13: an erasure in a book after the cursor recomputes that book's
--     removal digest (the stand-in's one-line v_check addition).
--   WP-F16-17: a request that carries `held` ({cursor}) gets the author's held rows
--     and markers in a `held` section, from the same snapshot and with the same
--     cursor rules as the books (own rows while a parent of the book; markers only
--     for a phone that pulled before; at most p_limit rows, `more`, cursor_ahead
--     answers reset). A request without it (an older app, or any pull that does not
--     ask) gets exactly what it got before, so the other parent's pull and digest
--     never change.
--   M17: own rows carry words_reviewed_at.
create or replace function public.sync_pull(p_since jsonb default '{}'::jsonb, p_limit int default 200)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  v_snap pg_snapshot := pg_current_snapshot();
  v_xmin xid8 := pg_snapshot_xmin(v_snap);
  v_xmax xid8 := pg_snapshot_xmax(v_snap);
  c_zero constant uuid := '00000000-0000-0000-0000-000000000000';
  c_mod constant numeric := 281474976710656;   -- 2^48
  v_since jsonb := coalesce(p_since, '{}'::jsonb);
  v_reqs jsonb;
  v_req jsonb;
  v_epoch int;
  v_epoch_at timestamptz;
  v_budget int;
  v_live uuid[] := '{}';
  b record;
  k text;
  v_cur text;
  v_after_x xid8;
  v_after_i uuid;
  v_fresh boolean;
  v_repull boolean;
  v_access text;
  v_meta jsonb;
  v_hash text;
  v_rows jsonb;
  v_n int;
  v_last_x xid8;
  v_last_i uuid;
  v_more boolean;
  v_any_more boolean := false;
  v_cursor text;
  v_check boolean;
  v_digest jsonb;
  v_book jsonb;
  v_books jsonb := '[]'::jsonb;
  v_gone jsonb := '[]'::jsonb;
  -- WP-F16-17: the held section (only for a request that carries `held`).
  v_held jsonb;
  v_hcur text;
  v_hafter_x xid8 := '0';
  v_hafter_i uuid := c_zero;
  v_hrows jsonb;
  v_hn int;
  v_hlast_x xid8;
  v_hlast_i uuid;
  v_hmore boolean;
begin
  if p_limit is null or p_limit not between 1 and 500 then
    raise exception 'limit must be 1 to 500' using errcode = '22023';
  end if;
  if jsonb_typeof(v_since) <> 'object' then
    raise exception 'since must be an object' using errcode = '22023';
  end if;
  v_reqs := coalesce(v_since -> 'books', '{}'::jsonb);
  if jsonb_typeof(v_reqs) <> 'object' or (select count(*) from jsonb_object_keys(v_reqs)) > 100 then
    raise exception 'books must be an object with at most 100 books' using errcode = '22023';
  end if;

  perform public.rate_hit('pull');                -- 120 per minute per person (SCRAT)

  select e.epoch, e.started_at into v_epoch, v_epoch_at from sync_epochs e order by e.epoch desc limit 1;
  if jsonb_typeof(v_since -> 'epoch') is not null and jsonb_typeof(v_since -> 'epoch') <> 'null'
     and (v_since ->> 'epoch') is distinct from v_epoch::text then
    return jsonb_build_object('reset', true, 'reason', 'epoch', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
  end if;

  -- Validate every request; a cursor ahead of the server means the database went back in time.
  for k, v_req in select key, value from jsonb_each(v_reqs) loop
    begin
      perform k::uuid;
      if jsonb_typeof(v_req) <> 'object' then raise exception 'bad request'; end if;
      v_cur := nullif(v_req ->> 'cursor', '');
      if v_cur is not null then
        if array_length(string_to_array(v_cur, ':'), 1) <> 2 then raise exception 'bad cursor'; end if;
        v_after_x := split_part(v_cur, ':', 1)::xid8;
        v_after_i := split_part(v_cur, ':', 2)::uuid;
      end if;
    exception when others then
      raise exception 'bad book request' using errcode = '22023';
    end;
    if v_cur is not null and v_after_x > v_xmax then
      return jsonb_build_object('reset', true, 'reason', 'cursor_ahead', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
    end if;
  end loop;

  -- WP-F16-17: the author's held drafts, one cursor for all books (ADR 0025 section 9). Same cursor rules.
  if v_since ? 'held' then
    v_held := v_since -> 'held';
    begin
      if jsonb_typeof(v_held) not in ('object', 'null') then raise exception 'bad request'; end if;
      v_hcur := nullif(v_held ->> 'cursor', '');
      if v_hcur is not null then
        if array_length(string_to_array(v_hcur, ':'), 1) <> 2 then raise exception 'bad cursor'; end if;
        v_hafter_x := split_part(v_hcur, ':', 1)::xid8;
        v_hafter_i := split_part(v_hcur, ':', 2)::uuid;
      end if;
    exception when others then
      raise exception 'bad held request' using errcode = '22023';
    end;
    if v_hafter_x > v_xmax then
      return jsonb_build_object('reset', true, 'reason', 'cursor_ahead', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
    end if;
  end if;

  v_budget := p_limit;
  for b in
    select c.id, m.role, c.family_can_read
      from child_members m
      join children c on c.id = m.child_id and c.deleted_at is null
     where m.profile_id = v_uid
     order by m.joined_at, c.id
  loop
    v_live := v_live || b.id;
    v_req := v_reqs -> (b.id::text);
    v_access := case when b.role = 'parent' then 'parent'
                     else 'contributor:' || case when b.family_can_read then 'reads' else 'own' end end;
    v_repull := coalesce(v_req ? 'access' and (v_req ->> 'access') is distinct from v_access, false);
    v_cur := case when v_repull then null else nullif(v_req ->> 'cursor', '') end;
    v_fresh := v_cur is null;
    v_after_x := case when v_fresh then '0'::xid8 else split_part(v_cur, ':', 1)::xid8 end;
    v_after_i := case when v_fresh then c_zero else split_part(v_cur, ':', 2)::uuid end;

    -- Book settings and members. D-039: family members get the birthday's month and day only.
    select jsonb_build_object(
             'role', b.role,
             'name', c.name,
             'nickname', c.nickname,
             'date_of_birth', case when b.role = 'parent' then c.date_of_birth end,
             'birthday_md', to_char(c.date_of_birth, 'MM-DD'),
             'due_date', case when b.role = 'parent' then c.due_date end,
             'family_can_read', c.family_can_read,
             'created_by_me', c.created_by is not distinct from v_uid,
             'my_signs_as', coalesce(mp.signs_as,
                                     (select i.signs_as from child_invites i
                                       where i.child_id = c.id and i.accepted_by = v_uid
                                       order by i.accepted_at desc limit 1)),
             'include_in_reminders', coalesce(mp.include_in_reminders, true),
             'members', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'profile_id', mm.profile_id,
                        'role', mm.role,
                        'is_me', mm.profile_id = v_uid,
                        'joined_at', mm.joined_at,
                        'signs_as', coalesce(pp.signs_as,
                                             (select i.signs_as from child_invites i
                                               where i.child_id = c.id and i.accepted_by = mm.profile_id
                                               order by i.accepted_at desc limit 1),
                                             pr.signs_as))
                        order by mm.joined_at, mm.profile_id)
                 from child_members mm
                 left join child_member_prefs pp on pp.child_id = mm.child_id and pp.profile_id = mm.profile_id
                 left join profiles pr on pr.id = mm.profile_id
                where mm.child_id = c.id), '[]'::jsonb))
      into v_meta
      from children c
      left join child_member_prefs mp on mp.child_id = c.id and mp.profile_id = v_uid
     where c.id = b.id;
    v_hash := md5(v_meta::text);

    v_rows := '[]'::jsonb;
    v_n := 0;
    if v_budget = 0 then
      v_more := true;
      v_cursor := v_cur;
    else
      -- Own letters whole (any state); others' through book_entries (B F9 and the K-09 column allowlist).
      select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
             (array_agg(x.sx order by x.sx desc, x.id desc))[1],
             (array_agg(x.id order by x.sx desc, x.id desc))[1]
        into v_rows, v_n, v_last_x, v_last_i
        from (
          select p.sync_xid as sx, p.id,
                 case when p.author_id = v_uid then
                   jsonb_build_object(
                     'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id,
                     'author_signs_as', p.author_signs_as, 'kind', p.kind, 'occurred_on', p.occurred_on,
                     'captured_at', p.captured_at, 'capture_mode', p.capture_mode, 'edit_level', p.edit_level,
                     'prompt_key', p.prompt_key, 'prompt_library_version', p.prompt_library_version,
                     'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                     'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                     'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                     'audio_kept_on_device', p.audio_kept_on_device, 'language', p.language, 'created_at', p.created_at,
                     'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true)
                   -- F16-REQ-028: the v1.0 columns (a second object: jsonb_build_object takes at most 100 arguments).
                   || jsonb_build_object(
                     'occurred_precision', p.occurred_precision, 'base_direction', p.base_direction,
                     'author_edits', p.author_edits, 'locked_spans', p.locked_spans, 'pack_ref', p.pack_ref,
                     'words_reviewed_at', p.words_reviewed_at)
                 else
                   (select to_jsonb(be) - 'search' from book_entries be where be.id = p.id) || jsonb_build_object('own', false)
                 end || jsonb_build_object('v', p.sync_xid::text) as j
            from (
              select e.* from entries e
               where e.child_id = b.id
                 and (e.sync_xid, e.id) > (v_after_x, v_after_i)
                 and e.sync_xid < v_xmin
                 and (e.author_id = v_uid or exists (select 1 from book_entries be where be.id = e.id))
               order by e.sync_xid, e.id
               limit v_budget
            ) p
        ) x;
      v_more := v_n = v_budget;
      v_budget := v_budget - v_n;
      v_cursor := case when v_more then v_last_x::text || ':' || v_last_i::text
                       else v_xmin::text || ':' || c_zero::text end;
    end if;
    v_any_more := v_any_more or v_more;

    v_book := jsonb_build_object('id', b.id, 'access', v_access, 'repull', v_repull, 'meta_hash', v_hash,
                                 'rows', v_rows, 'cursor', v_cursor, 'more', v_more);
    if (v_req ->> 'meta') is distinct from v_hash then
      v_book := v_book || jsonb_build_object('meta', v_meta);
    end if;

    if not v_more then
      -- G-09: the real digest only when something the caller may know about changed:
      -- a row it may read now changed (v_n > 0 on this last page), or a row by
      -- someone else left what this caller's role could read (stamped by
      -- entries_unshared). A letter that was always private never counts.
      v_check := v_fresh or v_n > 0 or not (coalesce(v_req, '{}'::jsonb) ? 'have')
                 or coalesce((v_req ->> 'verify')::boolean, false) or coalesce((v_req ->> 'ids')::boolean, false)
                 or exists (select 1 from sync_private.entry_erasures x
                             where x.child_id = b.id and x.sync_xid > v_after_x and x.sync_xid < v_xmin)
                 or exists (select 1 from entries e
                             where e.child_id = b.id and (e.sync_xid, e.id) > (v_after_x, v_after_i) and e.sync_xid < v_xmin
                               and e.author_id <> v_uid
                               and case when b.role = 'parent'
                                          then e.left_parents_xid > v_after_x and e.left_parents_xid < v_xmin
                                        else b.family_can_read
                                          and e.left_family_xid > v_after_x and e.left_family_xid < v_xmin end);
      if v_check then
        select jsonb_build_object('n', count(*),
                                  'sum', (coalesce(sum(('x' || right(replace(s.id::text, '-', ''), 12))::bit(48)::bigint), 0) % c_mod)::bigint)
          into v_digest
          from (select e.id from entries e where e.child_id = b.id and e.author_id = v_uid
                union all
                select be.id from book_entries be where be.child_id = b.id and be.author_id <> v_uid) s;
      else
        v_digest := v_req -> 'have';
      end if;
      v_book := v_book || jsonb_build_object('visible', v_digest);
      if coalesce((v_req ->> 'ids')::boolean, false) then
        v_book := v_book || jsonb_build_object('ids', coalesce((
          select jsonb_agg(s.id order by s.id)
            from (select e.id from entries e where e.child_id = b.id and e.author_id = v_uid
                  union all
                  select be.id from book_entries be where be.child_id = b.id and be.author_id <> v_uid) s), '[]'::jsonb));
      end if;
    end if;
    v_books := v_books || jsonb_build_array(v_book);
  end loop;

  -- Books the phone asked about that the caller no longer reads: left, removed, or
  -- deleted. Only the caller's own letters still come down (for example the
  -- tombstones of "delete my letters and leave").
  for k, v_req in select key, value from jsonb_each(v_reqs) where key::uuid <> all(v_live) order by key loop
    v_cur := nullif(v_req ->> 'cursor', '');
    v_after_x := case when v_cur is null then '0'::xid8 else split_part(v_cur, ':', 1)::xid8 end;
    v_after_i := case when v_cur is null then c_zero else split_part(v_cur, ':', 2)::uuid end;
    v_rows := '[]'::jsonb;
    v_n := 0;
    if v_budget = 0 then
      v_more := true;
      v_cursor := v_cur;
    else
      select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
             (array_agg(x.sx order by x.sx desc, x.id desc))[1],
             (array_agg(x.id order by x.sx desc, x.id desc))[1]
        into v_rows, v_n, v_last_x, v_last_i
        from (
          select p.sync_xid as sx, p.id,
                 jsonb_build_object(
                   'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id,
                   'author_signs_as', p.author_signs_as, 'kind', p.kind, 'occurred_on', p.occurred_on,
                   'captured_at', p.captured_at, 'capture_mode', p.capture_mode, 'edit_level', p.edit_level,
                   'prompt_key', p.prompt_key, 'prompt_library_version', p.prompt_library_version,
                   'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                   'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                   'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                   'audio_kept_on_device', p.audio_kept_on_device, 'language', p.language, 'created_at', p.created_at,
                   'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true,
                   'v', p.sync_xid::text)
                 || jsonb_build_object(
                   'occurred_precision', p.occurred_precision, 'base_direction', p.base_direction,
                   'author_edits', p.author_edits, 'locked_spans', p.locked_spans, 'pack_ref', p.pack_ref,
                   'words_reviewed_at', p.words_reviewed_at) as j
            from (
              select e.* from entries e
               where e.child_id = k::uuid and e.author_id = v_uid
                 and (e.sync_xid, e.id) > (v_after_x, v_after_i)
                 and e.sync_xid < v_xmin
               order by e.sync_xid, e.id
               limit v_budget
            ) p
        ) x;
      v_more := v_n = v_budget;
      v_budget := v_budget - v_n;
      v_cursor := case when v_more then v_last_x::text || ':' || v_last_i::text
                       else v_xmin::text || ':' || c_zero::text end;
    end if;
    v_any_more := v_any_more or v_more;
    v_gone := v_gone || jsonb_build_array(jsonb_build_object(
      'id', k,
      'reason', case when exists (select 1 from child_members m join children c on c.id = m.child_id
                                   where m.child_id = k::uuid and m.profile_id = v_uid and c.deleted_at is not null)
                     then 'deleted' else 'not_member' end,
      'rows', v_rows, 'cursor', v_cursor, 'more', v_more));
  end loop;

  if v_since ? 'held' then
    -- Own rows while a parent of the book; markers ('discarded', 'kept', 'erased') only for a phone that
    -- pulled before (a fresh pull has nothing to drop). Ids, versions and the author's own words only.
    select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
           (array_agg(x.sx order by x.sx desc, x.id desc))[1], (array_agg(x.id order by x.sx desc, x.id desc))[1]
      into v_hrows, v_hn, v_hlast_x, v_hlast_i
      from (
        select * from (
          select h.sync_xid as sx, h.id,
                 (to_jsonb(h) - 'author_id' - 'sync_xid' - 'text_xid') || jsonb_build_object('v', h.sync_xid::text) as j
            from held_drafts h
           where h.author_id = v_uid
             and exists (select 1 from child_members m where m.child_id = h.child_id and m.profile_id = v_uid and m.role = 'parent')
          union all
          select g.sync_xid, g.id, jsonb_build_object('id', g.id, 'gone', g.gone, 'updated_at', g.updated_at, 'v', g.sync_xid::text)
            from held_drafts_gone g
           where g.author_id = v_uid and v_hcur is not null
        ) a
         where (a.sx, a.id) > (v_hafter_x, v_hafter_i) and a.sx < v_xmin
         order by a.sx, a.id
         limit p_limit
      ) x;
    v_hmore := v_hn = p_limit;
    v_any_more := v_any_more or v_hmore;
    return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                              'books', v_books, 'gone', v_gone, 'more', v_any_more,
                              'held', jsonb_build_object('rows', v_hrows, 'more', v_hmore,
                                                         'cursor', case when v_hmore then v_hlast_x::text || ':' || v_hlast_i::text
                                                                        else v_xmin::text || ':' || c_zero::text end));
  end if;
  return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                            'books', v_books, 'gone', v_gone, 'more', v_any_more);
end;
$$;

comment on function public.sync_pull(jsonb, int) is
  'Multi-book cursor pull (20261004100000). Digest rule (20261015000000, G-09): the real digest of what the caller may hold is computed on a first pull, on request (verify, ids, no have), when a readable row changed since the cursor, when a row by someone else left what the caller''s role could read since the cursor, or when a letter of the book was erased since the cursor (20261016000000); otherwise the phone''s own value is echoed. Writes the caller cannot read never change the digest or the rows. Residual (REVIEW_R17_CHECKLIST 10): cursors and row versions are database transaction ids, so their spacing reflects all write traffic in the database, the other parent''s private letters included; per-book versions are a sync ADR decision. Own rows carry the v1.0 wire-contract columns (20261015030000) and the review mark; a request with `held` gets the author''s held drafts (20261016000000).';

-- ─── 11. Restore replay and incident scope (RB-8; LEGAL-REQ-030, -039) ───
-- From 20261004200000. ops_replay_ledger: the new ledger kinds 'held_draft' and,
-- once #151 is applied, 'audio_blob' (F16 6.2 A 2a: RB-8 replays each kind).
-- Request to the scripts/ops owner: parseLedger (scripts/ops/lib/drill.ts) still
-- skips every kind but entry, child and profile.
create or replace function public.ops_replay_ledger(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_entries uuid[];
  v_children uuid[];
  v_profiles uuid[];
  v_held uuid[];
  v_blobs uuid[];
  v_h int := 0;
  v_hx int := 0;
  v_b int := 0;
  v_e int := 0;
  v_c int := 0;
  v_left jsonb;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows must be an array' using errcode = '22023';
  end if;
  select coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'entry'), '{}'),
         coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'child'), '{}'),
         coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'profile'), '{}'),
         coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'held_draft'), '{}'),
         coalesce(array_agg((r ->> 'id')::uuid) filter (where r ->> 't' = 'audio_blob'), '{}')
    into v_entries, v_children, v_profiles, v_held, v_blobs
    from jsonb_array_elements(p_rows) r;
  -- Books first (their letters cascade), tombstoned so the last-parent guard allows the cascade.
  update children set deleted_at = coalesce(deleted_at, now()) where id = any (v_children);
  delete from children where id = any (v_children);
  get diagnostics v_c = row_count;
  delete from entries where id = any (v_entries);
  get diagnostics v_e = row_count;
  -- 20261016000000: held drafts. An id ledgered as a letter too was erased (Erase now on a waiting
  -- letter): its marker says so, and every phone of the author erases its copy again.
  perform set_config('scribe.held_erase', 'on', true);
  delete from held_drafts where id = any (v_held) and id = any (v_entries);
  get diagnostics v_hx = row_count;
  perform set_config('scribe.held_erase', 'off', true);
  delete from held_drafts where id = any (v_held);
  get diagnostics v_h = row_count;
  v_h := v_h + v_hx;
  -- Recording backups (#151's audio_blobs, when that file is applied): their own trigger queues the object.
  if to_regclass('public.audio_blobs') is not null and cardinality(v_blobs) > 0 then
    execute 'delete from public.audio_blobs where entry_id = any ($1)' using v_blobs;
    get diagnostics v_b = row_count;
  end if;
  insert into purge_ledger (entity_type, entity_id)
    select r ->> 't', r ->> 'id' from jsonb_array_elements(p_rows) r
     where r ->> 't' in ('entry', 'child', 'profile', 'held_draft')
        or (r ->> 't' = 'audio_blob' and to_regclass('public.audio_blobs') is not null)
    on conflict do nothing;
  select coalesce(jsonb_agg(p.id), '[]'::jsonb) into v_left from profiles p where p.id = any (v_profiles);
  perform public.audit('restore_replayed', 'system', null, null,
    jsonb_build_object('entries', v_e, 'books', v_c, 'held_drafts', v_h, 'audio_blobs', v_b, 'profiles_left', jsonb_array_length(v_left)));
  return jsonb_build_object('entries', v_e, 'books', v_c, 'held_drafts', v_h, 'audio_blobs', v_b, 'profiles_to_delete', v_left);
end;
$$;

create or replace function public.ops_incident_scope(p_scope jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_from timestamptz := coalesce((p_scope ->> 'from')::timestamptz, '-infinity'::timestamptz);
  v_until timestamptz := coalesce((p_scope ->> 'until')::timestamptz, 'infinity'::timestamptz);
  v_all boolean := coalesce((p_scope ->> 'all')::boolean, false);
  v_tables text[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'tables')), '{}');
  v_buckets text[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'buckets')), '{}');
  v_profiles uuid[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'profile_ids')::uuid), '{}');
  v_children uuid[] := coalesce(array(select jsonb_array_elements_text(p_scope -> 'child_ids')::uuid), '{}');
  v_has_created boolean;
  v_out jsonb;
begin
  if p_scope is null or jsonb_typeof(p_scope) <> 'object' then
    raise exception 'scope must be an object' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(v_tables) t where t not in ('entries', 'entry_versions', 'children', 'profiles',
      'child_members', 'dictionary_terms', 'policy_acceptances', 'audit_events', 'auth.users',
      'held_drafts', 'audio_blobs', 'child_keys')) then
    raise exception 'unknown table in scope' using errcode = '22023';
  end if;
  if v_all then
    v_tables := array['entries', 'children', 'profiles', 'child_members', 'dictionary_terms', 'policy_acceptances', 'audit_events', 'auth.users',
                      'held_drafts', 'audio_blobs', 'child_keys'];
    v_buckets := array['entry-photos', 'entry-audio', 'inbox', 'child-photos', 'avatars', 'exports'];
  end if;

  create temp table if not exists incident_hits (profile_id uuid not null, category text not null, letters int not null default 0,
    photos int not null default 0, child_id uuid) on commit drop;
  truncate pg_temp.incident_hits;

  -- Named people and books.
  insert into pg_temp.incident_hits (profile_id, category)
    select p.id, c.cat from profiles p cross join unnest(array['profile', 'email', 'membership', 'consent_records']) c(cat)
     where p.id = any (v_profiles);
  insert into pg_temp.incident_hits (profile_id, category, letters)
    select e.author_id, 'letter_text', count(*) from entries e where e.author_id = any (v_profiles) group by e.author_id;
  insert into pg_temp.incident_hits (profile_id, category, child_id)
    select m.profile_id, 'child_identity', m.child_id from child_members m where m.child_id = any (v_children);
  insert into pg_temp.incident_hits (profile_id, category, letters, child_id)
    select e.author_id, 'letter_text', count(*), e.child_id from entries e where e.child_id = any (v_children) group by e.author_id, e.child_id;
  -- 20261016000000: held and waiting letters are letters (their words and transcripts).
  insert into pg_temp.incident_hits (profile_id, category, letters, child_id)
    select h.author_id, 'letter_text', count(*), h.child_id from held_drafts h
     where h.author_id = any (v_profiles) or h.child_id = any (v_children) group by h.author_id, h.child_id;

  -- Tables (with the window when given).
  if 'entries' = any (v_tables) or 'entry_versions' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, letters, child_id)
      select e.author_id, 'letter_text', count(*), e.child_id from entries e
       where e.created_at < v_until
       group by e.author_id, e.child_id;
  end if;
  if 'held_drafts' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, letters, child_id)
      select h.author_id, 'letter_text', count(*), h.child_id from held_drafts h
       where h.created_at < v_until
       group by h.author_id, h.child_id;
  end if;
  -- Recording backups and book keys (#151), when that file is applied: encrypted recordings, and the
  -- escrow wraps of the keys that open them. Listed per author and book; never content.
  if 'audio_blobs' = any (v_tables) and to_regclass('public.audio_blobs') is not null then
    execute $q$insert into pg_temp.incident_hits (profile_id, category, child_id)
      select distinct b.author_id, 'recordings', b.child_id from public.audio_blobs b where b.created_at < $1$q$ using v_until;
  end if;
  if 'child_keys' = any (v_tables) and to_regclass('public.child_keys') is not null then
    execute $q$insert into pg_temp.incident_hits (profile_id, category, child_id)
      select distinct k.profile_id, 'backup_keys', k.child_id from public.child_keys k where k.created_at < $1$q$ using v_until;
  end if;
  if 'children' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, child_id)
      select m.profile_id, 'child_identity', c.id from children c join child_members m on m.child_id = c.id
       where c.created_at < v_until;
  end if;
  if 'profiles' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select p.id, 'profile' from profiles p where p.created_at < v_until;
  end if;
  if 'child_members' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category, child_id)
      select m.profile_id, 'membership', m.child_id from child_members m where m.joined_at < v_until;
  end if;
  if 'dictionary_terms' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select distinct d.owner_id, 'dictionary' from dictionary_terms d where d.created_at < v_until;
  end if;
  if 'policy_acceptances' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select distinct a.profile_id, 'consent_records' from policy_acceptances a
       where a.profile_id is not null and a.accepted_at < v_until;
  end if;
  if 'audit_events' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category)
      select distinct a.actor_id, 'activity_log' from audit_events a
       where a.actor_id is not null and a.at < v_until;
  end if;
  if 'auth.users' = any (v_tables) then
    insert into pg_temp.incident_hits (profile_id, category) select p.id, 'email' from profiles p;
  end if;

  -- Storage: {child}/{author}/... objects, by creation time when the column exists.
  if array_length(v_buckets, 1) > 0 then
    select exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'objects' and column_name = 'created_at')
      into v_has_created;
    execute format($q$
      insert into pg_temp.incident_hits (profile_id, category, photos, child_id)
      select x.author, 'photos', count(*), x.child from (
        select (split_part(o.name, '/', 1))::uuid child, (split_part(o.name, '/', 2))::uuid author
          from storage.objects o
         where o.bucket_id = any ($1)
           and split_part(o.name, '/', 1) ~ '^[0-9a-f-]{36}$' and split_part(o.name, '/', 2) ~ '^[0-9a-f-]{36}$'
           %s) x
       where exists (select 1 from profiles p where p.id = x.author)
       group by x.author, x.child$q$,
      case when v_has_created then 'and o.created_at < $3' else '' end)
      using v_buckets, v_from, v_until;
  end if;

  -- Book members of every book whose letters or photos are in scope.
  insert into pg_temp.incident_hits (profile_id, category, child_id)
    select distinct m.profile_id, 'book_content', h.child_id from pg_temp.incident_hits h
      join child_members m on m.child_id = h.child_id
     where h.category in ('letter_text', 'photos', 'recordings') and h.child_id is not null;

  select jsonb_build_object(
      'profiles', coalesce(jsonb_agg(x order by x.profile_id), '[]'::jsonb),
      'totals', jsonb_build_object('profiles', count(*), 'letters', coalesce(sum(x.letters), 0), 'photos', coalesce(sum(x.photos), 0)),
      'audio_on_server', exists (select 1 from storage.objects where bucket_id in ('entry-audio', 'inbox')),
      'escrow_present', to_regclass('public.child_keys') is not null)
    into v_out
    from (select h.profile_id, array_agg(distinct h.category order by h.category) categories,
                 (select coalesce(sum(letters), 0) from pg_temp.incident_hits i where i.profile_id = h.profile_id and i.category = 'letter_text')::int letters,
                 (select coalesce(sum(photos), 0) from pg_temp.incident_hits i where i.profile_id = h.profile_id and i.category = 'photos')::int photos,
                 count(distinct h.child_id)::int books,
                 (select array_agg(distinct m.role order by m.role) from child_members m where m.profile_id = h.profile_id) roles
            from pg_temp.incident_hits h join profiles p on p.id = h.profile_id
           group by h.profile_id) x;
  return v_out;
end;
$$;

-- ─── 12. The recording backup sees held drafts (#151, S05's request 3) ───
-- backup_begin and the orphan sweep ask backup_entry_exists whether a recording id
-- still has its letter; a waiting letter's recording belongs to its held row. Only
-- when #151 is applied before this file: if it lands later, #151 carries the held
-- branch itself (request on the PR), because its file redefines the function.
do $$
begin
  if to_regprocedure('public.backup_entry_exists(uuid, uuid, uuid)') is not null then
    execute $f$
      create or replace function public.backup_entry_exists(p_entry uuid, p_author uuid, p_child uuid)
      returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $b$
        select exists (select 1 from entries e where e.id = p_entry and e.author_id = p_author and e.child_id = p_child)
            or exists (select 1 from held_drafts h where h.id = p_entry and h.author_id = p_author and h.child_id = p_child);
      $b$
    $f$;
  end if;
end;
$$;

-- ─── 13. Privileges ─────────────────────────────────────────────────────
-- Trigger functions: never called directly.
revoke execute on function public.entries_set_sync_xid(), public.entries_not_purged(), public.entries_note_erasure(),
  public.entries_drop_held(), public.child_members_drop_held(), public.held_drafts_not_erased(), public.held_drafts_stamp(),
  public.held_drafts_note_gone()
  from public, anon, authenticated;
-- sync_private: nothing for anon; signed-in people only what sync_push and sync_pull
-- call as the caller. erasure_recorded is for the definer triggers only.
revoke execute on all functions in schema sync_private from public, anon, authenticated;
grant execute on function sync_private.note_applied(uuid, uuid, boolean, boolean), sync_private.dup_outcome(uuid, uuid),
  sync_private.held_id_taken(uuid), sync_private.held_on_hold(uuid), sync_private.held_state(uuid, boolean),
  sync_private.note_held(uuid, uuid, boolean), sync_private.held_upsert(uuid, uuid, jsonb), sync_private.held_dup(uuid, uuid),
  sync_private.held_discard(uuid, xid8), sync_private.erase_held(uuid), sync_private.erase_entry(uuid)
  to authenticated;
-- Service-only, as before (create or replace keeps grants; restated for the reader).
revoke execute on function public.ops_replay_ledger(jsonb), public.ops_incident_scope(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.ops_replay_ledger(jsonb), public.ops_incident_scope(jsonb) to service_role';
  end if;
end;
$$;

-- ─── 14. Classification (docs/legal/DATA_CLASSIFICATION.md 4.1) ──────────
comment on column public.entries.text_xid is
  'L2 system version: the transaction that last wrote final_text, machine_edits or edit_level (ADR 0025 section 5); null before 20261016000000, read as sync_xid';
comment on column public.entries.words_reviewed_at is
  'L2 when the author kept the letter with its words on screen (M17, ADR 0025 section 11), author-only: never in book_entries';
comment on column public.sync_op_receipts.applied_v is
  'L2 system version: the version the op wrote when its own words applied (ADR 0025 section 2); null otherwise';
comment on column public.sync_op_receipts.words_conflict is 'L2 flag: the op met words newer than its base: its answer carried current';
comment on column public.sync_op_receipts.words_refused is 'L2 flag: the op''s words were not applied (conflict_groups text)';

comment on table public.held_drafts is
  'Held letters and voice-only letters waiting for their words, author-only (F16 6.2 I, 20261016000000). Never in book_entries or another member''s pull.';
comment on column public.held_drafts.id is 'L3 letter id (device-generated UUIDv7), which the letter takes when it is kept';
comment on column public.held_drafts.author_id is 'L3 the author (only they read or write the row)';
comment on column public.held_drafts.child_id is 'L3 the book';
comment on column public.held_drafts.kind is 'L2 enum: held_letter, waiting_letter or held_words';
comment on column public.held_drafts.capture_mode is 'L2 spoken or typed';
comment on column public.held_drafts.created_at is 'L2 when the draft was made on the phone';
comment on column public.held_drafts.occurred_on is 'L3 the day (or month) the letter is about';
comment on column public.held_drafts.occurred_precision is 'L2 enum: day or month';
comment on column public.held_drafts.language is 'L4 the letter''s language (names a family language), author-only';
comment on column public.held_drafts.base_direction is 'L2 layout enum (ltr or rtl), never the words';
comment on column public.held_drafts.prompt_key is 'L2 which prompt the author answered, a key, never text';
comment on column public.held_drafts.in_book_choice is 'L2 the in-book choice the author made at the Keep gate';
comment on column public.held_drafts.raw_transcript is 'L4 the words as transcribed, immutable once set (author-only)';
comment on column public.held_drafts.final_text is 'L4 the words after the faithful edits (author-only)';
comment on column public.held_drafts.machine_edits is 'L4 every machine edit, reversible (author-only)';
comment on column public.held_drafts.edit_level is 'L2 enum: how much cleaning the author chose';
comment on column public.held_drafts.author_edits is 'L4 the author''s own word changes (author-only)';
comment on column public.held_drafts.locked_spans is 'L4 spans kept exactly as said (author-only)';
comment on column public.held_drafts.typed_text is 'L4 the typed words of a typed draft, the only copy of them (author-only)';
comment on column public.held_drafts.engine_version is 'L2 version number of the cleaning engine';
comment on column public.held_drafts.pack_ref is 'L4 language pack used (lang@version), author-only because it names the language';
comment on column public.held_drafts.audio_kept_on_device is 'L2 whether the phone keeps the recording';
comment on column public.held_drafts.sync_xid is 'L2 system version (the writing transaction), the pull cursor';
comment on column public.held_drafts.text_xid is 'L2 system version (words group and typed_text) for the compare and set';
comment on column public.held_drafts.updated_at is 'L2 last server write';

comment on table public.held_drafts_gone is
  'What the author''s other phones need to drop, adopt or erase a held draft (20261016000000). Ids and times only; definer code writes it.';
comment on column public.held_drafts_gone.id is 'L3 the held draft''s letter id';
comment on column public.held_drafts_gone.author_id is 'L3 the author whose phones read the marker';
comment on column public.held_drafts_gone.child_id is 'L3 the book (the marker goes with it)';
comment on column public.held_drafts_gone.gone is 'L2 enum: discarded, kept or erased';
comment on column public.held_drafts_gone.updated_at is 'L2 when the draft left';
comment on column public.held_drafts_gone.sync_xid is 'L2 system version, the pull cursor';

comment on table sync_private.entry_erasures is
  'Letters purged while their book and author exist (20261016000000): recomputes the book digest at the next pull, and keeps an erased id from ever being stored again. Ids and times only.';
comment on column sync_private.entry_erasures.entry_id is 'L3 the erased letter''s id';
comment on column sync_private.entry_erasures.child_id is 'L3 its book';
comment on column sync_private.entry_erasures.author_id is 'L3 its author';
comment on column sync_private.entry_erasures.erased_at is 'L2 when it was purged';
comment on column sync_private.entry_erasures.sync_xid is 'L2 system version: the purging transaction, compared with pull cursors';
