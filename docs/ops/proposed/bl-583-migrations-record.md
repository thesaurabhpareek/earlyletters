# BL-583: one applied-migrations record per project (DATA-02)

Status: proposal, re-cut 24 Nov 2026 (CR-209, PR 1 of 2; the purge watch is BL-584 in its own PR). The script and its test are in this PR; the workflow and the
`.github/` files are not, because agents never edit `.github/**`. The list format is the data-architect's
call (the item names `data-architect` for the format): this is the shape the code reads, open to change.

## What is wrong today
`.github/migrations-applied.txt` is one flat list and names two files. Staging got 27 on 2 Nov. Until a later PR
records them, a PR can edit an applied file and `migration-guard.yml` stays green.

## What the code does (`scripts/guards/migrations-record.mjs`, tests `[BL-583]`)
One list per project in `.github/migrations-applied/<project>.txt`. A file is applied if any project lists it.
- A PR that edits, renames or deletes a file listed on any project fails.
- A PR that removes a line from any list, or lists a file that is not in `supabase/migrations`, fails.
- A new file that sorts at or before the newest applied version of any project fails.
- `staging` mode reads `schema_migrations.version` rows on stdin and fails if one has no line in that project's list
  (and fails on an empty answer, and on any line that is not digits, so a pasted URL never gets echoed).
- While the folder does not exist it reads the old flat file as project `early-letters`, so the script can land first.

## Steps for Karma and the founder (workflow files and hosted reads are not agent work)
There is deliberately no staging list in this PR. An earlier draft listed 27 files that were never read back from staging, and
`develop` now has more migration files than that. The per-project lists come from a read (queue row FO-4): in the Supabase SQL
editor for staging and for production, run `select version from supabase_migrations.schema_migrations order by 1` (versions only)
and give the two lists to the ops agent, who writes `.github/migrations-applied/<project>.txt` in a follow-up. Until then the flat
guard keeps covering the two listed files.
1. After the read, `git mv` the two-file list into `.github/migrations-applied/early-letters.txt` (the same two lines as
   `docs/ops/proposed/migrations-applied/early-letters.txt`), add the staging and production lists, and delete
   `.github/migrations-applied.txt` in the same PR.
2. `.github/workflows/migration-guard.yml`: replace the last step's `run:` line. This is the exact patch (the job name stays, since it is a required check):
   ```diff
   -        run: node .github/scripts/migration-guard.mjs "$BASE" "$HEAD_SHA"
   +        run: node scripts/guards/migrations-record.mjs guard "$BASE" "$HEAD_SHA"
   ```
   The header comment of that file ("The applied list lives in .github/migrations-applied.txt") then reads
   ".github/migrations-applied/<project>.txt". Not run in Actions.
3. In `.github/workflows/deploy-db.yml`, job `deploy to staging`, after `Push`, add:
   ```yaml
         - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
           with:
             node-version: 22
         - name: Every applied version is in staging's list
           env:
             DB_URL: ${{ secrets.SUPABASE_DB_URL_STAGING }}
           run: |
             psql "$DB_URL" -At -v ON_ERROR_STOP=1 -c "select version from supabase_migrations.schema_migrations order by 1" \
               | node scripts/guards/migrations-record.mjs staging --project staging
   ```
   It prints version numbers only. The existing "Files to record" step can then read `.github/migrations-applied/staging.txt`
   instead of the flat file (once FO-4 has produced it). The same two lines, with `--project production`, go in the `production` job once
   `.github/migrations-applied/production.txt` exists.
4. Add a new project's list file in the same PR that first deploys to that project.

## Not done
The workflow edits above are untested in Actions. `psql` is on the runner (the smoke step already installs it if not); put the
step after the "PostgreSQL client for the smoke" step or move that step up.
