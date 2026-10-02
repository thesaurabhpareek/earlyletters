-- Hardening after Supabase advisors on the live project (Oct 1 2026).
-- Additive: never edit a migration that has been applied.

-- 1. Internal functions must not be callable through the public API.
--    Trigger functions fire regardless of EXECUTE grants.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.entries_record_version() from public, anon, authenticated;
revoke execute on function public.entries_guard_immutable() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
-- RLS policies call this as the signed-in user, so `authenticated` keeps it.
revoke execute on function public.is_child_member(uuid) from public, anon;
grant execute on function public.is_child_member(uuid) to authenticated;
-- Intentionally callable by signed-in users (advisor 0029 is expected here):
-- create_child, create_child_invite, accept_child_invite. Each checks auth.uid().

-- 2. Cover foreign keys used by joins and cascading deletes.
create index if not exists child_invites_child_idx on public.child_invites (child_id);
create index if not exists child_invites_invited_by_idx on public.child_invites (invited_by);
create index if not exists child_invites_accepted_by_idx on public.child_invites (accepted_by);
create index if not exists children_created_by_idx on public.children (created_by);
create index if not exists dictionary_terms_child_idx on public.dictionary_terms (child_id);
create index if not exists safety_events_author_idx on public.safety_events (author_id);

-- 3. One SELECT policy on entries instead of two (each permissive policy runs per row).
drop policy if exists entries_author_select on public.entries;
drop policy if exists entries_book_select on public.entries;
create policy entries_select on public.entries for select to authenticated using (
  author_id = (select auth.uid())
  or (in_book and deleted_at is null and public.is_child_member(child_id))
);
