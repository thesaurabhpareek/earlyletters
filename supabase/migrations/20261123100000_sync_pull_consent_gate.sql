-- FR-PRV-20: sync_pull serves no content rows without current consent (data-architect).
--
-- Before: sync_pull checked only the session (require_user) and the rate limit, so a parent who withdrew
-- sensitive-data (my_sync_gate().content_allowed = false) still pulled every letter and the child's name
-- (docs/qa/test-plan-b13/07-security-privacy-compliance.md T7-22, a GAP). After: when terms are not current,
-- the age attestation is missing or sensitive-data is not given, the pull returns an empty page (see the
-- comment in the body) for the caller's own rows and other members' rows alike.
--
-- Unchanged on purpose (T7-23): export and request_account_deletion read and write no sync_pull path and
-- stay open without consent; entries RLS, sync_push (already SCCON on content) and every other function.
-- Same signature, SECURITY DEFINER, pinned search_path. The body is 20261016000000 section 10 plus the gate.
-- sync_books gets the same gate further down (closed: first_run_open, book id, role, name, members' role/is_me/signs_as only).
-- Rollback: re-create sync_pull from 20261016000000 section 10 and sync_books from 20261015000000 section 5.

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
  -- The held-draft switch (ADR 0025 section 9, coordinator's fallback for the alpha): with
  -- app.held_sync = 'off' the pull never carries the held section, even when asked, so a
  -- phone keeps its held drafts to itself (as in build 1) while letters still sync.
  v_since jsonb := case when coalesce(current_setting('app.held_sync', true), '') = 'off'
                        then coalesce(p_since, '{}'::jsonb) - 'held' else coalesce(p_since, '{}'::jsonb) end;
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
  -- WP-F16-17: the held section (only for a request that carries `held`).
  v_held jsonb;
  v_hcur text;
  v_hafter_x xid8 := '0';
  v_hafter_i uuid := c_zero;
  v_hrows jsonb;
  v_hn int;
  v_hlast_x xid8;
  v_hlast_i uuid;
  v_hmore boolean;
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

  -- WP-F16-17: the author's held drafts, one cursor for all books (ADR 0025 section 9). Same cursor rules.
  if v_since ? 'held' then
    v_held := v_since -> 'held';
    begin
      if jsonb_typeof(v_held) not in ('object', 'null') then raise exception 'bad request'; end if;
      v_hcur := nullif(v_held ->> 'cursor', '');
      if v_hcur is not null then
        if array_length(string_to_array(v_hcur, ':'), 1) <> 2 then raise exception 'bad cursor'; end if;
        v_hafter_x := split_part(v_hcur, ':', 1)::xid8;
        v_hafter_i := split_part(v_hcur, ':', 2)::uuid;
      end if;
    exception when others then
      raise exception 'bad held request' using errcode = '22023';
    end;
    if v_hafter_x > v_xmax then
      return jsonb_build_object('reset', true, 'reason', 'cursor_ahead', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
    end if;
  end if;

  -- FR-PRV-20 (founder ruling): without current consent the server returns no content rows. The gate is the
  -- one every content write uses (terms current, age attested, sensitive-data given: content_gate_state, the
  -- same three facts as my_sync_gate().content_allowed and can_write_content()). Placed after the epoch and
  -- cursor checks so a reset answer is unchanged. The answer is a normal, empty page: no books (so no child
  -- profile fields, no members, no letters of the caller's own or anyone else's), no left-book letters, an
  -- empty held section, more = false. The phone merges nothing and keeps its local copy; no per-book cursor
  -- moves, and the held cursor is echoed, not advanced, so nothing is skipped once consent returns.
  -- `withheld` is an additive key an older phone ignores. Not an error: an error would read as a server
  -- fault and a reset would start a restore.
  if not coalesce((select g.terms_current and g.age_attested and g.sensitive_data
                     from public.content_gate_state(v_uid) g), false) then
    return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                              'books', '[]'::jsonb, 'gone', '[]'::jsonb, 'more', false, 'withheld', 'consent')
           || case when v_since ? 'held'
                   then jsonb_build_object('held', jsonb_build_object('rows', '[]'::jsonb, 'more', false, 'cursor', v_hcur))
                   else '{}'::jsonb end;
  end if;

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
                     'author_edits', p.author_edits, 'locked_spans', p.locked_spans, 'pack_ref', p.pack_ref,
                     'words_reviewed_at', p.words_reviewed_at)
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
                 -- WP-F16-13: a letter erased since the cursor, by this caller, or one that left
                 -- this caller's role's view since the cursor (review L 1: never a private one,
                 -- the purge of one that had already left, or a held draft of someone else).
                 or exists (select 1 from sync_private.entry_erasures x
                             where x.child_id = b.id and x.sync_xid > v_after_x and x.sync_xid < v_xmin
                               and (x.author_id = v_uid
                                    or case when b.role = 'parent'
                                              then x.left_parents_xid > v_after_x and x.left_parents_xid < v_xmin
                                            else b.family_can_read
                                              and x.left_family_xid > v_after_x and x.left_family_xid < v_xmin end))
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
                   'author_edits', p.author_edits, 'locked_spans', p.locked_spans, 'pack_ref', p.pack_ref,
                   'words_reviewed_at', p.words_reviewed_at) as j
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

  if v_since ? 'held' then
    -- Own rows while a parent of the book; markers ('discarded', 'kept', 'erased') only for a phone that
    -- pulled before (a fresh pull has nothing to drop). Ids, versions and the author's own words only.
    select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
           (array_agg(x.sx order by x.sx desc, x.id desc))[1], (array_agg(x.id order by x.sx desc, x.id desc))[1]
      into v_hrows, v_hn, v_hlast_x, v_hlast_i
      from (
        select * from (
          select h.sync_xid as sx, h.id,
                 (to_jsonb(h) - 'author_id' - 'sync_xid' - 'text_xid') || jsonb_build_object('v', h.sync_xid::text) as j
            from held_drafts h
           where h.author_id = v_uid
             and exists (select 1 from child_members m where m.child_id = h.child_id and m.profile_id = v_uid and m.role = 'parent')
          union all
          select g.sync_xid, g.id, jsonb_build_object('id', g.id, 'gone', g.gone, 'updated_at', g.updated_at, 'v', g.sync_xid::text)
            from held_drafts_gone g
           where g.author_id = v_uid and v_hcur is not null
        ) a
         where (a.sx, a.id) > (v_hafter_x, v_hafter_i) and a.sx < v_xmin
         order by a.sx, a.id
         limit p_limit
      ) x;
    v_hmore := v_hn = p_limit;
    v_any_more := v_any_more or v_hmore;
    return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                              'books', v_books, 'gone', v_gone, 'more', v_any_more,
                              'held', jsonb_build_object('rows', v_hrows, 'more', v_hmore,
                                                         'cursor', case when v_hmore then v_hlast_x::text || ':' || v_hlast_i::text
                                                                        else v_xmin::text || ':' || c_zero::text end));
  end if;
  return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                            'books', v_books, 'gone', v_gone, 'more', v_any_more);
end;
$$;

comment on function public.sync_pull(jsonb, int) is
  'Multi-book cursor pull (20261004100000, 20261016000000). FR-PRV-20 (this file): without current consent (terms, age attestation, sensitive-data) the answer is an empty page with withheld = consent: no books, no left-book letters, an empty held section, the held cursor echoed. Digest rule (20261015000000, G-09): the real digest of what the caller may hold is computed on a first pull, on request (verify, ids, no have), when a readable row changed since the cursor, when a row by someone else left what the caller''s role could read since the cursor, or when a letter of the book was erased since the cursor; otherwise the phone''s own value is echoed. Residual (REVIEW_R17_CHECKLIST 10): cursors and row versions are database transaction ids, so their spacing reflects all write traffic in the database; per-book versions are a sync ADR decision. Own rows carry the v1.0 wire-contract columns and the review mark; a request with `held` gets the author''s held drafts.';

revoke execute on function public.sync_pull(jsonb, int) from public, anon;
grant execute on function public.sync_pull(jsonb, int) to authenticated;

-- ─── sync_books: the same gate (Karma ruling, FR-PRV-20) ─────────────────────
-- Body is 20261015000000 section 5 plus the closed-gate branch above. Same signature, same grants (authenticated).
-- Rollback: re-create sync_books from 20261015000000 section 5.
create or replace function public.sync_books()
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  perform public.rate_hit('pull');                -- BL-332: 120 per minute per person (SCRAT)
  -- FR-PRV-20 (Karma ruling): the same gate as sync_pull (terms current, age attested, sensitive-data given).
  -- While it is closed the answer keeps only what the phone reads before consent or without it:
  --   first_run_open and the book count (the claim and new-phone steps, account-books.logic.ts classifyAccountBooks),
  --   and, per book, id, role, the child's name and the members' role, is_me and signs_as (the account-deletion
  --   "What happens" lines, account-deletion/logic.ts bookImpacts, which stay open without consent, T7-23).
  -- Dropped while closed: nickname, date of birth, birthday month and day, due date, family_can_read, created_by_me,
  -- joined_at, auto_add, my_signs_as, invites, and each member's profile_id, joined_at and auto_add.
  if not coalesce((select g.terms_current and g.age_attested and g.sensitive_data
                     from public.content_gate_state(v_uid) g), false) then
    return jsonb_build_object(
      'epoch', (select max(e.epoch) from sync_epochs e),
      'first_run_open', coalesce((select p.first_run_closed_at is null from profiles p where p.id = v_uid), true),
      'withheld', 'consent',
      'books', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', c.id,
                 'role', m.role,
                 'name', c.name,
                 'members', coalesce((
                   select jsonb_agg(jsonb_build_object(
                            'role', mm.role,
                            'is_me', mm.profile_id = v_uid,
                            'signs_as', coalesce(pp.signs_as,
                                                 (select i.signs_as from child_invites i
                                                   where i.child_id = c.id and i.accepted_by = mm.profile_id
                                                   order by i.accepted_at desc limit 1),
                                                 pr.signs_as))
                            order by mm.joined_at)
                     from child_members mm
                     left join child_member_prefs pp on pp.child_id = mm.child_id and pp.profile_id = mm.profile_id
                     left join profiles pr on pr.id = mm.profile_id
                    where mm.child_id = c.id), '[]'::jsonb))
               order by m.joined_at, c.id)
          from child_members m
          join children c on c.id = m.child_id and c.deleted_at is null
         where m.profile_id = v_uid), '[]'::jsonb));
  end if;
  return jsonb_build_object(
    'epoch', (select max(e.epoch) from sync_epochs e),
    'first_run_open', coalesce((select p.first_run_closed_at is null from profiles p where p.id = v_uid), true),
    'books', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id,
               'role', m.role,
               'name', c.name,
               'nickname', c.nickname,
               'date_of_birth', case when m.role = 'parent' then c.date_of_birth end,
               'birthday_md', to_char(c.date_of_birth, 'MM-DD'),
               'due_date', case when m.role = 'parent' then c.due_date end,
               'family_can_read', c.family_can_read,
               'created_by_me', c.created_by is not distinct from v_uid,
               'joined_at', m.joined_at,
               'auto_add', m.auto_add_letters,
               'my_signs_as', coalesce(mp.signs_as,
                                       (select i.signs_as from child_invites i
                                         where i.child_id = c.id and i.accepted_by = v_uid
                                         order by i.accepted_at desc limit 1)),
               'members', (
                 select jsonb_agg(jsonb_build_object(
                          'profile_id', mm.profile_id,
                          'role', mm.role,
                          'is_me', mm.profile_id = v_uid,
                          'joined_at', mm.joined_at,
                          'auto_add', case when m.role = 'parent' then mm.auto_add_letters end,
                          'signs_as', coalesce(pp.signs_as,
                                               (select i.signs_as from child_invites i
                                                 where i.child_id = c.id and i.accepted_by = mm.profile_id
                                                 order by i.accepted_at desc limit 1),
                                               pr.signs_as))
                          order by mm.joined_at)
                   from child_members mm
                   left join child_member_prefs pp on pp.child_id = mm.child_id and pp.profile_id = mm.profile_id
                   left join profiles pr on pr.id = mm.profile_id
                  where mm.child_id = c.id),
               'invites', case when m.role = 'parent' then coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'id', i.id, 'role', i.role, 'signs_as', i.signs_as,
                          'created_at', i.created_at, 'expires_at', i.expires_at,
                          'status', case when i.expires_at < now() then 'expired' else 'open' end)
                          order by i.created_at desc)
                   from child_invites i
                  where i.child_id = c.id and i.accepted_at is null and i.revoked_at is null
                    and i.expires_at > now() - interval '14 days'), '[]'::jsonb) end)
             order by m.joined_at, c.id)
        from child_members m
        join children c on c.id = m.child_id and c.deleted_at is null
        left join child_member_prefs mp on mp.child_id = c.id and mp.profile_id = v_uid
       where m.profile_id = v_uid), '[]'::jsonb));
end;
$$;

comment on function public.sync_books() is
  'Book list for the signed-in person (20261015000000 section 5). FR-PRV-20 (this file): without current consent the answer is first_run_open, withheld = consent and per book only id, role, name and members (role, is_me, signs_as).';

revoke execute on function public.sync_books() from public, anon;
grant execute on function public.sync_books() to authenticated;
