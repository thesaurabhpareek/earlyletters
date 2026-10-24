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
 * The guard, for every file under apps/mobile/src named `<base>.<ios|android|native|web>.<ext>`:
 *   1. a base file `<base>.<ts|tsx|js|jsx>` exists beside it;
 *   2. both export exactly the same names (a value or type the base has, the split must have too);
 *   3. the split never imports its own base name (on that platform it would import itself).
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
    if (d.name === 'node_modules' || d.name.startsWith('.')) continue;
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

/** Every name a module exports, values and types, from its syntax alone. `export *` counts as `* from <spec>`. */
function exportNames(file: string): string[] {
  const names: string[] = [];
  for (const s of parse(file).statements) {
    if (ts.isExportDeclaration(s)) {
      if (!s.exportClause) names.push(`* from ${(s.moduleSpecifier as ts.StringLiteral).text}`);
      else if (ts.isNamedExports(s.exportClause)) for (const e of s.exportClause.elements) names.push(e.name.text);
      else names.push(`* as ${s.exportClause.name.text}`);
    } else if (ts.isExportAssignment(s)) {
      names.push('default');
    } else if (hasModifier(s, ts.SyntaxKind.ExportKeyword)) {
      if (hasModifier(s, ts.SyntaxKind.DefaultKeyword)) names.push('default');
      else if (ts.isVariableStatement(s)) for (const d of s.declarationList.declarations) bindingNames(d.name, names);
      else if ('name' in s && s.name && ts.isIdentifier(s.name as ts.Node)) names.push((s.name as ts.Identifier).text);
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

/** What is wrong with the platform splits under `root`; empty when every split is complete. */
function platformSplitProblems(root: string): string[] {
  const problems: string[] = [];
  for (const file of walk(root)) {
    const m = PLATFORM.exec(basename(file));
    if (!m) continue;
    const [, base, platform] = m;
    const rel = relative(root, file);
    const basePath = join(dirname(file), base);
    const baseFile = EXTS.map((e) => `${basePath}.${e}`).find((p) => {
      try {
        readFileSync(p);
        return true;
      } catch {
        return false;
      }
    });
    if (!baseFile) {
      problems.push(`${rel}: no base file ${base}.{${EXTS.join(',')}} beside it, so it is not a platform split`);
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
      if (!spec.startsWith('.')) continue;
      const target = resolve(dirname(file), spec).replace(/\.(tsx?|jsx?)$/, '');
      if (target === basePath) problems.push(`${rel}: imports '${spec}', which on ${platform} resolves to this file itself`);
    }
  }
  return problems.sort();
}

describe('[launch crash, 24 Oct 2026] every platform split under apps/mobile/src is complete', () => {
  it('no suffixed file without its base, with different exports, or importing its own base name', () => {
    expect(platformSplitProblems(join(__dirname, '..', 'src'))).toEqual([]);
  });

  it('the guard finds the layout that crashed build 1 (letter-ledger.native.ts and status-report.native.ts)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'owner-m17-split-'));
    try {
      // The shapes of the two files before the rename, cut down to what the guard reads.
      writeFileSync(join(dir, 'letter-ledger.ts'), 'export function configureLedgerStorage() {}\nexport async function syncLedger() { return 0; }\nexport function keychainFloor() { return 0; }\n');
      writeFileSync(join(dir, 'letter-ledger.native.ts'), "import { secureStorage } from '../supabase/secure-storage';\nimport { configureLedgerStorage } from './letter-ledger';\n\nconfigureLedgerStorage(secureStorage);\n");
      writeFileSync(join(dir, 'status-report.ts'), 'export function createStatusReporter() {}\nexport type StoreAnswer = { ok: boolean };\n');
      writeFileSync(join(dir, 'status-report.native.ts'), "import { createStatusReporter, type StoreAnswer } from './status-report';\nexport function startStatusReport() {}\nexport function recordPurchaseConsent() {}\n");
      // A complete split and a lone suffixed file, for contrast.
      writeFileSync(join(dir, 'haptics.ts'), "export type { HapticIntent } from './haptics.shared';\nexport function haptic() {}\n");
      writeFileSync(join(dir, 'haptics.android.ts'), "import { shouldPlay } from './haptics.shared';\nexport type { HapticIntent } from './haptics.shared';\nexport function haptic() {}\n");
      writeFileSync(join(dir, 'lonely.ios.ts'), 'export const x = 1;\n');
      expect(platformSplitProblems(dir)).toEqual([
        "letter-ledger.native.ts: imports './letter-ledger', which on native resolves to this file itself",
        'letter-ledger.native.ts: on native it replaces letter-ledger.ts but exports differ (missing: configureLedgerStorage, keychainFloor, syncLedger; extra: none)',
        'lonely.ios.ts: no base file lonely.{ts,tsx,js,jsx} beside it, so it is not a platform split',
        "status-report.native.ts: imports './status-report', which on native resolves to this file itself",
        'status-report.native.ts: on native it replaces status-report.ts but exports differ (missing: StoreAnswer, createStatusReporter; extra: recordPurchaseConsent, startStatusReport)',
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the two renamed billing files carry no platform suffix and are imported by their new names', () => {
    const billing = join(__dirname, '..', 'src', 'lib', 'billing');
    const names = readdirSync(billing);
    expect(names.filter((n) => PLATFORM.test(n))).toEqual([]);
    expect(names).toEqual(expect.arrayContaining(['letter-ledger.keychain.ts', 'status-report.app.ts']));
    expect(readFileSync(join(billing, 'index.ts'), 'utf8')).toMatch(/import '\.\/letter-ledger\.keychain';/);
    for (const f of ['plan-store.ts', 'actions.ts']) expect(readFileSync(join(billing, f), 'utf8'), f).toMatch(/import\('\.\/status-report\.app'\)/);
  });
});
