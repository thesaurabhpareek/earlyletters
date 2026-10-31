// invite_redeem_by_code (20261027000000): the one SQL call invite-redeem makes.
// Gate, lookup and failure count in one transaction; peek and accept modes; the four limits
// (person 10, device 10, address 30, service 1,000 per rolling hour); service role only.
// Contract: packages/api/src/server/family.ts (RedeemByCodeArgs, RedeemRpcResultSchema).
// Fictional family "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, codeOf, publishPolicies, consent, newChild, done } = h;
const { A, B, C, N, S } = users;
const V = '99999999-9999-9999-9999-999999999999'; // a parent who joins by code
const W = '88888888-8888-8888-8888-888888888888'; // a person who has not agreed to anything yet
for (const u of [A, B, C, N, S, V, W]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B, C, N, S, V]) await consent(u);

const svc = async (sql, params) => { await db.exec('set role service_role'); try { return await db.query(sql, params); } finally { await db.exec('reset role'); } };
const hashOf = async (code) => (await sys(`select sha256(convert_to($1, 'UTF8')) h`, [code])).rows[0].h;
const create = (uid, child, role, code, signs = null) => as(uid,
  `select public.create_child_invite($1::uuid, $2::uuid, $3, sha256(convert_to($4, 'UTF8')), sha256(convert_to($5, 'UTF8')), $6) id`,
  [uuid7(), child, role, (code + 'x'.repeat(64)).slice(0, 64), code, signs]);
let seq = 0;
const subj = (p) => `${p}-${++seq}`;
// One call. Fresh subjects each time unless named, so a limit is the thing under test and nothing else.
const redeem = async (user, mode, hash, { u = [subj('u')], d = [subj('d')], ip = [subj('ip')] } = {}) =>
  (await svc(`select public.invite_redeem_by_code($1, $2, $3, $4, $5, $6) r`, [user, mode, hash, u, d, ip])).rows[0].r;
const failures = async (scope) => (await sys(`select count(*)::int n from invite_redeem_failures where scope = $1`, [scope])).rows[0].n;
const total = async () => (await sys(`select count(*)::int n from invite_redeem_failures`)).rows[0].n;
const roleOf = async (child, uid) => (await sys(`select role from child_members where child_id = $1 and profile_id = $2`, [child, uid])).rows[0]?.role ?? null;
const unknown = await hashOf('NOSUCH99');

// ── Privileges ───────────────────────────────────────────────────────────
const BK = await newChild(A, 'Asha', '2025-04-12');
await sys(`update profiles set signs_as = 'Papa' where id = $1`, [A]);
await create(A, BK, 'parent', 'ASHA2345');
await create(A, BK, 'parent', 'ASHA9999');
const good = await hashOf('ASHA2345');
const args = [V, 'peek', good, ['u1'], ['d1'], ['i1']];
check('[F11-REQ-007] a signed-in person cannot call invite_redeem_by_code (42501)',
  (await codeOf(() => as(V, `select public.invite_redeem_by_code($1, $2, $3, $4, $5, $6)`, args))) === '42501');
check('the service role can; the failure table is closed to everyone but the function',
  (await redeem(V, 'peek', unknown)).outcome === 'unusable'
  && (await codeOf(() => svc(`select 1 from invite_redeem_failures`))) === '42501');

// ── Contract breaks are errors, not outcomes ─────────────────────────────
const bad = async (user, mode, hash, u, d, ip) => codeOf(() => svc(`select public.invite_redeem_by_code($1, $2, $3, $4, $5, $6)`, [user, mode, hash, u, d, ip]));
const before = await total();
check('an unknown mode, a short hash, a null person, no person subject, no device subject and an empty subject are 22023',
  (await bad(V, 'join', good, ['u'], ['d'], [])) === '22023' && (await bad(V, 'peek', Buffer.from([0]), ['u'], ['d'], [])) === '22023'
  && (await bad(null, 'peek', good, ['u'], ['d'], [])) === '22023' && (await bad(V, 'peek', good, [], ['d'], [])) === '22023'
  && (await bad(V, 'peek', good, ['u'], [], [])) === '22023' && (await bad(V, 'peek', good, ['u'], ['d'], [''])) === '22023');
check('a contract break counts nothing', (await total()) === before);

// ── Peek: what a person sees before agreeing ─────────────────────────────
const p1 = await redeem(V, 'peek', good);
check('[F11-REQ-003] peek returns only the inviter\'s sign-off and the role', JSON.stringify(Object.keys(p1).sort()) === '["inviter","outcome","role"]'
  && p1.outcome === 'peek' && p1.inviter === 'Papa' && p1.role === 'parent');
check('peek never carries the child\'s name or ids', !JSON.stringify(p1).includes('Asha') && !JSON.stringify(p1).includes(BK));
check('a peek writes no membership and counts no failure', (await roleOf(BK, V)) === null);

// ── Unusable: counted under the first subject of each array ───────────────
const t0 = await total();
const bu = [subj('bu'), 'old-key-u'], bd = [subj('bd')], bip = [subj('bip')];
const miss = await redeem(S, 'peek', unknown, { u: bu, d: bd, ip: bip });
check('[B-NFR-004] an unknown code is unusable and counted once each for the person, device, address and service',
  miss.outcome === 'unusable' && (await total()) === t0 + 4);
check('the person is recorded under the current key only', (await sys(`select count(*)::int n from invite_redeem_failures where subject = $1`, [bu[0]])).rows[0].n === 1
  && (await sys(`select count(*)::int n from invite_redeem_failures where subject = $1`, [bu[1]])).rows[0].n === 0);
const t1 = await total();
await redeem(S, 'peek', unknown, { ip: [] });
check('with no trusted address the address limit is skipped and only three rows are written', (await total()) === t1 + 3);

// ── Accept ───────────────────────────────────────────────────────────────
const c0 = await total();
const noConsent = await redeem(W, 'accept', good);
check('[SCCON] a person who has not agreed gets refused with the missing acts, not counted, and the invite stays open',
  noConsent.outcome === 'refused' && noConsent.sqlstate === 'SCCON' && /terms/.test(noConsent.detail) && (await total()) === c0
  && (await sys(`select accepted_at is null o from child_invites where code_hash = $1`, [good])).rows[0].o);
const acc = await redeem(V, 'accept', good);
check('[F11-REQ-007] accept joins the person and returns the book and the role',
  acc.outcome === 'accepted' && acc.child_id === BK && acc.role === 'parent' && (await roleOf(BK, V)) === 'parent');
const acc2 = await redeem(V, 'accept', good);
check('a retry after a lost answer is the same answer (idempotent) and counts nothing', acc2.outcome === 'accepted' && acc2.child_id === BK && (await total()) === c0);
const pj = await redeem(V, 'peek', good);
check('peek after joining says joined while the person is still a member', pj.outcome === 'peek' && pj.joined === true && pj.inviter === 'Papa');
const used = await redeem(S, 'accept', good);
check('a used code is unusable for anyone else, counted, with no detail', used.outcome === 'unusable' && used.detail === null);
const again = await redeem(V, 'accept', await hashOf('ASHA9999'));
check('a person already in the book gets already_member (counted)', again.outcome === 'unusable' && again.detail === 'already_member');
const pAgain = await redeem(V, 'peek', await hashOf('ASHA9999'));
check('peek says already_member too', pAgain.outcome === 'unusable' && pAgain.detail === 'already_member');

// ── Closed codes read as not found ───────────────────────────────────────
const BK2 = await newChild(B, 'Asha', '2025-06-01');
const inv = await create(B, BK2, 'parent', 'ASHA5555');
await sys(`update child_invites set revoked_at = now() where id = $1`, [inv.rows[0].id]);
check('a revoked code is unusable', (await redeem(S, 'peek', await hashOf('ASHA5555'))).outcome === 'unusable');
const inv2 = await create(B, BK2, 'parent', 'ASHA6666');
await sys(`update child_invites set expires_at = now() - interval '1 minute' where id = $1`, [inv2.rows[0].id]);
check('an expired code is unusable', (await redeem(S, 'peek', await hashOf('ASHA6666'))).outcome === 'unusable');

// ── The book is full: right code, not a guess ────────────────────────────
const BK3 = await newChild(C, 'Asha', '2025-07-01');
await create(C, BK3, 'parent', 'ASHA7777');
await create(C, BK3, 'parent', 'ASHA8888');
await redeem(N, 'accept', await hashOf('ASHA7777'));
const f0 = await total();
const full = await redeem(S, 'peek', await hashOf('ASHA8888'));
const fullAcc = await redeem(S, 'accept', await hashOf('ASHA8888'));
check('[SCCAP] a full book refuses peek and accept with the cap, not counted',
  full.outcome === 'refused' && full.sqlstate === 'SCCAP' && fullAcc.outcome === 'refused' && fullAcc.sqlstate === 'SCCAP' && (await total()) === f0);

// ── Limits ───────────────────────────────────────────────────────────────
const fixed = { u: ['lim-user'], d: [subj('d')], ip: [subj('ip')] };
for (let i = 0; i < 10; i++) await redeem(S, 'peek', unknown, { ...fixed, d: [subj('d')], ip: [subj('ip')] });
const lu = await total();
const limU = await redeem(S, 'peek', good, { ...fixed, d: [subj('d')], ip: [subj('ip')] });
check('[B-NFR-004] the person is limited after 10 failures in the hour; the answer is limited/user and is not looked up or counted',
  limU.outcome === 'limited' && limU.scope === 'user' && (await total()) === lu);
check('a limited person with a right code is still refused (no free guessing, nothing joined)',
  (await redeem(S, 'accept', await hashOf('ASHA8888'), { ...fixed, d: [subj('d')], ip: [subj('ip')] })).outcome === 'limited');
const prev = await redeem(S, 'peek', unknown, { u: ['lim-user-new', 'lim-user'], d: [subj('d')], ip: [subj('ip')] });
check('after a key rotation the previous key\'s failures still count', prev.outcome === 'limited' && prev.scope === 'user');
await sys(`update invite_redeem_failures set at = now() - interval '61 minutes' where subject = 'lim-user'`);
check('the window rolls: after an hour the person may try again', (await redeem(S, 'peek', unknown, { ...fixed, d: [subj('d')], ip: [subj('ip')] })).outcome === 'unusable');

const dev = ['lim-device'];
for (let i = 0; i < 10; i++) await redeem(S, 'peek', unknown, { u: [subj('u')], d: dev, ip: [subj('ip')] });
const limD = await redeem(S, 'peek', unknown, { u: [subj('u')], d: dev, ip: [subj('ip')] });
check('the device is limited after 10 failures across different people', limD.outcome === 'limited' && limD.scope === 'device');

const addr = ['lim-ip'];
for (let i = 0; i < 30; i++) await redeem(S, 'peek', unknown, { u: [subj('u')], d: [subj('d')], ip: addr });
const limI = await redeem(S, 'peek', unknown, { u: [subj('u')], d: [subj('d')], ip: addr });
check('the address is limited after 30 failures', limI.outcome === 'limited' && limI.scope === 'ip');
check('with no address given the address limit does not apply', (await redeem(S, 'peek', unknown, { u: [subj('u')], d: [subj('d')], ip: [] })).outcome === 'unusable');

// Service-wide: top up to the limit directly, then every code pauses, right or wrong.
await sys(`delete from invite_redeem_failures where scope = 'global'`);
await sys(`insert into invite_redeem_failures (scope, subject) select 'global', '' from generate_series(1, 999)`);
check('999 failures in the hour is not yet the brake', (await redeem(S, 'peek', unknown)).outcome === 'unusable');
const limG = await redeem(S, 'peek', good);
check('[F11-REQ-007] at 1,000 failures in the hour every code pauses (limited/global), a right one too',
  limG.outcome === 'limited' && limG.scope === 'global');
check('a limited global call did not add a row', (await failures('global')) === 1000);

// ── Housekeeping ─────────────────────────────────────────────────────────
await sys(`delete from invite_redeem_failures`);
await sys(`insert into invite_redeem_failures (scope, subject, at) values ('user', 'ancient', now() - interval '3 hours')`);
await redeem(S, 'peek', unknown);
check('rows older than 2 hours are removed as new failures are recorded',
  (await sys(`select count(*)::int n from invite_redeem_failures where subject = 'ancient'`)).rows[0].n === 0);
check('only hashes are stored: no profile id appears in any row',
  (await sys(`select count(*)::int n from invite_redeem_failures where subject in ($1, $2, $3)`, [A, S, V])).rows[0].n === 0);

// ── Review fixes on #306 (A03 F1, A04 F1/F3) ─────────────────────────────
// The harness is one connection, so a real deadlock cannot be reproduced here. These prove the
// definition carries the guard and the observable behaviour is unchanged.
const def = (await sys(`select pg_get_functiondef('public.invite_redeem_by_code(uuid,text,bytea,text[],text[],text[])'::regprocedure) d`)).rows[0].d;
check('[A03 F1] the housekeeping delete picks its rows with for update skip locked (no wait, so no lock cycle)',
  /interval '2 hours'[^;]*order by at limit 200\s+for update skip locked\)/.test(def));
await sys(`delete from invite_redeem_failures`);
await sys(`insert into invite_redeem_failures (scope, subject, at) select 'user', 'old-' || g, now() - interval '3 hours' from generate_series(1, 250) g`);
await redeem(S, 'peek', unknown);
check('[A03 F1] a purge pass still removes at most 200 stale rows and the new failure is counted',
  (await sys(`select count(*)::int n from invite_redeem_failures where subject like 'old-%'`)).rows[0].n === 50
  && (await failures('global')) === 1);
const migrationText = readFileSync(new URL('../migrations/20261027000000_invite_redeem_by_code.sql', import.meta.url), 'utf8');
check('[A04 F3] the migration header states its rollback (CLAUDE.md, pull requests)',
  /^-- ROLLBACK: drop function public\.invite_redeem_by_code\(uuid, text, bytea, text\[\], text\[\], text\[\]\);/m.test(migrationText)
  && /drop table public\.invite_redeem_failures/.test(migrationText));

// SCDEL (deleted book) and SCRAT (invite rate limit) are raised by create_child_invite and the
// entry triggers, never by accept_child_invite_by_code, which answers SCINV for a deleted book.
// So they stay out of the `refused` list: a deleted book is a counted `unusable`, never a 503.
const DEL = await newChild(A, 'Asha', '2025-04-12');
await create(A, DEL, 'parent', 'GONE2345');
const goneHash = await hashOf('GONE2345');
await sys(`update children set deleted_at = now() where id = $1`, [DEL]);
const gb = await failures('global');
const goneAccept = await redeem(V, 'accept', goneHash);
const gonePeek = await redeem(V, 'peek', goneHash);
check('[A03 F5 / A04 F2] a code for a deleted book is unusable (counted) in accept and peek, not an error and not refused',
  goneAccept.outcome === 'unusable' && gonePeek.outcome === 'unusable' && (await failures('global')) === gb + 2
  && (await roleOf(DEL, V)) === null);

// ── Classification (DATA_CLASSIFICATION 1.1 rules 4 and 5): hashed subjects are L3, operational fields L2 ──
const lv = Object.fromEntries((await sys(`select a.attname c, substring(col_description(a.attrelid, a.attnum) from '^L[1-4]') l
  from pg_attribute a where a.attrelid = 'public.invite_redeem_failures'::regclass and a.attnum > 0 and not a.attisdropped`)).rows.map((r) => [r.c, r.l]));
check('[classification] subject is L3 (a keyed hash of a person, device or address); id, scope and at are L2',
  lv.subject === 'L3' && lv.id === 'L2' && lv.scope === 'L2' && lv.at === 'L2');

await done();
