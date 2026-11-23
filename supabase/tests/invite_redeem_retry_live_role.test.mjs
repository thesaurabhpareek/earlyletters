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

// 4. Claims that share a subject (BL-1885). The embedded database has ONE connection, so two callers
// cannot be in flight at once here; the true two-connection check is a local-stack row (see the PR
// report). What this harness can show, and what a lost lock would break:
//   a. the locks held are exactly one per DISTINCT subject, keyed as the function keys them;
//   b. they are taken in sorted order (the only thing that keeps two callers from deadlocking), read
//      from the function body because pg_locks does not record acquisition order;
//   c. two claims from the same subject in one transaction re-enter the same locks (3, not 6) and the
//      second sees the first's join, so it is answered as a retry and counts nothing.
const lockKeys = async () => (await sys(`select objid::bigint k, classid::bigint c from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()`)).rows;
const BK2 = await newChild(A, 'Asha', '2025-04-12');
await invite(BK2, 'ASHA7777');
const good2 = await hashOf('ASHA7777');
const shared = subj('shared'), sharedIp = subj('ip');
await db.exec('begin');
const first = await redeem(S, 'accept', good2, { u: [shared], d: [shared], ip: [sharedIp] });
const held1 = (await lockKeys()).length;
const again = await redeem(S, 'accept', good2, { u: [shared], d: [shared], ip: [sharedIp] });
const held2 = (await lockKeys()).length;
const joined2 = (await sys(`select count(*)::int n from child_members where child_id = $1 and profile_id = $2`, [BK2, S])).rows[0].n;
await db.exec('rollback');
check('[BL-1885] a subject named as person and device is locked once (person+device share one, plus the address: 2 locks)', first.outcome === 'accepted' && held1 === 2);
check('[BL-1885] a second claim from the same subjects re-enters the same locks and answers as a retry',
  held2 === 2 && again.outcome === 'accepted' && again.child_id === BK2 && joined2 === 1);
await db.exec('begin');
const sa = 'zz-' + subj('a'), sb = 'aa-' + subj('b');
await redeem(V, 'accept', good, { u: [sa], d: [sb], ip: [] });
const want = (await sys(`select count(*)::int n from unnest(array[$1::text, $2::text]) s
  where exists (select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()
                  and ((classid::bigint << 32) | objid::bigint) = hashtextextended('invite_redeem:' || s, 0))`, [sa, sb])).rows[0].n;
await db.exec('rollback');
check('[BL-1885] the lock keys are hashtextextended(invite_redeem:<subject>), one per subject', want === 2);
const body = (await sys(`select pg_get_functiondef('public.invite_redeem_by_code(uuid,text,bytea,text[],text[],text[])'::regprocedure) d`)).rows[0].d;
check('[BL-1885] the subject locks are taken in sorted order (order by s in the lock loop)',
  /select distinct s from unnest\([^)]*\) s order by s loop\s+perform pg_advisory_xact_lock/.test(body));

// 5. The inner accept, on its own (BL-1885). It returns the book id only; on a retry it must neither
// change the member's role nor add a row, an audit event or a second join, whatever the role is now.
const BK3 = await newChild(A, 'Asha', '2025-04-12');
await invite(BK3, 'ASHA8888');
const good3 = await hashOf('ASHA8888');
const inner = async (user, hash) => (await svc(`select public.accept_child_invite_by_code($1, $2) c`, [user, hash])).rows[0].c;
const roleNow = async (book, who) => (await sys(`select role from child_members where child_id = $1 and profile_id = $2`, [book, who])).rows[0]?.role;
const joinedEvents = async (book) => (await sys(`select count(*)::int n from audit_events where action = 'member_joined' and child_id = $1`, [book])).rows[0].n;
check('setup: the inner accept joins as the invited role', (await inner(V, good3)) === BK3 && (await roleNow(BK3, V)) === 'parent');
const ev0 = await joinedEvents(BK3);
await sys(`update child_members set role = 'contributor' where child_id = $1 and profile_id = $2`, [BK3, V]);
check('[BL-1885] after a role change the inner retry returns the book', (await inner(V, good3)) === BK3);
check('[BL-1885] the inner retry leaves the changed role alone', (await roleNow(BK3, V)) === 'contributor');
check('[BL-1885] the inner retry adds no member row and no audit event',
  (await sys(`select count(*)::int n from child_members where child_id = $1 and profile_id = $2`, [BK3, V])).rows[0].n === 1 && (await joinedEvents(BK3)) === ev0);
await sys(`delete from child_members where child_id = $1 and profile_id = $2`, [BK3, V]);
let st = null;
try { await inner(V, good3); } catch (e) { st = e.code ?? e.message; }
check('[BL-1885] a person who has left is not answered by the inner retry (SCINV)', st === 'SCINV');

await done();
