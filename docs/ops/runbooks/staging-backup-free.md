# Runbook: free nightly backup of staging (D-138, BL-566)

The founder chose, on 1 Nov 2026, no paid backup for the alpha and asked for a free path. This is that path. Owner: `ops`; `privacy` reviews; the founder does the account steps. Built in the BL-566 PR; nothing in it has run against staging or GitHub yet (agents never touch hosted projects or accounts).

The three files:
- `docs/ops/backup/staging-backup.yml`: the workflow, copied unchanged into the private repository.
- `docs/ops/backup/backup-role.sql`: the read-only role, run once in staging's SQL Editor.
- `scripts/ops/dump-manifest.ts` and `scripts/ops/restore-check.ts`: the table-by-table comparison at the end of the monthly drill.
- `supabase/tests/backup_role.test.mjs`: the proof that the role reads what the dump needs and no sign-in credential.

## What it does
Every night a GitHub Actions job in a separate **private** repository dumps the product's schemas (`public`, `ops`, `insights`, `sync_private`, and from `auth` only the accounts), reads the whole dump back, checks the tables the product depends on are in it, encrypts it to the founder's own key, and keeps the encrypted file as a build artifact for 7 days. GitHub only ever holds the encrypted file; the key to open it stays on the founder's Mac.

## Why this shape
- Supabase Free includes no backups (supabase.com/pricing and /docs/guides/platform/backups, read 1 Nov 2026).
- GitHub Free includes US $12 of Actions compute a month (an amount, not a number of minutes) and 500 MB of artifact storage shared with Packages (docs.github.com, "GitHub Actions billing", read 8 Nov 2026). A job of a few minutes a night is well inside the compute. Storage holds 7 nightly files, so each must stay under about 70 MB; the job prints the size every night.
- A private repository, because the main repository is public.
- Encryption with `age` to one public key, so a leak of the artifact or the repository shows nothing.

## What the backup role can and cannot read
The login behind the secret is the role in `docs/ops/backup/backup-role.sql`. It has no blanket read role (`pg_read_all_data` reads every table in every schema, including live sign-ins, and is not used). It reads the tables of the four product schemas and `auth.users` and `auth.identities`. It cannot read `auth.sessions`, `auth.refresh_tokens`, `auth.one_time_tokens`, the other Auth tables or the Vault; the nightly job refuses to dump if it finds that it can (the "Role facts" line must read `f t f on f 0 t`), and `supabase/tests/backup_role.test.mjs` proves it.

What the URL still gives whoever holds it (say this plainly):
- Every family's letters, names, consent records and deletion ledger, read only. That is the point of a backup, and the reason the secret lives only in the private repository.
- The consent pepper. It is a database-level setting (APPLY.md step 6), and Postgres lets every role that connects read such a setting; no grant hides it. It pseudonymises consent records; with it, a person's id can be turned into the stored hash. Security decides whether to move it (follow-up for `security`).
- The hashed one-time-token columns and the password-hash column of `auth.users`, which the accounts table carries.
It is not a way to sign in as someone: sessions and refresh tokens are out of reach.

## What it does not cover (say these out loud)
- **Database settings.** The dump has no `ALTER DATABASE ... SET` lines, so these are lost with the project and must be set again after a real restore (APPLY.md has each one): `app.consent_pepper` (step 6; never change it, or the old hashes stop matching), `app.store_environment`, `app.max_parents_per_book`, `app.contributors_enabled`, and, if you turned them on, `app.held_sync`, `app.family_share_consent_required`, `app.status_report_enabled`, `app.backup_enabled`, `app.escrow_enabled`, `app.escrow_key_versions`, `app.escrow_rotation`, `app.allow_short_notice`, `app.ops_retention` and `app.retention_purge`. Read the live values now and after every change, and keep the list (the pepper in the password manager, never in the repository): `select unnest(setconfig) from pg_db_role_setting where setdatabase = (select oid from pg_database where datname = current_database()) and setrole = 0;` A project that does not have a setting uses the migration's default.
- **Roles and their passwords** (the dump is made without owners; `scribe_backup` itself is re-created from `backup-role.sql`), **Auth configuration** (providers, OTP length, redirect URLs, email templates, rate limits), **Edge Function secrets** and the functions themselves, **cron schedules** (`scribe-purge-due`, `scribe-sync-housekeeping`: APPLY.md steps 7 and 15), **Vault**, **extensions** and **Storage buckets and files**. Each is set up again from the repository's runbooks.
- **Storage files** (photos) are not in a database dump. Recording backup is off in build 2, so audio is not on the server. If photos are on, their files have no copy. The purge worker's daily ledger files (`ops-ledger/purges/*.jsonl`, written to Storage every day) are Storage files too: they are not in this backup, and on the Free plan nothing else keeps them. See the real restore section of `free-tier-ops.md` for what that means for deletions.
- **Signed-in sessions are left out on purpose.** After a real restore everyone signs in again.
- **Restoring needs the founder's key.** The job proves the dump reads back before it encrypts it; a restore is the monthly drill below, run from the founder's Mac.
- **Up to 24 hours of changes** can be lost. Letters are also on the phones, and the restore epoch makes phones re-upload (DATA-REQ-030).
- **GitHub holds an encrypted copy of family data**, for 7 days, and the founder's Mac may hold decrypted copies for longer (see the drill's cleanup step). Before anyone outside the family signs in, `docs/legal/subprocessors.md` and Privacy 6 name it (founder merge), or the path moves.
- **The dump holds the escrow-wrapped book keys** (`child_keys`). Recordings are not on the server in build 2, so there is nothing for them to open; if recording backup turns on, the honest limit in `docs/ops/BACKUP_RUNBOOK.md` section 1 applies to this copy too.
- **A missed night.** GitHub may delay scheduled runs at busy times and drop some at high load (docs.github.com, "Events that trigger workflows", schedule, read 8 Nov 2026), and it emails failures only to the person who last changed the `cron` line. Check the Actions tab once a week.

## Founder steps (about 25 minutes, once)
1. On the Mac: `brew install age`, then `age-keygen -o ~/.config/earlyletters/backup-key.txt`. Keep that file and a paper copy with the escrow papers. Copy the line that starts with `age1`: that is the public key.
2. On GitHub: create a **private** repository `earlyletters-backups` (a README is fine).
3. In Supabase staging, SQL Editor, as `postgres`: run `docs/ops/backup/backup-role.sql` one numbered block at a time and compare each answer with the comment under it. Block 0 tells you staging's Postgres major version; if it is not 17, change `PG_MAJOR` in the workflow before step 5. Block 2 grants table by table; if it prints "NOT granted" (Supabase may not let `postgres` grant on its Auth tables), stop and tell `ops`: the job will not run without `auth.users`, and there is no fallback that widens the role. Block 3 must show `false` for every sign-in credential table.
4. Give the role a password and login (block 4 of the SQL file; `\password` from psql on the Mac is best, because the password then never sits in a query. If you use the SQL Editor, the password is in the clear in that query and the dashboard keeps a history of queries; change it from psql after the first green run). In the new repository, Settings > Secrets and variables > Actions:
   - Secret `STAGING_DB_URL`: the **session pooler** string (Connect > Session pooler, port 5432) with the user changed to `scribe_backup.<project-ref>` and your password: `postgresql://scribe_backup.<project-ref>:<password>@<pooler host>:5432/postgres?sslmode=require`. Not the transaction pooler (6543): the job refuses it.
   - Secret `BACKUP_AGE_RECIPIENT`: the `age1` line.
   - Record the date you set this password and the date it is next due (180 days later) in `docs/security/SECRETS_REVIEW.md` section 11, as a date only.
5. Copy `docs/ops/backup/staging-backup.yml` to `.github/workflows/staging-backup.yml` in the new repository and commit it to its default branch (scheduled runs only start from there).
6. Run it once by hand (Actions > Nightly staging backup > Run workflow). Check: the run is green, its summary shows the row counts of the required tables, and one artifact named `staging-<time>.pgc.age` is listed. Then do the first restore drill below the same day.

## The workflow
It is `docs/ops/backup/staging-backup.yml`. In order, it:
1. Installs `age` and the Postgres client whose major version is `PG_MAJOR` (from the PostgreSQL project's apt repository if Ubuntu's own does not carry it) and checks `pg_dump --version`.
2. Refuses to go on, before any dump, if: the URL is not `postgres://`, does not use TLS or is the transaction pooler; the server's major version differs from `PG_MAJOR`; or the role is a superuser, cannot bypass row-level security, can write to `entries`, does not start read only, holds `pg_read_all_data`, can read any sign-in credential table or the Vault, or cannot read `auth.users`. A connection failure prints one category ("the password was rejected", "timed out", and so on), never the driver's text, so the pooler host and the role name stay out of the log.
3. Dumps the schemas `public`, `ops`, `insights`, `sync_private` and `auth` (`pg_dump --format=custom`), with every Auth table other than `users` and `identities` left out by name, and owners, row security policies and grants recorded.
4. Reads the dump back: `pg_restore --list` (catches a truncated file) and a full `pg_restore -f /dev/null` (decompresses every data block and catches corrupt table data, which `--list` alone misses). Checks that the ten required tables have data sections, that the dump holds row security policies and grants, and counts the rows of each required table, one failure check per table.
5. Encrypts with `age`, deletes the plain dump (also on failure), checks the output starts with the age header, and uploads only the `.age` file for 7 days.

The only third-party action, `actions/upload-artifact`, is pinned to commit `cf430e030ddbb5b0abf93d22962f4752f3646cd9` (tag v7.0.2), the same pin this repository's own workflows use. The logs show versions, sizes, the role check, exit codes and row counts; never a row, a host, a role name, a URL or a password.

## Monthly restore drill (founder's Mac, about 25 minutes)
Never into staging (ENVIRONMENTS.md, "Staging during the alpha"). Needs Docker, this repository checked out with Node 22, and the Postgres 17 tools (`brew install postgresql@17`, for `pg_restore` and `psql`; the same major as `PG_MAJOR`). Do all of it in one new empty folder, for example `mkdir ~/backup-drill && cd ~/backup-drill`.
1. Download the newest artifact from the private repository into that folder. If it arrives as a `.zip`, unzip it.
2. Decrypt: `age -d -i ~/.config/earlyletters/backup-key.txt -o dump.pgc staging-*.pgc.age`
3. Make the manifest from the decrypted dump (reads the file only, touches no database): `node <repository>/scripts/ops/dump-manifest.ts dump.pgc > manifest.txt`. It lists every table in the dump with its row count and the number of policies. If it prints a FINDING, the backup itself is missing something: write FAIL in the log and tell `ops`.
4. Start a throwaway Postgres of the same major version, on this Mac only:
   `docker run --rm -d --name drill -e POSTGRES_PASSWORD=drill -p 127.0.0.1:55432:5432 postgres:17`
   then create the three API roles the access rules name:
   `docker exec drill psql -U postgres -c "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;"`
5. Restore without owners or grants:
   `pg_restore --no-owner --no-privileges -d 'postgresql://postgres:drill@localhost:55432/postgres' dump.pgc 2> errors.txt`
   Expect exactly one error: `schema "public" already exists` (the plain Postgres image has a `public` schema), and "errors ignored on restore: 1". Rehearsed on 8 Nov 2026 on PostgreSQL 16 with this repository's migrations and a stand-in Auth schema: that was the only error. Any other line in `errors.txt` is not on the list of expected errors: copy it (it holds object names, not content) into the log. A dump from the hosted project may add messages about Auth objects that Supabase owns; the first hosted drill records them, and `ops` adds the ones that prove harmless to this list (not yet verified). Do not ignore errors by habit: the next step is what decides.
6. Compare every table: `RESTORED_DB_URL='postgresql://postgres:drill@localhost:55432/postgres?sslmode=disable' node <repository>/scripts/ops/restore-check.ts --manifest manifest.txt`
   It counts every table named in the manifest in the restored copy and compares each with the dump, and compares the policy count. It prints the number of tables compared, one FINDING line per difference and PASS or FAIL. A table that is missing, empty when it should not be, or different by one row is a FAIL. It never prints a row or the URL.
7. Write the date, the run's time, the number of tables compared, the policy count and PASS or FAIL in the "Free nightly backup drills" log in `docs/ops/runbooks/restore-drill.md`, without any content.
8. Clean up, every time: `docker stop drill` (the container goes with it); then delete the whole folder with `rm -rf ~/backup-drill` (do not use Finder's Trash, which keeps it). The decrypted dump is every family's data in the clear. Copies can outlive the 7 days if the browser saved the download elsewhere: also empty the browser's Downloads entry for the artifact and, if the folder was in iCloud Drive, Desktop or Documents, check there too.

Honest retention, for the privacy text (`privacy` and the founder decide the wording; `ops` does not edit `docs/legal`): the GitHub artifact is deleted after 7 days, but a copy downloaded for a drill lives on the founder's Mac until step 8 is done, and Time Machine or another backup of the Mac can hold it longer, beyond the founder's control until that backup ages out. The drill should therefore be done in a folder that Time Machine excludes (add `~/backup-drill` to Time Machine's exclude list once; the exact menu path is not verified), and the retention statement should say "up to 7 days in the backup repository, plus any copy kept on the founder's own computer for a monthly check, deleted the same day".

This drill proves the backup opens and holds every table's rows and the policies. It does not rehearse a full restore into a new Supabase project (Auth, Storage and the extensions working); that is `restore-drill.md` Part 1 on a synthetic project, still owed by BL-566's second acceptance line.

## Putting the settings back after a real restore
A real restore (`restore-drill.md` Part 2) is into a new project and starts with the database settings under "What it does not cover", set again with `alter database postgres set <name> = '<value>'` from the list you kept, then the cron schedules, then the function secrets. The pepper first: file 14 refuses account deletion without it.

## Acceptance (BL-566)
- Given the private repository, when the Actions tab is read, then a successful run under 24 hours old exists and its artifact is encrypted (`file` reports age-encrypted data).
- Given a dump that is truncated or has a corrupt data block, when the job runs, then `pg_restore --list` or the full `pg_restore -f /dev/null` read fails the job and no artifact is kept.
- Given a role that can write, is a superuser or does not bypass row-level security, or a server whose major version is not `PG_MAJOR`, when the job runs, then it stops before dumping and keeps no artifact.
- Given the founder's key, when the monthly drill runs, then `restore-check.ts` compares every table in the dump's manifest and the policy count, prints PASS, and the drill log records it; a restored copy that lost any table or any rows prints FAIL.
- Given a role that can read `auth.refresh_tokens`, `auth.sessions`, `auth.one_time_tokens` or the Vault, or holds `pg_read_all_data`, when the job runs, then it stops before dumping.

## Not verified (8 Nov 2026)
- Whether Supabase lets `postgres` grant `select` on `auth.users` and `auth.identities` (Supabase's own role owns the Auth schema). If it does not, the job refuses to run and the question goes to `ops`; the role is never widened to get around it.
- That the Vault, cron, net and storage schemas are closed to a new role on the hosted project (backup-role.sql block 3 reads it; PostgreSQL 16 locally says yes).
- That a custom role signs in through the session pooler as `scribe_backup.<project-ref>`. Supabase documents that form only for `postgres`; one community report (github.com/orgs/supabase/discussions/50229, Sep 2026) says a custom read-only role works in session mode and not in transaction mode.
- Staging's actual Postgres major version (`supabase/config.toml` says 17; block 0 and the job's check read it).
- That a full dump as this role completes on Supabase. Rehearsed (8 Nov 2026) on local PostgreSQL 16 with this repository's 27 migrations and stand-in Auth, Storage and Vault schemas: the role check, the dump, the restore and the manifest comparison, including a PASS and a FAIL after a table was dropped.
- The private repository's Actions limits beyond the billing page above, and how the artifact downloads with `archive: false` in the web interface.
