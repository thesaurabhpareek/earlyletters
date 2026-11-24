// BL-1983 (D-041, B-NFR-003): two migration files never share a version prefix.
// Supabase keys supabase_migrations.schema_migrations on the leading digits of the file name, so a second file with the same
// version collides on the key and a hosted apply fails part way. 20261123200000 was once held by two files at once.
// Structure only: reads file names, never file contents, so it needs no database.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let bad = 0;
const check = (ok, name) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) bad++; };

const seen = new Map();
const malformed = [];
for (const f of files) {
  const m = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(f);
  if (!m) { malformed.push(f); continue; }
  seen.set(m[1], [...(seen.get(m[1]) ?? []), f]);
}
const dups = [...seen].filter(([, fs]) => fs.length > 1);
check(files.length > 0, 'MV-1 there are migrations to check');
check(malformed.length === 0, `MV-2 every migration is <14-digit version>_<name>.sql (${malformed.join(', ')})`);
check(dups.length === 0, `MV-3 no two migrations share a version (${dups.map(([v, fs]) => `${v}: ${fs.join(' + ')}`).join('; ')})`);
if (bad) process.exit(1);
console.log('all migration versions are unique');
