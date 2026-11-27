/**
 * CDesO-63 (BL-479 point 4): which `authCopy` strings the app draws on something a person presses.
 *
 * A string counts when it is the `label` of a `Button` (or of `QuietButton` and `ProviderButton` in
 * `apps/mobile/src/lib/auth/ui.tsx`, which draw their `label` on a `Button`), or the `title`, `value` or string
 * `trailing` of a `ListRow` that has `onPress`. A `ListRow` with no `onPress` is not a control (the Sync value row,
 * the waiting row), so it is left out. The scan reads the screen's source with the repo's own `typescript`; it adds
 * no dependency and runs no app code.
 *
 * It resolves `authCopy.x.y`, local aliases (`const a = authCopy.account`, `const { termsLink } = authCopy.consent.terms`),
 * both sides of `?:`, `??` and `||`, and the first argument of `fill(...)`. A computed key (`a.sync[state]`) comes back
 * as `prefix.*`, every string under it. Anything it cannot resolve (a prop, another copy object) is not reported, so a
 * site it misses is one the list keeps by hand, as before; it never hides a key it did resolve.
 * Nothing in this file is a test, so vitest does not run it on its own.
 */
import ts from 'typescript';
import { get, leaves } from './copy-surfaces';

/** Components whose `label` is drawn on a button. */
const BUTTONS = new Set(['Button', 'QuietButton', 'ProviderButton']);
/** `ListRow` attributes a person reads on the row they press. */
const ROW_TEXT = new Set(['title', 'value', 'trailing']);

export type PressableSite = { key: string; file: string; line: number; tag: string };

type Scope = Map<string, string>;

/** Every `authCopy` key path drawn on a pressable control in one source file (paths as `copy-surfaces` names them). */
export function pressableAuthKeys(source: string, file: string): PressableSite[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const roots = new Set<string>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue;
    const named = st.importClause?.namedBindings;
    if (named && ts.isNamedImports(named)) {
      for (const el of named.elements) if ((el.propertyName ?? el.name).text === 'authCopy') roots.add(el.name.text);
    }
  }
  if (roots.size === 0) return [];

  const out: PressableSite[] = [];
  const scopes: Scope[] = [new Map()];
  const lookup = (name: string): string | undefined => {
    for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i]!.has(name)) return scopes[i]!.get(name);
    return roots.has(name) ? '' : undefined;
  };
  const join = (base: string, key: string) => (base ? `${base}.${key}` : key);

  /** The key paths an expression can name (more than one for `?:`), or none when it is not `authCopy`. */
  const resolve = (e: ts.Expression): string[] => {
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)) return resolve(e.expression);
    if (ts.isConditionalExpression(e)) return [...resolve(e.whenTrue), ...resolve(e.whenFalse)];
    if (ts.isBinaryExpression(e) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(e.operatorToken.kind)) {
      return [...resolve(e.left), ...resolve(e.right)];
    }
    if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'fill' && e.arguments[0]) return resolve(e.arguments[0]);
    if (ts.isIdentifier(e)) {
      const p = lookup(e.text);
      return p === undefined ? [] : [p];
    }
    if (ts.isPropertyAccessExpression(e)) return resolve(e.expression).map((b) => join(b, e.name.text));
    if (ts.isElementAccessExpression(e)) {
      const arg = e.argumentExpression;
      const key = ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg) ? arg.text : '*';
      return resolve(e.expression).map((b) => join(b, key));
    }
    return [];
  };

  const declare = (d: ts.VariableDeclaration) => {
    if (!d.initializer) return;
    const [base, ...more] = resolve(d.initializer);
    if (base === undefined || more.length > 0) return;
    if (ts.isIdentifier(d.name)) scopes[scopes.length - 1]!.set(d.name.text, base);
    else if (ts.isObjectBindingPattern(d.name)) {
      for (const el of d.name.elements) {
        if (!ts.isIdentifier(el.name)) continue;
        const prop = el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : el.name.text;
        scopes[scopes.length - 1]!.set(el.name.text, join(base, prop));
      }
    }
  };

  const attrs = (el: ts.JsxOpeningLikeElement) =>
    el.attributes.properties.filter(ts.isJsxAttribute).map((a) => ({ name: a.name.getText(sf), init: a.initializer }));

  const record = (el: ts.JsxOpeningLikeElement) => {
    const tag = el.tagName.getText(sf);
    const all = attrs(el);
    let wanted: Set<string> | null = null;
    if (BUTTONS.has(tag)) wanted = new Set(['label', 'busyLabel']);
    else if (tag === 'ListRow' && all.some((a) => a.name === 'onPress')) wanted = ROW_TEXT;
    if (!wanted) return;
    for (const a of all) {
      if (!wanted.has(a.name) || !a.init || !ts.isJsxExpression(a.init) || !a.init.expression) continue;
      const line = sf.getLineAndCharacterOfPosition(a.init.getStart(sf)).line + 1;
      for (const key of resolve(a.init.expression)) if (key) out.push({ key, file, line, tag });
    }
  };

  const opensScope = (n: ts.Node) => ts.isBlock(n) || ts.isFunctionLike(n) || ts.isCaseBlock(n) || ts.isSourceFile(n);
  const visit = (n: ts.Node) => {
    const scoped = opensScope(n) && n !== sf;
    if (scoped) scopes.push(new Map());
    if (ts.isVariableDeclaration(n)) declare(n);
    if (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) record(n);
    ts.forEachChild(n, visit);
    if (scoped) scopes.pop();
  };
  visit(sf);
  return out;
}

/** Expand `prefix.*` sites to every string under the prefix; other sites pass through. */
export function expandSites(sites: PressableSite[], copy: unknown): PressableSite[] {
  return sites.flatMap((s) => {
    if (!s.key.endsWith('.*')) return [s];
    const prefix = s.key.slice(0, -2);
    return leaves(get(copy, prefix), prefix).map((l) => ({ ...s, key: l.path }));
  });
}

/**
 * What breaks the rule: a site whose key is not a string in `copy`, is on no button list, or is over 22 characters as
 * written or with the fixtures filled in.
 */
export function pressableProblems(sites: PressableSite[], copy: unknown, buttons: readonly string[], vars: Record<string, string>): string[] {
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
  const problems: string[] = [];
  for (const s of sites) {
    const where = `${s.file}:${s.line} <${s.tag}> ${s.key}`;
    const text = get(copy, s.key);
    if (typeof text !== 'string') {
      problems.push(`${where}: not a string in authCopy`);
      continue;
    }
    if (!buttons.includes(s.key)) problems.push(`${where}: on no button list`);
    if (text.length > 22 || fill(text).length > 22) problems.push(`${where}: over 22 characters (${fill(text).length})`);
  }
  return problems;
}
