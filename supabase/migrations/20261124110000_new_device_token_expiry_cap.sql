-- BL-1204 (NS-08-R21): a table-level cap on how long a "Not you?" token can live.
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73); it needs 20261121000000 first.
-- Purpose: ops_new_device_token_mint refuses a ttl under 1 minute or over 7 days (#1182) and defaults to 48 hours, but a
-- direct insert into ops.new_device_tokens only had `expires_at > created_at`. This adds the backstop so no insert, from
-- any path, can make a token that lives past 7 days. The 48 hour default stays in the mint function.
-- Existing rows: the mint function has capped every token since it existed and the default is 48 hours, so no row is
-- expected to break the check. If one does, the migration fails and changes nothing; fix the row, then run it again.
-- Rollback (forward-fix only; a later migration): drop the constraint new_device_tokens_expiry_cap.
-- Ordering: after 20261121000000. No grant changes (the table has none for an API role).
-- Tests: supabase/tests/new_device_sign_in.test.mjs ([BL-1204 token]).

alter table ops.new_device_tokens
  add constraint new_device_tokens_expiry_cap check (expires_at <= created_at + interval '7 days');
