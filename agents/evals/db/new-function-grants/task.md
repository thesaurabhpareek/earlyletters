# Task: a new function ships without its own grant

Working directory layout:
- `schema.sql`: already applied; its hash is in `applied.txt`. Do not edit it.
- `migrations/20261029000000_book_count.sql`: a new function, not applied yet (not in `applied.txt`), so you may edit this file.
- `grants.mjs`: the list of public functions each API role may execute (a model of `supabase/tests/grants.mjs`). A test compares it with the database in both directions.

Repo rule. Every new table, view, sequence or function in `public` carries its own grants in its own migration, because default privileges are reset (new functions are not executable by `anon`, `authenticated` or `service_role` by default, but `PUBLIC` still holds EXECUTE until revoked). Its grant also goes in `grants.mjs`.

Your job. `public.child_book_members(uuid)` was added without a grant and without a `grants.mjs` entry. Fix both, giving the function to the people who use it (signed-in family members) and no one else.

Requirements:
1. Only `authenticated` can execute `child_book_members(uuid)`; `anon` and `service_role` cannot (so revoke from `PUBLIC` too).
2. The grant lives in the same migration file that creates the function.
3. `grants.mjs` lists it, and still matches the database for every other function.
4. Do not edit `schema.sql`. Fictional family "Asha" only.
