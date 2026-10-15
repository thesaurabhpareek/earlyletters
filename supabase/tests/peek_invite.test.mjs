// peek_invite(token) (20261015000000; BL-322 server part, security review H2):
// what the invite sheet may show before the person agrees to join. Only the
// inviter's sign-off name and the role, never the child's name or dates, and it
// refuses exactly where accept_child_invite would.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, invite, join } = h;
const { A, B, C, N, U, W } = users;
const M = '88888888-8888-8888-8888-888888888888'; // another invitee

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${U}'),('${W}'),('${M}')`);
await publishPolicies();
for (const u of [A, B, C, N, M]) await consent(u);

const errOf = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
const peek = async (uid, t) => (await one(uid, `select public.peek_invite($1) r`, [t])).r;
const accept = async (uid, t) => errOf(() => as(uid, `select public.accept_child_invite($1)`, [t]));
const resetRate = (uid) => sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);

const ASHA = await newChild(A, 'Asha', '2025-04-12', null);
await sys(`update profiles set signs_as = 'Ammi' where id = $1`, [A]);
const t = await invite(A, ASHA, 'parent');

// ── What it shows ───────────────────────────────────────────────────────
const p = await peek(U, t);
check('[BL-322] peek_invite works before consent (signed in, nothing accepted yet)', p !== undefined && p.state === 'open');
check('[BL-322] it returns the role and the inviter\'s sign-off name only',
  JSON.stringify(Object.keys(p).sort()) === JSON.stringify(['inviter_signs_as', 'role', 'state']) && p.role === 'parent' && p.inviter_signs_as === 'Ammi');
const text = JSON.stringify(p);
check('[BL-322] no child name, birthday, book id, inviter id or expiry in the answer',
  !text.includes('Asha') && !text.includes('2025') && !text.includes(ASHA) && !text.includes(A) && !/expire/.test(text));
await as(A, `insert into child_member_prefs (child_id, profile_id, signs_as) values ($1, $2, 'Mama')`, [ASHA, A]);
check('the per-book signature wins over the profile name', (await peek(U, t)).inviter_signs_as === 'Mama');
const S2 = await newChild(C, 'Asha', '2025-04-12');
const tNoName = await invite(C, S2, 'contributor');
check('an inviter who never set a name: null, and the role says family', (await peek(U, tNoName)).inviter_signs_as === null
  && (await peek(U, tNoName)).role === 'contributor');
check('peeking changes nothing: the invite stays open and no membership appears',
  (await sys(`select accepted_at from child_invites where token_hash = sha256(convert_to($1, 'UTF8'))`, [t])).rows[0].accepted_at === null
  && (await sys(`select 1 from child_members where child_id = $1 and profile_id = $2`, [ASHA, U])).rows.length === 0);

// ── Who may call it ─────────────────────────────────────────────────────
check('the anon role cannot call it', (await codeOf(() => h.asAnon(`select public.peek_invite($1)`, [t]))) === '42501');
check('an anonymous session cannot call it (SCANO)', (await codeOf(() => as(W, `select public.peek_invite($1)`, [t], { anonymous: true }))) === 'SCANO');

// ── It refuses where accept refuses, with the same code and message ─────
const same = async (label, uid, tok) => {
  const pe = await errOf(() => peek(uid, tok));
  const ae = await accept(uid, tok);
  check(`${label}: peek and accept agree (${pe?.code} "${pe?.message}")`,
    pe !== null && ae !== null && pe.code === ae.code && pe.message === ae.message && pe.detail === ae.detail);
};
await same('unknown token', M, 'f'.repeat(64));
await same('empty token', M, '');
const tRev = await invite(A, ASHA, 'contributor');
await as(A, `select public.revoke_invite(id) from child_invites where token_hash = sha256(convert_to($1, 'UTF8'))`, [tRev]);
await same('revoked invite', M, tRev);
const tExp = await invite(A, ASHA, 'contributor');
await sys(`update child_invites set expires_at = now() - interval '1 minute' where token_hash = sha256(convert_to($1, 'UTF8'))`, [tExp]);
await same('expired invite', M, tExp);
const tFam = await invite(A, ASHA, 'contributor');
await same('the inviter peeking at their own link (already a member)', A, tFam);
await join(N, 'contributor', ASHA, A);
await same('an invite to a book the person already belongs to', N, tFam);

// Co-parent joins, then a second co-parent invite made earlier hits the cap.
const tSecond = await invite(A, ASHA, 'parent');
await as(B, `select public.accept_child_invite($1)`, [t]);
const capPeek = await errOf(() => peek(M, tSecond));
check('[D-069] a co-parent invite to a full book: SCCAP with the limit, before the person consents',
  capPeek?.code === 'SCCAP' && capPeek?.detail === '2');
await same('full book', M, tSecond);
check('[BL-322] the person who joined sees "joined" for their own link (accept is idempotent too)', (await peek(B, t)).state === 'joined');
await same('a used invite, by someone else', M, t);

// Inviter left (stale link, security review H2).
const tStale = await invite(B, ASHA, 'contributor');
await as(B, `select public.leave_child($1)`, [ASHA]);
await sys(`update child_invites set revoked_at = null where token_hash = sha256(convert_to($1, 'UTF8'))`, [tStale]);
await same('an invite whose maker has left the book', M, tStale);
// Deleted book.
const BOOK3 = await newChild(C, 'Asha', '2025-04-12');
const tDel = await invite(C, BOOK3, 'parent');
await as(C, `select public.request_book_deletion($1, 'ios')`, [BOOK3]);
await same('an invite to a deleted book', M, tDel);
check('and those refusals say "not found", not why', (await errOf(() => peek(M, tDel)))?.message === 'invite not found'
  && (await errOf(() => peek(M, tStale)))?.message === 'invite not found');

// ── Rate limit shared with accept ───────────────────────────────────────
await resetRate(M);
await sys(`insert into sync_rate_windows (profile_id, bucket, window_start, hits) values ($1, 'membership', now(), 120)`, [M]);
check('[M3] peek_invite shares accept_child_invite\'s 120 per hour (SCRAT)', (await codeOf(() => peek(M, tNoName))) === 'SCRAT');
await resetRate(M);
check('after the window it works again', (await peek(M, tNoName)).state === 'open');

done();
