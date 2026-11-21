/// <reference types="node" />
/**
 * A PGlite server built once and reused (BL-443). Applying every file in supabase/migrations takes seconds and
 * several test files do it; this builds the migrated server the first time, saves its data directory as a
 * dump in a private per-user folder of the OS temp folder, and every later call (another file, another worker, the next run) loads the dump
 * instead. The dump is named by a hash of everything that went into it, so a changed migration, a changed setup
 * or another PGlite version builds a new one; an unreadable dump is ignored and rebuilt. It is written to a
 * private name and renamed, so two workers racing never read half a file. Nothing here is a fixture: the
 * server a test gets is the same as one built the long way.
 *
 * The folder is `scribe-pglite-<uid>` (mode 0700, tightened if it was looser, and refused if it is a link or belongs to another user, in
 * which case there is no cache and each run builds); each dump is mode 0600. After a write, dumps and leftover
 * private names older than a day are removed, so builds from old branches do not pile up. The cache key is unchanged.
 */
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
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

const STALE_MS = 24 * 60 * 60 * 1000;

/** The per-user cache folder, or null when it cannot be made safely (a link, or another user's). */
function cacheDir(): string | null {
  try {
    const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;
    const dir = join(tmpdir(), `scribe-pglite-${uid ?? 'user'}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const st = lstatSync(dir);
    if (!st.isDirectory() || (uid !== undefined && st.uid !== uid)) return null;
    if ((st.mode & 0o077) !== 0) chmodSync(dir, 0o700); // a folder made earlier with a looser mode is tightened, not trusted
    return dir;
  } catch {
    return null;
  }
}

/** Remove other builds' dumps and abandoned private names that no run has touched for a day. */
function sweep(dir: string, keep: string): void {
  try {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name);
      if (file === keep || !name.startsWith('scribe-pglite-')) continue;
      try {
        if (Date.now() - lstatSync(file).mtimeMs > STALE_MS) unlinkSync(file);
      } catch {
        /* another worker removed it first */
      }
    }
  } catch {
    /* best effort */
  }
}

/**
 * `inputs` is every string the build depends on (setup SQL, each migration's name and text). `build` runs on a
 * fresh PGlite the first time only.
 */
export async function pgliteSnapshot(inputs: readonly string[], build: (pg: PGlite) => Promise<void>): Promise<PGlite> {
  const hash = createHash('sha256');
  hash.update(`pglite ${pgliteVersion()}\0`);
  for (const s of inputs) hash.update(`${s.length}:${s}\0`);
  const dir = cacheDir();
  const dump = dir === null ? null : join(dir, `scribe-pglite-${hash.digest('hex').slice(0, 24)}.tgz`);
  if (dump !== null && existsSync(dump)) {
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
  if (dump === null || dir === null) return pg;
  try {
    const blob = await pg.dumpDataDir('gzip');
    const tmp = `${dump}.${process.pid}.${Date.now()}`;
    writeFileSync(tmp, Buffer.from(await blob.arrayBuffer()), { mode: 0o600 });
    renameSync(tmp, dump);
    sweep(dir, dump);
  } catch {
    /* a read-only temp folder only costs the next run its build */
  }
  return pg;
}
