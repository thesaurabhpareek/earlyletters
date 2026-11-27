/**
 * BL-464. The web build's database engine in a Node worker thread: expo-sqlite's own wa-sqlite wasm and its OPFS pool
 * VFS (AccessHandlePoolVFS) over test/helpers/opfs-standin.mjs. It plays two page loads of one browser context:
 *  - page 1 makes the pool for the first time and, when `cutAt` is a number, ends after that many files (a navigation,
 *    as seeded() in the web e2e opens a page and goes straight to the next one);
 *  - page 2 opens scribe.db through the pool VFS (`pool`: 'upstream', or 'topped-up' for web-preview/sqlite-pool-capacity.js)
 *    and answers SQL over a SharedArrayBuffer, the way the web channel does (web-preview/sqlite-worker-channel.js).
 * Plain JavaScript because it is a worker entry; test/helpers/web-sqlite-db.ts drives it.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parentPort, workerData } from 'node:worker_threads';
import { opfsStandin } from './opfs-standin.mjs';

const require = createRequire(import.meta.url);
const WA = join(dirname(require.resolve('expo-sqlite/package.json')), 'web', 'wa-sqlite');
const at = (f) => pathToFileURL(join(WA, f)).href;
const factory = require(join(WA, 'wa-sqlite.js'));
const SQLite = await import(at('sqlite-api.js'));
const { AccessHandlePoolVFS: Upstream } = await import(at('AccessHandlePoolVFS.js'));
const fix = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web-preview', 'sqlite-pool-capacity.js')).href;
const PoolVFS = workerData.pool === 'topped-up' ? (await import(fix)).withFullPool(Upstream) : Upstream;
const VFS_NAME = 'expo-sqlite'; // expo-sqlite web/worker.ts VFS_NAME_PERSISTENT

const opfs = opfsStandin();
Object.defineProperty(globalThis.navigator, 'storage', { value: opfs.storage, configurable: true });
const wasmBinary = readFileSync(join(WA, 'wa-sqlite.wasm'));

if (typeof workerData.cutAt === 'number') {
  let made = 0;
  opfs.setBeforeCreate(() => {
    if (made++ === workerData.cutAt) throw new Error('page 1 went away');
  });
  try {
    await Upstream.create(VFS_NAME, await factory({ wasmBinary }));
  } catch {
    // the page ended part way through the first setup
  }
  opfs.endPage('page 1');
  opfs.setBeforeCreate(() => {});
}
const filesLeft = opfs.files(VFS_NAME).length;

opfs.setOwner('page 2');
const module = await factory({ wasmBinary });
const sqlite3 = SQLite.Factory(module);
const vfs = await PoolVFS.create(VFS_NAME, module);
sqlite3.vfs_register(vfs, true);
const db = await sqlite3.open_v2('scribe.db', SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_CREATE, VFS_NAME);

parentPort.on('message', async ({ op, sql, params, lock, buf }) => {
  let out;
  try {
    if (op === 'exec') {
      await sqlite3.exec(db, sql);
      out = { result: null };
    } else {
      const rows = [];
      for await (const stmt of sqlite3.statements(db, sql)) {
        if (params.length) sqlite3.bind_collection(stmt, params);
        const names = sqlite3.column_names(stmt);
        while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
          const values = sqlite3.row(stmt);
          rows.push(Object.fromEntries(names.map((n, i) => [n, values[i]])));
        }
      }
      out = { result: rows };
    }
  } catch (e) {
    out = { error: String(e?.message ?? e) };
  }
  const bytes = new TextEncoder().encode(JSON.stringify(out));
  new Uint32Array(buf, 0, 1)[0] = bytes.length;
  new Uint8Array(buf).set(bytes, 4);
  const l = new Int32Array(lock);
  Atomics.store(l, 0, 2);
  Atomics.notify(l, 0);
});
parentPort.postMessage({ filesLeft, poolFiles: vfs.getCapacity() });
