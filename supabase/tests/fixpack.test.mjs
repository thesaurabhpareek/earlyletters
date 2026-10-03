// M1 database fix pack (docs/BACKLOG.md E1): the gaps closed after the audit on
// 3 Oct 2026. BL-112 invite codes and redemption, BL-113 client creation time
// and live books only, BL-116 left-member persona. The pepper (BL-115 X-12) is in
// hardening.test.mjs. Fictional family "Asha" only (CLAUDE.md).
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { createDb, users, uuid7, inviteCode } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, invite, inviteWithCode, join } = h;
const { A, B, C, N, S, U } = users;
const L = '88888888-8888-8888-8888-888888888888'; // left member: joined as family, then left

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${S}'),('${U}'),('${L}')`);
await publishPolicies();
for (const u of [A, B, C, N, S, L]) await consent(u);

const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);

const sha = (s) => createHash('sha256').update(s, 'utf8').digest();
// What the invite-redeem Edge Function does: call the RPC as the service role.
const redeem = async (uid, code) => {
  await sys(`set role service_role`);
  try { return (await sys(`select public.accept_child_invite_by_code($1, $2) c`, [uid, code])).rows[0].c; }
  finally { await sys(`reset role`); }
};

// ── HMAC and code normal form ────────────────────────────────────────────
{
  const cases = [['k', 'm'], ['test-invite-code-pepper-0123456789abcdef', 'x'], ['k'.repeat(100), 'long key']];
  let ok = true;
  for (const [k, m] of cases) {
    const got = (await sys(`select encode(public.hmac_sha256(convert_to($1, 'UTF8'), convert_to($2, 'UTF8')), 'hex') h`, [k, m])).rows[0].h;
    ok &&= got === createHmac('sha256', k).update(m).digest('hex');
  }
  check('[BL-112] hmac_sha256 matches RFC 2104 (Node crypto), including keys over 64 bytes', ok);
  const norm = async (c) => (await sys(`select public.normalise_invite_code($1) n`, [c])).rows[0].n;
  check('[A-REQ-029] codes normalise: case, hyphen, spaces, O as 0, I and L as 1',
    (await norm('ab2c-d3ef')) === 'AB2CD3EF' && (await norm(' o1il 2345 ')) === '01112345');
  check('[A-REQ-029] wrong length, U and other symbols are not codes',
    (await norm('ABC')) === null && (await norm('ABCDEFGHJ')) === null && (await norm('ABCDEFGU')) === null
    && (await norm('ABCD_EFG')) === null && (await norm(null)) === null);
}

// ── BL-112 invite codes ──────────────────────────────────────────────────
{
  const inv = await inviteWithCode(A, CHILD, 'parent');
  const row = (await sys(`select encode(code_hash, 'hex') c from child_invites where id = $1`, [inv.id])).rows[0];
  const expected = createHmac('sha256', 'test-invite-code-pepper-0123456789abcdef').update(sha(inv.code)).digest('hex');
  check('[BL-112] the code is stored as HMAC(pepper, sha256(code)), never plain or plain-hashed',
    row.c === expected && row.c !== sha(inv.code).toString('hex'));
  for (const r of ['anon', 'authenticated']) {
    const g = (await sys(`select has_function_privilege($1, 'public.accept_child_invite_by_code(uuid, text)', 'execute') g`, [r])).rows[0].g;
    check(`[BL-112] ${r} cannot redeem a code directly (only the invite-redeem function)`, g === false);
  }
  check('[BL-112] the service role can redeem a code',
    (await sys(`select has_function_privilege('service_role', 'public.accept_child_invite_by_code(uuid, text)', 'execute') g`)).rows[0].g === true);
  check('[BL-112] signed-in callers get 42501 on the code RPC',
    (await codeOf(() => as(C, `select public.accept_child_invite_by_code($1, $2)`, [C, inv.code]))) === '42501');
  check('[BL-112] a wrong code is SCINV', (await codeOf(() => redeem(C, inviteCode()))) === 'SCINV');
  check('[BL-112] a malformed code is SCINV', (await codeOf(() => redeem(C, 'nope'))) === 'SCINV');
  check('[BL-112] no caller id is 22023', (await codeOf(() => redeem(null, inv.code))) === '22023');
  check('[BL-112] redeeming needs consent (SCCON)', (await codeOf(() => redeem(U, inv.code))) === 'SCCON');
  const spoken = `${inv.code.slice(0, 4).toLowerCase()}-${inv.code.slice(4)}`;
  check('[A-REQ-029] a typed code in lower case with the hyphen joins the book as its role',
    (await redeem(C, spoken)) === CHILD
    && (await sys(`select role from child_members where child_id = $1 and profile_id = $2`, [CHILD, C])).rows[0]?.role === 'parent');
  check('[BL-112] the same person redeeming again is idempotent', (await redeem(C, inv.code)) === CHILD);
  check('[BL-112] the join is audited with the person as actor',
    (await sys(`select count(*)::int n from audit_events where action = 'member_joined' and actor_id = $1 and actor_kind = 'user'`, [C])).rows[0].n === 1);
  check('[BL-112] a used code is refused for someone else', (await codeOf(() => redeem(S, inv.code))) === 'SCINV');
  check('[BL-112] the link token of a code-redeemed invite is used up too', (await codeOf(() => as(S, `select public.accept_child_invite($1)`, [inv.token]))) === 'SCINV');
  await as(C, `delete from child_members where child_id = $1 and profile_id = $2`, [CHILD, C]);

  const rev = await inviteWithCode(A, CHILD, 'contributor');
  await as(A, `select public.revoke_invite($1)`, [rev.id]);
  check('[BL-112] a revoked invite is refused by code', (await codeOf(() => redeem(S, rev.code))) === 'SCINV');
  const old = await inviteWithCode(A, CHILD, 'contributor');
  await sys(`update child_invites set expires_at = now() - interval '1 minute' where id = $1`, [old.id]);
  check('[BL-112] an expired invite is refused by code', (await codeOf(() => redeem(S, old.code))) === 'SCINV');

  await sys(`delete from vault.decrypted_secrets where name = 'invite_code_pepper'`);
  check('[BL-115] no code pepper: invites cannot be created (SCCFG, fails closed)', (await codeOf(() => invite(A, CHILD, 'contributor'))) === 'SCCFG');
  check('[BL-115] no code pepper: codes cannot be redeemed (SCCFG)', (await codeOf(() => redeem(S, rev.code))) === 'SCCFG');
  await sys(`insert into vault.decrypted_secrets values ('invite_code_pepper', 'short')`);
  check('[BL-115] a short code pepper is refused (SCCFG)', (await codeOf(() => invite(A, CHILD, 'contributor'))) === 'SCCFG');
  await sys(`update vault.decrypted_secrets set decrypted_secret = 'test-invite-code-pepper-0123456789abcdef' where name = 'invite_code_pepper'`);
}

// ── BL-112 accept refuses deleted books (link and code) ──────────────────
{
  const SOLO = await newChild(S);
  const inv = await inviteWithCode(S, SOLO, 'parent');
  await as(S, `select public.request_book_deletion($1, 'ios')`, [SOLO]);
  check('[BL-112] a deleted book refuses its invite link (SCINV)', (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [inv.token]))) === 'SCINV');
  check('[BL-112] a deleted book refuses its invite code (SCINV)', (await codeOf(() => redeem(C, inv.code))) === 'SCINV');
  check('[BL-112] a deleted book cannot get a new invite (SCDEL)', (await codeOf(() => invite(S, SOLO, 'parent'))) === 'SCDEL');
  check('[BL-112] nobody joined the deleted book', (await sys(`select count(*)::int n from child_members where child_id = $1`, [SOLO])).rows[0].n === 1);
  await as(S, `select public.cancel_book_deletion($1)`, [SOLO]);
}

// ── BL-113 client creation time ──────────────────────────────────────────
{
  const mk = (uid, at) => one(uid, `select public.create_child($1, 'Asha', '2025-04-12'::date, null, $2::timestamptz) as id`, [uuid7(), at]).then((r) => r.id);
  const at = async (id) => (await sys(`select client_created_at t from children where id = $1`, [id])).rows[0].t;
  const offline = '2026-09-20T08:30:00.000Z';
  const k1 = await mk(S, offline);
  check('[BL-113] create_child keeps the device creation time', (await at(k1))?.toISOString() === offline);
  check('[BL-113] a device time in the future is dropped', (await at(await mk(S, new Date(Date.now() + 86400000).toISOString()))) === null);
  check('[BL-113] a device time before 2024 is dropped', (await at(await mk(S, '2019-01-01T00:00:00Z'))) === null);
  check('[BL-113] without it the column is null', (await at(await mk(S, null))) === null);
  check('[BL-113] a parent cannot rewrite either creation time (SCIMM)',
    (await codeOf(() => as(S, `update children set client_created_at = now() where id = $1`, [k1]))) === 'SCIMM'
    && (await codeOf(() => as(S, `update children set created_at = now() - interval '1 year' where id = $1`, [k1]))) === 'SCIMM');
  check('[BL-113] the four-argument create_child is gone (42883)',
    (await codeOf(() => as(S, `select public.create_child($1::uuid, 'Asha'::text, '2025-04-12'::date, null::date, 'x'::text)`, [uuid7()]))) === '42883');
}

// ── BL-113 letters only into live books (policy, not only the trigger) ───
{
  const p = (await sys(`select with_check from pg_policies where tablename = 'entries' and policyname = 'entries_author_insert'`)).rows[0];
  check('[BL-113] entries_author_insert requires child_is_live(child_id)', /child_is_live\(child_id\)/.test(p?.with_check ?? ''));
}

// ── BL-116 left member persona ───────────────────────────────────────────
{
  const token = await invite(A, CHILD, 'contributor');
  await as(L, `select public.accept_child_invite($1)`, [token]);
  await sys(`update children set family_can_read = true where id = $1`, [CHILD]);
  const aLetter = uuid7();
  await as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book, photo_path)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', true, $4)`, [aLetter, CHILD, A, `${CHILD}/${A}/${aLetter}.jpg`]);
  const lLetter = uuid7();
  await as(L, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um hello', 'Hello.', false)`, [lLetter, CHILD, L]);
  check('[BL-116] before leaving, the member reads the book', (await as(L, `select 1 from book_entries where id = $1`, [aLetter])).rows.length === 1);
  await as(L, `delete from child_members where child_id = $1 and profile_id = $2`, [CHILD, L]);
  check('[BL-116] a left member reads no one else\'s letters', (await as(L, `select 1 from book_entries where author_id <> $1`, [L])).rows.length === 0);
  check('[BL-116] a left member sees nothing about the child', (await as(L, `select 1 from book_children`)).rows.length === 0
    && (await as(L, `select 1 from children`)).rows.length === 0);
  check('[BL-116] a left member cannot read the photos', (await one(L, `select public.can_read_entry_photo($1) v`, [`${CHILD}/${A}/${aLetter}.jpg`])).v === false);
  check('[BL-116] a left member sees no members or invites',
    (await as(L, `select 1 from child_members where child_id = $1`, [CHILD])).rows.length === 0
    && (await as(L, `select 1 from child_invites where child_id = $1`, [CHILD])).rows.length === 0);
  check('[BL-116] a left member cannot write a new letter into the book', (await codeOf(() => as(L, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um hi', 'Hi.', false)`, [uuid7(), CHILD, L]))) === '42501');
  check('[BL-116] a left member cannot invite', (await codeOf(() => invite(L, CHILD, 'contributor'))) === 'SCPAR');
  check('[BL-116] a left member cannot rejoin with the used link', (await codeOf(() => as(L, `select public.accept_child_invite($1)`, [token]))) === 'SCINV');
  check('[BL-116] a left member can still delete their own letter (LEGAL-REQ-009)',
    (await codeOf(() => as(L, `select public.delete_entry($1)`, [lLetter]))) === 'ok');
  await sys(`update children set family_can_read = false where id = $1`, [CHILD]);
}

done();
