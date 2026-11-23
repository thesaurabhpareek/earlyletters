/// <reference types="node" />
/**
 * [BL-1497] Boot sweep of the guard-window keys (defence in depth after #1484): a stale provenance_takeover or
 * raw_takeover row is removed at open; normal settings survive; the sweep runs at open, never inside a pull, so it
 * cannot close a window takeProvenance opened. Fictional family "Asha" only.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyPullPage } from '../src/lib/sync/merge';

import { migrate, sweepTakeoverKeys } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';
import { fixture } from './helpers/store-fixture';
import { PULLED_LETTER as EL, pulledPage } from './helpers/pulled-page';

const ME = '11111111-1111-1111-1111-111111111111';
const KEYS = "('provenance_takeover', 'raw_takeover')";
const stale = (db: SqlDb) => db.all<{ key: string }>(`SELECT key FROM settings WHERE key IN ${KEYS}`).map((r) => r.key).sort();

describe('[BL-1497] takeover key boot sweep', () => {
  it('removes a stale provenance_takeover row and a stale raw_takeover row, and keeps normal settings', () => {
    const f = fixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('provenance_takeover', 'x'), ('raw_takeover', 'y'), ('sync.ownerId', 'keep')");
    const before = f.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM settings WHERE key NOT IN " + KEYS)?.n;
    sweepTakeoverKeys(f.db);
    expect(stale(f.db)).toEqual([]);
    expect(f.db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'sync.ownerId'")?.value).toBe('keep');
    expect(f.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM settings')?.n).toBe(before);
    f.close();
  });
  it('removes each key on its own', () => {
    for (const k of ['provenance_takeover', 'raw_takeover']) {
      const f = fixture();
      f.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', k, 'x');
      sweepTakeoverKeys(f.db);
      expect(stale(f.db)).toEqual([]);
      f.close();
    }
  });
  it('is idempotent and harmless on a clean database', () => {
    const f = fixture();
    sweepTakeoverKeys(f.db);
    sweepTakeoverKeys(f.db);
    expect(stale(f.db)).toEqual([]);
    f.close();
  });
  it('never throws: a failing delete is swallowed and the other key is still tried', () => {
    const calls: string[] = [];
    const bad = { run: (_s: string, ...p: unknown[]) => { calls.push(String(p[0])); throw new Error('locked: secret-value'); } } as unknown as SqlDb;
    expect(() => sweepTakeoverKeys(bad)).not.toThrow();
    expect(calls).toEqual(['provenance_takeover', 'raw_takeover']);
  });
  it('works on a fresh migrated file (the open path: migrate, then sweep)', () => {
    const h = nodeDb();
    migrate(h.db, { now: '2026-11-20T09:00:00.000Z', newId: () => 'id' });
    h.db.run("INSERT INTO settings (key, value) VALUES ('raw_takeover', 'x')");
    sweepTakeoverKeys(h.db);
    expect(stale(h.db)).toEqual([]);
    h.close();
  });
  it('a pull after the sweep opens and closes its own windows (the sweep leaves nothing to stand in the way)', () => {
    const f = fixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?), ('provenance_takeover', 'stale')", ME);
    sweepTakeoverKeys(f.db);
    f.db.transaction(() => { applyPullPage(f.db, pulledPage(ME, [EL]), '2026-10-20T09:00:00.000Z'); });
    expect(stale(f.db)).toEqual([]);
    f.close();
  });
  it('ordering: the sweep is called by openStore after migrate, and nothing under lib/sync calls it', () => {
    const src = join(__dirname, '..', 'src');
    const store = readFileSync(join(src, 'lib', 'store.ts'), 'utf8');
    const open = store.slice(store.indexOf('export function openStore'));
    const iMig = open.indexOf('migrate(opened.db');
    const iSweep = open.indexOf('sweepTakeoverKeys(opened.db)');
    expect(iMig).toBeGreaterThan(-1);
    expect(iSweep).toBeGreaterThan(iMig);
    expect(open.slice(iMig, iSweep)).toContain('catch');
    expect(open.slice(0, open.indexOf('\n}\n'))).toContain('!migration.newer) sweepTakeoverKeys');
    const syncDir = join(src, 'lib', 'sync');
    for (const n of readdirSync(syncDir)) {
      expect(readFileSync(join(syncDir, n), 'utf8'), n).not.toContain('sweepTakeoverKeys');
    }
  });
});
