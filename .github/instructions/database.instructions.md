---
applyTo: "supabase/**"
---
- Every SECURITY DEFINER function and RLS helper sets `search_path = pg_catalog, public, pg_temp` and qualifies its calls.
- Grants are explicit. New functions are not executable by `anon` unless the PR says why.
- A migration begins with a comment: purpose, rollback, ordering assumptions.
- RLS: look for a policy path that lets one family read another's rows, or an upsert or update path that bypasses an insert policy.
- Tests live in `supabase/tests`, use the fictional family "Asha", and must fail without the change.
