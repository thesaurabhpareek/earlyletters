/**
 * BL-410: the fictional family seed (src/dev/asha-seed.ts) stays out of every store build.
 *
 * How it is kept out: the one file that imports it is src/dev/store-ready.web.ts, a web-only file. A store build is an
 * iOS build, where Metro resolves `@/dev/store-ready` to store-ready.ts, which imports nothing, so the seed module is
 * never in the iOS bundle. On web the import is a dynamic one, behind `preview` (__DEV__ or EXPO_PUBLIC_WEB_PREVIEW=1)
 * and a known `?seed=` value. These checks fail if any of that changes.
 *
 * The B-8 job ("no e2e seam in store bundles") exports the iOS store profiles and searches them for the seam
 * identifiers in .github/scripts/seam-guard.mjs; the seed's words are not on that list, so it is this file that pins
 * the seed's exclusion, not B-8.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

// The agreement record is not what these checks are about, and age-gate.ts loads React Native.
vi.mock('../src/lib/age-gate', () => ({ acceptBeforeYouBegin: () => {} }));

const store = await import('../src/lib/store');
const { seedAsha } = await import('../src/dev/asha-seed');

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|js|jsx)$/.test(n) ? [p] : [];
  });
}

/** An import (static, dynamic or require) of the seed module, by relative path or the `@/dev` alias. */
const IMPORTS_SEED = /(from\s+|import\(\s*|require\(\s*)['"](\.\/|\.\.\/dev\/|@\/dev\/)asha-seed['"]/;

describe('[BL-410] the Asha seed cannot reach a store build', () => {
  it('only the web-only store-ready file imports it', () => {
    const importers = files(SRC)
      .filter((f) => IMPORTS_SEED.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).split('\\').join('/'));
    expect(importers).toEqual(['dev/store-ready.web.ts']);
  });

  it('the native store-ready file imports nothing', () => {
    const native = readFileSync(join(SRC, 'dev', 'store-ready.ts'), 'utf8');
    expect(native).not.toMatch(/\bimport\b|\brequire\(/);
  });

  it('on web the seed loads only in a preview build, through a dynamic import', () => {
    const web = readFileSync(join(SRC, 'dev', 'store-ready.web.ts'), 'utf8');
    expect(web).toMatch(/const preview = __DEV__ \|\| process\.env\.EXPO_PUBLIC_WEB_PREVIEW === '1';/);
    expect(web).not.toMatch(/^import[^\n]*asha-seed/m);
    expect(web).toMatch(/if \(preview && \([^)]*\)\) \{\s*\(await import\('\.\/asha-seed'\)\)\.seedAsha\(/);
    // Each seed the journeys use is one the gate lets through.
    for (const kind of ['asha-unborn', 'asha-drafts', 'asha-long']) expect(web).toContain(`seed === '${kind}'`);
  });
});

describe('[BL-410] the seeds the missing-screens journey (J26) opens', () => {
  let close = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), newId }).ok).toBe(true);
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  const onBook = (childId: string) => store.listBookEntries(childId).length;

  it('the plain seed: one born child, six letters on the Book (one private), one draft', () => {
    seedAsha();
    const [asha] = store.listChildren();
    expect(asha.birthday).not.toBeNull();
    expect(onBook(asha.id)).toBe(6);
    expect(store.listDrafts(asha.id)).toHaveLength(1);
  });

  it('asha-unborn: no birthday, a due date ahead, nothing written', () => {
    seedAsha({ unborn: true });
    const [asha] = store.listChildren();
    expect(asha.name).toBe('Asha');
    expect(asha.birthday).toBeNull();
    expect(asha.dueDate! > store.todayISO(new Date())).toBe(true);
    expect(onBook(asha.id)).toBe(0);
    expect(store.listDrafts(asha.id)).toHaveLength(0);
  });

  it('asha-drafts: two drafts with words, the usual one newest', () => {
    seedAsha({ drafts: true });
    const [asha] = store.listChildren();
    const drafts = store.listDrafts(asha.id);
    expect(drafts).toHaveLength(2);
    expect(drafts[0].rawTranscript).toMatch(/^Asha, um, today you you held the spoon/);
    expect(drafts[1].rawTranscript).toMatch(/^Asha, you sat in the laundry basket/);
    expect(drafts[0].createdAt > drafts[1].createdAt).toBe(true);
  });

  it('asha-long: 24 more letters in the book', () => {
    seedAsha({ long: true });
    const [asha] = store.listChildren();
    expect(onBook(asha.id)).toBe(6 + 24);
  });
});
