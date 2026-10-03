-- Security and family: anonymous-session guard, server-side consent gates,
-- the policy-acceptance fix for new users during a notice window, parent-only
-- invites with explicit roles and limits, and the family visibility model.
--
-- PENDING: not yet applied to the live project. Apply after
-- 20261002020000_data_governance.sql, following supabase/APPLY.md.
-- Additive only: never edits an applied migration. Companion files, in order:
--   20261003010000_children_and_entitlements.sql  (client ids, Plus rule, StoreKit tables)
--   20261003020000_purge_batching.sql             (purge_due limit, retry backoff)
--
-- Fixes (requirement ids in brackets):
--  1. Invite escalation [TDD 02 C1, TDD 04 S-1, LEGAL-REQ-024, B-REQ-007]:
--     create_child_invite(uuid) is dropped. The new create_child_invite(p_id,
--     p_child, p_role, p_token_hash, p_code_hash, p_signs_as) needs an explicit role, a
--     parent caller, a live book and consent, and is rate limited per book and per
--     parent. Contributors cannot create any invite. Every invite has a link token
--     (SHA-256 stored) and an 8-character code (HMAC under a Vault pepper stored).
--     accept_child_invite (link) and accept_child_invite_by_code (service role only,
--     for the invite-redeem Edge Function) refuse revoked, expired, used and
--     deleted-book invites and existing members; retries by the same person are
--     idempotent. Open invites made by the old function are revoked on upgrade.
--     Invites are readable by parents only (S-9).
--  2. Family visibility [B-REQ-009, B-REQ-011, B F9, TDD 04 S-3, S-4]:
--     entries.approval. A contributor's in_book means "send to the parents"; the
--     server keeps their letter pending until a parent adds it (or adds it at
--     once when the parent turned on auto-add for that member). Contributors read
--     their own letters, plus other people's in-book letters only while "Family
--     can read the book" is on. Parents also see pending and set-aside letters.
--     book_entries and can_read_entry_photo apply the same rule. Parents decide
--     with review_family_letter() (first action wins); a contributor takes a
--     letter back with withdraw_family_letter(); new words on an added family
--     letter send it back to pending unless auto-add is on for that member.
--  3. Policy acceptance during a notice window [TDD 05 X-01]: new users are
--     offered the newest version with new_users_from <= now(), which is the one
--     record_policy_act accepts.
--  4. Server consent gate [TDD 02 finding 7, TDD 05 X-03, LEGAL-REQ-001, -002, -006]:
--     no content write (letters, dictionary, per-book prefs, book settings,
--     books, invites, photo uploads) until the caller has a current Terms
--     acceptance, an age attestation, and sensitive-data consent. Deletion,
--     tombstones and export are never gated (LEGAL-REQ-009).
--  7. Anonymous sessions [TDD 04 S-2, K-08]: is_anonymous() reads the JWT claim.
--     A restrictive policy on every client-visible table and the photo bucket,
--     require_user() in every RPC, and book_entries all refuse anonymous JWTs.
--  8. (part) Letters cannot be written into a deleted book [TDD 02 C10].
--
-- Custom SQLSTATEs added here (the full list is in supabase/APPLY.md):
--   SCANO anonymous session refused           permanent for this session
--   SCCON consent missing (Terms + age + sensitive-data)
--         -> PowerSync uploadData PAUSES the queue and shows the consent sheet; never drops the op
--   SCINV invite cannot be created or accepted (role, used, expired, revoked, member)
--   SCRAT rate limited                         retry after the window
--   SCAPR approval columns are server-owned    permanent
--   28000 not signed in                        refresh the session
-- Existing: SCIMM, SCTMB, SCLPG, SCDEL (also "book is deleted"), SCPAR (parents only),
--   SCACD (account deletion pending), SCPRG (id purged for good), SCCFG (server setting missing).
--   SCVER a newer policy version must be accepted first   show policy_actions_needed()
--
-- Review fixes on 3 Oct 2026 (WS-01):
--  * DB-01: book_entries is replaced below; its write grants are revoked again after the replace.
--  * DB-05 / D-039: children rows are readable by parents only. Every member reads
--    book_children (name, nickname, birthday month and day; never the due date or birth year).
--  * PSEC-04: photo objects cannot be updated (no overwrite in place); deleting your own
--    photo needs current membership of a live book.
--  * DB-09: "only a parent" raises SCPAR; record_policy_act raises real codes.
--  * DB-12: dictionary terms are unique per owner, per book, ignoring case.
--  * Retry safety (founder decision 17): create_child_invite and record_policy_act
--    take a required client UUIDv7 key (p_id), stored as the row's primary key. A
--    replay with the same key and the same arguments returns the original result
--    with no side effects (no second row, no audit, no rate-limit count); the same
--    key with different arguments, or someone else's key, raises SCCID.
--    Invites: the CLIENT generates the secret token (32 random bytes, hex) and sends
--    only p_token_hash = sha256(utf8(token)); the server never sees or returns the
--    token, so a replay has nothing secret to re-send. accept_child_invite(p_token)
--    is unchanged.

-- ─── 1. Shared predicates ────────────────────────────────────────────────
-- Supabase sets request.jwt.claims for every API request. Reading the setting
-- directly (as auth.jwt() does) keeps this testable in the PGlite harness.
create or replace function public.is_anonymous()
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false);
$$;

-- RFC 9562 UUIDv7: version nibble 7, variant 10xx, 48-bit Unix ms timestamp
-- between 2024-01-01 and one day from now. Client-made ids and idempotency keys.
create or replace function public.is_valid_client_uuid7(p_id uuid)
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select p_id is not null
     and substr(p_id::text, 15, 1) = '7'
     and substr(p_id::text, 20, 1) in ('8', '9', 'a', 'b')
     and to_timestamp((('x' || lpad(substr(replace(p_id::text, '-', ''), 1, 12), 16, '0'))::bit(64)::bigint) / 1000.0)
         between timestamptz '2024-01-01 00:00:00+00' and now() + interval '1 day';
$$;

-- Every RPC starts with this. Returns the caller's id.
-- volatile on purpose: a planner may skip an unreferenced stable call; a guard must always run.
create or replace function public.require_user()
returns uuid language plpgsql volatile set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if public.is_anonymous() then
    raise exception 'not available to anonymous sessions' using errcode = 'SCANO';
  end if;
  return v_uid;
end;
$$;

-- Restrictive policies are ANDed with every permissive policy on the table, so
-- one line per table covers select, insert, update and delete, including
-- policies added later. supabase/tests/access_matrix.test.mjs fails if a
-- client-visible table lacks one.
create policy profiles_no_anonymous on public.profiles as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy children_no_anonymous on public.children as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy child_members_no_anonymous on public.child_members as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy child_invites_no_anonymous on public.child_invites as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy entries_no_anonymous on public.entries as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy entry_versions_no_anonymous on public.entry_versions as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy dictionary_terms_no_anonymous on public.dictionary_terms as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy child_member_prefs_no_anonymous on public.child_member_prefs as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy audit_events_no_anonymous on public.audit_events as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy deletion_requests_no_anonymous on public.deletion_requests as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy policy_acceptances_no_anonymous on public.policy_acceptances as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
-- policy_documents and policy_versions stay readable by everyone (L1).
create policy entry_photos_no_anonymous on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'entry-photos' or not (select public.is_anonymous()))
  with check (bucket_id <> 'entry-photos' or not (select public.is_anonymous()));

-- Membership role of the caller in a book (null when not a member). Used by
-- client-context triggers, which run as `authenticated` and cannot read other
-- members' rows directly.
create or replace function public.my_role_in(p_child uuid)
returns text language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select role from child_members where child_id = p_child and profile_id = auth.uid();
$$;

create or replace function public.my_auto_add_in(p_child uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce((select auto_add_letters from child_members
                    where child_id = p_child and profile_id = auth.uid() and role = 'contributor'), false);
$$;

-- ─── 2. Policy acceptance and consent gates ─────────────────────────────
-- X-01: a person who has never accepted (or whose latest act is not an accept)
-- is offered the newest version with new_users_from <= now(), which is exactly
-- the version record_policy_act accepts during a major change's notice window.
-- A person with a current accept acts only when a re-consent version is in force.
create or replace function public.policy_actions_needed()
returns table (document text, version text, effective_at timestamptz, summary text)
language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  return query
  with docs as (
    select d.key from policy_documents d
     where d.needs_affirmative_act and d.key in ('terms', 'contributor-notice')  -- consents are offered, not demanded
  ), newest as (
    select distinct on (v.document) v.document, v.version, v.effective_at, v.summary
      from policy_versions v join docs on docs.key = v.document
     where v.new_users_from <= now()
     order by v.document, v.major desc, v.minor desc, v.patch desc
  ), mine as (
    select distinct on (a.document) a.document, a.version, a.action
      from policy_acceptances a
     where a.profile_id = v_uid and a.action in ('accept', 'decline', 'withdraw')
     order by a.document, a.accepted_at desc
  )
  select n.document, n.version, n.effective_at, n.summary
    from newest n
    left join mine m on m.document = n.document
    left join policy_versions mv on mv.document = m.document and mv.version = m.version
   where m.document is null
      or m.action <> 'accept'
      or exists (select 1 from policy_versions r
                  where r.document = n.document and r.effective_at <= now()
                    and r.requires_reconsent and r.major > mv.major);
end;
$$;

-- Age attestation lives in the Terms acceptance context (LEGAL-REQ-002). It is
-- durable: re-accepting a later Terms version does not ask the age again.
create or replace function public.content_gate_state(p_profile uuid)
returns table (terms_current boolean, age_attested boolean, sensitive_data boolean)
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select public.has_active_consent(p_profile, 'terms'),
         exists (select 1 from policy_acceptances a
                  where a.profile_id = p_profile and a.document = 'terms' and a.action = 'accept'
                    and a.context -> 'age_attested' = 'true'::jsonb),
         public.has_active_consent(p_profile, 'sensitive-data');
$$;

-- The caller's gate, for the app's consent sheet and Settings (never takes a profile id).
create or replace function public.my_sync_gate()
returns table (terms_current boolean, age_attested boolean, sensitive_data boolean, content_allowed boolean)
language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  return query select g.terms_current, g.age_attested, g.sensitive_data,
                      g.terms_current and g.age_attested and g.sensitive_data
                 from public.content_gate_state(v_uid) g;
end;
$$;

create or replace function public.can_write_content()
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select auth.uid() is not null and not public.is_anonymous()
     and coalesce((select g.terms_current and g.age_attested and g.sensitive_data
                     from public.content_gate_state(auth.uid()) g), false);
$$;

-- Raises SCCON (pause, not reject) when p_profile may not write content.
create or replace function public.require_content_consent_of(p_profile uuid)
returns void language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare g record;
begin
  select * into g from public.content_gate_state(p_profile);
  if not coalesce(g.terms_current and g.age_attested and g.sensitive_data, false) then
    raise exception 'consent required before content is stored'
      using errcode = 'SCCON',
            detail = concat_ws(',', case when not g.terms_current then 'terms' end,
                                    case when not g.age_attested then 'age' end,
                                    case when not g.sensitive_data then 'sensitive-data' end),
            hint = 'Pause the upload queue and show the consent sheet; do not drop the write.';
  end if;
end;
$$;

-- Raises SCCON (pause, not reject) when the caller may not write content.
create or replace function public.require_content_consent()
returns void language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if public.is_anonymous() then raise exception 'not available to anonymous sessions' using errcode = 'SCANO'; end if;
  perform public.require_content_consent_of(auth.uid());
end;
$$;

-- Generic client-write gate for tables whose every insert or update is content.
create or replace function public.client_content_gate()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if current_user in ('authenticated', 'anon') then
    perform public.require_content_consent();
  end if;
  return new;
end;
$$;
create trigger dictionary_terms_consent_gate before insert or update on public.dictionary_terms
  for each row execute function public.client_content_gate();
create trigger child_member_prefs_consent_gate before insert or update on public.child_member_prefs
  for each row execute function public.client_content_gate();
create trigger children_consent_gate before update on public.children
  for each row execute function public.client_content_gate();

-- The one object path shape a letter photo may have: {child_id}/{author_id}/{entry_id}.{ext},
-- lowercase uuids (as uuid::text prints them) and the extensions the
-- entries_photo_path_scoped constraint allows. Anything else (a doubled
-- extension, no extension, an extra folder, upper case) is refused on upload,
-- so the purge check below always sees the real entry id (#51 re-review).
create or replace function public.is_entry_photo_path(p_name text)
returns boolean language sql immutable set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|heic|png)$', false);
$$;

-- DB-02 for photos (#32 red-team finding 2): true when the object path's entry id
-- is a purged letter id. Security definer because purge_ledger has no client
-- policies; it answers only "is this id purged" for an id the caller supplies
-- (ids only, never content). It reads the id from the standard path shape only;
-- any other shape returns false here and is refused by is_entry_photo_path.
create or replace function public.photo_entry_is_purged(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select public.is_entry_photo_path(p_name) and exists (
    select 1 from purge_ledger
     where entity_type = 'entry'
       and entity_id = split_part(split_part(p_name, '/', 3), '.', 1));
$$;

-- Photo uploads: Storage policies cannot raise a custom code; a missing consent
-- is a 403 there. The app checks my_sync_gate() before uploading. Only the
-- standard path shape is accepted (the CASE keeps the uuid casts from running on
-- any other name), and a purged letter's photo path is refused for good (DB-02),
-- so a deleted letter's photo cannot come back without its row.
alter policy entry_photos_author_insert on storage.objects with check (
  bucket_id = 'entry-photos'
  and case when public.is_entry_photo_path(name)
           then (storage.foldername(name))[2] = (select auth.uid())::text
                and public.is_child_member(((storage.foldername(name))[1])::uuid)
                and public.child_is_live(((storage.foldername(name))[1])::uuid)
                and public.can_write_content()
                and not public.photo_entry_is_purged(name)
           else false end
);
-- PSEC-04: no UPDATE on photo objects at all. A photo is replaced by uploading a new
-- object (new entry id path) and deleting the old one, so a person who left a book
-- can never overwrite a photo that is still shown in it. Dropping a policy needs the
-- dashboard's approval (APPLY.md step 9).
drop policy if exists entry_photos_author_update on storage.objects;
-- Deleting your own photo needs current membership of a live book. The CASE keeps
-- the uuid cast from running on paths outside the {child_id}/{author_id}/ layout.
alter policy entry_photos_author_delete on storage.objects using (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           then public.is_child_member(((storage.foldername(name))[1])::uuid)
                and public.child_is_live(((storage.foldername(name))[1])::uuid)
           else false end
);

-- record_policy_act: anonymous sessions may record only the web contributor
-- notice; context keys are allowlisted (TDD 05 7.1); age_attested must be true.
-- p_id is the client's UUIDv7 idempotency key and becomes policy_acceptances.id
-- (primary key, so unique). A replay with the same key returns the same row id.
drop function if exists public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb);
create or replace function public.record_policy_act(
  p_id uuid,
  p_document text,
  p_version text,
  p_action text,
  p_method text,
  p_surface text,
  p_app_version text,
  p_platform text,
  p_locale text default null,
  p_client_recorded_at timestamptz default null,
  p_rendered_sha256 bytea default null,
  p_context jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_ver policy_versions%rowtype; v_prev policy_acceptances%rowtype; v_ctx jsonb := coalesce(p_context, '{}'::jsonb);
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if public.is_anonymous() and p_method is distinct from 'web_contributor_page' then
    raise exception 'anonymous sessions may only record the web contributor notice' using errcode = 'SCANO';
  end if;
  if not public.is_valid_client_uuid7(p_id) then
    raise exception 'act id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  -- Replay (lost response): same key, same act -> the original row, nothing new.
  select * into v_prev from policy_acceptances where id = p_id;
  if found then
    if v_prev.profile_id is not distinct from auth.uid()
       and (v_prev.document, v_prev.version, v_prev.action, v_prev.method, v_prev.surface, v_prev.app_version,
            v_prev.platform, v_prev.locale, v_prev.rendered_sha256, v_prev.context)
           is not distinct from
           (p_document, p_version, p_action, p_method, p_surface, p_app_version,
            p_platform, p_locale, p_rendered_sha256, v_ctx) then
      return p_id;
    end if;
    raise exception 'act id already used for a different act' using errcode = 'SCCID';
  end if;
  if p_method = 'support_assisted' then
    raise exception 'support-assisted acts are recorded by the service role' using errcode = '22023';
  end if;
  if jsonb_typeof(v_ctx) <> 'object'
     or exists (select 1 from jsonb_object_keys(v_ctx) k
                 where k not in ('auth', 'age_attested', 'age_signal', 'scope', 'crash', 'usage',
                                 'product', 'intro_offer', 'storefront', 'mode')) then
    raise exception 'context keys are allowlisted' using errcode = '22023';
  end if;
  if v_ctx ? 'age_attested' and v_ctx -> 'age_attested' <> 'true'::jsonb then
    raise exception 'age_attested can only be true' using errcode = '22023';
  end if;
  select * into v_ver from policy_versions where document = p_document and version = p_version;
  if not found or v_ver.new_users_from > now() then
    raise exception 'unknown document version' using errcode = 'P0002';
  end if;
  -- Accepting a superseded version is refused so stale clients cannot pin old terms.
  if p_action = 'accept' and exists (
       select 1 from policy_versions n
        where n.document = p_document and n.new_users_from <= now()
          and (n.major, n.minor, n.patch) > (v_ver.major, v_ver.minor, v_ver.patch)
          and n.requires_reconsent) then
    raise exception 'a newer version requires acceptance' using errcode = 'SCVER',
      hint = 'Fetch policy_actions_needed() and show that version.';
  end if;
  if p_client_recorded_at is not null and p_client_recorded_at > now() + interval '5 minutes' then
    p_client_recorded_at := null;  -- device clock in the future; keep server time only
  end if;
  insert into policy_acceptances (id, profile_id, document, version, action, method, surface,
                                  client_recorded_at, app_version, platform, locale, rendered_sha256, context)
  values (p_id, auth.uid(), p_document, p_version, p_action, p_method, p_surface,
          p_client_recorded_at, p_app_version, p_platform, p_locale, p_rendered_sha256, v_ctx);
  return p_id;
end;
$$;

-- ─── 3. Invites: parents only, explicit role, limits ─────────────────────
alter table public.child_invites alter column role drop default;
alter table public.child_invites add column if not exists revoked_at timestamptz;
alter table public.child_invites add column if not exists signs_as text check (char_length(signs_as) <= 30);
-- Invite code (A-REQ-029, TDD 04 3.4.1): HMAC-SHA256 under the Vault secret
-- invite_code_pepper, so a database dump cannot brute-force the 40-bit codes offline.
alter table public.child_invites add column if not exists code_hash bytea unique;
create index if not exists child_invites_inviter_created_idx on public.child_invites (invited_by, created_at);
create index if not exists child_invites_child_created_idx on public.child_invites (child_id, created_at);

-- Upgrade (M1 fix pack): every open invite made by the old create_child_invite(uuid)
-- is untrusted. Any member could mint one and its role defaulted to 'parent' (the
-- escalation this file fixes), so none of them may be accepted after this file.
update public.child_invites set revoked_at = now() where accepted_at is null and revoked_at is null;

-- Parents only (S-9): contributors no longer see who else was invited.
alter policy child_invites_select on public.child_invites using (public.is_child_parent(child_id));

alter table public.audit_events drop constraint if exists audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check (action in (
  'entry_deleted', 'entry_restored', 'purge_run',
  'book_deletion_requested', 'book_deletion_cancelled', 'book_purged',
  'left_book', 'member_removed',
  'account_deletion_requested', 'account_deletion_cancelled', 'account_deletion_completed',
  'export_created', 'legal_hold_placed', 'legal_hold_released', 'support_access', 'restore_replayed',
  'invite_created', 'invite_revoked', 'member_joined', 'family_letter_reviewed'));

drop function if exists public.create_child_invite(uuid);

-- RFC 2104 HMAC-SHA256 on the built-in sha256(), so no extension schema is needed.
create or replace function public.hmac_sha256(p_key bytea, p_msg bytea)
returns bytea language plpgsql immutable strict set search_path = pg_catalog, public, pg_temp as $$
declare k bytea := p_key; ipad bytea; opad bytea;
begin
  if octet_length(k) > 64 then k := sha256(k); end if;
  k := k || decode(repeat('00', 64 - octet_length(k)), 'hex');
  ipad := k; opad := k;
  for i in 0..63 loop
    ipad := set_byte(ipad, i, get_byte(k, i) # 54);   -- 0x36
    opad := set_byte(opad, i, get_byte(k, i) # 92);   -- 0x5c
  end loop;
  return sha256(opad || sha256(ipad || p_msg));
end;
$$;

-- Invite codes: 8 symbols of Crockford base32 (0-9 and A-Z without I, L, O, U),
-- about 40 bits, shown as XXXX-XXXX. Normal form: upper case, spaces and hyphens
-- removed, O read as 0 and I or L read as 1. Returns null for anything else. The
-- app normalises the same way and sends p_code_hash = sha256(utf8(normal form)).
create or replace function public.normalise_invite_code(p_code text)
returns text language sql immutable set search_path = pg_catalog, public, pg_temp as $$
  select case when v ~ '^[0-9A-HJKMNP-TV-Z]{8}$' then v end
    from (select translate(upper(regexp_replace(coalesce(p_code, ''), '[[:space:]-]', '', 'g')), 'OIL', '011') as v) x;
$$;

-- What child_invites.code_hash stores: HMAC-SHA256(invite_code_pepper, sha256 of the
-- normal form). Raises SCCFG when the pepper is missing or short (fails closed).
create or replace function public.invite_code_digest(p_code_sha256 bytea)
returns bytea language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select public.hmac_sha256(convert_to(public.require_server_secret('invite_code_pepper'), 'UTF8'), p_code_sha256);
$$;

-- Retry-safe invites (founder decision 17). The client generates the invite secret
-- (32 random bytes, hex encoded, 64 characters) and the 8-character code, keeps both
-- for the share sheet, and sends only p_token_hash = sha256(utf8(token)),
-- p_code_hash = sha256(utf8(normalised code)) and a UUIDv7 key p_id, which becomes
-- child_invites.id. The server never sees or returns the token or the code, so a
-- replay after a lost response returns the same invite id and the client still holds
-- both. Co-parent invites last 7 days, family invites 14 (K-18). Limits
-- (B-NFR-004): 20 invites per book and 20 per parent in any 24 hours; replays do
-- not count. Returns the invite id.
create or replace function public.create_child_invite(p_id uuid, p_child uuid, p_role text, p_token_hash bytea,
                                                      p_code_hash bytea, p_signs_as text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_prev child_invites%rowtype;
  v_code bytea;
begin
  if not public.is_valid_client_uuid7(p_id) then
    raise exception 'invite id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  if p_token_hash is null or octet_length(p_token_hash) <> 32 then
    raise exception 'token hash must be a SHA-256 digest (32 bytes)' using errcode = '22023';
  end if;
  if p_code_hash is null or octet_length(p_code_hash) <> 32 then
    raise exception 'code hash must be a SHA-256 digest (32 bytes)' using errcode = '22023';
  end if;
  v_code := public.invite_code_digest(p_code_hash);
  -- Replay: same key, same caller, same arguments -> the same invite, nothing new.
  select * into v_prev from child_invites where id = p_id;
  if found then
    if v_prev.invited_by = v_uid and v_prev.child_id = p_child and v_prev.role is not distinct from p_role
       and v_prev.token_hash = p_token_hash and v_prev.code_hash is not distinct from v_code
       and v_prev.signs_as is not distinct from nullif(btrim(p_signs_as), '') then
      return p_id;
    end if;
    raise exception 'invite id already used for a different invite' using errcode = 'SCCID';
  end if;
  if p_role is null or p_role not in ('parent', 'contributor') then
    raise exception 'invite role must be parent or contributor' using errcode = 'SCINV';
  end if;
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can invite' using errcode = 'SCPAR';
  end if;
  -- Serialise invites per book so the limit cannot be raced.
  perform 1 from children where id = p_child and deleted_at is null for update;
  if not found then raise exception 'book is deleted' using errcode = 'SCDEL'; end if;
  perform public.require_content_consent();
  if (select count(*) from child_invites where child_id = p_child and created_at > now() - interval '24 hours') >= 20
     or (select count(*) from child_invites where invited_by = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too many invites today' using errcode = 'SCRAT';
  end if;
  if exists (select 1 from child_invites where token_hash = p_token_hash) then
    raise exception 'token already used; generate a new one' using errcode = 'SCINV';
  end if;
  if exists (select 1 from child_invites where code_hash = v_code) then
    raise exception 'code already used; generate a new one' using errcode = 'SCINV';
  end if;
  insert into child_invites (id, child_id, invited_by, token_hash, code_hash, role, signs_as, expires_at)
    values (p_id, p_child, v_uid, p_token_hash, v_code, p_role, nullif(btrim(p_signs_as), ''),
            now() + case p_role when 'parent' then interval '7 days' else interval '14 days' end);
  perform public.audit('invite_created', 'membership', p_id, p_child, jsonb_build_object('role', p_role));
  return p_id;
end;
$$;

create or replace function public.revoke_invite(p_invite uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v_child uuid;
begin
  select child_id into v_child from child_invites where id = p_invite;
  if not found or not public.is_child_parent(v_child) then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;
  update child_invites set revoked_at = now()
   where id = p_invite and accepted_at is null and revoked_at is null;
  if found then
    perform public.audit('invite_revoked', 'membership', p_invite, v_child);
  end if;
  return true;
end;
$$;

-- The checks every redemption shares (link or code). Internal: p_uid is the
-- caller already authenticated by accept_child_invite (JWT) or by the invite-redeem
-- Edge Function (accept_child_invite_by_code).
create or replace function public.join_book_by_invite(p_invite uuid, p_uid uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_inv child_invites%rowtype;
begin
  select * into v_inv from child_invites where id = p_invite for update;
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  -- Same person retrying after a lost response: idempotent. Someone who joined and
  -- then left cannot come back on the used invite (they need a new one).
  if v_inv.accepted_by = p_uid
     and exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = p_uid) then
    return v_inv.child_id;
  end if;
  if v_inv.accepted_at is not null then raise exception 'invite already used' using errcode = 'SCINV'; end if;
  if v_inv.revoked_at is not null then raise exception 'invite revoked' using errcode = 'SCINV'; end if;
  if v_inv.expires_at < now() then raise exception 'invite expired' using errcode = 'SCINV'; end if;
  if not public.child_is_live(v_inv.child_id) then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  -- No role change through invites (covers the inviter accepting their own link).
  if exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = p_uid) then
    raise exception 'already a member of this book' using errcode = 'SCINV';
  end if;
  perform public.require_content_consent_of(p_uid);
  insert into child_members (child_id, profile_id, role) values (v_inv.child_id, p_uid, v_inv.role);
  update child_invites set accepted_by = p_uid, accepted_at = now() where id = v_inv.id;
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
    values (p_uid, 'user', 'member_joined', 'membership', p_uid, v_inv.child_id, jsonb_build_object('role', v_inv.role));
  return v_inv.child_id;
end;
$$;

create or replace function public.accept_child_invite(p_token text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v_id uuid;
begin
  select id into v_id from child_invites where token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  return public.join_book_by_invite(v_id, v_uid);
end;
$$;

-- Typed or spoken code (A-REQ-029). Codes are low entropy, so this is NOT granted
-- to authenticated: only the invite-redeem Edge Function calls it, with the service
-- role, after verifying the caller's JWT (refusing anonymous sessions) and applying
-- the attempt limits in TDD 04 3.11 (10 per hour per user and per hashed IP, a global
-- failure breaker). p_user is the verified caller. Same outcomes as accept_child_invite.
create or replace function public.accept_child_invite_by_code(p_user uuid, p_code text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_norm text := public.normalise_invite_code(p_code); v_id uuid;
begin
  if p_user is null then raise exception 'caller id is required' using errcode = '22023'; end if;
  if v_norm is null then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  select id into v_id from child_invites where code_hash = public.invite_code_digest(sha256(convert_to(v_norm, 'UTF8')));
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  return public.join_book_by_invite(v_id, p_user);
end;
$$;

-- ─── 4. Family approval and visibility (B F9) ───────────────────────────
alter table public.entries add column if not exists approval text not null default 'not_needed'
  check (approval in ('not_needed', 'pending', 'added', 'set_aside'));
alter table public.entries add column if not exists reviewed_by uuid;   -- no FK: the reviewer may delete their account
alter table public.entries add column if not exists reviewed_at timestamptz;
alter table public.entries add constraint entries_approval_book
  check (approval in ('not_needed', 'added') or not in_book) not valid;

-- Parents' "Letters from family" list.
create index if not exists entries_family_review_idx on public.entries (child_id, captured_at desc)
  where approval in ('pending', 'set_aside') and deleted_at is null;

-- Client writes to entries. Runs as the caller (not security definer) so it can
-- tell client writes from service-role and RPC writes, like entries_guard.
-- Named to fire before entries_guard and entries_insert_guard.
--
-- Contributor letters: in_book written by the client means "send to the
-- parents". The server sets approval and derives in_book = (approval = 'added').
-- Changing the words of an added letter returns it to pending unless the
-- parents turned on auto-add for this member. Parents' letters: approval
-- stays 'not_needed' and in_book is the author's choice.
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
                  new.sounds_like_me, new.capture_mode, new.audio_kept_on_device)
                 is distinct from
                 (old.final_text, old.machine_edits, old.edit_level, old.stt_meta, old.photo_path, old.kind,
                  old.occurred_on, old.prompt_key, old.prompt_library_version, old.author_signs_as,
                  old.sounds_like_me, old.capture_mode, old.audio_kept_on_device)
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
create trigger entries_family_rules before insert or update on public.entries
  for each row execute function public.entries_family_rules();

-- Defence in depth: the trigger already raises SCDEL for members of a deleted book.
alter policy entries_author_insert on public.entries
  with check (author_id = (select auth.uid()) and public.is_child_member(child_id) and public.child_is_live(child_id));

-- Either parent reviews a family letter. p_expected is the state the parent saw
-- (default 'pending'): the update applies only from that state, so when both
-- parents act at once the first wins and the second gets the current state back.
create or replace function public.review_family_letter(p_entry uuid, p_decision text, p_expected text default 'pending')
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v entries%rowtype;
begin
  if p_decision not in ('added', 'set_aside') or p_expected not in ('pending', 'added', 'set_aside') then
    raise exception 'decision must be added or set_aside' using errcode = '22023';
  end if;
  select * into v from entries where id = p_entry for update;
  if not found or v.approval = 'not_needed' or v.author_id = v_uid
     or not exists (select 1 from child_members m where m.child_id = v.child_id and m.profile_id = v_uid and m.role = 'parent') then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  if v.deleted_at is not null or not public.child_is_live(v.child_id) then
    raise exception 'letter or book is deleted' using errcode = 'SCDEL';
  end if;
  perform public.require_content_consent();
  if v.approval <> p_expected or v.approval = p_decision then
    return v.approval;
  end if;
  update entries set approval = p_decision, in_book = (p_decision = 'added'), reviewed_by = v_uid, reviewed_at = now()
   where id = p_entry;
  perform public.audit('family_letter_reviewed', 'entry', p_entry, v.child_id, jsonb_build_object('decision', p_decision));
  return p_decision;
end;
$$;

-- A family member takes back a letter they sent (pending, set aside or added).
-- Needed because a pending letter already has in_book = false on the server, so
-- the client cannot express "un-send" by writing in_book. Never consent-gated:
-- it only narrows who reads the letter. Idempotent.
create or replace function public.withdraw_family_letter(p_entry uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  if not exists (select 1 from entries where id = p_entry and author_id = v_uid) then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  update entries set approval = 'not_needed', in_book = false, reviewed_by = null, reviewed_at = null
   where id = p_entry and approval <> 'not_needed' and deleted_at is null;
  return true;
end;
$$;

-- Auto-add applies to family members only.
create or replace function public.set_member_auto_add(p_child uuid, p_member uuid, p_on boolean)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can change auto-add' using errcode = 'SCPAR';
  end if;
  update child_members set auto_add_letters = p_on
   where child_id = p_child and profile_id = p_member and role = 'contributor';
  return found;
end;
$$;

-- book_entries (PRD K-09 + B F9). Same columns as before, plus approval. The
-- author sees every own letter; a parent sees in-book letters and family
-- letters waiting for review or set aside; a contributor sees other people's
-- in-book letters only while "Family can read the book" is on. Book live, row live.
create or replace view public.book_entries with (security_barrier = true) as
select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at,
       e.capture_mode, e.edit_level, e.prompt_key, e.prompt_library_version, e.engine_version,
       e.final_text, e.in_book, e.photo_path, e.audio_kept_on_device, e.sounds_like_me,
       e.created_at, e.updated_at, e.deleted_at, e.search, e.approval
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
comment on view public.book_entries is
  'Letters a member may read (B F9), without the author''s working material (raw transcript, its hash, machine edits, STT metadata). PRD K-09.';
-- DB-01: read-only for everyone, repeated after every create or replace of the view.
revoke all on public.book_entries from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.book_entries from authenticated;
grant select on public.book_entries to authenticated;

-- ─── 4a. What members see about the child (DB-05, D-039) ─────────────────
-- The children table holds the birth year and the due date (health data, K-25).
-- Parents read and edit it; contributors no longer see its rows at all.
alter policy children_member_select on public.children using (public.is_child_parent(id));
alter policy children_member_update on public.children
  using (public.is_child_parent(id)) with check (public.is_child_parent(id));

-- Every member of a live book reads this: name, nickname, birthday month and day.
-- Never the due date or the birth year. Security-barrier view owned by the
-- migration role (like book_entries), so it reads children without the caller's RLS.
create view public.book_children with (security_barrier = true) as
select c.id, c.name, c.nickname,
       extract(month from c.date_of_birth)::int as birth_month,
       extract(day from c.date_of_birth)::int as birth_day
  from public.children c
 where c.deleted_at is null
   and not (select public.is_anonymous())
   and c.id in (select m.child_id from public.child_members m where m.profile_id = (select auth.uid()));
-- DB-01 rule for every view: select only.
revoke all on public.book_children from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.book_children from authenticated;
grant select on public.book_children to authenticated;
comment on view public.book_children is
  'What every member of a live book sees about the child (D-039): name, nickname, birthday month and day. Never the due date or birth year.';
comment on column public.book_children.id is 'L3 book id';
comment on column public.book_children.name is 'L4 child name';
comment on column public.book_children.nickname is 'L4 child nickname';
comment on column public.book_children.birth_month is 'L4 birthday month (no year)';
comment on column public.book_children.birth_day is 'L4 birthday day of month (no year)';

-- ─── 4b. Dictionary terms per owner, per book, ignoring case (DB-12) ─────
-- Was unique (owner_id, term): the same name could not be saved for two books,
-- and "Nani" and "nani" were two terms. Null child_id (all books) counts as one
-- value. APPLY.md step 8 checks for duplicates first.
alter table public.dictionary_terms drop constraint if exists dictionary_terms_owner_id_term_key;
create unique index if not exists dictionary_terms_owner_child_term_key
  on public.dictionary_terms (owner_id, child_id, lower(term)) nulls not distinct;

-- Photos follow the letters.
create or replace function public.can_read_entry_photo(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select not public.is_anonymous() and exists (
    select 1 from entries e
      join children c on c.id = e.child_id and c.deleted_at is null
      join child_members m on m.child_id = e.child_id and m.profile_id = auth.uid()
     where e.photo_path = p_name and e.deleted_at is null
       and ((m.role = 'parent' and (e.in_book or e.approval in ('pending', 'set_aside')))
            or (m.role = 'contributor' and e.in_book and c.family_can_read)));
$$;

-- ─── 5. Remaining RPCs: anonymous guard (bodies otherwise unchanged) ─────
-- request_account_deletion also refuses source 'support' from clients (TDD 05 X-11)
-- and no longer schedules a RevenueCat step (founder: StoreKit 2 direct, no RevenueCat).
create or replace function public.request_account_deletion(p_source text, p_had_active_subscription boolean default null)
returns table (request_id uuid, scheduled_for timestamptz)
language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_id uuid;
  v_when timestamptz;
  v_entries int;
  v_books int;
begin
  if p_source is null or p_source not in ('ios', 'android', 'web') then
    raise exception 'source must be ios, android or web' using errcode = '22023';
  end if;
  select d.id, d.scheduled_for into v_id, v_when from deletion_requests d
    where d.profile_id = v_uid and d.kind = 'account' and d.status in ('scheduled', 'held', 'executing');
  if found then return query select v_id, v_when; return; end if;

  v_when := now() + interval '30 days';
  insert into deletion_requests (kind, profile_id, status, source, scheduled_for, had_active_subscription)
    values ('account', v_uid, 'scheduled', p_source, v_when, p_had_active_subscription)
    returning id into v_id;

  update entries set deleted_at = now(), deleted_reason = 'account_deletion'
    where author_id = v_uid and deleted_at is null;
  get diagnostics v_entries = row_count;

  update children c set deleted_at = now(), deletion_request_id = v_id
    where c.deleted_at is null
      and exists (select 1 from child_members m where m.child_id = c.id and m.profile_id = v_uid and m.role = 'parent')
      and not exists (select 1 from child_members m where m.child_id = c.id and m.role = 'parent' and m.profile_id <> v_uid);
  get diagnostics v_books = row_count;

  insert into deletion_request_steps (request_id, step)
    select v_id, s from unnest(array['storage_objects', 'apple_token_revoke', 'posthog',
      'email_provider', 'receipt_email', 'auth_user', 'powersync_verify']) s;
  if v_books > 0 then
    insert into deletion_request_steps (request_id, step) values (v_id, 'contributor_export_notice');
  end if;

  perform public.audit('account_deletion_requested', 'deletion_request', v_id, null,
    jsonb_build_object('entries', v_entries, 'books', v_books, 'source', p_source));
  return query select v_id, v_when;
end;
$$;

create or replace function public.cancel_account_deletion()
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v_id uuid;
begin
  select id into v_id from deletion_requests
    where profile_id = v_uid and kind = 'account' and status in ('scheduled', 'held') for update;
  if not found then return false; end if;
  update deletion_requests set status = 'cancelled', cancelled_at = now() where id = v_id;
  update entries set deleted_at = null where author_id = v_uid and deleted_reason = 'account_deletion';
  update children set deleted_at = null, deletion_request_id = null where deletion_request_id = v_id;
  delete from deletion_request_steps where request_id = v_id;
  perform public.audit('account_deletion_cancelled', 'deletion_request', v_id, null);
  return true;
end;
$$;

create or replace function public.request_book_deletion(p_child uuid, p_source text)
returns text language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v_id uuid;
begin
  if p_source is null or p_source not in ('ios', 'android', 'web') then
    raise exception 'source must be ios, android or web' using errcode = '22023';
  end if;
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid and role = 'parent') then
    raise exception 'only a parent can delete a book' using errcode = 'SCPAR';
  end if;
  if exists (select 1 from child_members where child_id = p_child and role = 'parent' and profile_id <> v_uid) then
    update entries set deleted_at = now(), deleted_reason = 'book_deletion'
      where child_id = p_child and author_id = v_uid and deleted_at is null;
    delete from child_members where child_id = p_child and profile_id = v_uid;
    return 'left_and_removed_own_letters';
  end if;
  if exists (select 1 from children where id = p_child and deleted_at is not null) then
    return 'book_scheduled';                                  -- idempotent
  end if;
  insert into deletion_requests (kind, profile_id, child_id, status, source, scheduled_for)
    values ('book', v_uid, p_child, 'scheduled', p_source, now() + interval '30 days') returning id into v_id;
  update children set deleted_at = now(), deletion_request_id = v_id where id = p_child;
  if exists (select 1 from child_members where child_id = p_child and role = 'contributor') then
    insert into deletion_request_steps (request_id, step) values (v_id, 'contributor_export_notice');
  end if;
  perform public.audit('book_deletion_requested', 'child', p_child, p_child);
  return 'book_scheduled';
end;
$$;

create or replace function public.cancel_book_deletion(p_child uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v_req uuid;
begin
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid and role = 'parent') then
    raise exception 'only a parent can restore a book' using errcode = 'SCPAR';
  end if;
  select deletion_request_id into v_req from children where id = p_child and deleted_at is not null for update;
  if not found then return false; end if;
  if exists (select 1 from deletion_requests where id = v_req and kind = 'account') then
    raise exception 'cancel the account deletion to restore this book' using errcode = 'SCACD';
  end if;
  update children set deleted_at = null, deletion_request_id = null where id = p_child;
  update deletion_requests set status = 'cancelled', cancelled_at = now() where id = v_req and status in ('scheduled', 'held');
  perform public.audit('book_deletion_cancelled', 'child', p_child, p_child);
  return true;
end;
$$;

create or replace function public.delete_entry(p_entry uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  if not exists (select 1 from entries where id = p_entry and author_id = v_uid) then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  update entries set deleted_at = now(), deleted_reason = 'user' where id = p_entry and deleted_at is null;
  return true;
end;
$$;

create or replace function public.restore_entry(p_entry uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user(); v entries%rowtype;
begin
  select * into v from entries where id = p_entry for update;
  if not found or v.author_id is distinct from v_uid then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  if v.deleted_at is null then return true; end if;
  if v.deleted_reason = 'account_deletion' then
    raise exception 'cancel the account deletion to restore these letters' using errcode = 'SCACD';
  end if;
  if not public.child_is_live(v.child_id) then
    raise exception 'restore the book first' using errcode = 'SCDEL';
  end if;
  update entries set deleted_at = null where id = p_entry;
  return true;
end;
$$;

-- ─── 6. Function privileges ──────────────────────────────────────────────
-- Internal (triggers and helpers called only from security-definer code).
revoke execute on function public.content_gate_state(uuid) from public, anon, authenticated;
revoke execute on function public.client_content_gate() from public, anon, authenticated;
revoke execute on function public.entries_family_rules() from public, anon, authenticated;
revoke execute on function public.require_content_consent_of(uuid) from public, anon, authenticated;
revoke execute on function public.join_book_by_invite(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.hmac_sha256(bytea, bytea) from public, anon, authenticated;
revoke execute on function public.normalise_invite_code(text) from public, anon, authenticated;
revoke execute on function public.invite_code_digest(bytea) from public, anon, authenticated;
revoke execute on function public.accept_child_invite_by_code(uuid, text) from public, anon, authenticated;

-- Called as the signed-in user by RLS policies and client-context triggers.
revoke execute on function public.is_anonymous() from public, anon;
revoke execute on function public.is_valid_client_uuid7(uuid) from public, anon;
revoke execute on function public.require_user() from public, anon;
revoke execute on function public.my_role_in(uuid) from public, anon;
revoke execute on function public.my_auto_add_in(uuid) from public, anon;
revoke execute on function public.can_write_content() from public, anon;
revoke execute on function public.require_content_consent() from public, anon;
revoke execute on function public.photo_entry_is_purged(text) from public, anon;
revoke execute on function public.is_entry_photo_path(text) from public, anon;
grant execute on function public.is_anonymous() to authenticated;
grant execute on function public.is_valid_client_uuid7(uuid) to authenticated;
grant execute on function public.require_user() to authenticated;
grant execute on function public.my_role_in(uuid) to authenticated;
grant execute on function public.my_auto_add_in(uuid) to authenticated;
grant execute on function public.can_write_content() to authenticated;
grant execute on function public.require_content_consent() to authenticated;
grant execute on function public.photo_entry_is_purged(text) to authenticated;
grant execute on function public.is_entry_photo_path(text) to authenticated;

-- RPCs (each starts with require_user()).
revoke execute on function public.my_sync_gate() from public, anon;
revoke execute on function public.create_child_invite(uuid, uuid, text, bytea, bytea, text) from public, anon;
revoke execute on function public.record_policy_act(uuid, text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb) from public, anon;
revoke execute on function public.revoke_invite(uuid) from public, anon;
revoke execute on function public.accept_child_invite(text) from public, anon;
revoke execute on function public.review_family_letter(uuid, text, text) from public, anon;
revoke execute on function public.withdraw_family_letter(uuid) from public, anon;
grant execute on function public.my_sync_gate() to authenticated;
grant execute on function public.create_child_invite(uuid, uuid, text, bytea, bytea, text) to authenticated;
grant execute on function public.record_policy_act(uuid, text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
grant execute on function public.accept_child_invite(text) to authenticated;
grant execute on function public.review_family_letter(uuid, text, text) to authenticated;
grant execute on function public.withdraw_family_letter(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.content_gate_state(uuid) to service_role';
    execute 'grant execute on function public.is_anonymous() to service_role';
    -- Only the invite-redeem Edge Function (service role) redeems codes.
    execute 'grant execute on function public.accept_child_invite_by_code(uuid, text) to service_role';
    -- The secret-derived digest and the internal join stay off the service key's RPC surface.
    execute 'revoke execute on function public.invite_code_digest(bytea) from service_role';
    execute 'revoke execute on function public.join_book_by_invite(uuid, uuid) from service_role';
  end if;
end;
$$;

-- ─── 7. Classification ───────────────────────────────────────────────────
comment on column public.child_invites.revoked_at is 'L2 system timestamp';
comment on column public.child_invites.code_hash is 'L3 HMAC-SHA256 of the invite code under the Vault pepper (code itself is L4, never stored)';
comment on column public.child_invites.signs_as is 'L3 signature the inviter suggested ("Nani")';
comment on column public.entries.approval is 'L2 family review state (not_needed, pending, added, set_aside)';
comment on column public.entries.reviewed_by is 'L3 person id of the reviewing parent; nulled at account deletion';
comment on column public.entries.reviewed_at is 'L2 system timestamp';
comment on column public.book_entries.approval is 'L2 family review state';
