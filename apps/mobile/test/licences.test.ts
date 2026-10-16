/**
 * Licence notices (release requirement; read by the Licenses page, EXPERIENCE_PASS_2026-10 P6).
 * The app ships the notice of every production npm package, bundled font, third-party native
 * module and vendored file, because MIT, BSD, Apache and ISC ask for it.
 * src/generated/licences.json is made by scripts/licences/generate.mjs
 * (`npm run licences:generate -w @scribe/mobile`).
 *
 * Staleness: the file must be exactly what the generator writes today. The first tests run
 * `generate.mjs --check`, which re-derives the whole file from package-lock.json, node_modules, the
 * fonts, the native modules, packs/ and shims/ and compares it byte for byte, so any drift fails
 * `npm test`: a dependency change, a new font or module, or a hand edit. Fixture repos prove that
 * each of those sources reaches the file. The lockfile walk is proved on a synthetic lockfile.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { licences as content } from '@scribe/content';
import {
  COMMAND,
  OUTPUT,
  SHIMS,
  UNKNOWN,
  VENDORED,
  buildNotices,
  creditedFiles,
  deriveNotices,
  dependencyHash,
  dependencyIds,
  flattenNpmLs,
  fontEntries,
  inheritNotices,
  licenceName,
  nativeModuleEntries,
  normaliseRepository,
  normaliseText,
  packDataEntries,
  productionPackages,
  resolveFrom,
  serialise,
  shippedPackages,
  vendoredEntries,
  workspaceNames,
} from '../../../scripts/licences/lib.mjs';
import { handKeptSections, noticeKey, noticeText, notices, type Notices } from '../src/lib/licences';

const REPO = join(__dirname, '..', '..', '..');
const FILE = join(REPO, OUTPUT);
const GENERATOR = join(REPO, 'scripts', 'licences', 'generate.mjs');
const STALE = `${OUTPUT} is missing or stale. Run: ${COMMAND}`;
/** The generator reads about 650 licence files and runs `npm ls`: a few seconds, longer on a busy machine. */
const SLOW = 120_000;

const load = (): Notices & { $comment: string } => JSON.parse(readFileSync(FILE, 'utf8'));
const allEntries = (n: Notices) => n.licences.flatMap((g) => g.entries);
const generator = (...args: string[]) => spawnSync(process.execPath, [GENERATOR, ...args], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const temp: string[] = [];
afterEach(() => {
  for (const dir of temp.splice(0)) rmSync(dir, { recursive: true, force: true });
});
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'licences-'));
  temp.push(dir);
  return dir;
};

describe('the generated notices file is exactly what the generator writes today', () => {
  it(
    'generate.mjs --check passes: no dependency, font, module, pack or shim change and no hand edit since it was made',
    () => {
      const r = generator('--check');
      expect(r.status, `${STALE}\n${r.stdout}${r.stderr}`).toBe(0);
      expect(r.stdout).toContain('is up to date');
    },
    SLOW,
  );

  it(
    'a hand edit fails the check even when the dependency hash is kept (40 entries deleted, one notice reworded)',
    () => {
      const n = load();
      const mit = n.licences.find((g) => g.id === 'MIT')!;
      mit.entries.splice(0, 40);
      n.texts[0] = n.texts[0].replace(/Permission/, 'Leave');
      const edited = join(tempDir(), 'licences.json');
      writeFileSync(edited, `${JSON.stringify(n, null, 2)}\n`);
      const r = generator('--check', '--against', edited);
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/stale or edited by hand/);
    },
    SLOW,
  );

  it('its npm set matches package-lock.json (the same check without node_modules)', () => {
    const lock = JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8'));
    expect(load().dependencyHash, STALE).toBe(dependencyHash(shippedPackages(productionPackages(lock))));
  });

  it('carries exactly the fonts, native modules and pack licence files the repo has today', () => {
    const n = load();
    const names = (kind: string) => allEntries(n).filter((e) => e.kind === kind).map((e) => e.name);
    expect(names('font'), STALE).toEqual(fontEntries(join(REPO, 'packages', 'design-tokens', 'fonts')).map((f) => f.name));
    expect(names('native'), STALE).toEqual(nativeModuleEntries(join(REPO, 'apps', 'mobile', 'modules')).entries.map((e) => e.name));
    expect(names('data'), STALE).toEqual(packDataEntries(join(REPO, 'packs')).map((e) => e.name));
    expect(names('font')).toEqual(['Literata', 'Mukta', 'Tiro Devanagari Hindi']);
  });
});

describe('every source reaches the file (deriveNotices on a fixture repo)', () => {
  /** A repo with one npm package, one font and one of our own native modules; Asha is the fictional family. */
  function fixture() {
    const root = tempDir();
    const w = (rel: string, text: string) => {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), text);
    };
    w(
      'package-lock.json',
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          '': { name: 'asha', workspaces: ['apps/*'] },
          'apps/mobile': { name: '@scribe/mobile', dependencies: { a: '^1' } },
          'node_modules/@scribe/mobile': { resolved: 'apps/mobile', link: true },
          'node_modules/a': { version: '1.0.0', license: 'MIT' },
        },
      }),
    );
    w('node_modules/a/package.json', JSON.stringify({ name: 'a', version: '1.0.0', license: 'MIT' }));
    w('node_modules/a/LICENSE', 'MIT License\n\nCopyright (c) 2026 Asha\n');
    w('packages/design-tokens/fonts/Asha-Regular.ttf', '');
    w('packages/design-tokens/fonts/OFL-Asha.txt', 'Copyright 2026 The Asha Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n');
    w('apps/mobile/modules/asha-own/ios/AshaOwn.podspec', "s.license = 'UNLICENSED'\n");
    return { root, w, derive: () => deriveNotices(root, { vendored: [] }) };
  }
  const kinds = (d: ReturnType<typeof deriveNotices>) => d.entries.map((e) => `${e.kind}:${e.name}`).sort();

  it('starts from one library and one font; our own module is not listed', () => {
    const d = fixture().derive();
    expect(kinds(d)).toEqual(['font:Asha', 'library:a']);
    expect(d.native.own).toEqual(['asha-own']);
    expect(d.json).toBe(serialise(d.notices));
  });

  it('a new font licence changes the file', () => {
    const f = fixture();
    const before = f.derive();
    f.w('packages/design-tokens/fonts/Bina-Regular.ttf', '');
    f.w('packages/design-tokens/fonts/OFL-Bina.txt', 'Copyright 2026 The Bina Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n');
    const after = f.derive();
    expect(after.json).not.toBe(before.json);
    expect(kinds(after)).toContain('font:Bina');
    expect(after.hash).toBe(before.hash); // the npm hash alone would not have seen it
  });

  it('a font without its licence file stops the generator', () => {
    const f = fixture();
    f.w('packages/design-tokens/fonts/Cara-Regular.ttf', '');
    expect(() => f.derive()).toThrow(/Cara/);
  });

  it('a third-party native module changes the file', () => {
    const f = fixture();
    const before = f.derive();
    f.w('apps/mobile/modules/asha-maps/package.json', JSON.stringify({ name: 'asha-maps', version: '2.0.0', license: 'MIT' }));
    f.w('apps/mobile/modules/asha-maps/LICENSE', 'MIT License\n\nCopyright (c) 2026 Asha Maps\n');
    const after = f.derive();
    expect(after.json).not.toBe(before.json);
    expect(kinds(after)).toContain('native:asha-maps');
  });

  it('a licence file under packs/ changes the file', () => {
    const f = fixture();
    const before = f.derive();
    f.w('packs/text-rules/LICENSE-data.txt', 'MIT License\n\nCopyright (c) 2026 Asha Data\n');
    const after = f.derive();
    expect(after.json).not.toBe(before.json);
    expect(kinds(after)).toContain('data:text-rules/LICENSE-data.txt');
  });

  it('a shim that credits third-party code but is not in VENDORED stops the generator', () => {
    const f = fixture();
    f.w(`${SHIMS}/asha.js`, "'use strict';\n/** Adapted from asha 1.0.0, MIT License, Copyright (c) 2026 Asha. */\nmodule.exports = 1;\n");
    expect(() => f.derive()).toThrow(/VENDORED/);
  });
});

describe('the generated notices file (src/generated/licences.json)', () => {
  it('exists and is not empty', () => {
    expect(existsSync(FILE), STALE).toBe(true);
    expect(statSync(FILE).size, STALE).toBeGreaterThan(10_000);
    const n = load();
    expect(n.licences.length, STALE).toBeGreaterThan(0);
    expect(allEntries(n).length, STALE).toBeGreaterThan(100);
    expect(n.texts.length, STALE).toBeGreaterThan(0);
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
    for (const f of allEntries(n).filter((e) => e.kind === 'font')) {
      expect(f.text, f.name).not.toBeNull();
      expect(n.texts[f.text!], f.name).toContain('SIL OPEN FONT LICENSE');
    }
    expect(n.licences.find((g) => g.id === 'OFL-1.1')?.name).toBe('SIL Open Font License 1.1');
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
    // The label names the shortest sibling with that text: expo, not @expo/cli.
    expect(allEntries(n).find((x) => x.name === 'expo-router')?.noticeFrom).toBe('expo');
    expect(allEntries(n).find((x) => x.name === '@expo/ui')?.noticeFrom).toBe('expo');
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

describe('what the Licenses page reads (src/lib/licences.ts)', () => {
  it('is the generated file, with a unique key and a readable notice for each row', () => {
    expect(notices.dependencyHash).toBe(load().dependencyHash);
    const entries = notices.licences.flatMap((g) => g.entries);
    expect(new Set(entries.map(noticeKey)).size).toBe(entries.length);
    const react = entries.find((e) => e.name === 'react')!;
    expect(noticeText(react)).toMatch(/^MIT License/);
    expect(noticeText({ name: 'none', kind: 'library', text: null })).toBeNull();
    expect(noticeKey({ name: 'Mukta', kind: 'font', text: 0 })).toBe('Mukta');
  });

  it('lists each credit once: the hand-kept sections drop what the generated list carries (the fonts)', () => {
    const squash = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    const generated = new Set(notices.licences.flatMap((g) => g.entries.map((e) => squash(e.name))));
    const handKept = handKeptSections.flatMap((s) => s.items.map((it) => it.name));
    expect(handKept.filter((name) => generated.has(squash(name)))).toEqual([]);
    // The three fonts are in content's Fonts section today and come from the generated list instead.
    const contentFonts = content.sections.find((s) => s.title === 'Fonts')?.items.map((it) => it.name) ?? [];
    expect(contentFonts.length).toBeGreaterThan(0);
    for (const font of contentFonts) {
      expect(handKept, font).not.toContain(font);
      expect(generated.has(squash(font)), font).toBe(true);
    }
    // What only content knows stays: the speech models and the Phosphor icon artwork.
    expect(handKept).toEqual(expect.arrayContaining(['whisper.cpp and Whisper models', 'Silero VAD', 'Phosphor Icons']));
    expect(handKeptSections.every((s) => s.items.length > 0)).toBe(true);
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

  it('hashes the sorted name@version list: order does not change it, a version change does', () => {
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
    expect(built.licences.map((g) => g.id)).toEqual(['MIT', 'OFL-1.1', UNKNOWN]);
    expect(built.licences[0].entries.map((e) => e.name)).toEqual(['a', 'z']);
    expect(built.licences[0].entries.map((e) => e.text)).toEqual([0, 0]);
    expect(built.licences[1].entries[0]).toEqual({ name: 'f', kind: 'font', text: 1 });
    expect(built.licences[2].entries[0].text).toBeNull();
    expect(built.texts).toEqual(['T1\n', 'T2\n']);
    expect(built.dependencyHash).toBe('h');
    expect(built.$comment).toContain(COMMAND);
  });

  it('names licences in plain words, leaves an unknown id as it is, and gives UNKNOWN no wording of its own (copy owns it)', () => {
    expect(licenceName('MIT')).toBe('MIT License');
    expect(licenceName('OFL-1.1')).toBe('SIL Open Font License 1.1');
    expect(licenceName('(MIT OR CC0-1.0)')).toBe('MIT License or CC0 1.0 Universal');
    expect(licenceName('MIT AND Apache-2.0')).toBe('MIT License and Apache License 2.0');
    expect(licenceName('WTFPL')).toBe('WTFPL');
    expect(licenceName(UNKNOWN)).toBe('UNKNOWN');
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

  it('names the shortest sibling whatever order the siblings arrive in (longer names first here)', () => {
    const repo = 'https://github.com/asha/mono';
    const siblings = [
      { name: '@asha/cli', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: '@asha/config', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: 'asha', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: 'asha-router', licence: 'MIT', text: null, repository: repo },
    ];
    expect(inheritNotices(siblings)[3].noticeFrom).toBe('asha');
    expect(inheritNotices([...siblings].reverse())[0].noticeFrom).toBe('asha');
    // Same length: alphabetical.
    const same = inheritNotices([
      { name: 'bb', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: 'aa', licence: 'MIT', text: 'ROOT\n', repository: repo },
      { name: 'x', licence: 'MIT', text: null, repository: repo },
    ]);
    expect(same[2].noticeFrom).toBe('aa');
  });
});
