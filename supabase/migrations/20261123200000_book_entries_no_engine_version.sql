-- CDO-1 / BL-1952 (FR-AIS-08, FR-AIS-04): engine_version is the author's working material, so the other
-- parent and any contributor must not receive it (data-architect).
--
-- Before: public.book_entries (last defined 20261015030000 section 3) selected e.engine_version, and the
-- non-author branch of sync_pull is `to_jsonb(be) - 'search'` over that view (20261123100000), so the
-- other parent's pulled row carried the engine version that cleaned the author's words. With final_text and
-- machine_edits it lets the author re-derive the text; it is provenance, not a book fact.
-- After: the view has no engine_version column. Everything else is the 20261015030000 definition, word for
-- word. Level stays L2 (an integer, no words, no person); this is an access change, not a level change.
--
-- Unchanged on purpose: entries.engine_version, its immutability trigger, and the author's own pull row
-- (the own branch of sync_pull reads entries, not this view, so the author still receives engine_version).
-- No function is recreated: sync_pull reads the view by name at run time, and no other object depends on it.
-- A view cannot lose a column through create or replace, so it is dropped and created again; that drops the
-- view grants and column comments, restated below. The view has no client grant (20261023060000: only
-- definer code reads it), and stays that way. Default privileges are reset, so the new object carries none
-- and the revokes below only say so. supabase/tests/grants.mjs already lists book_entries as nobody.
-- Rollback: recreate the view from 20261015030000 section 3 and its comments (engine_version is 'L2 version number').
-- Hosted apply is the founder's step (D-041, CR-73).

drop view if exists public.book_entries;

create view public.book_entries with (security_barrier = true) as
select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at,
       e.capture_mode, e.edit_level, e.prompt_key, e.prompt_library_version,
       e.final_text, e.in_book, e.photo_path, e.audio_kept_on_device, e.sounds_like_me,
       e.created_at, e.updated_at, e.deleted_at, e.search, e.approval,
       e.occurred_precision, e.base_direction
  from public.entries e
 where not (select public.is_anonymous())
   and (e.author_id = (select auth.uid())
        or (e.deleted_at is null
            -- Books the caller may read at all: parent, or contributor while family can read.
            and e.child_id in (select m.child_id from public.child_members m
                                 join public.children c on c.id = m.child_id and c.deleted_at is null
                                where m.profile_id = (select auth.uid())
                                  and (m.role = 'parent' or c.family_can_read))
            and (e.in_book
                 -- Family letters waiting for review, or set aside: parents only.
                 or (e.approval in ('pending', 'set_aside')
                     and e.child_id in (select m.child_id from public.child_members m
                                         where m.profile_id = (select auth.uid()) and m.role = 'parent')))));

-- No client role reads the view; definer code reads it as the owner (20261023060000).
revoke all on public.book_entries from public, anon, authenticated, service_role;

comment on view public.book_entries is
  'Letters a member may read (B F9), without the author''s working material (raw transcript, its hash, machine edits, STT metadata, engine version). PRD K-09, FR-AIS-08.';
comment on column public.book_entries.id is 'L3 letter id';
comment on column public.book_entries.child_id is 'L3 book id';
comment on column public.book_entries.author_id is 'L3 person id';
comment on column public.book_entries.author_signs_as is 'L3 signature at save time';
comment on column public.book_entries.kind is 'L2 enum';
comment on column public.book_entries.occurred_on is 'L3 date of the family moment';
comment on column public.book_entries.captured_at is 'L2 capture timestamp';
comment on column public.book_entries.capture_mode is 'L2 enum';
comment on column public.book_entries.edit_level is 'L2 enum';
comment on column public.book_entries.prompt_key is 'L2 prompt catalogue key';
comment on column public.book_entries.prompt_library_version is 'L2 version number';
comment on column public.book_entries.final_text is 'L4 content';
comment on column public.book_entries.in_book is 'L2 flag';
comment on column public.book_entries.photo_path is 'L3 object path';
comment on column public.book_entries.audio_kept_on_device is 'L2 flag';
comment on column public.book_entries.sounds_like_me is 'L2 flag';
comment on column public.book_entries.created_at is 'L2 system timestamp';
comment on column public.book_entries.updated_at is 'L2 system timestamp';
comment on column public.book_entries.deleted_at is 'L2 tombstone time (author rows only)';
comment on column public.book_entries.search is 'L4 content-derived full-text index';
comment on column public.book_entries.approval is 'L2 family review state';
comment on column public.book_entries.occurred_precision is 'L2 enum: day or month (entries.occurred_precision)';
comment on column public.book_entries.base_direction is 'L2 layout enum (entries.base_direction)';
