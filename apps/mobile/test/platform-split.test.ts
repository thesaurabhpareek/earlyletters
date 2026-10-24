/// <reference types="node" />
/**
 * Platform splits must be complete (the build-1 launch crash, 24 Oct 2026).
 *
 * Metro's rule: for `import ... from './x'` on iOS it tries `x.ios.<ext>`, then `x.native.<ext>`, then
 * `x.<ext>` (Android: `.android`, `.native`, plain; web: `.web`, plain), for each source extension. So a
 * file with a platform suffix REPLACES its base file on that platform for every importer. Node, Vitest and
 * tsc resolve only the base file, so a broken split passes every test here and fails only on a phone.
 *
 * lib/billing/letter-ledger.native.ts was a side-effect module that wired the Keychain, but its name made
 * every `./letter-ledger` import on iOS resolve to it: `keychainFloor`, `syncLedger` and the rest were
 * undefined, and its own `import { configureLedgerStorage } from './letter-ledger'` resolved to itself, so
 * line 10 threw "undefined is not a function" at launch. status-report.native.ts had the same shape.
 *
 * The guard, for every file named `<base>.<ios|android|native|web>.<ext>`:
 *   1. a base file `<base>.<ts|tsx|js|jsx>` exists beside it;
 *   2. both export exactly the same names, each as a value (`v:`) or a type only (`t:`): a value the base
 *      has, the split must have as a value too, because a type is erased and is undefined at run time;
 *   3. the split never imports its own base name, by a relative path or through the `@/` alias (on that
 *      platform it would import itself).
 *
 * Where: apps/mobile/src, apps/mobile/modules (the local Expo modules' TypeScript), and packages/<name>/src.
 * The workspace packages are in on purpose: Metro bundles them into the app through their node_modules
 * links and resolves their relative imports with the same platform rule (React Native libraries in
 * node_modules ship `.ios.js` files for exactly this reason), while Node, Vitest, Deno and Next.js, which
 * also run those packages, never apply it; so a split there would be broken on one side or the other.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const PLATFORM = /^(.+)\.(ios|android|native|web)\.(tsx?|jsx?)$/;
const EXTS = ['ts', 'tsx', 'js', 'jsx'];

function walk(dir: string, out: string[] = []): string[] {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.name === 'node_modules' || d.name === 'build' || d.name.startsWith('.')) continue;
    const p = join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(d.name)) out.push(p);
  }
  return out;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

const hasModifier = (n: ts.Node, k: ts.SyntaxKind) => (ts.canHaveModifiers(n) ? (ts.getModifiers(n) ?? []).some((m) => m.kind === k) : false);

function bindingNames(name: ts.BindingName, out: string[]): void {
  if (ts.isIdentifier(name)) out.push(name.text);
  else for (const e of name.elements) if (!ts.isOmittedExpression(e)) bindingNames(e.name, out);
}

/**
 * Every name a module exports, from its syntax alone, tagged `v:` (a value, which exists at run time) or `t:`
 * (a type only: `export type`, `export interface`, `export type { a }`, `export { type a }`, `export type *`).
 * `export *` counts as `* from <spec>`. A re-exported name without `type` is tagged `v:`: syntax cannot see
 * through it, and both sides of a split are read the same way.
 */
function exportNames(file: string): string[] {
  const names: string[] = [];
  const add = (typeOnly: boolean, name: string) => names.push(`${typeOnly ? 't' : 'v'}:${name}`);
  for (const s of parse(file).statements) {
    if (ts.isExportDeclaration(s)) {
      if (!s.exportClause) add(s.isTypeOnly, `* from ${(s.moduleSpecifier as ts.StringLiteral).text}`);
      else if (ts.isNamedExports(s.exportClause)) for (const e of s.exportClause.elements) add(s.isTypeOnly || e.isTypeOnly, e.name.text);
      else add(s.isTypeOnly, `* as ${s.exportClause.name.text}`);
    } else if (ts.isExportAssignment(s)) {
      add(false, 'default');
    } else if (hasModifier(s, ts.SyntaxKind.ExportKeyword)) {
      const typeOnly = ts.isInterfaceDeclaration(s) || ts.isTypeAliasDeclaration(s);
      if (hasModifier(s, ts.SyntaxKind.DefaultKeyword)) add(typeOnly, 'default');
      else if (ts.isVariableStatement(s)) {
        const vars: string[] = [];
        for (const d of s.declarationList.declarations) bindingNames(d.name, vars);
        for (const v of vars) add(false, v);
      } else if ('name' in s && s.name && ts.isIdentifier(s.name as ts.Node)) add(typeOnly, (s.name as ts.Identifier).text);
    }
  }
  return [...new Set(names)].sort();
}

/** Every module a file asks for: import and export declarations, import() and require(). */
function specifiers(file: string): string[] {
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) out.push(n.moduleSpecifier.text);
    if (ts.isCallExpression(n) && n.arguments.length === 1 && ts.isStringLiteralLike(n.arguments[0])) {
      if (n.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(n.expression) && n.expression.text === 'require')) out.push(n.arguments[0].text);
    }
    ts.forEachChild(n, visit);
  };
  visit(parse(file));
  return out;
}

/** Where the app's `@/` alias points (tsconfig paths, which Expo's Metro config follows): `@/assets/*`, else `@/*`. */
type Alias = { src: string; assets: string };

/** The path a specifier names, without its extension; null for a package import. */
function target(fromFile: string, spec: string, alias: Alias): string | null {
  const path = spec.startsWith('.')
    ? resolve(dirname(fromFile), spec)
    : spec.startsWith('@/assets/')
      ? join(alias.assets, spec.slice('@/assets/'.length))
      : spec.startsWith('@/')
        ? join(alias.src, spec.slice(2))
        : null;
  return path === null ? null : path.replace(/\.(tsx?|jsx?)$/, '');
}

/** What is wrong with the platform splits under `dirs`; empty when every split is complete. Paths are shown from `base`. */
function platformSplitProblems(base: string, dirs: string[], alias: Alias): string[] {
  const problems: string[] = [];
  for (const file of dirs.flatMap((d) => walk(d))) {
    const m = PLATFORM.exec(basename(file));
    if (!m) continue;
    const [, name, platform] = m;
    const rel = relative(base, file);
    const basePath = join(dirname(file), name);
    const baseFile = EXTS.map((e) => `${basePath}.${e}`).find((p) => {
      try {
        readFileSync(p);
        return true;
      } catch {
        return false;
      }
    });
    if (!baseFile) {
      problems.push(`${rel}: no base file ${name}.{${EXTS.join(',')}} beside it, so it is not a platform split`);
    } else {
      const want = exportNames(baseFile);
      const have = exportNames(file);
      const missing = want.filter((n) => !have.includes(n));
      const extra = have.filter((n) => !want.includes(n));
      if (missing.length || extra.length) {
        problems.push(`${rel}: on ${platform} it replaces ${basename(baseFile)} but exports differ (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})`);
      }
    }
    for (const spec of specifiers(file)) {
      if (target(file, spec, alias) === basePath) problems.push(`${rel}: imports '${spec}', which on ${platform} resolves to this file itself`);
    }
  }
  return problems.sort();
}

const MOBILE = join(__dirname, '..');
const REPO = join(MOBILE, '..', '..');
const APP_ALIAS: Alias = { src: join(MOBILE, 'src'), assets: join(MOBILE, 'assets') };
const SCANNED = [
  join(MOBILE, 'src'),
  join(MOBILE, 'modules'),
  ...readdirSync(join(REPO, 'packages'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && readdirSync(join(REPO, 'packages', d.name)).includes('src'))
    .map((d) => join(REPO, 'packages', d.name, 'src')),
];

/** A scratch folder for one fixture layout; `{ src: dir }` stands in for the app's `@/` alias. */
function fixture(files: Record<string, string>): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'owner-m17-split-'));
  try {
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    return platformSplitProblems(dir, [dir], { src: dir, assets: join(dir, 'assets') });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('[launch crash, 24 Oct 2026] every platform split Metro can bundle is complete', () => {
  it('no suffixed file without its base, with different exports, or importing its own base name', () => {
    expect(SCANNED.length).toBeGreaterThan(3); // src, modules and the packages were all found
    expect(platformSplitProblems(REPO, SCANNED, APP_ALIAS)).toEqual([]);
  });

  it('the guard finds the layout that crashed build 1 (letter-ledger.native.ts and status-report.native.ts)', () => {
    expect(
      fixture({
        // The shapes of the two files before the rename, cut down to what the guard reads.
        'letter-ledger.ts': 'export function configureLedgerStorage() {}\nexport async function syncLedger() { return 0; }\nexport function keychainFloor() { return 0; }\n',
        'letter-ledger.native.ts': "import { secureStorage } from '../supabase/secure-storage';\nimport { configureLedgerStorage } from './letter-ledger';\n\nconfigureLedgerStorage(secureStorage);\n",
        'status-report.ts': 'export function createStatusReporter() {}\nexport type StoreAnswer = { ok: boolean };\n',
        'status-report.native.ts': "import { createStatusReporter, type StoreAnswer } from './status-report';\nexport function startStatusReport() {}\nexport function recordPurchaseConsent() {}\n",
        // A complete split and a lone suffixed file, for contrast.
        'haptics.ts': "export type { HapticIntent } from './haptics.shared';\nexport function haptic() {}\n",
        'haptics.android.ts': "import { shouldPlay } from './haptics.shared';\nexport type { HapticIntent } from './haptics.shared';\nexport function haptic() {}\n",
        'lonely.ios.ts': 'export const x = 1;\n',
      }),
    ).toEqual([
      "letter-ledger.native.ts: imports './letter-ledger', which on native resolves to this file itself",
      'letter-ledger.native.ts: on native it replaces letter-ledger.ts but exports differ (missing: v:configureLedgerStorage, v:keychainFloor, v:syncLedger; extra: none)',
      'lonely.ios.ts: no base file lonely.{ts,tsx,js,jsx} beside it, so it is not a platform split',
      "status-report.native.ts: imports './status-report', which on native resolves to this file itself",
      'status-report.native.ts: on native it replaces status-report.ts but exports differ (missing: t:StoreAnswer, v:createStatusReporter; extra: v:recordPurchaseConsent, v:startStatusReport)',
    ]);
  });

  it('a type-only export never stands in for a value, and a self-import through the @/ alias is found', () => {
    expect(
      fixture({
        // The base has the value and the type; the split keeps only the type, so on iOS Tone is undefined.
        'tone.ts': 'export const Tone = { soft: 1 } as const;\nexport type Tone = keyof typeof Tone;\n',
        'tone.ios.ts': "export type Tone = 'soft';\n",
        // A value re-export turned into a type-only re-export.
        'reexport.ts': "export { a } from './a-impl';\n",
        'reexport.android.ts': "export type { a } from './a-impl';\n",
        // export * turned into export type *.
        'star.ts': "export * from './all';\n",
        'star.web.ts': "export type * from './all';\n",
        // The same exports, but the split reaches its base through the alias, which on native is itself.
        'aliased.ts': 'export const z = 1;\n',
        'aliased.native.ts': "import { z as base } from '@/aliased';\nexport const z = base + 1;\n",
        // Complete: the same value and type on both sides, the type spelled inline on one.
        'mood.ts': "export type { Mood } from './mood.types';\nexport function mood() {}\n",
        'mood.ios.ts': "export { type Mood } from './mood.types';\nexport function mood() {}\n",
      }),
    ).toEqual([
      "aliased.native.ts: imports '@/aliased', which on native resolves to this file itself",
      'reexport.android.ts: on android it replaces reexport.ts but exports differ (missing: v:a; extra: t:a)',
      'star.web.ts: on web it replaces star.ts but exports differ (missing: v:* from ./all; extra: t:* from ./all)',
      'tone.ios.ts: on ios it replaces tone.ts but exports differ (missing: v:Tone; extra: none)',
    ]);
  });

  it('the two renamed billing files carry no platform suffix and are imported by their new names', () => {
    const billing = join(MOBILE, 'src', 'lib', 'billing');
    const names = readdirSync(billing);
    expect(names.filter((n) => PLATFORM.test(n))).toEqual([]);
    expect(names).toEqual(expect.arrayContaining(['letter-ledger.keychain.ts', 'status-report.app.ts']));
    expect(readFileSync(join(billing, 'index.ts'), 'utf8')).toMatch(/import '\.\/letter-ledger\.keychain';/);
    for (const f of ['plan-store.ts', 'actions.ts']) expect(readFileSync(join(billing, f), 'utf8'), f).toMatch(/import\('\.\/status-report\.app'\)/);
  });
});
