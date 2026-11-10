// [BL-578] A completed account deletion keeps the person's peppered subject_hash on its request,
// and the service role's lookup by request id returns the pseudonymised consent rows, also after
// day 60, when purge_ledger no longer holds the raw id (20261108010000_deletion_subject_hash.sql).
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, TEST_CONSENT_PEPPER } from './harness.mjs';

const { db, check, as, one, sys, codeOf, done, publishPolicies, consent, newChild } = await createDb(process.argv.slice(2));
const { A, B, C } = users;
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);
await newChild(A);
await sys(`insert into subscription_consents (profile_id, sub_ref, product_id, offer_type, terms_shown, shown_at)
  values ($1, $2, 'plus.annual', 'introductory', '1.0.0', now())`, [A, 'a'.repeat(64)]);

const lookup = async (id, role = null) => {
  if (!role) return (await sys(`select public.ops_deletion_consent_records($1) v`, [id])).rows[0].v;
  await db.exec(`set role ${role}`);
  try { return (await db.query(`select public.ops_deletion_consent_records($1) v`, [id])).rows[0].v; } finally { await db.exec('reset role'); }
};
const actsOf = async (uid) => (await sys(`select count(*)::int n from policy_acceptances where profile_id = $1`, [uid])).rows[0].n;
const aActs = await actsOf(A);

// ── Before completion: the lookup follows profile_id ──────────────────────
const req = (await one(A, `select * from public.request_account_deletion('ios', false)`)).request_id;
const early = await lookup(req);
check('given a scheduled request, the lookup returns the person\'s consent rows by account, not yet pseudonymised',
  early.pseudonymised === false && early.policy_acceptances.length === aActs && early.subscription_consents.length === 1);

// ── Completion ────────────────────────────────────────────────────────────
await sys(`select public.purge_due(now() + interval '31 days')`);
await sys(`select public.prepare_account_purge($1)`, [req]);
await sys(`delete from auth.users where id = $1`, [A]);

// Fails closed without the pepper, and changes nothing.
await sys(`select set_config('app.consent_pepper', '', false)`);
const noPepper = await codeOf(() => sys(`select public.finalize_account_deletion($1, '{}'::jsonb)`, [req]));
const still = (await sys(`select status, profile_id from deletion_requests where id = $1`, [req])).rows[0];
check('without the pepper finalize refuses (55000) and the request stays executing and linked',
  noPepper === '55000' && still.status === 'executing' && still.profile_id === A);
await sys(`select set_config('app.consent_pepper', $1, false)`, [TEST_CONSENT_PEPPER]);

await sys(`select public.finalize_account_deletion($1, '{"verified": true}'::jsonb)`, [req]);
const expected = (await sys(`select sha256(convert_to($1 || $2, 'UTF8')) h`, [A, TEST_CONSENT_PEPPER])).rows[0].h;
const dr = (await sys(`select profile_id, subject_hash from deletion_requests where id = $1`, [req])).rows[0];
const pa = (await sys(`select count(*)::int n from policy_acceptances where subject_hash = $1`, [expected])).rows[0].n;
check('[BL-578] given a completed deletion, then deletion_requests holds the same peppered subject_hash as the consent rows, and no account id',
  dr.profile_id === null && Buffer.from(dr.subject_hash).equals(Buffer.from(expected)) && pa === aActs);

const done0 = await lookup(req, 'service_role');
check('[BL-578] given a completed deletion, when the service role looks up the request id, then it returns every consent row, pseudonymised',
  done0.pseudonymised === true && done0.status === 'completed' && done0.policy_acceptances.length === aActs
  && done0.subscription_consents.length === 1
  && done0.policy_acceptances.every((r) => !('profile_id' in r) && !('subject_hash' in r) && r.pseudonymised_at));
const bIds = (await sys(`select id::text from policy_acceptances where profile_id = $1`, [B])).rows.map((r) => r.id);
check('the lookup returns no other person\'s rows', bIds.length > 0 && !done0.policy_acceptances.some((r) => bIds.includes(r.id)));

// ── The clock moves 61 days ───────────────────────────────────────────────
const ledgerBefore = (await sys(`select count(*)::int n from purge_ledger where entity_type = 'profile' and entity_id = $1`, [A])).rows[0].n;
await sys(`select public.purge_due(now() + interval '61 days')`);
const ledgerAfter = (await sys(`select count(*)::int n from purge_ledger where entity_type = 'profile' and entity_id = $1`, [A])).rows[0].n;
const day61 = await lookup(req, 'service_role');
check('[BL-578] given an Asha deletion and the clock moved 61 days (the purge ledger no longer has the account id), when the lookup runs, then it still returns the rows',
  ledgerBefore === 1 && ledgerAfter === 0 && day61.policy_acceptances.length === aActs && day61.subscription_consents.length === 1);

// ── Access and edges ──────────────────────────────────────────────────────
check('only the service role may run the lookup (authenticated and anon may not)',
  (await codeOf(() => as(B, `select public.ops_deletion_consent_records($1)`, [req]))) === '42501'
  && (await codeOf(() => lookup(req, 'anon'))) === '42501');
check('an unknown request id is P0002', (await codeOf(() => lookup(C))) === 'P0002');
const S = users.S;
await sys(`insert into auth.users values ('${S}')`);
await consent(S);
const solo = await newChild(S);
await as(S, `select public.request_book_deletion($1, 'ios')`, [solo]);
const bookReq = (await sys(`select id from deletion_requests where kind = 'book' and child_id = $1`, [solo])).rows[0].id;
check('a book deletion request is not a way into a person\'s consent rows (P0002)',
  (await codeOf(() => lookup(bookReq))) === 'P0002');

// The request and the rows go together after 3 years.
await sys(`select public.purge_due(now() + interval '3 years 31 days')`);
check('after 3 years the request is gone with the consent rows, so the id finds nothing (P0002)',
  (await codeOf(() => lookup(req))) === 'P0002'
  && (await sys(`select count(*)::int n from policy_acceptances where subject_hash = $1`, [expected])).rows[0].n === 0);

await db.close();
done();
