/// <reference types="node" />
/**
 * The metadata-only scanner (NX-39 v2 R9, R50; SEC-ML-1, SEC-ML-2; BL-845).
 *
 * A TypeScript-AST check, not a text search. It reads each file with the compiler, so it sees through
 *  - aliased imports (`import { createAssetAsync as save }` then `save()`), namespace imports and re-exports;
 *  - `require` and `import()`, including `const r = require; r('x')`, and any specifier it cannot read as a literal;
 *  - names built at run time on a library, global or native-module object (`globalThis['fe' + 'tch']`);
 *  - names in strings that look like a name (`requireNativeModule('CLGeocoder')`);
 * and it judges both what code CALLS (a per-module allowlist, a banned-name list, no network) and what code READS or
 * RETURNS (banned fields such as `latitude`, `exif`, `filename`; an adapter returns exactly the allowed record fields
 * and may not spread, copy or cast an unchecked input into it). Lists live in media-scan-allowlist.ts.
 *
 * It cannot see inside a dependency (native Swift or Kotlin), a value computed from user input, or code outside the
 * files it selects (media folders, and any file that imports a media module). BL-878 covers dependencies.
 *
 * Nothing in the tree is "scanned by absence": media-ast-scan.test.ts feeds it one fixture per banned call and fails
 * unless each is flagged, and one clean fixture that must pass.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
import {
  ADAPTER_FILE,
  ALLOWED_LIBRARY_CALLS,
  ASSET_RECORD_FIELDS,
  BANNED_FIELDS,
  BANNED_MODULE,
  BANNED_NAME_PATTERNS,
  BANNED_NETWORK,
  BANNED_TOKENS,
  FIELD_READ_EXCEPTIONS,
  MEDIA_FOLDERS,
  MEDIA_MODULE,
  PIXEL_SIZE_FIELDS,
  RECORD_FACTORY,
} from './media-scan-allowlist';

export type Rule =
  | 'banned-module'
  | 'banned-name'
  | 'network'
  | 'library-call-not-allowed'
  | 'dynamic-module'
  | 'computed-access'
  | 'eval'
  | 'field-read'
  | 'record-field'
  | 'record-spread'
  | 'record-passthrough'
  | 'catch-leak';

export const RULES: readonly Rule[] = [
  'banned-module', 'banned-name', 'network', 'library-call-not-allowed', 'dynamic-module', 'computed-access', 'eval',
  'field-read', 'record-field', 'record-spread', 'record-passthrough', 'catch-leak',
];

export type Finding = { rule: Rule; name: string; line: number };

/** The words of a name: camelCase, PascalCase, snake_case, kebab-case, digits split; runs of capitals stay together. */
export function tokensOf(name: string): string[] {
  return (name.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g) ?? []).map((t) => t.toLowerCase());
}

const bannedTokens = new Set(BANNED_TOKENS);
const networkTokens = new Set(BANNED_NETWORK);

/** The rule a name breaks, or null. Checked on the whole name and on each word of it. */
export function nameProblem(name: string): Rule | null {
  const whole = name.toLowerCase();
  const words = [whole, ...tokensOf(name)];
  if (words.some((w) => networkTokens.has(w))) return 'network';
  if (words.some((w) => bannedTokens.has(w)) || BANNED_NAME_PATTERNS.some((re) => re.test(name))) return 'banned-name';
  return null;
}

const NAME_LIKE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
const GLOBAL_OBJECTS = new Set(['globalThis', 'window', 'global', 'self', 'NativeModules', 'TurboModuleRegistry']);

type Binding = { module: string; imported: string };

export type ScanOptions = { /** Path relative to apps/mobile, used for the field exceptions and the adapter check. */ path?: string };

/** Every finding in one source text. `fileName` decides the script kind and, with `opts.path`, the adapter rules. */
export function scanSource(fileName: string, text: string, opts: ScanOptions = {}): Finding[] {
  const path = (opts.path ?? fileName).split(sep).join('/');
  const kind = /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  const findings: Finding[] = [];
  const add = (node: ts.Node, rule: Rule, name: string) =>
    findings.push({ rule, name, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 });

  /** local name -> where it came from (an import or a require of any module). */
  const bindings = new Map<string, Binding>();
  /** Local names that are the `require` function itself. */
  const requireAliases = new Set<string>(['require']);
  const fieldAllowed = (FIELD_READ_EXCEPTIONS[path] ?? []).map((f) => f.toLowerCase());
  const isAdapter = ADAPTER_FILE.test(path.split('/').pop() ?? path);

  const libraryAllowlist = (module: string): readonly string[] | null => {
    if (!MEDIA_MODULE.test(module)) return null;
    return ALLOWED_LIBRARY_CALLS[module] ?? [];
  };

  function checkModule(node: ts.Node, spec: string) {
    if (BANNED_MODULE.test(spec)) add(node, 'banned-module', spec);
  }

  function checkLibraryMember(node: ts.Node, module: string, member: string) {
    const allowed = libraryAllowlist(module);
    if (allowed !== null && !allowed.includes(member) && member !== 'default' && member !== '*') add(node, 'library-call-not-allowed', `${module}:${member}`);
  }

  function checkName(node: ts.Node, name: string) {
    const rule = nameProblem(name);
    if (rule) add(node, rule, name);
  }

  function checkField(node: ts.Node, name: string) {
    const lower = name.toLowerCase();
    if (BANNED_FIELDS.includes(lower) && !fieldAllowed.includes(lower)) add(node, 'field-read', name);
  }

  // Pass 1: bindings, so a use before the declaration in file order is still resolved.
  const collect = (n: ts.Node) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const module = n.moduleSpecifier.text;
      const clause = n.importClause;
      if (clause?.name) bindings.set(clause.name.text, { module, imported: 'default' });
      const nb = clause?.namedBindings;
      if (nb && ts.isNamespaceImport(nb)) bindings.set(nb.name.text, { module, imported: '*' });
      if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) bindings.set(el.name.text, { module, imported: (el.propertyName ?? el.name).text });
    }
    if (ts.isImportEqualsDeclaration(n) && ts.isExternalModuleReference(n.moduleReference) && ts.isStringLiteral(n.moduleReference.expression)) {
      bindings.set(n.name.text, { module: n.moduleReference.expression.text, imported: '*' });
    }
    // const r = require;  const { x: y } = require('m');  const m = require('m');  const f = ML.fn;
    if (ts.isVariableDeclaration(n) && n.initializer) {
      const init = n.initializer;
      if (ts.isIdentifier(n.name) && ts.isIdentifier(init) && requireAliases.has(init.text)) requireAliases.add(n.name.text);
      const call = ts.isAwaitExpression(init) ? init.expression : init;
      const spec = moduleOfCall(call);
      if (spec && ts.isIdentifier(n.name)) bindings.set(n.name.text, { module: spec, imported: '*' });
      if (spec && ts.isObjectBindingPattern(n.name)) {
        for (const el of n.name.elements) if (ts.isIdentifier(el.name)) bindings.set(el.name.text, { module: spec, imported: ((el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName : el.name) as ts.Identifier).text });
      }
      // const { createAssetAsync } = ML;  const save = ML.createAssetAsync;
      if (ts.isIdentifier(init) && bindings.has(init.text)) {
        const from = bindings.get(init.text)!;
        if (ts.isObjectBindingPattern(n.name)) {
          for (const el of n.name.elements) if (ts.isIdentifier(el.name)) bindings.set(el.name.text, { module: from.module, imported: ((el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName : el.name) as ts.Identifier).text });
        } else if (ts.isIdentifier(n.name)) bindings.set(n.name.text, from);
      }
      if (ts.isPropertyAccessExpression(init) && ts.isIdentifier(init.expression) && bindings.has(init.expression.text) && ts.isIdentifier(n.name)) {
        bindings.set(n.name.text, { module: bindings.get(init.expression.text)!.module, imported: init.name.text });
      }
    }
    ts.forEachChild(n, collect);
  };

  /** The module a `require('m')` or `import('m')` call names; null for any other node. */
  function moduleOfCall(node: ts.Node): string | null {
    if (!ts.isCallExpression(node)) return null;
    const isRequire = ts.isIdentifier(node.expression) && requireAliases.has(node.expression.text);
    const isImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
    if (!isRequire && !isImport) return null;
    const a = node.arguments[0];
    return a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) ? a.text : null;
  }
  collect(sf);
  // The alias set can grow during collect; run the require-call binding pass once more so `r('m')` is seen.
  collect(sf);

  const visit = (n: ts.Node) => {
    // --- modules -----------------------------------------------------------------------------------------------
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      const module = n.moduleSpecifier.text;
      checkModule(n, module);
      const typeOnly = ts.isImportDeclaration(n) && n.importClause?.isTypeOnly;
      if (ts.isImportDeclaration(n) && n.importClause && !typeOnly) {
        const nb = n.importClause.namedBindings;
        if (nb && ts.isNamedImports(nb)) {
          for (const el of nb.elements) {
            if (el.isTypeOnly) continue;
            const imported = (el.propertyName ?? el.name).text;
            checkLibraryMember(el, module, imported);
            checkName(el, imported);
          }
        }
      }
      if (ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause)) {
        for (const el of n.exportClause.elements) {
          const imported = (el.propertyName ?? el.name).text;
          checkLibraryMember(el, module, imported);
          checkName(el, imported);
        }
      }
    }
    if (ts.isImportEqualsDeclaration(n) && ts.isExternalModuleReference(n.moduleReference) && ts.isStringLiteral(n.moduleReference.expression)) {
      checkModule(n, n.moduleReference.expression.text);
    }

    if (ts.isCallExpression(n)) {
      const isRequire = ts.isIdentifier(n.expression) && requireAliases.has(n.expression.text);
      const isImport = n.expression.kind === ts.SyntaxKind.ImportKeyword;
      if (isRequire || isImport) {
        const a = n.arguments[0];
        if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) checkModule(n, a.text);
        else add(n, 'dynamic-module', isImport ? 'import(<expression>)' : 'require(<expression>)');
      }
      if (ts.isIdentifier(n.expression) && (n.expression.text === 'eval' || n.expression.text === 'Function')) add(n, 'eval', n.expression.text);
      // A call through an alias: save(uri) where save came from a media module.
      if (ts.isIdentifier(n.expression) && bindings.has(n.expression.text)) {
        const b = bindings.get(n.expression.text)!;
        if (b.imported !== '*' && b.imported !== 'default') {
          checkLibraryMember(n.expression, b.module, b.imported);
          checkName(n.expression, b.imported);
        }
      }
    }
    if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Function') add(n, 'eval', 'new Function');

    // --- names, members, strings -------------------------------------------------------------------------------
    if (ts.isIdentifier(n)) {
      // Declarations and uses alike: a variable called `faces` is as much a finding as a call to detectFaces.
      checkName(n, n.text);
    }
    if (ts.isPropertyAccessExpression(n)) {
      checkField(n.name, n.name.text);
      // ML.createAssetAsync: a member of a media module's namespace, or of a class taken from it.
      const root = rootIdentifier(n.expression);
      const b = root ? bindings.get(root.text) : undefined;
      if (b) checkLibraryMember(n.name, b.module, n.name.text);
    }
    if (ts.isElementAccessExpression(n)) {
      const arg = n.argumentExpression;
      if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
        checkName(arg, arg.text);
        checkField(arg, arg.text);
        const root = rootIdentifier(n.expression);
        const b = root ? bindings.get(root.text) : undefined;
        if (b) checkLibraryMember(arg, b.module, arg.text);
      } else if (!ts.isNumericLiteral(arg)) {
        const root = rootIdentifier(n.expression);
        const risky = (root && (bindings.has(root.text) || GLOBAL_OBJECTS.has(root.text))) || ts.isBinaryExpression(arg) || ts.isTemplateExpression(arg) || ts.isCallExpression(arg);
        if (risky) add(n, 'computed-access', root ? `${root.text}[<expression>]` : '<expression>[<expression>]');
      }
    }
    if (ts.isBindingElement(n)) {
      const prop = n.propertyName ?? n.name;
      if (ts.isIdentifier(prop)) checkField(prop, prop.text);
    }
    if (ts.isPropertyAssignment(n) && ts.isStringLiteral(n.name)) checkName(n.name, n.name.text);
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && NAME_LIKE.test(n.text)) {
      // A string that reads as a name ('CLGeocoder'). Module specifiers were judged above and are not names.
      const parent = n.parent;
      const isSpecifier = (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) && parent.moduleSpecifier === n;
      const isRequireArg = ts.isCallExpression(parent) && parent.arguments[0] === n && (parent.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(parent.expression) && requireAliases.has(parent.expression.text)));
      if (!isSpecifier && !isRequireArg && !ts.isImportTypeNode(parent) && !ts.isLiteralTypeNode(parent)) checkName(n, n.text);
    }

    ts.forEachChild(n, visit);
  };
  visit(sf);

  if (isAdapter) checkAdapter(sf, add);
  return findings;
}

/** `ML` in `ML.a.b(...)`, `globalThis` in `globalThis['x']`; null when the root is not a plain identifier. */
function rootIdentifier(expr: ts.Expression): ts.Identifier | null {
  let e: ts.Expression = expr;
  while (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) || ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isCallExpression(e)) e = e.expression;
  return ts.isIdentifier(e) ? e : null;
}

/**
 * An adapter boundary returns exactly the allowed record (R9 (b), SEC-ML-1). In a file named like an adapter:
 * a returned object literal has only allowed keys (and `pixelSize` only width and height), no spread and no computed
 * key; a function that returns an `AssetRecord` returns an object literal, null, undefined or another `to...Record`
 * call, never an input, a cast, `Object.assign`, a clone or a parse.
 */
function checkAdapter(sf: ts.SourceFile, add: (n: ts.Node, rule: Rule, name: string) => void) {
  const allowed = new Set(ASSET_RECORD_FIELDS);
  const pixel = new Set(PIXEL_SIZE_FIELDS);

  function literal(obj: ts.ObjectLiteralExpression, keys: Set<string>, where: string) {
    for (const p of obj.properties) {
      if (ts.isSpreadAssignment(p)) {
        add(p, 'record-spread', `${where}: ...${p.expression.getText(sf)}`);
        continue;
      }
      const nameNode = p.name;
      if (!nameNode || ts.isComputedPropertyName(nameNode)) {
        add(p, 'record-field', `${where}: <computed key>`);
        continue;
      }
      const key = ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) ? nameNode.text : nameNode.getText(sf);
      if (!keys.has(key)) add(p, 'record-field', `${where}: ${key}`);
      if (key === 'pixelSize' && ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.initializer)) literal(p.initializer, pixel, 'pixelSize');
      else if (key === 'pixelSize' && ts.isPropertyAssignment(p) && !isNullish(p.initializer) && !ts.isConditionalExpression(p.initializer)) add(p, 'record-passthrough', 'pixelSize: not an object literal');
      if (key === 'pixelSize' && ts.isPropertyAssignment(p) && ts.isConditionalExpression(p.initializer)) {
        for (const branch of [p.initializer.whenTrue, p.initializer.whenFalse]) if (ts.isObjectLiteralExpression(branch)) literal(branch, pixel, 'pixelSize');
      }
    }
  }
  const stripsToLiteral = (x: ts.Expression): boolean => {
    let e = x;
    while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
    return ts.isObjectLiteralExpression(e);
  };
  const isNullish = (e: ts.Expression) => e.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(e) && e.text === 'undefined');

  function checkReturned(expr: ts.Expression | undefined, returnsRecord: boolean, node: ts.Node) {
    if (!expr) return;
    let e: ts.Expression = expr;
    while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e)) {
      // `{...} as AssetRecord` is the literal; `raw as AssetRecord` is a pass-through, judged below when it is the whole value.
      const inner: ts.Expression = e.expression;
      if (ts.isAsExpression(e) && !stripsToLiteral(inner)) break;
      e = inner;
    }
    if (ts.isObjectLiteralExpression(e)) return literal(e, allowed, 'AssetRecord');
    if (ts.isConditionalExpression(e)) {
      checkReturned(e.whenTrue, returnsRecord, node);
      checkReturned(e.whenFalse, returnsRecord, node);
      return;
    }
    if (!returnsRecord) return;
    if (isNullish(e)) return;
    if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && RECORD_FACTORY.test(e.expression.text)) return;
    add(node, 'record-passthrough', `returns ${e.getText(sf).slice(0, 40)}`);
  }

  const walk = (n: ts.Node) => {
    if (ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n)) {
      const returnsRecord = !!n.type && /AssetRecord/.test(n.type.getText(sf));
      if (ts.isArrowFunction(n) && !ts.isBlock(n.body)) checkReturned(n.body, returnsRecord, n);
      else if (n.body) {
        const inner = (m: ts.Node) => {
          if (ts.isReturnStatement(m)) checkReturned(m.expression, returnsRecord, m);
          if (ts.isFunctionLike(m) && m !== n) return; // nested functions are walked on their own
          ts.forEachChild(m, inner);
        };
        ts.forEachChild(n.body, inner);
      }
    }
    // Any object literal annotated or cast as an AssetRecord is the record: `{...} as AssetRecord`, `const r: AssetRecord = {...}`.
    if (ts.isAsExpression(n) && /AssetRecord/.test(n.type.getText(sf))) {
      if (stripsToLiteral(n.expression)) {
        let e: ts.Expression = n.expression;
        while (!ts.isObjectLiteralExpression(e)) e = (e as ts.ParenthesizedExpression | ts.AsExpression | ts.NonNullExpression).expression;
        literal(e, allowed, 'AssetRecord');
      }
      else add(n, 'record-passthrough', `${n.expression.getText(sf).slice(0, 30)} as AssetRecord`);
    }
    if (ts.isVariableDeclaration(n) && n.type && /AssetRecord/.test(n.type.getText(sf)) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) literal(n.initializer, allowed, 'AssetRecord');
    if (ts.isCallExpression(n)) {
      const callee = n.expression.getText(sf);
      if (/^(?:Object\.assign|structuredClone|JSON\.parse)$/.test(callee)) add(n, 'record-passthrough', callee);
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
}

// ---------------------------------------------------------------------------------------------------------------
// Catching native errors (R50, BL-862): inside a catch block the caught value may only be given to `toNativeErrorCode`.
// ---------------------------------------------------------------------------------------------------------------

/** Findings of rule `catch-leak`: any use of the caught variable that is not `toNativeErrorCode(caught)`. */
export function scanCatches(fileName: string, text: string): Finding[] {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: Finding[] = [];
  const line = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  const visit = (n: ts.Node) => {
    if (ts.isCatchClause(n) && n.variableDeclaration) {
      const decl = n.variableDeclaration.name;
      const names = new Set<string>();
      const bind = (b: ts.BindingName) => {
        if (ts.isIdentifier(b)) names.add(b.text);
        else for (const el of b.elements) if (ts.isBindingElement(el)) bind(el.name);
      };
      bind(decl);
      if (!ts.isIdentifier(decl)) out.push({ rule: 'catch-leak', name: 'destructured catch variable', line: line(decl) });
      const use = (m: ts.Node) => {
        if (ts.isIdentifier(m) && names.has(m.text)) {
          const p = m.parent;
          const allowed = ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 'toNativeErrorCode' && p.arguments.length === 1 && p.arguments[0] === m;
          if (!allowed) out.push({ rule: 'catch-leak', name: p.getText(sf).slice(0, 50), line: line(m) });
        }
        ts.forEachChild(m, use);
      };
      use(n.block);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  // A promise `.catch((e) => ...)` handler is a catch too.
  const visitCalls = (n: ts.Node) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'catch') {
      const handler = n.arguments[0];
      if (handler && (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) && handler.parameters[0]) {
        const p0 = handler.parameters[0].name;
        if (ts.isIdentifier(p0)) {
          const use = (m: ts.Node) => {
            if (ts.isIdentifier(m) && m.text === p0.text && m !== p0) {
              const p = m.parent;
              const ok = ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 'toNativeErrorCode' && p.arguments[0] === m;
              if (!ok) out.push({ rule: 'catch-leak', name: p.getText(sf).slice(0, 50), line: line(m) });
            }
            ts.forEachChild(m, use);
          };
          use(handler.body);
        }
      }
    }
    ts.forEachChild(n, visitCalls);
  };
  visitCalls(sf);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// The tree.
// ---------------------------------------------------------------------------------------------------------------

export const MOBILE_ROOT = join(__dirname, '..', '..');

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.name === 'node_modules' || d.name === 'build' || d.name === 'generated' || d.name.startsWith('.')) continue;
    const p = join(dir, d.name);
    if (d.isDirectory()) walkFiles(p, out);
    else if (/\.(ts|tsx)$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) && !/\.d\.ts$/.test(d.name)) out.push(p);
  }
  return out;
}

const SCAN_ROOTS = ['src', 'modules'];

/** Does this file belong to the media code? In a media folder, or it imports/requires a media module. */
export function touchesMedia(relPath: string, text: string): boolean {
  const p = relPath.split(sep).join('/');
  if (MEDIA_FOLDERS.some((f) => p === f || p.startsWith(`${f}/`))) return true;
  if (/\bfrom\s+['"]/.test(text) || /require\(|import\(/.test(text)) {
    const specs = [...text.matchAll(/(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
    return specs.some((s) => MEDIA_MODULE.test(s));
  }
  return false;
}

/** The media files of apps/mobile (src and modules) and what the scanner finds in each. */
export function scanTree(root = MOBILE_ROOT): { scanned: string[]; findings: (Finding & { file: string })[] } {
  const scanned: string[] = [];
  const findings: (Finding & { file: string })[] = [];
  for (const sub of SCAN_ROOTS) {
    let files: string[] = [];
    try {
      files = walkFiles(join(root, sub));
    } catch {
      continue;
    }
    for (const file of files) {
      const rel = relative(root, file).split(sep).join('/');
      const text = readFileSync(file, 'utf8');
      if (!touchesMedia(rel, text)) continue;
      scanned.push(rel);
      for (const f of scanSource(file, text, { path: rel })) findings.push({ ...f, file: rel });
      for (const f of scanCatches(file, text)) findings.push({ ...f, file: rel });
    }
  }
  return { scanned, findings };
}
