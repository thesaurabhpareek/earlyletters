-- Slice of a family-book schema with security definer helpers (models the PR #51 finding). Fictional family only.
create table public.child_members (child_id uuid not null, profile_id uuid not null, role text not null default 'parent',
  primary key (child_id, profile_id));

-- Already correct: pg_catalog first, pg_temp last.
create function public.is_child_member(p_child uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.child_members where child_id = p_child and profile_id = auth.uid()) $$;

-- search_path set, but pg_temp not named: Postgres then searches the session's temp schema first.
create function public.is_child_parent(p_child uuid) returns boolean
language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from child_members where child_id = p_child and profile_id = auth.uid() and role = 'parent') $$;

-- No search_path at all.
create function public.member_count(p_child uuid) returns int
language sql stable security definer as $$
  select count(*)::int from child_members where child_id = p_child and exists (select 1 from child_members where child_id = p_child and profile_id = auth.uid()) $$;

-- pg_catalog first, but pg_temp still not last.
create function public.my_role(p_child uuid) returns text
language sql stable security definer set search_path = pg_catalog, public as $$
  select role from child_members where child_id = p_child and profile_id = auth.uid() $$;

revoke execute on all functions in schema public from public;
grant execute on function public.is_child_member(uuid), public.is_child_parent(uuid), public.member_count(uuid), public.my_role(uuid) to authenticated;
