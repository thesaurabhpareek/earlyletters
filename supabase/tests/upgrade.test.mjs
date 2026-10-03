// Upgrade path (BL-116, BL-015): start from exactly the migrations listed in
// .github/migrations-applied.txt (what the live project runs), seed data through
// the OLD functions, then apply every pending migration on top and check that
// nothing is lost and the new rules hold for the old rows. Fictional family
// "Asha" only (CLAUDE.md).
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, users, uuid7 } from './harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appliedNames = readFileSync(join(here, '..', '..', '.github', 'migrations-applied.txt'), 'utf8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const all = process.argv.slice(2);
const applied = all.filter((f) => appliedNames.includes(basename(f)));
const pending = all.filter((f) => !appliedNames.includes(basename(f)));

const h = await createDb(applied);
const { db, check, as, sys, one, codeOf, done, publishPolicies, consent, invite } = h;
const { A, B, C, N, U } = users;
check(`the applied set is the live set (${applied.length} of ${appliedNames.length} listed files found)`,
  applied.length === appliedNames.length && applied.length > 0);
check('there are pending migrations to upgrade through', pending.length > 0);

// ── Seed with the old API (files 1 and 2) ────────────────────────────────
await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${U}')`);
const CHILD = (await one(A, `select public.create_child('Asha', '2025-04-12'::date) id`)).id;
const NODATE = (await one(A, `select public.create_child('Asha', null::date) id`)).id;
const tB = (await one(A, `select public.create_child_invite($1) t`, [CHILD])).t;
await as(B, `select public.accept_child_invite($1)`, [tB]);
const tN = (await one(A, `select public.create_child_invite($1) t`, [CHILD])).t;
await as(N, `select public.accept_child_invite($1)`, [tN]);
// The old escalation: any member mints a parent invite. Left open on purpose.
const tOpen = (await one(N, `select public.create_child_invite($1) t`, [CHILD])).t;
const insertEntry = (uid, id, child, text) => as(uid, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
  values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', $4, true)`, [id, child, uid, text]);
const OLD_V4 = (await sys(`select gen_random_uuid() id`)).rows[0].id;  // an id made before UUIDv7 ids
const OLD_V7 = uuid7();
await insertEntry(A, OLD_V4, CHILD, 'She walked.');
await insertEntry(A, OLD_V7, CHILD, 'She laughed.');
const N_OLD = uuid7();
await insertEntry(N, N_OLD, CHILD, 'Hello from N.');
await as(A, `insert into dictionary_terms (owner_id, child_id, term, kind) values ($1, $2, 'Ashu', 'nickname')`, [A, CHILD]);
await sys(`insert into safety_events (author_id, tier) values ($1, 1)`, [A]);
const before = (await sys(`select (select count(*) from children)::int c, (select count(*) from entries)::int e,
  (select count(*) from child_members)::int m, (select count(*) from dictionary_terms)::int d`)).rows[0];

// ── Apply the pending migrations on top ──────────────────────────────────
let applyError = null;
for (const f of pending) {
  try { await db.exec(readFileSync(f, 'utf8')); } catch (e) { applyError = `${basename(f)}: ${e.message}`; break; }
}
if (applyError) console.log(`      ${applyError}`);
check(`all ${pending.length} pending migrations apply on top of seeded data`, applyError === null);

const after = (await sys(`select (select count(*) from children)::int c, (select count(*) from entries)::int e,
  (select count(*) from child_members)::int m, (select count(*) from dictionary_terms)::int d`)).rows[0];
check('no book, letter, membership or dictionary term is lost', JSON.stringify(before) === JSON.stringify(after));
check('old letters get their raw_sha256 backfilled',
  (await sys(`select count(*)::int n from entries where raw_sha256 = sha256(convert_to(raw_transcript, 'UTF8'))`)).rows[0].n === 3);
check('safety_events is dropped (K-06)', (await sys(`select to_regclass('public.safety_events') r`)).rows[0].r === null);
check('the old functions are gone',
  (await sys(`select to_regprocedure('public.create_child(text, date)') a, to_regprocedure('public.create_child_invite(uuid)') b`)).rows
    .every((r) => r.a === null && r.b === null));

// Invites made by the old function.
const inv = async (t) => (await sys(`select accepted_at, revoked_at from child_invites where token_hash = sha256(convert_to($1, 'UTF8'))`, [t])).rows[0];
check('[BL-112] an open invite from the old function is revoked by the upgrade', (await inv(tOpen)).revoked_at !== null);
check('[BL-112] used invites keep their history and are not marked revoked', (await inv(tB)).accepted_at !== null && (await inv(tB)).revoked_at === null);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);
check('[BL-112] the escalation invite cannot be accepted after the upgrade',
  (await codeOf(() => as(C, `select public.accept_child_invite($1)`, [tOpen]))) === 'SCINV');

// Consent gate for people who used the app before file 5.
check('[LEGAL-REQ-001] an existing user without recorded consent is paused (SCCON), not rejected',
  (await codeOf(() => insertEntry(N, uuid7(), CHILD, 'Hello.'))) === 'SCCON');
check('[LEGAL-REQ-009] that user can still delete their own letter', (await codeOf(() => as(N, `select public.delete_entry($1)`, [N_OLD]))) === 'ok');

// Old rows under the new rules.
check('the author still reads an old letter with a pre-v7 id',
  (await as(A, `select 1 from entries where id = $1`, [OLD_V4])).rows.length === 1);
check('the co-parent reads it through book_entries', (await as(B, `select 1 from book_entries where id = $1`, [OLD_V4])).rows.length === 1);
check('an old letter with a pre-v7 id can still be edited (the id check is on insert only)',
  (await codeOf(() => as(A, `update entries set final_text = 'She walked to me.' where id = $1`, [OLD_V4]))) === 'ok');
check('a book made by the old function takes new letters with device ids', (await codeOf(() => insertEntry(A, uuid7(), CHILD, 'New.'))) === 'ok');
check('a parent can invite into an old book with the new function', (await codeOf(() => invite(A, CHILD, 'contributor'))) === 'ok');
const hasDate = (await sys(`select convalidated v from pg_constraint where conname = 'children_has_date'`)).rows[0];
check('children_has_date is added NOT VALID, so an old book without a date survives until APPLY.md step 12',
  hasDate?.v === false && (await sys(`select 1 from children where id = $1`, [NODATE])).rows.length === 1);
check('old dictionary terms fit the new per-book unique index',
  (await sys(`select 1 from pg_indexes where indexname = 'dictionary_terms_owner_child_term_key'`)).rows.length === 1);
check('deleting a user after the upgrade pseudonymises with the Vault pepper',
  (await codeOf(() => sys(`delete from auth.users where id = $1`, [C]))) === 'ok');

done();
