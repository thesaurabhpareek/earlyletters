# Runbook: free nightly backup of staging (D-138, BL-566)

The founder chose, on 1 Nov 2026, no paid backup for the alpha and asked for a free path. This is that path. Owner: `ops`; `privacy` reviews; the founder does the account steps. Nothing here is built yet.

## What it does
Every night a GitHub Actions job in a separate **private** repository dumps the staging database, checks that the dump is readable, encrypts it to the founder's own key, and keeps it as a build artifact for 7 days. GitHub only ever holds the encrypted file; the key to open it stays on the founder's Mac.

## Why this shape
- Supabase Free includes no backups (supabase.com/pricing and /docs/guides/platform/backups, read 1 Nov 2026).
- GitHub Free includes US $12 of Actions compute a month for private repositories and 500 MB of artifact storage; artifacts are kept 90 days unless set lower (docs.github.com, Actions billing and artifact pages, read 1 Nov 2026). A dump job of a few minutes a night is well inside that.
- A private repository, because the main repository is public.
- Encryption with `age` to one public key, so a leak of the artifact or the repository shows nothing.

## What it does not cover (say these out loud)
- **Storage files** (photos) are not in a database dump. Recording backup is off in build 2, so audio is not on the server. If photos are on, their files have no copy.
- **Restoring needs the founder's key.** The job proves the dump is readable before it encrypts it; a full restore is the monthly drill below, run from the founder's Mac.
- **Up to 24 hours of changes** can be lost. Letters are also on the phones, and the restore epoch makes phones re-upload (DATA-REQ-030).
- **GitHub holds an encrypted copy of family data.** Before anyone outside the family signs in, `docs/legal/subprocessors.md` and Privacy 6 name it (founder merge), or the path moves.

## Founder steps (about 20 minutes, once)
1. On the Mac: `brew install age`, then `age-keygen -o ~/.config/earlyletters/backup-key.txt`. Keep that file and a paper copy with the escrow papers. Copy the line that starts with `age1...`: that is the public key.
2. On GitHub: create a **private** repository `earlyletters-backups` (no README needed).
3. In Supabase staging, SQL Editor, as `postgres`: create a read-only role for backups. The exact SQL is in the backup PR (BL-566); it gives the role `pg_read_all_data` and nothing else. Whether Supabase allows that predefined role is unverified until it runs; if it refuses, the PR falls back to schema-by-schema `select` grants.
4. In the new repository, Settings > Secrets and variables > Actions, add `STAGING_DB_URL` (the session pooler connection string for the backup role) and `BACKUP_AGE_RECIPIENT` (the `age1...` line).
5. Run the workflow once by hand (Actions > Nightly staging backup > Run workflow) and check one artifact appears.

## The workflow (goes in the private repository, built in the BL-566 PR)
```yaml
name: Nightly staging backup
on:
  schedule: [{ cron: '17 10 * * *' }]   # 3:17 AM PT
  workflow_dispatch: {}
permissions: { contents: read }
jobs:
  backup:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - name: Dump, check, encrypt
        env:
          DB_URL: ${{ secrets.STAGING_DB_URL }}
          RECIPIENT: ${{ secrets.BACKUP_AGE_RECIPIENT }}
        run: |
          set -euo pipefail
          sudo apt-get update -qq && sudo apt-get install -y -qq age postgresql-client-17
          stamp=$(date -u +%Y%m%dT%H%MZ)
          pg_dump --format=custom --no-owner --no-privileges "$DB_URL" -f dump.pgc
          pg_restore --list dump.pgc > /dev/null          # proves the dump is readable
          age -r "$RECIPIENT" -o "staging-$stamp.pgc.age" dump.pgc
          shred -u dump.pgc
          ls -l "staging-$stamp.pgc.age"
      - uses: actions/upload-artifact@<pinned sha>   # pin to a commit sha (CTO skill section 9)
        with:
          name: staging-backup
          path: staging-*.pgc.age
          retention-days: 7
```
The Postgres client version must match the server's major version (read it with `select version()` before the first run). The job's logs show sizes and exit codes only, never data.

## Monthly restore drill (founder's Mac, about 15 minutes)
1. Download the newest artifact from the private repository.
2. `age -d -i ~/.config/earlyletters/backup-key.txt -o dump.pgc staging-*.pgc.age`
3. Restore into a throwaway local Postgres (Docker) or a synthetic Supabase project, never into staging: `pg_restore --no-owner -d "$THROWAWAY_URL" dump.pgc`.
4. Count rows in `entries`, `policy_acceptances` and `deletion_requests` and compare with staging; write the date, the counts and pass or fail in `docs/ops/runbooks/restore-drill.md`, without any content.
5. Delete the local files.

## Acceptance (BL-566)
- Given the private repository, when the Actions tab is read, then a successful run under 24 hours old exists and its artifact is encrypted (`file` reports age-encrypted data).
- Given a dump with a broken table, when the job runs, then `pg_restore --list` fails the job and no artifact is kept.
- Given the founder's key, when the monthly drill runs, then the restored counts match staging within the day's changes and the drill log records PASS.
