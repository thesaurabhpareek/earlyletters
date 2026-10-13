// Differencing attacks on the insights views (G-20, security review L12;
// migration 20261005200000_insights_differencing.sql).
//
// Each scenario plants a small group (3 accounts or families) that the
// pre-G-20 views exposed by subtracting two published counts, checks that the
// raw data really holds the small group (so the attack is real), then runs the
// attack against what is published now and expects it to fail. A final sweep
// tries every nested pair in every published row. Fictional family "Asha" only.
import { createDb } from './harness.mjs';

const { db, check, sys, done } = await createDb(process.argv.slice(2));
const K = 10;
const small = (n) => n !== null && n !== undefined && Number(n) > 0 && Number(n) < K;

// W(k, plus): start of the ISO week k weeks ago (UTC) plus an offset.
const W = (k, plus = '1 day') =>
  `((date_trunc('week', now() at time zone 'UTC') - interval '${k} weeks' + interval '${plus}') at time zone 'UTC')`;
const id = (tag, n) => `'00000000-0000-4000-${tag}-${String(n).padStart(12, '0')}'::uuid`;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const weekOf = async (k) => (await sys(`select (date_trunc('week', now() at time zone 'UTC') - interval '${k} weeks')::date::text d`)).rows[0].d;

// ── Seed ────────────────────────────────────────────────────────────────────
// Scenario A (week 8 sign-ups): 30 accounts; 15 write within a day, 3 more on day 4, 12 never.
//   d7 - d1 = 3 accounts.
// Scenario B (week 7 invites): 30 parent invites; 17 accepted within 7 days, 3 more on day 10, 10 open.
//   accepted - accepted_within_7d = 3 invites.
// Scenario C (week 5 letters): 25 families; 22 letters tagged 'en', 3 families' letters untagged.
//   families - families with a language = 3.
// Scenario D (week 4 letters): 20 families tagged 'en'; 3 of them also wrote in 'es'.
//   sum of language rows - families = 3 bilingual families.
// Scenario E (week 3 letters): the safe case. 25 families: 15 'en', 10 'hi', none untagged, none bilingual.
const P = (s, n) => id(s, n);
const users = [
  ...range(1, 30).map((n) => [P('a100', n), W(8)]),
  ...range(1, 30).map((n) => [P('b100', n), W(7)]),
  ...range(1, 30).map((n) => [P('b200', n), W(7)]),
  ...range(1, 25).map((n) => [P('c100', n), W(6)]),
  ...range(1, 20).map((n) => [P('d100', n), W(6)]),
  ...range(1, 25).map((n) => [P('e100', n), W(6)]),
];
const books = users.map(([u], i) => [id('d900', i + 1), u]);
const bookOf = new Map(books.map(([c, u]) => [u, c]));

let entryN = 0;
const letters = [];
const letter = (author, at, lang = null) => {
  entryN++;
  letters.push(`(${id('f900', entryN)}, ${bookOf.get(author)}, ${author}, 'letter', (${at})::date, ${at}, 'spoken', 1,
    'Asha laughed at the dog today', 'Asha laughed at the dog today', '[]'::jsonb, true, 'not_needed', ${at}, ${lang ? `'${lang}'` : 'null'})`);
};
// A: 15 within a day, 3 on day 4.
range(1, 15).forEach((n) => letter(P('a100', n), W(8, '1 day 6 hours')));
range(16, 18).forEach((n) => letter(P('a100', n), W(8, '4 days')));
// C: week 5.
range(1, 22).forEach((n) => letter(P('c100', n), W(5, '2 days'), 'en'));
range(23, 25).forEach((n) => letter(P('c100', n), W(5, '2 days')));
// D: week 4.
range(1, 20).forEach((n) => letter(P('d100', n), W(4, '2 days'), 'en'));
range(1, 3).forEach((n) => letter(P('d100', n), W(4, '3 days'), 'es'));
// E: week 3.
range(1, 15).forEach((n) => letter(P('e100', n), W(3, '2 days'), 'en'));
range(16, 25).forEach((n) => letter(P('e100', n), W(3, '2 days'), 'hi'));

let inviteN = 0;
const invites = [];
// B: inviter b100-n, accepted by b200-n.
range(1, 30).forEach((n) => {
  inviteN++;
  const accepted = n <= 17 ? `${W(7)} + interval '2 days'` : n <= 20 ? `${W(7)} + interval '10 days'` : null;
  invites.push(`(${id('9900', inviteN)}, ${bookOf.get(P('b100', n))}, ${P('b100', n)}, sha256(convert_to('g20-${inviteN}', 'UTF8')), 'parent',
    ${W(7)} + interval '14 days', ${accepted ? P('b200', n) : 'null'}, ${accepted ?? 'null'}, ${W(7)})`);
});

await db.exec(`
  set session_replication_role = replica;
  insert into auth.users (id) values ${users.map(([u]) => `(${u})`).join(', ')};
  insert into profiles (id, signs_as, created_at) values ${users.map(([u, at]) => `(${u}, 'Papa', ${at})`).join(', ')};
  insert into children (id, name, date_of_birth, created_by) values ${books.map(([c, u]) => `(${c}, 'Asha', date '2025-05-20', ${u})`).join(', ')};
  insert into child_members (child_id, profile_id, role) values ${books.map(([c, u]) => `(${c}, ${u}, 'parent')`).join(', ')};
  insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
                       raw_transcript, final_text, machine_edits, in_book, approval, created_at, language)
    values ${letters.join(',\n')};
  insert into child_invites (id, child_id, invited_by, token_hash, role, expires_at, accepted_by, accepted_at, created_at)
    values ${invites.join(',\n')};
  set session_replication_role = origin;
`);

const rows = async (view, where = '') => (await sys(`select * from insights.${view} ${where}`)).rows;

// ── k_chain itself ──────────────────────────────────────────────────────────
const chain = async (parts, total) => (await sys(`select insights.k_chain($1::bigint[], $2::bigint) c`, [parts, total])).rows[0].c;
check('k_chain publishes a safe chain unchanged (12, 31, 31 of 41)', JSON.stringify(await chain([12, 31, 31], 41)) === JSON.stringify([12, 31, 31]));
check('k_chain drops the part 3 above the last one (15, 18 of 30)', JSON.stringify(await chain([15, 18, 18], 30)) === JSON.stringify([15, null, null]));
check('k_chain drops a part within k of the total (15, 25 of 30)', JSON.stringify(await chain([15, 25], 30)) === JSON.stringify([15, null]));
check('k_chain measures from the last published part (5, 12, 22 of 40: 22 - 0 is safe)', JSON.stringify(await chain([5, 12, 22], 40)) === JSON.stringify([null, 12, 22]));
check('k_chain publishes nothing under a total below k', JSON.stringify(await chain([3, 5], 8)) === JSON.stringify([null, null]));

// ── A. First-letter conversion: d7 - d1 ─────────────────────────────────────
const rawA = (await sys(`
  select count(*) filter (where e.first_at <= p.created_at + interval '1 day') d1,
         count(*) filter (where e.first_at <= p.created_at + interval '7 days') d7
    from profiles p left join (select author_id, min(created_at) first_at from entries group by 1) e on e.author_id = p.id
   where p.id::text like '00000000-0000-4000-a100-%'`)).rows[0];
check('A: the planted group is real (raw d7 - d1 = 3)', Number(rawA.d7) - Number(rawA.d1) === 3);
const a = (await rows('first_letter_conversion', `where cohort_week = '${await weekOf(8)}'`))[0];
check('A: the cohort and its day-1 count are still published (30, 15)', Number(a.new_accounts) === 30 && Number(a.first_letter_d1) === 15);
check('A: attack fails, d7 - d1 cannot be computed (d7 suppressed)', a.first_letter_d7 === null || !small(Number(a.first_letter_d7) - Number(a.first_letter_d1)));
check('A: nor through d30', a.first_letter_d30 === null || !small(Number(a.first_letter_d30) - Number(a.first_letter_d1)));

// ── B. Invites: accepted - accepted_within_7d ───────────────────────────────
const b = (await rows('family_invites', `where week = '${await weekOf(7)}' and role = 'co_parent'`))[0];
check('B: the planted group is real (20 accepted, 17 within 7 days)',
  Number((await sys(`select count(*) n from child_invites where id::text like '00000000-0000-4000-9900-%' and accepted_at is not null`)).rows[0].n) === 20);
check('B: sent and accepted within 7 days are still published (30, 17)', Number(b.sent) === 30 && Number(b.accepted_within_7d) === 17);
check('B: attack fails, accepted - accepted_within_7d cannot be computed', b.accepted === null || !small(Number(b.accepted) - Number(b.accepted_within_7d)));

// ── C. Language mix against the week's families: untagged families ─────────
const families = async (k) => Number((await rows('weekly_keeping_families', `where week = '${await weekOf(k)}'`))[0].families);
const langRows = async (k) => rows('language_mix', `where week = '${await weekOf(k)}' order by lang`);
const sum = (rs) => rs.reduce((n, r) => n + Number(r.families), 0);
check('C: the week has 25 families, 3 without a language', (await families(5)) === 25);
const c = await langRows(5);
check('C: attack fails, families - sum(language rows) is never 1 to 9', !small((await families(5)) - sum(c)) || c.length === 0);
check('C: the week is suppressed', c.length === 0);

// ── D. Language mix: bilingual families ─────────────────────────────────────
check('D: the week has 20 families', (await families(4)) === 20);
const d = await langRows(4);
check('D: attack fails, sum(language rows) - families is never 1 to 9', !small(sum(d) - (await families(4))) || d.length === 0);
check('D: the week is suppressed', d.length === 0);

// ── E. The safe week still reports ──────────────────────────────────────────
const e = await langRows(3);
check('E: a clean week is published as before (en 15, hi 10)',
  JSON.stringify(e.map((r) => [r.lang, Number(r.families)])) === JSON.stringify([['en', 15], ['hi', 10]]) || console.log(`      got ${JSON.stringify(e)}`));
check('E: and its rows add up to the week\'s families', sum(e) === (await families(3)));

// ── Sweep: every nested pair in every published row ─────────────────────────
const NESTED = {
  weekly_keeping_families: [['families_with_book_letter', 'families'], ['spoken_letters', 'letters'], ['typed_letters', 'letters']],
  letters_per_active_family: [['families_two_plus_voices', 'active_families']],
  first_letter_conversion: [['first_letter_d1', 'first_letter_d7'], ['first_letter_d7', 'first_letter_d30'], ['first_letter_d1', 'first_letter_d30'],
    ['first_letter_d1', 'new_accounts'], ['first_letter_d7', 'new_accounts'], ['first_letter_d30', 'new_accounts']],
  family_invites: [['accepted_within_7d', 'accepted'], ['accepted', 'sent'], ['accepted_within_7d', 'sent']],
  retention_cohorts: [['active_writers', 'cohort_writers']],
};
const leaks = [];
for (const [view, pairs] of Object.entries(NESTED)) {
  for (const r of await rows(view)) {
    for (const [part, whole] of pairs) {
      if (r[part] === null || r[whole] === null) continue;
      if (small(Number(r[whole]) - Number(r[part]))) leaks.push(`${view}.${whole} - ${part} = ${Number(r[whole]) - Number(r[part])}`);
    }
  }
}
check('[k=10] no difference of two nested published counts is 1 to 9', leaks.length === 0 || console.log(`      ${leaks.join('; ')}`));
check('[k=10] same population, same count: weekly families equal active families',
  Number((await sys(`select count(*) n from insights.weekly_keeping_families w join insights.letters_per_active_family l using (week)
               where w.families is distinct from l.active_families`)).rows[0].n) === 0);

// ── Access and shape are unchanged ──────────────────────────────────────────
const asReader = async (sql) => {
  await sys('set role insights_reader');
  try { return await sys(sql); } finally { await sys('reset role'); }
};
let readerOk = true;
try { await asReader('select * from insights.first_letter_conversion, insights.family_invites, insights.language_mix limit 1'); } catch { readerOk = false; }
check('insights_reader still reads the replaced views', readerOk);
const cmt = (await sys(`select col_description('insights.family_invites'::regclass, 4) c`)).rows[0].c;
check('column classifications survive the replace', /^L2\b/.test(cmt ?? ''));
check('k_chain is not callable by signed-in users',
  !(await sys(`select has_function_privilege('authenticated', 'insights.k_chain(bigint[], bigint)', 'execute') ok`)).rows[0].ok);

done();
