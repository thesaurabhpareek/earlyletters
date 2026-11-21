-- BL-870 (S1, NS-01-R61, NS-36-R1d, CR-71 C4): the server refuses a picture. A letter's picture stays
-- on the phone (X2). Before this file an author could still upload an object to the entry-photos
-- bucket (entry_photos_author_insert, entry_photos_author_update: 20260930000000, restated in
-- 20261003000000, 20261005000000 and 20261028000000) and set entries.photo_path. A crafted client
-- could do both today.
--
-- PENDING: not yet applied. Needs the founder's `approve-migration` label and a CI tag run (D-041).
-- Apply after 20261109000000 (supabase/APPLY.md, "File 33"). Refuses a second run (55000).
-- Founder check before the tag: how many rows hold entries.photo_path (expected zero, data-and-sync Q8).
--
-- ROLLBACK (forward-fix only; a later migration):
--   drop trigger entries_15_photo_closed on public.entries;
--   drop function public.entries_photo_closed();
--   re-create entry_photos_author_insert and entry_photos_author_update from 20261028000000.
--
-- What changes:
--   1. The insert and update policies on storage.objects for entry-photos are dropped. With no policy
--      the `authenticated` role is refused (42501) for every person: owner, parent, co-parent, former
--      member, and `anon` (which holds no policy). The select policy (entry_photos_read) and the
--      delete policy (entry_photos_author_delete) stay, so an existing legacy object can still be read
--      and removed. The service role bypasses RLS by design; the purge worker is its only writer.
--      photo_entry_is_purged() is no longer called by a policy; it stays (grant and tests unchanged).
--   2. entries_photo_closed(): a BEFORE INSERT OR UPDATE trigger raises SCPHO when a row would carry a
--      photo_path it did not already have. An insert with a non-null path, or an update that sets a
--      path to a new non-null value, is refused for every role. An update that leaves the existing
--      path unchanged passes, and so does clearing it (CK8: a legacy row stays editable).
--
-- Trigger order (DB-R04): triggers of one timing fire in NAME order and a digit sorts before every
-- letter, so entries_15_photo_closed fires FIRST of the before-triggers on entries (before
-- entries_family_rules, entries_guard, entries_insert_guard, entries_not_purged and the rest). That is
-- intended: a picture is refused before any other rule runs. supabase/tests/photo_bucket_closed.test.mjs
-- pins the order.
--
-- Data classes: no new column. entries_photo_closed() holds no data.
-- Grants: a revoke only. The trigger function is executable by no API role (DB-R14). There is no GRANT,
-- so grants.mjs gets no line.
-- Budget: one column compare per entries write, inside the push_50_inserts 120 ms budget
-- (sync_perf.test.mjs); no index needed.

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'entries_photo_closed') then
    raise exception '20261110000000 is already applied (entries_photo_closed exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1. The bucket takes no client write -------------------------------------
drop policy if exists entry_photos_author_insert on storage.objects;
drop policy if exists entry_photos_author_update on storage.objects;

-- --- 2. A letter carries no new picture path ---------------------------------
create or replace function public.entries_photo_closed()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if new.photo_path is not null
     and (tg_op = 'INSERT' or new.photo_path is distinct from old.photo_path) then
    raise exception 'entries: the server holds no pictures' using errcode = 'SCPHO';
  end if;
  return new;
end;
$$;

create trigger entries_15_photo_closed before insert or update on public.entries
  for each row execute function public.entries_photo_closed();

revoke execute on function public.entries_photo_closed() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.entries_photo_closed() from anon, authenticated, service_role';
  end if;
end;
$$;
