/// <reference types="node" />
/**
 * RT-LCH-06 (MOB-09): a book file written by a newer build (an update rolled back, or a TestFlight build
 * older than the last one) is opened by this build. Proven here, through the open-store result over a real
 * SQLite file: the open reports `newer` with no error, and the open writes nothing to the file, byte for byte.
 *
 * Not proven here, because it is not built: the recovery screen offering "Export what is readable" for a
 * newer file. Today a newer file keeps running the app (launch.logic.ts launchStatus; pinned in
 * launch-retry.test.ts) until the "update the app" screen (MOB-09) ships; ADR 0025 relies on that for a
 * v6 build reading a v7 file. Fictional Asha family only.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { LATEST_VERSION } = await import('../src/lib/db/migrations');

const NOW = '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(900 + ++seq).padStart(12, '0')}`;
let dir = '';
let path = '';

const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** Writes a book file the way a newer build would leave it: today's schema, a book for Asha, a higher user_version. */
function writeNewerFile(ahead: number): void {
  const h = nodeDb(path);
  store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId });
  store.addChild({ name: 'Asha', birthday: '2025-06-01', dueDate: null, signsAs: 'Mama' });
  store.closeStore();
  h.db.exec(`PRAGMA user_version = ${LATEST_VERSION + ahead}`);
  h.close();
}

beforeEach(() => {
  seq = 0;
  store.closeStore();
  dir = mkdtempSync(join(tmpdir(), 'scribe-newer-'));
  path = join(dir, 'scribe.db');
});
afterEach(() => {
  store.closeStore();
  rmSync(dir, { recursive: true, force: true });
});

describe('[RT-LCH-06] [MOB-09] a book file from a newer build', () => {
  it.each([1, 7])('ahead by %i: the open reports newer, no error, and writes nothing to the file', (ahead) => {
    writeNewerFile(ahead);
    const before = sha(path);
    const filesBefore = readdirSync(dir).sort();

    const h = nodeDb(path);
    const result = store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId });
    expect(result).toEqual({
      ok: false,
      newer: true,
      error: null,
      migration: { from: LATEST_VERSION + ahead, to: LATEST_VERSION + ahead, newer: true },
    });
    expect(h.db.get<{ user_version: number }>('PRAGMA user_version')!.user_version).toBe(LATEST_VERSION + ahead);
    store.closeStore();
    h.close();

    expect(sha(path)).toBe(before);
    expect(readdirSync(dir).sort()).toEqual(filesBefore); // no journal or side file left behind
  });

  it('the book in it is still there and readable after the open', () => {
    writeNewerFile(1);
    const h = nodeDb(path);
    store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId });
    expect(store.listChildren().map((c) => c.name)).toEqual(['Asha']);
    store.closeStore();
    h.close();
  });
});
