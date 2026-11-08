# Runbook: production on the Supabase Free plan (keep-alive, nightly backup, limits)

The founder decided on 8 Nov 2026 that `scribe-prod` runs on the Supabase **Free** plan, and asked for a "lightweight setup ... nightly backup, nightly 1 call to keep supabase active". This runbook is that setup. Owner: `ops`. The founder does the account steps; agents never touch hosted projects, secrets or the private repository. Nothing here has run yet.

## What the Free plan gives (read 8 Nov 2026)

| Fact | Source |
|---|---|
| 500 MB database per project; 1 GB file storage; 5 GB egress; 50,000 monthly active users; 2 active projects; logs kept 1 day; no automatic backups; no uptime SLA | https://supabase.com/pricing |
| Pausing: "Supabase pauses Free Plan projects that show low activity over a 7-day period"; inactive means it "does not receive sufficient user database activity over the past week"; activity can be made "by making API calls to your project"; "Typically a few user requests to the database each day over the previous week is enough"; a warning email "roughly one week before the pause takes effect"; resume from the dashboard; a paused project can be restored "for up to 1 year" | https://supabase.com/docs/guides/platform/free-project-pausing |
| "You are granted two free projects."; "Paused projects do not count towards your free project limit." | https://supabase.com/docs/guides/platform/billing-on-supabase |
| GitHub Free: US $12 of Actions compute a month for private repositories, 500 MB of artifact storage | docs.github.com "GitHub Actions billing", read 8 Nov 2026 (`staging-backup-free.md`) |

UNVERIFIED: whether one automated read a day counts as "sufficient" activity; what Supabase does when a Free project goes over a quota (the pricing page does not say); whether the MAU figure counts token refreshes as well as sign-ins.

## The three jobs (all in the private repository `earlyletters-backups`)

| Workflow (copy from `docs/ops/proposed/workflows/`) | When | What | Alert |
|---|---|---|---|
| `supabase-keepalive.yml` | daily 15:41 UTC | one anonymous Data API read that reaches Postgres (`scripts/ops/keepalive.ts`) | `ops-alert` issue "Production keep-alive failed" |
| `supabase-backup.yml` | daily 10:17 UTC | BL-566's encrypted `pg_dump`, kept 7 days (#622; `staging-backup-free.md` explains the role, what is and is not in the dump, and the drill) | `ops-alert` issue "Nightly Supabase backup failed" |
| `supabase-free-limits.yml` | Mondays 16:23 UTC | database size, Storage bytes, 30-day sign-ins against the limits (`scripts/ops/free-limits.ts`) | `ops-alert` issue at 80% of any limit, or when a number cannot be read |

Why the private repository and not `earlyletters`: the main repository is public, so its artifacts, run logs and issues are public. An outage or a usage number is not something to publish, and a backup artifact must never sit in a public repository, even encrypted.

Alerts are free: each job opens one issue (or comments on the open one) with `GITHUB_TOKEN`. GitHub emails the repository owner about new issues, and emails the person who last edited a workflow's `cron` line about a failed scheduled run. Check the Actions tab once a week anyway: GitHub can delay or drop scheduled runs at busy times.

## Founder steps (once, about 40 minutes)

1. **Key and repository** (BL-566 founder steps 1 and 2, `staging-backup-free.md`): `brew install age`, `age-keygen -o ~/.config/earlyletters/backup-key.txt`, keep a paper copy; create the private repository `earlyletters-backups`.
2. **The read-only role on production:** in scribe-prod's SQL Editor, run `docs/ops/backup/backup-role.sql` one block at a time and compare each answer (BL-566 founder step 3). Give it a password (block 4). The founder types the password into the password manager only.
3. **Secrets** in `earlyletters-backups`, Settings > Secrets and variables > Actions. The founder types every value:
   - Secret `BACKUP_DB_URL`: scribe-prod's session pooler string with user `scribe_backup.<prod ref>` and the role's password, `?sslmode=require`.
   - Secret `BACKUP_AGE_RECIPIENT`: the `age1` line.
   - Secret `PROD_SUPABASE_URL`: `https://<prod ref>.supabase.co`.
   - Secret `PROD_SUPABASE_PUBLISHABLE_KEY`: the publishable key the app ships. Never the secret or `service_role` key: the script refuses it.
   - Variable `PROD_PROJECT_REF`: the prod ref.
   - Variable `BACKUP_TARGET`: `prod`.
   - Variable `EARLYLETTERS_SHA`: the full commit of `thesaurabhpareek/earlyletters` on `develop` that contains `scripts/ops/keepalive.ts` and `scripts/ops/free-limits.ts` (the merge commit of this change). Moving it later is a deliberate step: the jobs run that commit's scripts with the database secret.
4. **Copy and commit the workflows** from a checkout of `earlyletters` at that commit:
   ```bash
   git clone git@github.com:thesaurabhpareek/earlyletters-backups.git && cd earlyletters-backups
   mkdir -p .github/workflows
   for f in supabase-keepalive supabase-backup supabase-free-limits; do
     cp ../earlyletters/docs/ops/proposed/workflows/$f.yml .github/workflows/$f.yml
   done
   git add .github/workflows && git commit -m "ops: keep-alive, nightly backup, weekly Free plan limits" && git push
   ```
   Commit to the default branch: scheduled runs start only from there. Committing it yourself also makes you the person GitHub emails about failed scheduled runs.
5. **First runs:** Actions > each workflow > Run workflow, in this order: Supabase keep-alive (expect green and a last line "PASS: one database read made"), Nightly Supabase backup (expect green, a summary "Backup of prod" with "Row counts in this dump", and one artifact `prod-<time>.pgc.age`), Supabase Free plan limits (expect green and a summary with three numbers and "NOT CHECKED egress"). Then do the first restore drill below the same day. A red run opens an `ops-alert` issue: that is the alert path working, so read it, fix the cause, re-run.

## Monthly restore drill (founder's Mac, about 20 minutes)

BL-566's drill (`staging-backup-free.md`, "Monthly restore drill"), with `prod-*.pgc.age` in place of `staging-*.pgc.age`. It decrypts the newest artifact, restores it into a throwaway Postgres 17 container on the Mac only, and runs `scripts/ops/restore-check.ts --expect <the run's row counts>`, which must print PASS. Write the date, N and PASS or FAIL in `docs/ops/runbooks/restore-drill.md`, without any content. Never restore into scribe-prod.

## A real restore (production lost or damaged)

Not rehearsed; every step below is UNVERIFIED on a hosted project.
1. Stop writes first: Authentication > "Allow new users to sign up" off, and pause the damaged project if data may be wrong or exposed (`docs/ops/runbooks/suspected-data-leak.md`).
2. A free project slot is needed for the new project. With two slots, one must be free or freed (see "Project slots"). Create the new project in the same region.
3. Apply the migrations to it through the `db-v*` path, or `supabase db push --db-url '<new pooler URL>'` from the Mac if the workflow cannot reach it, so schema, grants and Supabase's own schemas come from the migrations.
4. Restore data only: `pg_restore --data-only --disable-triggers` from the newest decrypted dump. The dump holds owners and grants for a full restore; with the schema from step 3, data-only avoids fighting Supabase's managed schemas. The `raw_transcript` immutability trigger and the consent triggers are why `--disable-triggers` is needed for a data load (UNVERIFIED; rehearse it on a scratch project).
5. Set the consent pepper again from the password manager (`supabase/APPLY.md` step 6), schedule the cron jobs (steps 7 and 15, `supabase/cron/purge-worker.sql`), redeploy the functions and set their secrets (bring-up runbook phase C).
6. Run `select public.sync_begin_epoch('database_restore', '<dump time ISO>');` so phones re-upload what the dump lacks (`supabase/APPLY.md` step 15). Everyone signs in again: sessions are not in the dump.
7. Point the app at it: a new project has a new URL and publishable key, which are inlined in the build. That means a new app build and an App Store review before installed copies can reach it. This is the slowest step and the reason a restore into the same project (if Supabase support can do it) is worth asking for first.
8. Run the production smoke and the keep-alive against the new project; update the three secrets and `PROD_PROJECT_REF`.

## Free limits: what uses them

| Limit | What fills it in build 12 | Watch |
|---|---|---|
| Database 500 MB | letters' text, edits, sync receipts (trimmed hourly by `scribe-sync-housekeeping`), consent and audit rows. A few hundred families' text is small; the weekly job reports the size | weekly job |
| File storage 1 GB | **nothing today.** Recording backup (`entry-audio` bucket, `docs/ops/BACKUP_RUNBOOK.md`) is off in every profile (`EXPO_PUBLIC_BACKUP=off`); photos have a bucket (`entry-photos`) but no app code on `develop`. Export ZIPs are made and deleted on the phone (`apps/mobile/src/lib/export/device.ts`) and never reach Supabase Storage. **Turning recording backup on would fill 1 GB quickly, and Storage objects are not in the nightly dump.** Do not turn it on while production is on Free | weekly job |
| Egress 5 GB | sync pulls of text; speech models come from Hugging Face and packs from `packs.earlyletters.app`, not Supabase | dashboard, Organization > Usage, weekly |
| 50,000 MAU | far above the expected few hundred | weekly job |
| Logs 1 day | an incident found a day late has no Supabase logs | read logs the same day as any alert |
| Artifacts 500 MB (GitHub) | 7 nightly encrypted dumps | the backup job warns above 60 MB per file |

## Project slots

Free allows two active projects, and paused projects do not count. Plan:
- Slot 1: `scribe-prod`.
- Slot 2: kept free on purpose, for a scratch project (the migration rehearsal before the first `db-v*` tag, the planted-failure smoke) and for a real restore. Delete the scratch project when done.
- Staging: skipped for now (founder, 8 Nov). When it is wanted, it takes slot 2, and a restore then needs one of them paused first.
- The old `early-letters` project (ref `fpkxggtzwoumdghwzlsl`, `docs/ops/DEPLOY.md` line 38) and any other free project on the same Supabase account use slots too, unless paused. Whether the two-project limit is per account or per organisation is UNVERIFIED: check Organization > Billing before creating `scribe-prod`.
