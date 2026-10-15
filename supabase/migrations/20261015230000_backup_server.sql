-- S05 server: encrypted recording backup and the recovery key (PRD V2 F08 section 6.5,
-- WP-F08-B3 and the SQL half of WP-F08-B4 and WP-F08-B3p; F17 section 8.4 rows).
--
-- PENDING: not yet applied. The coordinator gives this file the next free timestamp
-- after S02's newest file at merge (08-delivery.md section 4). Apply following
-- supabase/APPLY.md, section "File <timestamp>_backup_server.sql" (text sent to S02 in
-- the PR; also in docs/ops/BACKUP_RUNBOOK.md appendix A). Never edits an earlier file
-- and redefines no function first defined in another file. It adds triggers to three
-- existing tables (entries, profiles, deletion_requests) whose functions live here, and
-- widens purge_ledger's entity_type check by one value without dropping any value a
-- later file may have added (section 0).
--
-- What this adds
--  1. Settings, read at call time (no migration to flip; fail closed):
--       alter database postgres set app.backup_enabled = 'on';      -- uploads and key storage
--       alter database postgres set app.escrow_enabled = 'on';      -- the escrow_* functions
--       alter database postgres set app.escrow_key_versions = '1';  -- escrow public key versions a wrap may target
--       alter database postgres set app.escrow_rotation = '1:2';     -- ONLY while a rotation runs (runbook R2 to R6)
--     Off, backup_begin and backup_store_key raise SCBKO, and every escrow_* call raises
--     SCBKO. Reading, restoring, discarding and deleting are never switched off. Without
--     app.escrow_rotation naming the exact from:to pair, escrow_rotation_batch and
--     escrow_rewrap_key refuse (SCBKO rotation), so the escrow role can read every wrap only
--     during a rotation the founder started.
--  2. Tables (all RLS on, owner read of own rows only, L1 to L4 on every column):
--       backup_devices     one X25519 public key per install (F08-REQ-027)
--       child_keys         the escrow wrap of each book key per (child, author, version) (F08-REQ-021);
--                          clients may read every column except escrow_wrap
--       audio_blobs        one row per uploaded recording: exact object_path, wrapped file key,
--                          ciphertext hash, size, state pending or confirmed (F08 6.5)
--       backup_usage       bytes per account against a 5 GiB quota, and the backup_begin window (F08 6.5 F)
--       restore_requests   one row per new-device restore, with its hold and its single-use stop token (6.5 C)
--       restore_approvals  one sealed approval code per enrolled device per request (see "Approval" below)
--       escrow_unwraps     the recovery-key access log: append-only, one row per book key opened (F08-REQ-042)
--       escrow_rotation_notices  one row per account per escrow key rotation, until its email has gone
--     The policy document `backup` (its own consent act, F08-REQ-039). Versions are published
--     by the service role once counsel approves the text (runbook step B1).
--  3. The private bucket `entry-audio` (20 MB objects, application/octet-stream) and its
--     policies: a signed-in, non-anonymous owner may insert or overwrite only the exact path
--     of their own pending audio_blobs row, and read only paths of their own rows. No client
--     delete. Every policy decision goes through one of two SECURITY DEFINER helpers with a
--     pinned search_path (backup_object_writable, backup_object_readable), so the Storage API
--     can issue a signed upload or download URL only when those helpers say yes (DATA-REQ-047).
--  4. Client RPCs (signed in, never anonymous; each starts with require_user()):
--       backup_register_device, backup_revoke_device, backup_store_key, backup_begin,
--       backup_confirm, backup_discard, backup_delete_all, backup_pending_requests,
--       backup_approve_request, backup_cancel_request
--  5. The escrow_svc login role (created NOLOGIN here; the founder sets LOGIN and a password
--     in the SQL editor, runbook step B3) with USAGE on public and EXECUTE on the escrow_*
--     functions only. It has no table privileges, no membership in any role and is never
--     granted to `authenticator`, so the Data API cannot become it. The escrow function in
--     the separate project `scribe-escrow` connects as this role and nothing else does.
--       escrow_request_context, escrow_open_request, escrow_load_wraps, escrow_record_unwraps,
--       escrow_set_request_state, escrow_rotation_batch, escrow_rewrap_key, escrow_rotation_failed,
--       escrow_rotation_notices_due, escrow_rotation_notice_sent
--     F08 6.5 G2 names four functions; this file has ten because the approval codes, the
--     release invariant, key rotation and its retried emails each need one narrow function of
--     their own (PR body, "Deviations"). None returns or accepts a plaintext key: wraps travel
--     sealed to the escrow public key, and only the escrow function opens them, in memory.
--     escrow_open_request and escrow_load_wraps also take the caller's auth session id and refuse
--     (28000 session_ended) once that session is gone, so after the stop link signs every session
--     out, a still-unexpired access token can neither open a request nor collect keys.
--  6. Service-role functions for the purge worker and the account-stop endpoint:
--       backup_svc_sweep, backup_svc_unwraps_between, backup_svc_stop
--  7. Deletion hooks (F17 8.4, F08 6.5 D4 to D7):
--       any delete of an audio_blobs row enqueues its exact object_path in storage_purge_queue
--       and writes `audio_blob` and `storage_object` rows in purge_ledger, in the same
--       transaction. Rows go when their letter is purged (entries trigger), discarded,
--       deleted with the backup, swept as orphans, or cascaded with the book or the person;
--       a new account deletion request cancels every open restore request at once;
--       deleting a profile pseudonymises its escrow_unwraps rows with the consent pepper
--       (fails closed, 55000, like 20261015010000 G-12) and cascades every other backup row.
--
-- Approval (closes a gap in F08 6.5 C3): "Yes, it's mine" on an enrolled device must prove
-- that device holds its private key, or a stolen session could approve its own request with
-- the old phone's device id (device ids are readable by the owner). At request time the escrow
-- function seals a random 256-bit code to each enrolled device's public key; the device opens
-- it and sends the code back; the server compares SHA-256 hashes.
-- Only a device enrolled at least 7 days before the request gets a code or may approve, so a
-- stolen session cannot register a fresh device key and approve with it. Any other device of
-- the account seen in 90 days, or revoked in the last 7 days, still makes the hold 72 hours and
-- still sees the request with Not me (backup_pending_requests, backup_cancel_request); and while
-- a request is open no other device can be revoked (backup_revoke_device).
--
-- Release invariant: escrow_set_request_state(..., 'released') refuses unless escrow_unwraps
-- already holds an `opened` row for that request from the last hour, so no restore can be
-- marked released without its log rows (F08-REQ-042).
--
-- Byte format on the wire: client RPCs take a book key wrap as S07's SealedBox (jsonb: suite,
-- enc and ct in standard base64; packages/api recovery-key.ts) and other bytes as bytea
-- ('\x' and lowercase hex, which PostgREST takes in JSON bodies). Results carry sealed codes as
-- SealedBox; the escrow_* functions carry bytes as lowercase hex in fields ending _hex.
-- Escrow wraps are stored in format 1: 0x01 || HPKE enc (32) || ciphertext of the
-- 32-byte book key with its tag (48) = 81 bytes (RFC 9180 base mode, DHKEM(X25519, HKDF-SHA256),
-- HKDF-SHA256, AES-256-GCM; info and aad in supabase/functions/escrow/hpke.ts).
--
-- Reused for a short wait: 55P03 detail purging (backup_begin while the same path is queued for
-- the purge worker; class 55 is retried by every client).
-- New SQLSTATEs (request to S07 for packages/api envelope.ts):
--   SCBKO  backup or escrow is switched off on the server      wait; retry later; never drop
--   SCQTA  the account's backup quota is reached              tell the person (backup.quotaReached)
--   SCSTP  a sign-in in the last 10 minutes, in a live session, is needed   sign in again, then retry (reauth_required)
-- SQLSTATE details (closed values; the ones S07's packages/api ERROR_DETAILS already lists are
-- used as named there): SCBKO backupUploads | escrow; SCCON backup; SCDEL deletion_pending |
-- purged; P0002 device_unknown | entry | key | object | nothing; SCRAT limit_restores |
-- limit_keys | limit_keys_stored | devices | begin | pending; SCIMM key_exists | revoked | restore_open | a closed
-- request state; SCBKO rotation; 28000 session_ended; 22023 approvals | code | count | size.
-- Reused: SCCON, SCDEL, SCRAT, SCIMM, SCPAR, SCANO, P0002, 22023, 28000, 42501, 55000.
-- Tests: supabase/tests/audio_backup*.test.mjs (npm run test:db) and the rows for these objects
-- in supabase/tests/access_matrix.test.mjs.

-- ─── 0. Ledger kind, policy document, role ───────────────────────────────
-- Add 'audio_blob' to purge_ledger.entity_type without dropping any value another file added.
do $$
declare
  v_def text;
  v_vals text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
    from pg_constraint c
   where c.conrelid = 'public.purge_ledger'::regclass and c.conname = 'purge_ledger_entity_type_check';
  if v_def is null then
    raise exception 'purge_ledger_entity_type_check not found; apply the earlier files first';
  end if;
  select array_agg(m[1] order by m[1]) into v_vals from regexp_matches(v_def, '''([a-z_]+)''', 'g') as m;
  if not ('audio_blob' = any (v_vals)) then
    v_vals := v_vals || array['audio_blob'];
    alter table public.purge_ledger drop constraint purge_ledger_entity_type_check;
    -- Same shape as the original (entity_type in ('a', 'b')), so the next file can widen it the same way.
    execute format('alter table public.purge_ledger add constraint purge_ledger_entity_type_check check (entity_type in (%s))',
                   (select string_agg(quote_literal(v), ', ' order by v) from unnest(v_vals) as v));
  end if;
end;
$$;

insert into public.policy_documents (key, title, needs_affirmative_act)
values ('backup', 'Recording backup consent', true)
on conflict (key) do nothing;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'escrow_svc') then
    create role escrow_svc nologin noinherit nocreatedb nocreaterole noreplication connection limit 5;
  end if;
end;
$$;
alter role escrow_svc set statement_timeout = '5s';
alter role escrow_svc set search_path = pg_catalog, public;
grant usage on schema public to escrow_svc;

-- ─── 1. Settings and internal helpers ────────────────────────────────────
create or replace function public.backup_switch_on(p_switch text)
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select case p_switch
           when 'backup' then coalesce(current_setting('app.backup_enabled', true), '') = 'on'
           when 'escrow' then coalesce(current_setting('app.escrow_enabled', true), '') = 'on'
           else false end;
$$;

create or replace function public.backup_escrow_key_trusted(p_version int)
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select p_version is not null and p_version::text = any (
    string_to_array(regexp_replace(coalesce(current_setting('app.escrow_key_versions', true), '1'), '\s', '', 'g'), ','));
$$;

create or replace function public.backup_account_deleting(p_profile uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from deletion_requests d
                  where d.profile_id = p_profile and d.kind = 'account' and d.status in ('scheduled', 'held', 'executing'));
$$;

-- The one place that says whether a recording id still has its letter on the server: the
-- author's letter in that book, live or in Recently deleted (purge_due removes a tombstoned
-- letter, and with it the backup, on day 30; until then the owner can restore both).
-- WP-F14-22 (S02) adds the held_drafts branch here, in its own file, because backup_begin and
-- the orphan sweep must agree (request in the PR body).
create or replace function public.backup_entry_exists(p_entry uuid, p_author uuid, p_child uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from entries e where e.id = p_entry and e.author_id = p_author and e.child_id = p_child);
$$;

-- Whether an auth session still exists. Access tokens stay valid until they expire (up to an
-- hour) after a global sign-out; the session row does not, so this is what makes the stop link's
-- "sign out everywhere" end a stolen token at once for the backup and escrow calls that matter.
-- plpgsql so the body binds at call time (auth.sessions is Supabase Auth's table).
create or replace function public.backup_session_live(p_profile uuid, p_session uuid)
returns boolean language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if p_profile is null or p_session is null then
    return false;
  end if;
  return exists (select 1 from auth.sessions s
                  where s.id = p_session and s.user_id = p_profile and (s.not_after is null or s.not_after > now()));
end;
$$;

-- Step-up for destructive backup RPCs: the caller's newest sign-in (amr[].timestamp in the JWT
-- PostgREST passes) is at most 10 minutes old, and the token's session is still live. A
-- refreshed token keeps its amr, so a stolen refresh token does not pass. Same rule as the
-- escrow function's (F08 6.5 C1).
create or replace function public.backup_recent_sign_in()
returns boolean language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  c jsonb;
  v_sid uuid;
begin
  begin
    c := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
    v_sid := nullif(c ->> 'session_id', '')::uuid;
  exception when others then
    return false;
  end;
  if not coalesce((select max((m ->> 'timestamp')::numeric) >= extract(epoch from now()) - 600
                     from jsonb_array_elements(case when jsonb_typeof(c -> 'amr') = 'array' then c -> 'amr' else '[]'::jsonb end) m
                    where jsonb_typeof(m -> 'timestamp') = 'number'), false) then
    return false;
  end if;
  return public.backup_session_live(auth.uid(), v_sid);
end;
$$;

-- A rotation runs only while app.escrow_rotation names exactly this from:to pair (runbook R2).
create or replace function public.escrow_rotation_on(p_from int, p_to int)
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select p_from is not null and p_to is not null and p_from <> p_to
     and regexp_replace(coalesce(current_setting('app.escrow_rotation', true), ''), '\s', '', 'g') = p_from::text || ':' || p_to::text;
$$;

-- ─── 2. Tables ───────────────────────────────────────────────────────────
create table public.backup_devices (
  device_id uuid primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  public_key bytea not null unique check (octet_length(public_key) = 32),
  platform text not null default 'ios' check (platform in ('ios')),
  enrolled_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text check (revoked_reason in ('owner', 'not_me', 'deletion')),
  check ((revoked_at is null) = (revoked_reason is null))
);
create index backup_devices_profile_idx on public.backup_devices (profile_id);

create table public.child_keys (
  child_id uuid not null references public.children(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  key_version int not null check (key_version between 1 and 1000),
  escrow_wrap bytea not null check (octet_length(escrow_wrap) between 49 and 512),
  escrow_key_version int not null check (escrow_key_version >= 1),
  key_check bytea check (octet_length(key_check) = 16),
  created_at timestamptz not null default now(),
  rewrapped_at timestamptz,
  primary key (child_id, profile_id, key_version)
);
create index child_keys_profile_idx on public.child_keys (profile_id);
create index child_keys_escrow_version_idx on public.child_keys (escrow_key_version);

create table public.audio_blobs (
  entry_id uuid primary key,
  child_id uuid not null references public.children(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  object_path text not null unique,
  key_version int not null,
  wrapped_file_key bytea not null check (octet_length(wrapped_file_key) between 40 and 256),
  cipher_sha256 bytea check (octet_length(cipher_sha256) = 32),
  bytes bigint not null check (bytes between 1 and 20971520),
  format_version smallint not null default 1 check (format_version between 1 and 100),
  state text not null default 'pending' check (state in ('pending', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint audio_blobs_path_scoped check (object_path = child_id::text || '/' || author_id::text || '/' || entry_id::text || '.m4a.enc'),
  constraint audio_blobs_confirmed check ((state = 'confirmed') = (cipher_sha256 is not null and confirmed_at is not null)),
  foreign key (child_id, author_id, key_version) references public.child_keys (child_id, profile_id, key_version) on delete cascade
);
create index audio_blobs_author_idx on public.audio_blobs (author_id, state);
create index audio_blobs_child_idx on public.audio_blobs (child_id);
create index audio_blobs_key_idx on public.audio_blobs (child_id, author_id, key_version);

create table public.backup_usage (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  quota_bytes bigint not null default 5368709120 check (quota_bytes > 0),
  used_bytes bigint not null default 0 check (used_bytes >= 0),
  begin_window_start timestamptz not null default now(),
  begin_window_hits int not null default 0 check (begin_window_hits >= 0),
  updated_at timestamptz not null default now()
);

create table public.restore_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid not null references public.backup_devices(device_id) on delete cascade,
  state text not null default 'requested' check (state in ('requested', 'approved', 'released', 'cancelled', 'expired')),
  requested_at timestamptz not null default now(),
  hold_until timestamptz not null,
  notified_at timestamptz,
  approved_by_device uuid references public.backup_devices(device_id) on delete set null,
  approved_at timestamptz,
  released_at timestamptz,
  cancelled_at timestamptz,
  cancel_source text check (cancel_source in ('stop_link', 'enrolled_device', 'owner', 'deletion')),
  expired_at timestamptz,
  request_id text check (request_id ~ '^[0-9a-f]{12}$'),
  stop_token_hash bytea not null unique check (octet_length(stop_token_hash) = 32),
  stop_token_expires_at timestamptz not null,
  stop_used_at timestamptz,
  check ((state = 'cancelled') = (cancelled_at is not null and cancel_source is not null)),
  check ((state = 'approved') <= (approved_at is not null)),
  check ((state = 'released') = (released_at is not null))
);
create index restore_requests_profile_idx on public.restore_requests (profile_id, requested_at);
create unique index restore_requests_one_open_per_device on public.restore_requests (device_id)
  where state in ('requested', 'approved');

create table public.restore_approvals (
  request_id uuid not null references public.restore_requests(id) on delete cascade,
  device_id uuid not null references public.backup_devices(device_id) on delete cascade,
  sealed_code bytea not null check (octet_length(sealed_code) between 49 and 512),
  code_hash bytea not null check (octet_length(code_hash) = 32),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  primary key (request_id, device_id)
);
create index restore_approvals_device_idx on public.restore_approvals (device_id);

create table public.escrow_unwraps (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id),
  subject_hash bytea check (octet_length(subject_hash) = 32),
  device_id uuid,
  child_id uuid not null,
  key_version int not null,
  escrow_key_version int not null,
  reason text not null check (reason in ('restore', 'rotation', 'legal')),
  outcome text not null check (outcome in ('opened', 'failed')),
  restore_request_id uuid,
  request_id text check (request_id ~ '^[0-9a-f]{12}$'),
  occurred_at timestamptz not null default now(),
  check ((profile_id is null) <> (subject_hash is null)),
  check ((reason = 'restore') = (restore_request_id is not null and device_id is not null))
);
create index escrow_unwraps_profile_idx on public.escrow_unwraps (profile_id, occurred_at);
create index escrow_unwraps_request_idx on public.escrow_unwraps (restore_request_id);
create index escrow_unwraps_occurred_idx on public.escrow_unwraps (occurred_at);

-- One row per account per rotation, made with the account's first rewrapped key in the same
-- transaction, kept until the rotation email has gone (retried on every rotation call).
create table public.escrow_rotation_notices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  to_version int not null check (to_version >= 1),
  created_at timestamptz not null default now(),
  attempts int not null default 0 check (attempts >= 0),
  sent_at timestamptz,
  unique (profile_id, to_version)
);
create index escrow_rotation_notices_due_idx on public.escrow_rotation_notices (to_version, created_at) where sent_at is null;

-- ─── 3. Classification (docs/legal/DATA_CLASSIFICATION.md; rows requested from S17) ──
comment on table public.backup_devices is 'One X25519 public key per install for sealing book keys to it (F08 6.5). Owner read; written by RPCs.';
comment on column public.backup_devices.device_id is 'L3 random id the install made; not a hardware id';
comment on column public.backup_devices.profile_id is 'L3 owner';
comment on column public.backup_devices.public_key is 'L3 X25519 public key (32 bytes); the private key never leaves the device';
comment on column public.backup_devices.platform is 'L2 ios';
comment on column public.backup_devices.enrolled_at is 'L2 when the device registered';
comment on column public.backup_devices.last_seen_at is 'L2 last backup call from this device (the 90-day enrolled rule)';
comment on column public.backup_devices.revoked_at is 'L2 when the device was revoked';
comment on column public.backup_devices.revoked_reason is 'L2 owner, not_me or deletion';

comment on table public.child_keys is 'Escrow wrap of each book key per (child, author, version). Clients read every column except escrow_wrap.';
comment on column public.child_keys.child_id is 'L3 book';
comment on column public.child_keys.profile_id is 'L3 author whose recordings this key protects';
comment on column public.child_keys.key_version is 'L2 book key version';
comment on column public.child_keys.escrow_wrap is 'L4 book key sealed to the escrow public key (HPKE); opened only inside the escrow function';
comment on column public.child_keys.escrow_key_version is 'L2 escrow public key version the wrap targets';
comment on column public.child_keys.key_check is 'L3 16-byte HMAC under the book key (S05 client): tells a phone whether its local key is the one escrowed; reveals nothing about the key';
comment on column public.child_keys.created_at is 'L2 created';
comment on column public.child_keys.rewrapped_at is 'L2 last escrow key rotation of this row';

comment on table public.audio_blobs is 'One row per uploaded recording (ciphertext in entry-audio). Owner read; written by RPCs. No FK to entries: held letters have none (R3 DX-01).';
comment on column public.audio_blobs.entry_id is 'L3 the letter (draft) id; also the object name';
comment on column public.audio_blobs.child_id is 'L3 book';
comment on column public.audio_blobs.author_id is 'L3 author and only reader';
comment on column public.audio_blobs.object_path is 'L3 exact object path {child}/{author}/{entry}.m4a.enc; ids only';
comment on column public.audio_blobs.key_version is 'L2 book key version the file key is wrapped under';
comment on column public.audio_blobs.wrapped_file_key is 'L4 file key wrapped by the book key (useless without the book key)';
comment on column public.audio_blobs.cipher_sha256 is 'L3 SHA-256 of the ciphertext, for transfer checks; never of the original';
comment on column public.audio_blobs.bytes is 'L2 ciphertext size';
comment on column public.audio_blobs.format_version is 'L2 object format version';
comment on column public.audio_blobs.state is 'L2 pending or confirmed';
comment on column public.audio_blobs.created_at is 'L2 created';
comment on column public.audio_blobs.updated_at is 'L2 updated';
comment on column public.audio_blobs.confirmed_at is 'L2 confirmed';

comment on table public.backup_usage is 'Backup bytes per account against the quota, and the backup_begin rate window.';
comment on column public.backup_usage.profile_id is 'L3 account';
comment on column public.backup_usage.quota_bytes is 'L2 quota (5 GiB by default; support may raise it)';
comment on column public.backup_usage.used_bytes is 'L2 bytes of pending and confirmed objects';
comment on column public.backup_usage.begin_window_start is 'L2 start of the current hour window';
comment on column public.backup_usage.begin_window_hits is 'L2 backup_begin calls that made a row in the window';
comment on column public.backup_usage.updated_at is 'L2 updated';

comment on table public.restore_requests is 'New-device restore requests and their holds (F08 6.5 C). Owner read except the stop token hash; written by RPCs and escrow_* functions.';
comment on column public.restore_requests.id is 'L3 request';
comment on column public.restore_requests.profile_id is 'L3 account';
comment on column public.restore_requests.device_id is 'L3 the requesting device';
comment on column public.restore_requests.state is 'L2 requested, approved, released, cancelled or expired';
comment on column public.restore_requests.requested_at is 'L2 requested';
comment on column public.restore_requests.hold_until is 'L2 earliest release without an approval';
comment on column public.restore_requests.notified_at is 'L2 when the request email went to the account address';
comment on column public.restore_requests.approved_by_device is 'L3 enrolled device that approved';
comment on column public.restore_requests.approved_at is 'L2 approved';
comment on column public.restore_requests.released_at is 'L2 released';
comment on column public.restore_requests.cancelled_at is 'L2 cancelled';
comment on column public.restore_requests.cancel_source is 'L2 stop_link, enrolled_device, owner or deletion';
comment on column public.restore_requests.expired_at is 'L2 expired';
comment on column public.restore_requests.request_id is 'L2 the x-request-id of the call that made the request';
comment on column public.restore_requests.stop_token_hash is 'L3 SHA-256 of the single-use stop link token';
comment on column public.restore_requests.stop_token_expires_at is 'L2 stop link expiry (7 days)';
comment on column public.restore_requests.stop_used_at is 'L2 when the stop link was used';

comment on table public.restore_approvals is 'One sealed approval code per enrolled device per restore request. Owner read except the code hash.';
comment on column public.restore_approvals.request_id is 'L3 request';
comment on column public.restore_approvals.device_id is 'L3 enrolled device the code is sealed to';
comment on column public.restore_approvals.sealed_code is 'L3 random code sealed to that device (HPKE); only that device can open it';
comment on column public.restore_approvals.code_hash is 'L3 SHA-256 of the code';
comment on column public.restore_approvals.created_at is 'L2 created';
comment on column public.restore_approvals.used_at is 'L2 when the code approved the request';

comment on table public.escrow_unwraps is 'Recovery-key access log (F08-REQ-042): append-only; one row per book key opened by the escrow function. Owner read of own rows.';
comment on column public.escrow_unwraps.id is 'L2 row';
comment on column public.escrow_unwraps.profile_id is 'L3 account; null after account deletion (pseudonymised, kept 24 months)';
comment on column public.escrow_unwraps.subject_hash is 'L3 peppered SHA-256 of the deleted account id (same pepper as policy_acceptances)';
comment on column public.escrow_unwraps.device_id is 'L3 device the key was sealed to (restore)';
comment on column public.escrow_unwraps.child_id is 'L3 book';
comment on column public.escrow_unwraps.key_version is 'L2 book key version';
comment on column public.escrow_unwraps.escrow_key_version is 'L2 escrow key version used to open it';
comment on column public.escrow_unwraps.reason is 'L2 restore, rotation or legal';
comment on column public.escrow_unwraps.outcome is 'L2 opened or failed';
comment on column public.escrow_unwraps.restore_request_id is 'L3 restore request (restore only)';
comment on column public.escrow_unwraps.request_id is 'L2 x-request-id of the call';
comment on column public.escrow_unwraps.occurred_at is 'L2 when';

comment on table public.escrow_rotation_notices is 'One rotation email per account per escrow key rotation (F08 6.5 G4), retried until sent. No client access.';
comment on column public.escrow_rotation_notices.id is 'L2 notice (also the email idempotency key)';
comment on column public.escrow_rotation_notices.profile_id is 'L3 account';
comment on column public.escrow_rotation_notices.to_version is 'L2 escrow key version the account moved to';
comment on column public.escrow_rotation_notices.created_at is 'L2 created';
comment on column public.escrow_rotation_notices.attempts is 'L2 failed sends';
comment on column public.escrow_rotation_notices.sent_at is 'L2 when the email went';

-- ─── 4. Row level security ───────────────────────────────────────────────
alter table public.backup_devices enable row level security;
alter table public.child_keys enable row level security;
alter table public.audio_blobs enable row level security;
alter table public.backup_usage enable row level security;
alter table public.restore_requests enable row level security;
alter table public.restore_approvals enable row level security;
alter table public.escrow_unwraps enable row level security;
alter table public.escrow_rotation_notices enable row level security;

create policy backup_devices_own on public.backup_devices for select to authenticated using (profile_id = (select auth.uid()));
create policy child_keys_own on public.child_keys for select to authenticated using (profile_id = (select auth.uid()));
create policy audio_blobs_own on public.audio_blobs for select to authenticated using (author_id = (select auth.uid()));
create policy backup_usage_own on public.backup_usage for select to authenticated using (profile_id = (select auth.uid()));
create policy restore_requests_own on public.restore_requests for select to authenticated using (profile_id = (select auth.uid()));
create policy restore_approvals_own on public.restore_approvals for select to authenticated using (
  exists (select 1 from public.restore_requests r
           where r.id = restore_approvals.request_id and r.profile_id = (select auth.uid())));
create policy escrow_unwraps_own on public.escrow_unwraps for select to authenticated using (profile_id = (select auth.uid()));

create policy backup_devices_no_anonymous on public.backup_devices as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy child_keys_no_anonymous on public.child_keys as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy audio_blobs_no_anonymous on public.audio_blobs as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy backup_usage_no_anonymous on public.backup_usage as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy restore_requests_no_anonymous on public.restore_requests as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy restore_approvals_no_anonymous on public.restore_approvals as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy escrow_unwraps_no_anonymous on public.escrow_unwraps as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
create policy escrow_rotation_notices_no_anonymous on public.escrow_rotation_notices as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));

-- Clients only read, and only the columns they need: every write goes through a function.
-- Supabase grants new tables to anon, authenticated and service_role by default; take that back
-- first. The service role too: the purge worker and the stop endpoint use the backup_svc_*
-- functions only, so a leaked service key cannot rewrite reservations, wraps, devices, requests
-- or approvals directly (it still bypasses RLS on every other table; runbook 6, honest limits).
revoke all on public.backup_devices, public.child_keys, public.audio_blobs, public.backup_usage,
  public.restore_requests, public.restore_approvals, public.escrow_unwraps, public.escrow_rotation_notices
  from anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on public.backup_devices, public.child_keys, public.audio_blobs, public.backup_usage,
      public.restore_requests, public.restore_approvals, public.escrow_unwraps, public.escrow_rotation_notices
      from service_role;
    revoke all on sequence public.escrow_unwraps_id_seq from service_role;
  end if;
  revoke all on sequence public.escrow_unwraps_id_seq from anon, authenticated;
end;
$$;
grant select on public.backup_devices, public.audio_blobs, public.backup_usage, public.escrow_unwraps to authenticated;
grant select (child_id, profile_id, key_version, escrow_key_version, key_check, created_at, rewrapped_at) on public.child_keys to authenticated;
grant select (id, profile_id, device_id, state, requested_at, hold_until, notified_at, approved_by_device, approved_at,
              released_at, cancelled_at, cancel_source, expired_at) on public.restore_requests to authenticated;
grant select (request_id, device_id, sealed_code, created_at, used_at) on public.restore_approvals to authenticated;

-- ─── 5. Triggers: quota, purge by exact path, append-only log, deletion ──
create or replace function public.audio_blobs_after_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into backup_usage as u (profile_id, used_bytes) values (new.author_id, new.bytes)
    on conflict (profile_id) do update set used_bytes = u.used_bytes + excluded.used_bytes, updated_at = now();
    return new;
  elsif tg_op = 'UPDATE' then
    if new.bytes <> old.bytes then
      update backup_usage set used_bytes = greatest(0, used_bytes + new.bytes - old.bytes), updated_at = now()
       where profile_id = new.author_id;
    end if;
    return new;
  end if;
  -- DELETE, from any path (purge, discard, delete all, sweep, book or account cascade):
  -- the object goes by its exact path, and the ledger records both (F08-REQ-024, -043).
  update backup_usage set used_bytes = greatest(0, used_bytes - old.bytes), updated_at = now()
   where profile_id = old.author_id;
  perform public.enqueue_storage_purge('entry-audio', old.object_path, false, 'entry_purge');
  insert into purge_ledger (entity_type, entity_id) values
    ('audio_blob', old.entry_id::text),
    ('storage_object', 'entry-audio/' || old.object_path)
  on conflict do nothing;
  return old;
end;
$$;
create trigger audio_blobs_after_change after insert or update or delete on public.audio_blobs
  for each row execute function public.audio_blobs_after_change();

create or replace function public.audio_blobs_touch()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  end if;
  if new.entry_id <> old.entry_id or new.author_id <> old.author_id then
    raise exception 'audio_blobs: entry and author never change' using errcode = 'SCIMM';
  end if;
  return new;
end;
$$;
create trigger audio_blobs_touch before update on public.audio_blobs
  for each row execute function public.audio_blobs_touch();

-- The log is append-only for every role (F08-REQ-042). Two exceptions, each checked here on
-- the row itself, never on who is asking: (1) the deletion pseudonymisation, which may set
-- profile_id to null and subject_hash to exactly sha256(profile_id || pepper) and change
-- nothing else; (2) retention, which may delete rows older than 24 months.
create or replace function public.escrow_unwraps_guard()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
declare v_pepper text := coalesce(current_setting('app.consent_pepper', true), '');
begin
  if tg_op = 'DELETE' then
    if old.occurred_at < now() - interval '24 months' then
      return old;
    end if;
    raise exception 'escrow_unwraps is append-only' using errcode = 'SCIMM';
  end if;
  if old.profile_id is not null and new.profile_id is null and old.subject_hash is null
     and char_length(btrim(v_pepper)) >= 32
     and new.subject_hash = sha256(convert_to(old.profile_id::text || v_pepper, 'UTF8'))
     and (new.id, new.device_id, new.child_id, new.key_version, new.escrow_key_version, new.reason, new.outcome,
          new.restore_request_id, new.request_id, new.occurred_at)
         is not distinct from
         (old.id, old.device_id, old.child_id, old.key_version, old.escrow_key_version, old.reason, old.outcome,
          old.restore_request_id, old.request_id, old.occurred_at) then
    return new;
  end if;
  raise exception 'escrow_unwraps is append-only' using errcode = 'SCIMM';
end;
$$;
create trigger escrow_unwraps_guard before update or delete on public.escrow_unwraps
  for each row execute function public.escrow_unwraps_guard();

create or replace function public.escrow_unwraps_no_truncate()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  raise exception 'escrow_unwraps is append-only' using errcode = 'SCIMM';
end;
$$;
create trigger escrow_unwraps_no_truncate before truncate on public.escrow_unwraps
  for each statement execute function public.escrow_unwraps_no_truncate();

-- Account deletion: the log stays 24 months under a pseudonym (F17 8.4 named exception).
-- Fails closed without the pepper, like policy_acceptances in 20261015010000 (G-12), so the
-- deletion step retries instead of keeping a reversible id.
create or replace function public.profiles_pseudonymise_escrow_unwraps()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_pepper text := coalesce(current_setting('app.consent_pepper', true), '');
begin
  if not exists (select 1 from escrow_unwraps where profile_id = old.id) then
    return old;
  end if;
  if char_length(btrim(v_pepper)) < 32 then
    raise exception 'app.consent_pepper is missing or shorter than 32 characters; set it before deleting accounts (supabase/APPLY.md step 6)'
      using errcode = '55000';
  end if;
  update escrow_unwraps
     set subject_hash = sha256(convert_to(old.id::text || v_pepper, 'UTF8')), profile_id = null
   where profile_id = old.id;
  return old;
end;
$$;
create trigger profiles_pseudonymise_escrow_unwraps before delete on public.profiles
  for each row execute function public.profiles_pseudonymise_escrow_unwraps();

-- A letter's backup goes with the letter, in the same transaction (F08 6.5 D4).
create or replace function public.backup_forget_entry(p_entry uuid)
returns int language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_n int;
begin
  delete from audio_blobs where entry_id = p_entry;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function public.entries_backup_forget()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  perform public.backup_forget_entry(old.id);
  return old;
end;
$$;
create trigger entries_backup_forget after delete on public.entries
  for each row execute function public.entries_backup_forget();

-- A new account deletion request cancels every open restore request at once (F17 8.4).
create or replace function public.deletion_requests_backup_cancel()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if new.kind = 'account' and new.profile_id is not null and new.status in ('scheduled', 'held', 'executing') then
    update restore_requests
       set state = 'cancelled', cancelled_at = now(), cancel_source = 'deletion'
     where profile_id = new.profile_id and state in ('requested', 'approved');
  end if;
  return new;
end;
$$;
create trigger deletion_requests_backup_cancel after insert or update of status on public.deletion_requests
  for each row execute function public.deletion_requests_backup_cancel();

-- ─── 6. Bucket and Storage policies ──────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entry-audio', 'entry-audio', false, 20971520, array['application/octet-stream'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Write: only the exact path of the caller's own pending row, while backup is on and the
-- backup consent is active. Overwrite is allowed only while pending (a resumed upload);
-- a confirmed object is never replaced.
create or replace function public.backup_object_writable(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select auth.uid() is not null
     and not public.is_anonymous()
     and public.backup_switch_on('backup')
     and public.has_active_consent(auth.uid(), 'backup')
     and exists (select 1 from audio_blobs b
                  where b.object_path = p_name and b.author_id = auth.uid() and b.state = 'pending');
$$;

-- Read: only the caller's own objects. Never switched off and never consent-gated: restoring
-- what is backed up is always free and always allowed (C-NFR-008, F08 6.5 D3 "keep").
create or replace function public.backup_object_readable(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select auth.uid() is not null
     and not public.is_anonymous()
     and exists (select 1 from audio_blobs b where b.object_path = p_name and b.author_id = auth.uid());
$$;

create policy entry_audio_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'entry-audio' and public.backup_object_writable(name));
create policy entry_audio_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'entry-audio' and public.backup_object_writable(name))
  with check (bucket_id = 'entry-audio' and public.backup_object_writable(name));
create policy entry_audio_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'entry-audio' and public.backup_object_readable(name));
create policy entry_audio_no_anonymous on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'entry-audio' or not (select public.is_anonymous()))
  with check (bucket_id <> 'entry-audio' or not (select public.is_anonymous()));

-- ─── 7. Client RPCs ──────────────────────────────────────────────────────
create or replace function public.backup_register_device(p_device_id uuid, p_public_key bytea)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_row backup_devices%rowtype;
begin
  if p_device_id is null or p_public_key is null or octet_length(p_public_key) <> 32 then
    raise exception 'a device id and a 32-byte X25519 public key are required' using errcode = '22023';
  end if;
  if public.backup_account_deleting(v_uid) then
    raise exception 'this account is being deleted' using errcode = 'SCDEL', detail = 'deletion_pending';
  end if;
  select * into v_row from backup_devices where device_id = p_device_id;
  if found then
    if v_row.profile_id <> v_uid or v_row.public_key <> p_public_key then
      raise exception 'device id already in use' using errcode = 'SCIMM';
    end if;
    if v_row.revoked_at is not null then
      raise exception 'this device was revoked; make a new device key' using errcode = 'SCIMM', detail = 'revoked';
    end if;
    update backup_devices set last_seen_at = now() where device_id = p_device_id;
    return jsonb_build_object('device_id', p_device_id, 'enrolled_at', v_row.enrolled_at, 'created', false);
  end if;
  if exists (select 1 from backup_devices where public_key = p_public_key) then
    raise exception 'public key already registered' using errcode = 'SCIMM';
  end if;
  if (select count(*) from backup_devices where profile_id = v_uid and revoked_at is null) >= 10
     or (select count(*) from backup_devices where profile_id = v_uid and enrolled_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many devices' using errcode = 'SCRAT', detail = 'devices';
  end if;
  insert into backup_devices (device_id, profile_id, public_key) values (p_device_id, v_uid, p_public_key)
  returning * into v_row;
  return jsonb_build_object('device_id', p_device_id, 'enrolled_at', v_row.enrolled_at, 'created', true);
end;
$$;

create or replace function public.backup_revoke_device(p_device_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_n int;
begin
  -- While a restore request is open, only the requesting device may be revoked: a stolen session
  -- must not silence the old phone's approval sheet during the hold. Stop works from any phone
  -- and from the email. The account's device rows are locked first, as escrow_open_request locks
  -- them, so a revoke and a new request cannot pass each other.
  perform 1 from backup_devices where profile_id = v_uid for update;
  if exists (select 1 from restore_requests r where r.profile_id = v_uid and r.state in ('requested', 'approved')
                and r.device_id <> p_device_id) then
    raise exception 'a restore request is open; stop it first' using errcode = 'SCIMM', detail = 'restore_open';
  end if;
  update backup_devices set revoked_at = coalesce(revoked_at, now()), revoked_reason = coalesce(revoked_reason, 'owner')
   where device_id = p_device_id and profile_id = v_uid;
  if not found then raise exception 'device not found' using errcode = 'P0002'; end if;
  update restore_requests set state = 'cancelled', cancelled_at = now(), cancel_source = 'owner'
   where device_id = p_device_id and profile_id = v_uid and state in ('requested', 'approved');
  get diagnostics v_n = row_count;
  return jsonb_build_object('revoked', true, 'cancelled', v_n);
end;
$$;

-- Store the escrow wrap of a book key the phone made (F08 6.5 A step 4). The wrap arrives as
-- S07's SealedBox ({suite, enc, ct}, base64; packages/api recovery-key.ts) and is stored in
-- format 1 (0x01 || enc || ct, 81 bytes). v1.0 has one book key per (child, author): a second
-- version is refused (SCIMM key_exists), so a phone that lacks the Keychain item restores
-- instead of making a new key (F08-REQ-028). p_key_check (16 bytes, an HMAC under the book key
-- that the phone computes) lets another of the author's phones tell whether its local key is
-- the one escrowed; it reveals nothing about the key.
create or replace function public.backup_store_key(p_child uuid, p_key_version int, p_escrow_key_version int, p_wrap jsonb,
                                                   p_key_check bytea default null)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_row child_keys%rowtype;
  v_enc bytea;
  v_ct bytea;
  v_wrap bytea;
begin
  if not public.backup_switch_on('backup') then
    raise exception 'backup is switched off' using errcode = 'SCBKO', detail = 'backupUploads';
  end if;
  if not public.has_active_consent(v_uid, 'backup') then
    raise exception 'backup consent required' using errcode = 'SCCON', detail = 'backup';
  end if;
  if public.backup_account_deleting(v_uid) then
    raise exception 'this account is being deleted' using errcode = 'SCDEL', detail = 'deletion_pending';
  end if;
  begin
    if p_wrap is null or jsonb_typeof(p_wrap) <> 'object'
       or (select count(*) from jsonb_object_keys(p_wrap) k where k not in ('suite', 'enc', 'ct')) > 0
       or p_wrap ->> 'suite' is distinct from 'hpke-x25519-sha256-aes256gcm' then
      raise exception 'bad wrap' using errcode = '22023';
    end if;
    v_enc := decode(p_wrap ->> 'enc', 'base64');
    v_ct := decode(p_wrap ->> 'ct', 'base64');
  exception when others then
    raise exception 'the wrap must be a SealedBox: suite hpke-x25519-sha256-aes256gcm, enc 32 bytes, ct 48 bytes' using errcode = '22023';
  end;
  if v_enc is null or v_ct is null or octet_length(v_enc) <> 32 or octet_length(v_ct) <> 48 then
    raise exception 'the wrap must be a SealedBox: suite hpke-x25519-sha256-aes256gcm, enc 32 bytes, ct 48 bytes' using errcode = '22023';
  end if;
  v_wrap := '\x01'::bytea || v_enc || v_ct;
  if p_key_check is not null and octet_length(p_key_check) <> 16 then
    raise exception 'key_check must be 16 bytes' using errcode = '22023';
  end if;
  if not public.backup_escrow_key_trusted(p_escrow_key_version) then
    raise exception 'unknown escrow key version' using errcode = '22023';
  end if;
  if p_child is null or not public.is_child_parent(p_child) or not public.child_is_live(p_child) then
    raise exception 'only a parent of a live book can back up its recordings' using errcode = 'SCPAR';
  end if;
  select * into v_row from child_keys where child_id = p_child and profile_id = v_uid order by key_version desc limit 1;
  if found then
    if v_row.key_version = p_key_version and v_row.escrow_wrap = v_wrap and v_row.escrow_key_version = p_escrow_key_version
       and v_row.key_check is not distinct from p_key_check then
      return jsonb_build_object('child_id', p_child, 'key_version', p_key_version, 'created', false);
    end if;
    raise exception 'a book key already exists for this book; restore it instead'
      using errcode = 'SCIMM', detail = 'key_exists', hint = v_row.key_version::text;
  end if;
  if p_key_version is distinct from 1 then
    raise exception 'the first book key is version 1' using errcode = '22023';
  end if;
  if (select count(*) from child_keys where profile_id = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too many keys today' using errcode = 'SCRAT', detail = 'limit_keys_stored';
  end if;
  insert into child_keys (child_id, profile_id, key_version, escrow_wrap, escrow_key_version, key_check)
  values (p_child, v_uid, 1, v_wrap, p_escrow_key_version, p_key_check);
  return jsonb_build_object('child_id', p_child, 'key_version', 1, 'created', true);
end;
$$;

-- Reserve an upload (F08 6.5 A step 5, F 6.5 F). Returns the one path the Storage policies let
-- this caller write. A repeat with the same arguments resumes; with other arguments while still
-- pending, it replaces the reservation (a re-encryption after backup-tmp was swept).
create or replace function public.backup_begin(p_entry uuid, p_child uuid, p_bytes bigint, p_key_version int,
                                               p_wrapped_file_key bytea, p_format_version smallint default 1)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_row audio_blobs%rowtype;
  v_use backup_usage%rowtype;
  v_path text;
  v_delta bigint;
begin
  if not public.backup_switch_on('backup') then
    raise exception 'backup is switched off' using errcode = 'SCBKO', detail = 'backupUploads';
  end if;
  if not public.has_active_consent(v_uid, 'backup') then
    raise exception 'backup consent required' using errcode = 'SCCON', detail = 'backup';
  end if;
  if public.backup_account_deleting(v_uid) then
    raise exception 'this account is being deleted' using errcode = 'SCDEL', detail = 'deletion_pending';
  end if;
  if p_entry is null or p_child is null or p_bytes is null or p_bytes < 1 or p_bytes > 20971520
     or p_wrapped_file_key is null or octet_length(p_wrapped_file_key) not between 40 and 256
     or p_format_version is null or p_format_version not between 1 and 100 then
    raise exception 'invalid backup arguments' using errcode = '22023';
  end if;
  if not public.is_child_parent(p_child) or not public.child_is_live(p_child) then
    raise exception 'only a parent of a live book can back up its recordings' using errcode = 'SCPAR';
  end if;
  if not exists (select 1 from child_keys where child_id = p_child and profile_id = v_uid and key_version = p_key_version) then
    raise exception 'store the book key first' using errcode = 'P0002', detail = 'key';
  end if;
  -- A purged letter never comes back. A purged backup of a live letter may be made again (after
  -- "Delete the backup", a stale reservation, a server restore), so only the entry kind refuses.
  if exists (select 1 from purge_ledger where entity_type = 'entry' and entity_id = p_entry::text) then
    raise exception 'this letter was deleted' using errcode = 'SCDEL', detail = 'purged';
  end if;
  v_path := p_child::text || '/' || v_uid::text || '/' || p_entry::text || '.m4a.enc';
  -- The same path still waiting for the purge worker: an upload now would be deleted by that
  -- queue row, so wait (55P03 is retried by every client, ADR 0017).
  if exists (select 1 from storage_purge_queue q
              where q.bucket_id = 'entry-audio' and q.object_path = v_path and q.done_at is null) then
    raise exception 'the previous backup of this recording is still being removed' using errcode = '55P03', detail = 'purging';
  end if;

  select * into v_row from audio_blobs where entry_id = p_entry for update;
  if found then
    if v_row.author_id <> v_uid or v_row.child_id <> p_child then
      raise exception 'recording id already in use' using errcode = 'SCIMM';
    end if;
    if v_row.state = 'confirmed' then
      return jsonb_build_object('object_path', v_row.object_path, 'state', 'confirmed', 'created', false);
    end if;
    if (v_row.bytes, v_row.key_version, v_row.wrapped_file_key, v_row.format_version)
       = (p_bytes, p_key_version, p_wrapped_file_key, p_format_version) then
      return jsonb_build_object('object_path', v_row.object_path, 'state', 'pending', 'created', false);
    end if;
  elsif not public.backup_entry_exists(p_entry, v_uid, p_child)
        or exists (select 1 from entries e where e.id = p_entry and e.deleted_at is not null) then
    raise exception 'the letter is not on the server yet, or is in Recently deleted' using errcode = 'P0002', detail = 'entry';
  end if;

  insert into backup_usage (profile_id) values (v_uid) on conflict (profile_id) do nothing;
  select * into v_use from backup_usage where profile_id = v_uid for update;
  v_delta := p_bytes - coalesce(v_row.bytes, 0);
  if v_use.used_bytes + v_delta > v_use.quota_bytes then
    raise exception 'backup quota reached' using errcode = 'SCQTA';
  end if;

  if v_row.entry_id is not null then
    update audio_blobs set bytes = p_bytes, key_version = p_key_version, wrapped_file_key = p_wrapped_file_key,
                           format_version = p_format_version
     where entry_id = p_entry;
    return jsonb_build_object('object_path', v_row.object_path, 'state', 'pending', 'created', false, 'replaced', true);
  end if;

  -- The quota counts reserved sizes, and backup_confirm accepts only an object of exactly that
  -- size; so at most 20 reservations may wait at once (with the bucket's 20 MB object limit,
  -- at most 400 MB in flight past the quota), and the daily sweep drops them after 24 hours.
  if (select count(*) from audio_blobs where author_id = v_uid and state = 'pending') >= 20 then
    raise exception 'finish the uploads already reserved first' using errcode = 'SCRAT', detail = 'pending';
  end if;
  if v_use.begin_window_start <= now() - interval '1 hour' then
    update backup_usage set begin_window_start = now(), begin_window_hits = 1 where profile_id = v_uid;
  elsif v_use.begin_window_hits >= 600 then
    raise exception 'too many backups this hour' using errcode = 'SCRAT', detail = 'begin';
  else
    update backup_usage set begin_window_hits = begin_window_hits + 1 where profile_id = v_uid;
  end if;
  insert into audio_blobs (entry_id, child_id, author_id, object_path, key_version, wrapped_file_key, bytes, format_version)
  values (p_entry, p_child, v_uid, v_path, p_key_version, p_wrapped_file_key, p_bytes, p_format_version);
  return jsonb_build_object('object_path', v_path, 'state', 'pending', 'created', true);
end;
$$;

-- Mark an upload done (F08 6.5 A step 6): the object must exist at the row's path and its size,
-- as Storage records it, must be exactly the reserved size. No recorded size: not yet (P0002
-- object, retried), never confirmed on trust. Only then does the phone say "Backed up".
create or replace function public.backup_confirm(p_entry uuid, p_cipher_sha256 bytea)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_row audio_blobs%rowtype;
  v_size bigint;
  v_has_meta boolean;
begin
  if p_cipher_sha256 is null or octet_length(p_cipher_sha256) <> 32 then
    raise exception 'cipher_sha256 must be a SHA-256 (32 bytes)' using errcode = '22023';
  end if;
  select * into v_row from audio_blobs where entry_id = p_entry and author_id = v_uid for update;
  if not found then raise exception 'no backup for this recording' using errcode = 'P0002'; end if;
  if v_row.state = 'confirmed' then
    if v_row.cipher_sha256 = p_cipher_sha256 then
      return jsonb_build_object('state', 'confirmed', 'confirmed_at', v_row.confirmed_at, 'created', false);
    end if;
    raise exception 'this recording was confirmed with another hash' using errcode = 'SCIMM';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'entry-audio' and o.name = v_row.object_path) then
    raise exception 'the object has not arrived' using errcode = 'P0002', detail = 'object';
  end if;
  select exists (select 1 from information_schema.columns
                  where table_schema = 'storage' and table_name = 'objects' and column_name = 'metadata') into v_has_meta;
  if v_has_meta then
    execute 'select case when jsonb_typeof(o.metadata -> ''size'') = ''number'' then (o.metadata ->> ''size'')::bigint end
               from storage.objects o where o.bucket_id = ''entry-audio'' and o.name = $1'
      into v_size using v_row.object_path;
  end if;
  if v_size is null then
    raise exception 'the object has no recorded size yet' using errcode = 'P0002', detail = 'object';
  end if;
  if v_size <> v_row.bytes then
    raise exception 'the object size does not match the reservation' using errcode = '22023', detail = 'size';
  end if;
  update audio_blobs set state = 'confirmed', cipher_sha256 = p_cipher_sha256, confirmed_at = now()
   where entry_id = p_entry
  returning * into v_row;
  return jsonb_build_object('state', 'confirmed', 'confirmed_at', v_row.confirmed_at, 'created', true);
end;
$$;

-- Let a recording's backup go (held.discard, or a letter erased on the phone). Never gated.
create or replace function public.backup_discard(p_entry uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_n int;
begin
  delete from audio_blobs where entry_id = p_entry and author_id = v_uid;
  get diagnostics v_n = row_count;
  return jsonb_build_object('discarded', v_n > 0);
end;
$$;

-- Turn off with "Delete the backup" (F08 6.5 D3). The phone first shows how many recordings are
-- only in the backup; the server deletes only when the caller names the exact number of
-- confirmed recordings it holds (F08-REQ-035), so a stale count deletes nothing, and only after a
-- sign-in in the last 10 minutes, so a stolen session cannot delete the backup (SCSTP).
create or replace function public.backup_delete_all(p_expected_confirmed int)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_have int;
  v_blobs int;
  v_keys int;
begin
  if not public.backup_recent_sign_in() then
    raise exception 'sign in again to delete the backup' using errcode = 'SCSTP', detail = 'step_up_required';
  end if;
  select count(*) into v_have from audio_blobs where author_id = v_uid and state = 'confirmed';
  if p_expected_confirmed is distinct from v_have then
    raise exception 'the count does not match what is backed up' using errcode = '22023', detail = 'count', hint = v_have::text;
  end if;
  update restore_requests set state = 'cancelled', cancelled_at = now(), cancel_source = 'owner'
   where profile_id = v_uid and state in ('requested', 'approved');
  delete from audio_blobs where author_id = v_uid;
  get diagnostics v_blobs = row_count;
  delete from child_keys where profile_id = v_uid;
  get diagnostics v_keys = row_count;
  return jsonb_build_object('deleted_recordings', v_blobs, 'deleted_keys', v_keys);
end;
$$;

-- An enrolled device asks what is waiting (on foreground, after the push; F08 6.5 C3), in S07's
-- RestoreRequestView shape plus `approval`: the code sealed to THIS device as a SealedBox, which
-- it opens with its private key and sends back with backup_approve_request (only devices enrolled
-- 7 days before the request have one). Also marks the device seen, which is what makes it count
-- as enrolled for 90 days. A device revoked in the last 7 days still sees what is waiting (no
-- approval), so a stolen session that revoked the old phone first cannot hide the request from it.
create or replace function public.backup_pending_requests(p_device_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_uid uuid := public.require_user();
begin
  update backup_devices set last_seen_at = now()
   where device_id = p_device_id and profile_id = v_uid and revoked_at is null;
  if not found and not exists (
       select 1 from backup_devices d
        where d.device_id = p_device_id and d.profile_id = v_uid and d.revoked_at > now() - interval '7 days'
          and d.revoked_reason <> 'deletion') then
    raise exception 'device not found' using errcode = 'P0002', detail = 'device_unknown';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'request_id', r.id, 'state', r.state, 'requested_at', r.requested_at, 'hold_until', r.hold_until,
             'is_this_device', r.device_id = p_device_id,
             'approval', case when a.sealed_code is null then null else jsonb_build_object(
               'suite', 'hpke-x25519-sha256-aes256gcm',
               'enc', translate(encode(substring(a.sealed_code from 2 for 32), 'base64'), E'\n', ''),
               'ct', translate(encode(substring(a.sealed_code from 34), 'base64'), E'\n', '')) end)
           order by r.requested_at)
      from restore_requests r
      left join restore_approvals a on a.request_id = r.id and a.device_id = p_device_id and a.used_at is null
                and exists (select 1 from backup_devices d where d.device_id = p_device_id and d.revoked_at is null)
     where r.profile_id = v_uid and r.state in ('requested', 'approved')), '[]'::jsonb);
end;
$$;

-- "Yes, it's mine" on an enrolled device: proves the device holds its private key by returning
-- the 32-byte code sealed to it. One use; never from the requesting device; only from an unrevoked
-- device enrolled at least 7 days before the request (a key a stolen session just registered
-- cannot approve, even if a code somehow existed for it). This replaces S07's
-- draft `decide` route, which carried only a device id (readable by the owner, so forgeable by a
-- stolen session).
create or replace function public.backup_approve_request(p_request uuid, p_device_id uuid, p_code bytea)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_req restore_requests%rowtype;
  v_app restore_approvals%rowtype;
begin
  select * into v_req from restore_requests where id = p_request and profile_id = v_uid for update;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  if v_req.state = 'approved' then
    return jsonb_build_object('state', 'approved', 'created', false);
  end if;
  if v_req.state <> 'requested' then
    raise exception 'this request is closed' using errcode = 'SCIMM', detail = v_req.state;
  end if;
  if not exists (select 1 from backup_devices d
                  where d.device_id = p_device_id and d.profile_id = v_uid and d.revoked_at is null
                    and d.enrolled_at <= v_req.requested_at - interval '7 days')
     or p_device_id = v_req.device_id then
    raise exception 'device not found' using errcode = 'P0002', detail = 'device_unknown';
  end if;
  select * into v_app from restore_approvals where request_id = p_request and device_id = p_device_id for update;
  if not found or v_app.used_at is not null or p_code is null
     or octet_length(p_code) <> 32 or sha256(p_code) <> v_app.code_hash then
    raise exception 'approval code does not match' using errcode = '22023', detail = 'code';
  end if;
  update restore_approvals set used_at = now() where request_id = p_request and device_id = p_device_id;
  update restore_requests set state = 'approved', approved_by_device = p_device_id, approved_at = now() where id = p_request;
  return jsonb_build_object('state', 'approved', 'created', true);
end;
$$;

-- Stop in Settings (p_device_id null: cancel_source owner) or "Not me" on an enrolled device
-- (cancel_source enrolled_device; a device revoked in the last 7 days may still say Not me).
-- The app then signs out every session
-- (auth.signOut({ scope: 'global' })), which the database cannot do for it.
create or replace function public.backup_cancel_request(p_request uuid, p_device_id uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_req restore_requests%rowtype;
begin
  select * into v_req from restore_requests where id = p_request and profile_id = v_uid for update;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  if p_device_id is not null and not exists (
       select 1 from backup_devices d where d.device_id = p_device_id and d.profile_id = v_uid
                                       and (d.revoked_at is null
                                            or (d.revoked_at > now() - interval '7 days' and d.revoked_reason <> 'deletion'))) then
    raise exception 'device not found' using errcode = 'P0002', detail = 'device_unknown';
  end if;
  if v_req.state = 'cancelled' then
    return jsonb_build_object('state', 'cancelled', 'created', false);
  end if;
  if v_req.state not in ('requested', 'approved') then
    raise exception 'this request is closed' using errcode = 'SCIMM', detail = v_req.state;
  end if;
  update restore_requests
     set state = 'cancelled', cancelled_at = now(),
         cancel_source = case when p_device_id is null then 'owner' else 'enrolled_device' end
   where id = p_request;
  return jsonb_build_object('state', 'cancelled', 'created', true);
end;
$$;

-- ─── 8. Escrow functions (role escrow_svc only; called by the escrow function) ──
-- The escrow function verifies the user's JWT (main project signing keys) and the 10-minute
-- step-up itself, then passes the verified profile id; every function re-checks that the
-- device and the request belong to that profile.
create or replace function public.escrow_require_on()
returns void language plpgsql stable set search_path = pg_catalog, public, pg_temp as $$
begin
  if not public.backup_switch_on('escrow') then
    raise exception 'escrow is switched off' using errcode = 'SCBKO', detail = 'escrow';
  end if;
end;
$$;

-- What the escrow function needs before it opens a request: the requesting device's key and
-- every device that may approve (escrow_approvers) to seal an approval code to.
-- Who may approve a new request: the account's other devices, unrevoked, seen in 90 days and
-- enrolled at least 7 days ago (F08 6.5 C3 "enrolled", tightened: see "Approval" at the top).
create or replace function public.escrow_approvers(p_profile uuid, p_device uuid)
returns uuid[] language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(array_agg(d.device_id order by d.device_id), '{}')
    from backup_devices d
   where d.profile_id = p_profile and d.device_id <> p_device and d.revoked_at is null
     and d.last_seen_at > now() - interval '90 days' and d.enrolled_at <= now() - interval '7 days';
$$;

-- Whether a new request waits 72 hours instead of 24: any other device of the account that is
-- unrevoked and seen in 90 days (however new), or was revoked in the last 7 days.
create or replace function public.escrow_long_hold(p_profile uuid, p_device uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from backup_devices d
                  where d.profile_id = p_profile and d.device_id <> p_device
                    and ((d.revoked_at is null and d.last_seen_at > now() - interval '90 days')
                         or (d.revoked_at > now() - interval '7 days' and d.revoked_reason <> 'deletion')));
$$;

create or replace function public.escrow_require_session(p_profile uuid, p_session uuid)
returns void language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if not public.backup_session_live(p_profile, p_session) then
    raise exception 'this sign-in has ended' using errcode = '28000', detail = 'session_ended';
  end if;
end;
$$;

create or replace function public.escrow_request_context(p_profile uuid, p_device uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_dev backup_devices%rowtype;
begin
  perform public.escrow_require_on();
  select * into v_dev from backup_devices where device_id = p_device and profile_id = p_profile and revoked_at is null;
  if not found then raise exception 'device not found' using errcode = 'P0002', detail = 'device_unknown'; end if;
  return jsonb_build_object(
    'device_public_key_hex', encode(v_dev.public_key, 'hex'),
    'deleting', public.backup_account_deleting(p_profile),
    'has_keys', exists (select 1 from child_keys where profile_id = p_profile),
    'open_request', (select jsonb_build_object('request_id', r.id, 'state', r.state, 'hold_until', r.hold_until,
                                               'notified', r.notified_at is not null)
                       from restore_requests r
                      where r.device_id = p_device and r.profile_id = p_profile
                        and (r.state in ('requested', 'approved') or (r.state = 'released' and r.released_at > now() - interval '24 hours'))
                      order by r.requested_at desc limit 1),
    'enrolled', coalesce((select jsonb_agg(jsonb_build_object('device_id', d.device_id, 'public_key_hex', encode(d.public_key, 'hex'))
                                           order by d.device_id)
                            from backup_devices d
                           where d.device_id = any (public.escrow_approvers(p_profile, p_device))), '[]'::jsonb));
end;
$$;

-- Step 1 and 2 of F08 6.5 C: one request per device, the hold (escrow_long_hold: 72 h, else
-- 24 h), the stop token hash and one sealed approval code per device escrow_approvers names.
-- At most 3 requests per account per rolling 30 days (SCRAT restores). p_request_id is the
-- escrow function's own id for the call (it never takes one from the client).
create or replace function public.escrow_open_request(p_profile uuid, p_device uuid, p_session uuid, p_request_id text,
                                                      p_stop_token_hash bytea, p_approvals jsonb)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_open restore_requests%rowtype;
  v_others uuid[];
  v_given uuid[];
  v_hold interval;
  v_id uuid;
  v_until timestamptz;
begin
  perform public.escrow_require_on();
  perform public.escrow_require_session(p_profile, p_session);
  if not exists (select 1 from backup_devices where device_id = p_device and profile_id = p_profile and revoked_at is null) then
    raise exception 'device not found' using errcode = 'P0002', detail = 'device_unknown';
  end if;
  if public.backup_account_deleting(p_profile) then
    raise exception 'this account is being deleted' using errcode = 'SCDEL', detail = 'deletion_pending';
  end if;
  if not exists (select 1 from child_keys where profile_id = p_profile) then
    raise exception 'nothing is backed up' using errcode = 'P0002', detail = 'nothing';
  end if;
  select * into v_open from restore_requests
   where device_id = p_device and profile_id = p_profile
     and (state in ('requested', 'approved') or (state = 'released' and released_at > now() - interval '24 hours'))
   order by requested_at desc limit 1 for update;
  if found then
    -- A request whose email never went out (the call died between the two) takes the new stop
    -- token, so this call can send the email; the old token was never mailed to anyone.
    if v_open.notified_at is null and v_open.state in ('requested', 'approved')
       and p_stop_token_hash is not null and octet_length(p_stop_token_hash) = 32 then
      update restore_requests set stop_token_hash = p_stop_token_hash, stop_token_expires_at = now() + interval '7 days'
       where id = v_open.id;
      return jsonb_build_object('request_id', v_open.id, 'state', v_open.state, 'hold_until', v_open.hold_until,
                                'notified', false, 'created', false, 'token_replaced', true);
    end if;
    return jsonb_build_object('request_id', v_open.id, 'state', v_open.state, 'hold_until', v_open.hold_until,
                              'notified', v_open.notified_at is not null, 'created', false, 'token_replaced', false);
  end if;
  perform 1 from backup_devices where profile_id = p_profile for update;  -- one opener per account at a time
  if (select count(*) from restore_requests where profile_id = p_profile and requested_at > now() - interval '30 days') >= 3 then
    raise exception 'too many restores this month' using errcode = 'SCRAT', detail = 'limit_restores';
  end if;
  if p_stop_token_hash is null or octet_length(p_stop_token_hash) <> 32
     or p_request_id is null or p_request_id !~ '^[0-9a-f]{12}$' then
    raise exception 'a stop token hash and a request id are required' using errcode = '22023';
  end if;
  v_others := public.escrow_approvers(p_profile, p_device);
  if p_approvals is null or jsonb_typeof(p_approvals) <> 'array' then
    raise exception 'approvals must be an array' using errcode = '22023', detail = 'approvals';
  end if;
  select coalesce(array_agg((a ->> 'device_id')::uuid order by (a ->> 'device_id')::uuid), '{}') into v_given
    from jsonb_array_elements(p_approvals) a;
  if v_given <> v_others or exists (
       select 1 from jsonb_array_elements(p_approvals) a
        where coalesce(a ->> 'code_hash_hex', '') !~ '^[0-9a-f]{64}$'
           or coalesce(a ->> 'sealed_code_hex', '') !~ '^([0-9a-f][0-9a-f])+$'
           or length(a ->> 'sealed_code_hex') not between 98 and 1024) then
    raise exception 'one approval code per enrolled device is required' using errcode = '22023', detail = 'approvals';
  end if;
  v_hold := case when public.escrow_long_hold(p_profile, p_device) then interval '72 hours' else interval '24 hours' end;
  v_until := now() + v_hold;
  insert into restore_requests (profile_id, device_id, hold_until, request_id, stop_token_hash, stop_token_expires_at)
  values (p_profile, p_device, v_until, p_request_id, p_stop_token_hash, now() + interval '7 days')
  returning id into v_id;
  insert into restore_approvals (request_id, device_id, sealed_code, code_hash)
  select v_id, (a ->> 'device_id')::uuid, decode(a ->> 'sealed_code_hex', 'hex'), decode(a ->> 'code_hash_hex', 'hex')
    from jsonb_array_elements(p_approvals) a;
  return jsonb_build_object('request_id', v_id, 'state', 'requested', 'hold_until', v_until, 'notified', false,
                            'created', true, 'token_replaced', false, 'enrolled_devices', cardinality(v_others));
end;
$$;

-- Whether a request may release now: approved, or the hold has passed; and not past its
-- 7-day release window (then it becomes expired). Internal to the escrow functions.
create or replace function public.escrow_request_ready(p_req restore_requests)
returns text language plpgsql stable set search_path = pg_catalog, public, pg_temp as $$
begin
  if p_req.state = 'released' then
    return case when p_req.released_at > now() - interval '24 hours' then 'ready' else 'closed' end;
  end if;
  if p_req.state not in ('requested', 'approved') then
    return 'closed';
  end if;
  if now() > coalesce(p_req.approved_at, p_req.hold_until) + interval '7 days' then
    return 'expire';
  end if;
  if p_req.state = 'approved' or p_req.hold_until <= now() then
    return 'ready';
  end if;
  return 'waiting';
end;
$$;

-- Step 5 of F08 6.5 C: the wraps to open, once the request may release. Never returns a key
-- in the clear (there is none here); the requesting device's public key comes with them so
-- the function seals each opened key to it. At most 20 keys opened for restores per account per
-- day (SCRAT limit_keys; rotation rows do not count). Refuses once the caller's session is gone.
create or replace function public.escrow_load_wraps(p_profile uuid, p_device uuid, p_request uuid, p_session uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_req restore_requests%rowtype;
  v_dev backup_devices%rowtype;
  v_ready text;
  v_keys int;
begin
  perform public.escrow_require_on();
  perform public.escrow_require_session(p_profile, p_session);
  select * into v_req from restore_requests where id = p_request and profile_id = p_profile and device_id = p_device for update;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  if public.backup_account_deleting(p_profile) and v_req.state in ('requested', 'approved') then
    update restore_requests set state = 'cancelled', cancelled_at = now(), cancel_source = 'deletion' where id = p_request;
    return jsonb_build_object('state', 'cancelled');
  end if;
  select * into v_dev from backup_devices where device_id = p_device and profile_id = p_profile and revoked_at is null;
  if not found then
    return jsonb_build_object('state', 'cancelled');
  end if;
  v_ready := public.escrow_request_ready(v_req);
  if v_ready = 'expire' then
    update restore_requests set state = 'expired', expired_at = now() where id = p_request;
    return jsonb_build_object('state', 'expired');
  elsif v_ready = 'closed' then
    return jsonb_build_object('state', v_req.state);
  elsif v_ready = 'waiting' then
    return jsonb_build_object('state', v_req.state, 'hold_until', v_req.hold_until, 'notified', v_req.notified_at is not null);
  end if;
  if v_req.notified_at is null then
    return jsonb_build_object('state', v_req.state, 'hold_until', v_req.hold_until, 'notified', false);
  end if;
  select count(*) into v_keys from child_keys where profile_id = p_profile;
  if v_keys + (select count(*) from escrow_unwraps
                where profile_id = p_profile and reason = 'restore' and outcome = 'opened'
                  and occurred_at > now() - interval '24 hours') > 20 then
    raise exception 'too many keys opened today' using errcode = 'SCRAT', detail = 'limit_keys';
  end if;
  return jsonb_build_object(
    'state', 'ready', 'request_id', v_req.id, 'device_public_key_hex', encode(v_dev.public_key, 'hex'),
    'keys', coalesce((select jsonb_agg(jsonb_build_object('child_id', k.child_id, 'key_version', k.key_version,
                                                          'escrow_key_version', k.escrow_key_version,
                                                          'escrow_wrap_hex', encode(k.escrow_wrap, 'hex'))
                                       order by k.child_id, k.key_version)
                        from child_keys k where k.profile_id = p_profile), '[]'::jsonb));
end;
$$;

-- Step 6: one row per key the function opened (or failed to open), written before any sealed
-- key leaves the function. Returns the rows written and `opening`, the first new row's id: each
-- opening is emailed under its own idempotency key, so a second release in the 24-hour window
-- is a second email, never folded into the first.
create or replace function public.escrow_record_unwraps(p_profile uuid, p_device uuid, p_request uuid, p_rows jsonb, p_request_id text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_req restore_requests%rowtype;
  v_n int;
  v_first bigint;
begin
  perform public.escrow_require_on();
  select * into v_req from restore_requests where id = p_request and profile_id = p_profile and device_id = p_device;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  if public.escrow_request_ready(v_req) <> 'ready' or v_req.notified_at is null then
    raise exception 'this request may not release now' using errcode = 'SCIMM';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0
     or (p_request_id is not null and p_request_id !~ '^[0-9a-f]{12}$') then
    raise exception 'rows must be a non-empty array' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_rows) r
              where coalesce(r ->> 'outcome', '') not in ('opened', 'failed')
                 or not exists (select 1 from child_keys k
                                 where k.profile_id = p_profile and k.child_id = (r ->> 'child_id')::uuid
                                   and k.key_version = (r ->> 'key_version')::int
                                   and k.escrow_key_version = (r ->> 'escrow_key_version')::int)) then
    raise exception 'every row must name one of this account''s keys and an outcome' using errcode = '22023';
  end if;
  with ins as (
    insert into escrow_unwraps (profile_id, device_id, child_id, key_version, escrow_key_version, reason, outcome, restore_request_id, request_id)
    select p_profile, p_device, (r ->> 'child_id')::uuid, (r ->> 'key_version')::int, (r ->> 'escrow_key_version')::int,
           'restore', r ->> 'outcome', p_request, p_request_id
      from jsonb_array_elements(p_rows) r
    returning id)
  select count(*), min(id) into v_n, v_first from ins;
  return jsonb_build_object('rows', v_n, 'opening', v_first);
end;
$$;

-- 'notified': the request email went out (release waits for it). 'released': refused unless
-- this request already has an `opened` log row from the last hour (the release invariant).
create or replace function public.escrow_set_request_state(p_profile uuid, p_request uuid, p_event text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_req restore_requests%rowtype;
begin
  perform public.escrow_require_on();
  select * into v_req from restore_requests where id = p_request and profile_id = p_profile for update;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  if p_event = 'notified' then
    if v_req.state not in ('requested', 'approved') then
      raise exception 'this request is closed' using errcode = 'SCIMM';
    end if;
    update restore_requests set notified_at = coalesce(notified_at, now()) where id = p_request;
    return jsonb_build_object('state', v_req.state, 'notified', true);
  elsif p_event = 'released' then
    if v_req.state = 'released' then
      return jsonb_build_object('state', 'released', 'released_at', v_req.released_at, 'created', false);
    end if;
    if public.escrow_request_ready(v_req) <> 'ready' or v_req.notified_at is null then
      raise exception 'this request may not release now' using errcode = 'SCIMM';
    end if;
    if not exists (select 1 from escrow_unwraps u where u.restore_request_id = p_request and u.outcome = 'opened'
                      and u.occurred_at > now() - interval '1 hour') then
      raise exception 'no key was logged as opened for this request' using errcode = 'SCIMM';
    end if;
    update restore_requests set state = 'released', released_at = now() where id = p_request returning * into v_req;
    return jsonb_build_object('state', 'released', 'released_at', v_req.released_at, 'created', true);
  end if;
  raise exception 'unknown event' using errcode = '22023';
end;
$$;

-- Rotation (F08 6.5 G4): wraps still on an old escrow key version, in small batches, after a
-- keyset cursor (the last row of the previous batch), so a wrap that will not open is passed
-- over instead of stalling every later batch. Only while app.escrow_rotation is from:to.
create or replace function public.escrow_rotation_batch(p_from_version int, p_to_version int,
                                                        p_after_profile uuid default null, p_after_child uuid default null,
                                                        p_after_version int default null, p_limit int default 100)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  perform public.escrow_require_on();
  if not public.escrow_rotation_on(p_from_version, p_to_version) then
    raise exception 'no rotation is running' using errcode = 'SCBKO', detail = 'rotation';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('profile_id', k.profile_id, 'child_id', k.child_id, 'key_version', k.key_version,
                                                       'escrow_wrap_hex', encode(k.escrow_wrap, 'hex'))
                                    order by k.profile_id, k.child_id, k.key_version)
                     from (select * from child_keys
                            where escrow_key_version = p_from_version
                              and (p_after_profile is null
                                   or (profile_id, child_id, key_version) > (p_after_profile, p_after_child, coalesce(p_after_version, 0)))
                            order by profile_id, child_id, key_version
                            limit greatest(least(coalesce(p_limit, 100), 200), 1)) k), '[]'::jsonb);
end;
$$;

-- One rewrap, compare-and-set on the old version, with its `rotation` log row and the account's
-- notice row (once per account per rotation) in the same transaction.
create or replace function public.escrow_rewrap_key(p_profile uuid, p_child uuid, p_key_version int, p_from_version int,
                                                    p_to_version int, p_new_wrap bytea, p_request_id text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  perform public.escrow_require_on();
  if not public.escrow_rotation_on(p_from_version, p_to_version) then
    raise exception 'no rotation is running' using errcode = 'SCBKO', detail = 'rotation';
  end if;
  if not public.backup_escrow_key_trusted(p_to_version) then
    raise exception 'unknown escrow key version' using errcode = '22023';
  end if;
  if p_new_wrap is null or octet_length(p_new_wrap) <> 81 or get_byte(p_new_wrap, 0) <> 1
     or (p_request_id is not null and p_request_id !~ '^[0-9a-f]{12}$') then
    raise exception 'escrow wrap must be format 1 (81 bytes)' using errcode = '22023';
  end if;
  update child_keys set escrow_wrap = p_new_wrap, escrow_key_version = p_to_version, rewrapped_at = now()
   where profile_id = p_profile and child_id = p_child and key_version = p_key_version and escrow_key_version = p_from_version;
  if not found then
    return jsonb_build_object('updated', false);
  end if;
  insert into escrow_unwraps (profile_id, child_id, key_version, escrow_key_version, reason, outcome, request_id)
  values (p_profile, p_child, p_key_version, p_from_version, 'rotation', 'opened', p_request_id);
  insert into escrow_rotation_notices (profile_id, to_version) values (p_profile, p_to_version)
  on conflict (profile_id, to_version) do nothing;
  return jsonb_build_object('updated', true);
end;
$$;

-- A wrap that did not open with the old key during a rotation: one `rotation` row with outcome
-- `failed` (once per key and version), so the attempt is on the record like a failed restore
-- opening (runbook section 6 says what next). The cursor in escrow_rotation_batch moves past it.
create or replace function public.escrow_rotation_failed(p_profile uuid, p_child uuid, p_key_version int, p_from_version int,
                                                         p_to_version int, p_request_id text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  perform public.escrow_require_on();
  if not public.escrow_rotation_on(p_from_version, p_to_version) then
    raise exception 'no rotation is running' using errcode = 'SCBKO', detail = 'rotation';
  end if;
  if p_request_id is not null and p_request_id !~ '^[0-9a-f]{12}$' then
    raise exception 'bad request id' using errcode = '22023';
  end if;
  if not exists (select 1 from child_keys where profile_id = p_profile and child_id = p_child
                    and key_version = p_key_version and escrow_key_version = p_from_version) then
    return jsonb_build_object('recorded', false);
  end if;
  insert into escrow_unwraps (profile_id, child_id, key_version, escrow_key_version, reason, outcome, request_id)
  select p_profile, p_child, p_key_version, p_from_version, 'rotation', 'failed', p_request_id
   where not exists (select 1 from escrow_unwraps u where u.profile_id = p_profile and u.child_id = p_child
                        and u.key_version = p_key_version and u.escrow_key_version = p_from_version
                        and u.reason = 'rotation' and u.outcome = 'failed');
  return jsonb_build_object('recorded', true);
end;
$$;

-- The rotation emails still to send: the notice id (the email's idempotency key) and the address,
-- only for accounts whose key this rotation has moved, so the escrow role learns an address only
-- when it has used that account's key.
create or replace function public.escrow_rotation_notices_due(p_to_version int, p_limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  perform public.escrow_require_on();
  return coalesce((select jsonb_agg(jsonb_build_object('notice_id', n.id, 'email', n.email) order by n.created_at)
                     from (select x.id, x.created_at, u.email
                             from escrow_rotation_notices x
                             join auth.users u on u.id = x.profile_id
                            where x.to_version = p_to_version and x.sent_at is null and u.email is not null
                            order by x.created_at
                            limit greatest(least(coalesce(p_limit, 50), 200), 1)) n), '[]'::jsonb);
end;
$$;

create or replace function public.escrow_rotation_notice_sent(p_notice uuid, p_ok boolean)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  perform public.escrow_require_on();
  if p_ok then
    update escrow_rotation_notices set sent_at = coalesce(sent_at, now()) where id = p_notice;
  else
    update escrow_rotation_notices set attempts = attempts + 1 where id = p_notice and sent_at is null;
  end if;
  return jsonb_build_object('updated', found,
                            'pending', (select count(*) from escrow_rotation_notices x
                                         where x.sent_at is null
                                           and x.to_version = (select to_version from escrow_rotation_notices where id = p_notice)));
end;
$$;

-- ─── 9. Service role (purge worker; the account-stop endpoint) ───────────
-- Daily (purge-worker task 'daily'; F08 6.5 D6, retention in F08 section 8):
--   recordings with no live letter for 30 days (crash paths), reservations never confirmed
--   in 24 hours, restore requests past their release window, final requests after 90 days,
--   sent rotation notices after 90 days, log rows after 24 months.
create or replace function public.backup_svc_sweep(p_now timestamptz default now(), p_limit int default 500)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_limit int := greatest(least(coalesce(p_limit, 500), 5000), 1);
  v_orphans int;
  v_stale int;
  v_expired int;
  v_requests int;
  v_log int;
  v_notices int;
begin
  delete from audio_blobs b where b.entry_id in (
    select x.entry_id from audio_blobs x
     where x.created_at < p_now - interval '30 days'
       and not public.backup_entry_exists(x.entry_id, x.author_id, x.child_id)
     order by x.created_at limit v_limit);
  get diagnostics v_orphans = row_count;
  delete from audio_blobs b where b.entry_id in (
    select x.entry_id from audio_blobs x
     where x.state = 'pending' and x.updated_at < p_now - interval '24 hours'
     order by x.updated_at limit v_limit);
  get diagnostics v_stale = row_count;
  update restore_requests set state = 'expired', expired_at = p_now
   where state in ('requested', 'approved') and coalesce(approved_at, hold_until) + interval '7 days' < p_now;
  get diagnostics v_expired = row_count;
  delete from restore_requests
   where state in ('released', 'cancelled', 'expired')
     and coalesce(released_at, cancelled_at, expired_at) < p_now - interval '90 days';
  get diagnostics v_requests = row_count;
  delete from escrow_rotation_notices where sent_at < p_now - interval '90 days';
  get diagnostics v_notices = row_count;
  delete from escrow_unwraps where id in (
    select id from escrow_unwraps where occurred_at < least(p_now, now()) - interval '24 months' order by id limit v_limit);
  get diagnostics v_log = row_count;
  return jsonb_build_object('orphans', v_orphans, 'stale_pending', v_stale, 'expired_requests', v_expired,
                            'old_requests', v_requests, 'old_notices', v_notices, 'old_log_rows', v_log);
end;
$$;

-- The daily copy of the log to ops-ledger/escrow/YYYY-MM-DD.run-<stamp>.jsonl (outside database backups; never overwritten).
-- Ids, reason, outcome and times only; never key bytes.
create or replace function public.backup_svc_unwraps_between(p_from timestamptz, p_until timestamptz, p_limit int default 50000)
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', u.id, 'at', u.occurred_at, 'reason', u.reason, 'outcome', u.outcome,
           'profile', u.profile_id, 'subject', encode(u.subject_hash, 'hex'), 'device', u.device_id, 'child', u.child_id,
           'kv', u.key_version, 'ekv', u.escrow_key_version, 'restore', u.restore_request_id, 'req', u.request_id)
           order by u.id), '[]'::jsonb)
    from (select * from escrow_unwraps where occurred_at >= p_from and occurred_at < p_until
           order by id limit greatest(least(coalesce(p_limit, 50000), 100000), 1)) u;
$$;

-- The account-stop endpoint (S01 with S05; F08 6.5 C4): a valid, unused, unexpired token
-- cancels every open restore request of its account (cancel_source stop_link) and returns
-- the account id so the endpoint signs out every session. Unknown, used or expired: nothing
-- changes and the account is not revealed.
create or replace function public.backup_svc_stop(p_token_hash bytea)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_req restore_requests%rowtype;
  v_n int;
begin
  select * into v_req from restore_requests
   where stop_token_hash = p_token_hash and stop_used_at is null and stop_token_expires_at > now()
   for update;
  if not found then
    return jsonb_build_object('stopped', false);
  end if;
  update restore_requests set stop_used_at = now() where id = v_req.id;
  update restore_requests set state = 'cancelled', cancelled_at = now(), cancel_source = 'stop_link'
   where profile_id = v_req.profile_id and state in ('requested', 'approved');
  get diagnostics v_n = row_count;
  return jsonb_build_object('stopped', true, 'profile_id', v_req.profile_id, 'cancelled', v_n);
end;
$$;

-- ─── 10. Privileges ──────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC and Supabase to anon, authenticated and service_role by
-- default: every function here is revoked from all of them first, then granted by name.
do $$
declare f text;
begin
  foreach f in array array[
    'public.backup_switch_on(text)', 'public.backup_escrow_key_trusted(int)', 'public.backup_account_deleting(uuid)',
    'public.backup_entry_exists(uuid, uuid, uuid)', 'public.backup_forget_entry(uuid)', 'public.backup_recent_sign_in()',
    'public.backup_session_live(uuid, uuid)', 'public.escrow_rotation_on(int, int)', 'public.escrow_approvers(uuid, uuid)',
    'public.escrow_long_hold(uuid, uuid)', 'public.escrow_require_session(uuid, uuid)',
    'public.audio_blobs_after_change()', 'public.audio_blobs_touch()', 'public.escrow_unwraps_guard()',
    'public.escrow_unwraps_no_truncate()', 'public.profiles_pseudonymise_escrow_unwraps()', 'public.entries_backup_forget()',
    'public.deletion_requests_backup_cancel()',
    'public.backup_object_writable(text)', 'public.backup_object_readable(text)',
    'public.backup_register_device(uuid, bytea)', 'public.backup_revoke_device(uuid)',
    'public.backup_store_key(uuid, int, int, jsonb, bytea)', 'public.backup_begin(uuid, uuid, bigint, int, bytea, smallint)',
    'public.backup_confirm(uuid, bytea)', 'public.backup_discard(uuid)', 'public.backup_delete_all(int)',
    'public.backup_pending_requests(uuid)', 'public.backup_approve_request(uuid, uuid, bytea)',
    'public.backup_cancel_request(uuid, uuid)',
    'public.escrow_require_on()', 'public.escrow_request_context(uuid, uuid)',
    'public.escrow_open_request(uuid, uuid, uuid, text, bytea, jsonb)', 'public.escrow_request_ready(public.restore_requests)',
    'public.escrow_load_wraps(uuid, uuid, uuid, uuid)', 'public.escrow_record_unwraps(uuid, uuid, uuid, jsonb, text)',
    'public.escrow_set_request_state(uuid, uuid, text)', 'public.escrow_rotation_batch(int, int, uuid, uuid, int, int)',
    'public.escrow_rewrap_key(uuid, uuid, int, int, int, bytea, text)', 'public.escrow_rotation_failed(uuid, uuid, int, int, int, text)',
    'public.escrow_rotation_notices_due(int, int)', 'public.escrow_rotation_notice_sent(uuid, boolean)',
    'public.backup_svc_sweep(timestamptz, int)', 'public.backup_svc_unwraps_between(timestamptz, timestamptz, int)',
    'public.backup_svc_stop(bytea)']
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('revoke execute on function %s from service_role', f);
    end if;
  end loop;

  -- Storage policy helpers and client RPCs: signed-in people.
  foreach f in array array[
    'public.backup_object_writable(text)', 'public.backup_object_readable(text)',
    'public.backup_register_device(uuid, bytea)', 'public.backup_revoke_device(uuid)',
    'public.backup_store_key(uuid, int, int, jsonb, bytea)', 'public.backup_begin(uuid, uuid, bigint, int, bytea, smallint)',
    'public.backup_confirm(uuid, bytea)', 'public.backup_discard(uuid)', 'public.backup_delete_all(int)',
    'public.backup_pending_requests(uuid)', 'public.backup_approve_request(uuid, uuid, bytea)',
    'public.backup_cancel_request(uuid, uuid)']
  loop
    execute format('grant execute on function %s to authenticated', f);
  end loop;

  -- The escrow role: the escrow_* entry points and nothing else.
  foreach f in array array[
    'public.escrow_request_context(uuid, uuid)', 'public.escrow_open_request(uuid, uuid, uuid, text, bytea, jsonb)',
    'public.escrow_load_wraps(uuid, uuid, uuid, uuid)', 'public.escrow_record_unwraps(uuid, uuid, uuid, jsonb, text)',
    'public.escrow_set_request_state(uuid, uuid, text)', 'public.escrow_rotation_batch(int, int, uuid, uuid, int, int)',
    'public.escrow_rewrap_key(uuid, uuid, int, int, int, bytea, text)', 'public.escrow_rotation_failed(uuid, uuid, int, int, int, text)',
    'public.escrow_rotation_notices_due(int, int)', 'public.escrow_rotation_notice_sent(uuid, boolean)']
  loop
    execute format('grant execute on function %s to escrow_svc', f);
  end loop;

  -- The service role: the purge worker's sweep and log copy, and the stop endpoint.
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    foreach f in array array[
      'public.backup_svc_sweep(timestamptz, int)', 'public.backup_svc_unwraps_between(timestamptz, timestamptz, int)',
      'public.backup_svc_stop(bytea)']
    loop
      execute format('grant execute on function %s to service_role', f);
    end loop;
  end if;
end;
$$;

comment on function public.backup_begin(uuid, uuid, bigint, int, bytea, smallint) is
  'Reserve one upload in entry-audio for the caller''s own live letter. SCBKO off, SCCON backup, SCDEL deletion or purged, SCPAR not a parent, P0002 key or entry, SCQTA quota, SCRAT begin or pending, 55P03 purging, SCIMM id in use, 22023 arguments.';
comment on function public.escrow_set_request_state(uuid, uuid, text) is
  'notified or released. Release requires an opened escrow_unwraps row for the request from the last hour (release invariant, F08-REQ-042).';
