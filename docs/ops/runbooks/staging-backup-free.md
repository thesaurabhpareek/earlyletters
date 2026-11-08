# Runbook: free nightly backup of staging (D-138, BL-566)

The founder chose, on 1 Nov 2026, no paid backup for the alpha and asked for a free path. This is that path. Owner: `ops`; `privacy` reviews; the founder does the account steps. Built in the BL-566 PR; nothing in it has run against staging or GitHub yet (agents never touch hosted projects or accounts).

The three files:
- `docs/ops/backup/staging-backup.yml`: the workflow, copied unchanged into the private repository.
- `docs/ops/backup/backup-role.sql`: the read-only role, run once in staging's SQL Editor.
- `scripts/ops/restore-check.ts`: the row count at the end of the monthly drill.

## What it does
Every night a GitHub Actions job in a separate **private** repository dumps the staging database, reads the whole dump back, counts the rows of three tables in it, encrypts it to the founder's own key, and keeps the encrypted file as a build artifact for 7 days. GitHub only ever holds the encrypted file; the key to open it stays on the founder's Mac.

## Why this shape
- Supabase Free includes no backups (supabase.com/pricing and /docs/guides/platform/backups, read 1 Nov 2026).
- GitHub Free includes US $12 of Actions compute a month (an amount, not a number of minutes) and 500 MB of artifact storage shared with Packages (docs.github.com, "GitHub Actions billing", read 8 Nov 2026). A job of a few minutes a night is well inside the compute. Storage holds 7 nightly files, so each must stay under about 70 MB; the job prints the size every night.
- A private repository, because the main repository is public.
- Encryption with `age` to one public key, so a leak of the artifact or the repository shows nothing.

## What it does not cover (say these out loud)
- **Storage files** (photos) are not in a database dump. Recording backup is off in build 2, so audio is not on the server. If photos are on, their files have no copy.
- **Signed-in sessions are left out on purpose.** The dump skips the data of Auth's session, refresh-token and one-time-token tables, the Auth audit log, `pg_net` responses, `pg_cron` run history and Vault secrets. After a real restore everyone signs in again. The consent pepper is a database setting, not a row, so it is not in the dump either; a real restore sets it again from where it is kept (supabase/APPLY.md step 6).
- **Restoring needs the founder's key.** The job proves the dump reads back before it encrypts it; a restore is the monthly drill below, run from the founder's Mac.
- **Up to 24 hours of changes** can be lost. Letters are also on the phones, and the restore epoch makes phones re-upload (DATA-REQ-030).
- **GitHub holds an encrypted copy of family data.** Before anyone outside the family signs in, `docs/legal/subprocessors.md` and Privacy 6 name it (founder merge), or the path moves.
- **The dump holds the escrow-wrapped book keys** (`child_keys`). Recordings are not on the server in build 2, so there is nothing for them to open; if recording backup turns on, the honest limit in `docs/ops/BACKUP_RUNBOOK.md` section 1 applies to this copy too.
- **A missed night.** GitHub may delay scheduled runs at busy times and drop some at high load (docs.github.com, "Events that trigger workflows", schedule, read 8 Nov 2026), and it emails failures only to the person who last changed the `cron` line. Check the Actions tab once a week.

## Founder steps (about 25 minutes, once)
1. On the Mac: `brew install age`, then `age-keygen -o ~/.config/earlyletters/backup-key.txt`. Keep that file and a paper copy with the escrow papers. Copy the line that starts with `age1`: that is the public key.
2. On GitHub: create a **private** repository `earlyletters-backups` (a README is fine).
3. In Supabase staging, SQL Editor, as `postgres`: run `docs/ops/backup/backup-role.sql` one numbered block at a time and compare each answer with the comment under it. Block 0 tells you staging's Postgres major version; if it is not 17, change `PG_MAJOR` in the workflow before step 5. Block 2A gives the role `pg_read_all_data`. If Supabase refuses it ("permission denied to grant role"), run block 2B instead and keep its list of "NOT granted" schemas for step 4.
4. Give the role a password and login (block 4 of the SQL file; `\password` from psql on the Mac is best). In the new repository, Settings > Secrets and variables > Actions:
   - Secret `STAGING_DB_URL`: the **session pooler** string (Connect > Session pooler, port 5432) with the user changed to `scribe_backup.<project-ref>` and your password: `postgresql://scribe_backup.<project-ref>:<password>@<pooler host>:5432/postgres?sslmode=require`. Not the transaction pooler (6543): the job refuses it.
   - Secret `BACKUP_AGE_RECIPIENT`: the `age1` line.
   - Only if you ran block 2B: variable `DUMP_EXCLUDE_SCHEMAS` with the "NOT granted" schema names, separated by spaces. If `auth` is among them, the backup has no accounts: letters restore, sign-ins do not. Tell `ops` before the first build 2 sign-in.
5. Copy `docs/ops/backup/staging-backup.yml` to `.github/workflows/staging-backup.yml` in the new repository and commit it to its default branch (scheduled runs only start from there).
6. Run it once by hand (Actions > Nightly staging backup > Run workflow). Check: the run is green, its summary shows "Row counts in this dump", and one artifact named `staging-<time>.pgc.age` is listed. Then do the first restore drill below the same day.

## The workflow
It is `docs/ops/backup/staging-backup.yml`. In order, it:
1. Installs `age` and the Postgres client whose major version is `PG_MAJOR` (from the PostgreSQL project's apt repository if Ubuntu's own does not carry it) and checks `pg_dump --version`.
2. Refuses to go on, before any dump, if: the URL is not `postgres://`, does not use TLS or is the transaction pooler; the server's major version (`show server_version_num`) differs from `PG_MAJOR` (pg_dump cannot dump a newer server, so this is the version check); or the role is a superuser, cannot bypass row-level security, can write to `entries`, or does not start read only.
3. Dumps the whole database (`pg_dump --format=custom`), with owners and grants recorded, minus the table data listed above.
4. Reads the dump back: `pg_restore --list` (catches a truncated file) and a full `pg_restore -f /dev/null` (decompresses every data block and catches corrupt table data, which `--list` alone misses), then checks `entries`, `policy_acceptances` and `deletion_requests` have data sections and counts their rows inside the dump.
5. Encrypts with `age`, deletes the plain dump (also on failure), checks the output starts with the age header, and uploads only the `.age` file for 7 days.

The only third-party action, `actions/upload-artifact`, is pinned to commit `cf430e030ddbb5b0abf93d22962f4752f3646cd9` (tag v7.0.2), the same pin this repository's own workflows use. The logs show versions, sizes, the role check, exit codes and three row counts; never a row, a URL or a password.

## Monthly restore drill (founder's Mac, about 20 minutes)
Never into staging (ENVIRONMENTS.md, "Staging during the alpha"). Needs Docker, this repository checked out with Node 22, and the Postgres 17 tools (`brew install postgresql@17`, for `pg_restore` and `psql`; the same major as `PG_MAJOR`).
1. Download the newest artifact from the private repository, and copy its "Row counts in this dump" line from the run summary. If the download arrives as a `.zip`, unzip it.
2. Decrypt: `age -d -i ~/.config/earlyletters/backup-key.txt -o dump.pgc staging-*.pgc.age`
3. Start a throwaway Postgres of the same major version, on this Mac only:
   `docker run --rm -d --name drill -e POSTGRES_PASSWORD=drill -p 127.0.0.1:55432:5432 postgres:17`
   then create the three API roles the access rules name:
   `docker exec drill psql -U postgres -c "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;"`
4. Restore without owners or grants:
   `pg_restore --no-owner --no-privileges -d 'postgresql://postgres:drill@localhost:55432/postgres' dump.pgc`
   It ends with "errors ignored on restore: N". Errors about Supabase's own extensions and schemas (`pg_graphql`, `pgsodium`, `pg_net`, `supabase_vault`, `pg_cron` and the like) are expected in plain Postgres and are not a failure; the count in step 5 is the test. Write N in the log.
5. Count: `RESTORED_DB_URL='postgresql://postgres:drill@localhost:55432/postgres?sslmode=disable' node scripts/ops/restore-check.ts --expect <the line from step 1>`
   It prints the three counts and PASS when each equals the job's count exactly (the job counted this same dump), or FAIL with the difference. It never prints a row or the URL.
6. Write the date, the run's time, N, the three counts and PASS or FAIL in the "Free nightly backup drills" log in `docs/ops/runbooks/restore-drill.md`, without any content.
7. Clean up: `docker stop drill` (the container goes with it), then delete `dump.pgc` and the downloaded file.

This drill proves the backup opens and holds the rows. It does not rehearse a full restore into a new Supabase project (Auth, Storage and the extensions working); that is `restore-drill.md` Part 1 on a synthetic project, still owed by BL-566's second acceptance line.

## Acceptance (BL-566)
- Given the private repository, when the Actions tab is read, then a successful run under 24 hours old exists and its artifact is encrypted (`file` reports age-encrypted data).
- Given a dump that is truncated or has a corrupt data block, when the job runs, then `pg_restore --list` or the full `pg_restore -f /dev/null` read fails the job and no artifact is kept.
- Given a role that can write, is a superuser or does not bypass row-level security, or a server whose major version is not `PG_MAJOR`, when the job runs, then it stops before dumping and keeps no artifact.
- Given the founder's key and the run's "Row counts in this dump" line, when the monthly drill runs, then `restore-check.ts` prints PASS and the drill log records it.

## Not verified (8 Nov 2026)
- Whether Supabase lets `postgres` grant `pg_read_all_data` (Postgres 16 and later need the ADMIN option on it; rehearsed locally, a role without it gets "permission denied to grant role"), and what block 2B can grant on `auth` and `storage`, which Supabase's own roles own.
- That a custom role signs in through the session pooler as `scribe_backup.<project-ref>`. Supabase documents that form only for `postgres`; one community report (github.com/orgs/supabase/discussions/50229, Sep 2026) says a custom read-only role works in session mode and not in transaction mode.
- Staging's actual Postgres major version (`supabase/config.toml` says 17; block 0 and the job's check read it).
- That a full dump as this role completes on Supabase. Rehearsed only on local PostgreSQL 16 with this repository's migrations and stub Auth and Storage schemas.
- The private repository's Actions limits beyond the billing page above, and how the artifact downloads with `archive: false` in the web interface.
