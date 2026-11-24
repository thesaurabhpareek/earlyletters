/// <reference types="node" />
/**
 * [NS-43-R9] [NS-43-R6] [NS-43-R10] First run's finish makes every book in one transaction (BL-1033). Real store over
 * node:sqlite with the app's migrations; only natives are stubbed. Fictional family "Asha" only.
 *
 * Red on the old code: the screen made one book per call (resumeBooks over addChild), so a throw on the second left the
 * first behind, and `addChildren` did not exist.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

type Store = typeof import('../src/lib/store');
let store: Store;
let ids: string[];
const at = (i: number) => `0199a000-0000-7000-8000-${String(i).padStart(12, '0')}`;
const asha = { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' };
const twin = { ...asha, name: 'Asha B' };
const third = { ...asha, name: 'Asha C' };

/** `plan` is the ids the store draws in order; a repeated id makes the later insert fail (primary key), a real engine error. */
async function open(plan: string[]): Promise<void> {
  vi.resetModules();
  store = (await import('../src/lib/store')) as Store;
  const { db } = nodeDb();
  ids = [...plan];
  const r = store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-11-20T09:00:00.000Z', newId: () => ids.shift() ?? at(900 + Math.random() * 1e6) });
  expect(r.ok).toBe(true);
}
const rows = () => store.localSqlDb().get<{ c: number; p: number; o: number }>(
  'SELECT (SELECT COUNT(*) FROM children) AS c, (SELECT COUNT(*) FROM child_member_prefs) AS p, (SELECT COUNT(*) FROM sync_outbox) AS o',
)!;

const creates = () => store.localSqlDb().get<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE payload LIKE '%book.create%'")!.n;

describe('[NS-43-R9] the first books commit together', () => {
  beforeEach(() => open([at(1), at(2), at(3)]));

  it('twins: both books exist, the first is active, and the people on the screen hear one change', () => {
    const heard: string[][] = [];
    store.subscribeTo(['children', 'settings'], (t) => heard.push([...t]));
    const made = store.addChildren([asha, twin]);
    expect(made.map((c) => c.name)).toEqual(['Asha', 'Asha B']);
    expect(store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Asha B']);
    expect(store.getActiveChildId()).toBe(made[0].id);
    expect(store.getSetting('activeChildId')).toBe(made[0].id);
    expect(heard).toHaveLength(1);
  });

  it('a failure on the second book leaves no first book, no signature row, no active book and no announcement', async () => {
    await open([at(1), at(1)]); // the second book draws the first's id: the engine refuses it
    const heard: string[][] = [];
    store.subscribeTo(['children', 'settings'], (t) => heard.push([...t]));
    expect(() => store.addChildren([asha, twin])).toThrow();
    expect(rows()).toEqual({ c: 0, p: 0, o: 0 });
    expect(store.listChildren()).toEqual([]);
    expect(store.getSetting('activeChildId')).toBeNull();
    expect(heard).toEqual([]);
  });

  it('a failure on the third of three rolls back the first two as well', async () => {
    await open([at(1), at(2), at(2)]);
    expect(() => store.addChildren([asha, twin, third])).toThrow();
    expect(rows().c).toBe(0);
  });

  it('after a rolled-back try, the retry makes each book once', async () => {
    await open([at(1), at(1), at(5), at(6)]);
    expect(() => store.addChildren([asha, twin])).toThrow();
    const again = store.addChildren([asha, twin]);
    expect(again).toHaveLength(2);
    expect(rows().c).toBe(2);
    expect(store.listChildren().map((c) => c.name)).toEqual(['Asha', 'Asha B']);
  });

  it('signed in: each book queues its create upload, and a failure queues none', async () => {
    const { takeOwnership } = await import('../src/lib/sync/ownership');
    const ctx = { now: '2026-11-20T09:00:00.000Z', newId: () => at(700) };
    takeOwnership(store.localSqlDb(), '0192f0aa-0000-7000-8000-0000000000a1', ctx);
    const before = rows().o;
    await Promise.resolve();
    store.addChildren([asha, twin]);
    expect(creates()).toBe(2);
    expect(rows().o - before).toBe(4); // a create and a signature line per book
    await open([at(1), at(2), at(2)]);
    const own = await import('../src/lib/sync/ownership');
    own.takeOwnership(store.localSqlDb(), '0192f0aa-0000-7000-8000-0000000000a1', ctx);
    const base = rows();
    expect(() => store.addChildren([asha, twin, third])).toThrow();
    expect(rows()).toEqual(base);
  });

  it('a book already active stays active; an empty list makes nothing', () => {
    const first = store.addChild(asha);
    expect(store.addChildren([])).toEqual([]);
    store.addChildren([twin]);
    expect(store.getActiveChildId()).toBe(first.id);
  });
});

describe('[NS-43-R6] every first-run book is free', () => {
  beforeEach(() => open([at(1), at(2), at(3)]));

  it('three children together: three books, all accepted by the store with no plan read', () => {
    const made = store.addChildren([asha, twin, third]);
    expect(made).toHaveLength(3);
    expect(store.listChildren()).toHaveLength(3);
  });

  it('the finish step reads no plan, ledger or billing state before it makes the books', () => {
    const body = finishSource();
    expect(body).not.toMatch(/plan|ledger|billing|paywall|entitle|plus/i);
    expect(body).toMatch(/addChildren\(/);
  });
});

describe('[NS-43-R10] first run ends on Home', () => {
  it('after the books are made the one route change is Home, with nothing raised first', () => {
    const body = finishSource();
    const after = body.slice(body.indexOf('addChildren('));
    expect(after).toMatch(/router\.replace\('\/'\)/);
    expect(after).not.toMatch(/router\.push|present|Sheet|Alert|request[A-Z]\w*Permission|LockOffer|paywall/i);
    expect(readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8')).not.toMatch(/<LockOffer|requestPermission/);
  });

  it('the new book is the active one before Home opens', () => {
    const body = finishSource();
    expect(body.indexOf('setActiveChildId(created[0].id)')).toBeGreaterThan(body.indexOf('addChildren('));
    expect(body.indexOf("router.replace('/')")).toBeGreaterThan(body.indexOf('setActiveChildId(created[0].id)'));
  });
});

describe('[NS-43-R9] the screen makes all its books in one call', () => {
  it('finish calls addChildren once, and no per-book add or resume memory remains', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');
    expect(src.match(/addChildren\(/g)).toHaveLength(1);
    expect(src).not.toMatch(/resumeBooks|madeBooks|addChildToStore|\baddChild\(/);
    expect(finishSource()).not.toMatch(/\.map\(\(n\) =>\s*addChild/);
  });
});

function finishSource(): string {
  const src = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');
  const a = src.indexOf('  const finish = () => {');
  const b = src.indexOf('  const finishOnce');
  expect(a).toBeGreaterThan(0);
  expect(b).toBeGreaterThan(a);
  return src.slice(a, b);
}
