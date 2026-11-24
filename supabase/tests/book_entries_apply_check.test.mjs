// BL-1952 (CDO-1, FR-AIS-08): the founder's hosted check in APPLY.md File 46a, run as written (extracted from the doc, so the
// two cannot drift). Passes only when public.book_entries has 23 columns and none is engine_version. The leak itself is proved
// by the sync tests; this file proves the doc's query and that the view keeps the author's own row source (entries) intact.
import { readFileSync } from 'node:fs';
import { createDb } from './harness.mjs';

const { check, sys, done } = await createDb(process.argv.slice(2));

const apply = readFileSync(new URL('../APPLY.md', import.meta.url), 'utf8');
const from = apply.indexOf('## File 46a:');
const sec = apply.slice(from, apply.indexOf('\n## ', from + 1));
const q = /\*\*Check \[U\] \(hosted, founder\):\*\* `([^`]+)`/.exec(sec)?.[1];
check('[BL-1952] APPLY.md File 46a has a check query to run', !!q);
check('[BL-1952] the File 46a check query is true on the migrated schema (23 columns, no engine_version)',
  q && (await sys(q)).rows[0].ok === true);
check('[BL-1952] the check is not vacuous: entries still has engine_version (the author keeps it)',
  (await sys(`select count(*)::int n from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'engine_version' and not attisdropped`)).rows[0].n === 1);
done();
