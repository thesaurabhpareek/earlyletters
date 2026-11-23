/// <reference types="node" />
// NS-53-R220, CPO-29 (PR 9a): the TypeScript surface of the library read. No native call, no fetch, no permission
// string. Fictional family Asha only.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accessCase, accessStateFor, nullSource, type NativeAccessStatus } from '../src/lib/moments/library';
import { fixtureSource } from './helpers/moments-fixture-source';

const LIB = join(__dirname, '../src/lib/moments/library');
const SRC = join(__dirname, '../src');

describe('accessStateFor (native status to the app state)', () => {
  it.each([
    ['notDetermined', 'notDetermined'],
    ['full', 'full'],
    ['limited', 'limited'],
    ['denied', 'denied'],
    ['restricted', 'restricted'],
    ['unavailable', 'off'],
  ] as const)('%s gives %s', (native, state) => {
    expect(accessStateFor(native, { libraryOn: true })).toBe(state);
  });
  it('is off whatever the phone says when the library flag is off', () => {
    for (const s of ['notDetermined', 'full', 'limited', 'denied', 'restricted'] as NativeAccessStatus[]) {
      expect(accessStateFor(s, { libraryOn: false })).toBe('off');
    }
  });
  it('treats a value it does not know as off, never as access', () => {
    expect(accessStateFor('somethingNew' as NativeAccessStatus, { libraryOn: true })).toBe('off');
  });
});

describe('accessCase (ACC-0 to ACC-5)', () => {
  it('maps each state to its row', () => {
    expect(accessCase('notDetermined', { notNow: false })).toBe('ACC-0');
    expect(accessCase('full', { notNow: false })).toBe('ACC-2');
    expect(accessCase('limited', { notNow: false })).toBe('ACC-3');
    expect(accessCase('denied', { notNow: false })).toBe('ACC-4');
    expect(accessCase('restricted', { notNow: false })).toBe('ACC-5');
    expect(accessCase('off', { notNow: false })).toBe('FLAG_OFF');
  });
  it('a parent who chose Not now sees ACC-1, only while the phone has not been asked', () => {
    expect(accessCase('notDetermined', { notNow: true })).toBe('ACC-1');
    expect(accessCase('full', { notNow: true })).toBe('ACC-2');
    expect(accessCase('off', { notNow: true })).toBe('FLAG_OFF');
  });
});

describe('nullSource', () => {
  it('reports unavailable, asks for nothing, and returns an empty window', async () => {
    expect(await nullSource.accessStatus()).toBe('unavailable');
    expect(await nullSource.requestAccess()).toBe('unavailable');
    const w = await nullSource.fetchWindow({ fromMs: 0, toMs: 1, limit: 10 });
    expect(w.ids).toEqual([]);
    expect(w.creationMs.length).toBe(0);
    expect(w.truncated).toBe(false);
    expect(() => nullSource.cancel()).not.toThrow();
  });
});

describe('fixtureSource (test helper)', () => {
  it('serves the window it was given', async () => {
    const empty = await nullSource.fetchWindow({ fromMs: 0, toMs: 1, limit: 1 });
    const src = fixtureSource('limited', { ...empty, ids: ['asha-1'] });
    expect(await src.accessStatus()).toBe('limited');
    expect((await src.fetchWindow({ fromMs: 0, toMs: 1, limit: 1 })).ids).toEqual(['asha-1']);
  });
});

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
  );

describe('source scans (CPO-29)', () => {
  const lib = files(LIB).map((f) => ({ f, text: readFileSync(f, 'utf8') }));
  it('has files to scan', () => expect(lib.length).toBeGreaterThanOrEqual(4));
  it('imports nothing native: only relative files and type-only @scribe/core', () => {
    for (const { f, text } of lib) {
      const specs = [...text.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
      for (const s of specs) expect(s.startsWith('.') || s === '@scribe/core', `${f}: ${s}`).toBe(true);
      expect(text, f).not.toMatch(/^import\s+(?!type\b)[^\n]*['"]@scribe\/core['"]/m);
      expect(text, f).not.toMatch(/require\(|requireNativeModule|NativeModules|\bimport\(/);
    }
  });
  it('holds no fetch, permission string or photo-library word', () => {
    for (const { f, text } of lib) {
      expect(text, f).not.toMatch(/\bfetch\(|XMLHttpRequest|NSPhotoLibrary|PHAsset|PHPhotoLibrary|expo-media-library|scribe-library|modules\//);
    }
  });
  it('is not imported from the fixture, and nothing in src imports a test helper', () => {
    for (const f of files(SRC)) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/moments-fixture-source|from\s+['"][./]*\/test\/helpers/);
    }
  });
  it('is not imported from anywhere in src outside its own folder (flag off, no reachable path)', () => {
    for (const f of files(SRC).filter((p) => !p.startsWith(LIB))) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/moments\/library/);
    }
  });
});
