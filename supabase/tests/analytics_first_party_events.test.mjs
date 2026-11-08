// First-party analytics events (20261108000000_analytics_first_party_events.sql).
// Proves: the table refuses content-shaped rows; only service_role writes and reads the table;
// insights_reader sees only k-anonymised views; forget and purge work; the daily cap holds.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb } from './harness.mjs';

const { check, sys, as, asAnon, codeOf, done } = await createDb(process.argv.slice(2));
const ID1 = '9a9a9a9a-0000-4000-8000-0000000000aa';
const asRole = async (role, sql) => {
  await sys(`set role ${role}`);
  try { return await sys(sql); } finally { await sys('reset role'); }
};
const ev = (event, props, ago = 0) => JSON.stringify({ event, props, ago_s: ago });

const n1 = (await sys(`select public.ingest_app_events('${ID1}', '[${ev('error_shown', { code: 'save_failed', schema_version: 1 }, 5)}]'::jsonb) n`)).rows[0].n;
check('a valid batch is stored', n1 === 1);
check('the row has the random id, the event and flat props', (await sys(`select count(*)::int c from insights_events.app_events where analytics_id = '${ID1}' and event = 'error_shown' and props->>'code' = 'save_failed'`)).rows[0].c === 1);

const nested = await codeOf(() => sys(`select public.ingest_app_events('${ID1}', '[${ev('error_shown', { code: { text: 'Asha' } })}]'::jsonb)`));
check('a nested property is refused by the table', nested === '23514');
const long = await codeOf(() => sys(`select public.ingest_app_events('${ID1}', '[${ev('error_shown', { code: 'She laughed at the dog today, and Asha ran after it all afternoon' })}]'::jsonb)`));
check('a string over 40 characters is refused by the table', long === '23514');
const badName = await codeOf(() => sys(`select public.ingest_app_events('${ID1}', '[${ev('Letter Text!', { a: 1 })}]'::jsonb)`));
check('an event name that is not snake_case is refused', badName === '23514');
const old = await codeOf(() => sys(`select public.ingest_app_events('${ID1}', '[${ev('error_shown', { code: 'x' }, 99999999)}]'::jsonb)`));
check('an age beyond 14 days is clamped, not stored as older', old === 'ok' && (await sys(`select count(*)::int c from insights_events.app_events where occurred_at < now() - interval '14 days 1 minute'`)).rows[0].c === 0);
check('an empty batch stores nothing', (await sys(`select public.ingest_app_events('${ID1}', '[]'::jsonb) n`)).rows[0].n === 0);

// Access
const parent = '00000000-0000-4000-a000-000000000001';
check('signed-in users cannot read the table', (await codeOf(() => as(parent, 'select * from insights_events.app_events'))) === '42501');
check('anon cannot read the table', (await codeOf(() => asAnon('select * from insights_events.app_events'))) === '42501');
check('signed-in users cannot ingest', (await codeOf(() => as(parent, `select public.ingest_app_events('${ID1}', '[]'::jsonb)`))) === '42501');
check('anon cannot ingest', (await codeOf(() => asAnon(`select public.ingest_app_events('${ID1}', '[]'::jsonb)`))) === '42501');
check('anon cannot forget', (await codeOf(() => asAnon(`select public.forget_app_events(array['${ID1}']::uuid[])`))) === '42501');
check('insights_reader cannot read the raw table', (await codeOf(() => asRole('insights_reader', 'select * from insights_events.app_events'))) === '42501');
check('insights_reader can read the views', (await codeOf(() => asRole('insights_reader', 'select * from insights_events.app_event_daily'))) === 'ok');
check('service_role can read the table', (await codeOf(() => asRole('service_role', 'select count(*) from insights_events.app_events'))) === 'ok');

// k-anonymity: one install shows nothing
check('a view cell below 10 installs is null', (await sys(`select count(*)::int c from insights_events.app_event_daily where events is not null`)).rows[0].c === 0);
for (let i = 0; i < 12; i++) {
  const id = `9a9a9a9a-0000-4000-8000-${String(100 + i).padStart(12, '0')}`;
  await sys(`select public.ingest_app_events('${id}', '[${ev('app_opened', { source: 'cold', days_since_last_open: 'd0', schema_version: 1 })}]'::jsonb)`);
}
check('a cell with 12 installs is published', (await sys(`select installs::int i from insights_events.app_event_daily where event = 'app_opened'`)).rows[0]?.i === 12);
check('the weekly active view publishes at 12', (await sys(`select installs::int i from insights_events.app_active_weekly`)).rows[0]?.i === 12);
check('the breakdown carries only property names and values, no ids', (await sys(`select count(*)::int c from insights_events.app_event_breakdown where prop in ('analytics_id', 'id')`)).rows[0].c === 0);

// Daily cap
await sys(`insert into insights_events.app_events (analytics_id, occurred_at, event, props)
           select '9a9a9a9a-0000-4000-8000-0000000009ff', now(), 'app_opened', '{}'::jsonb from generate_series(1, 5000)`);
check('over 5000 events a day for one id answers -1', (await sys(`select public.ingest_app_events('9a9a9a9a-0000-4000-8000-0000000009ff', '[${ev('error_shown', { code: 'x' })}]'::jsonb) n`)).rows[0].n === -1);

// Forget and purge
check('forget removes the rows of the ids given', (await sys(`select public.forget_app_events(array['${ID1}']::uuid[]) n`)).rows[0].n >= 1);
check('and leaves nothing for that id', (await sys(`select count(*)::int c from insights_events.app_events where analytics_id = '${ID1}'`)).rows[0].c === 0);
check('purge removes rows older than 365 days', (await sys(`select public.purge_app_events(now() + interval '366 days') n`)).rows[0].n > 0);
check('and the table is empty afterwards', (await sys(`select count(*)::int c from insights_events.app_events`)).rows[0].c === 0);
done();
