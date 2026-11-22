---
applyTo: "supabase/**"
---
- Every new SECURITY DEFINER function and RLS helper ends its `search_path` with `pg_temp` (for example `pg_catalog, public, pg_temp`) and qualifies its calls. Older migrations are swept by `20261015000000`; do not flag them.
- Grants are explicit. New functions are not executable by `anon` unless the PR says why.
- New migrations should begin with a comment: purpose, rollback, ordering assumptions (a new norm, not yet the habit in older files).
- RLS: look for a policy path that lets one family read another's rows, or an upsert or update path that bypasses an insert policy.
- Tests live in `supabase/tests`, use the fictional family "Asha", and must fail without the change.
