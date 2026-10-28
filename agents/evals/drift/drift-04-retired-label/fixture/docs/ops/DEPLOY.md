# Deploy (excerpt)

## Tagging flow (a normal release)

1. Merge the migration into `develop` through a PR: after two independent passing reviews on the current head, with green CI (`db-cli.yml` and `CI`), the coordinator merges it (D-117; the `approve-migration` label of D-041 is no longer used).
2. The push to `develop` runs `deploy to staging` after you approve it: dry run, then push to `scribe-staging`. Read the run summary for the list of files to record.
3. Check staging (the app against staging, Supabase advisors, the checks in `supabase/APPLY.md` that apply to the new files).
