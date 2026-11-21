/// <reference types="node" />
/**
 * A PGlite server built once and reused (BL-443). Applying every file in supabase/migrations takes seconds and
 * several test files do it; this builds the migrated server the first time, saves its data directory as a
 * dump in the OS temp folder, and every later call (another file, another worker, the next run) loads the dump
 * instead. The dump is named by a hash of everything that went into it, so a changed migration, a changed setup
 * or another PGlite version builds a new one; an unreadable dump is ignored and rebuilt. It is written to a
 * private name and renamed, so two workers racing never read half a file. Nothing here is a fixture: the
 * server a test gets is the same as one built the long way.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const pgliteVersion = (): string => {
  try {
    return (JSON.parse(readFileSync(join(__dirname, '../../../../node_modules/@electric-sql/pglite/package.json'), 'utf8')) as { version: string }).version;
  } catch {
    return 'unknown';
  }
};

/**
 * `inputs` is every string the build depends on (setup SQL, each migration's name and text). `build` runs on a
 * fresh PGlite the first time only.
 */
export async function pgliteSnapshot(inputs: readonly string[], build: (pg: PGlite) => Promise<void>): Promise<PGlite> {
  const hash = createHash('sha256');
  hash.update(`pglite ${pgliteVersion()}\0`);
  for (const s of inputs) hash.update(`${s.length}:${s}\0`);
  const dump = join(tmpdir(), `scribe-pglite-${hash.digest('hex').slice(0, 24)}.tgz`);
  if (existsSync(dump)) {
    try {
      const bytes = readFileSync(dump);
      gunzipSync(bytes); // a truncated dump throws here, where it can be caught, and not inside PGlite's stream
      const pg = new PGlite({ loadDataDir: new Blob([bytes]) });
      await pg.waitReady;
      return pg;
    } catch {
      /* unreadable or from another build: rebuild below */
    }
  }
  const pg = new PGlite();
  await build(pg);
  try {
    const blob = await pg.dumpDataDir('gzip');
    const tmp = `${dump}.${process.pid}.${Date.now()}`;
    writeFileSync(tmp, Buffer.from(await blob.arrayBuffer()));
    renameSync(tmp, dump);
  } catch {
    /* a read-only temp folder only costs the next run its build */
  }
  return pg;
}
