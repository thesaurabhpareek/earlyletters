// Classification gate (PRD 7.10, PRD-REQ-010, LEGAL-REQ-012, LEGAL-REQ-024).
// Fails when any column of any table or view in `public` lacks a comment that
// starts with its level (L1 to L4), or when a public table has RLS off.
// Levels and handling: docs/legal/DATA_CLASSIFICATION.md.
import { createDb } from './harness.mjs';

const { check, sys, done } = await createDb(process.argv.slice(2));

const cols = (await sys(`
  select c.relname as rel, c.relkind as kind, a.attname as col, col_description(c.oid, a.attnum) as comment
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
   where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
     and a.attnum > 0 and not a.attisdropped
   order by c.relname, a.attnum`)).rows;

const LEVEL = /^L([1-4])\b/;
const missing = cols.filter((r) => !LEVEL.test(r.comment ?? ''));
for (const m of missing) console.log(`      unclassified: public.${m.rel}.${m.col}`);
check(`every public column has an L1 to L4 comment (${cols.length} columns)`, cols.length > 0 && missing.length === 0);

// Content columns must be L4 (PRD 7.10): a rename or new copy cannot slip through as L2/L3.
const mustBeL4 = ['raw_transcript', 'final_text', 'machine_edits', 'stt_meta', 'search', 'term', 'heard_as', 'raw_sha256', 'name', 'date_of_birth', 'due_date', 'nickname'];
const weak = cols.filter((r) => mustBeL4.includes(r.col) && !['policy_documents', 'policy_versions'].includes(r.rel) && !/^L4\b/.test(r.comment ?? ''));
for (const w of weak) console.log(`      content column below L4: public.${w.rel}.${w.col} (${w.comment})`);
check('content, child identity and dictionary columns are L4', weak.length === 0);

// Person identifiers are at least L3.
const personIds = ['author_id', 'profile_id', 'owner_id', 'created_by', 'invited_by', 'accepted_by', 'actor_id', 'superseded_by'];
const weakIds = cols.filter((r) => personIds.includes(r.col) && !/^L[34]\b/.test(r.comment ?? ''));
for (const w of weakIds) console.log(`      person id below L3: public.${w.rel}.${w.col}`);
check('person identifiers are L3 or higher', weakIds.length === 0);

const noRls = (await sys(`
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity`)).rows;
for (const r of noRls) console.log(`      RLS off: public.${r.relname}`);
check('every public table has row level security on', noRls.length === 0);

// Only the two documented views exist; any new view must be reviewed for RLS bypass.
const views = (await sys(`select c.relname, coalesce(c.reloptions::text, '') as opts from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v' order by 1`)).rows;
check('public views are the reviewed set (book_entries, my_policy_state)',
  views.map((v) => v.relname).join(',') === 'book_entries,my_policy_state');
check('book_entries is a security barrier view; my_policy_state runs as the invoker',
  views.find((v) => v.relname === 'book_entries')?.opts.includes('security_barrier=true')
  && views.find((v) => v.relname === 'my_policy_state')?.opts.includes('security_invoker=true'));

const counts = cols.reduce((m, r) => { const l = (r.comment ?? '').slice(0, 2); m[l] = (m[l] ?? 0) + 1; return m; }, {});
console.log(`      levels: ${Object.entries(counts).sort().map(([k, v]) => `${k}=${v}`).join(' ')}`);
done();
