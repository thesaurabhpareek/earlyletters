# Runbook: restore drill (quarterly) and a real restore

DATA-REQ-030, DATA-REQ-031, TDD 06 6.1 to 6.4. Targets: RPO 24 hours or less (daily backups, PITR off), RTO 4 hours or less.

Two facts shape everything (Verified in DELETION spec [D1]):
- Supabase Storage files are **not** in database backups, and deleted files are not restored. A restore brings back database rows (including `storage.objects` metadata) but not files.
- `purge_ledger` lives in the database, so a restore rolls it back. The daily `ops-ledger/purges/YYYY-MM-DD.jsonl` files (written by the worker's daily task) survive, and replaying them re-deletes everything purged after the restore point. Without replay, deleted letters and accounts come back: a broken promise.

## Part 1. Quarterly drill (about an hour, mostly waiting)

1. **Restore into a scratch project, never production.** Dashboard > Database > Backups: pick the newest daily backup and restore it to a new project if the dashboard offers it (Unverified: the "restore to a new project" option and its plan requirements; otherwise download the backup and `psql` it into a fresh project). Note the backup's time (the restore point) and the time you started.
2. Apply nothing else to the scratch project. Do not point any app at it. Do not schedule its cron jobs (`select cron.unschedule(jobname) from cron.job;` on the scratch copy if they came with the backup).
3. Run the drill (reads production, writes only to the scratch copy; one audit row in each):
   ```bash
   SUPABASE_URL=https://<scratch>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<scratch key> \
   PROD_SUPABASE_URL=https://<prod>.supabase.co PROD_SERVICE_ROLE_KEY=<prod key> OPS_OPERATOR=<you> \
   node scripts/ops/restore-drill.ts --mode drill --project-ref <scratch> --prod-ref <prod> \
     --ticket DRILL-<YYYY>Q<n> --restore-point <backup time ISO> --started-at <start ISO> --replay \
     --out ~/ops/drill-<YYYY>Q<n>.json
   ```
4. What it checks: schema health on the copy (RLS everywhere, classification, nothing callable by `anon`, `ops` hidden), the ledger since the restore point (files plus production's live ledger), replay of it onto the copy, row counts against production, a sample of `raw_sha256` letter hashes against production (letters purged since are expected to be missing; anything else is a finding), RTO and backup age.
5. Read the verdict. `PASS` or a list of findings. Write a short entry in the drill log (below) with the JSON record's numbers.
6. Delete the scratch project the same day (it holds real families' data).

Drill log (append one line per drill):

| Date | Ticket | Restore point | RTO (min) | Backup age (h) | Ledger ids | Hash sample (match / differ / unexplained) | Verdict |
|---|---|---|---|---|---|---|---|

## Part 2. A real restore (corruption, bad migration, operator error)

Prefer fixing forward. Restore only when the data itself is wrong and cannot be repaired.

1. **Stop writes and purges:** pause the worker jobs and the hourly purge (purge-failing.md section 6); post the in-app status line if the platform supports it.
2. **Restore** in the dashboard (into the same project only if Supabase offers nothing else; a new project is safer because production stays inspectable). Note the restore point.
3. **Replay before anyone reconnects**, against the restored project:
   ```bash
   SUPABASE_URL=https://<restored>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... OPS_OPERATOR=<you> \
   node scripts/ops/restore-drill.ts --mode restore --project-ref <restored> --ticket INC-<n> \
     --restore-point <ISO> --started-at <ISO> --out ~/incident/INC-<n>-restore.json
   ```
   It reads the ledger files from the restored project's `ops-ledger` bucket, re-deletes the letters and books, clears restored Storage metadata of accounts that were deleted and deletes their Auth users again.
4. **Bump the sync epoch** so phones re-upload what the restore lost instead of losing it (20261003041500_sync_cursor_pull.sql):
   ```sql
   alter database postgres set app.sync_epoch = '<current + 1>';
   ```
5. Account requests that were mid-execution at the restore point are `executing` again; their Auth users are gone. Let the worker finish them; check with stuck-deletion.md section 1. Completion receipts may be sent a second time (Resend's idempotency lasts 24 hours); that is acceptable.
6. Re-enable the jobs; check purge-failing.md section 1; run `verify-deletion.ts` for one or two accounts from the ledger.
7. Known gap: `storage.objects` rows for photos deleted after the restore point come back as metadata without files. Their letters are re-deleted by the replay, so nothing can reach them; `ops_storage_residue` lists them for deleted people and the next account step cleans them.
8. Write it up in the incident folder; tell families only if something they can see changed (counsel if any deletion promise was missed).
