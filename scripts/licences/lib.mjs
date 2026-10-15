/**
 * Licence notices for the shipped app, pure parts. The CLI is generate.mjs; the freshness
 * test is apps/mobile/test/licences.test.ts, which imports from here so the generator and the
 * test agree on what "the production dependency set" is.
 *
 * MIT, BSD, Apache and ISC all ask that the copyright and permission notice travel with the
 * code, so the app ships the LICENSE (and NOTICE) text of every production package, every
 * bundled font and every third-party native module, grouped by licence.
 *
 * The production set is read from package-lock.json alone (no npm, no node_modules), so the
 * test can prove freshness in CI from the lockfile. The generator cross-checks that walk
 * against `npm ls --omit=dev --all` and stops if they disagree.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** @typedef {'library' | 'font' | 'native' | 'data'} NoticeKind */
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
 * @property {string} [noticeFrom]  the sibling package whose licence file the text was read from (inheritNotices)
 */

/** The workspace whose production tree ships in the app. */
export const APP_WORKSPACE = 'apps/mobile';
export const APP_PACKAGE = '@scribe/mobile';
/** Where the generated file lives, relative to the repo root. */
export const OUTPUT = 'apps/mobile/src/generated/licences.json';
export const COMMAND = 'npm run licences:generate -w @scribe/mobile';

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
  'Python-2.0',
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
  'Python-2.0': 'Python Software Foundation License 2.0',
  'GPL-2.0': 'GNU General Public License 2.0',
  'LGPL-3.0': 'GNU Lesser General Public License 3.0',
  UNKNOWN: 'No licence stated',
};

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
  const shorter = (/** @type {string} */ a, /** @type {string} */ b) => (a.length - b.length || a.localeCompare(b, 'en') <= 0 ? a : b);
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
 * The generated file: entries grouped by licence (largest group first), each entry pointing
 * at its notice in `texts` (identical texts are stored once).
 * @param {{ entries: NoticeInput[], dependencyHash: string }} input
 */
export function buildNotices({ entries, dependencyHash: hash }) {
  /** @type {Map<string, { id: string, name: string, entries: NoticeInput[] }>} */
  const groups = new Map();
  for (const e of entries) {
    const id = e.licence ?? 'UNKNOWN';
    if (!groups.has(id)) groups.set(id, { id, name: licenceName(id), entries: [] });
    /** @type {any} */ (groups.get(id)).entries.push(e);
  }
  const ordered = [...groups.values()].sort((a, b) => b.entries.length - a.entries.length || a.id.localeCompare(b.id, 'en'));
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
  const licences = ordered.map((g) => ({
    id: g.id,
    name: g.name,
    entries: g.entries.sort(byNameVersion).map((e) => ({
      name: e.name,
      ...(e.version ? { version: e.version } : {}),
      kind: e.kind,
      text: textId(e.text),
      ...(e.noticeFrom ? { noticeFrom: e.noticeFrom } : {}),
    })),
  }));
  return {
    $comment: `GENERATED FILE, do not edit. Made by scripts/licences/generate.mjs from package-lock.json (production tree of ${APP_WORKSPACE}), packages/design-tokens/fonts and apps/mobile/modules. After any dependency change run: ${COMMAND}`,
    dependencyHash: hash,
    licences,
    texts,
  };
}
