-- BL-1963: raise the server length check on profiles.display_name from 60 to 960 code points, the same rule as BL-1572.
--
-- Purpose. The phone counts a typed name in graphemes (packages/core/src/length.ts), at most 16 code points a character, and the
-- product limit for a display name is 60 characters. The server counted code points: profiles.display_name <= 60, so a 30-character
-- Devanagari name (about 90 code points) was refused. The ceiling becomes 960 = 60 x 16, the product limit times the worst case
-- code points per grapheme, exactly how BL-1572 chose children.name (960) and the signs_as columns (480 = 30 x 16). The product rule
-- (60 characters) stays in the app; the server holds only a loose backstop. A path that writes the column today: a direct update by
-- the signed-in person (authenticated holds UPDATE on profiles, 20261023060000). No phone screen writes it (BL-1563 deleted the
-- one writer, saveDisplayName); the export reads it. So this is the backstop, ahead of the day a screen or a sign-in name writes it.
--
-- Where the limit lives, both places:
--   1. the CHECK constraint on display_name, re-created as profiles_display_name_check (the inline check of 20260930000000 carries
--      the name Postgres generated, which is the same; it is dropped by what it reads, not by an assumed name);
--   2. a new value-free BEFORE trigger, profiles_validate_limits, in the BL-244 pattern of 20261121040000: it tests the same limit
--      first and raises a fixed message (SQLSTATE 23514, no DETAIL, no HINT, no value, no length), so the CHECK never fires and the
--      name, an L3 value, is not echoed in the Postgres log or the PostgREST body. Before this file profiles had no such trigger,
--      so a 61-point name was refused with "Failing row contains (...)"; now the refusal is value-free.
-- The count is char_length of the stored value, as the CHECK counts. Nothing trims, cuts or rewrites a name (the constitution);
-- the phone trims before it sends. Not changed: profiles.signs_as (480, File 47; still CHECK only, out of this row).
--
-- Ordering. Apply after 20261123200000 and 20261123210000 (File 47, the 960/480 entry length checks; PR #1786 gives that file its
-- own version, 210000). Not applied. Applying it to a hosted project is the founder's step (D-041, CR-73), from a CI tag run. The
-- phone does not change here: BL-1962 owns the client and waits for the hosted apply.
-- Rollback (forward-fix only; never edit this file once applied). Restoring 60 is safe only if no row is over 60 code points. A
-- NOT VALID check skips the scan at apply time, but it and the old trigger still test the row on every later INSERT or UPDATE, so a
-- row over 60 would refuse every update of that row, even of an unrelated column. Words are never cut. So: keep the new limit (the
-- default: it is looser, so it cannot fail old data) or first fix those rows by a decision of the data architect, then restore the
-- check at 60 and the trigger body at 60 in a new migration.
--
-- Safety. The new limit is looser, so no stored row can fail it. DROP and ADD CONSTRAINT take one short ACCESS EXCLUSIVE lock and
-- scan profiles once (one row per account); run in one transaction so no write sees neither check. One new function and trigger:
-- the function is a trigger function and no API role executes it (revoked below, same as File 40); no table, column or table grant
-- changes, so nothing new to classify (display_name stays L3, 'name the person chose'). Budget: one char_length per written row,
-- only on INSERT or on UPDATE OF display_name; no query, no index.
-- Errors stay value-free (BL-244): fixed message, no DETAIL. Tests: supabase/tests/profiles_display_name_ceiling.test.mjs.

-- --- 1. the CHECK constraint ----------------------------------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select k.conname from pg_constraint k
     where k.conrelid = 'public.profiles'::regclass and k.contype = 'c'
       and k.conkey = array[(select a.attnum from pg_attribute a where a.attrelid = 'public.profiles'::regclass and a.attname = 'display_name')]
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
  alter table public.profiles add constraint profiles_display_name_check check (char_length(display_name) <= 960);
end $$;

-- --- 2. the value-free trigger ----------------------------------------------------------------------------------------------
create or replace function public.profiles_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.display_name) > 960 then
    raise exception 'profiles: display_name is over its limit' using errcode = '23514', constraint = 'profiles_display_name_check';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_limits on public.profiles;
create trigger profiles_validate_limits before insert or update of display_name on public.profiles
  for each row execute function public.profiles_validate_limits();

-- --- 3. grants: no API role executes a trigger function ----------------------------------------------------------------------
revoke execute on function public.profiles_validate_limits() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.profiles_validate_limits() from anon, authenticated, service_role';
  end if;
end;
$$;
