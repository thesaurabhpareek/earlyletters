# Runbook: production on the Supabase Free plan (keep-alive, nightly backup, limits)

The founder decided on 8 Nov 2026 that `scribe-prod` runs on the Supabase **Free** plan, and asked for a "lightweight setup ... nightly backup, nightly 1 call to keep supabase active". This runbook is that setup. Owner: `ops`. The founder does the account steps; agents never touch hosted projects, secrets or the private repository. Nothing here has run yet.

## What the Free plan gives (read 8 Nov 2026)

| Fact | Source |
|---|---|
| 500 MB database per project; 1 GB file storage; 5 GB egress; 50,000 monthly active users; 2 active projects; logs kept 1 day; no automatic backups; no uptime SLA | https://supabase.com/pricing |
| Pausing: "Supabase pauses Free Plan projects that show low activity over a 7-day period"; inactive means it "does not receive sufficient user database activity over the past week"; activity can be made "by making API calls to your project"; "Typically a few user requests to the database each day over the previous week is enough"; a warning email "roughly one week before the pause takes effect"; resume from the dashboard; a paused project can be restored "for up to 1 year" | https://supabase.com/docs/guides/platform/free-project-pausing |
| "You are granted two free projects."; "Paused projects do not count towards your free project limit." | https://supabase.com/docs/guides/platform/billing-on-supabase |
| GitHub Free: US $12 of Actions compute a month for private repositories, 500 MB of artifact storage | docs.github.com "GitHub Actions billing", read 8 Nov 2026 (`staging-backup-free.md`) |

| Over a quota: "If you continue to exceed the limits, service restrictions will apply."; "When your organization exceeds plan limits, you receive a grace period before fair use policy applies" (the length is not stated); restrictions can include "pausing projects, switching databases to read-only, ... or returning a 402 status code for all API requests"; they lift when the quota refills at the start of the next billing cycle, or at once on Pro | https://supabase.com/docs/guides/platform/billing-faq |
| Database size: "the size of all databases in your Postgres cluster"; "The database size quota is a billing quota for your organization."; "When disk usage reaches 95%, Supabase puts your database into read-only mode" (Free plan) | https://supabase.com/docs/guides/platform/database-size |
| Monthly active users: "the number of distinct users who sign in or refresh their token during the billing cycle" | https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users |

UNVERIFIED: whether one automated read a day counts as "sufficient" activity (the page says "a few user requests ... each day"); the length of the grace period; the Free plan's disk size (the page read does not state it); how the 500 MB quota combines across projects in one organisation (billing-on-supabase says "500 MB per project", database-size says it is "a billing quota for your organization"; with other projects in the organisation, read Organization > Usage).

## The three jobs (all in the private repository `earlyletters-backups`)

| Workflow (copy from `docs/ops/proposed/workflows/`) | When | What | Alert |
|---|---|---|---|
| `supabase-keepalive.yml` | daily 15:41 UTC | one anonymous Data API read that reaches Postgres (`scripts/ops/keepalive.ts`) | `ops-alert` issue "Production keep-alive failed" |
| `supabase-backup.yml` | daily 10:17 UTC | BL-566's encrypted `pg_dump`, kept 7 days (#622; `staging-backup-free.md` explains the role, what is and is not in the dump, and the drill) | `ops-alert` issue "Nightly Supabase backup failed" |
| `supabase-free-limits.yml` | Mondays 16:23 UTC | database size (all databases) and account count (an upper bound of MAU) against the limits (`scripts/ops/free-limits.ts`); Storage and egress print NOT CHECKED | `ops-alert` issue at 80% of either number, or when a number cannot be read |

Why the private repository and not `earlyletters`: the main repository is public, so its artifacts, run logs and issues are public. An outage or a usage number is not something to publish, and a backup artifact must never sit in a public repository, even encrypted.

Alerts are free: each job opens one issue (or comments on the open one) with `GITHUB_TOKEN`. GitHub emails the repository owner about new issues, and emails the person who last edited a workflow's `cron` line about a failed scheduled run. Check the Actions tab once a week anyway: GitHub can delay or drop scheduled runs at busy times.

## The one database credential, and who shares it

`BACKUP_DB_URL` is the session-pooler URL of the role `scribe_backup` (`docs/ops/backup/backup-role.sql`) on production. **Two workflows share it:** the nightly backup and the weekly limits check. Anyone who holds it can read every family's letters, names, consent records and deletion ledger, and the consent pepper (a database setting that no grant can hide). With the narrowed role of the BL-566 review (#622) it cannot read sessions, refresh tokens, the one-time-token table, other Auth tables or the Vault. **It is still not proven safe against sign-in:** `auth.users` has one-time-token columns, and it is UNVERIFIED (8 Nov 2026) whether hosted Supabase still fills them and how it hashes a code; a review notes that GoTrue hashes a code as SHA-224 of the email plus the code, with 6 digits by default, so an unexpired hash could be brute-forced offline. Do not call this URL a way that cannot sign anyone in. **Treat it as sensitive as the database itself.** Run the one-time token-column check in `backup-role.sql` block 3 as `postgres` before relying on any of this (counts only). Before #622's narrowing is merged, the role was `pg_read_all_data` and this sentence was not true, so do not run these workflows on production until #622 is merged and `backup-role.sql` blocks 2 and 3 have been run.

| | |
|---|---|
| Owner | founder |
| Store | the private repository's Actions secret `BACKUP_DB_URL`, and the password manager (the password only) |
| Rotation | every 180 days. The founder writes the day the password was set and the due day (set day plus 180) in `docs/security/SECRETS_REVIEW.md` section 11, as dates. Rotate at once on suspicion, and at once if the password was typed into the SQL Editor (its history keeps it) |
| How | `psql "<session pooler URL as postgres>" -c '\password scribe_backup'`, then update the secret and run the backup workflow once |
| Stop it now | `alter role scribe_backup nologin;` |

## Founder steps (once, about 40 minutes)

1. **Key and repository** (BL-566 founder steps 1 and 2, `staging-backup-free.md`): `brew install age`, `age-keygen -o ~/.config/earlyletters/backup-key.txt`, keep a paper copy; create the private repository `earlyletters-backups`.
2. **The read-only role on production:** in scribe-prod's SQL Editor, run `docs/ops/backup/backup-role.sql` one block at a time and compare each answer (BL-566 founder step 3); block 3 must show `false` for every sign-in table. Give it a password (block 4; prefer `\password` from psql, so the password is never in a query or in the editor's history). The founder types the password into the password manager only. Write the set date and the due date (180 days later) in `SECRETS_REVIEW.md` section 11.
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
5. **First runs:** Actions > each workflow > Run workflow, in this order: Supabase keep-alive (expect green and a last line "PASS: one database read made"), Nightly Supabase backup (expect green, a summary "Backup of prod" with the row counts of the required tables, and one artifact `prod-<time>.pgc.age`), Supabase Free plan limits (expect green and a summary with two numbers, one INFO line and "NOT CHECKED" for storage and egress). Then do the first restore drill below the same day. A red run opens an `ops-alert` issue: that is the alert path working, so read it, fix the cause, re-run.

## Monthly restore drill (founder's Mac, about 25 minutes)

BL-566's drill (`staging-backup-free.md`, "Monthly restore drill"), with `prod-*.pgc.age` in place of `staging-*.pgc.age`. It decrypts the newest artifact, makes the dump's own manifest (`scripts/ops/dump-manifest.ts`), restores into a throwaway Postgres 17 container on the Mac only, and runs `scripts/ops/restore-check.ts --manifest manifest.txt`, which compares EVERY table and the policy count and must print PASS. Write the date, the number of tables and PASS or FAIL in `docs/ops/runbooks/restore-drill.md`, without any content, and delete the decrypted copy the same day (step 8 of that drill). Never restore into scribe-prod.

## A real restore (production lost or damaged)

Not rehearsed on a hosted project; every step below is UNVERIFIED there. Read `restore-drill.md` Part 2 first: it is the full procedure when Storage survives. This section is what changes on the Free plan.

**The limit, stated plainly.** The nightly dump holds the database only. The purge worker copies the purge ledger out of the database every day into the Storage bucket `ops-ledger` (`supabase/functions/purge-worker/daily.ts`) so that a restore can re-delete everything purged after the restore point (`restore-drill.md` line 7 and Part 2 step 3). Storage is not in the dump and is not backed up on Free. So:

- **If the project still exists** (the data is wrong, but Storage is intact): before anything else, download `ops-ledger/purges/*.jsonl` and `ops-ledger/escrow/*.jsonl` from the old project (dashboard > Storage). Restore as below, upload those files into the same bucket names of the new project, and run the replay in `restore-drill.md` Part 2 step 3 (`scripts/ops/restore-drill.ts --mode restore`) before anyone reconnects. Deletions are then complete.
- **If the project is gone** (deleted, or lost with its Storage): the ledger files are gone too. The restored database knows every deletion up to the dump's time and none after it. Up to 24 hours of deletions can come back. The same loss applies to the recovery-key access log files (`ops-ledger/escrow`), which are a security record: say so in the incident write-up.

What the founder does in the second case, in this order, before sign-ups are reopened:
1. Note the dump time (the artifact name). Only deletions after that time are at risk.
2. Find the account deletions made since then: the deletion receipt emails in the Resend dashboard (how long Resend keeps them is UNVERIFIED), the support inbox for deletion requests, and anything a person reports.
3. Delete each of those people again with the manual account step (`docs/ops/runbooks/stuck-deletion.md` section 3), and check with `scripts/ops/verify-deletion.ts`.
4. Letters, books or recordings that a person deleted inside the window, without deleting the account, cannot be found from any record. They will reappear after the restore, on the phones too. Anyone who reports one gets it deleted again through support. Do not tell families that deleted items stay deleted after a restore of this kind.
5. The privacy text must not promise that a deletion survives a disaster restore on the Free plan. Proposed wording is in the PR that added this runbook, for the founder and the privacy lane (this runbook does not edit `docs/legal`).

Steps:
1. Stop writes first: Authentication > "Allow new users to sign up" off, and pause the damaged project if data may be wrong or exposed (`docs/ops/runbooks/suspected-data-leak.md`).
2. A free project slot is needed for the new project. With two slots, one must be free or freed (see "Project slots"). Create the new project in the same region.
3. Apply the migrations to it through the production path in `docs/ops/DEPLOY.md`: set `SUPABASE_DB_URL_PROD` to the new project's pooler URL (the founder types it) and create the next `db-v*` tag on `main`, so schema, grants and Supabase's own schemas come from the migrations. D-041 says migrations are applied only from CI on a release tag. A `supabase db push` from the Mac is NOT part of this runbook: if the workflow cannot be used, write a D-### entry that names the exemption before using it.
4. Load the data from the newest decrypted dump with `pg_restore --data-only` into the migrated schema, tables only (`--schema=public --schema=ops --schema=insights --schema=sync_private`, plus `--table=auth.users --table=auth.identities`). Loading in dependency order is what `pg_restore` does by default. Triggers are the open question (UNVERIFIED, rehearse on a scratch project first): a data load into a schema that has its insert triggers can collide (for example the trigger that creates a profile when an Auth user is created), and switching triggers off for the load needs more than `postgres` may have on Supabase. **If triggers are switched off for the load, the guard `entries_not_purged` is off for it, so run this check before anything else and do not continue unless every query returns no row and 0:**
   ```sql
   -- anything the purge ledger says is gone, but is present
   select l.entity_type, count(*) from public.purge_ledger l
    where (l.entity_type = 'entry'   and exists (select 1 from public.entries  e where e.id::text = l.entity_id))
       or (l.entity_type = 'child'   and exists (select 1 from public.children c where c.id::text = l.entity_id))
       or (l.entity_type = 'profile' and exists (select 1 from public.profiles p where p.id::text = l.entity_id))
    group by 1;
   -- erased letters that are present again
   select count(*) from sync_private.entry_erasures x
    where exists (select 1 from public.entries e where e.id = x.entry_id and e.author_id = x.author_id);
   select count(*) from public.held_drafts_gone g
    where g.gone = 'erased' and exists (select 1 from public.entries e where e.id = g.id and e.author_id = g.author_id);
   ```
   (These queries were run on a local PostgreSQL 16 with this repository's migrations, 8 Nov 2026, and returned no row and 0 on a clean copy.) A row means a letter or book that must not exist is present: stop, and use the ledger replay (`restore-drill.md` Part 2 step 3) if the ledger files exist, or delete those ids through the account and letter erase paths before going on.
5. Set the database settings again from the list kept under "What it does not cover" in `staging-backup-free.md` (the consent pepper first, from the password manager; `supabase/APPLY.md` step 6), schedule the cron jobs (steps 7 and 15, `supabase/cron/purge-worker.sql`), redeploy the functions and set their secrets (bring-up runbook phase C).
6. Run `select public.sync_begin_epoch('database_restore', '<dump time ISO>');` so phones re-upload what the dump lacks (`supabase/APPLY.md` step 15). Everyone signs in again: sessions are not in the dump. Phones will also pull back anything deleted inside the window (see above).
7. Point the app at it: a new project has a new URL and publishable key, which are inlined in the build. That means a new app build and an App Store review before installed copies can reach it. This is the slowest step and the reason a restore into the same project (if Supabase support can do it) is worth asking for first.
8. Run the production smoke and the keep-alive against the new project; update the secrets `BACKUP_DB_URL`, `PROD_SUPABASE_URL`, `PROD_SUPABASE_PUBLISHABLE_KEY` and the variable `PROD_PROJECT_REF`.

## Free limits: what uses them

| Limit | What fills it in build 12 | Watch |
|---|---|---|
| Database 500 MB | letters' text, edits, sync receipts (trimmed hourly by `scribe-sync-housekeeping`), consent and audit rows. A few hundred families' text is small. The weekly job sums every database in the cluster, as Supabase measures it; the Free quota may be shared with other projects in the organisation (UNVERIFIED), so also read Organization > Usage | weekly job |
| File storage 1 GB | **Small today, not zero.** The purge worker writes one small file a day to `ops-ledger/purges` (ids and times only), and recovery-key access logs to `ops-ledger/escrow`, kept 60 days (`supabase/functions/purge-worker/daily.ts`). Recording backup (`entry-audio`, `docs/ops/BACKUP_RUNBOOK.md`) is off in every profile (`EXPO_PUBLIC_BACKUP=off`); photos have a bucket (`entry-photos`) but no app code on `develop`. Export ZIPs are made and deleted on the phone (`apps/mobile/src/lib/export/device.ts`) and never reach Supabase Storage. **Turning recording backup on would fill 1 GB quickly, and Storage objects are not in the nightly dump.** Do not turn it on while production is on Free. The weekly job cannot read Storage (its role is narrow on purpose) | dashboard, Organization > Usage, weekly |
| Egress 5 GB | sync pulls of text; speech models come from Hugging Face and packs from `packs.earlyletters.app`, not Supabase | dashboard, Organization > Usage, weekly |
| 50,000 MAU | far above the expected few hundred. Supabase counts users who sign in or refresh a token; the weekly job prints the account total (an upper bound) and the 30-day sign-ins (a lower bound) | weekly job |
| Logs 1 day | an incident found a day late has no Supabase logs | read logs the same day as any alert |
| Artifacts 500 MB (GitHub) | 7 nightly encrypted dumps | the backup job warns above 60 MB per file (7 x 60 MB = 420 MB of the 500 MB) |
| Over a quota | after a grace period of unstated length, restrictions apply: possibly read-only databases, paused projects or HTTP 402 on every API request (billing-faq, above). For a public app that is an outage | alert at 80% |

## Project slots

Free allows two active projects, and paused projects do not count. Plan:
- Slot 1: `scribe-prod`.
- Slot 2: kept free on purpose, for a scratch project (the migration rehearsal before the first `db-v*` tag, the planted-failure smoke) and for a real restore. Delete the scratch project when done.
- Staging: skipped for now (founder, 8 Nov). When it is wanted, it takes slot 2, and a restore then needs one of them paused first.
- The old `early-letters` project (ref `fpkxggtzwoumdghwzlsl`, `docs/ops/DEPLOY.md` line 38) and any other free project on the same Supabase account use slots too, unless paused. Whether the two-project limit is per account or per organisation is UNVERIFIED: check Organization > Billing before creating `scribe-prod`.
