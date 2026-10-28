-- Slice of the letter-photo storage rules and the erasure records. Fictional family only.
-- Models (read 28 Oct 2026): purge_ledger (20261002020000 section 7: entity_type, entity_id text, purged_at; NO author),
-- sync_private.entry_erasures and public.held_drafts_gone (20261016000000 sections 4-5), the insert policy of
-- 20261003000000 and the update policy of 20261005000000, and the PR #311 first-cut helper (head 86d30dd6).
-- Slice, not the real schema: foreign keys dropped; entries / held_drafts reduced to (id, author_id); storage.objects
-- is the harness stub. STUBS: public.child_is_live and public.can_write_content return true (the real ones read the
-- book's deleted_at and the caller's consent); they are here so the real policy conditions can be written verbatim.
create schema sync_private;
create table public.child_members (child_id uuid not null, profile_id uuid not null, primary key (child_id, profile_id));
create table public.entries (id uuid primary key, author_id uuid not null);
create table public.held_drafts (id uuid primary key, author_id uuid not null);
create table public.purge_ledger (
  entity_type text not null check (entity_type in ('entry', 'child', 'profile', 'storage_object')),
  entity_id text not null,
  purged_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);
create table public.held_drafts_gone (
  id uuid primary key, author_id uuid not null, child_id uuid not null,
  gone text not null check (gone in ('discarded', 'kept', 'erased')), updated_at timestamptz not null default now()
);
create table sync_private.entry_erasures (
  entry_id uuid primary key, child_id uuid not null, author_id uuid not null, erased_at timestamptz not null default now()
);
alter table public.purge_ledger enable row level security;
alter table public.held_drafts_gone enable row level security;
alter table sync_private.entry_erasures enable row level security;
revoke all on public.purge_ledger, public.held_drafts_gone, sync_private.entry_erasures from public, anon, authenticated;

create function public.is_child_member(p_child uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.child_members where child_id = p_child and profile_id = auth.uid()) $$;
revoke execute on function public.is_child_member(uuid) from public, anon;
grant execute on function public.is_child_member(uuid) to authenticated;
-- STUBS (see header).
create function public.child_is_live(p_child uuid) returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$ select true $$;
create function public.can_write_content() returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$ select true $$;
revoke execute on function public.child_is_live(uuid), public.can_write_content() from public, anon;
grant execute on function public.child_is_live(uuid), public.can_write_content() to authenticated;

-- Whether a letter id is someone else's: another author's letter, held draft, marker or erasure (20261016000000).
create function sync_private.letter_id_taken(p_id uuid, p_author uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.entries e where e.id = p_id and e.author_id is distinct from p_author)
      or exists (select 1 from public.held_drafts h where h.id = p_id and h.author_id is distinct from p_author)
      or exists (select 1 from public.held_drafts_gone g where g.id = p_id and g.author_id is distinct from p_author)
      or exists (select 1 from sync_private.entry_erasures x where x.entry_id = p_id and x.author_id is distinct from p_author)
$$;

-- Asha's letter 'e5a5ed00-...-0001' was erased by its author (user A): the ledger holds the id, the erasure record
-- holds the id and the author.
insert into public.purge_ledger (entity_type, entity_id) values ('entry', 'e5a5ed00-0000-4000-8000-000000000001');
insert into sync_private.entry_erasures (entry_id, child_id, author_id)
  values ('e5a5ed00-0000-4000-8000-000000000001', '0c1d0000-0000-4000-8000-00000000a5a1', '11111111-1111-1111-1111-111111111111');

-- Is this object path a photo of an erased letter? FIRST CUT (PR #311 head 86d30dd6): exact shape child/author/uuid.ext only.
create function public.photo_entry_is_purged(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select p_name ~ '^[^/]+/[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[A-Za-z0-9]+$'
     and exists (select 1 from public.purge_ledger
                  where entity_type = 'entry' and entity_id = split_part(split_part(p_name, '/', 3), '.', 1)) $$;
revoke execute on function public.photo_entry_is_purged(text) from public, anon;
grant execute on function public.photo_entry_is_purged(text) to authenticated;

create policy entry_photos_author_select on storage.objects for select to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy entry_photos_author_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and public.child_is_live(((storage.foldername(name))[1])::uuid)
              and public.can_write_content()
              and not public.photo_entry_is_purged(name));

-- The update policy as shipped in 20261005000000: no erased-letter condition (the flaw under review).
create policy entry_photos_author_update on storage.objects for update to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and public.child_is_live(((storage.foldername(name))[1])::uuid)
              and public.can_write_content());
