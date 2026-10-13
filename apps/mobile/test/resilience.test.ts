/// <reference types="node" />
/**
 * Resilience (journey J19, J20): launch failure handling, link and tap rules, recovery export, the way back
 * from the error screen. Pure parts only; the screens are recorded in apps/mobile/e2e-web (j19, j20).
 */
import { strFromU8, unzipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native opener must not run in tests'); } }));

import { attemptOpen, launchStatus } from '../src/lib/resilience/launch.logic';
import { isCaptureRoute, routePathOf, TONIGHT_HREF } from '../src/lib/resilience/not-found.logic';
import { folderFor, planRecoveryExport, README_PATH, writeRecoveryZip, type FoundFile } from '../src/lib/resilience/recovery-export.logic';
import { goToTonightAfterRetry } from '../src/lib/resilience/recover-to-tonight';
import { armListenStart, consumeListenStart, LISTEN_ARM_WINDOW_MS, resetListenStart } from '../src/lib/resilience/start-intent';
import * as store from '../src/lib/store';

describe('launch failure (J20)', () => {
  beforeEach(() => store.closeStore());
  afterEach(() => store.closeStore());

  it('an open that throws becomes the recovery screen, with no message kept', () => {
    const status = attemptOpen(() => store.openStore({ open: () => { throw new Error('disk I/O error near "Asha"'); } }));
    expect(status).toBe('recovery');
  });

  it('a migration that fails becomes the recovery screen and leaves the file as it was', () => {
    const h = nodeDb();
    h.db.exec('PRAGMA user_version = 0');
    const failing = {
      ...h.db,
      transaction: () => { throw new Error('boom'); },
      exec: (sql: string) => { if (/CREATE TABLE/i.test(sql)) throw new Error('boom'); return h.db.exec(sql); },
    };
    const status = attemptOpen(() => store.openStore({ open: () => ({ db: failing, close: () => {} }) }));
    expect(status).toBe('recovery');
    expect(h.db.get<{ user_version: number }>('PRAGMA user_version')!.user_version).toBe(0);
    h.close();
  });

  it('Try again opens afresh and the app runs when it works', () => {
    expect(attemptOpen(() => store.openStore({ open: () => { throw new Error('x'); } }))).toBe('recovery');
    const h = nodeDb();
    expect(attemptOpen(() => store.openStore({ open: () => ({ db: h.db, close: () => {} }) }))).toBe('ok');
    h.close();
  });

  it('anything thrown while opening counts as a failed launch, never a crash', () => {
    expect(attemptOpen(() => { throw new Error('anything'); })).toBe('recovery');
  });

  it('a newer file keeps running as before (it is not damage)', () => {
    expect(launchStatus({ ok: false, newer: true, error: null })).toBe('ok');
  });
});

describe('scribe://listen never records by itself (J19, J20)', () => {
  it('routePathOf reads custom-scheme and https links, ignoring query and fragment', () => {
    expect(routePathOf('scribe://listen')).toBe('/listen');
    expect(routePathOf('scribe:///listen')).toBe('/listen');
    expect(routePathOf('scribe://listen/?promptKey=a#x')).toBe('/listen');
    expect(routePathOf('https://earlyletters.com/Listen/')).toBe('/listen');
    expect(routePathOf('/listen?promptKey=a')).toBe('/listen');
    expect(routePathOf('scribe://')).toBe('/');
  });

  it('links to capture screens are sent to Tonight; other links are left alone', () => {
    for (const u of ['scribe://listen', 'scribe://listen?go=1', '/listen', 'scribe://review?draftId=1', 'scribe://read-together', 'https://earlyletters.com/listen']) {
      expect(isCaptureRoute(u), u).toBe(true);
    }
    for (const u of ['scribe://auth/callback', 'https://earlyletters.com/i/abc', '/settings', '/letter/1', '/listening-tips', '/']) {
      expect(isCaptureRoute(u), u).toBe(false);
    }
    expect(TONIGHT_HREF).toBe('/');
  });

  describe('the tap that arms Listen', () => {
    beforeEach(() => resetListenStart());
    it('is false when nothing armed it (link, restored screen)', () => {
      expect(consumeListenStart()).toBe(false);
    });
    it('is true once after Speak is tapped, then false', () => {
      armListenStart(1000);
      expect(consumeListenStart(1500)).toBe(true);
      expect(consumeListenStart(1600)).toBe(false);
    });
    it('goes stale: an old tap does not start a later opening', () => {
      armListenStart(0);
      expect(consumeListenStart(LISTEN_ARM_WINDOW_MS + 1)).toBe(false);
    });
  });
});

describe('Export what is readable (J20)', () => {
  const f = (name: string, source: FoundFile['source'], bytes = 10): FoundFile => ({ name, source, bytes, uri: `file:///${source}/${name}` });

  it('picks recordings from documents and database files from the SQLite folder, nothing else', () => {
    expect(folderFor(f('a.m4a', 'documents'))).toBe('recordings');
    expect(folderFor(f('scribe.db', 'sqlite'))).toBe('database');
    expect(folderFor(f('scribe.db-wal', 'sqlite'))).toBe('database');
    expect(folderFor(f('notes.txt', 'documents'))).toBeNull();
    expect(folderFor(f('a.m4a', 'sqlite'))).toBeNull();
    expect(folderFor(f('other.db', 'sqlite'))).toBeNull();
  });

  it('plans safe, unique paths, recordings first', () => {
    const plan = planRecoveryExport([f('scribe.db', 'sqlite'), f('b.m4a', 'documents'), f('a b/..m4a', 'documents'), { ...f('b.m4a', 'documents'), uri: 'file:///documents/other/b.m4a' }, f('x.txt', 'documents')]);
    expect(plan.map((p) => p.path)).toEqual(['recordings/a_b_.m4a', 'recordings/b.m4a', 'recordings/b-2.m4a', 'database/scribe.db']);
    expect(plan.every((p) => !p.path.includes('..'))).toBe(true);
  });

  it('is empty when nothing is readable', () => {
    expect(planRecoveryExport([f('x.txt', 'documents')])).toEqual([]);
  });

  it('writes a ZIP holding every readable file exactly, plus the readme, and skips one it cannot read', async () => {
    const files: Record<string, Uint8Array> = { 'file:///documents/a.m4a': new Uint8Array([1, 2, 3]), 'file:///sqlite/scribe.db': new Uint8Array([9, 8]) };
    const plan = planRecoveryExport([f('a.m4a', 'documents'), f('bad.m4a', 'documents'), f('scribe.db', 'sqlite')]);
    const chunks: Uint8Array[] = [];
    const r = await writeRecoveryZip(plan, {
      readFile: async (uri) => { const d = files[uri]; if (!d) throw new Error('unreadable'); return d; },
      write: (c) => chunks.push(c.slice()),
      readme: 'About these files',
    });
    expect(r).toMatchObject({ files: 2, skipped: 1 });
    const total = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let at = 0;
    for (const c of chunks) { total.set(c, at); at += c.length; }
    const out = unzipSync(total);
    expect(Object.keys(out).sort()).toEqual(['README.txt', 'database/scribe.db', 'recordings/a.m4a']);
    expect([...out['recordings/a.m4a']]).toEqual([1, 2, 3]);
    expect([...out['database/scribe.db']]).toEqual([9, 8]);
    expect(strFromU8(out[README_PATH])).toContain('About these files');
  });

  it('stops between files when the person cancels', async () => {
    const signal = { aborted: false };
    const plan = planRecoveryExport([f('a.m4a', 'documents'), f('b.m4a', 'documents')]);
    const r = await writeRecoveryZip(plan, { readFile: async () => { signal.aborted = true; return new Uint8Array([1]); }, write: () => {}, readme: 'r', signal });
    expect(r.files).toBe(1);
  });
});

describe('Go to Tonight from the error screen', () => {
  it('remounts first, then goes to Tonight when the router is ready, retrying while it is not', () => {
    const order: string[] = [];
    const queue: Array<() => void> = [];
    let ready = 0;
    goToTonightAfterRetry(
      () => order.push('retry'),
      (href) => { order.push(`go ${href}`); if (ready++ < 2) throw new Error('not ready'); },
      { setTimeout: (fn) => { queue.push(fn); return 0; } },
    );
    while (queue.length) queue.shift()!();
    expect(order).toEqual(['retry', 'go /', 'go /', 'go /']);
  });

  it('gives up quietly after a few tries', () => {
    const queue: Array<() => void> = [];
    let tries = 0;
    goToTonightAfterRetry(() => {}, () => { tries += 1; throw new Error('never ready'); }, { setTimeout: (fn) => { queue.push(fn); return 0; } }, 3);
    while (queue.length) queue.shift()!();
    expect(tries).toBe(3);
  });

  it('does nothing more if retry itself throws', () => {
    const go = vi.fn();
    goToTonightAfterRetry(() => { throw new Error('x'); }, go, { setTimeout: (fn) => { fn(); return 0; } });
    expect(go).not.toHaveBeenCalled();
  });
});
