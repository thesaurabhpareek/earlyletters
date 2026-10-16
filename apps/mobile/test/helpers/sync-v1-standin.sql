-- TEST STAND-IN, NOT A MIGRATION. Loaded by apps/mobile/test/helpers/sync-server.ts
-- after every real file in supabase/migrations, and only when those files do not
-- already define protocol v1 (the check: sync_push mentions conflict_groups).
--
-- It is S03's request to S02 in runnable form (docs/adr/0025-sync-protocol-v1.md,
-- "Requests"; WP-F16-14 words compare and set). S02 owns sync_push and every
-- migration; when S02's migration lands, the stand-in stops loading by itself and
-- the two-phone test runs against S02's real SQL. Delete both files then.
--
-- Two parts:
--   this file      the objects protocol v1 adds (below);
--   sync-v1-standin.ts  seven anchored edits to whatever sync_push the migrations
--                  define last (20261005000000 on develop, 20261015030000 with the
--                  R-17 gate), so the stand-in never replaces S02's newer body and
--                  never undoes its hardening. A missing anchor fails loudly.
--
-- What protocol v1 adds:
--   1. entries.text_xid: the transaction that last wrote the words group
--      (final_text, machine_edits, edit_level), stamped by trigger. The words
--      compare and set reads this, not sync_xid, so another phone's in_book or
--      date change never raises a words conflict (F16 C2 stays later-arrival-wins).
--      It never goes behind a version already handed out: xid order is not commit
--      order, so an older writer committing later stamps old sync_xid + 1 (still
--      compared with >; a false note at worst, never a pass over unseen words).
--   2. Receipts note what an entry op did: applied_v (the version it wrote) only
--      when this phone's words are the letter's words at that version; otherwise
--      words_conflict (and words_refused), and a duplicate answers conflict_groups
--      and current again. A lost answer must never turn a refusal into a silent
--      rebase on words the phone never saw.
--   3. sync_push, entry.upsert with a base on an existing row, under a row lock:
--        words changed since base by another transaction (text_xid > base):
--          - text in changed: the text group is not applied, the others are; the
--            result has conflict_groups ['text'] and current (the caller's own
--            words: RLS limits the row to its author, so nothing leaks);
--          - text not in changed: everything applies; current is returned too.
--      No base (an older app): unchanged, later arrival wins.
--   4. The receipt helpers live in sync_private, a schema the API does not expose:
--      only sync_push calls them, never a client RPC.

alter table public.entries add column if not exists text_xid xid8 not null default '0';
update public.entries set text_xid = sync_xid where text_xid = '0';

create or replace function public.entries_set_text_xid()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    new.text_xid := pg_current_xact_id();
  elsif (new.final_text, new.machine_edits, new.edit_level) is distinct from (old.final_text, old.machine_edits, old.edit_level) then
    -- The row lock orders writers, xids do not: a transaction with an older xid can commit its words
    -- after a newer one already answered a phone with v = old.sync_xid. Stamp past that version, so
    -- that phone's next base still sees these words as newer (a compare never passes over them).
    new.text_xid := case when pg_current_xact_id() > old.sync_xid then pg_current_xact_id()
                         else ((old.sync_xid::text)::numeric + 1)::text::xid8 end;
  end if;
  return new;
end;
$$;
create or replace trigger entries_text_xid before insert or update on public.entries
  for each row execute function public.entries_set_text_xid();
revoke execute on function public.entries_set_text_xid() from public, anon, authenticated;

alter table public.sync_op_receipts add column if not exists applied_v xid8;
-- The op's words were refused, or it met words newer than its base: its answer carried current.
alter table public.sync_op_receipts add column if not exists words_conflict boolean not null default false;
alter table public.sync_op_receipts add column if not exists words_refused boolean not null default false;

-- Clients cannot write receipts (BL-331: only definer helpers do), so the outcome is
-- noted and read here. Not in public: PostgREST exposes public only, so no client can
-- call these as RPCs. sync_push is security invoker, so signed-in people need usage.
create schema if not exists sync_private;
revoke all on schema sync_private from public, anon;
grant usage on schema sync_private to authenticated;

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
                                                                            'edit_level', e.edit_level, 'v', e.text_xid::text))
                     from public.entries e where e.id = p_entry and e.author_id = auth.uid()), '{}'::jsonb);
  end if;
  return case when r.applied_v is null then '{}'::jsonb else jsonb_build_object('applied_v', r.applied_v::text) end;
end;
$$;

revoke execute on all functions in schema sync_private from public, anon;
grant execute on function sync_private.note_applied(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function sync_private.dup_outcome(uuid, uuid) to authenticated;
