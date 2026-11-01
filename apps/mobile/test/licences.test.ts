/**
 * Licence notices (release requirement; read by the Licenses page, EXPERIENCE_PASS_2026-10 S40).
 * The page lists what ships in the iOS app and nothing else, grouped by theme, with the full notice
 * MIT, BSD, Apache, ISC and OFL ask for. src/generated/licences.json is made by
 * scripts/licences/generate.mjs (`npm run licences:generate -w @scribe/mobile`) from package-lock.json
 * and the table in scripts/licences/components.mjs.
 *
 * Staleness: `generate.mjs --check` re-derives the whole file and compares it byte for byte.
 * Coverage: the table must match the lockfile: every package the app's production tree reaches
 * through shipped packages is either listed with a theme or left out with a reason, and every
 * listed one is still reached. scripts/licences/verify-shipped.mjs proves the table against a real
 * iOS export (too slow for `npm test`; a release step).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { licences as content } from '@scribe/content';
import { INJECTED, NON_NPM, NOT_SHIPPED, PACKAGES, TABLE, THEMES, UPSTREAM_NOTICES } from '../../../scripts/licences/components.mjs';
import {
  COMMAND,
  OUTPUT,
  SHIMS,
  UNKNOWN,
  VENDORED,
  buildNotices,
  copyrightOf,
  creditedFiles,
  deriveNotices,
  dependencyHash,
  dependencyIds,
  flattenNpmLs,
  fontEntries,
  inheritNotices,
  injectedPackages,
  licenceName,
  needsReview,
  normaliseRepository,
  normaliseText,
  productionPackages,
  resolveFrom,
  serialise,
  shippedFromLock,
  shippedPackages,
  tableProblems,
  vendoredEntries,
  workspaceNames,
} from '../../../scripts/licences/lib.mjs';
import { noticeKey, noticeText, notices, type Notices } from '../src/lib/licences';
import { SPEECH_MODELS, VAD_MODEL_ID, WHISPER_CPP_BUILD } from '../src/lib/models/catalog';

const REPO = join(__dirname, '..', '..', '..');
const FILE = join(REPO, OUTPUT);
const GENERATOR = join(REPO, 'scripts', 'licences', 'generate.mjs');
const THIRD_PARTY = join(REPO, 'scripts', 'licences', 'third-party');
const STALE = `${OUTPUT} is missing or stale. Run: ${COMMAND}`;
/** The generator reads a few hundred licence files and runs `npm ls`: a few seconds, longer on a busy machine. */
const SLOW = 120_000;

const load = (): Notices & { $comment: string } => JSON.parse(readFileSync(FILE, 'utf8'));
const allEntries = (n: Notices) => n.themes.flatMap((g) => g.entries);
const lockfile = () => JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8'));
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
    'generate.mjs --check passes: no dependency, table, font, module, pack or shim change and no hand edit since it was made',
    () => {
      const r = generator('--check');
      expect(r.status, `${STALE}\n${r.stdout}${r.stderr}`).toBe(0);
      expect(r.stdout).toContain('is up to date');
    },
    SLOW,
  );

  it(
    'a hand edit fails the check even when the dependency hash is kept (entries deleted, one notice reworded)',
    () => {
      const n = load();
      n.themes[0].entries.splice(0, 2);
      n.texts[0] = n.texts[0].replace(/Permission/, 'Leave');
      const edited = join(tempDir(), 'licences.json');
      writeFileSync(edited, `${JSON.stringify(n, null, 2)}\n`);
      const r = generator('--check', '--against', edited);
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/stale or edited by hand/);
    },
    SLOW,
  );

  it('its npm set matches package-lock.json read through components.mjs (the same check without node_modules)', () => {
    const lock = lockfile();
    const walk = shippedFromLock(lock, TABLE);
    for (const p of injectedPackages(lock, INJECTED)) walk.shipped.set(p.path, p);
    expect(load().dependencyHash, STALE).toBe(dependencyHash(shippedPackages(walk.shipped)));
  });
});

describe('what ships is decided for every package (scripts/licences/components.mjs against package-lock.json)', () => {
  it('every package the app reaches through shipped packages is listed with a theme or left out with a reason, and nothing listed is stale', () => {
    expect(tableProblems(shippedFromLock(lockfile(), TABLE))).toEqual([]);
  });

  it('gives every listed package a theme the page knows, and every left-out package a reason', () => {
    for (const [name, theme] of Object.entries(PACKAGES)) expect(THEMES, name).toContain(theme);
    for (const c of NON_NPM) expect(THEMES, c.name).toContain(c.theme);
    for (const [name, why] of Object.entries(NOT_SHIPPED)) expect(why.length, name).toBeGreaterThan(5);
    expect(Object.keys(PACKAGES).filter((n) => Object.hasOwn(NOT_SHIPPED, n))).toEqual([]);
    // Every theme has its title and line in packages/content.
    for (const id of THEMES) {
      expect(content.themes[id].title.length, id).toBeGreaterThan(0);
      expect(content.themes[id].line.length, id).toBeGreaterThan(0);
    }
    expect(Object.keys(content.themes).sort()).toEqual([...THEMES].sort());
  });

  it('lists no build tool, web-only, type or development-only package', () => {
    const names = new Set(allEntries(load()).map((e) => e.name));
    for (const n of ['metro', '@expo/cli', '@babel/core', 'babel-preset-expo', 'react-dom', 'react-native-web', 'typescript', 'lightningcss', 'tailwindcss', '@types/react', 'react-devtools-core', 'ws', 'expo-build-properties', 'hermes-compiler']) {
      expect(names.has(n), n).toBe(false);
    }
    expect([...names].filter((x) => x.startsWith('@scribe/'))).toEqual([]);
    expect([...names].filter((x) => /-(darwin|linux|win32|android|freebsd)-/.test(x))).toEqual([]);
  });

  it('a package the app newly depends on fails until it is decided; a dropped one fails until it is removed', () => {
    const lock = {
      lockfileVersion: 3,
      packages: {
        '': { name: 'asha', workspaces: ['apps/*'] },
        'apps/mobile': { name: '@scribe/mobile', dependencies: { a: '^1', tool: '^1' } },
        'node_modules/a': { version: '1.0.0', license: 'MIT', dependencies: { b: '^1' } },
        'node_modules/b': { version: '1.0.0', license: 'MIT', dependencies: { deep: '^1' } },
        'node_modules/tool': { version: '1.0.0', license: 'MIT', dependencies: { inner: '^1' } },
        'node_modules/inner': { version: '1.0.0', license: 'MIT' },
        'node_modules/deep': { version: '1.0.0', license: 'MIT' },
      },
    };
    const ok = shippedFromLock(lock, { packages: { a: 'other', b: 'other' }, notShipped: { tool: 'build', deep: 'unused' } });
    expect(tableProblems(ok)).toEqual([]);
    expect([...ok.shipped.values()].map((p) => `${p.name}@${p.version}:${p.theme}`)).toEqual(['a@1.0.0:other', 'b@1.0.0:other']);
    // A left-out package is not descended into: inner is never met.
    const added = shippedFromLock(lock, { packages: { a: 'other' }, notShipped: { tool: 'build', deep: 'unused' } });
    expect(tableProblems(added).join('\n')).toMatch(/b@1\.0\.0 \(needed by a\) is in the app's production tree but neither in PACKAGES/);
    const dropped = shippedFromLock(lock, { packages: { a: 'other', b: 'other', gone: 'other' }, notShipped: { tool: 'build', deep: 'unused', old: 'x' } });
    expect(tableProblems(dropped)).toEqual([
      'gone is in PACKAGES in scripts/licences/components.mjs but the app no longer depends on it: remove it',
      'old is in NOT_SHIPPED in scripts/licences/components.mjs but nothing shipped depends on it any more: remove it',
    ]);
    // A name@version key leaves one copy out and keeps the others.
    const versioned = shippedFromLock(
      { packages: { ...lock.packages, 'node_modules/a': { version: '1.0.0', license: 'MIT', dependencies: { b: '^1' } }, 'node_modules/a/node_modules/b': { version: '2.0.0', license: 'MIT' } } },
      { packages: { a: 'other', b: 'other' }, notShipped: { tool: 'build', 'b@2.0.0': 'unused' } },
    );
    expect([...versioned.shipped.values()].map((p) => p.name)).toEqual(['a']);
  });

  it('resolves injected bundler code through the build package that carries it', () => {
    const lock = { packages: { '': {}, 'node_modules/metro': { version: '1.0.0' }, 'node_modules/metro/node_modules/metro-runtime': { version: '0.9.0', license: 'MIT' } } };
    expect(injectedPackages(lock, [{ name: 'metro-runtime', via: ['metro'], theme: 'framework' }])).toEqual([
      { name: 'metro-runtime', version: '0.9.0', path: 'node_modules/metro/node_modules/metro-runtime', licence: 'MIT', optional: false, hostSpecific: false, theme: 'framework' },
    ]);
    expect(() => injectedPackages(lock, [{ name: 'x', via: ['nothing'], theme: 'other' }])).toThrow(/nothing/);
  });
});

describe('what ships that npm does not list (components.mjs NON_NPM)', () => {
  it('lists exactly the speech models the app can download: every default, hosted model, and the voice detector', () => {
    const downloadable = Object.values(SPEECH_MODELS)
      .filter((m) => (m.status === 'default' && m.hosted) || m.id === VAD_MODEL_ID)
      .map((m) => m.id)
      .sort();
    expect(NON_NPM.filter((c) => c.kind === 'model').map((c) => c.model).sort()).toEqual(downloadable);
    for (const c of NON_NPM.filter((x) => x.kind === 'model')) expect(c.licence, c.name).toBe(SPEECH_MODELS[c.model as keyof typeof SPEECH_MODELS].licence);
  });

  it('credits the whisper.cpp version whisper.rn compiles in', () => {
    const bundled = JSON.parse(readFileSync(join(REPO, 'node_modules', 'whisper.rn', 'src', 'version.json'), 'utf8')).version;
    expect(NON_NPM.find((c) => c.name === 'whisper.cpp and ggml')?.version).toBe(bundled);
    expect(`v${bundled}`).toBe(WHISPER_CPP_BUILD.version);
  });

  it('keeps one licence text per third-party file, each used, none missing', () => {
    const used = new Set([...NON_NPM.map((c) => c.file), ...Object.values(UPSTREAM_NOTICES).map((u) => u.file)]);
    expect(readdirSync(THIRD_PARTY).sort()).toEqual([...used].sort());
    for (const c of NON_NPM) expect(c.source.length, c.name).toBeGreaterThan(10);
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
          'apps/mobile': { name: '@scribe/mobile', dependencies: { a: '^1', tool: '^1' } },
          'node_modules/@scribe/mobile': { resolved: 'apps/mobile', link: true },
          'node_modules/a': { version: '1.0.0', license: 'MIT' },
          'node_modules/tool': { version: '1.0.0', license: 'MIT' },
        },
      }),
    );
    w('node_modules/a/package.json', JSON.stringify({ name: 'a', version: '1.0.0', license: 'MIT' }));
    w('node_modules/a/LICENSE', 'MIT License\n\nCopyright (c) 2026 Asha\n');
    w('node_modules/tool/LICENSE', 'MIT License\n\nCopyright (c) 2026 Asha Tools\n');
    w('packages/design-tokens/fonts/Asha-Regular.ttf', '');
    w('packages/design-tokens/fonts/OFL-Asha.txt', 'Copyright 2026 The Asha Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n');
    w('apps/mobile/modules/asha-own/ios/AshaOwn.podspec', "s.license = 'UNLICENSED'\n");
    w('tp/engine.txt', 'MIT License\n\nCopyright (c) 2026 Asha Engine\n');
    const table = {
      packages: { a: 'other' },
      notShipped: { tool: 'build tool' } as Record<string, string>,
      nonNpm: [{ name: 'Asha Engine', version: '2.0.0', theme: 'framework' as const, kind: 'native' as const, licence: 'MIT', file: 'engine.txt', source: 'fixture', why: 'fixture' }],
      themes: THEMES,
    };
    return { root, w, table, derive: (t = table) => deriveNotices(root, { vendored: [], table: t, thirdPartyDir: join(root, 'tp') }) };
  }
  const kinds = (d: ReturnType<typeof deriveNotices>) => d.entries.map((e) => `${e.kind}:${e.name}`).sort();

  it('lists the shipped library, the font and the native library under their themes; the build tool and our own module are not listed', () => {
    const d = fixture().derive();
    expect(kinds(d)).toEqual(['font:Asha', 'library:a', 'native:Asha Engine']);
    expect(d.notices.themes.map((g) => [g.id, g.entries.map((e) => e.name)])).toEqual([
      ['look', ['Asha']],
      ['framework', ['Asha Engine']],
      ['other', ['a']],
    ]);
    expect(d.notices.themes[1].entries[0]).toMatchObject({ version: '2.0.0', licence: 'MIT', licenceName: 'MIT License', copyright: 'Copyright (c) 2026 Asha Engine' });
    expect(d.native.own).toEqual(['asha-own']);
    expect(d.json).toBe(serialise(d.notices));
  });

  it('stops on a package nobody has decided about', () => {
    const f = fixture();
    expect(() => f.derive({ ...f.table, notShipped: {} })).toThrow(/tool@1\.0\.0 .*neither in PACKAGES/);
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

  it('a missing third-party licence text stops the generator', () => {
    const f = fixture();
    expect(() => f.derive({ ...f.table, nonNpm: [{ ...f.table.nonNpm[0], file: 'gone.txt' }] })).toThrow(/gone\.txt/);
  });

  it('a shim that credits third-party code but is not in VENDORED stops the generator', () => {
    const f = fixture();
    f.w(`${SHIMS}/asha.js`, "'use strict';\n/** Adapted from asha 1.0.0, MIT License, Copyright (c) 2026 Asha. */\nmodule.exports = 1;\n");
    expect(() => f.derive()).toThrow(/VENDORED/);
  });
});

describe('the generated notices file (src/generated/licences.json)', () => {
  it('exists, says how it is made, and has the themes in page order', () => {
    expect(existsSync(FILE), STALE).toBe(true);
    expect(statSync(FILE).size, STALE).toBeGreaterThan(10_000);
    const n = load();
    expect(n.$comment).toContain('scripts/licences/generate.mjs');
    expect(n.$comment).toContain(COMMAND);
    expect(n.themes.map((g) => g.id)).toEqual(THEMES.filter((t) => n.themes.some((g) => g.id === t)));
    expect(n.themes.map((g) => g.id)).toEqual(['speech', 'recording', 'look', 'framework', 'storage', 'account', 'other']);
    for (const g of n.themes) {
      const names = g.entries.map((e) => e.name);
      expect([...names].sort((a, b) => a.localeCompare(b, 'en')), g.id).toEqual(names);
    }
  });

  it('gives every row a licence name and its full notice text, and nothing needs review today', () => {
    const n = load();
    for (const e of allEntries(n)) {
      expect(e.licence, e.name).not.toBe(UNKNOWN);
      expect(e.licenceName.length, e.name).toBeGreaterThan(2);
      expect(e.text, `${e.name} has no notice text`).not.toBeNull();
      expect(n.texts[e.text!].trim().length, e.name).toBeGreaterThan(20);
    }
    // A package whose licence is unclear is flagged, never guessed: fix it in the table before it ships.
    expect(allEntries(n).filter((e) => e.review).map((e) => e.name)).toEqual([]);
    const ids = allEntries(n).map((e) => (e.version ? `${e.name}@${e.version}` : e.name));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers speech, the native libraries React Native compiles in, the fonts and the icons', () => {
    const n = load();
    const byName = new Map(allEntries(n).map((e) => [e.name, e]));
    for (const name of ['whisper.rn', 'whisper.cpp and ggml', 'Whisper large-v3-turbo', 'Silero VAD', 'Hermes', 'Folly', 'glog', 'double-conversion', 'SocketRocket', 'SQLite', 'Google Sign-In for iOS', 'Phosphor Icons artwork', 'phosphor-react-native', 'react', 'react-native', 'expo', 'expo-router']) {
      expect(byName.has(name), name).toBe(true);
    }
    // Candidates and models not hosted yet are not listed.
    expect(byName.has('Belle Whisper large-v3-turbo zh')).toBe(false);
    for (const f of allEntries(n).filter((e) => e.kind === 'font')) expect(n.texts[f.text!], f.name).toContain('SIL OPEN FONT LICENSE');
    expect(allEntries(n).filter((e) => e.kind === 'font').map((e) => e.name)).toEqual(['Literata', 'Mukta', 'Tiro Devanagari Hindi']);
    expect(n.texts[byName.get('react')!.text!]).toMatch(/MIT License[\s\S]*Copyright \(c\) Meta Platforms/);
    expect(byName.get('react')!.copyright).toBe('Copyright (c) Meta Platforms, Inc. and affiliates.');
    expect(byName.get('glog')!.licence).toBe('BSD-3-Clause');
  });

  it('a package without its own licence file carries its monorepo or upstream notice', () => {
    const n = load();
    for (const name of ['expo-router', '@react-native/js-polyfills', 'metro-runtime', 'standard-navigation']) {
      const e = allEntries(n).find((x) => x.name === name);
      expect(e?.text, name).not.toBeNull();
      expect(e?.noticeFrom, name).toBeDefined();
    }
    expect(allEntries(n).find((x) => x.name === 'expo-router')?.noticeFrom).toBe('expo');
  });

  it('credits third-party code adapted into shims/: every credited file is in VENDORED and in the file, with its notice', () => {
    const listed = VENDORED.map((v) => v.file).sort();
    expect(creditedFiles(join(REPO, SHIMS)).map((f) => `${SHIMS}/${f}`)).toEqual(listed);
    const n = load();
    for (const v of VENDORED) {
      const e = allEntries(n).find((x) => x.kind === 'vendored' && x.name === v.name && x.version === v.version);
      expect(e, `${v.file} is missing from ${OUTPUT}. Run: ${COMMAND}`).toBeDefined();
      expect(e!.licence).toBe(v.licence);
      expect(n.texts[e!.text!], v.file).toBe(vendoredEntries(REPO, lockfile(), [v])[0].text);
    }
  });
});

describe('what the Licenses page reads (src/lib/licences.ts)', () => {
  it('is the generated file, with a unique key and a readable notice for each row', () => {
    expect(notices.dependencyHash).toBe(load().dependencyHash);
    const entries = notices.themes.flatMap((g) => g.entries);
    expect(new Set(entries.map(noticeKey)).size).toBe(entries.length);
    const react = entries.find((e) => e.name === 'react')!;
    expect(noticeText(react)).toMatch(/^MIT License/);
    expect(noticeText({ ...react, text: null })).toBeNull();
    expect(noticeKey({ ...react, name: 'Mukta', version: undefined })).toBe('Mukta');
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
  it('lays out one group per theme in THEMES order, entries in name order, each text stored once, unclear licences flagged', () => {
    const built = buildNotices({
      entries: [
        { name: 'z', version: '1.0.0', kind: 'library', licence: 'MIT', text: 'MIT License\n\nCopyright (c) 2026 Asha\n', theme: 'other' },
        { name: 'a', version: '1.0.0', kind: 'library', licence: 'MIT', text: 'MIT License\n\nCopyright (c) 2026 Asha\n', theme: 'other' },
        { name: 'f', kind: 'font', licence: 'OFL-1.1', text: 'T2\n', theme: 'look' },
        { name: 'n', version: '1.0.0', kind: 'library', licence: null, text: null, theme: 'other' },
      ],
      dependencyHash: 'h',
      themes: THEMES,
    });
    expect(built.themes.map((g) => g.id)).toEqual(['look', 'other']);
    expect(built.themes[1].entries.map((e) => e.name)).toEqual(['a', 'n', 'z']);
    expect(built.themes[1].entries[0]).toEqual({ name: 'a', version: '1.0.0', kind: 'library', licence: 'MIT', licenceName: 'MIT License', copyright: 'Copyright (c) 2026 Asha', text: 1 });
    expect(built.themes[1].entries[1]).toMatchObject({ licence: UNKNOWN, text: null, review: true });
    expect(built.texts).toEqual(['T2\n', 'MIT License\n\nCopyright (c) 2026 Asha\n']);
    expect(built.dependencyHash).toBe('h');
    expect(() => buildNotices({ entries: [{ name: 'x', kind: 'library', licence: 'MIT', text: null, theme: 'nowhere' }], dependencyHash: 'h', themes: THEMES })).toThrow(/nowhere/);
  });

  it('reads copyright lines from the text only, skipping templates and sub-component notices', () => {
    expect(copyrightOf('MIT License\n\nCopyright (c) 2026 Asha\n\nThe above copyright notice and this permission notice...')).toBe('Copyright (c) 2026 Asha');
    expect(copyrightOf('Apache License\n   Copyright [yyyy] [name of copyright owner]\n')).toBeNull();
    expect(copyrightOf('Apache License\nterms\n\nFiles in x/y licensed as follows\n\n    Copyright (c) 2014 Other\n')).toBeNull();
    expect(copyrightOf(null)).toBeNull();
  });

  it('flags a missing or unexpected licence, or a missing text where the licence asks for one', () => {
    expect(needsReview({ licence: 'MIT', text: 'x' })).toBe(false);
    expect(needsReview({ licence: null, text: 'x' })).toBe(true);
    expect(needsReview({ licence: 'GPL-3.0', text: 'x' })).toBe(true);
    expect(needsReview({ licence: 'MIT', text: null })).toBe(true);
    expect(needsReview({ licence: 'CC0-1.0', text: null })).toBe(false);
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
