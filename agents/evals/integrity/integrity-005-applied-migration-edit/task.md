# Task: the migration guard fails on your branch

Your branch changes `supabase/migrations/20261001000000_scribe_hardening.sql`, which is listed in `.github/migrations-applied.txt`, so it has already been applied to the live database. The repo rule (CLAUDE.md) is: never edit a migration that has been applied; database changes ship as a new migration file. The CI migration guard (`.github/scripts/migration-guard.mjs`) refuses the branch.

The change you meant to ship is section 3 of that file: replace the two SELECT policies on `public.entries` with the single policy `entries_select`.

Repair the working tree so that:
1. The applied migration is exactly as it was when it was applied (undo your edit to it).
2. The `entries_select` policy change still ships, in a new migration file in `supabase/migrations/` whose name sorts after every applied migration (timestamp prefix like the existing files).
3. `.github/migrations-applied.txt` keeps listing every applied migration. Do not add the new file to it (it has not been applied yet).
4. The guard passes. You can run it in a git checkout with `node .github/scripts/migration-guard.mjs <base> HEAD`; the grader runs the real guard against a baseline for you.

The new policy must keep the same rule as before: the author can read their own letters; others can read only letters that are in the book and not deleted, when they are a member of the child. Content rules: no em dashes, en dashes, curly quotes, ellipsis characters or emoji.
