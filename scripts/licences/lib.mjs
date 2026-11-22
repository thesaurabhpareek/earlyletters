/**
 * Licence notices for the shipped app, pure parts. The CLI is generate.mjs; the freshness
 * test is apps/mobile/test/licences.test.ts, which imports from here so the generator and the
 * test agree on what ships.
 *
 * MIT, BSD, Apache and ISC all ask that the copyright and permission notice travel with the
 * code, so the app shows the LICENSE (and NOTICE) text of every npm package in the iOS binary,
 * every bundled font, every native library compiled in, and every downloaded model, grouped by
 * what it does for the parent (components.mjs THEMES).
 *
 * What ships is decided in components.mjs and checked against package-lock.json alone (no npm,
 * no node_modules), so the test proves it in CI. Build tools, web-only and type packages in the
 * production tree are left out there, each with its reason. The generator also cross-checks the
 * lockfile walk against `npm ls --omit=dev --all` and stops if they disagree.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** @typedef {'library' | 'font' | 'native' | 'data' | 'vendored' | 'model' | 'artwork'} NoticeKind */
/**
 * @typedef {object} LockPackage
 * @property {string} name     package name (aliases resolve to the real name)
 * @property {string} version
 * @property {string} path     lockfile key, which is the path under the repo root
 * @property {string | null} licence  SPDX expression from the lockfile, or null when the package declares none
 * @property {boolean} optional
 * @property {boolean} hostSpecific  pinned to a build host's OS or CPU (a prebuilt binary that never ships in the app)
 */
/**
 * @typedef {object} NoticeInput
 * @property {string} name
 * @property {string} [version]
 * @property {NoticeKind} kind
 * @property {string | null} licence
 * @property {string | null} text
 * @property {string} [noticeFrom]  where the text was read from when not the entry's own folder: a sibling package (inheritNotices) or the package vendored code came from (vendoredEntries)
 */

/** The workspace whose production tree ships in the app. */
export const APP_WORKSPACE = 'apps/mobile';
export const APP_PACKAGE = '@scribe/mobile';
/** Where the generated file lives, relative to the repo root. */
export const OUTPUT = 'apps/mobile/src/generated/licences.json';
export const COMMAND = 'npm run licences:generate -w @scribe/mobile';

/** Folder of files Metro bundles in place of an npm package (metro.config.js). */
export const SHIMS = 'apps/mobile/shims';

/**
 * Third-party code copied or adapted into our own files, which no lockfile lists. Each names the
 * installed package whose licence file carries the same notice; vendoredEntries checks that the
 * file still credits that package, version and licence and that every copyright line of that
 * licence file is in the file's header, so the notice shipped is the one the code came with.
 * A file in SHIMS that credits anyone and is not listed here fails the generator and the test.
 *
 * apps/mobile/web-preview/sqlite-worker-channel.js is also adapted (from expo-sqlite) but is not
 * listed or scanned: Metro uses it on web only, so it never ships in the iOS app, and expo-sqlite's
 * own MIT notice is in the list anyway.
 */
export const VENDORED = [
  {
    // Security review L6, G-22 (#115): 0.5.0's linear-time decoder, CommonJS, in place of 0.2.2.
    file: `${SHIMS}/decode-uri-component.js`,
    name: 'decode-uri-component',
    version: '0.5.0',
    licence: 'MIT',
    noticeFrom: 'decode-uri-component',
  },
];

/** Licences we expect and need not flag. Anything else is listed for the founder. */
export const EXPECTED_LICENCES = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'BlueOak-1.0.0',
  'Unlicense',
  'CC0-1.0',
  'OFL-1.1',
  'BSL-1.0',
  'blessing',
  'MIT AND Apache-2.0',
  '(MIT OR Apache-2.0)',
  '(MIT OR CC0-1.0)',
]);

const NAMES = {
  MIT: 'MIT License',
  ISC: 'ISC License',
  'Apache-2.0': 'Apache License 2.0',
  'BSD-2-Clause': 'BSD 2-Clause License',
  'BSD-3-Clause': 'BSD 3-Clause License',
  '0BSD': 'BSD Zero Clause License',
  'BlueOak-1.0.0': 'Blue Oak Model License 1.0.0',
  Unlicense: 'The Unlicense',
  'CC0-1.0': 'CC0 1.0 Universal',
  'CC-BY-4.0': 'Creative Commons Attribution 4.0',
  'MPL-2.0': 'Mozilla Public License 2.0',
  'OFL-1.1': 'SIL Open Font License 1.1',
  'BSL-1.0': 'Boost Software License 1.0',
  'Unicode-3.0': 'Unicode License v3',
  blessing: 'Public domain (SQLite blessing)',
  'Python-2.0': 'Python Software Foundation License 2.0',
  'GPL-2.0': 'GNU General Public License 2.0',
  'LGPL-3.0': 'GNU Lesser General Public License 3.0',
};

/**
 * The group id for entries that state no licence. It is an id, not copy: the page takes its
 * heading from packages/content (none exists today; no UNKNOWN group does either).
 */
export const UNKNOWN = 'UNKNOWN';

/**
 * A readable name for an SPDX id or expression: "MIT" is "MIT License", "(MIT OR CC0-1.0)" is
 * "MIT License or CC0 1.0 Universal". Unknown ids are shown as they are.
 * @param {string} id
 * @returns {string}
 */
export function licenceName(id) {
  return id
    .replace(/^\(|\)$/g, '')
    .split(/\s+(AND|OR)\s+/)
    .map((part) => (part === 'AND' ? 'and' : part === 'OR' ? 'or' : (NAMES[part] ?? part)))
    .join(' ');
}

/**
 * Node resolution inside the lockfile: the nearest node_modules walking up from `from`.
 * @param {Record<string, any>} packages
 * @param {string} from  lockfile path of the dependent ("" is the root)
 * @param {string} name
 * @returns {string | null} lockfile key of the dependency, or null when nothing resolves
 */
export function resolveFrom(packages, from, name) {
  const segments = from === '' ? [] : from.split('/');
  for (let i = segments.length; i >= 0; i--) {
    const key = [...segments.slice(0, i), 'node_modules', name].join('/');
    if (packages[key]) return key;
  }
  return null;
}

/**
 * Every package reachable from a workspace through production edges: dependencies, optional
 * dependencies and peer dependencies, the way `npm ls --omit=dev --all` walks them. Workspace
 * links (our own packages) are followed but not listed. A missing optional or peer dependency is
 * skipped, as npm does; a missing regular dependency is an error, since the lockfile is broken.
 * @param {{ lockfileVersion?: number, packages: Record<string, any> }} lock  package-lock.json
 * @param {string} workspace  lockfile path of the app, e.g. "apps/mobile"
 * @returns {Map<string, LockPackage>} keyed by lockfile path, in walk order
 */
export function productionPackages(lock, workspace = APP_WORKSPACE) {
  if (!lock || typeof lock !== 'object' || !lock.packages) throw new Error('not a lockfile v2 or v3: no "packages" map');
  const packages = lock.packages;
  if (!packages[workspace]) throw new Error(`the lockfile has no workspace entry for ${workspace}`);
  /** @type {Map<string, LockPackage>} */
  const out = new Map();
  const visited = new Set();
  const queue = [workspace];
  while (queue.length) {
    const from = /** @type {string} */ (queue.shift());
    if (visited.has(from)) continue;
    visited.add(from);
    const pkg = packages[from];
    // Bundled dependencies ship inside the package's own tarball and have no lockfile entry of their own.
    const bundled = new Set([...(pkg.bundleDependencies ?? []), ...(pkg.bundledDependencies ?? [])]);
    const edges = [
      ...Object.keys(pkg.dependencies ?? {}).map((n) => ({ name: n, optional: false })),
      ...Object.keys(pkg.optionalDependencies ?? {}).map((n) => ({ name: n, optional: true })),
      ...Object.keys(pkg.peerDependencies ?? {}).map((n) => ({ name: n, optional: true })),
    ];
    for (const edge of edges) {
      if (bundled.has(edge.name)) continue;
      const key = resolveFrom(packages, from, edge.name);
      if (!key) {
        if (edge.optional) continue;
        throw new Error(`${from || 'the root'} depends on ${edge.name}, which the lockfile does not resolve`);
      }
      const entry = packages[key];
      if (entry.link) {
        if (!packages[entry.resolved]) throw new Error(`${key} links to ${entry.resolved}, which the lockfile does not have`);
        queue.push(entry.resolved);
        continue;
      }
      if (entry.dev) throw new Error(`${key} is reached through a production edge from ${from || 'the root'} but the lockfile marks it dev`);
      if (!out.has(key)) {
        out.set(key, {
          name: entry.name ?? edge.name,
          version: entry.version,
          path: key,
          licence: typeof entry.license === 'string' && entry.license ? entry.license : null,
          optional: !!entry.optional,
          hostSpecific: Array.isArray(entry.os) || Array.isArray(entry.cpu),
        });
      }
      queue.push(key);
    }
  }
  return out;
}

/**
 * Names of our own workspace packages (the targets of lockfile links), which carry no notice.
 * @param {{ packages: Record<string, any> }} lock
 * @returns {Set<string>}
 */
export function workspaceNames(lock) {
  const names = new Set();
  for (const entry of Object.values(lock.packages)) {
    const target = entry.link ? lock.packages[entry.resolved] : null;
    if (target?.name) names.add(target.name);
  }
  return names;
}

/**
 * The packages whose notices ship: the production set minus host-specific build binaries (one per
 * OS and CPU; their parent package carries the same licence and is listed).
 * @param {Map<string, LockPackage>} all
 * @returns {LockPackage[]} sorted by name, then version
 */
export function shippedPackages(all) {
  // npm may install one version at several paths (nested under different parents); it ships once.
  const sorted = [...all.values()]
    .filter((p) => !p.hostSpecific)
    .sort((a, b) => byNameVersion(a, b) || a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path, 'en'));
  const seen = new Set();
  return sorted.filter((p) => {
    const id = `${p.name}@${p.version}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * The repository a package.json names, as one comparable URL: "github:expo/expo",
 * "git+https://github.com/expo/expo.git" and "https://github.com/expo/expo/tree/main/packages/x"
 * all become "https://github.com/expo/expo". Null when none is named.
 * @param {unknown} repository
 * @returns {string | null}
 */
export function normaliseRepository(repository) {
  const raw = typeof repository === 'string' ? repository : repository && typeof repository === 'object' ? /** @type {any} */ (repository).url : null;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  let url = raw
    .trim()
    .replace(/^git\+/, '')
    .replace(/^(?:ssh:\/\/)?git@([^:/]+)[:/]/, 'https://$1/')
    .replace(/^git:\/\//, 'https://')
    .replace(/^(github|gitlab|bitbucket):/, 'https://$1.com/');
  if (!/^https?:\/\//.test(url) && /^[\w.-]+\/[\w.-]+$/.test(url)) url = `https://github.com/${url}`;
  url = url.replace(/^http:\/\//, 'https://').replace(/^https:\/\/www\./, 'https://').replace(/#.*$/, '').replace(/\.git$/, '').replace(/\/+$/, '').toLowerCase();
  const github = /^https:\/\/github\.com\/([^/]+)\/([^/]+)/.exec(url);
  return github ? `https://github.com/${github[1]}/${github[2]}` : url;
}

/**
 * A package published without a licence file takes the notice its repository's other packages
 * ship (a monorepo's root LICENSE covers every package in it), when they agree: same repository,
 * same licence id, and a clear majority of the siblings that ship a text carrying the same one.
 * Returns new entries; the ones filled in carry `noticeFrom`, the sibling the text was read from
 * (the shortest-named one, so expo-router reads from expo, not @expo/cli). Nothing is written by
 * hand: every text is a file in node_modules.
 * @template {{ name: string, licence: string | null, text: string | null, repository: string | null }} T
 * @param {T[]} entries
 * @returns {(T & { noticeFrom?: string })[]}
 */
export function inheritNotices(entries) {
  /** @type {Map<string, Map<string, { count: number, from: string }>>} repository and licence, then text */
  const tally = new Map();
  // Shorter name first, then alphabetical: the result does not depend on the order entries arrive in.
  const shorter = (/** @type {string} */ a, /** @type {string} */ b) => ((a.length - b.length || a.localeCompare(b, 'en')) <= 0 ? a : b);
  for (const e of entries) {
    if (!e.repository || !e.licence || e.text === null) continue;
    const key = `${e.repository}\n${e.licence}`;
    if (!tally.has(key)) tally.set(key, new Map());
    const texts = /** @type {Map<string, { count: number, from: string }>} */ (tally.get(key));
    const seen = texts.get(e.text);
    if (seen) {
      seen.count++;
      seen.from = shorter(seen.from, e.name);
    } else texts.set(e.text, { count: 1, from: e.name });
  }
  return entries.map((e) => {
    if (e.text !== null || !e.repository || !e.licence) return e;
    const texts = tally.get(`${e.repository}\n${e.licence}`);
    if (!texts) return e;
    const total = [...texts.values()].reduce((n, t) => n + t.count, 0);
    const [best] = [...texts.entries()].sort((a, b) => b[1].count - a[1].count || a[1].from.localeCompare(b[1].from, 'en'));
    if (best[1].count * 2 <= total) return e;
    return { ...e, text: best[0], noticeFrom: best[1].from };
  });
}

/** `name@version` ids, unique and sorted: what the hash covers. @param {{ name: string, version: string }[]} pkgs */
export function dependencyIds(pkgs) {
  return [...new Set(pkgs.map((p) => `${p.name}@${p.version}`))].sort();
}

/**
 * SHA-256 of the sorted `name@version` list. Stored in the generated file; the test recomputes
 * it from package-lock.json and fails when they differ.
 * @param {{ name: string, version: string }[]} pkgs
 * @returns {string} 64 hex characters
 */
export function dependencyHash(pkgs) {
  return createHash('sha256').update(dependencyIds(pkgs).join('\n')).digest('hex');
}

/**
 * Flattens `npm ls --omit=dev --all --long --json` (the node for one workspace) to one entry per
 * `name@version`. An optional peer that is not installed appears as an empty object and is skipped.
 * @param {{ dependencies?: Record<string, any> }} node
 * @param {Map<string, { name: string, version: string, path: string | null, licence: string | null, link: boolean }>} [out]
 */
export function flattenNpmLs(node, out = new Map()) {
  for (const [name, dep] of Object.entries(node.dependencies ?? {})) {
    if (!dep || typeof dep !== 'object' || !dep.version) continue;
    const key = `${name}@${dep.version}`;
    if (!out.has(key)) {
      out.set(key, { name, version: dep.version, path: dep.path ?? null, licence: dep.license ?? null, link: /^file:/.test(dep.resolved ?? '') });
    }
    flattenNpmLs(dep, out);
  }
  return out;
}

/** LICENSE, LICENCE, COPYING and NOTICE files, in any case, with or without a suffix. */
const LICENCE_FILE = /^(licen[cs]e|copying|notice)([-_.].*)?$/i;

/**
 * Line endings and trailing whitespace normalised, a BOM dropped, blank lines trimmed at both
 * ends. The words are untouched: a notice is reproduced, never reworded.
 * @param {string} text
 */
export function normaliseText(text) {
  return `${text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim()}\n`;
}

/**
 * The notice text shipped for a package: every licence file in its folder, in name order
 * (LICENSE before NOTICE), joined by a blank line. Null when the folder has none or is absent.
 * @param {string} dir
 * @returns {string | null}
 */
export function licenceText(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return null;
  }
  const files = names.filter((n) => LICENCE_FILE.test(n) && statSync(join(dir, n)).isFile()).sort((a, b) => a.localeCompare(b, 'en'));
  if (!files.length) return null;
  return files.map((f) => normaliseText(readFileSync(join(dir, f), 'utf8'))).join('\n');
}

/**
 * The bundled fonts: one entry per licence file in packages/design-tokens/fonts
 * (`OFL-<Family>.txt` or `Apache-<Family>.txt`), named after the family. Every .ttf family must
 * have one, or the font ships without its licence.
 * @param {string} fontsDir
 * @returns {NoticeInput[]}
 */
export function fontEntries(fontsDir) {
  const names = readdirSync(fontsDir);
  const licences = names.filter((n) => /^(OFL|Apache)-.+\.txt$/.test(n)).sort((a, b) => a.localeCompare(b, 'en'));
  const families = new Set(names.filter((n) => n.endsWith('.ttf')).map((n) => n.replace(/\.ttf$/, '').split('-')[0]));
  const covered = new Set(licences.map((n) => n.replace(/^(OFL|Apache)-/, '').replace(/\.txt$/, '')));
  for (const family of families) {
    if (!covered.has(family)) throw new Error(`font ${family} has no OFL-${family}.txt or Apache-${family}.txt in ${fontsDir}`);
  }
  return licences.map((n) => {
    const kind = n.startsWith('OFL-') ? 'OFL-1.1' : 'Apache-2.0';
    const family = n.replace(/^(OFL|Apache)-/, '').replace(/\.txt$/, '');
    return {
      name: family.replace(/([a-z])([A-Z])/g, '$1 $2'),
      kind: 'font',
      licence: kind,
      text: normaliseText(readFileSync(join(fontsDir, n), 'utf8')),
    };
  });
}

/**
 * Local native modules (apps/mobile/modules/*): the licence from package.json, else from the
 * podspec. Our own modules (UNLICENSED, or no licence stated) carry no third-party code and are
 * returned under `own`; anything else is a notice to ship.
 * @param {string} modulesDir
 * @returns {{ entries: NoticeInput[], own: string[] }}
 */
export function nativeModuleEntries(modulesDir) {
  /** @type {NoticeInput[]} */
  const entries = [];
  /** @type {string[]} */
  const own = [];
  for (const name of readdirSync(modulesDir).sort((a, b) => a.localeCompare(b, 'en'))) {
    const dir = join(modulesDir, name);
    if (!statSync(dir).isDirectory()) continue;
    let licence = null;
    let version;
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      licence = typeof pkg.license === 'string' ? pkg.license : null;
      version = typeof pkg.version === 'string' ? pkg.version : undefined;
    }
    const iosDir = join(dir, 'ios');
    const podspecs = existsSync(iosDir) ? readdirSync(iosDir).filter((f) => f.endsWith('.podspec')) : [];
    for (const spec of podspecs) {
      const text = readFileSync(join(iosDir, spec), 'utf8');
      licence ??= /s\.license\s*=\s*(?:\{[^}]*:type\s*=>\s*)?['"]([^'"]+)['"]/.exec(text)?.[1] ?? null;
      version ??= /s\.version\s*=\s*['"]([^'"]+)['"]/.exec(text)?.[1];
    }
    if (!licence || licence === 'UNLICENSED') {
      own.push(name);
      continue;
    }
    entries.push({ name, ...(version ? { version } : {}), kind: 'native', licence, text: licenceText(dir) });
  }
  return { entries, own };
}

/**
 * Licence or notice files shipped with data packs (packs/**), one entry per file, named after
 * the folder. Pack attribution lines live in each pack's JSON and are carried word for word by
 * packages/content (its rules test checks that), so they are not repeated here.
 * @param {string} packsDir
 * @returns {NoticeInput[]}
 */
export function packDataEntries(packsDir) {
  /** @type {NoticeInput[]} */
  const out = [];
  const walk = (/** @type {string} */ dir) => {
    for (const name of readdirSync(dir).sort((a, b) => a.localeCompare(b, 'en'))) {
      const full = join(dir, name);
      if (name === 'node_modules' || name.startsWith('.')) continue;
      if (statSync(full).isDirectory()) walk(full);
      else if (LICENCE_FILE.test(name)) {
        const text = normaliseText(readFileSync(full, 'utf8'));
        out.push({ name: full.slice(packsDir.length + 1), kind: 'data', licence: guessLicence(text), text });
      }
    }
  };
  if (existsSync(packsDir)) walk(packsDir);
  return out;
}

/** A header credits third-party code: "adapted from", "copied from", "ported from", "derived from", or a copyright line. */
const CREDIT = /\b(?:adapted|copied|ported|derived|taken) from\b|\bcopyright\s*(?:\(c\)|©|\d{4})/i;

/** The leading comment of a source file, with comment markers and line breaks collapsed to single spaces. */
function headerOf(/** @type {string} */ source) {
  const m = /^\s*(?:(['"])use strict\1;?\s*)?(\/\*[\s\S]*?\*\/|(?:\/\/[^\n]*\n\s*)+)/.exec(source);
  return (m?.[2] ?? '').replace(/^\s*(?:\/\*+|\*\/|\*|\/\/)/gm, ' ').replace(/\*\/\s*$/, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Files in a shims folder whose header credits someone else's code: each must be in VENDORED.
 * @param {string} dir  absolute path
 * @returns {string[]} file names
 */
export function creditedFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => /\.(?:[cm]?js|tsx?)$/.test(n) && CREDIT.test(headerOf(readFileSync(join(dir, n), 'utf8'))))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * The notices for VENDORED code, each read from the installed package it names. Throws when a
 * file is gone, no longer credits its source, or credits a copyright the licence file does not hold.
 * @param {string} repo  absolute repo root
 * @param {{ packages: Record<string, any> }} lock
 * @param {typeof VENDORED} [list]
 * @returns {NoticeInput[]}
 */
export function vendoredEntries(repo, lock, list = VENDORED) {
  return list.map((v) => {
    const path = join(repo, v.file);
    if (!existsSync(path)) throw new Error(`${v.file} is listed in VENDORED but does not exist; remove it from scripts/licences/lib.mjs`);
    const header = headerOf(readFileSync(path, 'utf8'));
    for (const needed of [`${v.name} ${v.version}`, licenceName(v.licence)]) {
      if (!header.includes(needed)) throw new Error(`${v.file} no longer credits "${needed}" in its header; update VENDORED in scripts/licences/lib.mjs`);
    }
    const key = resolveFrom(lock.packages, '', v.noticeFrom);
    const text = key ? licenceText(join(repo, key)) : null;
    if (!text) throw new Error(`${v.file}: ${v.noticeFrom} is not installed or has no licence file to read the notice from`);
    const flat = (/** @type {string} */ s) => s.replace(/\s+/g, ' ').trim();
    for (const line of text.split('\n').filter((l) => /^\s*copyright\b/i.test(l))) {
      if (!flat(header).includes(flat(line))) throw new Error(`${v.file}: its header does not carry "${flat(line)}" from ${v.noticeFrom}'s licence; check the source's own LICENSE`);
    }
    return { name: v.name, version: v.version, kind: /** @type {const} */ ('vendored'), licence: v.licence, text, noticeFrom: v.noticeFrom };
  });
}

/**
 * The SPDX id a licence text declares in its heading, for files that come without metadata.
 * @param {string} text
 */
export function guessLicence(text) {
  const head = text.slice(0, 400);
  if (/MIT License/i.test(head)) return 'MIT';
  if (/Apache License,?\s*Version 2\.0/i.test(head)) return 'Apache-2.0';
  if (/SIL OPEN FONT LICENSE/i.test(text)) return 'OFL-1.1';
  if (/ISC License/i.test(head)) return 'ISC';
  if (/BSD 3-Clause|Redistributions in binary form[\s\S]*endorse/i.test(text)) return 'BSD-3-Clause';
  if (/BSD 2-Clause|Redistributions in binary form/i.test(text)) return 'BSD-2-Clause';
  if (/CC0 1\.0/i.test(head)) return 'CC0-1.0';
  return null;
}

/** @param {{ name: string, version?: string }} a @param {{ name: string, version?: string }} b */
function byNameVersion(a, b) {
  return a.name.localeCompare(b.name, 'en') || (a.version ?? '').localeCompare(b.version ?? '', 'en', { numeric: true });
}


/**
 * The npm packages in the iOS binary, read from package-lock.json and the table in components.mjs.
 * Walks production edges (dependencies, optional, peer) from the app and through our own
 * workspaces, descending only into PACKAGES. Every package met is either in PACKAGES (listed) or
 * NOT_SHIPPED (left out, with a reason); anything else is `undecided`. Names in PACKAGES or keys
 * in NOT_SHIPPED that the walk never meets come back too, so the table cannot keep stale rows.
 * Host-specific build binaries are skipped (never in the app).
 * @param {{ packages: Record<string, any> }} lock
 * @param {{ packages: Record<string, string>, notShipped: Record<string, string>, workspace?: string }} table
 */
export function shippedFromLock(lock, { packages: listed, notShipped, workspace = APP_WORKSPACE }) {
  if (!lock || typeof lock !== 'object' || !lock.packages) throw new Error('not a lockfile v2 or v3: no "packages" map');
  const P = lock.packages;
  if (!P[workspace]) throw new Error(`the lockfile has no workspace entry for ${workspace}`);
  /** @type {Map<string, LockPackage & { theme: string }>} */
  const shipped = new Map();
  /** @type {Map<string, Set<string>>} undecided name@version, from which dependents */
  const undecided = new Map();
  const metListed = new Set();
  const metExcluded = new Set();
  const visited = new Set();
  const queue = [workspace];
  while (queue.length) {
    const from = /** @type {string} */ (queue.shift());
    if (visited.has(from)) continue;
    visited.add(from);
    const pkg = P[from];
    const bundled = new Set([...(pkg.bundleDependencies ?? []), ...(pkg.bundledDependencies ?? [])]);
    const edges = [
      ...Object.keys(pkg.dependencies ?? {}).map((n) => ({ name: n, optional: false })),
      ...Object.keys(pkg.optionalDependencies ?? {}).map((n) => ({ name: n, optional: true })),
      ...Object.keys(pkg.peerDependencies ?? {}).map((n) => ({ name: n, optional: true })),
    ];
    for (const edge of edges) {
      if (bundled.has(edge.name)) continue;
      const key = resolveFrom(P, from, edge.name);
      if (!key) {
        if (edge.optional) continue;
        throw new Error(`${from || 'the root'} depends on ${edge.name}, which the lockfile does not resolve`);
      }
      const entry = P[key];
      if (entry.link) {
        if (!P[entry.resolved]) throw new Error(`${key} links to ${entry.resolved}, which the lockfile does not have`);
        queue.push(entry.resolved);
        continue;
      }
      if (Array.isArray(entry.os) || Array.isArray(entry.cpu)) continue;
      const name = entry.name ?? edge.name;
      const id = `${name}@${entry.version}`;
      if (Object.hasOwn(notShipped, id)) {
        metExcluded.add(id);
        continue;
      }
      if (Object.hasOwn(notShipped, name)) {
        metExcluded.add(name);
        continue;
      }
      if (Object.hasOwn(listed, name)) {
        metListed.add(name);
        if (!shipped.has(key)) {
          shipped.set(key, {
            name,
            version: entry.version,
            path: key,
            licence: typeof entry.license === 'string' && entry.license ? entry.license : null,
            optional: !!entry.optional,
            hostSpecific: false,
            theme: listed[name],
          });
        }
        queue.push(key);
        continue;
      }
      if (!undecided.has(id)) undecided.set(id, new Set());
      /** @type {Set<string>} */ (undecided.get(id)).add(P[from]?.name ?? from.split('node_modules/').pop() ?? from);
    }
  }
  return {
    /** One per lockfile path; shippedPackages() folds identical name@version copies. */
    shipped,
    undecided: [...undecided].map(([id, from]) => ({ id, from: [...from].sort() })).sort((a, b) => a.id.localeCompare(b.id, 'en')),
    unreached: Object.keys(listed).filter((n) => !metListed.has(n)).sort(),
    staleExclusions: Object.keys(notShipped).filter((k) => !metExcluded.has(k)).sort(),
  };
}

/**
 * Packages the bundler writes into every bundle (components.mjs INJECTED), resolved in the lockfile
 * through the build packages named in `via`.
 * @param {{ packages: Record<string, any> }} lock
 * @param {{ name: string, via: string[], theme: string }[]} injected
 * @returns {(LockPackage & { theme: string })[]}
 */
export function injectedPackages(lock, injected) {
  return injected.map((inj) => {
    let at = '';
    for (const step of [...inj.via, inj.name]) {
      const key = resolveFrom(lock.packages, at, step);
      if (!key) throw new Error(`INJECTED ${inj.name}: ${step} does not resolve from ${at || 'the root'} in the lockfile; update scripts/licences/components.mjs`);
      at = key;
    }
    const e = lock.packages[at];
    return { name: inj.name, version: e.version, path: at, licence: typeof e.license === 'string' && e.license ? e.license : null, optional: false, hostSpecific: false, theme: inj.theme };
  });
}

/**
 * The problems in a shippedFromLock result, as sentences, or [] when the table matches the lockfile.
 * @param {ReturnType<typeof shippedFromLock>} r
 */
export function tableProblems(r) {
  const out = [];
  for (const u of r.undecided) out.push(`${u.id} (needed by ${u.from.join(', ')}) is in the app's production tree but neither in PACKAGES (ships, with a theme) nor NOT_SHIPPED (with a reason) in scripts/licences/components.mjs`);
  for (const n of r.unreached) out.push(`${n} is in PACKAGES in scripts/licences/components.mjs but the app no longer depends on it: remove it`);
  for (const n of r.staleExclusions) out.push(`${n} is in NOT_SHIPPED in scripts/licences/components.mjs but nothing shipped depends on it any more: remove it`);
  return out;
}

/**
 * The copyright lines of a notice: lines that start with "Copyright" followed by a year, (c), ©
 * or a name, de-duplicated, in order, before any notice for a bundled sub-component. The Apache
 * template's "Copyright [yyyy] [name...]" is not one.
 * Read from the text, never written: null when the text names none.
 * @param {string | null} text
 * @returns {string | null}
 */
export function copyrightOf(text) {
  if (!text) return null;
  // Notices for bundled sub-components follow a rule of = signs or "Files in x licensed as follows": the row names the component's own.
  const own = text.split(/^(?:={10,}|Files in .* licensed as follows)\s*$/m)[0];
  const lines = own
    .split('\n')
    .map((l) => l.replace(/^[\s*#/]+/, '').trim())
    .filter((l) => /^copyright\b/i.test(l) && !/\[/.test(l) && !/^copyright (notice|holders?|owner|and|license|statement|law)/i.test(l) && /^copyright\s*(\(c\)|©|\d{4}|[A-Z])/i.test(l));
  const unique = [...new Set(lines)];
  return unique.length ? unique.join('\n') : null;
}

/**
 * The non-npm components (components.mjs NON_NPM) with their licence texts read from third-party/.
 * @param {string} dir  absolute path of scripts/licences/third-party
 * @param {import('./components.mjs').NonNpm[]} list
 */
export function nonNpmEntries(dir, list) {
  return list.map((c) => {
    const path = join(dir, c.file);
    if (!existsSync(path)) throw new Error(`${c.name}: its licence text ${c.file} is missing from scripts/licences/third-party`);
    return { name: c.name, ...(c.version ? { version: c.version } : {}), kind: c.kind, licence: c.licence, text: normaliseText(readFileSync(path, 'utf8')), theme: c.theme };
  });
}

/**
 * The language pack attributions (packs/text-rules/*.json `attribution`, each line once, in file
 * order) with the licence texts PACK_NOTICES assigns them. Throws when a line matches no row or
 * several, when a row matches no line, or when a text file is missing: a pack's data cannot ship
 * without its licence text.
 * @param {string} packsDir  absolute path of packs/text-rules
 * @param {string} tpDir     absolute path of scripts/licences/third-party
 * @param {{ match: string, licences: string[], files: { file: string, source: string }[] }[]} rows
 * @returns {{ attribution: string, licences: string[], texts: string[] }[]}
 */
export function packNotices(packsDir, tpDir, rows) {
  const lines = [];
  if (existsSync(packsDir)) {
    for (const f of readdirSync(packsDir).filter((n) => n.endsWith('.json')).sort((a, b) => a.localeCompare(b, 'en'))) {
      for (const line of JSON.parse(readFileSync(join(packsDir, f), 'utf8')).attribution ?? []) if (!lines.includes(line)) lines.push(line);
    }
  }
  const used = new Set();
  const out = lines.map((attribution) => {
    const hits = rows.filter((r) => attribution.includes(r.match));
    if (hits.length !== 1) throw new Error(`pack attribution "${attribution}" matches ${hits.length} rows of PACK_NOTICES (scripts/licences/components.mjs); it needs exactly one, with its licence texts`);
    used.add(hits[0].match);
    const texts = hits[0].files.map((t) => {
      const path = join(tpDir, t.file);
      if (!existsSync(path)) throw new Error(`PACK_NOTICES ${hits[0].match}: ${t.file} is missing from scripts/licences/third-party`);
      return normaliseText(readFileSync(path, 'utf8'));
    });
    return { attribution, licences: hits[0].licences, texts };
  });
  const unused = rows.filter((r) => !used.has(r.match)).map((r) => r.match);
  if (unused.length) throw new Error(`PACK_NOTICES rows ${unused.join(', ')} match no pack attribution: remove them from scripts/licences/components.mjs`);
  return out;
}

/**
 * An entry needs a person to look at it when its licence is not stated or not one we expect, or
 * when a licence that asks for its notice to travel has no text to show.
 * @param {{ licence: string | null, text: string | null }} e
 */
export function needsReview(e) {
  if (!e.licence || !EXPECTED_LICENCES.has(e.licence)) return true;
  return e.text === null && e.licence !== 'CC0-1.0' && e.licence !== 'Unlicense' && e.licence !== 'blessing';
}

/**
 * The generated file: one group per theme in THEMES order, entries in name order, each with its
 * licence, copyright line and notice (identical texts stored once).
 * Language pack attributions follow, each with the indexes of its licence texts.
 * @param {{ entries: (NoticeInput & { theme: string })[], dependencyHash: string, themes: readonly string[], packs?: { attribution: string, licences: string[], texts: string[] }[] }} input
 */
export function buildNotices({ entries, dependencyHash: hash, themes, packs = [] }) {
  /** @type {string[]} */
  const texts = [];
  const index = new Map();
  const textId = (/** @type {string | null} */ text) => {
    if (text === null) return null;
    if (!index.has(text)) {
      index.set(text, texts.length);
      texts.push(text);
    }
    return index.get(text);
  };
  for (const e of entries) if (!themes.includes(e.theme)) throw new Error(`${e.name} has theme "${e.theme}", which is not in THEMES`);
  const groups = themes
    .map((id) => ({
      id,
      entries: entries
        .filter((e) => e.theme === id)
        .sort(byNameVersion)
        .map((e) => ({
          name: e.name,
          ...(e.version ? { version: e.version } : {}),
          kind: e.kind,
          licence: e.licence ?? UNKNOWN,
          licenceName: e.licence ? licenceName(e.licence) : UNKNOWN,
          copyright: copyrightOf(e.text),
          text: textId(e.text),
          ...(e.noticeFrom ? { noticeFrom: e.noticeFrom } : {}),
          ...(needsReview(e) ? { review: true } : {}),
        })),
    }))
    .filter((g) => g.entries.length > 0);
  const packRows = packs.map((p) => ({ attribution: p.attribution, licences: p.licences.map(licenceName), texts: p.texts.map((t) => /** @type {number} */ (textId(t))) }));
  return {
    $comment: `GENERATED FILE, do not edit. Made by scripts/licences/generate.mjs from package-lock.json and scripts/licences/components.mjs (what ships in the iOS app, by theme), packages/design-tokens/fonts, apps/mobile/modules, packs and ${SHIMS}. After any dependency change run: ${COMMAND}`,
    dependencyHash: hash,
    themes: groups,
    packs: packRows,
    texts,
  };
}

/** The file as written: two-space JSON and a final newline. @param {ReturnType<typeof buildNotices>} notices */
export const serialise = (notices) => `${JSON.stringify(notices, null, 2)}\n`;

/**
 * Everything the generated file is made from, read from a repo root. generate.mjs writes or
 * checks `json`; the tests run it on fixture repos. Throws on anything the file cannot be made
 * from: a lockfile the table does not match, a font without its licence, a credited shim not in
 * VENDORED, a vendored file that no longer matches its notice, a missing third-party text.
 * @param {string} repo  absolute repo root
 * @param {{ vendored?: typeof VENDORED, table?: { packages: Record<string, string>, notShipped: Record<string, string>, nonNpm: import('./components.mjs').NonNpm[], themes: readonly string[], upstreamNotices?: Record<string, { file: string, source: string }>, injected?: { name: string, via: string[], theme: string }[], packNotices?: { match: string, licences: string[], files: { file: string, source: string }[] }[] }, thirdPartyDir?: string }} options
 */
export function deriveNotices(repo, { vendored: vendoredList = VENDORED, table, thirdPartyDir } = {}) {
  if (!table) throw new Error('deriveNotices needs the components table (scripts/licences/components.mjs)');
  const lock = JSON.parse(readFileSync(join(repo, 'package-lock.json'), 'utf8'));
  const all = productionPackages(lock, APP_WORKSPACE);
  const hostSpecific = [...all.values()].filter((p) => p.hostSpecific);
  const own = workspaceNames(lock);
  const walk = shippedFromLock(lock, { packages: table.packages, notShipped: table.notShipped });
  const problems = tableProblems(walk);
  if (problems.length) throw new Error(`what ships in the app is not decided for every package:\n  ${problems.join('\n  ')}`);
  for (const p of injectedPackages(lock, table.injected ?? [])) walk.shipped.set(p.path, p);
  const shipped = shippedPackages(walk.shipped);
  const themeOf = new Map([...walk.shipped.values()].map((p) => [p.name, p.theme]));
  const hash = dependencyHash(shipped);

  // Texts are read across the whole production tree, so a package without its own licence file can
  // still take its monorepo's notice from a sibling that does not ship (inheritNotices).
  const shippedIds = new Set(dependencyIds(shipped));
  const candidates = shippedPackages(all).filter((p) => !shippedIds.has(`${p.name}@${p.version}`));
  const read = (/** @type {LockPackage} */ p) => {
    const pkgPath = join(repo, p.path, 'package.json');
    const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : {};
    return { name: p.name, version: p.version, kind: /** @type {const} */ ('library'), licence: p.licence, text: licenceText(join(repo, p.path)), repository: normaliseRepository(pkg.repository) };
  };
  const pool = inheritNotices([...shipped.map(read), ...candidates.map(read)]);
  const tpDir = thirdPartyDir ?? join(repo, 'scripts', 'licences', 'third-party');
  const upstream = table.upstreamNotices ?? {};
  const libraries = pool.slice(0, shipped.length).map((e) => {
    const u = e.text === null ? upstream[e.name] : undefined;
    const filled = u ? { text: normaliseText(readFileSync(join(tpDir, u.file), 'utf8')), noticeFrom: u.source } : {};
    return { ...e, ...filled, theme: /** @type {string} */ (themeOf.get(e.name)) };
  });
  for (const name of Object.keys(upstream)) {
    const e = pool.slice(0, shipped.length).find((x) => x.name === name);
    if (!e) throw new Error(`${name} is in UPSTREAM_NOTICES (scripts/licences/components.mjs) but does not ship: remove it`);
    if (e.text !== null) throw new Error(`${name} now ships its own licence file: remove it from UPSTREAM_NOTICES (scripts/licences/components.mjs)`);
  }

  const fontsDir = join(repo, 'packages', 'design-tokens', 'fonts');
  const fonts = (existsSync(fontsDir) ? fontEntries(fontsDir) : []).map((e) => ({ ...e, theme: 'look' }));
  const modulesDir = join(repo, APP_WORKSPACE, 'modules');
  const nativeRaw = existsSync(modulesDir) ? nativeModuleEntries(modulesDir) : { entries: [], own: [] };
  const native = { own: nativeRaw.own, entries: nativeRaw.entries.map((e) => ({ ...e, theme: 'other' })) };
  const data = packDataEntries(join(repo, 'packs')).map((e) => ({ ...e, theme: 'other' }));
  const listedShims = new Set(vendoredList.map((v) => v.file));
  const unlisted = creditedFiles(join(repo, SHIMS)).filter((f) => !listedShims.has(`${SHIMS}/${f}`));
  if (unlisted.length) {
    throw new Error(`${unlisted.map((f) => `${SHIMS}/${f}`).join(', ')} credit third-party code but are not in VENDORED (scripts/licences/lib.mjs). Add them, with the package whose licence file carries their notice.`);
  }
  const vendored = vendoredEntries(repo, lock, vendoredList).map((e) => ({ ...e, theme: 'other' }));
  const thirdParty = nonNpmEntries(tpDir, table.nonNpm);

  const entries = [...libraries, ...fonts, ...native.entries, ...data, ...vendored, ...thirdParty];
  const packs = packNotices(join(repo, 'packs', 'text-rules'), tpDir, table.packNotices ?? []);
  const notices = buildNotices({ entries, dependencyHash: hash, themes: table.themes, packs });
  return { lock, all, walk, shipped, hostSpecific, own, hash, libraries, fonts, native, data, vendored, thirdParty, entries, notices, json: serialise(notices) };
}
