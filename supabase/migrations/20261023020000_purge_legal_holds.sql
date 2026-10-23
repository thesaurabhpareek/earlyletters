-- Legal holds stop the account purge for every row it would touch (review A N5 on #248, comment
-- 6374328519; DATA-REQ-035, DATA-REQ-014; data-policy.md section 7).
--
-- PENDING: not yet applied. Apply after 20261023010000_s02_purge_and_consent_guards.sql (#248),
-- following supabase/APPLY.md (section "File 21"). Never edits an earlier file. Redefined from their
-- newest version (20261023010000), each change marked "20261023020000": purge_due,
-- prepare_account_purge and ops_deletion_sla. Refuses a second run, and a run before file 20 (55000).
--
-- The gap. prepare_account_purge checked holds only on the deleting person's own letters and held
-- drafts. A book deleted with the account was purged even when it was under a hold, or held a family
-- member's letter under one: purge_due step 1 skips such a book on day 30, and the worker's
-- prepare_account_purge then deleted it, with every letter in it, in the same hour. The header of
-- purge_book_keep_authors (20261023010000) already relied on checks that were not there.
--
-- The rule is the one the existing checks use (20261002020000; review L N2 in 20261016000000;
-- backup_row_held and backup_delete_all in 20261023000000), applied now to every row a purge deletes:
--   - A row is held when a hold names its own id ('entry': a letter, a held draft, a recording
--     backup), its person ('profile': the author, a book key's holder) or its book ('child'). A
--     Storage object is held by the book and the person its path names ({child}/{person}/...).
--   - purge_due skips a held book and purges the rest, as it did (DATA-REQ-035, DATA-REQ-014).
--   - An account request is held as a whole, as it was for the person's own rows: before anything
--     changes, prepare_account_purge sets the request to 'held' and answers {"held": true}. No
--     SQLSTATE is raised, as before; the worker reads "held" and stops (purge-worker/account.ts).
--     purge_due hands a request held by anything but a hold on the person back to the worker each
--     run, so the purge resumes on the first run after the hold is released. A book that became the
--     person's alone during the grace period is not even tombstoned while the request is held.
--
-- What is checked now, beyond the person's own letters and held drafts:
--   - book_purge_held(child, keep), new: the book, every letter, held draft and recording backup in it
--     (by id and author), every book key in it (by holder), and every object in a person's folder of it
--     (by that person), leaving out the rows of the authors in keep, and every object in the book's own
--     photo folder (by the person Storage records as its owner). It was the book, letters and held
--     drafts in purge_due step 1. Every caller passes the book's kept authors (book_kept_authors), whose
--     rows purge_book_keep_authors never deletes, so a hold covers exactly what the purge touches: a hold
--     on a former member's own row holds neither the deleting parent's account nor the day-30 book purge
--     (review A N2 on #251; 20261023010000 held the whole book for it), while a hold on the book or on
--     anyone else's row does. In step 2b nothing of a kept author's letters is left, so the list is
--     empty and their book keys and folders count.
--   - The person's own recording backups (backup_row_held) and book keys in a held book, the rule
--     backup_delete_all already uses for "Delete the backup"; and their Storage objects in a held book:
--     in their folders ({child}/{them}/, which this function queues and the worker mirrors into every
--     bucket keyed that way) and any the worker's ownership sweep would delete or move
--     (ops_storage_owned_by: a book photo they uploaded).
--   - ops_deletion_sla does not count a tombstoned book purge_due is skipping for a hold as overdue.
--     A held letter was already not overdue (entry_is_held); a book was only when the hold named the
--     book itself, so a book kept for a held letter inside it read as overdue from day 31.
--
-- Unchanged: the kept-author behaviour of 20261023010000 (book_kept_authors, purge_book_keep_authors,
-- the answers' keys), every hold check that was there, and every function signature.
--
-- New SQLSTATEs: none. New internal function (callable by no API role): book_purge_held(uuid, uuid[]). Tests:
-- supabase/tests/purge_legal_holds.test.mjs (new) and rows in access_matrix.test.mjs. Fictional family
-- "Asha" only (CLAUDE.md).

-- --- 0. Run once, after file 20 ---------------------------------------------
do $$
begin
  if not exists (select 1 from pg_attribute
                  where attrelid = 'public.children'::regclass and attname = 'purged_at' and not attisdropped) then
    raise exception '20261023020000 needs 20261023010000 first (children.purged_at is missing)' using errcode = '55000';
  end if;
  if exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace and proname = 'book_purge_held') then
    raise exception '20261023020000 is already applied (book_purge_held exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1. One rule for a book's rows ----------------------------------------
-- Whether a legal hold covers anything a purge of this book deletes, leaving out the rows and folders
-- of the authors in p_keep (a kept book's former members: the purge does not touch them, and the book
-- row it keeps is tombstoned, not deleted). The person-folder branch reads the folders the worker clears
-- for a book ({child}/{person}/... in entry-photos, entry-audio and any bucket keyed the same way). The
-- book's own folder (child-photos/{child}/) goes whole, kept book or not, so an object there is held by
-- the book ('child') and by the person Storage records as its owner (review A re-check on #251, probe
-- PF: a former co-parent under a hold who uploaded the book photo). storage.objects has owner (uuid,
-- deprecated) and owner_id (text) on current projects, either may be absent (as in
-- ops_storage_owned_by), so that branch is dynamic SQL.
create or replace function public.book_purge_held(p_child uuid, p_keep uuid[] default '{}'::uuid[])
returns boolean language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_keep uuid[] := coalesce(p_keep, '{}'::uuid[]);
  v_held boolean := false;
begin
  if public.is_held('child', p_child)
     or exists (select 1 from public.entries e where e.child_id = p_child and e.author_id <> all (v_keep)
                 and (public.is_held('entry', e.id) or public.is_held('profile', e.author_id)))
     or exists (select 1 from public.held_drafts h where h.child_id = p_child and h.author_id <> all (v_keep)
                 and (public.is_held('entry', h.id) or public.is_held('profile', h.author_id)))
     or exists (select 1 from public.audio_blobs b where b.child_id = p_child and b.author_id <> all (v_keep)
                 and (public.is_held('entry', b.entry_id) or public.is_held('profile', b.author_id)))
     or exists (select 1 from public.child_keys k where k.child_id = p_child and k.profile_id <> all (v_keep)
                 and public.is_held('profile', k.profile_id))
     or exists (select 1 from (select case when split_part(o.name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                                           then split_part(o.name, '/', 2)::uuid end person
                                 from storage.objects o
                                where o.bucket_id <> 'ops-ledger' and o.name like p_child::text || '/%/%') x
                 where x.person <> all (v_keep) and public.is_held('profile', x.person)) then
    return true;
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'storage.objects'::regclass and attname = 'owner' and not attisdropped) then
    execute 'select exists (select 1 from storage.objects o where o.bucket_id = ''child-photos'' and o.name like $1
               and public.is_held(''profile'', o.owner))'
      into v_held using p_child::text || '/%';
  end if;
  if not v_held and exists (select 1 from pg_attribute where attrelid = 'storage.objects'::regclass and attname = 'owner_id' and not attisdropped) then
    execute 'select exists (select 1 from storage.objects o where o.bucket_id = ''child-photos'' and o.name like $1
               and public.is_held(''profile'', case when o.owner_id ~* $2 then o.owner_id::uuid end))'
      into v_held using p_child::text || '/%', '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  end if;
  return v_held;
end;
$$;

-- From 20261023010000. Change (20261023020000): steps 1 and 2b skip a book under any hold that covers
-- a row they delete (book_purge_held with the book's kept authors). Step 1 checked the book, its letters
-- and its held drafts, a former member's included; it now also checks its recording backups, book keys
-- and its people's Storage folders, and leaves out a former member's rows, which a kept book keeps.
-- Step 2b checked the book only; nothing of the kept authors' letters, drafts or backups is left by
-- then, so it now also checks their book keys and folders. Nothing else changes.
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
      and not public.book_purge_held(c.id, public.book_kept_authors(c.id))   -- 20261023020000: every row the purge deletes
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
      and not public.book_purge_held(c.id, public.book_kept_authors(c.id))   -- 20261023020000: was is_held('child') only
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

-- From 20261023010000. Change (20261023020000): the hold check covers every row the purge would touch,
-- before anything changes, and a hold anywhere holds the whole request as a hold on the person's own
-- letters did. Added: the person's recording backups, book keys and Storage objects in a held book, and
-- every book deleted with the account (book_purge_held, leaving out a kept book's former members, whose
-- rows it keeps), including one that became theirs alone during the grace period. The rest is unchanged.
create or replace function public.prepare_account_purge(p_request uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid;
  v_entries int;
  v_books int;
  v_kept int := 0;    -- 20261023010000
  v_keep uuid[];      -- 20261023010000
  r record;           -- 20261023010000
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';   -- 20261023020000
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = 'SCDEL'; end if;
  if public.is_held('profile', v_uid)
     or exists (select 1 from entries e where e.author_id = v_uid
                and (public.is_held('entry', e.id) or public.is_held('child', e.child_id)))
     -- 20261016000000 (review L N2): the person's held drafts count like their letters.
     or exists (select 1 from held_drafts h where h.author_id = v_uid
                and (public.is_held('entry', h.id) or public.is_held('child', h.child_id)))
     -- 20261023020000: their recording backups, and their book keys in a held book (the rule
     -- backup_delete_all uses; the key's delete cascades over the backups it opens).
     or exists (select 1 from audio_blobs b where b.author_id = v_uid and public.backup_row_held(b.entry_id, b.author_id, b.child_id))
     or exists (select 1 from child_keys k where k.profile_id = v_uid and public.is_held('child', k.child_id))
     -- 20261023020000: their Storage objects in a held book. Their folders {child}/{them}/ are queued
     -- below and mirrored into every bucket keyed that way; the worker's ownership sweep then deletes or
     -- moves anything else Storage records as theirs (a book photo they uploaded).
     or exists (select 1 from storage.objects o
                 where o.bucket_id <> 'ops-ledger' and lower(split_part(o.name, '/', 2)) = v_uid::text
                   and public.is_held('child', case when split_part(o.name, '/', 1) ~* v_uuid then split_part(o.name, '/', 1)::uuid end))
     or exists (select 1 from jsonb_array_elements(public.ops_storage_owned_by(v_uid, 5000)) x
                 where public.is_held('child', case when split_part(x ->> 'name', '/', 1) ~* v_uuid
                                                    then split_part(x ->> 'name', '/', 1)::uuid end))
     -- 20261023020000 (review A N5 on #248): every book deleted with the account and everyone's rows in
     -- it, also a book that became theirs alone during the grace period (tombstoned just below, so it is
     -- found by the same test). A kept book's former members' rows are left out: purge_book_keep_authors
     -- never deletes them (review A N2 on #251).
     or exists (select 1 from children c
                 where c.purged_at is null
                   and (c.deletion_request_id = p_request
                        or (c.deleted_at is null
                            and exists (select 1 from child_members m where m.child_id = c.id and m.profile_id = v_uid and m.role = 'parent')
                            and not exists (select 1 from child_members m where m.child_id = c.id and m.role = 'parent' and m.profile_id <> v_uid)))
                   and public.book_purge_held(c.id, public.book_kept_authors(c.id))) then
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

-- From 20261023010000. Change (20261023020000): a tombstoned book that purge_due skips for a hold is not
-- an overdue tombstone, whatever row the hold names (book_purge_held; it was the book only).
create or replace function public.ops_deletion_sla(p_now timestamptz default now())
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select jsonb_build_object(
    'tombstones_overdue',
      (select count(*) from entries e where e.deleted_at < p_now - interval '31 days' and not public.entry_is_held(e.id))
      + (select count(*) from children c where c.deleted_at < p_now - interval '31 days' and c.purged_at is null
           and not public.book_purge_held(c.id, public.book_kept_authors(c.id))),
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

-- --- 2. Privileges ----------------------------------------------------------
-- Internal: called only from the definer purge functions above. Revoked from every API role and from
-- the service role (hosted Supabase grants new functions to all three by default), as file 20 does for
-- book_kept_authors.
revoke execute on function public.book_purge_held(uuid, uuid[]) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.book_purge_held(uuid, uuid[]) from service_role';
  end if;
end;
$$;
-- Restated for the reader (create or replace keeps grants): the purge entry points and the SLA report
-- are the service role's.
revoke execute on function public.purge_due(timestamptz, int), public.prepare_account_purge(uuid),
  public.ops_deletion_sla(timestamptz) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz, int), public.prepare_account_purge(uuid), public.ops_deletion_sla(timestamptz) to service_role';
  end if;
end;
$$;

comment on function public.book_purge_held(uuid, uuid[]) is
  'Whether a legal hold covers anything a purge of this book deletes: the book, its letters, held drafts, recording backups, book keys and people''s folders, leaving out the authors in p_keep (20261023020000).';
