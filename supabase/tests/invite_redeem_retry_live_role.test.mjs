// BL-1844 (20261123000000): the retry shortcut keeps the live-book check, answers the member's current
// role, and still takes the subject locks before it answers. Fictional family "Asha" only (CLAUDE.md).
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
const invite = async (book, code) => as(A, `select public.create_child_invite($1::uuid, $2::uuid, 'parent', sha256(convert_to($3, 'UTF8')), sha256(convert_to($4, 'UTF8')), null)`,
  [uuid7(), book, (code + 'x'.repeat(64)).slice(0, 64), code]);

// 1. Current role: a role change after joining is answered as it is now, not as the invite said.
const BK = await newChild(A, 'Asha', '2025-04-12');
await invite(BK, 'ASHA2345');
const good = await hashOf('ASHA2345');
check('setup: the first accept joins as parent', (await redeem(V, 'accept', good)).role === 'parent');
await sys(`update child_members set role = 'contributor' where child_id = $1 and profile_id = $2`, [BK, V]);
const t0 = await total();
const rr = await redeem(V, 'accept', good);
check('[BL-1844] after a role change the retry answers the current role, not the invite role',
  rr.outcome === 'accepted' && rr.child_id === BK && rr.role === 'contributor');
check('[BL-1844] the role-change retry counts nothing', (await total()) === t0);
await sys(`update child_members set role = 'parent' where child_id = $1 and profile_id = $2`, [BK, V]);

// 2. Live book: once the book is gone the retry is not a success, at a limit or below one.
const s = 'full-person';
for (let i = 0; i < 10; i++) await redeem(S, 'peek', unknown, { u: [s] });
check('setup: the person limit is reached', (await redeem(S, 'peek', unknown, { u: [s] })).outcome === 'limited');
check('a live book still answers success at the limit (BL-525 kept)', (await redeem(V, 'accept', good, { u: [s] })).outcome === 'accepted');
await sys(`update children set deleted_at = now() where id = $1`, [BK]);
const gone = await redeem(V, 'accept', good, { u: [s] });
check('[BL-1844] a deleted book does not answer success at a limit (limited, nothing leaks)',
  gone.outcome === 'limited' && gone.child_id === undefined && gone.role === undefined);
const t1 = await total();
const gone2 = await redeem(V, 'accept', good);
check('[BL-1844] a deleted book does not answer success below a limit either: unusable and counted',
  gone2.outcome === 'unusable' && gone2.child_id === undefined && (await total()) === t1 + 4);
await sys(`update children set deleted_at = null where id = $1`, [BK]);
check('the restored book answers success again', (await redeem(V, 'accept', good)).outcome === 'accepted');

// 3. Order of the locks: the shortcut answers only after the subject locks are held (they release at
// commit). Read from the session's own advisory locks inside one transaction; the single embedded
// connection cannot run two callers at once, so a true concurrent claim is not shown here.
await db.exec('begin');
const sub = subj('lock');
await svc(`select public.invite_redeem_by_code($1, 'accept', $2, $3, $4, $5)`, [V, good, [sub], [subj('d')], [subj('ip')]]);
const locks = (await sys(`select count(*)::int n from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()`)).rows[0].n;
await db.exec('rollback');
check('[BL-1844] the shortcut path holds the subject locks (person, device, address) before it answers', locks === 3);

await done();
