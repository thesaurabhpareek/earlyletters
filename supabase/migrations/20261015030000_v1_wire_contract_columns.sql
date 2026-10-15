-- The v1.0 wire-contract columns, in one migration (PRD V2 08-delivery.md section
-- 3.3 S02; F16-REQ-028; R2 AR-31 and AR-32; WP-F04-14; the server columns of
-- WP-F07-04; the author-layer columns of WP-F06-07, nullable).
--
-- PENDING: not yet applied. Apply after 20261015020000_v1_gate_coparent_invites_undo.sql,
-- following supabase/APPLY.md (section "Files 13 to 16"). Never edits an
-- earlier file. Redefined from their newest version: sync_pull and sync_push
-- (20261015000000), entries_guard_immutable (20261002020000), book_entries
-- (20261003000000, columns appended only). Each change is marked F16-REQ-028.
--
-- Why now: the contract freezes before sync reaches a phone (R2 AR-31), so a
-- later client that fills these fields needs no migration and an older client
-- never clears them. Every new column is nullable or has a default an older
-- client already means; a field the op data does not carry is left as it is.
--
-- entries (author writes; RLS unchanged):
--   occurred_precision text 'day' | 'month', default 'day' (F04-REQ-015). Field
--     group occurred_on. L2. Members read it through book_entries.
--   base_direction text 'ltr' | 'rtl', default 'ltr' (F04 section 11, R3 DX-20).
--     Applied with the text or language group. L2 layout only. Members read it.
--   author_edits jsonb, null or an array (F06-REQ-026). Field group text (the
--     words group travels together, F16-REQ-011). L4, author-only.
--   locked_spans jsonb, null or an array (F06-REQ-031). Field group text. L4,
--     author-only.
--   pack_ref text, null or `<lang>@<version>` (F06-REQ-024). Set once, then
--     immutable, like engine_version (DATA-REQ-040 Rev: SCIMM). Once means at
--     insert, or later only while it is still null: every letter uploaded
--     before this file (or by an older build) has none, and a newer build that
--     cleaned it with a pack must be able to record that without its whole op
--     (words included) being refused. A different value, or clearing it, is
--     SCIMM. L4
--     author-only, because it names the letter's language, which is L4 like
--     entries.language (F06 section 8 lists it as L2 author-only; S17 confirms).
--   The author-only columns stay out of book_entries, so the other parent's pull
--   never carries them (PRD-REQ-004 Rev, F06-REQ-033). The version trigger and
--   the replay rule for the author layer (DATA-REQ-041 Rev, F06-REQ-025) are
--   WP-F06-07 (wave 3), not this file.
-- dictionary_terms.forms jsonb, null or 1 to 8 forms {script, text, heardAs,
--   offerOnly} (F07 section 11.2), each text 1 to 80 characters, at most one
--   form per script. L4. Nullable until WP-F07-04 (wave 4) backfills it from
--   term and adds the key, shared-read and leave rules (F07 section 7.3).
-- child_member_prefs.notify_letters (20261015020000) joins the prefs.upsert op.
-- Not added, on purpose: audio_sha256 (R2 AR-32): F16 section 6.2 D decided the
--   wire contract carries no audio hash; restore matches by entry id against
--   audio_blobs (F08). held_drafts and the held ops (WP-F16-17), p_api_version
--   (WP-F16-16) and words compare-and-set (WP-F16-14) wait for the sync ADR (T15).
--
-- New SQLSTATEs: none. Reused: SCIMM, 22023, 23514 (check violation).

-- ─── 1. Columns and checks ───────────────────────────────────────────────
alter table public.entries add column if not exists occurred_precision text not null default 'day';
alter table public.entries add column if not exists base_direction text not null default 'ltr';
alter table public.entries add column if not exists author_edits jsonb;
alter table public.entries add column if not exists locked_spans jsonb;
alter table public.entries add column if not exists pack_ref text;
alter table public.entries add constraint entries_occurred_precision_check
  check (occurred_precision in ('day', 'month'));
alter table public.entries add constraint entries_base_direction_check
  check (base_direction in ('ltr', 'rtl'));
alter table public.entries add constraint entries_author_edits_shape
  check (author_edits is null or (jsonb_typeof(author_edits) = 'array' and octet_length(author_edits::text) <= 65536));
alter table public.entries add constraint entries_locked_spans_shape
  check (locked_spans is null or (jsonb_typeof(locked_spans) = 'array' and octet_length(locked_spans::text) <= 16384));
alter table public.entries add constraint entries_pack_ref_shape
  check (pack_ref is null or pack_ref ~ '^[a-z]{2,3}@[0-9A-Za-z][0-9A-Za-z.+_-]{0,31}$');

-- Dictionary forms: shape only (no person can make a form for another, RLS
-- unchanged). Immutable so it can back a check constraint.
create or replace function public.dictionary_forms_valid(p_forms jsonb)
returns boolean language sql immutable set search_path = pg_catalog, public, pg_temp as $$
  select p_forms is null
      or (jsonb_typeof(p_forms) = 'array'
          and jsonb_array_length(p_forms) between 1 and 8
          and octet_length(p_forms::text) <= 16384
          and not exists (
            select 1 from jsonb_array_elements(p_forms) f
             where jsonb_typeof(f) <> 'object'
                or exists (select 1 from jsonb_object_keys(f) k where k not in ('script', 'text', 'heardAs', 'offerOnly'))
                or coalesce(f ->> 'script', '') not in ('latin', 'devanagari', 'arabic', 'han_simplified', 'han_traditional')
                or jsonb_typeof(f -> 'text') is distinct from 'string'
                or char_length(btrim(f ->> 'text')) not between 1 and 80
                or (f ? 'heardAs' and (jsonb_typeof(f -> 'heardAs') <> 'array' or jsonb_array_length(f -> 'heardAs') > 20
                     or exists (select 1 from jsonb_array_elements(f -> 'heardAs') h
                                 where jsonb_typeof(h) <> 'string' or char_length(h #>> '{}') not between 1 and 80)))
                or (f ? 'offerOnly' and (jsonb_typeof(f -> 'offerOnly') <> 'array' or jsonb_array_length(f -> 'offerOnly') > 20
                     or exists (select 1 from jsonb_array_elements(f -> 'offerOnly') h
                                 where jsonb_typeof(h) <> 'string' or char_length(h #>> '{}') not between 1 and 80))))
          and (select count(distinct f ->> 'script') from jsonb_array_elements(p_forms) f) = jsonb_array_length(p_forms));
$$;
alter table public.dictionary_terms add column if not exists forms jsonb;
alter table public.dictionary_terms add constraint dictionary_terms_forms_shape check (public.dictionary_forms_valid(forms));

-- ─── 2. pack_ref is set once, then immutable (DATA-REQ-040 Rev) ──────────
-- From 20261002020000; the only change is pack_ref in the first check: null to a
-- value is allowed once, any other change is SCIMM.
create or replace function public.entries_guard_immutable()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
declare
  v_client boolean := current_user in ('authenticated', 'anon');
begin
  if new.raw_transcript is distinct from old.raw_transcript
     or new.captured_at is distinct from old.captured_at
     or new.author_id is distinct from old.author_id
     or new.child_id is distinct from old.child_id
     or new.engine_version is distinct from old.engine_version
     or new.created_at is distinct from old.created_at
     or new.raw_sha256 is distinct from old.raw_sha256
     or (old.pack_ref is not null and new.pack_ref is distinct from old.pack_ref) then
    raise exception 'entries: raw_transcript, raw_sha256, captured_at, created_at, author_id, child_id, engine_version and pack_ref are immutable'
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
                     or new.photo_path is distinct from old.photo_path) then
      raise exception 'entries: a deleted entry cannot be edited; restore it first' using errcode = 'SCTMB';
    end if;
  elsif new.deleted_reason is not null then
    new.deleted_reason := null;
  end if;
  return new;
end;
$$;

-- ─── 3. book_entries: members read the date precision and direction ──────
-- From 20261003000000 with two columns appended (a replace may only append).
-- The author-only columns (author_edits, locked_spans, pack_ref, language) stay out.
create or replace view public.book_entries with (security_barrier = true) as
select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at,
       e.capture_mode, e.edit_level, e.prompt_key, e.prompt_library_version, e.engine_version,
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
-- Read-only for members, as before (the replace keeps grants; restated so a
-- reader of this file sees the rule).
revoke all on public.book_entries from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.book_entries from authenticated;
grant select on public.book_entries to authenticated;

-- ─── 4. sync_pull: own rows carry the new columns (F16-REQ-028) ──────────
-- From 20261015000000; only the two own-row builders gain five keys. Others'
-- rows come from book_entries and so gain occurred_precision and base_direction.
create or replace function public.sync_pull(p_since jsonb default '{}'::jsonb, p_limit int default 200)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  v_snap pg_snapshot := pg_current_snapshot();
  v_xmin xid8 := pg_snapshot_xmin(v_snap);
  v_xmax xid8 := pg_snapshot_xmax(v_snap);
  c_zero constant uuid := '00000000-0000-0000-0000-000000000000';
  c_mod constant numeric := 281474976710656;   -- 2^48
  v_since jsonb := coalesce(p_since, '{}'::jsonb);
  v_reqs jsonb;
  v_req jsonb;
  v_epoch int;
  v_epoch_at timestamptz;
  v_budget int;
  v_live uuid[] := '{}';
  b record;
  k text;
  v_cur text;
  v_after_x xid8;
  v_after_i uuid;
  v_fresh boolean;
  v_repull boolean;
  v_access text;
  v_meta jsonb;
  v_hash text;
  v_rows jsonb;
  v_n int;
  v_last_x xid8;
  v_last_i uuid;
  v_more boolean;
  v_any_more boolean := false;
  v_cursor text;
  v_check boolean;
  v_digest jsonb;
  v_book jsonb;
  v_books jsonb := '[]'::jsonb;
  v_gone jsonb := '[]'::jsonb;
begin
  if p_limit is null or p_limit not between 1 and 500 then
    raise exception 'limit must be 1 to 500' using errcode = '22023';
  end if;
  if jsonb_typeof(v_since) <> 'object' then
    raise exception 'since must be an object' using errcode = '22023';
  end if;
  v_reqs := coalesce(v_since -> 'books', '{}'::jsonb);
  if jsonb_typeof(v_reqs) <> 'object' or (select count(*) from jsonb_object_keys(v_reqs)) > 100 then
    raise exception 'books must be an object with at most 100 books' using errcode = '22023';
  end if;

  perform public.rate_hit('pull');                -- 120 per minute per person (SCRAT)

  select e.epoch, e.started_at into v_epoch, v_epoch_at from sync_epochs e order by e.epoch desc limit 1;
  if jsonb_typeof(v_since -> 'epoch') is not null and jsonb_typeof(v_since -> 'epoch') <> 'null'
     and (v_since ->> 'epoch') is distinct from v_epoch::text then
    return jsonb_build_object('reset', true, 'reason', 'epoch', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
  end if;

  -- Validate every request; a cursor ahead of the server means the database went back in time.
  for k, v_req in select key, value from jsonb_each(v_reqs) loop
    begin
      perform k::uuid;
      if jsonb_typeof(v_req) <> 'object' then raise exception 'bad request'; end if;
      v_cur := nullif(v_req ->> 'cursor', '');
      if v_cur is not null then
        if array_length(string_to_array(v_cur, ':'), 1) <> 2 then raise exception 'bad cursor'; end if;
        v_after_x := split_part(v_cur, ':', 1)::xid8;
        v_after_i := split_part(v_cur, ':', 2)::uuid;
      end if;
    exception when others then
      raise exception 'bad book request' using errcode = '22023';
    end;
    if v_cur is not null and v_after_x > v_xmax then
      return jsonb_build_object('reset', true, 'reason', 'cursor_ahead', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
    end if;
  end loop;

  v_budget := p_limit;
  for b in
    select c.id, m.role, c.family_can_read
      from child_members m
      join children c on c.id = m.child_id and c.deleted_at is null
     where m.profile_id = v_uid
     order by m.joined_at, c.id
  loop
    v_live := v_live || b.id;
    v_req := v_reqs -> (b.id::text);
    v_access := case when b.role = 'parent' then 'parent'
                     else 'contributor:' || case when b.family_can_read then 'reads' else 'own' end end;
    v_repull := coalesce(v_req ? 'access' and (v_req ->> 'access') is distinct from v_access, false);
    v_cur := case when v_repull then null else nullif(v_req ->> 'cursor', '') end;
    v_fresh := v_cur is null;
    v_after_x := case when v_fresh then '0'::xid8 else split_part(v_cur, ':', 1)::xid8 end;
    v_after_i := case when v_fresh then c_zero else split_part(v_cur, ':', 2)::uuid end;

    -- Book settings and members. D-039: family members get the birthday's month and day only.
    select jsonb_build_object(
             'role', b.role,
             'name', c.name,
             'nickname', c.nickname,
             'date_of_birth', case when b.role = 'parent' then c.date_of_birth end,
             'birthday_md', to_char(c.date_of_birth, 'MM-DD'),
             'due_date', case when b.role = 'parent' then c.due_date end,
             'family_can_read', c.family_can_read,
             'created_by_me', c.created_by is not distinct from v_uid,
             'my_signs_as', coalesce(mp.signs_as,
                                     (select i.signs_as from child_invites i
                                       where i.child_id = c.id and i.accepted_by = v_uid
                                       order by i.accepted_at desc limit 1)),
             'include_in_reminders', coalesce(mp.include_in_reminders, true),
             'members', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'profile_id', mm.profile_id,
                        'role', mm.role,
                        'is_me', mm.profile_id = v_uid,
                        'joined_at', mm.joined_at,
                        'signs_as', coalesce(pp.signs_as,
                                             (select i.signs_as from child_invites i
                                               where i.child_id = c.id and i.accepted_by = mm.profile_id
                                               order by i.accepted_at desc limit 1),
                                             pr.signs_as))
                        order by mm.joined_at, mm.profile_id)
                 from child_members mm
                 left join child_member_prefs pp on pp.child_id = mm.child_id and pp.profile_id = mm.profile_id
                 left join profiles pr on pr.id = mm.profile_id
                where mm.child_id = c.id), '[]'::jsonb))
      into v_meta
      from children c
      left join child_member_prefs mp on mp.child_id = c.id and mp.profile_id = v_uid
     where c.id = b.id;
    v_hash := md5(v_meta::text);

    v_rows := '[]'::jsonb;
    v_n := 0;
    if v_budget = 0 then
      v_more := true;
      v_cursor := v_cur;
    else
      -- Own letters whole (any state); others' through book_entries (B F9 and the K-09 column allowlist).
      select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
             (array_agg(x.sx order by x.sx desc, x.id desc))[1],
             (array_agg(x.id order by x.sx desc, x.id desc))[1]
        into v_rows, v_n, v_last_x, v_last_i
        from (
          select p.sync_xid as sx, p.id,
                 case when p.author_id = v_uid then
                   jsonb_build_object(
                     'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id,
                     'author_signs_as', p.author_signs_as, 'kind', p.kind, 'occurred_on', p.occurred_on,
                     'captured_at', p.captured_at, 'capture_mode', p.capture_mode, 'edit_level', p.edit_level,
                     'prompt_key', p.prompt_key, 'prompt_library_version', p.prompt_library_version,
                     'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                     'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                     'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                     'audio_kept_on_device', p.audio_kept_on_device, 'language', p.language, 'created_at', p.created_at,
                     'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true)
                   -- F16-REQ-028: the v1.0 columns (a second object: jsonb_build_object takes at most 100 arguments).
                   || jsonb_build_object(
                     'occurred_precision', p.occurred_precision, 'base_direction', p.base_direction,
                     'author_edits', p.author_edits, 'locked_spans', p.locked_spans, 'pack_ref', p.pack_ref)
                 else
                   (select to_jsonb(be) - 'search' from book_entries be where be.id = p.id) || jsonb_build_object('own', false)
                 end || jsonb_build_object('v', p.sync_xid::text) as j
            from (
              select e.* from entries e
               where e.child_id = b.id
                 and (e.sync_xid, e.id) > (v_after_x, v_after_i)
                 and e.sync_xid < v_xmin
                 and (e.author_id = v_uid or exists (select 1 from book_entries be where be.id = e.id))
               order by e.sync_xid, e.id
               limit v_budget
            ) p
        ) x;
      v_more := v_n = v_budget;
      v_budget := v_budget - v_n;
      v_cursor := case when v_more then v_last_x::text || ':' || v_last_i::text
                       else v_xmin::text || ':' || c_zero::text end;
    end if;
    v_any_more := v_any_more or v_more;

    v_book := jsonb_build_object('id', b.id, 'access', v_access, 'repull', v_repull, 'meta_hash', v_hash,
                                 'rows', v_rows, 'cursor', v_cursor, 'more', v_more);
    if (v_req ->> 'meta') is distinct from v_hash then
      v_book := v_book || jsonb_build_object('meta', v_meta);
    end if;

    if not v_more then
      -- G-09: the real digest only when something the caller may know about changed:
      -- a row it may read now changed (v_n > 0 on this last page), or a row by
      -- someone else left what this caller's role could read (stamped by
      -- entries_unshared). A letter that was always private never counts.
      v_check := v_fresh or v_n > 0 or not (coalesce(v_req, '{}'::jsonb) ? 'have')
                 or coalesce((v_req ->> 'verify')::boolean, false) or coalesce((v_req ->> 'ids')::boolean, false)
                 or exists (select 1 from entries e
                             where e.child_id = b.id and (e.sync_xid, e.id) > (v_after_x, v_after_i) and e.sync_xid < v_xmin
                               and e.author_id <> v_uid
                               and case when b.role = 'parent'
                                          then e.left_parents_xid > v_after_x and e.left_parents_xid < v_xmin
                                        else b.family_can_read
                                          and e.left_family_xid > v_after_x and e.left_family_xid < v_xmin end);
      if v_check then
        select jsonb_build_object('n', count(*),
                                  'sum', (coalesce(sum(('x' || right(replace(s.id::text, '-', ''), 12))::bit(48)::bigint), 0) % c_mod)::bigint)
          into v_digest
          from (select e.id from entries e where e.child_id = b.id and e.author_id = v_uid
                union all
                select be.id from book_entries be where be.child_id = b.id and be.author_id <> v_uid) s;
      else
        v_digest := v_req -> 'have';
      end if;
      v_book := v_book || jsonb_build_object('visible', v_digest);
      if coalesce((v_req ->> 'ids')::boolean, false) then
        v_book := v_book || jsonb_build_object('ids', coalesce((
          select jsonb_agg(s.id order by s.id)
            from (select e.id from entries e where e.child_id = b.id and e.author_id = v_uid
                  union all
                  select be.id from book_entries be where be.child_id = b.id and be.author_id <> v_uid) s), '[]'::jsonb));
      end if;
    end if;
    v_books := v_books || jsonb_build_array(v_book);
  end loop;

  -- Books the phone asked about that the caller no longer reads: left, removed, or
  -- deleted. Only the caller's own letters still come down (for example the
  -- tombstones of "delete my letters and leave").
  for k, v_req in select key, value from jsonb_each(v_reqs) where key::uuid <> all(v_live) order by key loop
    v_cur := nullif(v_req ->> 'cursor', '');
    v_after_x := case when v_cur is null then '0'::xid8 else split_part(v_cur, ':', 1)::xid8 end;
    v_after_i := case when v_cur is null then c_zero else split_part(v_cur, ':', 2)::uuid end;
    v_rows := '[]'::jsonb;
    v_n := 0;
    if v_budget = 0 then
      v_more := true;
      v_cursor := v_cur;
    else
      select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
             (array_agg(x.sx order by x.sx desc, x.id desc))[1],
             (array_agg(x.id order by x.sx desc, x.id desc))[1]
        into v_rows, v_n, v_last_x, v_last_i
        from (
          select p.sync_xid as sx, p.id,
                 jsonb_build_object(
                   'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id,
                   'author_signs_as', p.author_signs_as, 'kind', p.kind, 'occurred_on', p.occurred_on,
                   'captured_at', p.captured_at, 'capture_mode', p.capture_mode, 'edit_level', p.edit_level,
                   'prompt_key', p.prompt_key, 'prompt_library_version', p.prompt_library_version,
                   'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                   'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                   'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                   'audio_kept_on_device', p.audio_kept_on_device, 'language', p.language, 'created_at', p.created_at,
                   'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true,
                   'v', p.sync_xid::text)
                 || jsonb_build_object(
                   'occurred_precision', p.occurred_precision, 'base_direction', p.base_direction,
                   'author_edits', p.author_edits, 'locked_spans', p.locked_spans, 'pack_ref', p.pack_ref) as j
            from (
              select e.* from entries e
               where e.child_id = k::uuid and e.author_id = v_uid
                 and (e.sync_xid, e.id) > (v_after_x, v_after_i)
                 and e.sync_xid < v_xmin
               order by e.sync_xid, e.id
               limit v_budget
            ) p
        ) x;
      v_more := v_n = v_budget;
      v_budget := v_budget - v_n;
      v_cursor := case when v_more then v_last_x::text || ':' || v_last_i::text
                       else v_xmin::text || ':' || c_zero::text end;
    end if;
    v_any_more := v_any_more or v_more;
    v_gone := v_gone || jsonb_build_array(jsonb_build_object(
      'id', k,
      'reason', case when exists (select 1 from child_members m join children c on c.id = m.child_id
                                   where m.child_id = k::uuid and m.profile_id = v_uid and c.deleted_at is not null)
                     then 'deleted' else 'not_member' end,
      'rows', v_rows, 'cursor', v_cursor, 'more', v_more));
  end loop;

  return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                            'books', v_books, 'gone', v_gone, 'more', v_any_more);
end;
$$;

comment on function public.sync_pull(jsonb, int) is
  'Multi-book cursor pull (20261004100000). Digest rule (20261015000000, G-09): the real digest of what the caller may hold is computed on a first pull, on request (verify, ids, no have), when a readable row changed since the cursor, or when a row by someone else left what the caller''s role could read since the cursor; otherwise the phone''s own value is echoed. Writes the caller cannot read never change the answer. Own rows carry the v1.0 wire-contract columns (20261015030000).';

-- ─── 5. sync_push: the op parser takes the new columns (F16-REQ-028) ─────
-- From 20261015000000. Changes, all marked F16-REQ-028:
--   insert: the five entries columns (defaults when absent);
--   update: occurred_precision with the occurred_on group, author_edits and
--     locked_spans with the text group, base_direction with the text or language
--     group, each only when the op data carries the key (an older app never
--     clears them); pack_ref is passed through only when sent, so the guard
--     records it once on a letter that has none, refuses a different value or a
--     clear (SCIMM), and an older app that never sends it changes nothing;
--   prefs.upsert: notify_letters (20261015020000).
create or replace function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = pg_catalog, public, pg_temp
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  c_groups constant text[] := array['text', 'in_book', 'sounds_like_me', 'occurred_on', 'language'];
  v_epoch_at timestamptz;
  o jsonb;
  d jsonb;
  v_op uuid;
  v_type text;
  v_id uuid;
  v_changed text[];
  v_known timestamptz;
  v_deleted boolean;
  cur record;
  v_exists boolean;
  v_apply boolean;
  v_conflict boolean;
  v_new boolean;
  v_res jsonb;
  v_results jsonb := '[]'::jsonb;
  v_code text;
  v_detail text;
  v_ids uuid[];
begin
  if jsonb_typeof(p_ops) is distinct from 'array' or jsonb_array_length(p_ops) > 50 then
    raise exception 'push takes 0 to 50 ops' using errcode = '22023';
  end if;
  if octet_length(p_ops::text) > 262144 then
    raise exception 'push batch is over 256 KB' using errcode = '22023';
  end if;

  perform public.rate_hit('push');                -- 60 per minute per person (SCRAT)

  select e.started_at into v_epoch_at from sync_epochs e order by e.epoch desc limit 1;

  for o in select value from jsonb_array_elements(p_ops) loop
    v_res := '{}'::jsonb;
    begin
      if jsonb_typeof(o) is distinct from 'object' then
        raise exception 'op must be an object' using errcode = '22023';
      end if;
      v_op := (o ->> 'op')::uuid;
      v_type := o ->> 'type';
      v_id := (o ->> 'id')::uuid;
      d := coalesce(o -> 'data', '{}'::jsonb);
      if v_op is null or v_id is null or v_type is null or jsonb_typeof(d) <> 'object' then
        raise exception 'op, type, id and data are required' using errcode = '22023';
      end if;

      -- Idempotency key first: a retry of an applied op changes nothing and reports the current state.
      -- G-10: receipts are keyed by (person, op id) and written only by sync_op_claim().
      v_new := public.sync_op_claim(v_op);

      if not v_new then
        v_res := jsonb_build_object('dup', true);
        if v_type like 'entry.%' then
          v_res := v_res || coalesce(
            (select jsonb_build_object('entry', jsonb_build_object(
                      'id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at, 'deleted_at', e.deleted_at,
                      'in_book', e.in_book, 'approval', e.approval))
               from entries e where e.id = v_id),
            jsonb_build_object('missing', true));
        end if;
      else
        case v_type
        when 'entry.upsert', 'entry.reupload' then
          if o ? 'changed' then
            if jsonb_typeof(o -> 'changed') <> 'array' then
              raise exception 'changed must be an array' using errcode = '22023';
            end if;
            v_changed := array(select jsonb_array_elements_text(o -> 'changed'));
            if not v_changed <@ c_groups then
              raise exception 'unknown field group' using errcode = '22023';
            end if;
          else
            v_changed := c_groups;
          end if;
          select e.sync_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur
            from entries e where e.id = v_id;            -- RLS: the caller's own letters only
          v_exists := found;
          v_apply := true;
          v_conflict := false;
          v_deleted := false;
          if v_type = 'entry.reupload' then
            v_known := (o ->> 'known_at')::timestamptz;
            if v_known is null then
              raise exception 'known_at is required for a re-upload' using errcode = '22023';
            end if;
            v_deleted := coalesce((d ->> 'deleted')::boolean, false);
            v_changed := c_groups;
            if v_exists then
              v_apply := case when cur.sync_restored_from is not null then v_known > cur.sync_restored_from
                              else cur.updated_at < v_epoch_at and v_known > cur.updated_at end;
            end if;
          elsif v_exists and nullif(o ->> 'base', '') is not null then
            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;
          end if;

          if v_apply then
            if v_type = 'entry.reupload' then
              perform set_config('scribe.sync_reupload', 'on', true);
              if v_exists and cur.deleted_at is not null and not v_deleted then
                perform public.restore_entry(v_id);
              end if;
            end if;
            if not (v_exists and v_type = 'entry.reupload' and cur.deleted_at is not null and v_deleted) then
              insert into entries as e (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode,
                                        edit_level, prompt_key, engine_version, raw_transcript, machine_edits,
                                        final_text, in_book, sounds_like_me, author_signs_as, audio_kept_on_device,
                                        deleted_at, language,
                                        occurred_precision, base_direction, author_edits, locked_spans, pack_ref)
              values (v_id, (d ->> 'child_id')::uuid, v_uid, d ->> 'kind', (d ->> 'occurred_on')::date,
                      (d ->> 'captured_at')::timestamptz, d ->> 'capture_mode', coalesce(d ->> 'edit_level', 'clean'),
                      d ->> 'prompt_key', (d ->> 'engine_version')::int, d ->> 'raw_transcript',
                      coalesce(d -> 'machine_edits', '[]'::jsonb), d ->> 'final_text',
                      coalesce((d ->> 'in_book')::boolean, false), (d ->> 'sounds_like_me')::boolean,
                      nullif(d ->> 'author_signs_as', ''), coalesce((d ->> 'audio_kept_on_device')::boolean, false),
                      case when v_deleted then now() end, nullif(d ->> 'language', ''),
                      -- F16-REQ-028
                      coalesce(nullif(d ->> 'occurred_precision', ''), 'day'),
                      coalesce(nullif(d ->> 'base_direction', ''), 'ltr'),
                      case when jsonb_typeof(d -> 'author_edits') = 'null' then null else d -> 'author_edits' end,
                      case when jsonb_typeof(d -> 'locked_spans') = 'null' then null else d -> 'locked_spans' end,
                      nullif(d ->> 'pack_ref', ''))
              on conflict (id) do update set
                final_text = case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                machine_edits = case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                edit_level = case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                in_book = case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                sounds_like_me = case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                occurred_on = case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                language = case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                -- F16-REQ-028: each new field only with its group and only when the op carries it.
                occurred_precision = case when 'occurred_on' = any(v_changed) and d ? 'occurred_precision'
                                          then excluded.occurred_precision else e.occurred_precision end,
                base_direction = case when ('text' = any(v_changed) or 'language' = any(v_changed)) and d ? 'base_direction'
                                      then excluded.base_direction else e.base_direction end,
                author_edits = case when 'text' = any(v_changed) and d ? 'author_edits' then excluded.author_edits else e.author_edits end,
                locked_spans = case when 'text' = any(v_changed) and d ? 'locked_spans' then excluded.locked_spans else e.locked_spans end,
                -- Never changed: passed through so entries_guard refuses a different value (SCIMM).
                raw_transcript = excluded.raw_transcript,
                captured_at = excluded.captured_at,
                child_id = excluded.child_id,
                engine_version = excluded.engine_version,
                pack_ref = case when d ? 'pack_ref' then excluded.pack_ref else e.pack_ref end
              where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on,
                     e.raw_transcript, e.captured_at, e.child_id, e.engine_version, e.language,
                     e.occurred_precision, e.base_direction, e.author_edits, e.locked_spans, e.pack_ref)
                    is distinct from
                    (case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                     case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                     case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                     case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                     case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                     case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                     excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version,
                     case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                     case when 'occurred_on' = any(v_changed) and d ? 'occurred_precision'
                          then excluded.occurred_precision else e.occurred_precision end,
                     case when ('text' = any(v_changed) or 'language' = any(v_changed)) and d ? 'base_direction'
                          then excluded.base_direction else e.base_direction end,
                     case when 'text' = any(v_changed) and d ? 'author_edits' then excluded.author_edits else e.author_edits end,
                     case when 'text' = any(v_changed) and d ? 'locked_spans' then excluded.locked_spans else e.locked_spans end,
                     case when d ? 'pack_ref' then excluded.pack_ref else e.pack_ref end);
            end if;
            if v_type = 'entry.reupload' then
              if v_exists and cur.deleted_at is null and v_deleted then
                perform public.delete_entry(v_id);
              end if;
              update entries set sync_restored_from = v_known
               where id = v_id and sync_restored_from is distinct from v_known;
              perform set_config('scribe.sync_reupload', 'off', true);
            end if;
          end if;
          v_res := jsonb_build_object('applied', v_apply, 'conflict', v_conflict, 'entry',
            (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                       'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
               from entries e where e.id = v_id));

        when 'entry.delete' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.delete_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'entry.restore' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.restore_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'book.first_run' then
          v_ids := public.create_first_run_children(d -> 'children');
          v_res := jsonb_build_object('books', to_jsonb(v_ids));

        when 'book.create' then
          perform public.create_child(v_id, d ->> 'name', (d ->> 'date_of_birth')::date, (d ->> 'due_date')::date);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'book.update' then
          -- G-08: through book_update(), because the caller cannot read the birth date
          -- and due date columns that the merge compares.
          perform public.book_update(v_id, d);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'prefs.upsert' then
          if exists (select 1 from jsonb_object_keys(d) x where x not in ('signs_as', 'include_in_reminders', 'notify_letters')) then
            raise exception 'unknown preference' using errcode = '22023';
          end if;
          insert into child_member_prefs as p (child_id, profile_id, signs_as, include_in_reminders, notify_letters)
          values (v_id, v_uid, nullif(btrim(d ->> 'signs_as'), ''), coalesce((d ->> 'include_in_reminders')::boolean, true),
                  coalesce((d ->> 'notify_letters')::boolean, true))
          on conflict (child_id, profile_id) do update set
            signs_as = case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
            include_in_reminders = case when d ? 'include_in_reminders' then excluded.include_in_reminders
                                        else p.include_in_reminders end,
            notify_letters = case when d ? 'notify_letters' then excluded.notify_letters else p.notify_letters end
          where (p.signs_as, p.include_in_reminders, p.notify_letters) is distinct from
                (case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
                 case when d ? 'include_in_reminders' then excluded.include_in_reminders else p.include_in_reminders end,
                 case when d ? 'notify_letters' then excluded.notify_letters else p.notify_letters end);
          v_res := jsonb_build_object('prefs', jsonb_build_object('child_id', v_id));

        else
          raise exception 'unknown op type' using errcode = '22023';
        end case;
      end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object('op', v_op, 'ok', true) || v_res);
    exception when others then
      get stacked diagnostics v_code = returned_sqlstate, v_detail = pg_exception_detail;
      if v_code = 'SCCON' then
        -- Ops before this one are kept; this one and the rest wait for consent.
        return jsonb_build_object('results', v_results, 'paused', true, 'stopped', false, 'consent', v_detail);
      end if;
      -- G-11: a rate limit inside an op (create_child, the first-run batch,
      -- delete_entry, restore_entry) stops the batch like a transient error, so the
      -- phone backs off and retries that op later; it is never a permanent rejection.
      if v_code = 'SCRAT' or left(v_code, 2) in ('40', '53', '55', '57', '58', 'XX') then
        return jsonb_build_object('results', v_results, 'paused', false, 'stopped', true, 'code', v_code);
      end if;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('op', left(o ->> 'op', 36), 'ok', false, 'code', v_code)
        || case when v_code = 'SCDEL' and v_detail = 'purged' then jsonb_build_object('gone', true) else '{}'::jsonb end);
    end;
  end loop;

  -- Old receipts are trimmed by sync_housekeeping() (hourly), not here: clients no longer delete receipts.
  return jsonb_build_object('results', v_results, 'paused', false, 'stopped', false);
end;
$$;

-- ─── 6. Privileges ───────────────────────────────────────────────────────
-- dictionary_forms_valid backs a check constraint, which runs as the writer, so
-- signed-in people may execute it (pure, immutable, reads nothing).
revoke execute on function public.dictionary_forms_valid(jsonb) from public, anon;
grant execute on function public.dictionary_forms_valid(jsonb) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.dictionary_forms_valid(jsonb) to service_role';
  end if;
end;
$$;

-- ─── 7. Classification (docs/legal/DATA_CLASSIFICATION.md 4.1) ──────────
comment on column public.entries.occurred_precision is
  'L2 enum: whether occurred_on is a day or the first day of a month of age (F04-REQ-015); members read it';
comment on column public.entries.base_direction is
  'L2 layout enum (ltr or rtl), never the words; members read it';
comment on column public.entries.author_edits is
  'L4 the author''s own word changes against the machine-cleaned text (F06-REQ-026), author-only: never in book_entries';
comment on column public.entries.locked_spans is
  'L4 spans the author kept exactly as said (F06-REQ-031), author-only: never in book_entries';
comment on column public.entries.pack_ref is
  'L4 language pack used to clean the letter (lang@version), set once then immutable, author-only because it names the language';
comment on column public.book_entries.occurred_precision is 'L2 enum: day or month (entries.occurred_precision)';
comment on column public.book_entries.base_direction is 'L2 layout enum (entries.base_direction)';
comment on column public.dictionary_terms.forms is
  'L4 one form per script of a name or word, typed by a parent, each with its heard-as values (F07 section 11.2)';
