-- Sync v1.0: outbox push and cursor pull on the phone's SQLite, no sync vendor
-- (founder decision 3 Oct 2026: no PowerSync; DECISIONS D-023 as decided).
--
-- PENDING: not yet applied. Apply after 20261003020000_purge_batching.sql
-- (uses require_user(), book_entries with the B F9 rule, entries.approval).
--
-- What this adds
--  1. entries.sync_xid: the id of the transaction that last wrote the row
--     (xid8, set by trigger on every insert and update, any role). It is the
--     server version a phone compares, and the pull cursor.
--  2. sync_pull_book(child, cursor, limit, digest, want_ids): one book's
--     letters that changed since the cursor. The caller's own letters come
--     whole (raw transcript included, tombstones included). Everyone else's
--     come from book_entries, so the B F9 visibility rule and the K-09 column
--     allowlist live in exactly one place (no raw transcript, machine edits or
--     STT metadata of other authors ever leaves the server).
--  3. sync_push_entries(rows): one idempotent upsert per batch (max 50) keyed by
--     the device's UUIDv7. SECURITY INVOKER: RLS, the immutability guard, the
--     family approval rules and the consent gate run exactly as for a direct
--     write. A per-row error does not stop the batch; SCCON stops it and says
--     "paused" so the phone keeps the ops and shows the consent sheet.
--  4. sync_books(): the caller's live books with role, members and (parents
--     only) open invites, in one call. Contributors get the birthday month and
--     day only, never the year or the due date (DECISIONS D-039).
--
-- Why a transaction id and not a sequence or updated_at
-- A sequence value is taken when a row is written but becomes visible only at
-- commit, so a reader can see 101 before 100 commits and skip 100 forever.
-- The pull returns only rows whose transaction is older than the oldest one
-- still running (pg_snapshot_xmin of the current snapshot): that prefix can no
-- longer change, so no committed row is ever skipped. A long write transaction
-- only delays sync; it never loses a row. Cursor = "<epoch>:<xid8>:<uuid>".
--
-- Restores (TDD 06 P-1). After a database restore the transaction counter can
-- be behind the phones' cursors. Two guards make the phone start over instead
-- of missing rows: a cursor ahead of the server's next transaction id, and an
-- epoch the founder bumps after any restore:
--   alter database postgres set app.sync_epoch = '2';
-- On "reset" the phone re-pulls every book and re-uploads its own rows (the
-- upsert is idempotent); it never deletes local letters because of a reset.
--
-- Removals. A letter that stops being visible (deleted, made private, set aside,
-- "Family can read" turned off) is not sent as a row. On the last page the pull
-- returns a count and checksum of the letters by other people the caller may
-- read in that book; when the phone's copy differs it asks for the id list and
-- drops the rest. Only ids the caller may read are ever sent.
--
-- New SQLSTATEs: none. Errors: P0002 (not a member of a live book), 22023 (bad
-- argument), SCANO, 28000, and the per-row codes of the existing triggers.

-- ─── 1. Server version per letter ────────────────────────────────────────
-- Default '0' is metadata only (no table rewrite); rows written before this
-- migration sort first, which is what a phone pulling from the start wants.
alter table public.entries add column if not exists sync_xid xid8 not null default '0';

create or replace function public.entries_set_sync_xid()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  new.sync_xid := pg_current_xact_id();
  return new;
end;
$$;
create trigger entries_sync_xid before insert or update on public.entries
  for each row execute function public.entries_set_sync_xid();

-- Pull scans one book from the cursor onwards.
create index if not exists entries_sync_cursor_idx on public.entries (child_id, sync_xid, id);

create or replace function public.sync_epoch()
returns text language sql stable set search_path = public, pg_catalog as $$
  select coalesce(nullif(current_setting('app.sync_epoch', true), ''), '1');
$$;

-- ─── 2. Pull one book ────────────────────────────────────────────────────
create or replace function public.sync_pull_book(
  p_child uuid,
  p_cursor text default null,
  p_limit int default 200,
  p_digest boolean default false,
  p_want_ids boolean default false
) returns jsonb language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_epoch text := public.sync_epoch();
  v_snap pg_snapshot := pg_current_snapshot();
  v_xmin xid8 := pg_snapshot_xmin(v_snap);
  v_after_xid xid8 := '0';
  v_after_id uuid := '00000000-0000-0000-0000-000000000000';
  v_parts text[];
  v_role text;
  v_fcr boolean;
  v_rows jsonb;
  v_n int;
  v_last_xid xid8;
  v_last_id uuid;
  v_more boolean;
  v_changed boolean;
  v_out jsonb;
begin
  if p_limit is null or p_limit not between 1 and 500 then
    raise exception 'limit must be 1 to 500' using errcode = '22023';
  end if;
  select m.role, c.family_can_read into v_role, v_fcr
    from child_members m join children c on c.id = m.child_id and c.deleted_at is null
   where m.child_id = p_child and m.profile_id = v_uid;
  if not found then
    raise exception 'book not found' using errcode = 'P0002';
  end if;

  if nullif(p_cursor, '') is not null then
    v_parts := string_to_array(p_cursor, ':');
    if coalesce(array_length(v_parts, 1), 0) <> 3 then
      raise exception 'bad cursor' using errcode = '22023';
    end if;
    if v_parts[1] is distinct from v_epoch then
      return jsonb_build_object('reset', true, 'epoch', v_epoch);
    end if;
    begin
      v_after_xid := v_parts[2]::xid8;
      v_after_id := v_parts[3]::uuid;
    exception when others then
      raise exception 'bad cursor' using errcode = '22023';
    end;
    -- A cursor from the future: the database was restored to an earlier point.
    if v_after_xid > pg_snapshot_xmax(v_snap) then
      return jsonb_build_object('reset', true, 'epoch', v_epoch);
    end if;
  end if;

  with page as (
    select e.* from entries e
     where e.child_id = p_child
       and (e.sync_xid, e.id) > (v_after_xid, v_after_id)
       and e.sync_xid < v_xmin
       and (e.author_id = v_uid or exists (select 1 from book_entries be where be.id = e.id))
     order by e.sync_xid, e.id
     limit p_limit
  )
  select coalesce(jsonb_agg(x.j order by x.sync_xid, x.id), '[]'::jsonb), count(*),
         (array_agg(x.sync_xid order by x.sync_xid desc, x.id desc))[1],
         (array_agg(x.id order by x.sync_xid desc, x.id desc))[1]
    into v_rows, v_n, v_last_xid, v_last_id
    from (
      select p.sync_xid, p.id,
             case when p.author_id = v_uid then
               jsonb_build_object(
                 'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id, 'author_signs_as', p.author_signs_as,
                 'kind', p.kind, 'occurred_on', p.occurred_on, 'captured_at', p.captured_at,
                 'capture_mode', p.capture_mode, 'edit_level', p.edit_level, 'prompt_key', p.prompt_key,
                 'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                 'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                 'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                 'audio_kept_on_device', p.audio_kept_on_device, 'created_at', p.created_at,
                 'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true)
             else
               (select to_jsonb(be) - 'search' from book_entries be where be.id = p.id) || jsonb_build_object('own', false)
             end || jsonb_build_object('sync_xid', p.sync_xid::text) as j
        from page p
    ) x;

  v_more := v_n = p_limit;
  v_out := jsonb_build_object(
    'reset', false,
    'epoch', v_epoch,
    'rows', v_rows,
    'more', v_more,
    'cursor', case when v_more then v_epoch || ':' || v_last_xid::text || ':' || v_last_id::text
                   else v_epoch || ':' || v_xmin::text || ':00000000-0000-0000-0000-000000000000' end,
    'access', jsonb_build_object('role', v_role, 'family_can_read', v_fcr));

  if not v_more then
    -- Anything at all changed in this book since the cursor, visible or not?
    -- One bit; it decides whether the checksum below is worth computing.
    v_changed := v_n > 0 or exists (
      select 1 from entries e
       where e.child_id = p_child and (e.sync_xid, e.id) > (v_after_xid, v_after_id) and e.sync_xid < v_xmin);
    if v_changed or p_digest or p_want_ids then
      v_out := v_out || (
        select jsonb_build_object(
                 'visible_count', count(*),
                 'visible_sum', coalesce(sum(('x' || lpad(right(replace(be.id::text, '-', ''), 8), 16, '0'))::bit(64)::bigint), 0) % 4294967296)
          from book_entries be
         where be.child_id = p_child and be.author_id <> v_uid);
    end if;
  end if;
  if p_want_ids then
    v_out := v_out || jsonb_build_object('visible_ids', coalesce((
      select jsonb_agg(be.id order by be.id) from book_entries be
       where be.child_id = p_child and be.author_id <> v_uid), '[]'::jsonb));
  end if;
  return v_out;
end;
$$;

-- ─── 3. Push letters ─────────────────────────────────────────────────────
-- Runs as the caller. author_id is always the caller; the client never sends
-- approval, reviewed_*, deleted_at, created_at or raw_sha256. Immutable fields
-- are written only on insert; an update changes only the mutable fields, and
-- only when one differs (a retry of the same state writes nothing).
create or replace function public.sync_push_entries(p_rows jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  r jsonb;
  v_id uuid;
  v_out jsonb := '[]'::jsonb;
  v_row record;
  v_code text;
  v_detail text;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) > 50 then
    raise exception 'push takes 0 to 50 rows' using errcode = '22023';
  end if;
  for r in select value from jsonb_array_elements(p_rows) loop
    begin
      v_id := (r ->> 'id')::uuid;
      insert into entries as e (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, edit_level,
                                prompt_key, engine_version, raw_transcript, machine_edits, final_text, in_book,
                                sounds_like_me, author_signs_as, audio_kept_on_device)
      values (v_id, (r ->> 'child_id')::uuid, v_uid, r ->> 'kind', (r ->> 'occurred_on')::date,
              (r ->> 'captured_at')::timestamptz, r ->> 'capture_mode', coalesce(r ->> 'edit_level', 'clean'),
              r ->> 'prompt_key', (r ->> 'engine_version')::int, r ->> 'raw_transcript',
              coalesce(r -> 'machine_edits', '[]'::jsonb), r ->> 'final_text',
              coalesce((r ->> 'in_book')::boolean, false), (r ->> 'sounds_like_me')::boolean,
              nullif(r ->> 'author_signs_as', ''), coalesce((r ->> 'audio_kept_on_device')::boolean, false))
      on conflict (id) do update
         set final_text = excluded.final_text,
             machine_edits = excluded.machine_edits,
             edit_level = excluded.edit_level,
             in_book = excluded.in_book,
             sounds_like_me = excluded.sounds_like_me,
             occurred_on = excluded.occurred_on,
             audio_kept_on_device = excluded.audio_kept_on_device
       where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on, e.audio_kept_on_device)
             is distinct from
             (excluded.final_text, excluded.machine_edits, excluded.edit_level, excluded.in_book,
              excluded.sounds_like_me, excluded.occurred_on, excluded.audio_kept_on_device);
      select x.id, x.sync_xid, x.approval, x.in_book, x.deleted_at into v_row from entries x where x.id = v_id;
      v_out := v_out || jsonb_build_array(jsonb_build_object(
        'id', v_row.id, 'ok', true, 'sync_xid', v_row.sync_xid::text, 'approval', v_row.approval,
        'in_book', v_row.in_book, 'deleted_at', v_row.deleted_at));
    exception when others then
      get stacked diagnostics v_code = returned_sqlstate, v_detail = pg_exception_detail;
      if v_code = 'SCCON' then
        -- Rows before this one are kept; this one and the rest wait for consent.
        return jsonb_build_object('results', v_out, 'paused', true, 'detail', v_detail);
      end if;
      v_out := v_out || jsonb_build_array(jsonb_build_object('id', r ->> 'id', 'ok', false, 'code', v_code));
    end;
  end loop;
  return jsonb_build_object('results', v_out, 'paused', false);
end;
$$;

-- ─── 4. The caller's books ───────────────────────────────────────────────
create or replace function public.sync_books()
returns jsonb language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  return jsonb_build_object(
    'epoch', public.sync_epoch(),
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

-- ─── 5. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.entries_set_sync_xid() from public, anon, authenticated;
revoke execute on function public.sync_epoch() from public, anon, authenticated;

revoke execute on function public.sync_pull_book(uuid, text, int, boolean, boolean) from public, anon;
revoke execute on function public.sync_push_entries(jsonb) from public, anon;
revoke execute on function public.sync_books() from public, anon;
grant execute on function public.sync_pull_book(uuid, text, int, boolean, boolean) to authenticated;
grant execute on function public.sync_push_entries(jsonb) to authenticated;
grant execute on function public.sync_books() to authenticated;

-- ─── 6. Classification ───────────────────────────────────────────────────
comment on column public.entries.sync_xid is 'L2 system version: id of the transaction that last wrote the row (sync cursor)';
