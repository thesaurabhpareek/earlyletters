/**
 * One import reader for the source-scan gates (G4 boundaries.test.ts, G5 import-graph.test.ts). No dependency.
 * Limit: a string that merely contains the text `import x from 'y'` still reads as an import.
 */

const REGEX_AFTER_WORD = /(?:^|[^\w$.])(?:return|typeof|case|do|else|in|of|void|delete|throw|new|yield|await)\s*$/;

/**
 * Removes comments in one pass and leaves strings, templates and regex literals untouched (so `'src/*'` is not a comment).
 * A `/` opens a regex after an operator, after a keyword such as `return`, and after the `)` that closes `if (...)`,
 * `while (...)`, `for (...)` or `with (...)`; after any other `)` it is a division.
 */
export function stripComments(src: string): string {
  let out = '';
  let tail = ''; // last 12 characters written, kept apart because slicing a long concatenated string is quadratic
  const put = (x: string) => {
    out += x;
    tail = (tail + x).slice(-12);
  };
  let last = ''; // last significant character, to tell a regex literal from a division
  const parens: boolean[] = []; // per open `(`: does it belong to if, while, for or with
  for (let i = 0; i < src.length; ) {
    const c = src[i];
        if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      put(' ');
    } else if (c === "'" || c === '"' || c === '`' || (c === '/' && (last === '' || '(,=:[!&|?{};+-*%<>~^'.includes(last) || (/[\w$]/.test(last) && REGEX_AFTER_WORD.test(tail))))) {
      let j = i + 1;
      let inClass = false;
      while (j < src.length && (c === '/' ? inClass || src[j] !== '/' : src[j] !== c) && !(c !== '`' && src[j] === '\n')) {
        if (src[j] === '\\') j++;
        else if (c === '/' && src[j] === '[') inClass = true;
        else if (c === '/' && src[j] === ']') inClass = false;
        j++;
      }
      put(src.slice(i, j + 1));
      i = j + 1;
      last = c;
    } else {
      if (c === '(') parens.push(/\b(?:if|while|for|with)\s*$/.test(tail));
      put(c);
      i++;
      if (c === ')') last = parens.pop() ? '{' : ')';
      else if (!/\s/.test(c)) last = c;
    }
  }
  return out;
}

/** True when the clause before `from` is erased at build: `type X`, `type { A }`, `type * as N`, or `{ type A, type B }`. */
function isTypeOnlyClause(clause: string): boolean {
  if (/^type\s*[{*]/.test(clause) || /^type\s+[A-Za-z_$]/.test(clause)) return true;
  const named = /^\{([^}]*)\}$/.exec(clause);
  if (!named) return false;
  const parts = named[1].split(',').map((x) => x.trim()).filter(Boolean);
  return parts.length > 0 && parts.every((x) => /^type\s+[A-Za-z_$]/.test(x) && !/^type\s+as\s*$/.test(x));
}

/**
 * Linear reader: each `import` or `export` keyword scans forward only as far as the next keyword, a `;` or the first
 * string, so the total work is proportional to the file size (a regex with a lazy gap was quadratic on long lines).
 * Returns static, re-export, side-effect and `require('x')` specifiers. Type-only clauses are skipped; a dynamic
 * `import(` is not returned here (see `dynamicImports`).
 */
export function importSpecifiers(source: string): string[] {
  const src = stripComments(source);
  const out: string[] = [];
  const kw = /\b(import|export)\b/g;
  const starts: Array<{ at: number; end: number; word: string }> = [];
  for (let m = kw.exec(src); m; m = kw.exec(src)) if (src[m.index - 1] !== '.') starts.push({ at: m.index, end: kw.lastIndex, word: m[1] });
  starts.forEach((k, n) => {
    const limit = n + 1 < starts.length ? starts[n + 1].at : src.length;
    let j = k.end;
    while (j < limit && src[j] !== "'" && src[j] !== '"' && src[j] !== ';') j++;
    if (j >= limit || src[j] === ';') return;
    const close = src.indexOf(src[j], j + 1);
    if (close < 0) return;
    const spec = src.slice(j + 1, close);
    const head = src.slice(k.end, j).trim();
    if (/^\(/.test(head)) return; // dynamic import( is not read here
    if (head === '') {
      if (k.word === 'import') out.push(spec); // side-effect import 'x'
      return;
    }
    const m = /^([\s\S]*?)\s*\bfrom$/.exec(head);
    if (!m || isTypeOnlyClause(m[1].trim())) return;
    out.push(spec);
  });
  for (const m of src.matchAll(/\brequire\(\s*['"]([^'"\n]+)['"]\s*\)/g)) out.push(m[1]);
  return out;
}

/**
 * Dynamic `import(...)` calls. `literal` holds the specifier of a quoted string or a template without `${}`.
 * `unresolved` holds the argument text of any other call (a variable, a template with `${}`, a concatenation): the
 * gate cannot know where it points, so a caller must fail or list it. `require(x)` with a non-literal is unresolved too.
 */
export function dynamicImports(source: string): { literal: string[]; unresolved: string[] } {
  const src = stripComments(source);
  const literal: string[] = [];
  const unresolved: string[] = [];
  for (const m of src.matchAll(/(?<![.\w$])(import|require)\s*\(([^)\n]*)/g)) {
    const arg = m[2].trim();
    const lit = /^(['"`])([^'"`$\n]*)\1\s*(?:,.*)?$/.exec(arg);
    if (lit) {
      if (m[1] === 'import') literal.push(lit[2]); // a literal require is already read by importSpecifiers
    } else unresolved.push(`${m[1]}(${arg})`);
  }
  return { literal, unresolved };
}
