-- Invite preview before consent, and the consent pepper failing closed.
--
-- PENDING: not yet applied. Apply after 20261005000000_family_cap_language_idempotency.sql,
-- following supabase/APPLY.md (section "File 20261015000000"). The coordinator may
-- rename the timestamp at merge (08-delivery section 4); it must stay after file 12.
-- Additive: one new RPC, one new service-only check, one trigger function replaced
-- with the same signature (grants kept). Nothing that holds data is dropped.
--
-- 1. peek_invite(p_token) (BL-322 server part; security review H2, app half):
--    what the invite sheet may show before the person agrees to join, so the app
--    can ask "Join as a parent? Invited by {signs_as}" and wait for a tap instead
--    of accepting on open. Returns {"role", "inviter_signs_as", "state"} and
--    nothing else: no child name, no birthday, no book id, no member list, no
--    expiry. The child's name reaches the person only after accept_child_invite,
--    which needs consent (the 08-delivery S02 brief: only the inviter's sign-off
--    name before consent). inviter_signs_as is the name the inviter signs their
--    letters with in that book (per-book preference, then the name from their own
--    invite, then their profile), or null when they never set one.
--    Not consent-gated (it reads, writes no data, and is how the person decides);
--    signed-in people only (require_user: no anon role, no anonymous sessions);
--    shares accept_child_invite's 120 per hour (bucket "membership").
--    It refuses exactly where accept_child_invite would, with the same SQLSTATE and
--    message, so peeking reveals nothing accepting would not: SCINV "invite not
--    found" (unknown token, deleted book, maker no longer a parent), "invite already
--    used", "invite revoked", "invite expired", "already a member of this book";
--    SCCAP (a co-parent invite to a book that already has the most parents; detail
--    is the limit). state is "open", or "joined" when the caller already accepted
--    this invite (accept_child_invite is idempotent for them too).
-- 2. BL-334: account deletion's pseudonymisation of consent records
--    (policy_acceptances_pseudonymise, first in 20261002020000) refuses to run
--    without app.consent_pepper of at least 32 characters, instead of hashing with
--    an empty pepper. SQLSTATE SCPEP. The profile delete (and so the auth user
--    delete that cascades to it) rolls back; the purge-worker step fails and
--    retries with its backoff until the founder sets the pepper (APPLY.md step 6).
--    A profile with no consent records has nothing to hash and is never blocked.
--    consent_pepper_ready() (service role only) says whether the setting is usable,
--    without returning it.
--
-- New SQLSTATE: SCPEP  consent pepper missing or shorter than 32 characters
--   (service paths only; the app never sees it).
-- Reused: SCINV, SCCAP, SCRAT, SCANO, 28000.

-- ─── 1. peek_invite ──────────────────────────────────────────────────────
create or replace function public.peek_invite(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare
  v_uid uuid := public.require_user();
  v_inv public.child_invites%rowtype;
  v_signs text;
begin
  perform public.rate_hit('membership');
  select * into v_inv from public.child_invites
   where token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  if v_inv.accepted_by = v_uid then
    return jsonb_build_object('role', v_inv.role, 'inviter_signs_as', null, 'state', 'joined');
  end if;
  if v_inv.accepted_at is not null then raise exception 'invite already used' using errcode = 'SCINV'; end if;
  if v_inv.revoked_at is not null then raise exception 'invite revoked' using errcode = 'SCINV'; end if;
  if v_inv.expires_at < now() then raise exception 'invite expired' using errcode = 'SCINV'; end if;
  if not public.child_is_live(v_inv.child_id) then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  if exists (select 1 from public.child_members where child_id = v_inv.child_id and profile_id = v_uid) then
    raise exception 'already a member of this book' using errcode = 'SCINV';
  end if;
  if not exists (select 1 from public.child_members
                  where child_id = v_inv.child_id and profile_id = v_inv.invited_by and role = 'parent') then
    raise exception 'invite not found' using errcode = 'SCINV';
  end if;
  if v_inv.role = 'parent'
     and (select count(*) from public.child_members where child_id = v_inv.child_id and role = 'parent')
         >= public.max_parents_per_book() then
    raise exception 'this book already has the most parents allowed'
      using errcode = 'SCCAP', detail = public.max_parents_per_book()::text;
  end if;
  -- The same order sync_pull uses for a member's signature.
  select coalesce(pp.signs_as,
                  (select i.signs_as from public.child_invites i
                    where i.child_id = v_inv.child_id and i.accepted_by = v_inv.invited_by
                    order by i.accepted_at desc limit 1),
                  pr.signs_as)
    into v_signs
    from public.profiles pr
    left join public.child_member_prefs pp on pp.child_id = v_inv.child_id and pp.profile_id = pr.id
   where pr.id = v_inv.invited_by;
  return jsonb_build_object('role', v_inv.role, 'inviter_signs_as', v_signs, 'state', 'open');
end;
$$;

-- ─── 2. Consent pepper fails closed (BL-334) ─────────────────────────────
create or replace function public.consent_pepper_ok()
returns boolean language sql stable set search_path = pg_catalog, public as $$
  select coalesce(char_length(current_setting('app.consent_pepper', true)), 0) >= 32;
$$;

-- Changes from 20261002020000: refuses (SCPEP) when there are consent records to
-- pseudonymise and the pepper is missing or short. Never hashes with an empty pepper.
create or replace function public.policy_acceptances_pseudonymise()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if exists (select 1 from policy_acceptances where profile_id = old.id) then
    if not public.consent_pepper_ok() then
      raise exception 'consent pepper is not set; account deletion waits for it (APPLY.md step 6)'
        using errcode = 'SCPEP';
    end if;
    update policy_acceptances
       set subject_hash = sha256(convert_to(old.id::text || current_setting('app.consent_pepper'), 'UTF8')),
           pseudonymised_at = now(),
           profile_id = null
     where profile_id = old.id;
  end if;
  return old;
end;
$$;

-- For the founder's apply check and the purge-worker's preflight: true when the
-- pepper is usable. Never returns the value.
create or replace function public.consent_pepper_ready()
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select public.consent_pepper_ok();
$$;

-- ─── 3. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.peek_invite(text) from public, anon;
grant execute on function public.peek_invite(text) to authenticated;
revoke execute on function public.consent_pepper_ok() from public, anon, authenticated;
revoke execute on function public.consent_pepper_ready() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.consent_pepper_ready() to service_role';
  end if;
end;
$$;
