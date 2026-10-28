# Task: security definer functions with an unpinned search path

Working directory layout:
- `schema.sql`: four `security definer` helpers in `public` (a slice of the real schema). Applied already. Do not edit it.
- `migrations/`: add your change as ONE new `.sql` file (timestamp after 20261029000000).

Background. A security definer function runs with its owner's rights. Postgres searches the caller's temporary schema first for tables unless `pg_temp` is named in the function's `search_path`, so a caller can create a temp table with one of our table names and make the function read it. Our rule: every definer function pins `search_path = pg_catalog, public, pg_temp` (pg_catalog first, pg_temp last). Review of an earlier PR found functions that did not.

Your job. Find every definer function in this slice that breaks the rule and fix it without changing what it returns.

Requirements:
1. After your migration, every definer function in `public` has a `search_path` that starts with `pg_catalog` and ends with `pg_temp`.
2. Do not drop or recreate the functions with different bodies; they keep their names, signatures and answers.
3. A new migration with a header comment: purpose and rollback. Fictional family "Asha" only.
