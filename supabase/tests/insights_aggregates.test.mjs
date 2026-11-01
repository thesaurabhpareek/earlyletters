// Insights aggregates (20261004300000_insights_aggregates.sql; TRACKING_PLAN 4;
// docs/analytics/INSIGHTS_LOOP.md). Proves: counts only, no ids or text in any
// output; every published count is 0 or at least 10; parts are suppressed when
// their remainder is 1 to 9; family resolution through shared parents; each
// metric on a known seed; language mix merges small languages into 'other';
// only service_role and insights_reader can read.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb } from './harness.mjs';

const { db, check, sys, as, asAnon, codeOf, done } = await createDb(process.argv.slice(2));

// ── Seed (triggers off: bulk fixture load, as in perf.test.mjs) ─────────────
// W(k) = start of the ISO week k weeks ago (UTC). Letters at W(k) + 1 day 12 h.
const W = (k, plus = '1 day 12 hours') =>
  `((date_trunc('week', now() at time zone 'UTC') - interval '${k} weeks' + interval '${plus}') at time zone 'UTC')`;
const id = (tag, n) => `'00000000-0000-4000-${tag}-${String(n).padStart(12, '0')}'::uuid`;
const A = (f) => id('a000', f); // parent
const B = (f) => id('b000', f); // co-parent (families 1 to 15)
const N = (f) => id('c000', f); // contributor (families 1 to 3)
const U = (f) => id('e000', f); // account with no letters
const C = (f) => id('d000', f); // book
const C2 = (f) => id('d100', f); // second book (family 1: A's own; family 2: B's own)
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

let entryN = 0;
const letter = (book, author, k, { mode = 'spoken', inBook = true, approval = 'not_needed' } = {}) => {
  entryN++;
  return `(${id('f000', entryN)}, ${book}, ${author}, 'letter', ${W(k)}::date, ${W(k)}, '${mode}', 1,
    'Asha laughed at the dog today', 'Asha laughed at the dog today', '[]'::jsonb, ${inBook}, '${approval}', ${W(k)})`;
};

const users = [
  ...range(1, 30).map((f) => [A(f), f <= 12 ? W(3, '1 day') : W(1, '1 day')]),
  ...range(1, 15).map((f) => [B(f), W(1, '1 day')]),
  ...range(1, 3).map((f) => [N(f), W(1, '1 day')]),
  ...range(1, 5).map((f) => [U(f), W(1, '1 day')]),
];
const books = [...range(1, 30).map((f) => [C(f), A(f)]), [C2(1), A(1)], [C2(2), B(2)]];
const members = [
  ...range(1, 30).map((f) => [C(f), A(f), 'parent']),
  ...range(1, 15).map((f) => [C(f), B(f), 'parent']),
  ...range(1, 3).map((f) => [C(f), N(f), 'contributor']),
  [C2(1), A(1), 'parent'],
  [C2(2), B(2), 'parent'],
];
const letters = [
  // Week 3: families 1 to 12, in the book, spoken.
  ...range(1, 12).map((f) => letter(C(f), A(f), 3)),
  // Week 2: families 1 to 5 only (below k).
  ...range(1, 5).map((f) => letter(C(f), A(f), 2)),
  // Week 1: 25 families. A writes (book for 1 to 20, private for 21 to 25), B types for 1 to 15,
  // A of family 1 and B of family 2 also write in their own second books, contributors 1 to 3 type.
  ...range(1, 25).map((f) => letter(C(f), A(f), 1, { inBook: f <= 20 })),
  ...range(1, 15).map((f) => letter(C(f), B(f), 1, { mode: 'typed' })),
  letter(C2(1), A(1), 1),
  letter(C2(2), B(2), 1, { mode: 'typed' }),
  ...range(1, 3).map((f) => letter(C(f), N(f), 1, { mode: 'typed', inBook: false, approval: 'pending' })),
];
let inviteN = 0;
const invite = (child, by, role, k, acceptedBy) => {
  inviteN++;
  return `(${id('9000', inviteN)}, ${child}, ${by}, sha256(convert_to('invite-${inviteN}', 'UTF8')), '${role}', ${W(k, '1 day')} + interval '14 days',
    ${acceptedBy ?? 'null'}, ${acceptedBy ? `${W(k, '1 day')} + interval '2 hours'` : 'null'}, ${W(k, '1 day')} - interval '1 hour')`;
};
const invites = [
  ...range(1, 15).map((f) => invite(C(f), A(f), 'parent', 1, B(f))),
  ...range(16, 30).map((f) => invite(C(f), A(f), 'parent', 1, null)),
  ...range(1, 3).map((f) => invite(C(f), A(f), 'contributor', 1, N(f))),
];

await db.exec(`
  set session_replication_role = replica;
  insert into auth.users (id) values ${users.map(([u]) => `(${u})`).join(', ')};
  insert into profiles (id, signs_as, created_at) values ${users.map(([u, at]) => `(${u}, 'Papa', ${at})`).join(', ')};
  insert into children (id, name, date_of_birth, created_by) values ${books.map(([c, by]) => `(${c}, 'Asha', date '2025-04-12', ${by})`).join(', ')};
  insert into child_members (child_id, profile_id, role) values ${members.map(([c, p, r]) => `(${c}, ${p}, '${r}')`).join(', ')};
  insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
                       raw_transcript, final_text, machine_edits, in_book, approval, created_at)
    values ${letters.join(',\n')};
  insert into child_invites (id, child_id, invited_by, token_hash, role, expires_at, accepted_by, accepted_at, created_at)
    values ${invites.join(',\n')};
  set session_replication_role = origin;
`);

const rows = async (view, where = '') => (await sys(`select * from insights.${view} ${where}`)).rows;
const weekOf = async (k) => (await sys(`select (date_trunc('week', now() at time zone 'UTC') - interval '${k} weeks')::date::text as d`)).rows[0].d;
const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
const at = async (view, col, k, extra = '') => (await rows(view, `where ${col} = '${await weekOf(k)}' ${extra}`))[0];
const PUBLISHED = ['weekly_keeping_families', 'letters_per_active_family', 'first_letter_conversion', 'family_invites', 'retention_cohorts', 'language_mix'];

// ── Shape: no ids, no free text, every column classified L2 ────────────────
const cols = (await sys(`
  select c.relname rel, a.attname col, format_type(a.atttypid, a.atttypmod) typ, col_description(c.oid, a.attnum) cmt
    from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = c.oid
   where n.nspname = 'insights' and c.relkind = 'v' and c.relname not like '\\_%' and a.attnum > 0`)).rows;
check('the six published views exist', PUBLISHED.every((v) => cols.some((c) => c.rel === v)));
check('every published column is classified L2', cols.length > 0 && cols.every((c) => /^L2\b/.test(c.cmt ?? '')) || console.log(cols.filter((c) => !/^L2\b/.test(c.cmt ?? ''))));
check('no published column is an id, a uuid or a timestamp', cols.every((c) => !/uuid|timestamp/.test(c.typ) && !/(^|_)id$|_key$/.test(c.col)));
check('the only text columns are enums (role, lang)', cols.filter((c) => c.typ === 'text').every((c) => ['role', 'lang'].includes(c.col)));

// ── Access ─────────────────────────────────────────────────────────────────
const parent = '00000000-0000-4000-a000-000000000001';
check('signed-in users cannot read insights views', (await codeOf(() => as(parent, 'select * from insights.weekly_keeping_families'))) === '42501');
check('anon cannot read insights views', (await codeOf(() => asAnon('select * from insights.weekly_keeping_families'))) === '42501');
check('signed-in users cannot call insights_aggregates', (await codeOf(() => as(parent, 'select public.insights_aggregates(4)'))) === '42501');
check('anon cannot call insights_aggregates', (await codeOf(() => asAnon('select public.insights_aggregates(4)'))) === '42501');
const asRole = async (role, sql) => {
  await sys(`set role ${role}`);
  try { return await sys(sql); } finally { await sys('reset role'); }
};
check('insights_reader reads the published views', (await codeOf(() => asRole('insights_reader', 'select * from insights.weekly_keeping_families'))) === 'ok');
check('insights_reader reads language_mix through its definer function', (await codeOf(() => asRole('insights_reader', 'select * from insights.language_mix'))) === 'ok');
check('insights_reader calls insights_aggregates', (await codeOf(() => asRole('insights_reader', 'select public.insights_aggregates(4)'))) === 'ok');
check('insights_reader cannot read internal views', (await codeOf(() => asRole('insights_reader', 'select * from insights._letters'))) === '42501');
check('insights_reader cannot call the raw language counts', (await codeOf(() => asRole('insights_reader', 'select * from insights._language_counts()'))) === '42501');
check('insights_reader cannot read base tables', (await codeOf(() => asRole('insights_reader', 'select count(*) from public.entries'))) === '42501');
check('service_role calls insights_aggregates', (await codeOf(() => asRole('service_role', 'select public.insights_aggregates(4)'))) === 'ok');
check('no public function is executable by anon (structural rule holds)',
  !(await sys(`select has_function_privilege('anon', 'public.insights_aggregates(int)', 'execute') ok`)).rows[0].ok);

// ── k-anonymity across every published cell ───────────────────────────────
const COUNT_COLS = /^(families|families_with_book_letter|letters|spoken_letters|typed_letters|active_families|families_two_plus_voices|new_accounts|first_letter_d1|first_letter_d7|first_letter_d30|sent|accepted|accepted_within_7d|cohort_writers|active_writers)$/;
const bad = [];
for (const v of PUBLISHED) {
  for (const r of await rows(v)) {
    for (const [k, val] of Object.entries(r)) {
      if (COUNT_COLS.test(k) && val !== null && Number(val) !== 0 && Number(val) < 10) bad.push(`${v}.${k}=${val}`);
    }
  }
}
check('[k=10] no published count is between 1 and 9', bad.length === 0 || console.log(`      ${bad.join(', ')}`));

// ── 1. Weekly keeping families ─────────────────────────────────────────────
const w1 = await at('weekly_keeping_families', 'week', 1);
const w2 = await at('weekly_keeping_families', 'week', 2);
const w3 = await at('weekly_keeping_families', 'week', 3);
check('WKF counts families, folding co-parents and second books into one family (25)', Number(w1.families) === 25);
check('WKF letters: 25 + 15 + 2 + 3 = 45', Number(w1.letters) === 45);
check('mode split published when both parts are at least 10 (26 spoken, 19 typed)', Number(w1.spoken_letters) === 26 && Number(w1.typed_letters) === 19);
check('families with a book letter suppressed when the remainder is 5 (20 of 25)', w1.families_with_book_letter === null);
check('a week with 5 families is suppressed entirely', w2.families === null && w2.letters === null);
check('a remainder of 0 is publishable (12 of 12 in the book)', Number(w3.families) === 12 && Number(w3.families_with_book_letter) === 12);
check('completed weeks are flagged', w1.complete === true);

// ── 2. Letters per active family ───────────────────────────────────────────
const l1 = await at('letters_per_active_family', 'week', 1);
check('letters per active family: mean 1.8 over 25 families', Number(l1.active_families) === 25 && Number(l1.letters_per_family_mean) === 1.8);
check('two or more voices: 15 families (remainder 10)', Number(l1.families_two_plus_voices) === 15);
check('statistics hidden below k', (await at('letters_per_active_family', 'week', 2)).letters_per_family_mean === null);

// ── 3. First-letter conversion ─────────────────────────────────────────────
const f3 = await at('first_letter_conversion', 'cohort_week', 3);
const f1 = await at('first_letter_conversion', 'cohort_week', 1);
check('sign-up cohort of 12 all wrote within a day', Number(f3.new_accounts) === 12 && Number(f3.first_letter_d1) === 12);
check('sign-up cohort of 41: 31 wrote within a day (remainder 10)', Number(f1.new_accounts) === 41 && Number(f1.first_letter_d1) === 31 && Number(f1.first_letter_d7) === 31);

// ── 4. Family invites ──────────────────────────────────────────────────────
const co = await at('family_invites', 'week', 1, `and role = 'co_parent'`);
const ct = await at('family_invites', 'week', 1, `and role = 'contributor'`);
check('co-parent invites: 30 sent, 15 accepted, 15 within 7 days', Number(co.sent) === 30 && Number(co.accepted) === 15 && Number(co.accepted_within_7d) === 15);
check('contributor invites below k are suppressed', ct.sent === null && ct.accepted === null);

// ── 5. Retention ────────────────────────────────────────────────────────────
const r3 = await rows('retention_cohorts', `where cohort_week = '${await weekOf(3)}' order by week_offset`);
const cell = (off) => r3.find((r) => r.week_offset === off);
check('cohort of 12 first-letter writers', Number(cell(0)?.cohort_writers) === 12 && Number(cell(0)?.active_writers) === 12);
check('week 1 activity of 5 is suppressed', cell(1)?.active_writers === null);
check('week 2: all 12 back (remainder 0)', Number(cell(2)?.active_writers) === 12);
check('the current, unfinished week is not a retention cell', !r3.some((r) => r.week_offset === 3));
const r1 = await rows('retention_cohorts', `where cohort_week = '${await weekOf(1)}'`);
check('cohort of 31 writers in week 1 (13 A, 15 B, 3 contributors)', r1.length === 1 && Number(r1[0].cohort_writers) === 31);

// ── 6. Language mix ─────────────────────────────────────────────────────────
let agg = (await sys('select public.insights_aggregates(8) j')).rows[0].j;
check('language mix is available (entries.language, 20261005000000) and empty while no letter has a language',
  agg.language_mix.available === true && agg.language_mix.rows.length === 0);
// Fill entries.language (closed list of seven codes) to prove the merge rule.
await db.exec(`
  set session_replication_role = replica;
  update entries set language = 'en' where author_id in (select id from profiles where id::text like '00000000-0000-4000-a000-%')
    and captured_at >= ${W(1, '0 hours')};
  update entries set language = 'hi' where author_id in (${range(21, 25).map(A).join(', ')}) and captured_at >= ${W(1, '0 hours')};
  update entries set language = 'es' where author_id in (${range(1, 12).map(B).join(', ')});
  update entries set language = 'pt' where author_id in (${range(13, 15).map(B).join(', ')});
  update entries set language = 'fr' where author_id in (${range(1, 3).map(N).join(', ')});
  update entries set language = 'en' where captured_at < ${W(1, '0 hours')};
  set session_replication_role = origin;
`);
const lm1 = await rows('language_mix', `where week = '${await weekOf(1)}' order by lang`);
check('language mix: en 20, es 12, and hi 5 + pt 3 + fr 3 merged into other 11',
  JSON.stringify(lm1.map((r) => [r.lang, Number(r.families)])) === JSON.stringify([['en', 20], ['es', 12], ['other', 11]])
  || console.log(`      got ${JSON.stringify(lm1)}`));
check('language mix: a week of 12 English families stands alone',
  JSON.stringify((await rows('language_mix', `where week = '${await weekOf(3)}'`)).map((r) => [r.lang, Number(r.families)])) === JSON.stringify([['en', 12]]));
check('language mix: a week of 5 families is not published', (await rows('language_mix', `where week = '${await weekOf(2)}'`)).length === 0);
check('language mix: only v1.0 codes or other', (await rows('language_mix')).every((r) => ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt', 'other'].includes(r.lang)));

// ── Read path: one JSON document, content-free ──────────────────────────────
agg = (await sys('select public.insights_aggregates(8) j')).rows[0].j;
check('insights_aggregates returns every section', ['weekly_keeping_families', 'letters_per_active_family', 'first_letter_conversion',
  'family_invites', 'retention_cohorts', 'language_mix'].every((k) => k in agg) && agg.k_min === 10 && agg.language_mix.available === true);
const text = JSON.stringify(agg);
check('output never contains letter text, names, uuids or emails',
  !/Asha|laughed|Papa|@/.test(text) && !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text));
const one = (await sys('select public.insights_aggregates(1) j')).rows[0].j;
check('p_weeks limits the window', one.weekly_keeping_families.every((r) => iso(r.week) >= iso(one.since)) && one.weekly_keeping_families.length <= 2);
check('p_weeks is clamped', (await codeOf(() => sys('select public.insights_aggregates(100000)'))) === 'ok' && (await codeOf(() => sys('select public.insights_aggregates(null)'))) === 'ok');

done();
