-- BL-244 (API-R10, TDD 06 conflict C-2): a content table refuses an over-limit write without echoing the row.
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73). Apply after 20261121020000 (supabase/APPLY.md,
-- "File 39"). ROLLBACK (forward-fix only): drop the four triggers and the four functions below; the CHECK constraints stay and
-- keep refusing, as before, with the row in DETAIL.
--
-- The gap. Postgres adds "Failing row contains (...)" to the DETAIL of a CHECK violation. On entries that is a letter (L4) in the
-- Postgres log and in the PostgREST body the app may forward. BEFORE ROW triggers run before CHECK constraints are evaluated, so a
-- trigger that tests the same limit first, and raises a fixed message, means the CHECK never fires.
--
-- What each trigger enforces (the same limit as the CHECK it shadows; the CHECKs are not touched or dropped, they stay the
-- last line):
--   entries           final_text 20000 chars (entries_final_text_length), raw_transcript 40000 (entries_raw_length),
--                     author_signs_as 30 (entries_author_signs_as_check), author_edits 65536 bytes (entries_author_edits_shape),
--                     locked_spans 16384 bytes (entries_locked_spans_shape)
--   held_drafts       raw_transcript, final_text, typed_text 100000 chars, prompt_key 200, machine_edits 200000 bytes
--                     (held_drafts_sizes)
--   children          name 60 chars (children_name_check), nickname 30 (children_nickname_check)
--   dictionary_terms  term 1 to 80 chars (dictionary_terms_term_check); forms must pass dictionary_forms_valid, the function the
--                     CHECK dictionary_terms_forms_shape calls (the count, size and length limits of the forms)
-- Enum and shape CHECKs (kind, capture_mode, photo_path, machine_edits array) are not in this file: they carry a column name in the
-- constraint, and a bad value there is an app bug, not a person's text over a limit. They still echo; recorded in the PR.
--
-- How a refusal is answered. SQLSTATE 23514 (check_violation, what the CHECK raised, so sync_push and the Edge Functions answer
-- it as before). The message names the table and the rule ("entries: final_text is over its limit"), constraint = the name of the
-- CHECK it shadows, and nothing else: no DETAIL, no HINT, no column value, no length. Nothing here reads a value into a string.
-- raw_transcript immutability stays with entries_guard (the constitution trigger); this trigger only measures length. It sorts
-- after entries_guard, so an immutable-column change is still refused first, with its own code.
--
-- Existing rows. Never deleted or rewritten (the constitution). No length CHECK on these tables is NOT VALID, so no stored row is
-- over a limit and an UPDATE that leaves a column alone passes exactly as it did.
--
-- Functions: trigger functions, SECURITY INVOKER (they read only NEW), search_path pinned to pg_catalog, public, pg_temp. Grants: EXECUTE
-- revoked from PUBLIC, anon, authenticated and service_role (a trigger does not need the writer to hold EXECUTE). They add no entry
-- to supabase/tests/grants.mjs SERVICE_ROLE_FUNCTIONS: the access matrix fails a public function an API role can run, and these are
-- run by none. No table, column or table grant changes; no new column, so nothing new to classify.
-- Budget: one O(length) char_length per limited column per written row, on a value Postgres already holds; no query, no index.
-- New SQLSTATEs: none. Tests: supabase/tests/value_free_validation.test.mjs. Fictional family "Asha" only.

-- --- 1. entries -------------------------------------------------------------------------------------------------------------
create or replace function public.entries_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.final_text) > 20000 then
    raise exception 'entries: final_text is over its limit' using errcode = '23514', constraint = 'entries_final_text_length';
  end if;
  if char_length(new.raw_transcript) > 40000 then
    raise exception 'entries: raw_transcript is over its limit' using errcode = '23514', constraint = 'entries_raw_length';
  end if;
  if char_length(new.author_signs_as) > 30 then
    raise exception 'entries: author_signs_as is over its limit' using errcode = '23514', constraint = 'entries_author_signs_as_check';
  end if;
  if new.author_edits is not null and octet_length(new.author_edits::text) > 65536 then
    raise exception 'entries: author_edits is over its size limit' using errcode = '23514', constraint = 'entries_author_edits_shape';
  end if;
  if new.locked_spans is not null and octet_length(new.locked_spans::text) > 16384 then
    raise exception 'entries: locked_spans is over its size limit' using errcode = '23514', constraint = 'entries_locked_spans_shape';
  end if;
  return new;
end;
$$;

-- --- 2. held_drafts ---------------------------------------------------------------------------------------------------------
create or replace function public.held_drafts_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if length(new.raw_transcript) > 100000 or length(new.final_text) > 100000 or length(new.typed_text) > 100000
     or length(new.prompt_key) > 200 or octet_length(new.machine_edits::text) > 200000 then
    raise exception 'held_drafts: a value is over its size limit' using errcode = '23514', constraint = 'held_drafts_sizes';
  end if;
  return new;
end;
$$;

-- --- 3. children ------------------------------------------------------------------------------------------------------------
create or replace function public.children_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.name) > 60 then
    raise exception 'children: name is over its limit' using errcode = '23514', constraint = 'children_name_check';
  end if;
  if char_length(new.nickname) > 30 then
    raise exception 'children: nickname is over its limit' using errcode = '23514', constraint = 'children_nickname_check';
  end if;
  return new;
end;
$$;

-- --- 4. dictionary_terms ----------------------------------------------------------------------------------------------------
create or replace function public.dictionary_terms_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.term) < 1 or char_length(new.term) > 80 then
    raise exception 'dictionary_terms: term is outside its length limits' using errcode = '23514', constraint = 'dictionary_terms_term_check';
  end if;
  if not public.dictionary_forms_valid(new.forms) then
    raise exception 'dictionary_terms: forms are outside their limits' using errcode = '23514', constraint = 'dictionary_terms_forms_shape';
  end if;
  return new;
end;
$$;

-- --- 5. triggers (names contain 'validate'; BEFORE INSERT OR UPDATE, per row) -----------------------------------------------
drop trigger if exists entries_validate_limits on public.entries;
create trigger entries_validate_limits before insert or update on public.entries
  for each row execute function public.entries_validate_limits();
drop trigger if exists held_drafts_validate_limits on public.held_drafts;
create trigger held_drafts_validate_limits before insert or update on public.held_drafts
  for each row execute function public.held_drafts_validate_limits();
drop trigger if exists children_validate_limits on public.children;
create trigger children_validate_limits before insert or update on public.children
  for each row execute function public.children_validate_limits();
drop trigger if exists dictionary_terms_validate_limits on public.dictionary_terms;
create trigger dictionary_terms_validate_limits before insert or update on public.dictionary_terms
  for each row execute function public.dictionary_terms_validate_limits();

-- --- 6. grants: no API role executes a trigger function ---------------------------------------------------------------------
revoke execute on function public.entries_validate_limits(), public.held_drafts_validate_limits(),
  public.children_validate_limits(), public.dictionary_terms_validate_limits() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.entries_validate_limits(), public.held_drafts_validate_limits(), '
         || 'public.children_validate_limits(), public.dictionary_terms_validate_limits() from anon, authenticated, service_role';
  end if;
end;
$$;
