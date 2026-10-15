/**
 * Licence notices (release requirement; the Licences screen, BL-404). The app ships the notice of
 * every production npm package, bundled font and third-party native module, because MIT, BSD,
 * Apache and ISC ask for it. src/generated/licences.json is made by scripts/licences/generate.mjs
 * (`npm run licences:generate -w @scribe/mobile`). These tests fail when that file is missing,
 * empty or stale against package-lock.json, so a dependency change cannot ship without it being
 * regenerated. The lockfile walk itself is proved on a small synthetic lockfile. Only the
 * vendored-code check reads node_modules (the licence file the shim's notice comes from).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMMAND,
  OUTPUT,
  SHIMS,
  VENDORED,
  buildNotices,
  creditedFiles,
  dependencyHash,
  dependencyIds,
  flattenNpmLs,
  inheritNotices,
  licenceName,
  normaliseRepository,
  normaliseText,
  productionPackages,
  resolveFrom,
  shippedPackages,
  vendoredEntries,
  workspaceNames,
} from '../../../scripts/licences/lib.mjs';
import type { Notices } from '../src/lib/licences';

const REPO = join(__dirname, '..', '..', '..');
const FILE = join(REPO, OUTPUT);
const STALE = `${OUTPUT} is missing or stale. Run: ${COMMAND}`;

const load = (): Notices & { $comment: string } => JSON.parse(readFileSync(FILE, 'utf8'));
const allEntries = (n: Notices) => n.licences.flatMap((g) => g.entries);

describe('the generated notices file (src/generated/licences.json)', () => {
  it('exists and is not empty', () => {
    expect(existsSync(FILE), STALE).toBe(true);
    expect(statSync(FILE).size, STALE).toBeGreaterThan(10_000);
    const n = load();
    expect(n.licences.length, STALE).toBeGreaterThan(0);
    expect(allEntries(n).length, STALE).toBeGreaterThan(100);
    expect(n.texts.length, STALE).toBeGreaterThan(0);
  });

  it('is fresh: its dependency hash is the hash of the production set in package-lock.json', () => {
    const lock = JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8'));
    const expected = dependencyHash(shippedPackages(productionPackages(lock)));
    expect(load().dependencyHash, STALE).toBe(expected);
  });

  it('says it is made by the generator, and how', () => {
    expect(load().$comment).toContain('scripts/licences/generate.mjs');
    expect(load().$comment).toContain(COMMAND);
  });

  it('names a licence for every group and points every notice at a text that exists', () => {
    const n = load();
    for (const g of n.licences) {
      expect(g.id.length, g.name).toBeGreaterThan(0);
      expect(g.name.length, g.id).toBeGreaterThan(0);
      expect(g.entries.length, g.id).toBeGreaterThan(0);
      for (const e of g.entries) {
        expect(['library', 'font', 'native', 'data', 'vendored'], e.name).toContain(e.kind);
        if (e.text !== null) {
          expect(Number.isInteger(e.text) && e.text >= 0 && e.text < n.texts.length, `${e.name} text index`).toBe(true);
          expect(n.texts[e.text].trim().length, `${e.name} notice`).toBeGreaterThan(20);
        }
      }
    }
    expect(new Set(n.licences.map((g) => g.id)).size).toBe(n.licences.length);
  });

  it('covers the libraries, fonts and icons the app is built from, and none of our own packages', () => {
    const n = load();
    const names = new Set(allEntries(n).map((e) => e.name));
    for (const lib of ['react', 'react-native', 'expo', 'expo-router', 'phosphor-react-native', 'whisper.rn', 'react-native-reanimated']) {
      expect(names.has(lib), lib).toBe(true);
    }
    expect([...names].filter((x) => x.startsWith('@scribe/'))).toEqual([]);
    const fonts = allEntries(n).filter((e) => e.kind === 'font');
    expect(fonts.map((f) => f.name)).toEqual(['Literata', 'Mukta', 'Tiro Devanagari Hindi']);
    for (const f of fonts) {
      expect(f.text, f.name).not.toBeNull();
      expect(n.texts[f.text!], f.name).toContain('SIL OPEN FONT LICENSE');
    }
    const ofl = n.licences.find((g) => g.id === 'OFL-1.1');
    expect(ofl?.name).toBe('SIL Open Font License 1.1');
  });

  it('ships the notice text for nearly every package (only packages published without one lack it)', () => {
    const libs = allEntries(load()).filter((e) => e.kind === 'library');
    const withText = libs.filter((e) => e.text !== null).length;
    expect(withText / libs.length).toBeGreaterThan(0.85);
    const mit = load().licences.find((g) => g.id === 'MIT');
    expect(mit).toBeDefined();
    expect(load().texts[mit!.entries.find((e) => e.name === 'react')!.text!]).toMatch(/MIT License[\s\S]*Copyright \(c\) Meta Platforms/);
  });

  it('is grouped by licence, largest group first, with entries in name order', () => {
    const n = load();
    const sizes = n.licences.map((g) => g.entries.length);
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
    expect(n.licences[0].id).toBe('MIT');
    for (const g of n.licences) {
      const names = g.entries.map((e) => e.name);
      expect([...names].sort((a, b) => a.localeCompare(b, 'en')), g.id).toEqual(names);
    }
  });

  it('leaves host-specific build binaries out: they never ship in the app', () => {
    const names = allEntries(load()).map((e) => e.name);
    expect(names.filter((x) => /-(darwin|linux|win32|android|freebsd)-/.test(x))).toEqual([]);
    expect(names).toContain('lightningcss');
  });

  it('lists each name@version once, and a package without its own licence file carries its monorepo root notice', () => {
    const n = load();
    const ids = allEntries(n).map((e) => (e.version ? `${e.name}@${e.version}` : e.name));
    expect(new Set(ids).size).toBe(ids.length);
    for (const name of ['expo-router', '@react-native/js-polyfills', '@react-native/virtualized-lists']) {
      const e = allEntries(n).find((x) => x.name === name);
      expect(e?.text, name).not.toBeNull();
      expect(e?.noticeFrom, name).toBeDefined();
    }
    for (const e of allEntries(n).filter((x) => x.noticeFrom)) expect(e.text, e.name).not.toBeNull();
  });

  it('credits third-party code adapted into shims/: every credited file is in VENDORED and in the file, with its notice', () => {
    const listed = VENDORED.map((v) => v.file).sort();
    expect(creditedFiles(join(REPO, SHIMS)).map((f) => `${SHIMS}/${f}`)).toEqual(listed);
    const n = load();
    for (const v of VENDORED) {
      const e = allEntries(n).find((x) => x.kind === 'vendored' && x.name === v.name && x.version === v.version);
      expect(e, `${v.file} is missing from ${OUTPUT}. Run: ${COMMAND}`).toBeDefined();
      expect(n.licences.find((g) => g.entries.includes(e!))?.id).toBe(v.licence);
      expect(n.texts[e!.text!], v.file).toBe(vendoredEntries(REPO, JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8')), [v])[0].text);
    }
  });
});

describe('the production set from the lockfile (scripts/licences/lib.mjs)', () => {
  // A small lockfile v3 with everything the walk must get right: a nested node_modules, a dev-only
  // package, a missing optional and a missing peer, an installed peer, an alias, a bundled
  // dependency, a host-specific binary and a workspace link.
  const lock = {
    lockfileVersion: 3,
    packages: {
      '': { name: 'asha', workspaces: ['apps/*', 'packages/*'] },
      'apps/app': {
        name: '@asha/app',
        dependencies: { a: '^1', '@asha/lib': '*', alias: 'npm:real@1' },
        devDependencies: { d: '^1' },
        optionalDependencies: { o: '^1' },
        peerDependencies: { p: '^1', q: '^1' },
      },
      'packages/lib': { name: '@asha/lib', dependencies: { c: '^1' } },
      'node_modules/@asha/app': { resolved: 'apps/app', link: true },
      'node_modules/@asha/lib': { resolved: 'packages/lib', link: true },
      'node_modules/a': { version: '1.0.0', license: 'MIT', dependencies: { b: '^2' } },
      'node_modules/b': { version: '1.0.0', license: 'ISC' },
      'node_modules/a/node_modules/b': { version: '2.0.0', license: 'ISC', optionalDependencies: { bin: '*' } },
      'node_modules/bin': { version: '1.0.0', license: 'MIT', optional: true, os: ['darwin'] },
      'node_modules/c': { version: '1.0.0', license: 'Apache-2.0', bundleDependencies: ['inside'], dependencies: { inside: '*' } },
      'node_modules/d': { version: '1.0.0', dev: true, license: 'MIT' },
      'node_modules/p': { version: '1.0.0', license: 'MIT', peer: true },
      'node_modules/alias': { name: 'real', version: '1.0.0', license: 'MIT' },
    },
  };

  it('follows production, optional and peer edges, nearest node_modules first, through workspace links', () => {
    const set = productionPackages(lock, 'apps/app');
    expect([...set.keys()]).toEqual(['node_modules/a', 'node_modules/alias', 'node_modules/p', 'node_modules/a/node_modules/b', 'node_modules/c', 'node_modules/bin']);
    expect(dependencyIds([...set.values()])).toEqual(['a@1.0.0', 'b@2.0.0', 'bin@1.0.0', 'c@1.0.0', 'p@1.0.0', 'real@1.0.0']);
    expect(set.get('node_modules/alias')?.licence).toBe('MIT');
  });

  it('lists no dev-only package, no workspace of ours and no bundled dependency', () => {
    const ids = dependencyIds([...productionPackages(lock, 'apps/app').values()]);
    expect(ids.some((id) => id.startsWith('d@') || id.startsWith('@asha/') || id.startsWith('inside@'))).toBe(false);
  });

  it('marks host-specific binaries and leaves them out of what ships', () => {
    const set = productionPackages(lock, 'apps/app');
    expect(set.get('node_modules/bin')?.hostSpecific).toBe(true);
    expect(shippedPackages(set).map((p) => p.name)).toEqual(['a', 'b', 'c', 'p', 'real']);
  });

  it('fails loudly on a lockfile that cannot resolve a regular dependency', () => {
    expect(() => productionPackages({ packages: { 'apps/app': { dependencies: { gone: '*' } } } }, 'apps/app')).toThrow(/gone/);
    expect(() => productionPackages({ packages: {} }, 'apps/app')).toThrow(/apps\/app/);
  });

  it('resolves the way Node does', () => {
    expect(resolveFrom(lock.packages, 'node_modules/a', 'b')).toBe('node_modules/a/node_modules/b');
    expect(resolveFrom(lock.packages, 'apps/app', 'b')).toBe('node_modules/b');
    expect(resolveFrom(lock.packages, 'node_modules/a/node_modules/b', 'bin')).toBe('node_modules/bin');
    expect(resolveFrom(lock.packages, 'apps/app', 'nothing')).toBeNull();
  });

  it('hashes the sorted name@version list, so the same set always hashes the same and a version change does not', () => {
    const h = dependencyHash(shippedPackages(productionPackages(lock, 'apps/app')));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(dependencyHash([{ name: 'b', version: '1' }, { name: 'a', version: '1' }])).toBe(dependencyHash([{ name: 'a', version: '1' }, { name: 'b', version: '1' }]));
    expect(dependencyHash([{ name: 'a', version: '1' }])).not.toBe(dependencyHash([{ name: 'a', version: '2' }]));
  });

  it('reads our workspace names from the links', () => {
    expect([...workspaceNames(lock)].sort()).toEqual(['@asha/app', '@asha/lib']);
  });

  it('flattens npm ls output and skips a peer that is not installed (an empty object)', () => {
    const flat = flattenNpmLs({ dependencies: { a: { version: '1.0.0', path: '/x/a', license: 'MIT', dependencies: { b: { version: '2.0.0' }, missing: {} } } } });
    expect([...flat.keys()]).toEqual(['a@1.0.0', 'b@2.0.0']);
  });
});

describe('the notices file layout', () => {
  it('groups by licence, largest group first, and stores each distinct text once', () => {
    const built = buildNotices({
      entries: [
        { name: 'z', version: '1.0.0', kind: 'library', licence: 'MIT', text: 'T1\n' },
        { name: 'a', version: '1.0.0', kind: 'library', licence: 'MIT', text: 'T1\n' },
        { name: 'f', kind: 'font', licence: 'OFL-1.1', text: 'T2\n' },
        { name: 'n', version: '1.0.0', kind: 'library', licence: null, text: null },
      ],
      dependencyHash: 'h',
    });
    expect(built.licences.map((g) => g.id)).toEqual(['MIT', 'OFL-1.1', 'UNKNOWN']);
    expect(built.licences[0].entries.map((e) => e.name)).toEqual(['a', 'z']);
    expect(built.licences[0].entries.map((e) => e.text)).toEqual([0, 0]);
    expect(built.licences[1].entries[0]).toEqual({ name: 'f', kind: 'font', text: 1 });
    expect(built.licences[2].entries[0].text).toBeNull();
    expect(built.texts).toEqual(['T1\n', 'T2\n']);
    expect(built.dependencyHash).toBe('h');
    expect(built.$comment).toContain(COMMAND);
  });

  it('names licences in plain words and leaves an unknown id as it is', () => {
    expect(licenceName('MIT')).toBe('MIT License');
    expect(licenceName('OFL-1.1')).toBe('SIL Open Font License 1.1');
    expect(licenceName('(MIT OR CC0-1.0)')).toBe('MIT License or CC0 1.0 Universal');
    expect(licenceName('MIT AND Apache-2.0')).toBe('MIT License and Apache License 2.0');
    expect(licenceName('WTFPL')).toBe('WTFPL');
  });

  it('normalises only whitespace in a notice; the words stay as written', () => {
    expect(normaliseText('﻿Copyright (c) Asha  \r\nMIT\r\n\r\n')).toBe('Copyright (c) Asha\nMIT\n');
  });

  it('reads a repository as one comparable URL, whichever way package.json writes it', () => {
    for (const form of ['github:expo/expo', 'expo/expo', 'git+https://github.com/expo/expo.git', 'git://github.com/Expo/expo', 'git@github.com:expo/expo.git', 'https://github.com/expo/expo/tree/main/packages/expo-router', { type: 'git', url: 'https://github.com/expo/expo.git', directory: 'packages/expo-router' }]) {
      expect(normaliseRepository(form), JSON.stringify(form)).toBe('https://github.com/expo/expo');
    }
    expect(normaliseRepository(undefined)).toBeNull();
    expect(normaliseRepository({ type: 'git' })).toBeNull();
  });

  it('fills a missing notice from siblings in the same repository only when they agree, reading from the shortest-named one', () => {
    const repo = 'https://github.com/asha/mono';
    const out = inheritNotices([
      { name: '@asha/tool', licence: 'MIT', text: null, repository: repo },
      { name: 'asha', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: 'asha-audio', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: 'asha-old', licence: 'MIT', text: 'OLD\n', repository: repo },
      { name: 'other', licence: 'ISC', text: null, repository: repo },
      { name: 'alone', licence: 'MIT', text: null, repository: 'https://github.com/asha/alone' },
      { name: 'nowhere', licence: 'MIT', text: null, repository: null },
    ]);
    expect(out[0]).toMatchObject({ text: 'ROOT\n', noticeFrom: 'asha' });
    expect(out.slice(1, 4).map((e) => e.noticeFrom)).toEqual([undefined, undefined, undefined]);
    expect(out.slice(4).map((e) => e.text)).toEqual([null, null, null]);
    // A tie is no majority: nothing is inherited.
    const tie = inheritNotices([
      { name: 'x', licence: 'MIT', text: null, repository: repo },
      { name: 'a', licence: 'MIT', text: 'A\n', repository: repo },
      { name: 'b', licence: 'MIT', text: 'B\n', repository: repo },
    ]);
    expect(tie[0].text).toBeNull();
  });
});
