// Access matrix (TDD 04 8.1 SEC-04, LEGAL-REQ-024, B-NFR-003). Every cell runs
// as one persona inside a transaction that is rolled back, so cells never
// affect each other. Personas:
//   parent       A, created the book
//   coparent     B, joined with a parent invite
//   contributor  N, joined with a family invite ("Family can read" off)
//   outsider     C, signed in, consented, not a member
//   anonymous    W, an anonymous sign-in (is_anonymous claim) that IS a
//                contributor member, so the guard is shown not to rely on membership
//   anon         the `anon` role, no JWT
// Expected values: a number = rows visible; 'ok' = succeeded (writes changed a
// row); 'none' = no error but no row changed (RLS filtered it); otherwise the
// SQLSTATE. Structural checks at the end fail when a table or function is
// added without a matrix entry, a guard, or a restrictive anonymous policy.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { db, check, as, sys, one, done, publishPolicies, consent, newChild, invite, join } = h;
const { A, B, C, N, W } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${N}'),('${W}')`);
await publishPolicies();
for (const u of [A, B, C, N]) await consent(u);

const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
await sys(`insert into child_members (child_id, profile_id, role) values ($1, $2, 'contributor')`, [CHILD, W]);
await as(W, `select public.record_policy_act('${uuid7()}', 'contributor-notice', '1.0.0', 'accept', 'web_contributor_page', 'web.send', '1', 'web', null, null, null, '{"age_attested": true}'::jsonb)`, [], { anonymous: true });

let seq = 0;
const letter = async (author, inBook) => {
  const id = `0192f000-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  await as(author, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', $4)`, [id, CHILD, author, inBook]);
  return id;
};
const aBook = await letter(A, true);
const aPrivate = await letter(A, false);
const nSent = await letter(N, true);
const nAdded = await letter(N, true);
await as(B, `select public.review_family_letter($1, 'added')`, [nAdded]);
await as(A, `update entries set final_text = 'She walked to me.' where id=$1`, [aBook]);
const photo = `${CHILD}/${A}/${aBook}.jpg`;
await as(A, `update entries set photo_path=$1 where id=$2`, [photo, aBook]);
await as(A, `insert into storage.objects (bucket_id, name) values ('entry-photos', $1)`, [photo]);
await as(A, `insert into dictionary_terms (owner_id, child_id, term, kind) values ($1, $2, 'Asha', 'child')`, [A, CHILD]);
for (const u of [A, B, N]) await as(u, `insert into child_member_prefs (child_id, profile_id, signs_as) values ($1, $2, 'Papa')`, [CHILD, u]);
await sys(`insert into child_member_prefs (child_id, profile_id) values ($1, $2)`, [CHILD, W]);
const token = await invite(A, CHILD, 'contributor');
const inviteId = (await sys(`select id from child_invites where accepted_at is null order by created_at desc limit 1`)).rows[0].id;
// One row in every service-only table, so "0 rows" means "denied", not "empty".
await sys(`insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('child', $1, 'other', 'T-1', 'ops', '2027-01-01')`, [CHILD]);
await sys(`insert into purge_ledger (entity_type, entity_id) values ('entry', 'x')`);
await sys(`insert into storage_purge_queue (bucket_id, object_path, reason) values ('entry-photos', 'x/', 'orphan')`);
const dreq = (await sys(`insert into deletion_requests (kind, profile_id, status, source, scheduled_for) values ('account', $1, 'cancelled', 'ios', now()) returning id`, [C])).rows[0].id;
await sys(`insert into deletion_request_steps (request_id, step) values ($1, 'auth_user')`, [dreq]);

const PERSONAS = ['parent', 'coparent', 'contributor', 'outsider', 'anonymous', 'anon'];
const UID = { parent: A, coparent: B, contributor: N, outsider: C, anonymous: W };

async function attempt(persona, sql, params) {
  await db.exec('begin');
  try {
    if (persona === 'anon') {
      await db.exec(`select set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '', true); set local role anon;`);
    } else {
      const claims = JSON.stringify({ sub: UID[persona], role: 'authenticated', is_anonymous: persona === 'anonymous' });
      await db.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`, [UID[persona], claims]);
      await db.exec('set local role authenticated');
    }
    const r = await db.query(sql, params);
    return /^\s*(insert|update|delete)/i.test(sql) ? (r.affectedRows > 0 ? 'ok' : 'none') : /^\s*select\s+1\b/i.test(sql) ? r.rows.length : 'ok';
  } catch (e) {
    return e.code ?? 'error';
  } finally {
    await db.exec('rollback');
  }
}

//                                                               parent  coparent contrib outsider anonymous anon
const READS = [
  ['profiles', 'select 1 from profiles', [],                                         [4, 4, 4, 1, 0, 0]],
  ['children', 'select 1 from children where id=$1', [CHILD],                         [1, 1, 0, 0, 0, 0]],
  ['book_children', 'select 1 from book_children where id=$1', [CHILD],               [1, 1, 1, 0, 0, '42501']],
  ['child_members', 'select 1 from child_members where child_id=$1', [CHILD],         [4, 4, 4, 0, 0, 0]],
  ['child_invites', 'select 1 from child_invites where child_id=$1', [CHILD],         [3, 3, 0, 0, 0, 0]],
  ['entries', 'select 1 from entries where child_id=$1', [CHILD],                     [2, 0, 2, 0, 0, 0]],
  ['book_entries', 'select 1 from book_entries where child_id=$1', [CHILD],           [4, 3, 2, 0, 0, '42501']],
  ['entry_versions', 'select 1 from entry_versions', [],                              [1, 0, 1, 0, 0, 0]],
  ['dictionary_terms', 'select 1 from dictionary_terms', [],                          [1, 0, 0, 0, 0, 0]],
  ['child_member_prefs', 'select 1 from child_member_prefs', [],                      [1, 1, 1, 0, 0, 0]],
  ['policy_acceptances', 'select 1 from policy_acceptances', [],                      [2, 2, 2, 2, 0, 0]],
  ['my_policy_state', 'select 1 from my_policy_state', [],                            [2, 2, 2, 2, 0, '42501']],
  ['policy_documents', 'select 1 from policy_documents limit 1', [],                  [1, 1, 1, 1, 1, 1]],
  ['policy_versions', 'select 1 from policy_versions limit 1', [],                    [1, 1, 1, 1, 1, 1]],
  ['audit_events', `select 1 from audit_events where action='invite_created'`, [],    [3, 0, 0, 0, 0, 0]],
  ['deletion_requests', 'select 1 from deletion_requests', [],                        [0, 0, 0, 1, 0, 0]],
  ['deletion_request_steps', 'select 1 from deletion_request_steps', [],              [0, 0, 0, 0, 0, 0]],
  ['legal_holds', 'select 1 from legal_holds', [],                                    [0, 0, 0, 0, 0, 0]],
  ['purge_ledger', 'select 1 from purge_ledger', [],                                  [0, 0, 0, 0, 0, 0]],
  ['storage_purge_queue', 'select 1 from storage_purge_queue', [],                    [0, 0, 0, 0, 0, 0]],
  ['storage: in-book photo', 'select 1 from storage.objects where name=$1', [photo],  [1, 1, 0, 0, 0, 0]],
  ['book_entries: pending family letter', 'select 1 from book_entries where id=$1', [nSent], [1, 1, 1, 0, 0, '42501']],
  ['book_entries: private letter', 'select 1 from book_entries where id=$1', [aPrivate], [1, 0, 0, 0, 0, '42501']],
  // DB-05 / D-039: the birth year and the due date are parents only.
  ['children: date_of_birth and due_date', 'select 1 from children where id=$1 and (date_of_birth is not null or due_date is null)', [CHILD], [1, 1, 0, 0, 0, 0]],
];

const NEW_ID = '0192f000-0000-7000-8000-0000000000ff';
const insertLetter = (author) => [`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text)
  values ('${NEW_ID}', '${CHILD}', '${author}', 'letter', '2026-09-29', now(), 'spoken', 1, 'x', 'x')`, []];
const WRITES = [
  ['entries: insert own letter', null,                                                ['ok', 'ok', 'ok', '42501', 'SCANO', '42501']],
  ['entries: edit A\'s letter', `update entries set final_text='x' where id='${aBook}'`, ['ok', 'none', 'none', 'none', 'none', 'none']],
  ['entries: set approval', `update entries set approval='added' where id='${nSent}'`, ['none', 'none', 'SCAPR', 'none', 'none', 'none']],
  ['entries: hard delete', `delete from entries where id='${aBook}'`,                  ['none', 'none', 'none', 'none', 'none', 'none']],
  ['children: book settings', `update children set nickname='Ashu' where id='${CHILD}'`, ['ok', 'ok', 'none', 'none', 'none', 'none']],
  ['children: insert directly', `insert into children (id, name, date_of_birth) values ('${uuid7()}', 'Asha', '2025-04-12')`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['child_members: add self', `insert into child_members (child_id, profile_id) values ('${CHILD}', auth.uid())`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['child_members: leave', `delete from child_members where child_id='${CHILD}' and profile_id = auth.uid()`, ['ok', 'ok', 'ok', 'none', 'none', 'none']],
  ['child_invites: insert directly', `insert into child_invites (child_id, invited_by, token_hash, role) values ('${CHILD}', auth.uid(), '\\x00', 'parent')`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['dictionary_terms: insert own', `insert into dictionary_terms (owner_id, term, kind) values (auth.uid(), 'Ashu', 'nickname')`, ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
  ['child_member_prefs: edit own', `update child_member_prefs set signs_as='Mumma' where child_id='${CHILD}' and profile_id = auth.uid()`, ['ok', 'ok', 'ok', 'none', 'none', 'none']],
  ['profiles: edit own', `update profiles set signs_as='Papa' where id = auth.uid()`, ['ok', 'ok', 'ok', 'ok', 'none', 'none']],
  ['policy_acceptances: insert directly', `insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform) values (auth.uid(), 'terms', '1.0.0', 'accept', 'signin_sheet', 'x', '1', 'ios')`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['legal_holds: insert', `insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by) values ('child', '${CHILD}', 'other', 'x', 'x', '2027-01-01')`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['storage: upload to own folder', null,                                             ['ok', 'ok', 'ok', '42501', '42501', '42501']],
  // DB-01: every view is read-only for every persona (a write through the
  // definer-owned view would skip RLS, the tombstone rules and the audit log).
  ['book_entries: update A\'s letter', `update book_entries set final_text='x' where id='${aBook}'`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['book_entries: delete A\'s letter', `delete from book_entries where id='${aBook}'`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['book_entries: insert', `insert into book_entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, final_text) values ('${NEW_ID}', '${CHILD}', auth.uid(), 'letter', '2026-09-29', now(), 'spoken', 1, 'x')`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['book_children: update', `update book_children set name='X' where id='${CHILD}'`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  ['book_children: delete', `delete from book_children where id='${CHILD}'`, ['42501', '42501', '42501', '42501', '42501', '42501']],
  // my_policy_state (DISTINCT ON) is not auto-updatable, so Postgres refuses writes
  // with 55000 before checking grants; hardening.test.mjs checks its grants directly.
];

// The server does not enforce Plus (founder decision 3: StoreKit 2 on the device),
// so anyone signed in and consented may start another book.
const RPCS = [
  ['create_child', `select public.create_child('${uuid7()}', 'Asha', '2025-04-12')`,       ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
  ['create_child_invite', `select public.create_child_invite('${uuid7()}', '${CHILD}', 'contributor', sha256(gen_random_uuid()::text::bytea))`, ['ok', 'ok', 'SCPAR', 'SCPAR', 'SCANO', '42501']],
  ['create_child_invite (parent role)', `select public.create_child_invite('${uuid7()}', '${CHILD}', 'parent', sha256(gen_random_uuid()::text::bytea))`, ['ok', 'ok', 'SCPAR', 'SCPAR', 'SCANO', '42501']],
  ['accept_child_invite', `select public.accept_child_invite('${token}')`,               ['SCINV', 'SCINV', 'SCINV', 'ok', 'SCANO', '42501']],
  ['revoke_invite', `select public.revoke_invite('${inviteId}')`,                        ['ok', 'ok', 'P0002', 'P0002', 'SCANO', '42501']],
  ['review_family_letter', `select public.review_family_letter('${nSent}', 'added')`,    ['ok', 'ok', 'P0002', 'P0002', 'SCANO', '42501']],
  ['withdraw_family_letter', `select public.withdraw_family_letter('${nSent}')`,         ['P0002', 'P0002', 'ok', 'P0002', 'SCANO', '42501']],
  ['set_member_auto_add', `select public.set_member_auto_add('${CHILD}', '${N}', true)`, ['ok', 'ok', 'SCPAR', 'SCPAR', 'SCANO', '42501']],
  ['delete_entry', `select public.delete_entry('${aBook}')`,                             ['ok', 'P0002', 'P0002', 'P0002', 'SCANO', '42501']],
  ['restore_entry', `select public.restore_entry('${aBook}')`,                           ['ok', 'P0002', 'P0002', 'P0002', 'SCANO', '42501']],
  ['request_book_deletion', `select public.request_book_deletion('${CHILD}', 'ios')`,    ['ok', 'ok', 'SCPAR', 'SCPAR', 'SCANO', '42501']],
  ['cancel_book_deletion', `select public.cancel_book_deletion('${CHILD}')`,             ['ok', 'ok', 'SCPAR', 'SCPAR', 'SCANO', '42501']],
  ['request_account_deletion', `select * from public.request_account_deletion('ios')`,   ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
  ['cancel_account_deletion', `select public.cancel_account_deletion()`,                 ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
  ['record_policy_act', `select public.record_policy_act('${uuid7()}', 'privacy', '1.0.0', 'acknowledge', 'signin_sheet', 'auth.sheet', '1', 'ios')`, ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
  ['policy_actions_needed', `select * from public.policy_actions_needed()`,              ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
  ['my_sync_gate', `select * from public.my_sync_gate()`,                                ['ok', 'ok', 'ok', 'ok', 'SCANO', '42501']],
];
// Boolean helpers about the caller, used by RLS: callable, but they answer only for the caller.
const HELPERS = {
  'is_child_member(uuid)': [`select public.is_child_member('${CHILD}') v`, [true, true, true, false, true, '42501']],
  'is_child_parent(uuid)': [`select public.is_child_parent('${CHILD}') v`, [true, true, false, false, false, '42501']],
  'child_is_live(uuid)': [`select public.child_is_live('${CHILD}') v`, [true, true, true, true, true, '42501']],
  'can_read_entry_photo(text)': [`select public.can_read_entry_photo('${photo}') v`, [true, true, false, false, false, '42501']],
  'is_anonymous()': [`select public.is_anonymous() v`, [false, false, false, false, true, '42501']],
  'require_user()': [`select public.require_user() is not null v`, [true, true, true, true, 'SCANO', '42501']],
  'my_role_in(uuid)': [`select public.my_role_in('${CHILD}') v`, ['parent', 'parent', 'contributor', null, 'contributor', '42501']],
  'my_auto_add_in(uuid)': [`select public.my_auto_add_in('${CHILD}') v`, [false, false, false, false, false, '42501']],
  'can_write_content()': [`select public.can_write_content() v`, [true, true, true, true, false, '42501']],
  'require_content_consent()': [`select public.require_content_consent()::text = '' v`, [true, true, true, true, 'SCANO', '42501']],
  'is_valid_client_uuid7(uuid)': [`select public.is_valid_client_uuid7('${uuid7()}') v`, [true, true, true, true, true, '42501']],
};
// Service role only (Edge Functions, cron, runbooks).
const SERVICE_ONLY = [
  `select public.purge_due()`, `select public.prepare_account_purge('${dreq}')`, `select public.finalize_account_deletion('${dreq}', '{}')`,
  `select public.record_purge_attempt(1, true)`, `select public.record_deletion_step('${dreq}', 'auth_user', 'done')`,
  `select * from public.content_gate_state('${A}')`, `select public.has_active_consent('${A}', 'terms')`,
  `select public.audit('purge_run', null, null, null)`,
  `select public.enqueue_storage_purge('entry-photos', 'x', false, 'orphan')`, `select public.is_held('child', '${CHILD}')`,
  `select public.entry_is_held('${aBook}')`, `select public.purge_backoff(1)`,
];

const fmt = (v) => (v === null ? 'null' : String(v));
let cells = 0;
const run = async (label, sqlFor, expect) => {
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i];
    const [sql, params] = sqlFor(p);
    const got = await attempt(p, sql, params);
    cells++;
    check(`${label} | ${p}: expected ${fmt(expect[i])}`, fmt(got) === fmt(expect[i]) || console.log(`      got ${fmt(got)}`));
  }
};
for (const [table, sql, params, expect] of READS) await run(`read ${table}`, () => [sql, params], expect);
for (const [name, sql, expect] of WRITES) {
  const sqlFor = (p) => {
    const uid = UID[p] ?? A;
    if (name.startsWith('entries: insert')) return insertLetter(uid);
    if (name.startsWith('storage: upload')) return [`insert into storage.objects (bucket_id, name) values ('entry-photos', '${CHILD}/${uid}/${NEW_ID}.jpg')`, []];
    return [sql, []];
  };
  await run(`write ${name}`, sqlFor, expect);
}
for (const [name, sql, expect] of RPCS) await run(`rpc ${name}`, () => [sql, []], expect);
for (const [name, [sql, expect]] of Object.entries(HELPERS)) {
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i];
    await db.exec('begin');
    let got;
    try {
      if (p === 'anon') await db.exec(`set local role anon`);
      else {
        await db.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`,
          [UID[p], JSON.stringify({ sub: UID[p], is_anonymous: p === 'anonymous' })]);
        await db.exec('set local role authenticated');
      }
      got = (await db.query(sql)).rows[0].v;
    } catch (e) { got = e.code; } finally { await db.exec('rollback'); }
    cells++;
    check(`helper ${name} | ${p}: expected ${fmt(expect[i])}`, fmt(got) === fmt(expect[i]) || console.log(`      got ${fmt(got)}`));
  }
}
for (const sql of SERVICE_ONLY) {
  const name = sql.match(/public\.(\w+)/)[1];
  const got = [];
  for (const p of ['parent', 'anonymous', 'anon']) got.push(await attempt(p, sql, []));
  cells += 3;
  check(`service-only ${name}: refused for users, anonymous and anon`, got.every((g) => g === '42501') || console.log(`      got ${got}`));
}

// "Family can read the book" on: contributors read in-book letters (B-REQ-011).
await sys(`update children set family_can_read = true where id=$1`, [CHILD]);
await run('read book_entries (family can read on)', () => ['select 1 from book_entries where child_id=$1', [CHILD]], [4, 3, 3, 0, 0, '42501']);
await run('read storage: in-book photo (family can read on)', () => ['select 1 from storage.objects where name=$1', [photo]], [1, 1, 1, 0, 0, 0]);
console.log(`      ${cells} matrix cells`);

// ── Structural checks (TDD 04 3.5.3 rules 1 to 4) ────────────────────────
const tables = (await sys(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p', 'v') order by 1`)).rows.map((r) => r.relname);
const covered = new Set(READS.map((r) => r[0]));
const missing = tables.filter((t) => !covered.has(t));
for (const t of missing) console.log(`      no matrix row: public.${t}`);
check('[LEGAL-REQ-024] every public table and view has a row in the access matrix', missing.length === 0);

const fns = (await sys(`select p.oid, p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' sig, p.proname name,
    p.prosecdef secdef, p.prosrc src, coalesce(array_to_string(p.proconfig, ','), '') cfg,
    has_function_privilege('authenticated', p.oid, 'execute') auth_x, has_function_privilege('anon', p.oid, 'execute') anon_x
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f'`)).rows;
const rpcNames = new Set(RPCS.map((r) => r[0].split(' ')[0]));
const helperSigs = new Set(Object.keys(HELPERS).map((s) => s.replace(/\s/g, '')));
const sigOf = (f) => `${f.name}(${f.sig.slice(f.name.length + 1, -1).split(',').map((a) => a.trim().split(' ').pop()).filter(Boolean).join(',')})`;
const unlisted = fns.filter((f) => f.auth_x && !rpcNames.has(f.name) && !helperSigs.has(sigOf(f)));
for (const f of unlisted) console.log(`      callable by authenticated but not in the matrix: ${f.sig}`);
check('every function callable by signed-in users is an RPC or helper in the matrix', unlisted.length === 0);
const anonX = fns.filter((f) => f.anon_x);
for (const f of anonX) console.log(`      callable by anon: ${f.sig}`);
check('no public function is callable by the anon role', anonX.length === 0);
const noPath = fns.filter((f) => f.secdef && !/search_path=/.test(f.cfg));
for (const f of noPath) console.log(`      security definer without search_path: ${f.sig}`);
check('every security definer function pins search_path', noPath.length === 0);
const unguarded = fns.filter((f) => f.auth_x && rpcNames.has(f.name) && !/require_user\(\)/.test(f.src) && !/is_anonymous\(\)/.test(f.src));
for (const f of unguarded) console.log(`      RPC without the anonymous guard: ${f.sig}`);
check('[K-08] every RPC starts with require_user() or checks is_anonymous()', unguarded.length === 0);

const policies = (await sys(`select tablename, permissive, array_to_string(roles, ',') roles, coalesce(qual, '') || coalesce(with_check, '') expr
  from pg_policies where schemaname = 'public'`)).rows;
const clientTables = [...new Set(policies.filter((p) => p.permissive === 'PERMISSIVE' && p.roles.includes('authenticated')).map((p) => p.tablename))]
  .filter((t) => !['policy_documents', 'policy_versions'].includes(t));
const unguardedTables = clientTables.filter((t) => !policies.some((p) => p.tablename === t && p.permissive === 'RESTRICTIVE' && /is_anonymous/.test(p.expr)));
for (const t of unguardedTables) console.log(`      no restrictive anonymous policy: public.${t}`);
check('[K-08] every client-visible table has a restrictive anonymous-session policy', clientTables.length >= 10 && unguardedTables.length === 0);
check('[K-08] the photo bucket has a restrictive anonymous-session policy',
  (await sys(`select 1 from pg_policies where schemaname='storage' and tablename='objects' and permissive='RESTRICTIVE' and qual ~ 'is_anonymous'`)).rows.length === 1);

done();
