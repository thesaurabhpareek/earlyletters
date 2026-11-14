# BL-583: one applied-migrations record per project (DATA-02)

Status: proposal for the founder's 9 Nov window (D-124, CR-22). The code is on this branch; the workflow and the
`.github/` files are not, because `.github/**` is out of scope until then. The list format is the data-architect's
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

## Founder steps (9 Nov)
1. Read staging's `select version from supabase_migrations.schema_migrations order by 1` yourself and compare it with
   `docs/ops/proposed/migrations-applied/staging.txt` (27 file names from develop at 8 Nov; not verified against staging).
2. `git mv` the two files into `.github/migrations-applied/` and delete `.github/migrations-applied.txt` in the same PR.
3. In `.github/workflows/migration-guard.yml` replace the last step's `run:` with
   `node scripts/guards/migrations-record.mjs guard "$BASE" "$HEAD_SHA"`
   (the script is in the checkout). Keep the job name, since it is a required check.
4. In `.github/workflows/deploy-db.yml`, job `deploy to staging`, after `Push`, add:
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
   instead of the flat file. The same two lines, with `--project production`, go in the `production` job once
   `.github/migrations-applied/production.txt` exists.
5. Add a new project's list file in the same PR that first deploys to that project.

## Not done
The workflow edits above are untested in Actions. `psql` is on the runner (the smoke step already installs it if not); put the
step after the "PostgreSQL client for the smoke" step or move that step up.
