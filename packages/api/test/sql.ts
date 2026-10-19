/**
 * Minimal, read-only parser for supabase/migrations/*.sql, good enough for
 * the drift test. It understands statements, quotes, dollar-quoted bodies and
 * comments; everything else is regex over single statements.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Statement {
  file: string;
  /** Statement text with comments outside dollar-quoted bodies removed. */
  text: string;
  /** Dollar-quoted bodies in this statement, with their own line comments removed. */
  bodies: string[];
}

export function readMigrations(dir: string): { file: string; sql: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => ({ file, sql: readFileSync(join(dir, file), 'utf8') }));
}

function stripLineComments(body: string): string {
  // Bodies here never put "--" inside a string literal.
  return body.replace(/--[^\n]*/g, '');
}

/** Split one file into statements on top-level semicolons. */
export function splitStatements(file: string, sql: string): Statement[] {
  const out: Statement[] = [];
  let text = '';
  let bodies: string[] = [];
  let i = 0;
  const n = sql.length;
  const flush = () => {
    if (text.trim()) out.push({ file, text: text.trim(), bodies });
    text = '';
    bodies = [];
  };
  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];
    if (c === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") break;
        else j++;
      }
      text += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === '$') {
      const m = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (m) {
        const tag = m[0];
        const end = sql.indexOf(tag, i + tag.length);
        const stop = end < 0 ? n : end;
        const body = sql.slice(i + tag.length, stop);
        bodies.push(stripLineComments(body));
        text += `${tag}${body}${tag}`;
        i = end < 0 ? n : end + tag.length;
        continue;
      }
    }
    if (c === ';') {
      flush();
      i++;
      continue;
    }
    text += c;
    i++;
  }
  flush();
  return out;
}

export function loadStatements(dir: string): Statement[] {
  return readMigrations(dir).flatMap(({ file, sql }) => splitStatements(file, sql));
}

/** Text of a statement with dollar-quoted bodies blanked out (headers only). */
export function header(s: Statement): string {
  return s.text.replace(/\$[A-Za-z_]*\$[\s\S]*?\$[A-Za-z_]*\$/g, '$$BODY$$');
}

/** Index of the parenthesis matching the one at `open`. */
export function matchParen(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "'") {
      i = s.indexOf("'", i + 1);
      if (i < 0) return -1;
      continue;
    }
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Split on commas at parenthesis depth 0 (outside quotes). */
export function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") {
      const j = s.indexOf("'", i + 1);
      cur += s.slice(i, j + 1);
      i = j;
      continue;
    }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

export const ws = (s: string) => s.replace(/\s+/g, ' ').trim();
export const quoted = (s: string) => [...s.matchAll(/'([^']*)'/g)].map((m) => m[1]);

// ─── Functions and privileges ────────────────────────────────────────────

export interface SqlParam {
  name: string;
  type: string;
  optional: boolean;
}

export interface SqlFunction {
  name: string;
  params: SqlParam[];
  returns: string;
  body: string;
  file: string;
}

export const signature = (name: string, types: string[]) => `${name}(${types.join(',')})`;
const normType = (t: string) => t.toLowerCase().replace(/\s+/g, '');

function parseFunction(s: Statement): SqlFunction | null {
  const h = header(s);
  const m = /^create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\(/i.exec(h);
  if (!m) return null;
  const open = m[0].length - 1;
  const close = matchParen(h, open);
  const params = splitTopLevel(h.slice(open + 1, close)).map((a) => {
    const [name, type] = a.split(/\s+/);
    return { name, type: normType(type), optional: /\bdefault\b/i.test(a) };
  });
  const rest = h.slice(close + 1);
  const r = /^\s*returns\s+([\s\S]*?)\s+(?:language|stable|volatile|immutable|security|set)\b/i.exec(rest);
  if (!r) throw new Error(`cannot read RETURNS of ${m[1]} in ${s.file}`);
  const returns = ws(r[1].toLowerCase()).replace(/^table\s*\(/, 'table (');
  return { name: m[1], params, returns, body: s.bodies[0] ?? '', file: s.file };
}

type RoleState = Record<string, boolean>;

export interface FunctionState {
  fn: SqlFunction;
  acl: RoleState;
}

/**
 * Replays every create, drop, grant and revoke in file order. A new function
 * starts with Postgres's PUBLIC execute grant plus Supabase's default
 * privileges for anon and authenticated; CREATE OR REPLACE keeps the ACL.
 */
export function replayFunctions(stmts: Statement[]): Map<string, FunctionState> {
  const fns = new Map<string, FunctionState>();
  for (const s of stmts) {
    const h = header(s);
    const fn = parseFunction(s);
    if (fn) {
      const sig = signature(fn.name, fn.params.map((p) => p.type));
      const prev = fns.get(sig);
      fns.set(sig, { fn, acl: prev ? prev.acl : { public: true, anon: true, authenticated: true } });
      continue;
    }
    const drop = /^drop\s+function\s+(?:if\s+exists\s+)?public\.(\w+)\s*\(([^)]*)\)/i.exec(h);
    if (drop) {
      fns.delete(signature(drop[1], splitTopLevel(drop[2]).map(normType)));
      continue;
    }
    const g = /^(grant|revoke)\s+execute\s+on\s+function\s+public\.(\w+)\s*\(([^)]*)\)\s+(?:to|from)\s+([\w\s,]+)$/i.exec(ws(h));
    if (g) {
      const sig = signature(g[2], splitTopLevel(g[3]).map(normType));
      const st = fns.get(sig);
      if (!st) throw new Error(`${g[1]} on unknown function ${sig} in ${s.file}`);
      for (const role of g[4].split(',').map((r) => r.trim().toLowerCase())) {
        st.acl[role] = g[1].toLowerCase() === 'grant';
      }
    }
  }
  return fns;
}

/** Functions an `authenticated` caller can EXECUTE through PostgREST (trigger functions excluded). */
export function callableByAuthenticated(stmts: Statement[]): Map<string, SqlFunction> {
  const out = new Map<string, SqlFunction>();
  for (const [sig, st] of replayFunctions(stmts)) {
    if (st.fn.returns === 'trigger') continue;
    if (st.acl.authenticated || st.acl.public) out.set(sig, st.fn);
  }
  return out;
}

/** The final definition of a function by name (last create in file order that still exists). */
export function finalFunction(stmts: Statement[], name: string): SqlFunction {
  const matches = [...replayFunctions(stmts).values()].filter((st) => st.fn.name === name);
  if (matches.length !== 1) throw new Error(`expected one live definition of ${name}, found ${matches.length}`);
  return matches[0].fn;
}

// ─── Error codes ─────────────────────────────────────────────────────────

/** Every SQLSTATE raised with an explicit errcode, anywhere in the migrations. */
export function raisedErrcodes(stmts: Statement[]): Set<string> {
  const codes = new Set<string>();
  for (const s of stmts) {
    for (const m of s.text.replace(/--[^\n]*/g, '').matchAll(/errcode\s*=\s*'([0-9A-Z]{5})'/gi)) codes.add(m[1]);
  }
  return codes;
}

/** True when some RAISE EXCEPTION has no errcode (Postgres then uses P0001). */
export function hasPlainRaise(stmts: Statement[]): boolean {
  for (const s of stmts) {
    for (const body of s.bodies) {
      for (const part of body.split(';')) {
        if (/\braise\s+exception\b/i.test(part) && !/\berrcode\b/i.test(part)) return true;
      }
    }
  }
  return false;
}

// ─── Tables, views, columns, CHECK lists ─────────────────────────────────

const CONSTRAINT_WORDS = new Set(['constraint', 'primary', 'foreign', 'unique', 'check', 'exclude']);

/** Final column list of every public table and view. */
export function relationColumns(stmts: Statement[]): Map<string, string[]> {
  const rel = new Map<string, string[]>();
  for (const s of stmts) {
    const h = header(s);
    const ct = /^create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)\s*\(/i.exec(h);
    if (ct) {
      const open = ct[0].length - 1;
      const items = splitTopLevel(h.slice(open + 1, matchParen(h, open)));
      rel.set(
        ct[1],
        items.map((i) => i.split(/\s+/)[0].toLowerCase()).filter((w) => !CONSTRAINT_WORDS.has(w)),
      );
      continue;
    }
    const dt = /^drop\s+(?:table|view)\s+(?:if\s+exists\s+)?public\.(\w+)/i.exec(h);
    if (dt) {
      rel.delete(dt[1]);
      continue;
    }
    const at = /^alter\s+table\s+(?:only\s+)?public\.(\w+)\s+([\s\S]*)$/i.exec(h);
    if (at && rel.has(at[1])) {
      const cols = rel.get(at[1])!;
      for (const action of splitTopLevel(at[2])) {
        const add = /^add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)/i.exec(action);
        if (add && !cols.includes(add[1])) cols.push(add[1]);
        const del = /^drop\s+column\s+(?:if\s+exists\s+)?(\w+)/i.exec(action);
        if (del) cols.splice(cols.indexOf(del[1]), 1);
      }
      continue;
    }
    const cv = /^create\s+(?:or\s+replace\s+)?view\s+public\.(\w+)[\s\S]*?\bas\s+select\s+/i.exec(h);
    if (cv) {
      let list = h.slice(cv[0].length);
      list = list.replace(/^distinct\s+on\s*\([^)]*\)\s*/i, '');
      let depth = 0;
      let end = -1;
      for (let i = 0; i < list.length; i++) {
        if (list[i] === '(') depth++;
        else if (list[i] === ')') depth--;
        else if (depth === 0 && /^\sfrom\s/i.test(list.slice(i, i + 6))) {
          end = i;
          break;
        }
      }
      rel.set(
        cv[1],
        splitTopLevel(list.slice(0, end)).map((item) => {
          const alias = /\bas\s+(\w+)\s*$/i.exec(item);
          return (alias ? alias[1] : item.split('.').pop()!).trim().toLowerCase();
        }),
      );
    }
  }
  return rel;
}

/**
 * The final `col in (...)` CHECK list for table.column: from the column's own
 * definition (create table or add column) or a constraint named
 * <table>_<column>_check. Later statements win.
 */
export function checkList(stmts: Statement[], table: string, column: string): string[] | null {
  let found: string[] | null = null;
  const inList = new RegExp(`\\b${column}\\s+in\\s*\\(([^)]*)\\)`, 'i');
  for (const s of stmts) {
    const h = header(s);
    const ct = new RegExp(`^create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\s*\\(`, 'i').exec(h);
    if (ct) {
      const open = ct[0].length - 1;
      for (const item of splitTopLevel(h.slice(open + 1, matchParen(h, open)))) {
        if (item.split(/\s+/)[0].toLowerCase() === column) {
          const m = inList.exec(item);
          if (m) found = quoted(m[1]);
        }
      }
      continue;
    }
    const at = new RegExp(`^alter\\s+table\\s+(?:only\\s+)?public\\.${table}\\s+([\\s\\S]*)$`, 'i').exec(h);
    if (!at) continue;
    for (const action of splitTopLevel(at[1])) {
      const own =
        new RegExp(`^add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?${column}\\b`, 'i').test(action) ||
        new RegExp(`^add\\s+constraint\\s+${table}_${column}_check\\b`, 'i').test(action);
      const m = own ? inList.exec(action) : null;
      if (m) found = quoted(m[1]);
    }
  }
  return found;
}
