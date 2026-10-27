-- S02 follow-ups from three reviews: the consent tables are append-only for the service
-- role too, a former co-parent's letters survive the book's deletion and purge, and the
-- invite code redemption RPC is for the service role only.
--
-- PENDING: not yet applied. Apply after 20261023000000_backup_server.sql (#151), following
-- supabase/APPLY.md (section "File 20"). Never edits an earlier file. Redefined from their
-- newest version, each change marked "20261023010000": purge_due and prepare_account_purge
-- (20261016000000), child_members_drop_held (20261016000000), ops_deletion_sla
-- (20261015010000), and the held_drafts_author_read policy (20261016000000). Refuses a
-- second run (55000).
--
-- 1. Consent records (review A re-check on #178, comment 6372368217). The row guards on
--    subscription_consents and policy_acceptances let a DELETE through while
--    app.retention_purge is on, and any session can set that setting. service_role has
--    BYPASSRLS and, on hosted Supabase, every table privilege by default, so with the
--    service key every consent record could be deleted. Revoked here: INSERT, UPDATE,
--    DELETE, TRUNCATE, REFERENCES and TRIGGER on both tables from service_role (the same
--    set the reading views are closed with). SELECT stays. Every writer today is a
--    SECURITY DEFINER function owned by the migration role, so none is affected:
--    record_policy_act, policy_acceptances_pseudonymise and purge_due (policy_acceptances);
--    status_report_store, subscription_consents_pseudonymise and
--    subscription_retention_purge (subscription_consents). Support-assisted acts
--    (APPLY.md step 8.3) are recorded from the SQL Editor, as the owner.
--
-- 2. A former member's letters stay theirs (review A N1 on #151, comment 6371752917;
--    DATA-REQ-012, DATA-REQ-015, F11-REQ-008; D-113, BL-444). After undo_parent_join or
--    leave_child the remaining parent is the only parent, request_book_deletion lets them
--    delete the book, and purge_due (day 30) or prepare_account_purge (their account)
--    deleted the children row, cascading over the former member's letters, held drafts,
--    recording backups, book key, and (through the worker's whole-book prefix) their
--    Storage objects. Now:
--      - A "kept author" of a book is anyone with a letter, held draft or recording backup
--        in it who is not a member of it at purge time: someone who left, whose join was
--        undone, or who was removed. Current members (the deleting parent, and family
--        members, who were offered export) are purged with the book as before.
--      - A book with no kept author is purged exactly as before.
--      - A book with kept authors is purged for everyone else (purge_book_keep_authors):
--        their letters (ledgered 'entry'), held drafts, recordings (each object by its
--        exact path), book keys, per-book dictionary terms, memberships, preferences,
--        invites, markers and erasure records; each other person's folder
--        {child}/{person}/ is queued in the anchor bucket (the worker mirrors it into
--        entry-audio), and the book's own child-photos folder. The children row stays,
--        tombstoned (deleted_at, so it is never live, listed or joinable), with purged_at
--        set, and keeps only what the kept letters need: id, name, birth date and due date
--        (age labels). Nickname, photo, creator, "family can read" and the hidden mark are
--        cleared. No 'child' ledger row is written then, so a restore replay never cascades
--        over the kept letters.
--      - The kept author's rows are not touched: same ids, same owner, same state. They
--        read their letters as before (entries_select is author-only, and sync_pull's
--        left-book section serves own letters of a book the caller no longer reads), their
--        recordings (backup_object_readable is author-only), and their held drafts
--        (held_drafts_author_read, widened below). They can still Erase now, and
--        everything goes with their account.
--      - purge_due removes such a row once no letter, held draft or recording is left in
--        it (step 2b: the whole-book prefix, the 'child' ledger row, then the cascade).
--      - ops_deletion_sla does not count these rows as overdue tombstones.
--    undo_parent_join no longer deletes the removed parent's held drafts on the server:
--    child_members_drop_held skips a delete that undo_parent_join makes (it names itself in
--    scribe.membership_audit for the audit trigger already). leave_child is unchanged (the
--    leaver's own act; the hold rule from review L N2 still applies). The phone still
--    has to stop discarding its copies (apps/mobile work, named in the PR).
--
-- 3. invite_redeem_by_code (review B N8 on #138, comment 6370599543) does not exist yet
--    (requested from S02; packages/api/src/server/family.ts). There is nothing to revoke
--    here; access_matrix.test.mjs now fails if it is ever created executable by PUBLIC,
--    anon or authenticated, or not executable by service_role.
--
-- New SQLSTATEs: none. New column: children.purged_at (L2). New internal functions
-- (callable by no API role): book_kept_authors(uuid), purge_book_keep_authors(uuid, uuid[],
-- text, uuid). Tests: supabase/tests/former_member_purge.test.mjs (new) and rows in
-- access_matrix.test.mjs. Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once ----------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_attribute
              where attrelid = 'public.children'::regclass and attname = 'purged_at' and not attisdropped) then
    raise exception '20261023010000 is already applied (children.purged_at exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1. Consent records: append-only for the service role too -------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke insert, update, delete, truncate, references, trigger on public.subscription_consents from service_role';
    execute 'revoke insert, update, delete, truncate, references, trigger on public.policy_acceptances from service_role';
  end if;
end;
$$;

-- --- 2. Books kept for a former member's letters --------------------------
alter table public.children add column purged_at timestamptz;
create index children_purged_idx on public.children (purged_at) where purged_at is not null;
comment on column public.children.purged_at is
  'L2 when the book was purged for its members while a former member''s letters keep the row (20261023010000)';

-- Who keeps rows in a book that is purged: authors of a letter, held draft or recording
-- backup in it who are not members of it now.
create or replace function public.book_kept_authors(p_child uuid)
returns uuid[] language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(array_agg(a.author_id order by a.author_id), '{}'::uuid[])
    from (select e.author_id from public.entries e where e.child_id = p_child
          union select h.author_id from public.held_drafts h where h.child_id = p_child
          union select b.author_id from public.audio_blobs b where b.child_id = p_child) a
   where not exists (select 1 from public.child_members m where m.child_id = p_child and m.profile_id = a.author_id);
$$;

-- The book's purge for everyone but p_keep (book_kept_authors). Only a tombstoned book not
-- already kept; anything else is left alone. Called by purge_due and prepare_account_purge
-- after their legal hold checks.
create or replace function public.purge_book_keep_authors(p_child uuid, p_keep uuid[], p_reason text, p_request uuid default null)
returns void language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_keep uuid[] := coalesce(p_keep, '{}'::uuid[]);
begin
  if p_reason is null or p_reason not in ('child_purge', 'account_purge') then
    raise exception 'reason must be child_purge or account_purge' using errcode = '22023';
  end if;
  if cardinality(v_keep) = 0 then
    raise exception 'no kept author: purge the whole book instead' using errcode = '22023';
  end if;
  perform 1 from public.children c where c.id = p_child and c.deleted_at is not null and c.purged_at is null for update;
  if not found then
    return;
  end if;

  -- Storage: each other person's folder in the anchor bucket (the worker mirrors it into
  -- entry-audio), found in the rows and in the buckets themselves, and the book's own photo
  -- folder. Never {child}/ whole, and never a kept author's folder.
  perform public.enqueue_storage_purge('entry-photos', p_child::text || '/' || x.a::text || '/', true, p_reason, p_request)
     from (select e.author_id a from public.entries e where e.child_id = p_child
           union select h.author_id from public.held_drafts h where h.child_id = p_child
           union select b.author_id from public.audio_blobs b where b.child_id = p_child
           union select k.profile_id from public.child_keys k where k.child_id = p_child
           union select m.profile_id from public.child_members m where m.child_id = p_child
           union select case when split_part(o.name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                             then split_part(o.name, '/', 2)::uuid end
                   from storage.objects o
                  where o.bucket_id in ('entry-photos', 'entry-audio') and o.name like p_child::text || '/%/%') x
    where x.a is not null and x.a <> all (v_keep);
  perform public.enqueue_storage_purge('child-photos', p_child::text || '/', true, p_reason, p_request);

  -- Everyone else's letters, ledgered as the book purge ledgers them. Their triggers take each
  -- recording backup by its exact path and write an erasure record (removed below).
  insert into public.purge_ledger (entity_type, entity_id)
    select 'entry', e.id::text from public.entries e where e.child_id = p_child and e.author_id <> all (v_keep)
    on conflict do nothing;
  delete from public.entries e where e.child_id = p_child and e.author_id <> all (v_keep);
  -- Their held drafts ('held_draft' ledger rows by trigger), what is left of their backups, book keys and terms.
  delete from public.held_drafts h where h.child_id = p_child and h.author_id <> all (v_keep);
  delete from public.audio_blobs b where b.child_id = p_child and b.author_id <> all (v_keep);
  delete from public.child_keys k where k.child_id = p_child and k.profile_id <> all (v_keep);
  delete from public.dictionary_terms d where d.child_id = p_child and d.owner_id <> all (v_keep);
  -- Memberships (preferences cascade) and invites: nobody is a member of a kept book.
  delete from public.child_members m where m.child_id = p_child;
  delete from public.child_invites i where i.child_id = p_child;
  -- What the cascade would have taken with those rows: their markers and erasure records.
  delete from public.held_drafts_gone g where g.child_id = p_child and g.author_id <> all (v_keep);
  delete from sync_private.entry_erasures x where x.child_id = p_child and x.author_id <> all (v_keep);

  -- The row stays, tombstoned, with what the kept letters need: id, name and dates.
  update public.children
     set purged_at = now(), photo_path = null, nickname = null, created_by = null, family_can_read = false, hidden_at = null
   where id = p_child;
end;
$$;

-- From 20261016000000. Changes (20261023010000): a book that holds a kept author's rows is
-- purged for everyone else and kept (purge_book_keep_authors); step 1 skips kept books; step
-- 2b removes a kept book once nothing of its kept authors is left. The answer gains
-- books_kept and kept_removed; books still counts every book purged.
create or replace function public.purge_due(p_now timestamptz default now(), p_limit int default 500)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  r record;
  v_children int := 0;
  v_entries int := 0;
  v_accounts int := 0;
  v_kept int := 0;          -- 20261023010000
  v_removed int := 0;       -- 20261023010000
  v_keep uuid[];            -- 20261023010000
  v_cutoff timestamptz := p_now - interval '30 days';
  v_limit int := greatest(coalesce(p_limit, 500), 1);
begin
  -- 1. Books tombstoned for 30 days.
  for r in
    select c.id from children c
    where c.deleted_at is not null and c.deleted_at < v_cutoff
      and c.purged_at is null                                   -- 20261023010000: not a kept book
      and not public.is_held('child', c.id)
      and not exists (select 1 from entries e where e.child_id = c.id
                      and (public.is_held('entry', e.id) or public.is_held('profile', e.author_id)))
      -- 20261016000000 (review L N2): a held draft under a hold keeps its book too.
      and not exists (select 1 from held_drafts h where h.child_id = c.id
                      and (public.is_held('entry', h.id) or public.is_held('profile', h.author_id)))
    order by c.deleted_at
    limit v_limit
    for update skip locked
  loop
    update deletion_requests set status = 'completed', completed_at = p_now
      where kind = 'book' and child_id = r.id and status in ('scheduled', 'held', 'executing');
    -- 20261023010000: a former member's letters, held drafts and recordings stay theirs.
    v_keep := public.book_kept_authors(r.id);
    if cardinality(v_keep) > 0 then
      perform public.purge_book_keep_authors(r.id, v_keep, 'child_purge', null);
      perform public.audit('book_purged', 'child', r.id, r.id, jsonb_build_object('kept_authors', cardinality(v_keep)));
      v_kept := v_kept + 1;
    else
      perform public.enqueue_storage_purge('entry-photos', r.id::text || '/', true, 'child_purge');
      insert into purge_ledger (entity_type, entity_id)
        select 'entry', e.id::text from entries e where e.child_id = r.id on conflict do nothing;
      insert into purge_ledger (entity_type, entity_id) values ('child', r.id::text) on conflict do nothing;
      delete from children where id = r.id;   -- cascades members, prefs, invites, entries, versions, terms
      perform public.audit('book_purged', 'child', r.id, r.id);
    end if;
    v_children := v_children + 1;
  end loop;

  -- 2. Letters tombstoned for 30 days.
  for r in
    select e.id, e.photo_path from entries e
    where e.deleted_at is not null and e.deleted_at < v_cutoff and not public.entry_is_held(e.id)
    order by e.deleted_at
    limit v_limit
    for update skip locked
  loop
    if r.photo_path is not null then
      perform public.enqueue_storage_purge('entry-photos', r.photo_path, false, 'entry_purge');
    end if;
    insert into purge_ledger (entity_type, entity_id) values ('entry', r.id::text) on conflict do nothing;
    delete from entries where id = r.id;    -- cascades entry_versions
    v_entries := v_entries + 1;
  end loop;

  -- 2b. 20261023010000: a kept book goes once no letter, held draft or recording of its kept
  --     authors is left (they erased them, or their account went), as step 1 purges a book.
  for r in
    select c.id from children c
    where c.purged_at is not null
      and not public.is_held('child', c.id)
      and not exists (select 1 from entries e where e.child_id = c.id)
      and not exists (select 1 from held_drafts h where h.child_id = c.id)
      and not exists (select 1 from audio_blobs b where b.child_id = c.id)
    order by c.purged_at
    limit v_limit
    for update skip locked
  loop
    perform public.enqueue_storage_purge('entry-photos', r.id::text || '/', true, 'child_purge');
    insert into purge_ledger (entity_type, entity_id) values ('child', r.id::text) on conflict do nothing;
    delete from children where id = r.id;   -- cascades the kept authors' book keys, terms, markers and erasure records
    perform public.audit('book_purged', 'child', r.id, r.id, jsonb_build_object('kept_book_emptied', true));
    v_removed := v_removed + 1;
  end loop;

  -- 3. Account requests that are due: hand to the deletion worker, unless held.
  update deletion_requests d
    set status = case when public.is_held('profile', d.profile_id) then 'held' else 'executing' end,
        executing_at = p_now
    where d.id in (select x.id from deletion_requests x
                    where x.kind = 'account' and x.status = 'scheduled' and x.scheduled_for <= p_now
                    order by x.scheduled_for limit v_limit for update skip locked);
  get diagnostics v_accounts = row_count;
  update deletion_requests d set status = 'executing', executing_at = p_now
    where d.status = 'held' and d.kind = 'account' and not public.is_held('profile', d.profile_id)
      and d.scheduled_for <= p_now;

  -- 4. Short-lived records (privacy-policy section 10; DATA-REQ-060, 064, 066).
  delete from child_invites where coalesce(revoked_at, accepted_at, expires_at) < p_now - interval '90 days';
  delete from audit_events where at < p_now - interval '24 months';
  delete from deletion_requests where status in ('completed', 'cancelled')
    and coalesce(completed_at, cancelled_at) < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'on', true);
  delete from policy_acceptances where pseudonymised_at < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'off', true);

  -- 5. Housekeeping.
  delete from purge_ledger where purged_at < p_now - interval '60 days';
  delete from storage_purge_queue where done_at is not null and done_at < p_now - interval '7 days';

  perform public.audit('purge_run', 'system', null, null,
    jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts,
                       'books_kept', v_kept, 'kept_removed', v_removed));
  return jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts,
                            'books_kept', v_kept, 'kept_removed', v_removed,
                            'more', v_children >= v_limit or v_entries >= v_limit or v_accounts >= v_limit or v_removed >= v_limit);
end;
$$;

-- From 20261016000000. Changes (20261023010000): a book deleted with the account that holds a
-- kept author's rows is purged for everyone else and kept: its whole folder is not queued, no
-- 'child' ledger row is written, and the row is not deleted. The answer gains books_kept;
-- books still counts every book deleted with the account.
create or replace function public.prepare_account_purge(p_request uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid;
  v_entries int;
  v_books int;
  v_kept int := 0;    -- 20261023010000
  v_keep uuid[];      -- 20261023010000
  r record;           -- 20261023010000
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = 'SCDEL'; end if;
  if public.is_held('profile', v_uid)
     or exists (select 1 from entries e where e.author_id = v_uid
                and (public.is_held('entry', e.id) or public.is_held('child', e.child_id)))
     -- 20261016000000 (review L N2): the person's held drafts count like their letters.
     or exists (select 1 from held_drafts h where h.author_id = v_uid
                and (public.is_held('entry', h.id) or public.is_held('child', h.child_id))) then
    update deletion_requests set status = 'held' where id = p_request;
    return jsonb_build_object('held', true);
  end if;

  -- Books where the caller became sole parent during the grace period.
  update children c set deleted_at = now(), deletion_request_id = p_request
    where c.deleted_at is null
      and exists (select 1 from child_members m where m.child_id = c.id and m.profile_id = v_uid and m.role = 'parent')
      and not exists (select 1 from child_members m where m.child_id = c.id and m.role = 'parent' and m.profile_id <> v_uid);

  -- Every folder the author could have written to (their own subfolder only).
  insert into storage_purge_queue (bucket_id, object_path, is_prefix, reason, request_id)
    select distinct 'entry-photos', x.child_id::text || '/' || v_uid::text || '/', true, 'account_purge', p_request
    from (select child_id from entries where author_id = v_uid
          union select child_id from child_members where profile_id = v_uid) x
    on conflict do nothing;
  -- Books deleted with the account: whole folders (contributors were offered export).
  -- 20261023010000: not a book with a kept author; purge_book_keep_authors queues its folders.
  insert into storage_purge_queue (bucket_id, object_path, is_prefix, reason, request_id)
    select 'entry-photos', c.id::text || '/', true, 'account_purge', p_request
    from children c where c.deletion_request_id = p_request and c.purged_at is null
      and cardinality(public.book_kept_authors(c.id)) = 0
    on conflict do nothing;

  -- Only this author's letters; co-parent and family letters are never touched (DATA-REQ-012).
  insert into purge_ledger (entity_type, entity_id)
    select 'entry', id::text from entries where author_id = v_uid on conflict do nothing;
  delete from entries where author_id = v_uid;
  get diagnostics v_entries = row_count;

  -- 20261023010000: a former member's letters, held drafts and recordings stay theirs.
  for r in select c.id from children c where c.deletion_request_id = p_request and c.purged_at is null order by c.id loop
    v_keep := public.book_kept_authors(r.id);
    if cardinality(v_keep) > 0 then
      perform public.purge_book_keep_authors(r.id, v_keep, 'account_purge', p_request);
      v_kept := v_kept + 1;
    end if;
  end loop;

  insert into purge_ledger (entity_type, entity_id)
    select 'child', id::text from children where deletion_request_id = p_request and purged_at is null on conflict do nothing;
  delete from children where deletion_request_id = p_request and purged_at is null;
  get diagnostics v_books = row_count;

  return jsonb_build_object('entries', v_entries, 'books', v_books + v_kept, 'books_kept', v_kept);
end;
$$;

-- From 20261015010000. Change (20261023010000): a kept book is not an overdue tombstone.
create or replace function public.ops_deletion_sla(p_now timestamptz default now())
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select jsonb_build_object(
    'tombstones_overdue',
      (select count(*) from entries e where e.deleted_at < p_now - interval '31 days' and not public.entry_is_held(e.id))
      + (select count(*) from children c where c.deleted_at < p_now - interval '31 days' and c.purged_at is null
           and not public.is_held('child', c.id)),
    'requests_executing_over_24h',
      (select count(*) from deletion_requests where status = 'executing' and executing_at < p_now - interval '24 hours'),
    'requests_executing_over_7d',
      (select count(*) from deletion_requests where status = 'executing' and executing_at < p_now - interval '7 days'),
    'steps_failed',
      (select count(*) from deletion_request_steps s join deletion_requests d on d.id = s.request_id
        where s.status = 'failed' and d.status in ('scheduled', 'held', 'executing')),
    'steps_retrying',
      (select count(*) from deletion_request_steps s join deletion_requests d on d.id = s.request_id
        where s.status = 'pending' and s.attempts >= 5 and d.status in ('scheduled', 'held', 'executing')),
    'queue_stuck',
      (select count(*) from storage_purge_queue where done_at is null and enqueued_at < p_now - interval '24 hours'),
    'queue_attempts_high',
      (select count(*) from storage_purge_queue where done_at is null and attempts >= 10),
    'scheduled_overdue',
      (select count(*) from deletion_requests where status = 'scheduled' and scheduled_for < p_now - interval '1 day'),
    'holds_past_review',
      (select count(*) from legal_holds where released_at is null and review_by < p_now::date),
    'purge_run_age_minutes',
      (select floor(extract(epoch from p_now - max(at)) / 60)::int from audit_events where action = 'purge_run'),
    'consent_pepper_missing',
      (case when not public.consent_pepper_ready()
                 and exists (select 1 from deletion_requests
                              where kind = 'account' and status in ('scheduled', 'held', 'executing'))
            then 1 else 0 end));
$$;

-- From 20261016000000. Change (20261023010000): an undone join keeps the removed parent's held
-- drafts. undo_parent_join names itself in scribe.membership_audit (transaction-local, set only
-- around its own delete) for child_members_audit; the same value is read here. Someone else's
-- act never takes a person's words: the drafts stay theirs (read through
-- held_drafts_author_read, Erase now, and they go with the account; a book purge keeps them).
-- Every other path is as before: the leaver's held drafts go, unless a legal hold covers them.
create or replace function public.child_members_drop_held()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if current_setting('scribe.membership_audit', true) = 'member_join_undone' then
    return old;
  end if;
  delete from public.held_drafts h
   where h.author_id = old.profile_id and h.child_id = old.child_id
     and not (public.is_held('entry', h.id) or public.is_held('profile', h.author_id) or public.is_held('child', h.child_id));
  return old;
end;
$$;

-- From 20261016000000. Change (20261023010000): the author reads their own held drafts in any
-- book, also one they are no longer a parent of (an undone join, a kept book). Writing still
-- needs a parent of the book (insert and update policies unchanged); sync_pull's held section
-- is unchanged.
alter policy held_drafts_author_read on public.held_drafts
  using (author_id = (select auth.uid()));

-- --- 3. Privileges ----------------------------------------------------------
-- Internal: called only from the definer purge functions above. Revoked from every API role
-- and from the service role (hosted Supabase grants new functions to all three by default).
do $$
declare f text;
begin
  foreach f in array array['public.book_kept_authors(uuid)', 'public.purge_book_keep_authors(uuid, uuid[], text, uuid)'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('revoke execute on function %s from service_role', f);
    end if;
  end loop;
end;
$$;
-- Restated for the reader (create or replace keeps grants): the purge entry points and the SLA
-- report are the service role's; the trigger function is nobody's.
revoke execute on function public.purge_due(timestamptz, int), public.prepare_account_purge(uuid),
  public.ops_deletion_sla(timestamptz) from public, anon, authenticated;
revoke execute on function public.child_members_drop_held() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz, int), public.prepare_account_purge(uuid), public.ops_deletion_sla(timestamptz) to service_role';
  end if;
end;
$$;

comment on function public.purge_book_keep_authors(uuid, uuid[], text, uuid) is
  'Book purge that keeps the rows of authors who are no longer members (20261023010000): everyone else''s rows, folders and the book''s settings go; the row stays tombstoned with purged_at set.';
