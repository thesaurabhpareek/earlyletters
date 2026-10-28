-- Two small closures found by re-checking PR #51 (closed) against develop on 28 Oct 2026.
--
-- PENDING: not yet applied. Apply after 20261023060000_explicit_grants.sql (supabase/APPLY.md, "File 26").
-- Safe to run twice (create or replace, alter policy, alter role). Changes no row.
--
-- 1. pg_temp last. #51 finding 1 (a stranger's temp table shadowing child_members or purge_ledger inside a
--    definer function or an RLS helper) is already closed in the end state: 20261015000000 section 7 re-pins
--    every function that existed then, and every later file writes `pg_catalog, public, pg_temp`. The
--    sweep in supabase/tests/v1_gate_search_path.test.mjs and the proconfig check in
--    supabase/tests/pg_temp_search_path.test.mjs prove it for all schemas. No function needs an ALTER here.
--    The one setting left without pg_temp is a role default: escrow_svc (20261023000000) was given
--    `search_path = pg_catalog, public`. Postgres searches the session's temp schema first for relations
--    unless pg_temp is named, so it is named last (section 1 below).
--
-- 2. A purged letter's photo stays purged. #51 finding 2. Erasing a letter removes its photo object (via
--    storage_purge_queue) and records the letter's id (purge_ledger, sync_private.entry_erasures), so the
--    letter can never be uploaded again. The Storage insert policy entry_photos_author_insert, though, only
--    checks the folder, membership, a live book and consent, so the author could put the photo back under
--    {book}/{author}/{letter id}.{ext} after the erasure. The object would belong to no letter and no purge
--    would ever look for it. The policy now refuses a path whose file name is an erased letter id, using the
--    same rule the letter itself is refused by (sync_private.erasure_recorded). The function reads ids only
--    and answers false for any path without a uuid file name (no cast error).
--    Red-team round on #311 closed four holes in the first cut: (a) a rename: Storage upsert and move go
--    through UPDATE, so entry_photos_author_update gets the same condition; (b) odd file names: the uuid is
--    matched as the start of the file name (so `{id}`, `{id}.x.jpg` and `{id}-1.jpg` are caught), and a path
--    deeper than {book}/{author}/{file} is refused on insert and update; (c) the helper answered for any
--    path, so any signed-in person could ask whether a given letter id was erased: it now answers false
--    unless the path's second folder is the caller's own id.
--
-- New SQLSTATEs: none (a Storage policy refusal is a 403 to the client, as for consent). No new column, so no
-- classification label. Fictional family "Asha" only.

-- --- 1. escrow_svc: pg_temp named last -----------------------------------------
alter role escrow_svc set search_path = pg_catalog, public, pg_temp;

-- --- 2. Purged letters' photos ---------------------------------------------------
create or replace function public.photo_entry_is_purged(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(
    split_part(p_name, '/', 2) = auth.uid()::text
    and sync_private.erasure_recorded(
      (substring(p_name from '^[^/]+/[^/]+/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'))::uuid,
      auth.uid()), false);
$$;
revoke execute on function public.photo_entry_is_purged(text) from public, anon;
grant execute on function public.photo_entry_is_purged(text) to authenticated;

-- The insert policy of 20261003000000, restated with two more conditions.
alter policy entry_photos_author_insert on storage.objects with check (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 2
  and public.is_child_member(((storage.foldername(name))[1])::uuid)
  and public.child_is_live(((storage.foldername(name))[1])::uuid)
  and public.can_write_content()
  and not public.photo_entry_is_purged(name)
);

-- The update policy of 20261005000000 (renames, moves and upserts), restated with the same two conditions.
alter policy entry_photos_author_update on storage.objects
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and array_length(storage.foldername(name), 1) = 2
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and public.child_is_live(((storage.foldername(name))[1])::uuid)
              and public.can_write_content()
              and not public.photo_entry_is_purged(name));
