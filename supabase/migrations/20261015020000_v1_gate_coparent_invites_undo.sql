-- WP-F11-01: invite, cap, leave and undo migration (PRD V2 F11 sections 6.2 D2 to
-- D5, 7 and 11; D-069; 72-hour undo and device-made invite ids).
--
-- PENDING: not yet applied. Apply after 20261015010000_v1_gate_peek_invite_consent_pepper.sql,
-- following supabase/APPLY.md (section "File 20261015020000"). Never edits an
-- earlier file. create_child_invite(uuid, text, text) is redefined from
-- 20261005000000 (changes marked F11-REQ-003 and F11-REQ-018); child_members_audit
-- from 20261002020000 (change marked F11-REQ-008). Everything else is new.
--
-- 1. Device-made invite ids (D5, F11-REQ-002). A new overload
--      create_child_invite(p_invite_id uuid, p_child uuid, p_role text, p_token_hash bytea,
--                          p_code_hash bytea default null, p_signs_as text default null) returns uuid
--    takes the id (UUIDv7 made on the phone, checked like create_child's), the
--    SHA-256 of the token the phone keeps, and the HMAC of the 8-character code
--    (32 bytes, or null while the code path is not built). The server never sees,
--    stores or returns a secret. A repeat with the same id and the same hashes by
--    the same person returns the id with no second row, audit event or limit
--    count; the same id by another person, or with other arguments, is SCCID.
--    The 3-argument overload (server-made token, idempotency-key header, ADR 0017)
--    stays for two app releases (F11 section 11; TDD 02 6.2), so today's app keeps
--    working. This keeps develop's contract (D-067) and adds the PRD V2 one next
--    to it; the pepper for the code HMAC lives outside the database (F11 section
--    8, F11-REQ-007), so no Vault work from PR #32 is taken.
--    child_invites.code_hash: unique among live invites; a collision is SCINV
--    with detail code_taken and the phone makes a new code (F11-REQ-002).
-- 2. Contributors absent from the build, refused by the server (D4, F11-REQ-003):
--    a contributor invite is SCINV with detail role_disabled unless the database
--    setting app.contributors_enabled is on (default off). Both overloads.
-- 3. Second consent at first share (D-050, F11-REQ-018): when
--    app.family_share_consent_required is on (default off), creating an invite
--    needs a current accept of the document family-share, else SCCON with detail
--    family-share. The policy_documents row for family-share is added only if
--    counsel says yes; until then the setting stays off.
-- 4. 72-hour undo (D3, F11-REQ-008): undo_parent_join(p_child, p_member). For 72
--    hours after someone joins through an invite, the parent whose invite was
--    used can remove them. The removed person's letters in that book are taken
--    out of the book (never deleted) and stay theirs; audit action
--    member_join_undone (new value). After 72 hours, or by the other parent:
--    SCPAR. After that only the support runbook removes a parent (F11-REQ-012).
-- 5. Leave only through leave_child (F11-REQ-011, B-REQ-010, DATA-REQ-016): the
--    child_members_leave policy is dropped and DELETE is revoked from the API
--    roles, so a direct delete on child_members is 42501. leave_child,
--    remove_child_member, undo_parent_join and request_book_deletion are the
--    only paths; each runs as the owner, and the last-parent guard still applies.
-- 6. child_member_prefs.notify_letters (default true): the per-book switch for
--    co-parent letter pushes (F11 section 8; WP-F11-09s reads it). Own row only,
--    as every other preference. The sync op gains it in 20261015030000.
-- 7. accept_child_invite_by_code(p_user, p_code_hash), service role only, for the
--    invite-redeem Edge Function (WP-F11-02, S07; built only if DR-13 keeps codes).
--    Same checks as accept_child_invite for the named person; the function and
--    its per-device and global limits are the only path to it (F11-REQ-007).
--
-- New SQLSTATE details: SCINV role_disabled, SCINV code_taken, SCINV token_taken,
--   SCCON family-share. New audit action: member_join_undone.
-- Reused: SCCID, SCINV, SCCAP, SCPAR, SCDEL, SCCON, SCRAT, SCANO, 22023, 42501.

-- ─── 0. Columns, constraint, audit value ─────────────────────────────────
alter table public.child_invites add column if not exists code_hash bytea
  check (code_hash is null or octet_length(code_hash) = 32);
-- One live invite per code. Expired invites keep their row until purge_due
-- removes them (D-020), so the function also checks expiry; the index is the
-- race guard. A collision on an expired row is reported as code_taken too.
create unique index if not exists child_invites_live_code_idx on public.child_invites (code_hash)
  where code_hash is not null and accepted_at is null and revoked_at is null;

alter table public.child_member_prefs add column if not exists notify_letters boolean not null default true;

alter table public.audit_events drop constraint if exists audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check (action in (
  'entry_deleted', 'entry_restored', 'purge_run',
  'book_deletion_requested', 'book_deletion_cancelled', 'book_purged',
  'left_book', 'member_removed',
  'account_deletion_requested', 'account_deletion_cancelled', 'account_deletion_completed',
  'export_created', 'legal_hold_placed', 'legal_hold_released', 'support_access', 'restore_replayed',
  'invite_created', 'invite_revoked', 'member_joined', 'family_letter_reviewed',
  'member_join_undone'));

-- ─── 1. Server config read at call time (no migration to flip) ───────────
--   alter database postgres set app.contributors_enabled = 'on';
--   alter database postgres set app.family_share_consent_required = 'on';
create or replace function public.contributors_enabled()
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select lower(coalesce(nullif(btrim(current_setting('app.contributors_enabled', true)), ''), 'off')) in ('on', 'true', '1');
$$;

create or replace function public.family_share_consent_required()
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select lower(coalesce(nullif(btrim(current_setting('app.family_share_consent_required', true)), ''), 'off')) in ('on', 'true', '1');
$$;

-- The two policy checks every invite creation makes (F11-REQ-003, F11-REQ-018).
-- Internal: called from the two create_child_invite overloads as the owner.
create or replace function public.invite_policy_checks(p_uid uuid, p_role text)
returns void language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if p_role = 'contributor' and not public.contributors_enabled() then
    raise exception 'family invites are not available in this version' using errcode = 'SCINV', detail = 'role_disabled';
  end if;
  if public.family_share_consent_required() and not public.has_active_consent(p_uid, 'family-share') then
    raise exception 'consent required before sharing a book' using errcode = 'SCCON', detail = 'family-share',
      hint = 'Show the family-share sheet; do not drop the request.';
  end if;
end;
$$;

-- ─── 2. create_child_invite: the 3-argument overload, kept ───────────────
-- From 20261005000000, plus invite_policy_checks() (role_disabled, family-share).
create or replace function public.create_child_invite(p_child uuid, p_role text, p_signs_as text default null)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_signs text := nullif(btrim(p_signs_as), '');
  v_replay jsonb;
  v_inv child_invites%rowtype;
  v_token text;
  v_id uuid;
begin
  if p_role is null or p_role not in ('parent', 'contributor') then
    raise exception 'invite role must be parent or contributor' using errcode = 'SCINV';
  end if;
  perform public.invite_policy_checks(v_uid, p_role);        -- F11-REQ-003, F11-REQ-018
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can invite' using errcode = 'SCPAR';
  end if;
  perform 1 from children where id = p_child and deleted_at is null for no key update;
  if not found then raise exception 'book is deleted' using errcode = 'SCDEL'; end if;

  v_replay := public.idempotency_claim(v_uid, 'create_child_invite', jsonb_build_array(p_child, p_role, v_signs));
  if v_replay is not null then
    -- A retry of a call whose response was lost: same invite, fresh token.
    select * into v_inv from child_invites where id = (v_replay ->> 'invite')::uuid for update;
    if not found or v_inv.accepted_at is not null or v_inv.revoked_at is not null or v_inv.expires_at <= now() then
      raise exception 'the invite made by this request is closed; make a new one' using errcode = 'SCINV';
    end if;
    perform public.require_content_consent();
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    update child_invites set token_hash = sha256(convert_to(v_token, 'UTF8')) where id = v_inv.id;
    return v_token;
  end if;

  if p_role = 'parent'
     and (select count(*) from child_members where child_id = p_child and role = 'parent') >= public.max_parents_per_book() then
    raise exception 'this book already has the most parents allowed'
      using errcode = 'SCCAP', detail = public.max_parents_per_book()::text;
  end if;
  perform public.require_content_consent();
  if (select count(*) from child_invites where child_id = p_child and created_at > now() - interval '24 hours') >= 20
     or (select count(*) from child_invites where invited_by = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too many invites today' using errcode = 'SCRAT';
  end if;
  -- 244 random bits from two v4 UUIDs; core Postgres, no extension needed.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into child_invites (child_id, invited_by, token_hash, role, signs_as, expires_at)
    values (p_child, v_uid, sha256(convert_to(v_token, 'UTF8')), p_role, v_signs,
            now() + case p_role when 'parent' then interval '7 days' else interval '14 days' end)
    returning id into v_id;
  perform public.idempotency_store(v_uid, 'create_child_invite', jsonb_build_object('invite', v_id));
  perform public.audit('invite_created', 'membership', v_id, p_child, jsonb_build_object('role', p_role));
  return v_token;
end;
$$;

-- ─── 3. create_child_invite: device-made id, token hash and code hash (D5) ─
-- Returns the invite id. The phone keeps the token for the link and the code
-- for the sheet; only their hashes reach the server. Checks run in the same
-- order as the 3-argument overload. SCCID for an id that is not a device UUIDv7
-- or that belongs to another request.
create or replace function public.create_child_invite(p_invite_id uuid, p_child uuid, p_role text, p_token_hash bytea,
                                                      p_code_hash bytea default null, p_signs_as text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_signs text := nullif(btrim(p_signs_as), '');
  v_inv child_invites%rowtype;
  v_constraint text;
begin
  if p_role is null or p_role not in ('parent', 'contributor') then
    raise exception 'invite role must be parent or contributor' using errcode = 'SCINV';
  end if;
  perform public.invite_policy_checks(v_uid, p_role);        -- F11-REQ-003, F11-REQ-018
  if not public.is_valid_client_uuid7(p_invite_id) then
    raise exception 'invite id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then
    raise exception 'token_hash must be a SHA-256 (32 bytes)' using errcode = '22023';
  end if;
  if p_code_hash is not null and octet_length(p_code_hash) <> 32 then
    raise exception 'code_hash must be 32 bytes' using errcode = '22023';
  end if;
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can invite' using errcode = 'SCPAR';
  end if;
  perform 1 from children where id = p_child and deleted_at is null for no key update;
  if not found then raise exception 'book is deleted' using errcode = 'SCDEL'; end if;

  -- F11-REQ-002: a repeat of the same request is success; anything else under this id is refused.
  select * into v_inv from child_invites where id = p_invite_id;
  if found then
    if v_inv.invited_by <> v_uid or v_inv.child_id <> p_child or v_inv.role <> p_role
       or v_inv.token_hash <> p_token_hash or v_inv.code_hash is distinct from p_code_hash then
      raise exception 'invite id already in use' using errcode = 'SCCID';
    end if;
    return p_invite_id;
  end if;

  if p_role = 'parent'
     and (select count(*) from child_members where child_id = p_child and role = 'parent') >= public.max_parents_per_book() then
    raise exception 'this book already has the most parents allowed'
      using errcode = 'SCCAP', detail = public.max_parents_per_book()::text;
  end if;
  perform public.require_content_consent();
  if (select count(*) from child_invites where child_id = p_child and created_at > now() - interval '24 hours') >= 20
     or (select count(*) from child_invites where invited_by = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too many invites today' using errcode = 'SCRAT';
  end if;
  if p_code_hash is not null and exists (
       select 1 from child_invites i
        where i.code_hash = p_code_hash and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()) then
    raise exception 'this code is in use; make a new one' using errcode = 'SCINV', detail = 'code_taken';
  end if;
  begin
    insert into child_invites (id, child_id, invited_by, token_hash, code_hash, role, signs_as, expires_at)
      values (p_invite_id, p_child, v_uid, p_token_hash, p_code_hash, p_role, v_signs,
              now() + case p_role when 'parent' then interval '7 days' else interval '14 days' end);
  exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'child_invites_live_code_idx' then
      raise exception 'this code is in use; make a new one' using errcode = 'SCINV', detail = 'code_taken';
    end if;
    raise exception 'this token is in use; make a new one' using errcode = 'SCINV', detail = 'token_taken';
  end;
  perform public.audit('invite_created', 'membership', p_invite_id, p_child, jsonb_build_object('role', p_role));
  return p_invite_id;
end;
$$;

-- ─── 4. Accept by code: service role only (WP-F11-02's function calls it) ─
-- The Edge Function verifies the caller's JWT, applies the per-device and
-- global failure limits (F11-REQ-007), computes the HMAC with the pepper it
-- holds, and names the person here. Same checks and effects as
-- accept_child_invite(text) for that person: SCINV, SCCAP, SCCON.
create or replace function public.accept_child_invite_by_code(p_user uuid, p_code_hash bytea)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_inv child_invites%rowtype;
  v_child uuid;
  g record;
begin
  if p_user is null or p_code_hash is null or octet_length(p_code_hash) <> 32 then
    raise exception 'user and a 32-byte code hash are required' using errcode = '22023';
  end if;
  if not exists (select 1 from profiles where id = p_user) then
    raise exception 'invite not found' using errcode = 'SCINV';
  end if;
  select child_id into v_child from child_invites
   where code_hash = p_code_hash and accepted_at is null and revoked_at is null and expires_at > now()
   order by created_at desc limit 1;
  if not found then
    -- The same person retrying after a lost response: idempotent.
    select child_id into v_child from child_invites where code_hash = p_code_hash and accepted_by = p_user limit 1;
    if found then return v_child; end if;
    raise exception 'invite not found' using errcode = 'SCINV';
  end if;
  perform 1 from children where id = v_child for no key update;
  select * into v_inv from child_invites
   where code_hash = p_code_hash and accepted_at is null and revoked_at is null and expires_at > now()
   order by created_at desc limit 1 for update;
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  if not public.child_is_live(v_inv.child_id) then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  if exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = p_user) then
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
  select * into g from public.content_gate_state(p_user);
  if not (g.terms_current and g.age_attested and g.sensitive_data) then
    raise exception 'consent required before content is stored'
      using errcode = 'SCCON',
            detail = concat_ws(',', case when not g.terms_current then 'terms' end,
                                    case when not g.age_attested then 'age' end,
                                    case when not g.sensitive_data then 'sensitive-data' end);
  end if;
  insert into child_members (child_id, profile_id, role) values (v_inv.child_id, p_user, v_inv.role);
  update child_invites set accepted_by = p_user, accepted_at = now() where id = v_inv.id;
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
    values (p_user, 'user', 'member_joined', 'membership', p_user, v_inv.child_id,
            jsonb_build_object('role', v_inv.role, 'via', 'code'));
  return v_inv.child_id;
end;
$$;

-- ─── 5. 72-hour undo (D3, F11-REQ-008) ───────────────────────────────────
-- Membership audit: the delete trigger names the action from a transaction
-- setting, so an undo logs member_join_undone instead of member_removed.
-- From 20261002020000 plus that one branch.
create or replace function public.child_members_audit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_action text := nullif(current_setting('scribe.membership_audit', true), '');
begin
  if auth.uid() is null then return null; end if;   -- cascades and service jobs log elsewhere
  if v_action = 'member_join_undone' then
    perform public.audit('member_join_undone', 'membership', old.profile_id, old.child_id, jsonb_build_object('role', old.role));
  elsif auth.uid() = old.profile_id then
    perform public.audit('left_book', 'membership', old.profile_id, old.child_id, jsonb_build_object('role', old.role));
  else
    perform public.audit('member_removed', 'membership', old.profile_id, old.child_id, jsonb_build_object('role', old.role));
  end if;
  return null;
end;
$$;

-- The parent whose invite was used removes the person who joined with it, for 72
-- hours from the join. Their letters in this book leave the book (never deleted;
-- they keep read, export and delete). Idempotent: 'not_member' once gone. Never
-- consent-gated (a membership change, like leave_child). After the window, or
-- for anyone else, SCPAR: only the support runbook removes a parent (F11-REQ-012).
create or replace function public.undo_parent_join(p_child uuid, p_member uuid)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_role text;
  v_inv child_invites%rowtype;
begin
  perform public.rate_hit('membership');
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent of the book can undo a join' using errcode = 'SCPAR';
  end if;
  perform 1 from children where id = p_child for no key update;
  if p_member is null or p_member = v_uid then
    raise exception 'use leave_child to leave a book' using errcode = '22023';
  end if;
  select role into v_role from child_members where child_id = p_child and profile_id = p_member;
  if not found then
    return 'not_member';
  end if;
  select * into v_inv from child_invites
   where child_id = p_child and accepted_by = p_member and invited_by = v_uid
     and accepted_at > now() - interval '72 hours'
   order by accepted_at desc limit 1;
  if not found then
    raise exception 'a join can be undone only by the parent who sent the invite, within 72 hours' using errcode = 'SCPAR';
  end if;
  update entries set in_book = false, approval = 'not_needed', reviewed_by = null, reviewed_at = null
   where child_id = p_child and author_id = p_member and deleted_at is null
     and (in_book or approval <> 'not_needed');
  perform set_config('scribe.membership_audit', 'member_join_undone', true);
  delete from child_members where child_id = p_child and profile_id = p_member;   -- audit: member_join_undone
  perform set_config('scribe.membership_audit', '', true);
  return 'undone';
end;
$$;

-- ─── 6. Leave only through the RPC (F11-REQ-011) ─────────────────────────
drop policy if exists child_members_leave on public.child_members;
revoke insert, update, delete, truncate on public.child_members from anon, authenticated;

-- ─── 7. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.contributors_enabled() from public, anon, authenticated;
revoke execute on function public.family_share_consent_required() from public, anon, authenticated;
revoke execute on function public.invite_policy_checks(uuid, text) from public, anon, authenticated;
revoke execute on function public.child_members_audit() from public, anon, authenticated;
revoke execute on function public.accept_child_invite_by_code(uuid, bytea) from public, anon, authenticated;

-- RPCs (each starts with require_user()).
revoke execute on function public.create_child_invite(uuid, uuid, text, bytea, bytea, text) from public, anon;
revoke execute on function public.undo_parent_join(uuid, uuid) from public, anon;
grant execute on function public.create_child_invite(uuid, uuid, text, bytea, bytea, text) to authenticated;
grant execute on function public.undo_parent_join(uuid, uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.accept_child_invite_by_code(uuid, bytea) to service_role';
  end if;
end;
$$;

-- ─── 8. Classification (docs/legal/DATA_CLASSIFICATION.md 4.1) ──────────
comment on column public.child_invites.code_hash is
  'L3 HMAC-SHA-256 of the 8-character invite code, keyed by a pepper held outside the database; never the code';
comment on column public.child_member_prefs.notify_letters is
  'L2 preference: this person wants a push when the other parent adds a letter to this book';
