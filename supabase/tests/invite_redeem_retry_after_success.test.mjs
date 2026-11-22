// BL-525 (20261122300000): a retry after success answers the same success, never `limited`, and is not counted.
// Reached limits: person, device, address and service. Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, publishPolicies, consent, newChild, done } = h;
const { A, S } = users;
const V = '99999999-9999-9999-9999-999999999999';
for (const u of [A, S, V]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, S, V]) await consent(u);

const svc = async (sql, params) => { await db.exec('set role service_role'); try { return await db.query(sql, params); } finally { await db.exec('reset role'); } };
const hashOf = async (code) => (await sys(`select sha256(convert_to($1, 'UTF8')) h`, [code])).rows[0].h;
let seq = 0;
const subj = (p) => `${p}-${++seq}`;
const redeem = async (user, mode, hash, { u = [subj('u')], d = [subj('d')], ip = [subj('ip')] } = {}) =>
  (await svc(`select public.invite_redeem_by_code($1, $2, $3, $4, $5, $6) r`, [user, mode, hash, u, d, ip])).rows[0].r;
const total = async () => (await sys(`select count(*)::int n from invite_redeem_failures`)).rows[0].n;
const unknown = await hashOf('NOSUCH99');

const BK = await newChild(A, 'Asha', '2025-04-12');
await as(A, `select public.create_child_invite($1::uuid, $2::uuid, 'parent', sha256(convert_to($3, 'UTF8')), sha256(convert_to($4, 'UTF8')), null)`,
  [uuid7(), BK, ('ASHA2345' + 'x'.repeat(64)).slice(0, 64), 'ASHA2345']);
const good = await hashOf('ASHA2345');

const first = await redeem(V, 'accept', good);
check('[BL-525] the first accept joins', first.outcome === 'accepted' && first.child_id === BK && first.role === 'parent');

// One scenario per limit: fill it, then retry with those same subjects.
const scenarios = [
  ['person', (s) => ({ u: [s], d: [subj('d')], ip: [subj('ip')] }), 10, 'user'],
  ['device', (s) => ({ u: [subj('u')], d: [s], ip: [subj('ip')] }), 10, 'device'],
  ['address', (s) => ({ u: [subj('u')], d: [subj('d')], ip: [s] }), 30, 'ip'],
];
for (const [name, mk, n, scope] of scenarios) {
  const s = `full-${name}`;
  for (let i = 0; i < n; i++) await redeem(S, 'peek', unknown, mk(s));
  const wrong = await redeem(S, 'peek', unknown, mk(s));
  check(`setup: the ${name} limit is reached (a wrong code is limited/${scope})`, wrong.outcome === 'limited' && wrong.scope === scope);
  const t = await total();
  const retry = await redeem(V, 'accept', good, mk(s));
  check(`[BL-525] at the ${name} limit a retry after success returns the same success, not limited`,
    retry.outcome === 'accepted' && retry.child_id === BK && retry.role === 'parent');
  check(`[BL-525] the ${name} retry counts nothing`, (await total()) === t);
}

// Service-wide brake.
await sys(`delete from invite_redeem_failures`);
await sys(`insert into invite_redeem_failures (scope, subject) select 'global', '' from generate_series(1, 1000)`);
check('setup: the service-wide brake is on', (await redeem(S, 'peek', unknown)).outcome === 'limited');
const rg = await redeem(V, 'accept', good);
check('[BL-525] at the service-wide brake a retry after success returns the same success', rg.outcome === 'accepted' && rg.child_id === BK);
check('the service-wide retry counts nothing', (await total()) === 1000);

// The shortcut is only for the person who joined, and only while they are a member.
check('someone who did not join with this code is still limited at the brake (no free guessing)',
  (await redeem(S, 'accept', good)).outcome === 'limited');
await sys(`delete from child_members where child_id = $1 and profile_id = $2`, [BK, V]);
check('a person who has left the book gets limited at the brake, not a stale success', (await redeem(V, 'accept', good)).outcome === 'limited');

// Unchanged below the limit: the old idempotent retry and a wrong code still behave.
await sys(`delete from invite_redeem_failures`);
await sys(`insert into child_members (child_id, profile_id, role) values ($1, $2, 'parent')`, [BK, V]);
const t2 = await total();
check('below any limit the retry is the same success and counts nothing', (await redeem(V, 'accept', good)).outcome === 'accepted' && (await total()) === t2);
check('a wrong code is still unusable and counted', (await redeem(V, 'accept', unknown)).outcome === 'unusable' && (await total()) === t2 + 4);

await done();
