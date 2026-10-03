-- Sync engine v1.0: a batched outbox push and a multi-book cursor pull between
-- the phone's SQLite and Supabase, with no sync vendor (founder decision of
-- 3 Oct 2026: no PowerSync; DECISIONS D-023; agent brief decision 17 for the
-- API standards). Client: apps/mobile/src/lib/sync.
--
-- PENDING: not yet applied. It replaces the unapplied draft
-- 20261003041500_sync_cursor_pull.sql (deleted 3 Oct 2026; its sync_books() moved
-- here as section 8b). The entries.sync_xid version, its trigger and index use
-- IF NOT EXISTS or OR REPLACE. Needs 20261003000000 (require_user,
-- the consent gate, approval and the B F9 book_entries view) and 20261003010000
-- (create_child with device ids, create_first_run_children).
--
-- ─── Endpoints (decision 17) ─────────────────────────────────────────────
--   sync_pull(p_since jsonb, p_limit int)  class read_rpc:  p95 300 ms at the client
--   sync_push(p_ops jsonb)                 class sync_batch: p95 800 ms at the client
-- Both need a signed-in, non-anonymous user JWT (require_user), are rate limited
-- per user inside the RPC (pull 120, push 60 per rolling minute; SCRAT means back
-- off and retry), and are safe under retries (pull changes no data; every push op
-- carries a device-made op id and is applied at most once). Server-side p95 on
-- the 1,000 x 400 perf fixture is asserted in supabase/tests/sync_perf.test.mjs.
-- Responses carry ids, versions and the caller's own words only. A per-op error
-- carries a SQLSTATE, never a message or detail (constraint details can quote a
-- row), so no letter text reaches a client log or crash report from here.
--
-- ─── Versions and the pull cursor ────────────────────────────────────────
-- Every insert or update of a letter stamps entries.sync_xid with the id of the
-- writing transaction (xid8, 64-bit, never wraps). The pull returns, per book,
-- rows with (sync_xid, id) after the book's cursor and sync_xid below the oldest
-- transaction still running (pg_snapshot_xmin). That prefix can no longer
-- change, so a committed row is never skipped: a long write delays sync, it never
-- loses a row. Wall-clock time cannot do this (a transaction that started first
-- can commit last with an older timestamp), nor can a sequence (values become
-- visible out of order). The transaction id is the server's clock here; the
-- id is the tiebreak, because one push batch writes many rows in one transaction.
-- Cursor text: "<xid8>:<uuid>". updated_at (server time) travels with each row.
-- Conflicts: last writer wins by server arrival, per field group (words with
-- their edit list and level; in_book; sounds_like_me; occurred_on). The words a
-- later write replaced are kept in entry_versions. raw_transcript, captured_at,
-- child_id and engine_version never change (entries_guard, SCIMM).
--
-- ─── What a pull removes ─────────────────────────────────────────────────
-- Deletes are tombstones: an own deleted letter comes down with deleted_at set.
-- Another person's letter that stops being readable (deleted, made private, set
-- aside, "Family can read" off) is never sent as a row, because even its id must
-- not leave the server once it is private. Instead, the last page of each book
-- carries a digest of what the caller may hold: a count and a 48-bit sum of the
-- ids (last 12 hex digits) of the caller's own letters in the book plus the
-- letters by others the caller may read. The phone compares it with its copy and,
-- on a difference, asks again with "ids": true for the full list, dropping what is
-- not on it. The digest is computed only when something in the book changed
-- since the cursor (or on request); otherwise the phone's own value is echoed,
-- so the response does not reveal activity the caller cannot see.
-- A change of the caller's access to a book (role, or "Family can read" for a
-- family member) makes the server pull that book again from the start
-- ("repull": rows that just became readable carry old versions).
--
-- ─── Restores (TDD 06 P-1) ───────────────────────────────────────────────
-- After a database restore the operator records a new epoch
--   select public.sync_begin_epoch('database_restore', '<restore point>');
-- (service role, after the purge-ledger replay). A pull with an older epoch, or
-- with a cursor ahead of the server's transaction counter, answers "reset". The
-- phone then deletes nothing: it re-uploads every letter it knows the server once
-- held (op entry.reupload, with known_at = the server's updated_at it last saw)
-- and pulls every book from the start. A re-upload is applied only when the
-- server's copy is older than what the phone knew and has not been edited since
-- the epoch began; between two re-uploads the newer known_at wins whatever the
-- arrival order (entries.sync_restored_from). Letters by others that the restored
-- server lacks stay on the phone, marked as waiting for their author.
-- A letter id in purge_ledger is never inserted again (SCDEL, detail 'purged'), so
-- a phone that missed a delete cannot bring a purged letter back.
--
-- ─── Push ops (p_ops: array of at most 50, at most 256 KB) ───────────────
--   {"op": uuid, "type": t, "id": uuid, "data": {...}, "changed": [...], "base": xid8, "known_at": ts}
--   entry.upsert    full letter snapshot in data; inserts if missing, else updates
--                   only the field groups in "changed" (default: all four)
--   entry.reupload  restore re-upload; data adds "deleted": bool; needs known_at
--   entry.delete    tombstone (never consent-gated); missing is not an error
--   entry.restore   restore_entry(); missing is not an error
--   book.first_run  data {"children": [...]} -> create_first_run_children
--   book.create     data {name, date_of_birth, due_date} -> create_child (device id)
--   book.update     data with any of name, nickname, date_of_birth, due_date, family_can_read
--   prefs.upsert    id = child id; data with any of signs_as, include_in_reminders
-- Runs as the caller (SECURITY INVOKER): RLS, the immutability and family rules,
-- the consent gate and every trigger decide exactly as for a direct write.
-- Result per op: {"op", "ok": true, "dup"?, "applied"?, "conflict"?, "missing"?,
-- "entry"|"book"|"books"|"prefs"} or {"op", "ok": false, "code": SQLSTATE, "gone"?}.
-- SCCON stops the batch ("paused": true, "consent": what is missing); ops before
-- it are kept. A transient error (classes 40, 53, 55, 57, 58, XX) stops it too
-- ("stopped": true, "code"); the phone retries from that op, keeping order.
--
-- New SQLSTATEs: none. Reused: SCRAT (sync rate limit: back off, retry),
-- SCDEL with detail 'purged' (the letter was deleted and purged).

-- ─── 1. Server version per letter ────────────────────────────────────────
alter table public.entries add column if not exists sync_xid xid8 not null default '0';
-- The known_at of the restore re-upload that last set this row; any other write clears it.
alter table public.entries add column if not exists sync_restored_from timestamptz;

create or replace function public.entries_set_sync_xid()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  new.sync_xid := pg_current_xact_id();
  if coalesce(current_setting('scribe.sync_reupload', true), '') <> 'on' then
    new.sync_restored_from := null;
  end if;
  return new;
end;
$$;
create or replace trigger entries_sync_xid before insert or update on public.entries
  for each row execute function public.entries_set_sync_xid();

-- One book from the cursor onwards (pull), and the changed-since check.
create index if not exists entries_sync_cursor_idx on public.entries (child_id, sync_xid, id);

-- ─── 2. Purged letters stay purged ───────────────────────────────────────
create or replace function public.entries_not_purged()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if exists (select 1 from purge_ledger where entity_type = 'entry' and entity_id = new.id::text) then
    raise exception 'this letter was deleted' using errcode = 'SCDEL', detail = 'purged';
  end if;
  return new;
end;
$$;
create trigger entries_not_purged before insert on public.entries
  for each row execute function public.entries_not_purged();

-- ─── 3. Restore epochs ───────────────────────────────────────────────────
create table public.sync_epochs (
  epoch int primary key check (epoch >= 1),
  started_at timestamptz not null default now(),
  restore_point timestamptz,
  reason text not null check (reason in ('initial', 'database_restore', 'drill'))
);
insert into public.sync_epochs (epoch, started_at, reason) values (1, now(), 'initial') on conflict do nothing;
alter table public.sync_epochs enable row level security;
-- Readable by every signed-in person (the same two values for everyone); written by the service role only.
create policy sync_epochs_read on public.sync_epochs for select to authenticated using (true);
create policy sync_epochs_no_anonymous on public.sync_epochs as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));

-- Service role (runbook RB-8, after the ledger replay). Returns the new epoch.
create or replace function public.sync_begin_epoch(p_reason text, p_restore_point timestamptz default null)
returns int language plpgsql security definer set search_path = public, pg_catalog as $$
declare v int;
begin
  if p_reason is null or p_reason not in ('database_restore', 'drill') then
    raise exception 'reason must be database_restore or drill' using errcode = '22023';
  end if;
  lock table sync_epochs in exclusive mode;
  select coalesce(max(epoch), 0) + 1 into v from sync_epochs;
  insert into sync_epochs (epoch, started_at, restore_point, reason) values (v, now(), p_restore_point, p_reason);
  return v;
end;
$$;

-- ─── 4. Op receipts (idempotency per op id) ──────────────────────────────
-- A receipt is written in the same subtransaction as its op, before the op runs:
-- a concurrent retry of the same op waits on the key and then sees a duplicate.
-- Kept 30 days (sync_push trims the caller's own; sync_housekeeping trims all).
create table public.sync_op_receipts (
  op_id uuid primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  applied_at timestamptz not null default now()
);
create index sync_op_receipts_profile_idx on public.sync_op_receipts (profile_id, applied_at);
alter table public.sync_op_receipts enable row level security;
create policy sync_op_receipts_own_select on public.sync_op_receipts for select to authenticated
  using (profile_id = (select auth.uid()));
create policy sync_op_receipts_own_insert on public.sync_op_receipts for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy sync_op_receipts_own_delete on public.sync_op_receipts for delete to authenticated
  using (profile_id = (select auth.uid()));
create policy sync_op_receipts_no_anonymous on public.sync_op_receipts as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));

-- ─── 5. Per-user rate windows (decision 17) ──────────────────────────────
-- Unlogged: counters need no crash safety or backups.
create unlogged table public.sync_rate_windows (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null check (bucket in ('pull', 'push')),
  window_start timestamptz not null,
  hits int not null,
  primary key (profile_id, bucket)
);
alter table public.sync_rate_windows enable row level security;
create policy sync_rate_windows_own on public.sync_rate_windows for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy sync_rate_windows_no_anonymous on public.sync_rate_windows as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));

-- ─── 6. Pull ─────────────────────────────────────────────────────────────
-- plan_cache_mode = force_generic_plan (both RPCs): the statements inside read the
-- book_entries view, whose custom re-plan on every call cost about 13 ms in PGlite
-- against 0.3 ms to run; generic plans keep the index range scans (sync_perf.test.mjs).
-- p_since: {"epoch": int, "books": {"<child id>": {"cursor": text, "access": text,
--   "meta": md5 text, "have": {"n": int, "sum": int}, "verify": bool, "ids": bool}}}
-- (all optional; {} is a first pull). p_limit: rows in this response, all books together.
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
  v_hits int;
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

  insert into sync_rate_windows as w (profile_id, bucket, window_start, hits) values (v_uid, 'pull', now(), 1)
  on conflict (profile_id, bucket) do update
     set hits = case when w.window_start <= now() - interval '1 minute' then 1 else w.hits + 1 end,
         window_start = case when w.window_start <= now() - interval '1 minute' then now() else w.window_start end
  returning hits into v_hits;
  if v_hits > 120 then
    raise exception 'too many sync requests' using errcode = 'SCRAT';
  end if;

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
                     'audio_kept_on_device', p.audio_kept_on_device, 'created_at', p.created_at,
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
      v_check := v_fresh or v_n > 0 or not (coalesce(v_req, '{}'::jsonb) ? 'have')
                 or coalesce((v_req ->> 'verify')::boolean, false) or coalesce((v_req ->> 'ids')::boolean, false)
                 or exists (select 1 from entries e
                             where e.child_id = b.id and (e.sync_xid, e.id) > (v_after_x, v_after_i) and e.sync_xid < v_xmin);
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
                   'audio_kept_on_device', p.audio_kept_on_device, 'created_at', p.created_at,
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

-- ─── 7. Push ─────────────────────────────────────────────────────────────
create or replace function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = public, pg_catalog
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  c_groups constant text[] := array['text', 'in_book', 'sounds_like_me', 'occurred_on'];
  v_hits int;
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

  insert into sync_rate_windows as w (profile_id, bucket, window_start, hits) values (v_uid, 'push', now(), 1)
  on conflict (profile_id, bucket) do update
     set hits = case when w.window_start <= now() - interval '1 minute' then 1 else w.hits + 1 end,
         window_start = case when w.window_start <= now() - interval '1 minute' then now() else w.window_start end
  returning hits into v_hits;
  if v_hits > 60 then
    raise exception 'too many sync requests' using errcode = 'SCRAT';
  end if;

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
      insert into sync_op_receipts (op_id, profile_id) values (v_op, v_uid) on conflict (op_id) do nothing;
      v_new := found;

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
                                        deleted_at)
              values (v_id, (d ->> 'child_id')::uuid, v_uid, d ->> 'kind', (d ->> 'occurred_on')::date,
                      (d ->> 'captured_at')::timestamptz, d ->> 'capture_mode', coalesce(d ->> 'edit_level', 'clean'),
                      d ->> 'prompt_key', (d ->> 'engine_version')::int, d ->> 'raw_transcript',
                      coalesce(d -> 'machine_edits', '[]'::jsonb), d ->> 'final_text',
                      coalesce((d ->> 'in_book')::boolean, false), (d ->> 'sounds_like_me')::boolean,
                      nullif(d ->> 'author_signs_as', ''), coalesce((d ->> 'audio_kept_on_device')::boolean, false),
                      case when v_deleted then now() end)
              on conflict (id) do update set
                final_text = case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                machine_edits = case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                edit_level = case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                in_book = case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                sounds_like_me = case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                occurred_on = case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                -- Never changed: passed through so entries_guard refuses a different value (SCIMM).
                raw_transcript = excluded.raw_transcript,
                captured_at = excluded.captured_at,
                child_id = excluded.child_id,
                engine_version = excluded.engine_version
              where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on,
                     e.raw_transcript, e.captured_at, e.child_id, e.engine_version)
                    is distinct from
                    (case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                     case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                     case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                     case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                     case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                     case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                     excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version);
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
          if exists (select 1 from jsonb_object_keys(d) x
                      where x not in ('name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read')) then
            raise exception 'unknown book field' using errcode = '22023';
          end if;
          if not exists (select 1 from children c where c.id = v_id) then
            raise exception 'book not found' using errcode = 'P0002';
          end if;
          update children c set
            name = case when d ? 'name' then d ->> 'name' else c.name end,
            nickname = case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
            date_of_birth = case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
            due_date = case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
            family_can_read = case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end
          where c.id = v_id
            and (c.name, c.nickname, c.date_of_birth, c.due_date, c.family_can_read) is distinct from
                (case when d ? 'name' then d ->> 'name' else c.name end,
                 case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
                 case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
                 case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
                 case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end);
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
      if left(v_code, 2) in ('40', '53', '55', '57', '58', 'XX') then
        return jsonb_build_object('results', v_results, 'paused', false, 'stopped', true, 'code', v_code);
      end if;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('op', left(o ->> 'op', 36), 'ok', false, 'code', v_code)
        || case when v_code = 'SCDEL' and v_detail = 'purged' then jsonb_build_object('gone', true) else '{}'::jsonb end);
    end;
  end loop;

  -- Trim the caller's own old receipts (bounded; sync_housekeeping covers people who stopped syncing).
  delete from sync_op_receipts r
   where r.op_id in (select x.op_id from sync_op_receipts x
                      where x.profile_id = v_uid and x.applied_at < now() - interval '30 days'
                      order by x.applied_at limit 100);
  return jsonb_build_object('results', v_results, 'paused', false, 'stopped', false);
end;
$$;

-- ─── 8. Housekeeping (service role; add to the hourly purge cron) ───────
create or replace function public.sync_housekeeping(p_now timestamptz default now(), p_limit int default 10000)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_receipts int; v_windows int;
begin
  delete from sync_op_receipts r
   where r.op_id in (select x.op_id from sync_op_receipts x where x.applied_at < p_now - interval '30 days'
                      order by x.applied_at limit greatest(coalesce(p_limit, 10000), 1));
  get diagnostics v_receipts = row_count;
  delete from sync_rate_windows where window_start < p_now - interval '1 day';
  get diagnostics v_windows = row_count;
  return jsonb_build_object('receipts', v_receipts, 'rate_windows', v_windows,
                            'more', v_receipts >= greatest(coalesce(p_limit, 10000), 1));
end;
$$;

-- ─── 8b. The caller's books (moved from the draft 20261003041500, deleted unapplied) ──
-- One call for screens that need every book at once without pulling letters:
-- account deletion's "What happens" lines (apps/mobile/src/lib/account-deletion)
-- and the first-run flag (children_entitlements.test.mjs). Contributors get the
-- birthday month and day only, never the year or the due date (DECISIONS D-039).
create or replace function public.sync_books()
returns jsonb language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
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

-- ─── 9. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.entries_set_sync_xid() from public, anon, authenticated;
revoke execute on function public.entries_not_purged() from public, anon, authenticated;
revoke execute on function public.sync_begin_epoch(text, timestamptz) from public, anon, authenticated;
revoke execute on function public.sync_housekeeping(timestamptz, int) from public, anon, authenticated;

revoke execute on function public.sync_pull(jsonb, int) from public, anon;
revoke execute on function public.sync_push(jsonb) from public, anon;
grant execute on function public.sync_pull(jsonb, int) to authenticated;
grant execute on function public.sync_push(jsonb) to authenticated;
revoke execute on function public.sync_books() from public, anon;
grant execute on function public.sync_books() to authenticated;

-- Clients read epochs and write their own receipts and rate windows through RLS; nothing else.
revoke insert, update, delete, truncate on public.sync_epochs from anon, authenticated;
revoke update, truncate on public.sync_op_receipts from anon, authenticated;
revoke truncate on public.sync_rate_windows from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.sync_begin_epoch(text, timestamptz) to service_role';
    execute 'grant execute on function public.sync_housekeeping(timestamptz, int) to service_role';
  end if;
end;
$$;

-- ─── 10. Classification ──────────────────────────────────────────────────
comment on column public.entries.sync_xid is 'L2 system version: id of the transaction that last wrote the row (sync cursor)';
comment on column public.entries.sync_restored_from is 'L2 system timestamp: server time a restore re-upload brought back (null after any other write)';

comment on table public.sync_epochs is 'Restore epochs: a phone that sees a newer epoch re-uploads and never deletes (TDD 06 P-1).';
comment on column public.sync_epochs.epoch is 'L2 counter';
comment on column public.sync_epochs.started_at is 'L2 system timestamp';
comment on column public.sync_epochs.restore_point is 'L2 system timestamp: the backup point the database was restored to';
comment on column public.sync_epochs.reason is 'L2 enum';

comment on table public.sync_op_receipts is 'Ids of applied sync ops, so a retried op is applied once. 30 days.';
comment on column public.sync_op_receipts.op_id is 'L2 device-made op id (UUIDv7)';
comment on column public.sync_op_receipts.profile_id is 'L3 person id';
comment on column public.sync_op_receipts.applied_at is 'L2 system timestamp';

comment on table public.sync_rate_windows is 'Per-person request counters for sync_pull and sync_push (one-minute windows). Unlogged.';
comment on column public.sync_rate_windows.profile_id is 'L3 person id';
comment on column public.sync_rate_windows.bucket is 'L2 enum';
comment on column public.sync_rate_windows.window_start is 'L2 system timestamp';
comment on column public.sync_rate_windows.hits is 'L2 count';
