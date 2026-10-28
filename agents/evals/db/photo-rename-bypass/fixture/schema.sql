-- Slice of the letter-photo storage rules (models 20261005000000 and the PR #311 helper). Fictional family only.
-- Not the real schema: storage.objects is the harness stub; purge_ledger is reduced to the columns used here.
create table public.child_members (child_id uuid not null, profile_id uuid not null, primary key (child_id, profile_id));
create table public.purge_ledger (entry_id uuid primary key, author_id uuid not null, purged_at timestamptz not null default now());

create function public.is_child_member(p_child uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.child_members where child_id = p_child and profile_id = auth.uid()) $$;
revoke execute on function public.is_child_member(uuid) from public;
grant execute on function public.is_child_member(uuid) to authenticated;

insert into public.purge_ledger (entry_id, author_id)
  values ('e5a5ed00-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111');

-- Is this object path an uploaded letter photo whose letter was erased? Exact shape only: child/author/uuid.ext
create function public.photo_entry_is_purged(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select p_name ~ '^[^/]+/[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[A-Za-z0-9]+$'
     and exists (select 1 from public.purge_ledger
                  where entry_id::text = split_part(split_part(p_name, '/', 3), '.', 1)) $$;
revoke execute on function public.photo_entry_is_purged(text) from public;
grant execute on function public.photo_entry_is_purged(text) to authenticated;

create policy entry_photos_author_select on storage.objects for select to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy entry_photos_author_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and not public.photo_entry_is_purged(name));

create policy entry_photos_author_update on storage.objects for update to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and public.is_child_member(((storage.foldername(name))[1])::uuid));
