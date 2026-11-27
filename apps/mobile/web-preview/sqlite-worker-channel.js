// WEB PREVIEW ONLY. A copy of expo-sqlite 57.0.3 web/WorkerChannel.ts with three
// fixes, swapped in by metro.config.js for the web platform only. Native never
// loads this file.
//  1. The sync result length was written with Uint8Array.set(Uint32Array), which
//     keeps only the low byte, so any result over 255 bytes failed to parse.
//  2. The Atomics.pause spin budget (1M) is shorter than a cold OPFS write in
//     Chromium, so the first sync statement timed out. The budget is raised.
//  3. A new 1 MiB SharedArrayBuffer was made for every sync call. Chromium refuses
//     a new one after about 8,191 have been posted to a worker ("Array buffer
//     allocation failed"), which a long session reaches (BL-2010). One lock and one
//     result buffer are made once and reused.
// Remove this file only when an expo-sqlite release fixes all three upstream. If an
// upgrade fixes only some of them, keep this copy and drop just the fixed items.
// Fix 3 is what keeps J04h (BL-2010) passing.
import { Deferred } from './Deferred';
import { serialize, deserialize } from './SyncSerializer';

let messageId = 0;
const deferredMap = new Map();
const PENDING = 1;
const RESOLVED = 2;

export function sendWorkerResult({ id, result, error, syncTrait }) {
  if (syncTrait) {
    const { lockBuffer, resultBuffer } = syncTrait;
    const lock = new Int32Array(lockBuffer);
    const resultArray = new Uint8Array(resultBuffer);
    const resultJson = error != null ? serialize({ error }) : serialize({ result });
    const resultBytes = new TextEncoder().encode(resultJson);
    new Uint32Array(resultBuffer, 0, 1)[0] = resultBytes.length; // fix 1
    resultArray.set(resultBytes, 4);
    Atomics.store(lock, 0, RESOLVED);
  } else if (result) {
    self.postMessage({ id, result });
  } else {
    self.postMessage({ id, error });
  }
}

export function workerMessageHandler(event) {
  const { id, result, error, isSync } = event.data;
  if (!isSync) {
    const deferred = deferredMap.get(id);
    if (deferred) {
      if (error) deferred.reject(new Error(error));
      else deferred.resolve(result);
      deferredMap.delete(id);
    }
  }
}

export async function invokeWorkerAsync(worker, type, data) {
  const id = messageId++;
  const deferred = new Deferred();
  deferredMap.set(id, deferred);
  worker.postMessage({ type, id, data, isSync: false });
  return deferred.getPromise();
}

// Fix 3: one lock and one result buffer for every sync call. A sync call blocks the main thread until the worker
// answers and its result is read, so two sync calls never overlap and one pair is enough.
let syncBuffers = null;

export function invokeWorkerSync(worker, type, data) {
  const id = messageId++;
  if (!syncBuffers) syncBuffers = { lockBuffer: new SharedArrayBuffer(4), resultBuffer: new SharedArrayBuffer(1024 * 1024) };
  const { lockBuffer, resultBuffer } = syncBuffers;
  const lock = new Int32Array(lockBuffer);
  Atomics.store(lock, 0, PENDING);
  worker.postMessage({ type, id, data, isSync: true, lockBuffer, resultBuffer });

  const started = Date.now();
  let i = 0;
  while (Atomics.load(lock, 0) === PENDING) {
    if (typeof Atomics.pause === 'function') Atomics.pause();
    if (++i % 100000 === 0 && Date.now() - started > 30000) {
      syncBuffers = null; // fix 3: a late answer to a timed-out call must land in its own pair, not the next call's
      throw new Error('Sync operation timeout'); // fix 2
    }
  }

  const length = new Uint32Array(resultBuffer, 0, 1)[0];
  const resultCopy = new Uint8Array(length);
  resultCopy.set(new Uint8Array(resultBuffer, 4, length));
  const { result, error } = deserialize(new TextDecoder().decode(resultCopy));
  if (error) throw new Error(error);
  return result;
}
