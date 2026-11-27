#!/usr/bin/env node
// SDK and import denylist (BL-2125; LEGAL-REQ-016, PRIV-R13, CVL-04). Fails when package-lock.json holds a
// denylisted package anywhere in the tree, or when a file under apps/ or packages/ imports one, or imports a
// denylisted iOS framework (AdSupport, AppTrackingTransparency, HealthKit) from Swift or Objective-C.
// The list is sdk-denylist.json beside this file.
//
// Matching is exact, never by substring: a lockfile entry matches on its package name (the path after the
// last node_modules/, and its `name` field for an npm alias), and an import on the package part of its
// specifier (`react-native-health/lib` is `react-native-health`; `my-react-native-health` is not). So a
// harmless package whose name merely contains a denylisted one never fails the build.
//
//   node scripts/guards/sdk-denylist.mjs [--repo <root>]
// Exit 0 clean, 1 a finding, 2 the list or the lockfile cannot be read (fails closed).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KINDS = new Set(['npm', 'ios-framework']);
const SCAN_ROOTS = ['apps', 'packages'];
const SKIP_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build', 'coverage', 'Pods', '.next', '.turbo']);
const JS = /\.(?:[cm]?[jt]sx?)$/;
const NATIVE = /\.(?:swift|m|mm|h)$/;
const JS_IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"\n]+)['"]/g;
// Swift `import X`, `@testable import X`, `import struct X.Y`; Objective-C `@import X;` and `#import <X/...>`.
const NATIVE_IMPORT = /^\s*(?:(?:@\w+(?:\([^)]*\))?\s+)*import\s+(?:(?:class|struct|enum|protocol|func|var|let|typealias)\s+)?|@import\s+|#(?:import|include)\s*<)([A-Za-z_]\w*)/gm;

/** Reads and checks the list; throws on a malformed entry, so a broken list can never pass as clean. */
export function loadList(file = join(HERE, 'sdk-denylist.json')) {
  const list = JSON.parse(readFileSync(file, 'utf8'));
  const classes = new Set(list.classes);
  const seen = new Set();
  for (const e of list.entries ?? []) {
    if (!KINDS.has(e.kind) || typeof e.name !== 'string' || !e.name || !classes.has(e.class)) throw new Error(`bad denylist entry ${JSON.stringify(e)}`);
    if (seen.has(`${e.kind}:${e.name}`)) throw new Error(`duplicate denylist entry ${e.name}`);
    seen.add(`${e.kind}:${e.name}`);
  }
  if (!seen.size) throw new Error('the denylist is empty');
  return list;
}

const index = (list, kind) => new Map(list.entries.filter((e) => e.kind === kind).map((e) => [e.name, e]));
const label = (e) => `${e.name} (${e.class}, ${e.vendor})`;

/** The package an import specifier names, or null for a relative, absolute, aliased (`@/x`) or node: one. */
export function packageOf(spec) {
  if (/^(?:\.|\/|node:|@\/|~\/)/.test(spec)) return null;
  const parts = spec.split('/');
  return spec.startsWith('@') ? (parts.length > 1 ? parts.slice(0, 2).join('/') : null) : parts[0];
}

/** Every denylisted package in a v2 or v3 lockfile object. */
export function lockfileFindings(lock, list) {
  const npm = index(list, 'npm');
  const out = [];
  for (const [key, meta] of Object.entries(lock?.packages ?? {})) {
    const at = key.lastIndexOf('node_modules/');
    if (at === -1) continue;
    for (const n of new Set([key.slice(at + 'node_modules/'.length), meta?.name].filter(Boolean)))
      if (npm.has(n)) out.push(`package-lock.json: ${key} is ${label(npm.get(n))}`);
  }
  return out;
}

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Denylisted imports in one source file's text. */
export function importFindings(path, text, list) {
  const code = withoutComments(text);
  const out = [];
  if (JS.test(path)) {
    const npm = index(list, 'npm');
    for (const m of code.matchAll(JS_IMPORT)) {
      const n = packageOf(m[1]);
      if (n && npm.has(n)) out.push(`${path}: imports ${m[1]}, ${label(npm.get(n))}`);
    }
  } else if (NATIVE.test(path)) {
    const fw = index(list, 'ios-framework');
    for (const m of code.matchAll(NATIVE_IMPORT)) if (fw.has(m[1])) out.push(`${path}: imports ${m[1]}, ${label(fw.get(m[1]))}`);
  }
  return out;
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), out);
    } else if (JS.test(e.name) || NATIVE.test(e.name)) out.push(join(dir, e.name));
  }
  return out;
}

/** Every finding in a repository: the lockfile first, then imports under apps/ and packages/. */
export function scan(repo, list = loadList()) {
  const lockPath = join(repo, 'package-lock.json');
  if (!existsSync(lockPath)) throw new Error('package-lock.json not found: the dependency tree cannot be checked');
  const found = lockfileFindings(JSON.parse(readFileSync(lockPath, 'utf8')), list);
  for (const root of SCAN_ROOTS)
    for (const f of walk(join(repo, root))) found.push(...importFindings(relative(repo, f).split('\\').join('/'), readFileSync(f, 'utf8'), list));
  return found;
}

export function main(argv, log = console.log, err = console.error) {
  const at = argv.indexOf('--repo');
  const repo = resolve(at >= 0 ? argv[at + 1] ?? '' : '.');
  let found;
  try {
    found = scan(repo);
  } catch (e) {
    err(`sdk-denylist: ${e.message}`);
    return 2;
  }
  if (found.length) {
    err(`sdk-denylist: ${found.length} finding(s) (LEGAL-REQ-016). Remove the package; adding one back needs a new legal review.\n${found.map((s) => `  ${s}`).join('\n')}`);
    return 1;
  }
  log('sdk-denylist: clean (lockfile and imports under apps/ and packages/)');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
