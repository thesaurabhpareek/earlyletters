-- BL-2143 (from BL-968; NS-06 Part A, the server rows: A6, A13, A17, A23, consent): a parent may mark their own letter as a
-- first, with a short label they type. This file adds the two columns, their limits, the consent gate and the other parent's
-- read (data-architect, sync owner).
--
-- Purpose. entries gains first_mark (boolean, L3: the parent's own mark that a letter is a first) and first_label (text, L4: the
-- label the parent typed). The constitution holds: the label is the parent's own words. Nothing here writes, fills, trims,
-- normalises or suggests a label or a mark; no trigger, default or function sets first_label, and first_mark defaults to false.
-- The server stores exactly what the author sent, or refuses it whole.
--
-- What changes, in five places:
--   1. entries: the two columns, and three CHECKs (the last line, as in 20261123210000):
--        entries_first_label_length     first_label is null or 1 to 200 code points (char_length). 200 is the PRD A10 and A23
--                                       ceiling (PROPOSED there; OQ-P5 asks 200 or 320; the row BL-2143 says 200). The 40 grapheme
--                                       rule is the phone's (BL-968, Intl.Segmenter): Postgres cannot count grapheme clusters, and
--                                       a server count that disagreed with the phone would refuse a label the parent was allowed to
--                                       type. 40 clusters of up to 5 code points (Devanagari conjuncts) fit; a 41st such cluster
--                                       does not. This is the loose backstop of 20261123210000, in the same style.
--        entries_first_label_needs_mark a label only on a marked letter (PRD A10); unmarking sends a null label with it.
--        entries_first_not_quiet        a quiet day (kind 'not_much', 20260930000000) cannot be marked (NS-06-A6).
--   2. entries_validate_limits (BL-244, last body 20261123210000): the same three rules first, with a fixed message and the
--      CHECK's name, SQLSTATE 23514, no value, no DETAIL, so a refused label is never echoed in a log or an answer.
--   3. entries_family_rules (the content trigger, last body 20261015030000 section 2b): first_mark and first_label join both
--      tuples, so a change of either needs current content consent (SCCON), as an edit of the words does. Insert was already
--      gated whole.
--   4. entries_guard_immutable (last body 20261016000000): a tombstoned letter's mark and label cannot be changed by a client
--      (SCTMB), as its words cannot. Without this the content trigger returns early for a tombstoned row and the consent gate
--      of point 3 had a way round it. Restore (restore_entry, definer) is not a client write and is untouched; the mark and
--      label go and return with the letter (NS-06-A8).
--   5. book_entries (last definition 20261123200000, no engine_version): first_mark and first_label appended, nothing else, so
--      the other parent reads them only on a letter the view already lets them read (NS-06-A17). engine_version stays out.
--      `create or replace view` (a replace may append columns; it keeps the comments and the grants of 20261123200000) rather
--      than drop and create, so nothing else about the view can move.
-- The sync pull. Not recreated, and not edited. Its non-author row is `to_jsonb(be) - 'search'` over book_entries
-- (20261123100000), so the other parent's pulled row carries the two keys from this file on, behind the same consent gate,
-- which stays where it is. The author's own row is a fixed key list and does not carry them yet; the author's second phone
-- (NS-06-A16) and the write op (sync_push field group `first`) are BL-968's, with the contract in packages/api.
-- Who may write: the author only, by the existing author-only update policy (entries_author_update); no policy changes.
--
-- Ordering. Apply after 20261123200000 (book_entries without engine_version; this file restates its body), 20261123210000 (the
-- last entries_validate_limits body) and 20261124132000 (PR #2119, File 50), which sorts before this file. supabase/APPLY.md
-- "File 51". Not applied. Applying it to a hosted project is the founder's step (D-041, CR-73), from a CI tag run. Nothing
-- reaches a person until the phone flag EXPO_PUBLIC_FIRSTS (BL-968) is on.
--
-- Rollback (a new migration; never edit this file once applied). In one transaction: (a) drop view public.book_entries and
-- create it again from 20261123200000 with its revoke and comments (a replace cannot remove columns); (b) re-create
-- entries_guard_immutable from 20261016000000, entries_family_rules from 20261015030000 section 2b and entries_validate_limits
-- from 20261123210000 section 2; (c) drop the three constraints and then the two columns. Step (c) deletes every mark and label a
-- parent made: take a backup first and do it only by the data architect's decision. Steps (a) and (b) alone are safe and leave
-- the columns in place, unread by others.
--
-- Safety. Adding a NOT NULL column with a constant default and a nullable column is a catalog change, no table rewrite. Each
-- ADD CONSTRAINT takes a short ACCESS EXCLUSIVE lock and scans entries once; every stored row has first_mark false and
-- first_label null, so none can fail. Run in one transaction (the tag run does).
-- Grants. No new table, view, sequence or function. The columns take the table grants of 20261023060000 (authenticated SIU on
-- entries, under row security). The three trigger functions are replaced (create or replace keeps their grants) and the revoke is
-- restated below; book_entries stays with no client grant (supabase/tests/grants.mjs lists it nowhere, so nobody).
-- Classification: both columns carry their level in the comment (PRINCIPLES 10); first_label joins mustBeL4 in
-- supabase/tests/classification.test.mjs. docs/legal/DATA_CLASSIFICATION.md already holds both rows (privacy owns it).
-- Budget: two keys more per letter in the other parent's pull; no index (DB-R22: none until NS-06-A24 misses its budget);
-- one char_length per written row. Not measured.
-- Tests: supabase/tests/firsts.test.mjs (new), coparent_no_raw.test.mjs, book_entries_apply_check.test.mjs. Fictional family
-- "Asha" only.

-- --- 1. the columns and their checks -----------------------------------------------------------------------------------------
alter table public.entries add column first_mark boolean not null default false;
alter table public.entries add column first_label text;
alter table public.entries add constraint entries_first_label_length
  check (first_label is null or char_length(first_label) between 1 and 200);
alter table public.entries add constraint entries_first_label_needs_mark
  check (first_label is null or first_mark);
alter table public.entries add constraint entries_first_not_quiet
  check (not first_mark or kind <> 'not_much');

comment on column public.entries.first_mark is 'L3 parent''s own mark that a letter is a first (NS-06 Part A); never set by the machine';
comment on column public.entries.first_label is 'L4 parent-typed label of a first (free text, rule 3); stored as typed, never written or changed by the machine';

-- --- 2. the value-free trigger (body as in 20261123210000; the three first_* rules are new) -----------------------------------
create or replace function public.entries_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.final_text) > 20000 then
    raise exception 'entries: final_text is over its limit' using errcode = '23514', constraint = 'entries_final_text_length';
  end if;
  if char_length(new.raw_transcript) > 40000 then
    raise exception 'entries: raw_transcript is over its limit' using errcode = '23514', constraint = 'entries_raw_length';
  end if;
  if char_length(new.author_signs_as) > 480 then
    raise exception 'entries: author_signs_as is over its limit' using errcode = '23514', constraint = 'entries_author_signs_as_check';
  end if;
  if new.author_edits is not null and octet_length(new.author_edits::text) > 65536 then
    raise exception 'entries: author_edits is over its size limit' using errcode = '23514', constraint = 'entries_author_edits_shape';
  end if;
  if new.locked_spans is not null and octet_length(new.locked_spans::text) > 16384 then
    raise exception 'entries: locked_spans is over its size limit' using errcode = '23514', constraint = 'entries_locked_spans_shape';
  end if;
  -- BL-2143: the label is the parent's words (L4), so its refusals never carry it.
  if new.first_label is not null and char_length(new.first_label) not between 1 and 200 then
    raise exception 'entries: first_label is over its limit or empty' using errcode = '23514', constraint = 'entries_first_label_length';
  end if;
  if new.first_label is not null and not new.first_mark then
    raise exception 'entries: first_label needs first_mark' using errcode = '23514', constraint = 'entries_first_label_needs_mark';
  end if;
  if new.first_mark and new.kind = 'not_much' then
    raise exception 'entries: a quiet day cannot be marked as a first' using errcode = '23514', constraint = 'entries_first_not_quiet';
  end if;
  return new;
end;
$$;

-- --- 3. the content trigger (body as in 20261015030000 section 2b; first_mark and first_label join both tuples) ---------------
create or replace function public.entries_family_rules()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
declare
  v_content boolean;
  v_role text;
  v_send boolean;
  v_prev text;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;                                   -- service role, RPCs and purge jobs
  end if;
  if public.is_anonymous() then
    raise exception 'not available to anonymous sessions' using errcode = 'SCANO';
  end if;

  if tg_op = 'INSERT' then
    new.approval := 'not_needed';
    new.reviewed_by := null;
    new.reviewed_at := null;
    v_content := true;
  else
    if new.approval is distinct from old.approval
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'entries: approval is set by review_family_letter()' using errcode = 'SCAPR';
    end if;
    if old.deleted_at is not null then
      return new;                                 -- entries_guard decides (SCTMB)
    end if;
    v_content := (new.final_text, new.machine_edits, new.edit_level, new.stt_meta, new.photo_path, new.kind,
                  new.occurred_on, new.prompt_key, new.prompt_library_version, new.author_signs_as,
                  new.sounds_like_me, new.capture_mode, new.audio_kept_on_device,
                  -- F16-REQ-028: the v1.0 columns are content too (review L N9 on #208).
                  new.author_edits, new.locked_spans, new.pack_ref, new.occurred_precision, new.base_direction,
                  -- BL-2143: a first and its label are content too (NS-06 A10 step 2).
                  new.first_mark, new.first_label)
                 is distinct from
                 (old.final_text, old.machine_edits, old.edit_level, old.stt_meta, old.photo_path, old.kind,
                  old.occurred_on, old.prompt_key, old.prompt_library_version, old.author_signs_as,
                  old.sounds_like_me, old.capture_mode, old.audio_kept_on_device,
                  old.author_edits, old.locked_spans, old.pack_ref, old.occurred_precision, old.base_direction,
                  old.first_mark, old.first_label)
                 or (new.in_book and not old.in_book);
    -- Tombstoning, and taking a letter out of the book, are never gated (LEGAL-REQ-009).
  end if;

  if v_content then
    perform public.require_content_consent();
    if not public.child_is_live(new.child_id) and public.is_child_member(new.child_id) then
      raise exception 'book is deleted' using errcode = 'SCDEL';
    end if;
  end if;

  v_role := public.my_role_in(new.child_id);
  if v_role = 'contributor' then
    if tg_op = 'INSERT' then
      v_prev := 'not_needed';
      v_send := new.in_book;
    else
      v_prev := old.approval;
      v_send := case when new.in_book is distinct from old.in_book then new.in_book
                     else old.approval <> 'not_needed' end;
      if v_prev = 'added' and new.final_text is distinct from old.final_text
         and not public.my_auto_add_in(new.child_id) then
        v_prev := 'not_needed';                   -- new words need a parent's yes again
      end if;
    end if;
    if not v_send then
      new.approval := 'not_needed';
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif v_prev = 'not_needed' then
      new.approval := case when public.my_auto_add_in(new.child_id) then 'added' else 'pending' end;
      new.reviewed_by := null;
      new.reviewed_at := null;
    else
      new.approval := v_prev;
    end if;
    new.in_book := new.approval = 'added';
  end if;
  return new;
end;
$$;

-- --- 4. the immutability and tombstone guard (body as in 20261016000000; first_mark and first_label join the tombstone list) ---
create or replace function public.entries_guard_immutable()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
declare
  v_client boolean := current_user in ('authenticated', 'anon');
begin
  if new.id is distinct from old.id
     or new.raw_transcript is distinct from old.raw_transcript
     or new.captured_at is distinct from old.captured_at
     or new.author_id is distinct from old.author_id
     or new.child_id is distinct from old.child_id
     or new.engine_version is distinct from old.engine_version
     or new.created_at is distinct from old.created_at
     or new.raw_sha256 is distinct from old.raw_sha256
     or (old.pack_ref is not null and new.pack_ref is distinct from old.pack_ref) then
    raise exception 'entries: id, raw_transcript, raw_sha256, captured_at, created_at, author_id, child_id, engine_version and pack_ref are immutable'
      using errcode = 'SCIMM';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    -- Tombstone. The clock is the server's: a client cannot back-date to force an early purge.
    new.deleted_at := now();
    if v_client or new.deleted_reason is null then new.deleted_reason := 'user'; end if;
  elsif old.deleted_at is not null and new.deleted_at is null then
    if v_client then
      raise exception 'entries: use restore_entry() to restore a deleted entry' using errcode = 'SCTMB';
    end if;
    new.deleted_reason := null;
  elsif old.deleted_at is not null then
    -- Deletion wins over a concurrent offline edit (DATA-REQ-043).
    new.deleted_at := old.deleted_at;
    new.deleted_reason := old.deleted_reason;
    if v_client and (new.final_text is distinct from old.final_text
                     or new.in_book is distinct from old.in_book
                     or new.machine_edits is distinct from old.machine_edits
                     or new.photo_path is distinct from old.photo_path
                     -- BL-2143: the content trigger returns early for a tombstoned row, so the mark and label are held here.
                     or new.first_mark is distinct from old.first_mark
                     or new.first_label is distinct from old.first_label) then
      raise exception 'entries: a deleted entry cannot be edited; restore it first' using errcode = 'SCTMB';
    end if;
  elsif new.deleted_reason is not null then
    new.deleted_reason := null;
  end if;
  return new;
end;
$$;

-- No API role executes a trigger function (a trigger does not need the writer to hold EXECUTE). create or replace keeps the old
-- grants; this states them for all three, and also covers service_role, which supabase/tests/grants.mjs SERVICE_ROLE_FUNCTIONS
-- never listed for any of them.
revoke execute on function public.entries_validate_limits(), public.entries_family_rules(), public.entries_guard_immutable()
  from public, anon, authenticated, service_role;

-- --- 5. book_entries (definition as in 20261123200000; first_mark and first_label appended) -----------------------------------
create or replace view public.book_entries with (security_barrier = true) as
select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at,
       e.capture_mode, e.edit_level, e.prompt_key, e.prompt_library_version,
       e.final_text, e.in_book, e.photo_path, e.audio_kept_on_device, e.sounds_like_me,
       e.created_at, e.updated_at, e.deleted_at, e.search, e.approval,
       e.occurred_precision, e.base_direction,
       e.first_mark, e.first_label
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

-- No client role reads the view; definer code reads it as the owner (20261023060000, 20261123200000).
revoke all on public.book_entries from public, anon, authenticated, service_role;

comment on column public.book_entries.first_mark is 'L3 parent''s own mark that a letter is a first (entries.first_mark)';
comment on column public.book_entries.first_label is 'L4 parent-typed label of a first (entries.first_label)';
