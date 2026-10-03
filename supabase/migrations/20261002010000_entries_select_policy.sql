-- PENDING: not yet applied to the live project. Supabase requires a person to
-- approve dropping policies, so apply this in the SQL editor (supabase/APPLY.md).
-- Performance only: one SELECT policy on entries instead of two. No change in who can read what.
-- No begin/commit here (DB-16): the Supabase CLI wraps each migration file in its
-- own transaction, and an inner commit would end it early. In the SQL editor, wrap
-- the file in begin/commit yourself (APPLY.md step 1).
create policy entries_select on public.entries for select to authenticated using (
  author_id = (select auth.uid())
  or (in_book and deleted_at is null and public.is_child_member(child_id))
);
drop policy if exists entries_author_select on public.entries;
drop policy if exists entries_book_select on public.entries;
