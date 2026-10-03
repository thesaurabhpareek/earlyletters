-- Children created with device ids, the server-side Plus rule, and Apple
-- entitlements (StoreKit 2 direct + App Store Server Notifications V2).
--
-- PENDING: not yet applied. Apply after 20261003000000_security_and_family.sql
-- (it uses require_user(), require_content_consent() and is_anonymous()).
--
-- 5. create_child [TDD 02 C4, A-REQ-015, DATA-REQ-044, PRD-REQ-015]:
--    create_child(text, date) is dropped. create_child(p_id, p_name,
--    p_date_of_birth, p_due_date) takes the device's UUIDv7 (version and
--    variant checked, timestamp sane), is idempotent for the same person, needs
--    a birthday or a due date, and needs Plus unless the caller has started no
--    live book. Books joined as co-parent never count (only created_by counts).
--    create_first_run_children(p_children jsonb) is the one-time first-run batch
--    (twins, siblings): every child in it is free; afterwards the batch is closed
--    for good (profiles.first_run_closed_at).
-- 6. Entitlements [TDD 08 3.3 adapted to StoreKit 2; K-28; C-REQ-021]:
--    app_account_tokens (random UUID the app passes as appAccountToken, never
--    the profile id), store_subscriptions (one row per original transaction),
--    store_notifications (notificationUUID ledger for idempotency). Written only
--    by apply_store_transaction(), granted to service_role (the App Store
--    notification Edge Function). No client policies on any of them.
--    has_plus(profile) is internal; book_has_plus(child) answers for members only;
--    get_plan_state() and my_app_account_token() serve the caller.
--
-- New SQLSTATEs: SCCID invalid or reused client id (permanent),
--                SCPLS Plus needed to start another book (keep the book on the phone; TDD 08 2.5).
-- Review fixes on 3 Oct 2026 (WS-01):
--  * DB-15: letter ids must be device UUIDv7 (SCCID) and captured_at may not be more
--    than a day in the future (22023), checked in entries_before_insert.
--  * DB-02 / DB-09: a purged book id is refused with SCPRG (was SCDEL).

-- ─── 1. Profiles: first-run batch flag ──────────────────────────────────
alter table public.profiles add column if not exists first_run_closed_at timestamptz;
-- Anyone who already started a book has had their first run.
update public.profiles p set first_run_closed_at = now()
 where p.first_run_closed_at is null and exists (select 1 from public.children c where c.created_by = p.id);

-- profiles_update_self lets a person edit their own row; the batch flag is server-owned.
create or replace function public.profiles_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.id is distinct from old.id or new.first_run_closed_at is distinct from old.first_run_closed_at
          or new.created_at is distinct from old.created_at) then
    raise exception 'profiles: id, created_at and first_run_closed_at are server-owned' using errcode = 'SCIMM';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ─── 2. Children: a birthday or a due date (B-REQ-001) ──────────────────
-- NOT VALID: existing rows are checked by APPLY.md before VALIDATE.
alter table public.children add constraint children_has_date
  check (date_of_birth is not null or due_date is not null) not valid;

-- ─── 3. Client-supplied ids ─────────────────────────────────────────────
-- RFC 9562 UUIDv7: version nibble 7, variant 10xx, 48-bit Unix ms timestamp
-- between 2024-01-01 and one day from now.
create or replace function public.is_valid_client_uuid7(p_id uuid)
returns boolean language sql stable set search_path = pg_catalog, public as $$
  select p_id is not null
     and substr(p_id::text, 15, 1) = '7'
     and substr(p_id::text, 20, 1) in ('8', '9', 'a', 'b')
     and to_timestamp((('x' || lpad(substr(replace(p_id::text, '-', ''), 1, 12), 16, '0'))::bit(64)::bigint) / 1000.0)
         between timestamptz '2024-01-01 00:00:00+00' and now() + interval '1 day';
$$;

-- Letters (DB-15). Same body as 20261002020000 plus the id and clock checks.
create or replace function public.entries_before_insert()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if not public.is_valid_client_uuid7(new.id) then
    raise exception 'entries: letter id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  if new.captured_at > now() + interval '1 day' then
    raise exception 'entries: captured_at is in the future' using errcode = '22023';
  end if;
  -- DB-02: a purged letter never comes back, even from a stale device's upsert.
  if exists (select 1 from purge_ledger where entity_type = 'entry' and entity_id = new.id::text) then
    raise exception 'entries: this letter was deleted for good' using errcode = 'SCPRG';
  end if;
  new.raw_sha256 := sha256(convert_to(new.raw_transcript, 'UTF8'));
  if new.deleted_at is not null then
    -- Created and deleted offline before the first sync: tombstone starts now.
    new.deleted_at := now();
    new.deleted_reason := 'user';
  else
    new.deleted_reason := null;
  end if;
  return new;
end;
$$;

-- ─── 4. Entitlements (Apple, StoreKit 2 direct) ─────────────────────────
create table public.app_account_tokens (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  app_account_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.store_subscriptions (
  original_transaction_id text primary key check (original_transaction_id ~ '^[0-9]{1,32}$'),
  -- null until mapped, and after account deletion (pseudonymised purchase ledger, 7 years)
  profile_id uuid references public.profiles(id) on delete set null,
  product_id text not null check (product_id ~ '^[A-Za-z0-9._-]{1,100}$'),
  status text not null check (status in ('trial', 'active', 'grace', 'billing_retry', 'expired', 'revoked', 'refunded')),
  expires_at timestamptz,                 -- null only for a non-expiring product (lifetime, P2)
  grace_expires_at timestamptz,
  will_renew boolean,
  environment text not null check (environment in ('sandbox', 'production')),
  storefront text check (storefront ~ '^[A-Z]{3}$'),
  original_purchase_at timestamptz,
  last_signed_at timestamptz not null,    -- Apple signedDate of the newest applied state (newer wins)
  last_notification_uuid uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index store_subscriptions_profile_idx on public.store_subscriptions (profile_id) where profile_id is not null;
create trigger store_subscriptions_touch before update on public.store_subscriptions
  for each row execute function public.touch_updated_at();

-- Idempotency ledger: one row per App Store notificationUUID. Never the signed
-- payload, price or receipt.
create table public.store_notifications (
  notification_uuid uuid primary key,
  notification_type text not null check (notification_type ~ '^[A-Z_]{1,40}$'),
  subtype text check (subtype ~ '^[A-Z_]{1,40}$'),
  environment text not null check (environment in ('sandbox', 'production')),
  original_transaction_id text check (original_transaction_id ~ '^[0-9]{1,32}$'),
  signed_at timestamptz not null,
  received_at timestamptz not null default now(),
  outcome text check (outcome in ('applied', 'stale', 'unmapped', 'environment_mismatch'))
);
create index store_notifications_received_idx on public.store_notifications (received_at);

alter table public.app_account_tokens enable row level security;   -- no policies: RPC and service role only
alter table public.store_subscriptions enable row level security;  -- no policies: service role only
alter table public.store_notifications enable row level security;  -- no policies: service role only

-- Production counts production purchases only. Dev and staging set
-- `alter database postgres set app.store_environment = 'sandbox'` (APPLY.md).
create or replace function public.store_environment_allowed(p_environment text)
returns boolean language sql stable set search_path = pg_catalog, public as $$
  select coalesce(p_environment = 'production'
                  or (p_environment = 'sandbox' and current_setting('app.store_environment', true) = 'sandbox'), false);
$$;

-- Account Plus: trial, active or grace, and not past its end (5 minutes of skew).
create or replace function public.has_plus(p_profile uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (
    select 1 from store_subscriptions s
     where s.profile_id = p_profile
       and s.status in ('trial', 'active', 'grace')
       and public.store_environment_allowed(s.environment)
       and case when s.status = 'grace' then coalesce(s.grace_expires_at, s.expires_at) > now() - interval '5 minutes'
                else s.expires_at is null or s.expires_at > now() - interval '5 minutes' end);
$$;

-- Book Plus (K-28): any parent of the book holds Plus. Members only; everyone
-- else gets false, so it cannot be used to probe who pays.
create or replace function public.book_has_plus(p_child uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select not public.is_anonymous()
     and exists (select 1 from child_members me where me.child_id = p_child and me.profile_id = auth.uid())
     and exists (select 1 from child_members m join children c on c.id = m.child_id and c.deleted_at is null
                  where m.child_id = p_child and m.role = 'parent' and public.has_plus(m.profile_id));
$$;

-- The caller's plan, newest subscription first. No transaction id, no price.
create or replace function public.get_plan_state()
returns table (has_plus boolean, status text, product_id text, expires_at timestamptz,
               grace_expires_at timestamptz, will_renew boolean, environment text)
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare v_uid uuid := public.require_user();
begin
  return query
  select public.has_plus(v_uid), s.status, s.product_id, s.expires_at, s.grace_expires_at, s.will_renew, s.environment
    from (select 1) one
    left join lateral (
      select * from store_subscriptions x
       where x.profile_id = v_uid and public.store_environment_allowed(x.environment)
       order by coalesce(x.expires_at, 'infinity'::timestamptz) desc, x.last_signed_at desc
       limit 1) s on true;
end;
$$;

-- The appAccountToken the app passes to Product.purchase(options:). Stable per person.
create or replace function public.my_app_account_token()
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid := public.require_user(); v_token uuid;
begin
  insert into app_account_tokens (profile_id) values (v_uid) on conflict (profile_id) do nothing;
  select app_account_token into v_token from app_account_tokens where profile_id = v_uid;
  return v_token;
end;
$$;

-- The only write path (service role; called by the App Store notification Edge
-- Function after it verifies Apple's JWS signature and decodes the transaction,
-- and by the reconcile job with p_notification_uuid null). The function maps
-- Apple's notificationType/subtype to p_status:
--   SUBSCRIBED, DID_RENEW, DID_CHANGE_RENEWAL_*  -> active (trial while in a free intro offer)
--   DID_FAIL_TO_RENEW + GRACE_PERIOD -> grace;  DID_FAIL_TO_RENEW -> billing_retry
--   EXPIRED, GRACE_PERIOD_EXPIRED -> expired;   REVOKE -> revoked;   REFUND -> refunded
-- Idempotent on notification_uuid; order-independent (a state signed earlier
-- than the stored one is recorded as stale and changes nothing).
create or replace function public.apply_store_transaction(
  p_notification_uuid uuid,
  p_notification_type text,
  p_subtype text,
  p_signed_at timestamptz,
  p_environment text,
  p_original_transaction_id text,
  p_app_account_token uuid,
  p_product_id text,
  p_status text,
  p_expires_at timestamptz,
  p_grace_expires_at timestamptz default null,
  p_will_renew boolean default null,
  p_original_purchase_at timestamptz default null,
  p_storefront text default null
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_profile uuid;
  v_rows int;
  v_outcome text;
begin
  if p_signed_at is null or p_environment is null or p_original_transaction_id is null
     or p_product_id is null or p_status is null then
    raise exception 'signed_at, environment, original_transaction_id, product_id and status are required' using errcode = '22023';
  end if;
  if p_notification_uuid is not null then
    insert into store_notifications (notification_uuid, notification_type, subtype, environment, original_transaction_id, signed_at)
      values (p_notification_uuid, coalesce(p_notification_type, 'RECONCILE'), p_subtype, p_environment,
              p_original_transaction_id, p_signed_at)
      on conflict (notification_uuid) do nothing;
    if not found then
      return jsonb_build_object('duplicate', true);
    end if;
  end if;

  if not public.store_environment_allowed(p_environment) then
    v_outcome := 'environment_mismatch';
  else
    select profile_id into v_profile from app_account_tokens where app_account_token = p_app_account_token;
    insert into store_subscriptions as s (original_transaction_id, profile_id, product_id, status, expires_at,
                                          grace_expires_at, will_renew, environment, storefront,
                                          original_purchase_at, last_signed_at, last_notification_uuid)
      values (p_original_transaction_id, v_profile, p_product_id, p_status, p_expires_at,
              p_grace_expires_at, p_will_renew, p_environment, p_storefront,
              p_original_purchase_at, p_signed_at, p_notification_uuid)
      on conflict (original_transaction_id) do update
        set profile_id = coalesce(excluded.profile_id, s.profile_id),
            product_id = excluded.product_id,
            status = excluded.status,
            expires_at = excluded.expires_at,
            grace_expires_at = excluded.grace_expires_at,
            will_renew = excluded.will_renew,
            environment = excluded.environment,
            storefront = coalesce(excluded.storefront, s.storefront),
            original_purchase_at = coalesce(s.original_purchase_at, excluded.original_purchase_at),
            last_signed_at = excluded.last_signed_at,
            last_notification_uuid = coalesce(excluded.last_notification_uuid, s.last_notification_uuid)
        where s.last_signed_at <= excluded.last_signed_at;
    get diagnostics v_rows = row_count;
    v_outcome := case when v_rows = 0 then 'stale'
                      when v_profile is null and not exists (select 1 from store_subscriptions
                                                             where original_transaction_id = p_original_transaction_id
                                                               and profile_id is not null) then 'unmapped'
                      else 'applied' end;
  end if;

  if p_notification_uuid is not null then
    update store_notifications set outcome = v_outcome where notification_uuid = p_notification_uuid;
  end if;
  return jsonb_build_object('duplicate', false, 'outcome', v_outcome);
end;
$$;

-- ─── 5. create_child and the first-run batch ────────────────────────────
drop function if exists public.create_child(text, date);

-- Shared body. p_free skips the Plus rule (first-run batch only).
create or replace function public.create_child_row(p_uid uuid, p_id uuid, p_name text, p_date_of_birth date,
                                                   p_due_date date, p_free boolean)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_creator uuid; v_found boolean;
begin
  if not public.is_valid_client_uuid7(p_id) then
    raise exception 'child id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  select created_by, true into v_creator, v_found from children where id = p_id;
  if v_found then
    -- Retry of the same create (lost response, re-sync): idempotent.
    if v_creator = p_uid then return p_id; end if;
    raise exception 'child id already in use' using errcode = 'SCCID';
  end if;
  if exists (select 1 from purge_ledger where entity_type = 'child' and entity_id = p_id::text) then
    raise exception 'this book was deleted for good' using errcode = 'SCPRG';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60 then
    raise exception 'name must be 1 to 60 characters' using errcode = '22023';
  end if;
  if p_date_of_birth is null and p_due_date is null then
    raise exception 'a birthday or a due date is needed' using errcode = '22023';
  end if;
  if p_date_of_birth > current_date + 1 or p_date_of_birth < date '1900-01-01'
     or p_due_date > current_date + 310 or p_due_date < current_date - 400 then
    raise exception 'date out of range' using errcode = '22023';
  end if;
  if not p_free
     and exists (select 1 from children where created_by = p_uid and deleted_at is null)
     and not public.has_plus(p_uid) then
    raise exception 'Plus is needed to start another book' using errcode = 'SCPLS';
  end if;
  insert into children (id, name, date_of_birth, due_date, created_by)
    values (p_id, btrim(p_name), p_date_of_birth, p_due_date, p_uid);
  insert into child_members (child_id, profile_id, role) values (p_id, p_uid, 'parent');
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = p_uid;
  return p_id;
end;
$$;

create or replace function public.create_child(p_id uuid, p_name text, p_date_of_birth date default null,
                                               p_due_date date default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid := public.require_user();
begin
  -- One person's creates are serialised so two offline books cannot both take the free slot.
  perform 1 from profiles where id = v_uid for update;
  if not exists (select 1 from children where id = p_id and created_by = v_uid) then
    perform public.require_content_consent();
  end if;
  return public.create_child_row(v_uid, p_id, p_name, p_date_of_birth, p_due_date, false);
end;
$$;

-- p_children: [{"id": uuidv7, "name": text, "date_of_birth": date|null, "due_date": date|null}], 1 to 6.
-- All free while the batch is open; the call closes it. A retry of the same batch
-- returns the same ids. After the batch is closed each child follows create_child's rule.
create or replace function public.create_first_run_children(p_children jsonb)
returns uuid[] language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_uid uuid := public.require_user();
  v_open boolean;
  v_ids uuid[] := '{}';
  r record;
begin
  if jsonb_typeof(p_children) is distinct from 'array'
     or jsonb_array_length(p_children) not between 1 and 6 then
    raise exception 'first run takes 1 to 6 children' using errcode = '22023';
  end if;
  select first_run_closed_at is null into v_open from profiles where id = v_uid for update;
  perform public.require_content_consent();
  for r in select * from jsonb_to_recordset(p_children) as x(id uuid, name text, date_of_birth date, due_date date)
  loop
    v_ids := v_ids || public.create_child_row(v_uid, r.id, r.name, r.date_of_birth, r.due_date, coalesce(v_open, false));
  end loop;
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = v_uid;
  return v_ids;
end;
$$;

-- ─── 6. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.profiles_guard() from public, anon, authenticated;
revoke execute on function public.has_plus(uuid) from public, anon, authenticated;
revoke execute on function public.apply_store_transaction(uuid, text, text, timestamptz, text, text, uuid, text, text,
  timestamptz, timestamptz, boolean, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.create_child_row(uuid, uuid, text, date, date, boolean) from public, anon, authenticated;
revoke execute on function public.store_environment_allowed(text) from public, anon, authenticated;

revoke execute on function public.is_valid_client_uuid7(uuid) from public, anon;
revoke execute on function public.book_has_plus(uuid) from public, anon;
revoke execute on function public.get_plan_state() from public, anon;
revoke execute on function public.my_app_account_token() from public, anon;
revoke execute on function public.create_child(uuid, text, date, date) from public, anon;
revoke execute on function public.create_first_run_children(jsonb) from public, anon;
grant execute on function public.is_valid_client_uuid7(uuid) to authenticated;
grant execute on function public.book_has_plus(uuid) to authenticated;
grant execute on function public.get_plan_state() to authenticated;
grant execute on function public.my_app_account_token() to authenticated;
grant execute on function public.create_child(uuid, text, date, date) to authenticated;
grant execute on function public.create_first_run_children(jsonb) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.has_plus(uuid) to service_role';
    execute 'grant execute on function public.apply_store_transaction(uuid, text, text, timestamptz, text, text, uuid, text, text, timestamptz, timestamptz, boolean, timestamptz, text) to service_role';
  end if;
end;
$$;

-- ─── 7. Classification ───────────────────────────────────────────────────
comment on column public.profiles.first_run_closed_at is 'L2 system timestamp (first-run free batch used)';

comment on column public.app_account_tokens.profile_id is 'L3 person id';
comment on column public.app_account_tokens.app_account_token is 'L3 random purchase-linking id sent to Apple (never the profile id)';
comment on column public.app_account_tokens.created_at is 'L2 system timestamp';

comment on column public.store_subscriptions.original_transaction_id is 'L3 Apple original transaction id (identifies a purchaser)';
comment on column public.store_subscriptions.profile_id is 'L3 person id; null when unmapped or after account deletion';
comment on column public.store_subscriptions.product_id is 'L2 product id';
comment on column public.store_subscriptions.status is 'L2 enum';
comment on column public.store_subscriptions.expires_at is 'L2 date';
comment on column public.store_subscriptions.grace_expires_at is 'L2 date';
comment on column public.store_subscriptions.will_renew is 'L2 flag';
comment on column public.store_subscriptions.environment is 'L2 enum';
comment on column public.store_subscriptions.storefront is 'L2 storefront country code (US only at launch)';
comment on column public.store_subscriptions.original_purchase_at is 'L2 date';
comment on column public.store_subscriptions.last_signed_at is 'L2 Apple signed date of the applied state';
comment on column public.store_subscriptions.last_notification_uuid is 'L2 Apple notification id';
comment on column public.store_subscriptions.created_at is 'L2 system timestamp';
comment on column public.store_subscriptions.updated_at is 'L2 system timestamp';

comment on column public.store_notifications.notification_uuid is 'L2 Apple notification id (idempotency key)';
comment on column public.store_notifications.notification_type is 'L2 enum';
comment on column public.store_notifications.subtype is 'L2 enum';
comment on column public.store_notifications.environment is 'L2 enum';
comment on column public.store_notifications.original_transaction_id is 'L3 Apple original transaction id';
comment on column public.store_notifications.signed_at is 'L2 Apple signed date';
comment on column public.store_notifications.received_at is 'L2 system timestamp';
comment on column public.store_notifications.outcome is 'L2 enum';
