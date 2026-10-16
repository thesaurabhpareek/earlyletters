-- TEST STAND-IN, NOT A MIGRATION. Loaded by apps/mobile/test/helpers/sync-server.ts
-- for protocol v1, only while no migration's sync_push knows 'entry.erase'. It is
-- S03's request to S02 for WP-F16-13 (F16-REQ-024, D-085: Erase now in a sync
-- build) in runnable form; S02 owns sync_push, sync_pull and every migration.
-- Delete it when S02's migration lands (sync-server.ts then skips it by itself).
--
-- What it adds (docs/adr/0023-sync-protocol-v1.md section 12):
--   1. sync_private.erase_entry: the author's own letter, deleted or not yet (its
--      delete may still be queued behind the erase on the phone), is purged now the
--      way purge_due purges it after 30 days: the photo goes to the storage purge
--      queue, purge_ledger gets 'entry' (so a restore replay never brings it back),
--      and the row goes (entry_versions cascade). Another person's letter: P0002.
--      Missing: { missing: true }, so a retry is a no-op. Under a legal hold it is
--      kept, tombstoned, until the hold lifts ({ deferred: true }).
--   2. sync_private.entry_erasures: book and letter ids only, never words. The next
--      pull of that book recomputes its removal digest, so every phone that still
--      holds the letter learns it is gone at its next pull, not at the daily verify.
--   3. Two anchored edits: the entry.erase branch in sync_push, and the digest
--      check in sync_pull (sync-v1-standin.ts, SYNC_ERASE_EDITS).
-- Not here (S02 and S05): the recording's backup object at audio_blobs.object_path
-- (F08-REQ-024), and trimming entry_erasures once every phone has pulled past it.

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
begin
  select e.id, e.author_id, e.child_id, e.photo_path into r from public.entries e where e.id = p_id for update;
  if not found then
    return jsonb_build_object('missing', true);
  end if;
  if r.author_id is distinct from v_uid then
    raise exception 'entry not found' using errcode = 'P0002';
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
revoke execute on function sync_private.erase_entry(uuid) from public, anon;
grant execute on function sync_private.erase_entry(uuid) to authenticated;
