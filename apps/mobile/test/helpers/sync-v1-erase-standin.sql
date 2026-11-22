-- TEST STAND-IN, NOT A MIGRATION. Loaded by apps/mobile/test/helpers/sync-server.ts
-- for protocol v1, only while no migration's sync_push knows 'entry.erase'. It is
-- S03's request to S02 for WP-F16-13 (F16-REQ-024, D-085: Erase now in a sync
-- build) in runnable form; S02 owns sync_push, sync_pull and every migration.
-- Delete it when S02's migration lands (sync-server.ts then skips it by itself).
--
-- What it adds (docs/adr/0025-sync-protocol-v1.md section 12):
--   1. sync_private.erase_entry: the author's own letter, deleted or not yet (its
--      delete may still be queued behind the erase on the phone), is purged now the
--      way purge_due purges it after 30 days: the photo goes to the storage purge
--      queue, purge_ledger gets 'entry' (so a restore replay never brings it back),
--      and the row goes (entry_versions cascade). Missing, or another person's
--      letter: { missing: true }, the same answer, and nothing changes; a retry is a no-op. Under a legal hold it is
--      kept, tombstoned, until the hold lifts ({ deferred: true }).
--   2. sync_private.entry_erasures: book and letter ids only, never words. The next
--      pull of that book recomputes its removal digest, so every phone that still
--      holds the letter learns it is gone at its next pull, not at the daily verify.
--   3. Three anchored edits: the entry.erase branch in sync_push; an upload of an
--      id with a recorded erasure is refused as purged (the 60 day forget: purge_ledger
--      forgets, entry_erasures does not); and the digest check in sync_pull
--      (sync-v1-standin.ts, SYNC_PUSH_ERASE_EDITS and SYNC_PULL_ERASE_EDITS).
-- Not here (S02 and S05): the recording's backup object at audio_blobs.object_path
-- (F08-REQ-024). entry_erasures is never trimmed while an upload could still bring
-- the letter back (ADR 0025 section 12).

create schema if not exists sync_private;
revoke all on schema sync_private from public, anon;
grant usage on schema sync_private to authenticated;

create table sync_private.entry_erasures (
  entry_id uuid primary key,
  child_id uuid not null,
  author_id uuid not null,
  erased_at timestamptz not null default now(),
  sync_xid xid8 not null default pg_current_xact_id()
);
create index entry_erasures_book_idx on sync_private.entry_erasures (child_id, sync_xid);
revoke all on sync_private.entry_erasures from public, anon, authenticated;

create function sync_private.erase_entry(p_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  r record;
  v_res jsonb;
begin
  select e.id, e.author_id, e.child_id, e.photo_path into r from public.entries e where e.id = p_id for update;
  if not found then
    -- No letter: a voice-only letter waiting for its words lives only as a held row (when held drafts exist).
    if to_regprocedure('sync_private.erase_held(uuid)') is not null then
      execute 'select sync_private.erase_held($1)' into v_res using p_id;
      return v_res;
    end if;
    return jsonb_build_object('missing', true);
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
  -- A letter kept from a held draft: its marker says erased now, so the author's other phones erase their
  -- copy of the draft, and an upload of it is refused (ADR 0025 section 9 table, row C, entry.erase).
  if to_regclass('public.held_drafts_gone') is not null then
    update public.held_drafts_gone g set gone = 'erased', updated_at = now(), sync_xid = pg_current_xact_id()
     where g.id = p_id and g.author_id = v_uid;
  end if;
  return jsonb_build_object('erased', true);
end;
$$;
-- Whether a letter id was erased (a positive record, never "a base and no row", which a server restore
-- also produces; final re-check B-R1): the letter's erasure, or the erase marker of a held draft. Definer:
-- clients cannot read entry_erasures or held_drafts_gone.
create function sync_private.was_erased(p_id uuid)
returns boolean language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if exists (select 1 from sync_private.entry_erasures x where x.entry_id = p_id and x.author_id = auth.uid()) then
    return true;
  end if;
  if to_regclass('public.held_drafts_gone') is not null then
    return exists (select 1 from public.held_drafts_gone g where g.id = p_id and g.author_id = auth.uid() and g.gone = 'erased');
  end if;
  return false;
end;
$$;
revoke execute on function sync_private.was_erased(uuid) from public, anon;
grant execute on function sync_private.was_erased(uuid) to authenticated;

revoke execute on function sync_private.erase_entry(uuid) from public, anon;
grant execute on function sync_private.erase_entry(uuid) to authenticated;

-- The first answer of an erase or a let-go, kept on its receipt (flags only, never words), so the repeat of
-- a lost answer says the same (ADR 0025 section 9 table, repeats).
alter table public.sync_op_receipts add column if not exists answer jsonb;
create function sync_private.receipt_answer_note(p_op uuid, p_answer jsonb)
returns void language sql security definer set search_path = pg_catalog, public, pg_temp as $$
  update public.sync_op_receipts r set answer = p_answer where r.op_id = p_op and r.profile_id = auth.uid();
$$;
create function sync_private.receipt_answer(p_op uuid)
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select case when r.answer is null then null else jsonb_build_object('missing', false) || r.answer end
    from public.sync_op_receipts r where r.op_id = p_op and r.profile_id = auth.uid();
$$;
revoke execute on function sync_private.receipt_answer_note(uuid, jsonb), sync_private.receipt_answer(uuid) from public, anon;
grant execute on function sync_private.receipt_answer_note(uuid, jsonb), sync_private.receipt_answer(uuid) to authenticated;
