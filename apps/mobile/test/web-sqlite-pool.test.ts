/**
 * BL-464: the web e2e boot flake `local_db_migration_failed:1`.
 *
 * expo-sqlite 57.0.3's web worker keeps the database in a pool of Origin Private File System files (wa-sqlite
 * AccessHandlePoolVFS): scribe.db takes one, and its rollback journal another during every write. The pool is made
 * on the first ever start, six files one at a time, and upstream adds files only when the pool is empty. seeded()
 * in the web e2e opens a page and goes straight to the next one, so a loaded machine can end the first page part way
 * through that setup. With one file left, the next page opens scribe.db and reads user_version, then migration 1's
 * first write finds no file for its journal: "unable to open database file", which migrate() reports as
 * `local_db_migration_failed:1`.
 *
 * These tests run the real migrations over the web build's own engine (expo-sqlite's wa-sqlite wasm and its pool VFS)
 * in a worker thread, with an in-memory stand-in for OPFS (test/helpers/opfs-standin.mjs), and pin that
 * web-preview/sqlite-pool-capacity.js tops the pool up so the same start migrates, and that metro swaps it in on web
 * only. Native never loads either file. Nothing here holds letters or names: the database is empty.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { OPEN_PRAGMAS } from '../src/lib/db/expo-adapter';
import { LATEST_VERSION, MIGRATIONS, MigrationError, migrate, userVersion } from '../src/lib/db/migrations';
import { POOL_FILES, withFullPool } from '../web-preview/sqlite-pool-capacity.js';
import { webSqliteDb, type WebSqliteDb } from './helpers/web-sqlite-db';

const require = createRequire(import.meta.url);
const APP = join(__dirname, '..');
const COPY = join(APP, 'web-preview', 'sqlite-access-handle-pool-vfs.js');
const EXPO_WEB = join(dirname(require.resolve('expo-sqlite/package.json')), 'web');
const UPSTREAM = join(EXPO_WEB, 'wa-sqlite', 'AccessHandlePoolVFS.js');

const ctx = () => {
  let n = 0;
  return { now: '2026-11-27T10:00:00.000Z', newId: () => `id-${++n}` };
};

let open: WebSqliteDb[] = [];
afterEach(async () => {
  for (const o of open) await o.close();
  open = [];
});
async function start(pool: 'upstream' | 'topped-up', cutAt: number | null): Promise<WebSqliteDb> {
  const o = await webSqliteDb({ pool, cutAt });
  open.push(o);
  o.db.exec(OPEN_PRAGMAS); // as openNativeDb does on every open
  return o;
}

describe('[BL-464] the cause: a first pool setup cut at one file fails migration 1 on the web engine', () => {
  it('opens scribe.db and reads user_version, then the first write of migration 1 cannot open its journal', async () => {
    const o = await start('upstream', 1);
    expect(o.filesLeft).toBe(1);
    expect(o.poolFiles).toBe(1);
    expect(userVersion(o.db)).toBe(0);
    let cause = '';
    try {
      o.db.transaction(() => {
        MIGRATIONS[0].up(o.db, ctx());
        o.db.exec(`PRAGMA user_version = ${MIGRATIONS[0].version}`);
      });
    } catch (e) {
      cause = (e as Error).message;
    }
    expect(cause).toMatch(/unable to open database file/);
    expect(userVersion(o.db)).toBe(0); // rolled back
  });

  it('migrate() reports it as local_db_migration_failed:1', async () => {
    const o = await start('upstream', 1);
    let err: unknown = null;
    try {
      migrate(o.db, ctx());
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MigrationError);
    expect((err as MigrationError).message).toBe('local_db_migration_failed:1');
  });

  it('an uncut first setup, or one cut before any file or at two or more, migrates with the upstream pool', async () => {
    for (const cutAt of [null, 0, 2]) {
      const o = await start('upstream', cutAt);
      expect(migrate(o.db, ctx())).toEqual({ from: 0, to: LATEST_VERSION, newer: false });
    }
  });
});

describe('[BL-464] the fix: the web copy tops the pool up to its full size on every start', () => {
  it('the same cut start gets a full pool and migrates to the latest version, and a second migrate changes nothing', async () => {
    const o = await start('topped-up', 1);
    expect(o.filesLeft).toBe(1);
    expect(o.poolFiles).toBe(POOL_FILES);
    expect(migrate(o.db, ctx())).toEqual({ from: 0, to: LATEST_VERSION, newer: false });
    expect(migrate(o.db, ctx())).toEqual({ from: LATEST_VERSION, to: LATEST_VERSION, newer: false });
    const tables = o.db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(['children', 'drafts', 'entries', 'settings']));
  });

  it('every other cut point migrates too', async () => {
    for (const cutAt of [null, 0, 2, 3, 4, 5]) {
      const o = await start('topped-up', cutAt);
      expect(o.poolFiles).toBe(POOL_FILES);
      expect(migrate(o.db, ctx()).to).toBe(LATEST_VERSION);
    }
  });

  it('adds only the missing files, and none to a full or larger pool', async () => {
    const added: number[] = [];
    class Stub {
      constructor(
        public name: string,
        public capacity: number,
      ) {}
      async isReady() {
        return true;
      }
      getCapacity() {
        return this.capacity;
      }
      async addCapacity(n: number) {
        added.push(n);
        this.capacity += n;
        return n;
      }
    }
    for (const [have, add] of [
      [1, POOL_FILES - 1],
      [POOL_FILES, 0],
      [POOL_FILES + 2, 0],
    ] as const) {
      added.length = 0;
      const Pool = withFullPool(class extends Stub {
        constructor(name: string) {
          super(name, have);
        }
      });
      const vfs = await Pool.create('expo-sqlite', {});
      expect(added).toEqual(add ? [add] : []);
      expect(vfs.getCapacity()).toBe(Math.max(have, POOL_FILES));
    }
  });
});

describe('[BL-464] metro swaps the pool copy in on web only', () => {
  // BL-443: metro.config.js loads expo/metro-config, which can take seconds on a cold runner.
  let config: {
    resolver: { resolveRequest: (ctx: unknown, name: string, platform: string) => { type: string; filePath: string } };
  };
  beforeAll(() => {
    config = require(join(APP, 'metro.config.js')) as typeof config;
  }, 60_000);

  const fromWorker = (calls: string[]) => ({
    originModulePath: join(EXPO_WEB, 'worker.ts'),
    resolveRequest: (_ctx: unknown, name: string) => {
      calls.push(name);
      return { type: 'sourceFile', filePath: UPSTREAM };
    },
  });

  it("gives the web worker the copy in place of ./wa-sqlite/AccessHandlePoolVFS", () => {
    const calls: string[] = [];
    expect(config.resolver.resolveRequest(fromWorker(calls), './wa-sqlite/AccessHandlePoolVFS', 'web')).toEqual({
      type: 'sourceFile',
      filePath: COPY,
    });
    expect(calls).toEqual([]);
  });

  it('leaves ios and android on the installed file', () => {
    for (const platform of ['ios', 'android']) {
      const calls: string[] = [];
      const result = config.resolver.resolveRequest(fromWorker(calls), './wa-sqlite/AccessHandlePoolVFS', platform);
      expect(result.filePath).not.toBe(COPY);
      expect(calls).toEqual(['./wa-sqlite/AccessHandlePoolVFS']);
    }
  });

  it("resolves the copy's ./AccessHandlePoolVFS from the installed wa-sqlite folder", () => {
    let origin = '';
    const context = {
      originModulePath: COPY,
      resolveRequest: (c: { originModulePath: string }) => {
        origin = c.originModulePath;
        return { type: 'sourceFile', filePath: 'resolved' };
      },
    };
    config.resolver.resolveRequest(context, './AccessHandlePoolVFS', 'web');
    expect(origin).toBe(UPSTREAM);
  });
});
