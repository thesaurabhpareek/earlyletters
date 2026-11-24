// BL-584 (DATA-03, CR-209): public.ops_cron_health(p_window_minutes) for the outside purge watch
// (20261124120000_ops_cron_health.sql). Counts failed scribe-* pg_cron runs and names the jobs, and nothing else.
// The embedded Postgres has no pg_cron, so the cron schema is stood in by two tables with the real column names.
// Fictional family "Asha" only (CLAUDE.md). Run: npm run test:db -- ops_cron_health
import { createDb, users } from './harness.mjs';

const { check, as, asAnon, sys, codeOf, done } = await createDb(process.argv.slice(2));
const { A, C } = users;
await sys(`insert into auth.users values ('${A}'),('${C}')`);
const call = async (w) => (await sys(`select public.ops_cron_health(${w === undefined ? '' : w}) r`)).rows[0].r;

// ── Access: service role only, own grant ─────────────────────────────────
const can = (await sys(`select has_function_privilege('anon', 'public.ops_cron_health(integer)', 'execute') a,
  has_function_privilege('authenticated', 'public.ops_cron_health(integer)', 'execute') u,
  has_function_privilege('service_role', 'public.ops_cron_health(integer)', 'execute') s,
  has_function_privilege('public', 'public.ops_cron_health(integer)', 'execute') p`)).rows[0];
check('only service_role may execute ops_cron_health (not anon, authenticated or PUBLIC)', !can.a && !can.u && !can.p && can.s);
check('a signed-in person is refused (42501)', (await codeOf(() => as(A, `select public.ops_cron_health(120)`))) === '42501');
check('an anonymous sign-in is refused (42501)', (await codeOf(() => as(C, `select public.ops_cron_health(120)`, [], { anonymous: true }))) === '42501');
check('the anon role is refused (42501)', (await codeOf(() => asAnon(`select public.ops_cron_health(120)`))) === '42501');
const def = (await sys(`select p.prosecdef, array_to_string(p.proconfig, ',') cfg from pg_proc p where p.oid = 'public.ops_cron_health(integer)'::regprocedure`)).rows[0];
check('security definer with search_path = pg_catalog, public, pg_temp', def.prosecdef && def.cfg === 'search_path=pg_catalog, public, pg_temp');

// ── No pg_cron: a failure the watch can see, never a quiet zero ───────────
const none = await call();
check('without pg_cron it answers failed_runs 1 and names no job', none.failed_runs === 1 && none.failed_jobs.length === 0 && none.window_minutes === 120);

// ── With the scheduler's own log ─────────────────────────────────────────
await sys(`create schema cron`);
await sys(`create table cron.job (jobid bigint primary key, jobname text, command text)`);
await sys(`create table cron.job_run_details (runid bigserial primary key, jobid bigint, status text, return_message text, start_time timestamptz)`);
await sys(`insert into cron.job values
  (1, 'scribe-purge-worker', 'select net.http_post(''https://example.invalid'', ''Asha secret text'')'),
  (2, 'scribe-purge-due', 'select public.purge_due()'),
  (3, 'other-vendor-job', 'select 1'),
  (4, 'scribe-Bad Name!', 'select 2')`);
const run = (job, status, minsAgo) => sys(`insert into cron.job_run_details (jobid, status, return_message, start_time)
  values ($1, $2, 'ERROR: relation "children" Asha', now() - make_interval(mins => $3))`, [job, status, minsAgo]);
check('a quiet log answers zero', (await call()).failed_runs === 0);
await run(1, 'failed', 10); await run(1, 'failed', 30); await run(2, 'succeeded', 5);
await run(3, 'failed', 5); await run(1, 'failed', 300);
let r = await call();
check('two failed scribe-* runs inside 120 minutes are counted; a success, another vendor job and an old run are not', r.failed_runs === 2);
check('the job is named once', JSON.stringify(r.failed_jobs) === '["scribe-purge-worker"]');
check('a window of 400 minutes also counts the old run', (await call(400)).failed_runs === 3);
check('a window of 5 minutes counts none (10 minutes ago is outside)', (await call(5)).failed_runs === 0);
check('a window of null, 0 and -5 fall back to the default or the floor, never an error',
  (await call('null')).window_minutes === 120 && (await call(0)).window_minutes === 1 && (await call(-5)).window_minutes === 1);
check('a window above a week is clamped to 10080', (await call(99999)).window_minutes === 10080);
await run(4, 'failed', 1);
r = await call();
check('a scribe-* name that is not a plain job name is counted but never printed', r.failed_runs === 3 && !JSON.stringify(r).includes('Bad'));
const text = JSON.stringify(r);
check('the answer holds no command text, return message or family detail',
  !/Asha|ERROR|net\.http_post|example\.invalid|purge_due\(\)|children/.test(text)
  && JSON.stringify(Object.keys(r).sort()) === '["failed_jobs","failed_runs","window_minutes"]');

await done();
