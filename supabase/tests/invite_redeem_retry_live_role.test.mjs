// BL-1844 (20261123000000): the retry shortcut keeps the live-book check, answers the member's current
// role, and still takes the subject locks before it answers. Fictional family "Asha" only (CLAUDE.md).
//
// Row-lock trace of public.accept_child_invite_by_code (20261015020000, the only definition; BL-1923 part 4).
// First accept, in the order the function takes them:
//   1. profiles: plain read (exists), no row lock.
//   2. child_invites: plain read of the newest open invite for the code hash, no row lock.
//   3. children (the invite's book): SELECT ... FOR NO KEY UPDATE.
//   4. child_invites (the same newest open invite, read again): SELECT ... FOR UPDATE.
//   5. checks that only read: member exists, contributor switch, inviter is a parent, parent cap, consent gate.
//   6. writes: INSERT child_members, UPDATE child_invites (row already held), INSERT audit_events. The
//      foreign-key checks on the insert take key-share locks, which agree with step 3 (same transaction).
// Retry (the person already joined): returns at step 2's fallback with no row lock at all.
// Outside this function, public.invite_redeem_by_code takes only the advisory subject locks first; on a
// counted failure it later takes FOR UPDATE SKIP LOCKED on stale invite_redeem_failures rows, which are
// not rows of steps 3 and 4, and skip locked never waits.
// Is a second order possible? No. The sibling writers (create_child_invite, accept_child_invite(text),
// undo and the children-first helpers in 20261015020000) also lock children (FOR NO KEY UPDATE) before
// child_invites (FOR UPDATE), never the reverse, so two claims, or a claim and a revoke, queue on the
// book first and cannot deadlock on these two tables. Section 6 reads the function body to keep it so.
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
const auditAfter = async (id) => (await sys(`select action, actor_id, actor_kind, subject_type, subject_id, child_id, detail from audit_events where id > $1 order by id`, [id])).rows;
const auditMax = async () => (await sys(`select coalesce(max(id), 0)::bigint m from audit_events`)).rows[0].m;
const a0 = await auditMax();
check('setup: the first accept joins as parent', (await redeem(V, 'accept', good)).role === 'parent');
const written = await auditAfter(a0);
check('[BL-1923] one accepted claim writes exactly one audit row, and it is member_joined for this person and book (role, via code)',
  written.length === 1 && written[0].action === 'member_joined' && written[0].actor_id === V && written[0].actor_kind === 'user'
  && written[0].subject_type === 'membership' && written[0].subject_id === V && written[0].child_id === BK
  && Object.keys(written[0].detail).length === 2 && written[0].detail.role === 'parent' && written[0].detail.via === 'code');
await sys(`update child_members set role = 'contributor' where child_id = $1 and profile_id = $2`, [BK, V]);
const t0 = await total();
const a1 = await auditMax();
const rr = await redeem(V, 'accept', good);
check('[BL-1844] after a role change the retry answers the current role, not the invite role',
  rr.outcome === 'accepted' && rr.child_id === BK && rr.role === 'contributor');
check('[BL-1844] the role-change retry counts nothing', (await total()) === t0);
check('[BL-1923] the role-change retry writes no audit row of any kind', (await auditAfter(a1)).length === 0);
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
check('[BL-1844] after the shortcut answers, the transaction holds 3 advisory lock rows (person, device, address)', locks === 3);
const sbody = (await sys(`select pg_get_functiondef('public.invite_redeem_by_code(uuid,text,bytea,text[],text[],text[])'::regprocedure) d`)).rows[0].d;
const iLock = sbody.indexOf('perform pg_advisory_xact_lock'), iShort = sbody.indexOf('i.accepted_by = p_user');
check('[BL-1844] (read from the function body) the subject lock loop comes before the retry shortcut query',
  iLock > 0 && iShort > 0 && iLock < iShort);

// 4. Claims that share a subject (BL-1885). The embedded database has ONE connection, so two callers
// cannot be in flight at once here; the true two-connection check is a local-stack row (see the PR
// report). What this harness can show, and what a lost lock would break:
//   a. pg_locks shows one row per lock KEY, so a subject named twice shows once. That is all it can
//      show: a second acquire of a key the transaction already holds adds no row, so "distinct" and
//      "re-entered" are not visible there. Each check below says which of the two it is;
//   b. "distinct subjects" and "sorted order" are read from the function body (the only thing that keeps
//      two callers from deadlocking is the fixed order, and pg_locks does not record acquisition order);
//   c. two claims from the same subject in one transaction end holding the same lock keys, and the
//      second sees the first's join, so it is answered as a retry and counts nothing.
const lockKeys = async () => (await sys(`select objid::bigint k, classid::bigint c from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()`)).rows;
const BK2 = await newChild(A, 'Asha', '2025-04-12');
await invite(BK2, 'ASHA7777');
const good2 = await hashOf('ASHA7777');
const shared = subj('shared'), sharedIp = subj('ip');
await db.exec('begin');
const first = await redeem(S, 'accept', good2, { u: [shared], d: [shared], ip: [sharedIp] });
const held1 = (await lockKeys()).map((r) => `${r.c}:${r.k}`).sort();
const again = await redeem(S, 'accept', good2, { u: [shared], d: [shared], ip: [sharedIp] });
const held2 = (await lockKeys()).map((r) => `${r.c}:${r.k}`).sort();
const joined2 = (await sys(`select count(*)::int n from child_members where child_id = $1 and profile_id = $2`, [BK2, S])).rows[0].n;
await db.exec('rollback');
check('[BL-1885] pg_locks shows 2 lock rows when person and device share a subject and the address is another (one row per key)', first.outcome === 'accepted' && held1.length === 2);
check('[BL-1885] after a second claim from the same subjects the held keys are the same 2, and it answers as a retry with one member row',
  JSON.stringify(held2) === JSON.stringify(held1) && again.outcome === 'accepted' && again.child_id === BK2 && joined2 === 1);
await db.exec('begin');
const sa = 'zz-' + subj('a'), sb = 'aa-' + subj('b');
await redeem(V, 'accept', good, { u: [sa], d: [sb], ip: [] });
const want = (await sys(`select count(*)::int n from unnest(array[$1::text, $2::text]) s
  where exists (select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid()
                  and ((classid::bigint << 32) | objid::bigint) = hashtextextended('invite_redeem:' || s, 0))`, [sa, sb])).rows[0].n;
await db.exec('rollback');
check('[BL-1885] both subjects named (person zz-, device aa-) are locked under hashtextextended(invite_redeem:<subject>)', want === 2);
const body = (await sys(`select pg_get_functiondef('public.invite_redeem_by_code(uuid,text,bytea,text[],text[],text[])'::regprocedure) d`)).rows[0].d;
check('[BL-1923] (read from the function body) the lock loop takes each subject once: select distinct s',
  /for v_subj in select distinct s from unnest\(/.test(body));
check('[BL-1885] (read from the function body) the lock loop takes subjects in sorted order: order by s, then the lock',
  /select distinct s from unnest\([^)]*\) s order by s loop\s+perform pg_advisory_xact_lock/.test(body));

// 5. The inner accept, on its own (BL-1885). It returns the book id only; on a retry it must neither
// change the member's role nor add a row, an audit event or a second join, whatever the role is now.
const BK3 = await newChild(A, 'Asha', '2025-04-12');
await invite(BK3, 'ASHA8888');
const good3 = await hashOf('ASHA8888');
const inner = async (user, hash) => (await svc(`select public.accept_child_invite_by_code($1, $2) c`, [user, hash])).rows[0].c;
const roleNow = async (book, who) => (await sys(`select role from child_members where child_id = $1 and profile_id = $2`, [book, who])).rows[0]?.role;
const joinedEvents = async (book) => (await sys(`select count(*)::int n from audit_events where action = 'member_joined' and child_id = $1`, [book])).rows[0].n;
const a3 = await auditMax();
check('setup: the inner accept joins as the invited role', (await inner(V, good3)) === BK3 && (await roleNow(BK3, V)) === 'parent');
const innerWritten = await auditAfter(a3);
check('[BL-1923] the inner accept writes exactly one audit row, member_joined for this book, and nothing else',
  innerWritten.length === 1 && innerWritten[0].action === 'member_joined' && innerWritten[0].child_id === BK3 && innerWritten[0].actor_id === V);
const ev0 = await joinedEvents(BK3);
const a4 = await auditMax();
await sys(`update child_members set role = 'contributor' where child_id = $1 and profile_id = $2`, [BK3, V]);
check('[BL-1885] after a role change the inner retry returns the book', (await inner(V, good3)) === BK3);
check('[BL-1885] the inner retry leaves the changed role alone', (await roleNow(BK3, V)) === 'contributor');
check('[BL-1885] the inner retry adds no member row and no audit event of any kind',
  (await sys(`select count(*)::int n from child_members where child_id = $1 and profile_id = $2`, [BK3, V])).rows[0].n === 1
  && (await joinedEvents(BK3)) === ev0 && (await auditAfter(a4)).length === 0);
await sys(`delete from child_members where child_id = $1 and profile_id = $2`, [BK3, V]);
let st = null;
try { await inner(V, good3); } catch (e) { st = e.code ?? e.message; }
check('[BL-1885] a person who has left is not answered by the inner retry (SCINV)', st === 'SCINV');

// 6. Row-lock order (BL-1923 part 4; the trace is in the header). One order exists: the book row
// (FOR NO KEY UPDATE) before the invite row (FOR UPDATE). Row locks do not show in pg_locks, so this
// reads the function body, as the sorted-order check above does.
const innerBody = (await sys(`select pg_get_functiondef('public.accept_child_invite_by_code(uuid,bytea)'::regprocedure) d`)).rows[0].d;
const iBook = innerBody.search(/from children where id = v_child for no key update/);
const iInvite = innerBody.search(/from child_invites\s+where code_hash = p_code_hash[^;]*for update;/);
check('[BL-1923] (read from the function body) the inner accept locks the book row before the invite row',
  iBook > 0 && iInvite > 0 && iBook < iInvite);

await done();
