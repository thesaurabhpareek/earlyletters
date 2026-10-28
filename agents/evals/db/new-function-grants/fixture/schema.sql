-- Applied already (listed in applied.txt with its hash). Slice of the real schema; fictional family only.
create table public.child_members (child_id uuid not null, profile_id uuid not null, primary key (child_id, profile_id));

create function public.is_child_member(p_child uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.child_members where child_id = p_child and profile_id = auth.uid()) $$;
revoke execute on function public.is_child_member(uuid) from public;
grant execute on function public.is_child_member(uuid) to authenticated;
