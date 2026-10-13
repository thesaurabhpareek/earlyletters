-- Privacy and limits fixes from the 4 Oct security review (fix wave, db-fix).
--
-- PENDING: not yet applied. Apply after 20261005000000_family_cap_language_idempotency.sql,
-- following supabase/APPLY.md (section "File 20261005100000"). Never edits an
-- earlier file; functions are redefined with CREATE OR REPLACE from their newest
-- version (sync_pull and sync_push from 20261005000000, changes marked G-xx).
--
-- G-08  Family members never read the child's birth date or due date (review M1,
--       DECISIONS D-039). Column privileges on public.children: signed-in people
--       may select every column except date_of_birth and due_date. Row access is
--       unchanged (members see their books' rows; RLS as before). Parents and
--       family get dates only from the security-definer reads that already apply
--       D-039: sync_pull() and sync_books() (parents: full dates; family:
--       birthday month and day). Writes are unchanged: parents still update any
--       column directly; sync_push's book.update now goes through
--       book_update(p_child, p_data) because its merge reads the two columns.
--       Effect on clients: `select *` (PostgREST select=* or no select list) on
--       children is refused with 42501; name the columns instead.
-- G-09  sync_pull's digest no longer reveals private activity (review M5). The
--       old changed-since check looked at every row in the book, so a deliberately
--       wrong "have" was echoed until someone wrote a private letter. The check now
--       counts only (a) rows the caller may read that changed since its cursor,
--       and (b) rows by others that left what the caller's role could read since
--       the cursor (new columns entries.left_parents_xid / left_family_xid, set by
--       the entries_unshared trigger in the transaction that made the row
--       unreadable: deleted, taken out of the book, withdrawn, set aside).
--       A letter that was never shared changes nothing the caller can observe.
--       Removal still works: a letter that leaves the book stamps its row, so the
--       phone gets the real digest and asks for the id list. The paragraph "The
--       digest is computed only when something in the book changed" in
--       20261004100000 is superseded by this one (see COMMENT ON FUNCTION below).
-- G-10  Op receipts are per person (review L1): primary key (profile_id, op_id);
--       clients can no longer insert or delete receipts; sync_push claims an op
--       through sync_op_claim() (security definer, the caller's own id only).
--       Old receipts are trimmed by sync_housekeeping() only.
-- G-11  Server limits (review M3, ADR 0017):
--         create_child / create_first_run_children: at most 20 new books per
--           person per rolling 24 hours (SCRAT). A retry of a book that already
--           exists is never limited. Inside sync_push, SCRAT stops the batch
--           ("stopped": true, "code": "SCRAT") instead of rejecting the op, so the
--           phone keeps the book and retries it after backoff: a first-run batch
--           (at most 6) or a book made offline is never refused for good.
--         delete_entry / restore_entry: 300 per person per hour (bucket
--           entry_state, through rate_hit()); also a batch stop inside sync_push.
--       rate_hit() gains the buckets entry_state (300 / hour) and apple_token
--       (10 / hour, for the apple-token Edge Function to call with the user's JWT).
-- G-12  The consent pepper fails closed (TDD 05 X-12, BL-334): deleting a profile
--       that has policy acceptances raises 55000 when app.consent_pepper is
--       missing or shorter than 32 characters, so the account deletion stops and
--       retries instead of storing reversible hashes. consent_pepper_ready()
--       (service role) says whether it is set, without revealing it.
-- G-13  peek_invite(p_token) for "ask before joining" (review H2): before
--       accepting, returns {"inviter": <the inviter's sign-off name for that book,
--       or null>, "role": "parent" | "contributor"}, plus "joined": true when the
--       caller already accepted this invite. Never the child's name, ids or any
--       book data. Signed-in only, works before consent, same errors as
--       accept_child_invite (SCINV, SCCAP), counts in the membership bucket.
--
-- New SQLSTATEs: none (55000 for the pepper is a standard code, service paths only).
-- Reused: SCRAT, SCINV, SCCAP, SCPAR, SCCON, SCANO, P0002, 22023, 42501.

-- ─── 0. Rate buckets (G-11) ──────────────────────────────────────────────
alter table public.sync_rate_windows drop constraint if exists sync_rate_windows_bucket_check;
alter table public.sync_rate_windows add constraint sync_rate_windows_bucket_check
  check (bucket in ('pull', 'push', 'policy_actions', 'membership', 'entry_state', 'apple_token'));

create or replace function public.rate_hit(p_bucket text)
returns void language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_limit int;
  v_window interval;
  v_hits int;
begin
  select l.lim, l.win into v_limit, v_window
    from (values ('pull', 120, interval '1 minute'),
                 ('push', 60, interval '1 minute'),
                 ('policy_actions', 60, interval '1 hour'),
                 ('membership', 120, interval '1 hour'),
                 ('entry_state', 300, interval '1 hour'),
                 ('apple_token', 10, interval '1 hour')) as l(bucket, lim, win)
   where l.bucket = p_bucket;
  if not found then
    raise exception 'unknown rate bucket' using errcode = '22023';
  end if;
  insert into sync_rate_windows as w (profile_id, bucket, window_start, hits) values (v_uid, p_bucket, now(), 1)
  on conflict (profile_id, bucket) do update
     set hits = case when w.window_start <= now() - v_window then 1 else w.hits + 1 end,
         window_start = case when w.window_start <= now() - v_window then now() else w.window_start end
  returning hits into v_hits;
  if v_hits > v_limit then
    raise exception 'too many requests' using errcode = 'SCRAT';
  end if;
end;
$$;

-- ─── 1. G-08: birth date and due date are not readable from the table ────
-- Column privileges replace the table-wide SELECT that Supabase grants by
-- default. A column added to children later is not readable until granted
-- (fail closed); grant it here-style in the migration that adds it.
revoke select on public.children from anon, authenticated;
grant select (id, name, nickname, created_by, created_at, updated_at, deleted_at, deletion_request_id,
              photo_path, book_look, family_can_read, hidden_at)
  on public.children to authenticated;

-- Book settings from sync_push (op book.update). Same fields, checks and order
-- as a direct update by the caller: unknown field 22023, not a member P0002,
-- consent SCCON (children_consent_gate), not a parent SCPAR (children_guard).
-- Runs as the owner so it can compare the date columns; the triggers' client
-- checks are therefore made here explicitly.
create or replace function public.book_update(p_child uuid, p_data jsonb)
returns void language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  d jsonb := coalesce(p_data, '{}'::jsonb);
begin
  if jsonb_typeof(d) <> 'object' then
    raise exception 'book data must be an object' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(d) x
              where x not in ('name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read')) then
    raise exception 'unknown book field' using errcode = '22023';
  end if;
  if p_child is null or not public.is_child_member(p_child) then
    raise exception 'book not found' using errcode = 'P0002';
  end if;
  perform public.require_content_consent();
  if not public.is_child_parent(p_child) then
    raise exception 'children: only a parent can change book settings' using errcode = 'SCPAR';
  end if;
  update children c set
    name = case when d ? 'name' then d ->> 'name' else c.name end,
    nickname = case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
    date_of_birth = case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
    due_date = case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
    family_can_read = case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end
  where c.id = p_child
    and (c.name, c.nickname, c.date_of_birth, c.due_date, c.family_can_read) is distinct from
        (case when d ? 'name' then d ->> 'name' else c.name end,
         case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
         case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
         case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
         case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end);
end;
$$;

-- ─── 2. G-09: when a letter stops being readable by others ───────────────
-- Parents read others' letters that are live and in the book, or waiting for
-- review / set aside; family (with "Family can read") read live in-book letters
-- (book_entries, B F9). The stamp is the id of the transaction that took the
-- row out of that set; it never changes otherwise and clients cannot set it.
alter table public.entries add column if not exists left_parents_xid xid8;
alter table public.entries add column if not exists left_family_xid xid8;

create or replace function public.entries_unshared()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  if tg_op = 'INSERT' then
    new.left_parents_xid := null;
    new.left_family_xid := null;
    return new;
  end if;
  new.left_parents_xid := old.left_parents_xid;
  new.left_family_xid := old.left_family_xid;
  if old.deleted_at is null and (old.in_book or old.approval in ('pending', 'set_aside'))
     and not (new.deleted_at is null and (new.in_book or new.approval in ('pending', 'set_aside'))) then
    new.left_parents_xid := pg_current_xact_id();
  end if;
  if old.deleted_at is null and old.in_book and not (new.deleted_at is null and new.in_book) then
    new.left_family_xid := pg_current_xact_id();
  end if;
  return new;
end;
$$;
-- Named to fire after every other BEFORE trigger on entries (alphabetical order),
-- so it sees the final deleted_at, in_book and approval.
create trigger entries_unshared before insert or update on public.entries
  for each row execute function public.entries_unshared();

-- sync_pull: from 20261005000000, only the digest check changed (G-09).
create or replace function public.sync_pull(p_since jsonb default '{}'::jsonb, p_limit int default 200)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_catalog
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
                   'v', p.sync_xid::text) as j
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
  'Multi-book cursor pull (20261004100000). Digest rule (20261005100000, G-09): the real digest of what the caller may hold is computed on a first pull, on request (verify, ids, no have), when a readable row changed since the cursor, or when a row by someone else left what the caller''s role could read since the cursor; otherwise the phone''s own value is echoed. Writes the caller cannot read never change the answer.';

-- ─── 3. G-10: op receipts per person ─────────────────────────────────────
alter table public.sync_op_receipts drop constraint sync_op_receipts_pkey;
alter table public.sync_op_receipts add constraint sync_op_receipts_pkey primary key (profile_id, op_id);
-- The own-row insert and delete policies stay but no longer grant anything.
revoke insert, update, delete, truncate on public.sync_op_receipts from anon, authenticated;

-- Claims an op id for the caller. True when new (apply the op), false for a
-- repeat. Another person's ids cannot collide with the caller's. Calling it
-- directly only spends the caller's own op ids.
create or replace function public.sync_op_claim(p_op uuid)
returns boolean language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  if p_op is null then
    raise exception 'op id is required' using errcode = '22023';
  end if;
  insert into sync_op_receipts (op_id, profile_id) values (p_op, v_uid) on conflict (profile_id, op_id) do nothing;
  return found;
end;
$$;

-- sync_push: from 20261005000000 except (a) receipts through sync_op_claim() (G-10),
-- (b) book.update through book_update() (G-08), (c) SCRAT stops the batch (G-11),
-- (d) no receipt trimming here (sync_housekeeping does it).
create or replace function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = public, pg_catalog
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
                                        deleted_at, language)
              values (v_id, (d ->> 'child_id')::uuid, v_uid, d ->> 'kind', (d ->> 'occurred_on')::date,
                      (d ->> 'captured_at')::timestamptz, d ->> 'capture_mode', coalesce(d ->> 'edit_level', 'clean'),
                      d ->> 'prompt_key', (d ->> 'engine_version')::int, d ->> 'raw_transcript',
                      coalesce(d -> 'machine_edits', '[]'::jsonb), d ->> 'final_text',
                      coalesce((d ->> 'in_book')::boolean, false), (d ->> 'sounds_like_me')::boolean,
                      nullif(d ->> 'author_signs_as', ''), coalesce((d ->> 'audio_kept_on_device')::boolean, false),
                      case when v_deleted then now() end, nullif(d ->> 'language', ''))
              on conflict (id) do update set
                final_text = case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                machine_edits = case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                edit_level = case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                in_book = case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                sounds_like_me = case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                occurred_on = case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                language = case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                -- Never changed: passed through so entries_guard refuses a different value (SCIMM).
                raw_transcript = excluded.raw_transcript,
                captured_at = excluded.captured_at,
                child_id = excluded.child_id,
                engine_version = excluded.engine_version
              where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on,
                     e.raw_transcript, e.captured_at, e.child_id, e.engine_version, e.language)
                    is distinct from
                    (case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                     case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                     case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                     case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                     case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                     case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                     excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version,
                     case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end);
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
          if exists (select 1 from jsonb_object_keys(d) x where x not in ('signs_as', 'include_in_reminders')) then
            raise exception 'unknown preference' using errcode = '22023';
          end if;
          insert into child_member_prefs as p (child_id, profile_id, signs_as, include_in_reminders)
          values (v_id, v_uid, nullif(btrim(d ->> 'signs_as'), ''), coalesce((d ->> 'include_in_reminders')::boolean, true))
          on conflict (child_id, profile_id) do update set
            signs_as = case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
            include_in_reminders = case when d ? 'include_in_reminders' then excluded.include_in_reminders
                                        else p.include_in_reminders end
          where (p.signs_as, p.include_in_reminders) is distinct from
                (case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
                 case when d ? 'include_in_reminders' then excluded.include_in_reminders else p.include_in_reminders end);
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

-- From 20261005000000 except receipts are deleted by their (person, op id) key.
create or replace function public.sync_housekeeping(p_now timestamptz default now(), p_limit int default 10000)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_receipts int;
  v_windows int;
  v_keys int;
  v_lim int := greatest(coalesce(p_limit, 10000), 1);
begin
  delete from sync_op_receipts r
   where (r.profile_id, r.op_id) in (select x.profile_id, x.op_id from sync_op_receipts x
                                      where x.applied_at < p_now - interval '30 days'
                                      order by x.applied_at limit v_lim);
  get diagnostics v_receipts = row_count;
  delete from sync_rate_windows where window_start < p_now - interval '1 day';
  get diagnostics v_windows = row_count;
  delete from idempotency_keys k
   where (k.profile_id, k.idem_key) in (select x.profile_id, x.idem_key from idempotency_keys x
                                         where x.created_at < p_now - interval '24 hours'
                                         order by x.created_at limit v_lim);
  get diagnostics v_keys = row_count;
  return jsonb_build_object('receipts', v_receipts, 'rate_windows', v_windows, 'idempotency_keys', v_keys,
                            'more', v_receipts >= v_lim or v_keys >= v_lim);
end;
$$;

-- ─── 4. G-11: books per day, letter delete and restore ──────────────────
-- From 20261004000000 plus the daily limit. The count is exact (books this
-- person created in the last 24 hours, deleted ones included), so no counter
-- can drift. A retry of an existing book returns before the limit.
create or replace function public.create_child(p_id uuid, p_name text, p_date_of_birth date default null,
                                               p_due_date date default null)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  -- One person's creates stay serialised (a retry racing the first call returns the same id).
  perform 1 from profiles where id = v_uid for update;
  if not exists (select 1 from children where id = p_id and created_by = v_uid) then
    perform public.require_content_consent();
    if (select count(*) from children where created_by = v_uid and created_at > now() - interval '24 hours') >= 20 then
      raise exception 'too many new books today' using errcode = 'SCRAT', detail = '20';
    end if;
  end if;
  return public.create_child_row(v_uid, p_id, p_name, p_date_of_birth, p_due_date);
end;
$$;

-- From 20261004000000 plus the same limit, counting only the books in the batch
-- that do not exist yet (a replay of the same batch is free). A first run has at
-- most 6 books, so it passes unless the person already started 15 or more today.
create or replace function public.create_first_run_children(p_children jsonb)
returns uuid[] language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_ids uuid[] := '{}';
  v_new int;
  r record;
begin
  if jsonb_typeof(p_children) is distinct from 'array'
     or jsonb_array_length(p_children) not between 1 and 6 then
    raise exception 'first run takes 1 to 6 children' using errcode = '22023';
  end if;
  perform 1 from profiles where id = v_uid for update;
  perform public.require_content_consent();
  select count(*) into v_new
    from jsonb_to_recordset(p_children) as x(id uuid)
   where not exists (select 1 from children c where c.id = x.id and c.created_by = v_uid);
  if v_new > 0
     and (select count(*) from children where created_by = v_uid and created_at > now() - interval '24 hours') + v_new > 20 then
    raise exception 'too many new books today' using errcode = 'SCRAT', detail = '20';
  end if;
  for r in select * from jsonb_to_recordset(p_children) as x(id uuid, name text, date_of_birth date, due_date date)
  loop
    v_ids := v_ids || public.create_child_row(v_uid, r.id, r.name, r.date_of_birth, r.due_date);
  end loop;
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = v_uid;
  return v_ids;
end;
$$;

-- From 20261003000000 plus 300 calls per person per hour (bucket entry_state).
create or replace function public.delete_entry(p_entry uuid)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  perform public.rate_hit('entry_state');
  if not exists (select 1 from entries where id = p_entry and author_id = v_uid) then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  update entries set deleted_at = now(), deleted_reason = 'user' where id = p_entry and deleted_at is null;
  return true;
end;
$$;

create or replace function public.restore_entry(p_entry uuid)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user(); v entries%rowtype;
begin
  perform public.rate_hit('entry_state');
  select * into v from entries where id = p_entry for update;
  if not found or v.author_id is distinct from v_uid then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  if v.deleted_at is null then return true; end if;
  if v.deleted_reason = 'account_deletion' then
    raise exception 'cancel the account deletion to restore these letters' using errcode = 'SCDEL';
  end if;
  if not public.child_is_live(v.child_id) then
    raise exception 'restore the book first' using errcode = 'SCDEL';
  end if;
  update entries set deleted_at = null where id = p_entry;
  return true;
end;
$$;

-- ─── 5. G-12: the consent pepper fails closed ────────────────────────────
-- From 20261002020000. The hash input is unchanged (id || pepper as set), so
-- hashes stay comparable with any made before.
create or replace function public.policy_acceptances_pseudonymise()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_pepper text := coalesce(current_setting('app.consent_pepper', true), '');
begin
  if not exists (select 1 from policy_acceptances where profile_id = old.id) then
    return old;
  end if;
  if char_length(btrim(v_pepper)) < 32 then
    raise exception 'app.consent_pepper is missing or shorter than 32 characters; set it before deleting accounts (supabase/APPLY.md step 6)'
      using errcode = '55000',
            hint = 'alter database postgres set app.consent_pepper = ''<openssl rand -hex 32>''; then retry the deletion';
  end if;
  update policy_acceptances
     set subject_hash = sha256(convert_to(old.id::text || v_pepper, 'UTF8')),
         pseudonymised_at = now(),
         profile_id = null
   where profile_id = old.id;
  return old;
end;
$$;

-- Service role (APPLY.md checks, ops health): true when the pepper is usable. Never returns it.
create or replace function public.consent_pepper_ready()
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32;
$$;

-- ─── 6. G-13: look at an invite before joining ───────────────────────────
-- Same checks, in the same order, as accept_child_invite (20261005000000), but
-- nothing is written except the rate counter, and no consent is needed: the
-- person decides whether to join before agreeing to anything. A call that ends
-- in an error rolls its counter hit back with it (Postgres has no autonomous
-- writes); a token has 244 random bits, so guessing is not the risk this limits.
create or replace function public.peek_invite(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_inv child_invites%rowtype;
  v_name text;
  v_joined boolean := false;
begin
  perform public.rate_hit('membership');
  select * into v_inv from child_invites where token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  if v_inv.accepted_by = v_uid then
    v_joined := true;
  else
    if v_inv.accepted_at is not null then raise exception 'invite already used' using errcode = 'SCINV'; end if;
    if v_inv.revoked_at is not null then raise exception 'invite revoked' using errcode = 'SCINV'; end if;
    if v_inv.expires_at < now() then raise exception 'invite expired' using errcode = 'SCINV'; end if;
    if not public.child_is_live(v_inv.child_id) then raise exception 'invite not found' using errcode = 'SCINV'; end if;
    if exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = v_uid) then
      raise exception 'already a member of this book' using errcode = 'SCINV';
    end if;
    if not exists (select 1 from child_members
                    where child_id = v_inv.child_id and profile_id = v_inv.invited_by and role = 'parent') then
      raise exception 'invite not found' using errcode = 'SCINV';
    end if;
    if v_inv.role = 'parent'
       and (select count(*) from child_members where child_id = v_inv.child_id and role = 'parent') >= public.max_parents_per_book() then
      raise exception 'this book already has the most parents allowed'
        using errcode = 'SCCAP', detail = public.max_parents_per_book()::text;
    end if;
  end if;
  -- The inviter's sign-off for this book: their own setting for it, else the
  -- signature they joined with, else their profile default (as sync_pull lists members).
  select coalesce(pp.signs_as,
                  (select i.signs_as from child_invites i
                    where i.child_id = v_inv.child_id and i.accepted_by = v_inv.invited_by
                    order by i.accepted_at desc limit 1),
                  pr.signs_as)
    into v_name
    from profiles pr
    left join child_member_prefs pp on pp.child_id = v_inv.child_id and pp.profile_id = pr.id
   where pr.id = v_inv.invited_by;
  return jsonb_build_object('inviter', v_name, 'role', v_inv.role)
         || case when v_joined then jsonb_build_object('joined', true) else '{}'::jsonb end;
end;
$$;

-- ─── 7. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.entries_unshared() from public, anon, authenticated;
revoke execute on function public.consent_pepper_ready() from public, anon, authenticated;
revoke execute on function public.policy_acceptances_pseudonymise() from public, anon, authenticated;

-- RPCs (each starts with require_user()). book_update and sync_op_claim are
-- callable because sync_push runs as the caller; each acts only for the caller.
revoke execute on function public.book_update(uuid, jsonb) from public, anon;
revoke execute on function public.sync_op_claim(uuid) from public, anon;
revoke execute on function public.peek_invite(text) from public, anon;
grant execute on function public.book_update(uuid, jsonb) to authenticated;
grant execute on function public.sync_op_claim(uuid) to authenticated;
grant execute on function public.peek_invite(text) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.consent_pepper_ready() to service_role';
  end if;
end;
$$;

-- ─── 8. Classification (docs/legal/DATA_CLASSIFICATION.md 4.1) ──────────
comment on column public.entries.left_parents_xid is
  'L2 system version: transaction that took the letter out of what parents can read (sync digest, G-09)';
comment on column public.entries.left_family_xid is
  'L2 system version: transaction that took the letter out of what family can read (sync digest, G-09)';
comment on table public.sync_op_receipts is
  'Ids of applied sync ops per person (primary key profile_id, op_id), so a retried op is applied once. Written only by sync_op_claim(); 30 days.';
comment on table public.sync_rate_windows is
  'Per-person request counters for server-side rate limits (sync pull and push, policy reads, membership changes and invite looks, letter delete and restore, Apple token exchange). Written only by rate_hit(); unlogged.';
comment on column public.children.date_of_birth is
  'L4 child birthday; not selectable by API roles (G-08): parents read it through sync_pull / sync_books, family get month and day only';
comment on column public.children.due_date is
  'L4 due date (consumer health data, PRD K-25); not selectable by API roles (G-08): parents read it through sync_pull / sync_books';
