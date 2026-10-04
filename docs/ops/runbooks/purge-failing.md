# Runbook: purge or worker not running, or Storage deletes failing

Alerts that point here: `purge_silent`, `purge_failing`, `tombstones_overdue`, `queue_stuck`, `scheduled_overdue`.
If the worker itself is down, no alert can come from it. The daily habit that catches that: the founder's weekly glance at section 1, and the SLA counts in the next working alert.

## 1. Healthy looks like

```sql
select jobname, schedule, active from cron.job order by jobname;
-- scribe-purge-due '17 * * * *' (hourly SQL backstop), scribe-purge-worker '*/15 * * * *', scribe-purge-worker-daily '17 3 * * *'
select status, start_time from cron.job_run_details order by start_time desc limit 8;          -- 'succeeded'
select status_code, timed_out, created from net._http_response order by created desc limit 8;  -- 202, timed_out false
select max(at) from audit_events where action = 'purge_run';                                   -- within 20 minutes
select public.ops_deletion_sla();                                                               -- all counts 0
select count(*) filter (where done_at is null) as open, max(attempts) from storage_purge_queue;  -- small
```

## 2. Find the failure

| Symptom | Likely cause | Fix |
|---|---|---|
| No `scribe-purge-worker` job | Schedule never installed or removed | Section 5 |
| `net._http_response` 401 | `PURGE_WORKER_SECRET` and Vault `purge_worker_secret` differ | SECURITY.md 2.1, steps 2 and 3 with one value |
| 404 | Function not deployed, or the URL in Vault is wrong | `npx supabase functions deploy purge-worker --no-verify-jwt --use-api`; check Vault `project_url` has no trailing path |
| 500 with `config` in the logs | A required secret is missing | SECURITY.md 1.1 |
| 202 but `purge_run` is old | The run fails inside: open Edge Functions > purge-worker > Logs, find `purge_due.failed` | Its `sqlstate` names the database error; fix forward with a migration |
| `queue_stuck` | Storage deletes failing | Section 3 |
| `tombstones_overdue` with a fresh `purge_run` | Letters or books held, or `purge_due` returning `more` every time | `select public.purge_due();` by hand in a loop until `more` is false; check `legal_holds` |
| `scheduled_overdue` | Requests past their date still `scheduled`: `purge_due` is not running at all | Hourly job (APPLY.md step 7) and section 5 |

Logs carry no ids: correlate by `req_id` (the `x-request-id` the function returned) and by time.

## 3. Storage deletes failing

```sql
select bucket_id, last_error_code, count(*), max(attempts), min(enqueued_at)
  from storage_purge_queue where done_at is null group by 1, 2 order by 3 desc;
```
| `last_error_code` | Meaning |
|---|---|
| `http_5xx`, `timeout`, `network` | Storage trouble; retries back off to every 6 hours. Check status.supabase.com |
| `http_400` | A malformed name in the queue (should not happen); look at one row's `object_path`, fix the enqueuing function |
| `http_401`, `http_403` | The function's service key is wrong (rotated?). Redeploy so it picks up the injected value |
| `invalid_input` | Something enqueued the `ops-ledger` bucket; that is refused on purpose. Mark the row done after checking |

Retry everything now after a fix: `update storage_purge_queue set next_attempt_at = now() where done_at is null;` then start a run (stuck-deletion.md section 3).

## 4. Manual purge while the worker is down

Postgres keeps its promise through the hourly SQL job alone; Storage files wait in the queue (safe: they are already unreachable from the app because their rows are gone). To catch up by hand:
```sql
select public.purge_due();   -- repeat while the result says "more": true
```
Account deletions do not finish without the worker (Auth user deletion and Apple revocation need it). Fix the worker within the week; the 31-day promise has about a day of slack.

## 5. Install or reinstall the schedule

1. Deploy the function and set its secrets (README "Going live", steps 3 and 4).
2. Dashboard > Integrations: Cron and pg_net enabled.
3. SQL editor: run `supabase/cron/purge-worker.sql` with the three placeholders filled. If a Vault name already exists, use `vault.update_secret` instead (the file says how). If a job name exists, `select cron.unschedule('<name>');` first.
4. After 20 minutes, section 1 shows 202s and a fresh `purge_run`.

## 6. Pausing the worker on purpose (incident, migration)

```sql
update cron.job set active = false where jobname in ('scribe-purge-worker', 'scribe-purge-worker-daily');
-- later: set active = true
```
Pausing longer than a day eats into the 31-day promise; note it in the ticket.
