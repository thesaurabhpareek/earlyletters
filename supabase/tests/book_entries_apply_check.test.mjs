// BL-1952 (CDO-1, FR-AIS-08): the founder's hosted check in APPLY.md File 46a, run as written (extracted from the doc, so the
// two cannot drift). Passes only when public.book_entries has 23 columns and none is engine_version. The leak itself is proved
// by the sync tests; this file proves the doc's query and that the view keeps the author's own row source (entries) intact.
// The founder runs it after applying File 46a, so it runs here on the schema migrated up to File 46a: a later file may append
// columns to the view (File 51, 20261127100000, appends first_mark and first_label; its own check is in firsts.test.mjs).
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createDb } from './harness.mjs';

const FILE_46A = '20261123200000_book_entries_no_engine_version.sql';
const files = process.argv.slice(2);
const upTo46a = files.filter((f) => basename(f) <= FILE_46A);
const { check, sys, done } = await createDb(upTo46a);
check('[BL-1952] File 46a is among the migrations this check runs on (the check below is not vacuous)',
  upTo46a.some((f) => basename(f) === FILE_46A) && upTo46a.length < files.length);

const apply = readFileSync(new URL('../APPLY.md', import.meta.url), 'utf8');
const from = apply.indexOf('## File 46a:');
const sec = apply.slice(from, apply.indexOf('\n## ', from + 1));
const q = /\*\*Check \[U\] \(hosted, founder\):\*\* `([^`]+)`/.exec(sec)?.[1];
check('[BL-1952] APPLY.md File 46a has a check query to run', !!q);
check('[BL-1952] the File 46a check query is true on the schema up to File 46a (23 columns, no engine_version)',
  q && (await sys(q)).rows[0].ok === true);
check('[BL-1952] the check is not vacuous: entries still has engine_version (the author keeps it)',
  (await sys(`select count(*)::int n from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'engine_version' and not attisdropped`)).rows[0].n === 1);
done();
