// The consent records against the service role, before and after 20261023010000 (review A
// re-check on #178, comment 6372368217). The row guards on policy_acceptances and
// subscription_consents let a DELETE through while app.retention_purge is on, which any session
// can set, and service_role bypasses RLS. Hosted Supabase grants service_role every table
// privilege, TRUNCATE included (with the old automatic grants; the grant below makes it so in
// either harness world), shows the gap with the earlier files, applies 20261023010000
// and the files after it, and shows it closed, with every definer writer still working.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';
import { readFileSync } from 'node:fs';

const all = process.argv.slice(2);
const mine = all.find((f) => f.endsWith('20261023010000_s02_purge_and_consent_guards.sql'));
if (!mine) throw new Error('20261023010000_s02_purge_and_consent_guards.sql is not in the migration list');
const name = (f) => f.split('/').pop();
const { db, check, as, sys, codeOf, done, publishPolicies, consent } = await createDb(all.filter((f) => name(f) < name(mine)));
const { A, B } = users;

await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
await sys(`grant all on public.policy_acceptances, public.subscription_consents to service_role`);   // as hosted Supabase does
for (const [u, ref] of [[A, 'a'], [B, 'b']]) {
  await sys(`insert into subscription_consents (profile_id, sub_ref, product_id, offer_type, terms_shown, shown_at)
    values ($1, $2, 'plus.annual', 'introductory', '1.0.0', now())`, [u, ref.repeat(64)]);
}
const counts = async () => (await sys(`select (select count(*) from policy_acceptances)::int p, (select count(*) from subscription_consents)::int s`)).rows[0];
const start = await counts();

// As the service key would: one statement, in a transaction rolled back (so the records stay for the next probe).
const asService = async (sql, purge = false) => {
  await db.exec('begin');
  try {
    await db.exec('set local role service_role');
    if (purge) await db.query(`select set_config('app.retention_purge', 'on', true)`);
    const r = await db.query(sql);
    return /^\s*(delete|update|insert)/i.test(sql) ? `rows:${r.affectedRows}` : 'ok';
  } catch (e) {
    return e.code ?? 'error';
  } finally {
    await db.exec('rollback');
  }
};

// ── Before: the gap ──────────────────────────────────────────────────────
check('before: without the setting, the row guards refuse the service role\'s delete',
  (await asService('delete from policy_acceptances')) === 'P0001' && (await asService('delete from subscription_consents')) === 'P0001');
check(`before: with app.retention_purge on, the service role deletes every acceptance (${start.p} rows)`,
  (await asService('delete from policy_acceptances', true)) === `rows:${start.p}`);
check('before: with app.retention_purge on, the service role deletes every purchase consent record',
  (await asService('delete from subscription_consents', true)) === `rows:${start.s}`);
check('before: policy_acceptances has no TRUNCATE guard, and the service role may truncate it',
  (await asService('truncate policy_acceptances')) === 'ok');
check('before: the service role may write a consent act directly', (await asService(`insert into policy_acceptances
  (profile_id, document, version, action, method, surface, app_version, platform) values ('${A}', 'terms', '1.0.0', 'decline', 'support_assisted', 'x', '1', 'ios')`)) === 'rows:1');

// ── Apply 20261023010000 and every file after it ─────────────────────────
for (const f of all.filter((f) => name(f) >= name(mine))) await db.exec(readFileSync(f, 'utf8'));

// ── After: closed ────────────────────────────────────────────────────────
for (const t of ['policy_acceptances', 'subscription_consents']) {
  // 20261023060000: no path reads a table with the service key, so it reads neither (both worlds).
  check(`after: the service role does not read ${t} either (42501)`, (await asService(`select 1 from ${t}`)) === '42501');
  check(`after: the service role cannot delete from ${t}, also with app.retention_purge on (42501)`,
    (await asService(`delete from ${t}`, true)) === '42501' && (await asService(`delete from ${t}`)) === '42501');
  check(`after: nor update or truncate ${t} (42501)`,
    (await asService(`update ${t} set profile_id = null`)) === '42501' && (await asService(`truncate ${t}`)) === '42501');
}
check('after: nor write a consent act or a purchase consent record directly (42501)',
  (await asService(`insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform)
    values ('${A}', 'terms', '1.0.0', 'decline', 'support_assisted', 'x', '1', 'ios')`)) === '42501'
  && (await asService(`insert into subscription_consents (profile_id, sub_ref, product_id, offer_type, terms_shown, shown_at)
    values ('${A}', '${'c'.repeat(64)}', 'plus.annual', 'none', '1.0.0', now())`)) === '42501');
check('every record is still there', JSON.stringify(await counts()) === JSON.stringify(start));

// The definer writers still work: a person's own act, the pseudonymisation at account deletion,
// and both retention purges, which the service role runs.
await as(A, `select public.record_policy_act('privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'auth.sheet', '1', 'ios')`);
check('after: record_policy_act still records a person\'s own act', (await counts()).p === start.p + 1);
await sys(`delete from auth.users where id = $1`, [B]);
const pseud = (await sys(`select (select count(*) from policy_acceptances where profile_id is null and pseudonymised_at is not null)::int p,
  (select count(*) from subscription_consents where profile_id is null and pseudonymised_at is not null)::int s`)).rows[0];
check('after: deleting an account still pseudonymises both kinds of record', pseud.p > 0 && pseud.s === 1);
await db.exec('set role service_role');
let purged;
try {
  purged = {
    s: (await db.query(`select public.subscription_retention_purge(now() + interval '4 years') n`)).rows[0].n,
    p: (await db.query(`select public.purge_due(now() + interval '4 years') r`)).rows[0].r,
  };
} finally {
  await db.exec('reset role');
}
check('after: the service role\'s subscription_retention_purge still deletes records 3 years after pseudonymisation', purged.s === 1);
check('after: the service role\'s purge_due still deletes pseudonymised acceptances after 3 years',
  (await sys(`select count(*)::int n from policy_acceptances where profile_id is null`)).rows[0].n === 0
  && (await sys(`select count(*)::int n from policy_acceptances where profile_id = $1`, [A])).rows[0].n > 0);
check('after: and the row guard is shut again once they return (even the owner\'s plain delete is refused, P0001)',
  (await codeOf(() => sys('delete from policy_acceptances'))) === 'P0001' && (await codeOf(() => sys('delete from subscription_consents'))) === 'P0001');

done();
