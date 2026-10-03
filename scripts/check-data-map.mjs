#!/usr/bin/env node
// Data map gate (PRD 7.10 item 1, DATA_CLASSIFICATION section 0).
//
// Checks docs/legal/data-map.yaml against the code:
//   1. Shape: required fields, allowed values, unique ids, ASCII only, and a
//      table's level equal to its highest column level.
//   2. Postgres: every table, view and column the migrations create is in the
//      map with the same level as its COMMENT ON COLUMN label, and the map has
//      nothing the migrations do not create. The migrations are applied in
//      embedded Postgres (PGlite, the root devDependency `npm run test:db`
//      already uses) through supabase/tests/harness.mjs, so no SQL is parsed
//      by hand.
//   3. Analytics: every event and property in packages/analytics catalog.ts
//      (and the global properties) is in the map, at L2.
//   4. Device SQLite: every table and column the app's local migrations
//      create (run in node:sqlite) is in the map.
//   5. Device settings keys used in apps/mobile/src and the analytics storage
//      keys are in the map.
//
// Usage:
//   node scripts/check-data-map.mjs [--map <file>] [--migrations-dir <dir> | --git-ref <ref>] [--strict]
//
//   --migrations-dir <dir>  Use another set of migration files (default supabase/migrations).
//   --git-ref <ref>         Use supabase/migrations as it is at a git ref, for example
//                           origin/fix/db-pending-hardening, without checking it out.
//   --strict                Treat warnings as failures.
//
// Exit codes: 0 no gaps, 1 gaps found, 2 usage or environment error.
// Plain Node 22 (needs module.registerHooks and module.stripTypeScriptTypes,
// Node 22.18 or later, and node:sqlite). No dependency beyond what the repo already declares.
// The YAML file is a strict subset (see its header) read by the parser below.

import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { registerHooks, stripTypeScriptTypes } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function fatal(message) {
  console.error(`check-data-map: ${message}`);
  process.exit(2);
}

// Keep output readable: node:sqlite prints an ExperimentalWarning on Node 22.
process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name !== 'ExperimentalWarning') console.error(`${w.name}: ${w.message}`);
});

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { map: join(ROOT, 'docs/legal/data-map.yaml'), migrationsDir: null, gitRef: null, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fatal(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--map') opts.map = resolve(next());
    else if (a === '--migrations-dir') opts.migrationsDir = resolve(next());
    else if (a === '--git-ref') opts.gitRef = next();
    else if (a === '--strict') opts.strict = true;
    else if (a === '--help' || a === '-h') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      process.exit(0);
    } else fatal(`unknown argument ${a} (see --help)`);
  }
  if (opts.migrationsDir && opts.gitRef) fatal('use --migrations-dir or --git-ref, not both');
  return opts;
}

// ---------------------------------------------------------------------------
// Strict YAML subset parser
// ---------------------------------------------------------------------------
// Supported: block mappings with simple keys, block sequences (including
// "- key: value" items), plain, single-quoted and double-quoted scalars, flow
// lists of scalars, {} and [], and # comments. Anything else is an error with
// a line number, so the map never means something different to this parser
// than to a standard YAML 1.1 or 1.2 parser.

class YamlError extends Error {
  constructor(line, message) {
    super(`data map line ${line}: ${message}`);
  }
}

function stripComment(text, lineNo) {
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (quote === '"' && c === '\\') { i++; continue; }
      if (c === quote) {
        if (quote === "'" && text[i + 1] === "'") { i++; continue; }
        quote = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      // A quote opens a quoted scalar only at the start of a value or flow item.
      const before = text.slice(0, i).trimEnd();
      if (before === '' || before.endsWith(':') || before.endsWith('-') || before.endsWith('[') || before.endsWith(',')) quote = c;
      continue;
    }
    if (c === '#' && (i === 0 || text[i - 1] === ' ')) return text.slice(0, i).trimEnd();
  }
  if (quote) throw new YamlError(lineNo, 'unterminated quoted string (multi-line strings are not allowed)');
  return text.trimEnd();
}

const KEY = /^([A-Za-z0-9_][A-Za-z0-9_.\-]*):(?: (.*))?$/;
const AMBIGUOUS_WORDS = /^(y|n|yes|no|on|off|true|false|null)$/i;

function parseQuoted(raw, lineNo) {
  if (raw.startsWith('"')) {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(raw)) throw new YamlError(lineNo, `bad double-quoted string ${raw}`);
    try {
      return JSON.parse(raw);
    } catch {
      throw new YamlError(lineNo, `unsupported escape in ${raw} (use JSON escapes only)`);
    }
  }
  if (!/^'(?:[^']|'')*'$/.test(raw)) throw new YamlError(lineNo, `bad single-quoted string ${raw}`);
  return raw.slice(1, -1).replace(/''/g, "'");
}

function parsePlain(raw, lineNo) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null' || raw === '~') return null;
  if (/^-?(0|[1-9][0-9]*)$/.test(raw)) return Number(raw);
  if (AMBIGUOUS_WORDS.test(raw)) throw new YamlError(lineNo, `ambiguous plain value "${raw}" (use true, false or null in lower case, or quote it)`);
  if (/^[&*!|>%@`{}\[\]]/.test(raw) || /^[-?:](\s|$)/.test(raw)) throw new YamlError(lineNo, `unsupported YAML syntax: ${raw}`);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) throw new YamlError(lineNo, `quote dates ("${raw}")`);
  if (/^[-+]?(\d[\d_]*\.\d*|\.\d+|\d+[eE][-+]?\d+|\.(inf|nan))$/i.test(raw)) throw new YamlError(lineNo, `quote decimal-looking values ("${raw}")`);
  if (/^[-+]?(0[0-7]+|0x[0-9a-f]+|0o[0-7]+|0b[01]+|[\d_]*_[\d_]*|\d[\d_]*(:[0-5]?\d)+)$/i.test(raw)) throw new YamlError(lineNo, `quote number-looking values ("${raw}")`);
  if (/: /.test(raw) || raw.endsWith(':')) throw new YamlError(lineNo, `quote values that contain ": " (${raw})`);
  return raw;
}

function splitFlow(inner, lineNo) {
  const items = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (quote) {
      cur += c;
      if (quote === '"' && c === '\\') { cur += inner[++i] ?? ''; continue; }
      if (c === quote) {
        if (quote === "'" && inner[i + 1] === "'") { cur += inner[++i]; continue; }
        quote = null;
      }
      continue;
    }
    if ((c === '"' || c === "'") && cur.trim() === '') { quote = c; cur += c; continue; }
    if (c === ',') { items.push(cur.trim()); cur = ''; continue; }
    if ('[]{}'.includes(c)) throw new YamlError(lineNo, 'nested flow collections are not allowed');
    cur += c;
  }
  if (quote) throw new YamlError(lineNo, 'unterminated quote in flow list');
  items.push(cur.trim());
  if (items.some((x) => x === '')) throw new YamlError(lineNo, 'empty item in flow list');
  return items;
}

function parseScalar(raw, lineNo) {
  if (raw === '{}') return {};
  if (raw === '[]') return [];
  if (raw.startsWith('{')) throw new YamlError(lineNo, 'flow mappings with content are not allowed');
  if (raw.startsWith('[')) {
    if (!raw.endsWith(']')) throw new YamlError(lineNo, 'flow lists must close on the same line');
    return splitFlow(raw.slice(1, -1), lineNo).map((x) => parseScalar(x, lineNo));
  }
  if (raw.startsWith('"') || raw.startsWith("'")) return parseQuoted(raw, lineNo);
  return parsePlain(raw, lineNo);
}

export function parseYamlSubset(source) {
  const lines = [];
  source.split(/\r?\n/).forEach((text, i) => {
    const lineNo = i + 1;
    if (/^\s*$/.test(text) || /^\s*#/.test(text)) return;
    if (text === '---' || text === '...') throw new YamlError(lineNo, 'document markers are not allowed');
    const lead = text.match(/^[ \t]*/)[0];
    if (lead.includes('\t')) throw new YamlError(lineNo, 'tabs are not allowed in indentation');
    const content = stripComment(text.slice(lead.length), lineNo);
    if (content) lines.push({ indent: lead.length, text: content, lineNo });
  });
  let pos = 0;

  function parseBlock(indent) {
    const first = lines[pos];
    if (first.text === '-' || first.text.startsWith('- ')) return parseSeq(indent);
    return parseMap(indent);
  }

  function parseSeq(indent) {
    const out = [];
    while (pos < lines.length && lines[pos].indent === indent && (lines[pos].text === '-' || lines[pos].text.startsWith('- '))) {
      const ln = lines[pos];
      const rest = ln.text === '-' ? '' : ln.text.slice(2).trimStart();
      if (rest === '') {
        pos++;
        if (pos >= lines.length || lines[pos].indent <= indent) throw new YamlError(ln.lineNo, 'empty sequence item');
        out.push(parseBlock(lines[pos].indent));
      } else if (KEY.test(rest)) {
        // "- key: value": a mapping that starts on the item line.
        const childIndent = indent + (ln.text.length - rest.length);
        lines[pos] = { indent: childIndent, text: rest, lineNo: ln.lineNo };
        out.push(parseMap(childIndent));
      } else if (rest.startsWith('- ')) {
        throw new YamlError(ln.lineNo, 'compact nested sequences are not allowed');
      } else {
        out.push(parseScalar(rest, ln.lineNo));
        pos++;
      }
    }
    if (pos < lines.length && lines[pos].indent > indent) throw new YamlError(lines[pos].lineNo, 'unexpected indentation');
    return out;
  }

  function parseMap(indent) {
    const out = {};
    while (pos < lines.length && lines[pos].indent === indent) {
      const ln = lines[pos];
      if (ln.text === '-' || ln.text.startsWith('- ')) throw new YamlError(ln.lineNo, 'sequence item where a key was expected');
      const m = ln.text.match(KEY);
      if (!m) throw new YamlError(ln.lineNo, `expected "key: value" with a simple key, got: ${ln.text}`);
      const key = m[1];
      if (Object.prototype.hasOwnProperty.call(out, key)) throw new YamlError(ln.lineNo, `duplicate key ${key}`);
      const raw = (m[2] ?? '').trim();
      pos++;
      if (raw !== '') {
        out[key] = parseScalar(raw, ln.lineNo);
      } else if (pos < lines.length && lines[pos].indent > indent) {
        out[key] = parseBlock(lines[pos].indent);
      } else if (pos < lines.length && lines[pos].indent === indent && (lines[pos].text === '-' || lines[pos].text.startsWith('- '))) {
        out[key] = parseSeq(indent);
      } else {
        out[key] = null;
      }
    }
    if (pos < lines.length && lines[pos].indent > indent) throw new YamlError(lines[pos].lineNo, 'unexpected indentation');
    return out;
  }

  if (!lines.length) return null;
  if (lines[0].indent !== 0) throw new YamlError(lines[0].lineNo, 'the document must start at column 1');
  const doc = parseBlock(0);
  if (pos < lines.length) throw new YamlError(lines[pos].lineNo, 'unexpected content');
  return doc;
}

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------
const LEVELS = ['L1', 'L2', 'L3', 'L4'];
const STATUS = ['applied', 'pending_apply', 'in_code', 'planned', 'deferred', 'retired', 'dev_only', 'not_used'];
const VERIFIED = ['code', 'decision', 'doc', 'assumed'];
const ITEM_REQUIRED = ['level', 'purpose', 'retention', 'deletion_path', 'leaves_device', 'status', 'verified'];
const levelRank = (l) => LEVELS.indexOf(l);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

function checkKeys(where, obj, required, optional = []) {
  if (!isObj(obj)) return err(`${where}: expected a mapping`), false;
  for (const k of required) if (!(k in obj)) err(`${where}: missing ${k}`);
  for (const k of Object.keys(obj)) if (!required.includes(k) && !optional.includes(k)) err(`${where}: unknown field ${k}`);
  return true;
}

function checkItem(where, item, extraRequired, extraOptional = []) {
  if (!checkKeys(where, item, [...extraRequired, ...ITEM_REQUIRED], ['notes', ...extraOptional])) return;
  if (!LEVELS.includes(item.level)) err(`${where}: level must be one of ${LEVELS.join(', ')}`);
  for (const k of ['purpose', 'retention', 'deletion_path']) if (k in item && !isStr(item[k])) err(`${where}: ${k} must be a non-empty string`);
  if ('notes' in item && !isStr(item.notes)) err(`${where}: notes must be a non-empty string`);
  if (typeof item.leaves_device !== 'boolean') err(`${where}: leaves_device must be true or false`);
  if (!STATUS.includes(item.status)) err(`${where}: status must be one of ${STATUS.join(', ')}`);
  if (!VERIFIED.includes(item.verified)) err(`${where}: verified must be one of ${VERIFIED.join(', ')}`);
}

function checkList(where, list, idKey, extraRequired, extraOptional = [], each = () => {}) {
  if (!Array.isArray(list) || list.length === 0) return err(`${where}: expected a non-empty list`);
  const seen = new Set();
  list.forEach((item, i) => {
    const id = isObj(item) ? item[idKey] : undefined;
    const label = `${where}[${isStr(id) ? id : i}]`;
    if (!isStr(id)) err(`${label}: missing ${idKey}`);
    else if (seen.has(id)) err(`${where}: duplicate ${idKey} ${id}`);
    else seen.add(id);
    checkItem(label, item, [idKey, ...extraRequired], extraOptional);
    if (isObj(item)) each(item, label);
  });
}

function checkColumns(label, item) {
  if (!isObj(item.columns) || !Object.keys(item.columns).length) return err(`${label}: columns must be a non-empty mapping`);
  let max = -1;
  for (const [c, l] of Object.entries(item.columns)) {
    if (!LEVELS.includes(l)) err(`${label}.${c}: level must be one of ${LEVELS.join(', ')}`);
    else max = Math.max(max, levelRank(l));
  }
  if (max >= 0 && LEVELS.includes(item.level) && levelRank(item.level) !== max) {
    err(`${label}: level ${item.level} must equal its highest column level ${LEVELS[max]}`);
  }
}

function checkAscii(value, path) {
  if (typeof value === 'string') {
    // ASCII only: this also rules out em and en dashes, curly quotes, ellipsis characters and emoji.
    const bad = [...value].find((ch) => ch.codePointAt(0) > 0x7e || (ch.codePointAt(0) < 0x20));
    if (bad) err(`${path}: non-ASCII or control character U+${bad.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
  } else if (Array.isArray(value)) value.forEach((v, i) => checkAscii(v, `${path}[${i}]`));
  else if (isObj(value)) for (const [k, v] of Object.entries(value)) checkAscii(v, `${path}.${k}`);
}

function checkShape(map) {
  checkKeys('data map', map,
    ['schema_version', 'as_of', 'classification', 'schema_basis', 'release_scope', 'hosts', 'storage_buckets', 'postgres',
      'device_sqlite', 'device_kv', 'device_files', 'sdks', 'analytics', 'logs'],
    ['pending_changes', 'open_issues']);
  if (map.schema_version !== 1) err('schema_version must be 1');
  if (!(typeof map.as_of === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(map.as_of))) err('as_of must be a quoted date "YYYY-MM-DD"');
  if (!isStr(map.classification) || !existsSync(join(ROOT, map.classification))) err('classification must name an existing file');
  for (const k of ['schema_basis', 'release_scope']) if (!isStr(map[k])) err(`${k} must be a non-empty string`);
  checkAscii(map, 'data map');

  if (map.pending_changes !== undefined) {
    if (!Array.isArray(map.pending_changes)) err('pending_changes must be a list');
    else map.pending_changes.forEach((p, i) => {
      const w = `pending_changes[${i}]`;
      if (!checkKeys(w, p, ['pr', 'branch', 'note', 'adds', 'removes'])) return;
      if (!Number.isInteger(p.pr)) err(`${w}: pr must be a number`);
      for (const k of ['adds', 'removes']) if (!Array.isArray(p[k]) || p[k].some((x) => !isStr(x))) err(`${w}: ${k} must be a list of table, table.column or analytics.events.<event>.<prop> names`);
    });
  }
  if (map.open_issues !== undefined && (!Array.isArray(map.open_issues) || map.open_issues.some((x) => !isStr(x)))) err('open_issues must be a list of strings');

  checkList('hosts', map.hosts, 'id', ['name', 'role'], [], (h, l) => {
    if (!['processor', 'independent', 'vendor'].includes(h.role)) err(`${l}: role must be processor, independent or vendor`);
  });
  checkList('storage_buckets', map.storage_buckets, 'id', ['path']);
  if (checkKeys('postgres', map.postgres, ['auth', 'tables'], ['notes'])) {
    checkList('postgres.auth', map.postgres.auth, 'name', []);
    checkList('postgres.tables', map.postgres.tables, 'name', ['kind', 'created_in', 'columns'], [], (t, l) => {
      if (!['table', 'view'].includes(t.kind)) err(`${l}: kind must be table or view`);
      if (!isStr(t.created_in)) err(`${l}: created_in must name a migration file`);
      checkColumns(l, t);
    });
  }
  if (checkKeys('device_sqlite', map.device_sqlite, ['file', 'tables'], ['notes'])) {
    checkList('device_sqlite.tables', map.device_sqlite.tables, 'name', ['columns'], [], (t, l) => checkColumns(l, t));
  }
  checkList('device_kv', map.device_kv, 'key', ['store']);
  checkList('device_files', map.device_files, 'id', ['path']);
  checkList('sdks', map.sdks, 'id', []);
  if (checkKeys('analytics', map.analytics, ['provider', 'catalogue', 'global_props', 'events', ...ITEM_REQUIRED], ['notes'])) {
    checkItem('analytics', map.analytics, ['provider', 'catalogue', 'global_props', 'events']);
    if (!isObj(map.analytics.global_props)) err('analytics.global_props must be a mapping');
    if (!isObj(map.analytics.events) || !Object.keys(map.analytics.events).length) err('analytics.events must be a non-empty mapping');
    else for (const [e, props] of Object.entries(map.analytics.events)) if (!isObj(props)) err(`analytics.events.${e}: must be a mapping of property to level ({} for none)`);
  }
  checkList('logs', map.logs, 'id', []);
}

// ---------------------------------------------------------------------------
// TypeScript sources (catalog.ts, the app's local migrations)
// ---------------------------------------------------------------------------
let hooksInstalled = false;
async function importTs(file) {
  if (typeof stripTypeScriptTypes !== 'function' || typeof registerHooks !== 'function') {
    fatal(`Node ${process.version} lacks module.stripTypeScriptTypes or module.registerHooks; use Node 22.18 or later`);
  }
  if (!hooksInstalled) {
    // Our packages import siblings without an extension ("./schema"); resolve them to .ts.
    registerHooks({
      resolve(spec, ctx, next) {
        if (spec.startsWith('.') && ctx.parentURL?.endsWith('.ts') && !/\.[cm]?[jt]sx?$/.test(spec)) {
          const url = new URL(`${spec}.ts`, ctx.parentURL);
          if (existsSync(fileURLToPath(url))) return next(url.href, ctx);
        }
        return next(spec, ctx);
      },
      // Transform mode also handles syntax that plain type stripping rejects
      // (for example constructor parameter properties in the app's migrations).
      load(url, ctx, next) {
        if (url.startsWith('file:') && url.endsWith('.ts')) {
          const source = stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform', sourceUrl: url });
          return { format: 'module', source, shortCircuit: true };
        }
        return next(url, ctx);
      },
    });
    hooksInstalled = true;
  }
  return import(pathToFileURL(file).href);
}

// ---------------------------------------------------------------------------
// Pending pull request differences
// ---------------------------------------------------------------------------
function pendingSets(map) {
  const adds = new Map();
  const removes = new Map();
  for (const p of map.pending_changes ?? []) {
    for (const x of p.adds ?? []) adds.set(x, p.pr);
    for (const x of p.removes ?? []) removes.set(x, p.pr);
  }
  return { adds, removes };
}

// ---------------------------------------------------------------------------
// Postgres
// ---------------------------------------------------------------------------
function migrationSet(opts) {
  if (opts.gitRef) {
    let names;
    try {
      names = execFileSync('git', ['-C', ROOT, 'ls-tree', '--name-only', opts.gitRef, 'supabase/migrations/'], { encoding: 'utf8' })
        .split('\n').filter((f) => f.endsWith('.sql'));
    } catch {
      fatal(`cannot read supabase/migrations at git ref ${opts.gitRef} (fetch it first, for example: git fetch origin <branch>)`);
    }
    const dir = mkdtempSync(join(tmpdir(), 'data-map-migrations-'));
    for (const n of names) writeFileSync(join(dir, basename(n)), execFileSync('git', ['-C', ROOT, 'show', `${opts.gitRef}:${n}`]));
    return { dir, label: `supabase/migrations at ${opts.gitRef}`, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  }
  const dir = opts.migrationsDir ?? join(ROOT, 'supabase/migrations');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fatal(`migrations directory not found: ${dir}`);
  return { dir, label: dir.startsWith(ROOT) ? dir.slice(ROOT.length + 1) : dir, cleanup: () => {} };
}

async function checkPostgres(map, opts) {
  const set = migrationSet(opts);
  try {
    const files = readdirSync(set.dir).filter((f) => f.endsWith('.sql')).sort();
    if (!files.length) fatal(`no .sql files in ${set.label}`);
    let createDb;
    try {
      ({ createDb } = await import(pathToFileURL(join(ROOT, 'supabase/tests/harness.mjs')).href));
    } catch (e) {
      fatal(`cannot load the PGlite harness (run npm install at the repo root): ${e.message}`);
    }
    let sys;
    try {
      ({ sys } = await createDb(files.map((f) => join(set.dir, f))));
    } catch (e) {
      fatal(`applying ${set.label} failed: ${e.message}`);
    }
    const rows = (await sys(`
      select c.relname as rel, c.relkind as kind, a.attname as col, col_description(c.oid, a.attnum) as comment
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_attribute a on a.attrelid = c.oid
       where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
         and a.attnum > 0 and not a.attisdropped
       order by c.relname, a.attnum`)).rows;
    const buckets = (await sys('select id from storage.buckets order by id')).rows.map((r) => r.id);

    const db = new Map();
    for (const r of rows) {
      if (!db.has(r.rel)) db.set(r.rel, { kind: r.kind === 'v' || r.kind === 'm' ? 'view' : 'table', cols: new Map() });
      db.get(r.rel).cols.set(r.col, (r.comment ?? '').match(/^(L[1-4])\b/)?.[1] ?? null);
    }
    const mapTables = new Map((map.postgres?.tables ?? []).filter(isObj).map((t) => [t.name, t]));
    const { adds, removes } = pendingSets(map);
    const sources = new Map(files.map((f) => [f, readFileSync(join(set.dir, f), 'utf8')]));

    for (const [rel, info] of db) {
      const t = mapTables.get(rel);
      if (!t) {
        if (removes.has(rel)) warn(`postgres: ${rel} exists in ${set.label} but PR #${removes.get(rel)} removes it; not in the map by design`);
        else err(`postgres: table or view ${rel} is created by the migrations but missing from the data map`);
        continue;
      }
      if (t.kind !== info.kind) err(`postgres.${rel}: kind is ${info.kind} in the migrations, ${t.kind} in the map`);
      for (const [col, level] of info.cols) {
        const key = `${rel}.${col}`;
        const mapped = isObj(t.columns) ? t.columns[col] : undefined;
        if (level === null) err(`postgres.${key}: no L1 to L4 comment in the migrations`);
        if (mapped === undefined) {
          if (removes.has(key)) warn(`postgres: ${key} exists in ${set.label} but PR #${removes.get(key)} removes it; not in the map by design`);
          else err(`postgres: column ${key} is created by the migrations but missing from the data map`);
        } else if (level && mapped !== level) {
          err(`postgres.${key}: level ${mapped} in the map, ${level} in the migration comment`);
        }
      }
      for (const col of Object.keys(isObj(t.columns) ? t.columns : {})) {
        if (!info.cols.has(col)) {
          const key = `${rel}.${col}`;
          if (adds.has(key)) warn(`postgres: ${key} is in the map but not in ${set.label}; PR #${adds.get(key)} adds it`);
          else err(`postgres: column ${key} is in the data map but no migration creates it`);
        }
      }
      if (isStr(t.created_in)) {
        const src = sources.get(t.created_in);
        const creates = new RegExp(`create\\s+(or\\s+replace\\s+)?(table|view)\\s+(if\\s+not\\s+exists\\s+)?(public\\.)?${rel}\\b`, 'i');
        if (!src) err(`postgres.${rel}: created_in ${t.created_in} is not in ${set.label}`);
        else if (!creates.test(src)) err(`postgres.${rel}: ${t.created_in} does not create ${rel}`);
      }
    }
    for (const rel of mapTables.keys()) {
      if (db.has(rel)) continue;
      if (adds.has(rel)) warn(`postgres: ${rel} is in the map but not in ${set.label}; PR #${adds.get(rel)} adds it`);
      else err(`postgres: ${rel} is in the data map but no migration creates it`);
    }

    // A pending pull request whose changes are all present in this migration set is merged.
    for (const p of map.pending_changes ?? []) {
      const present = (x) => (x.includes('.') ? db.get(x.split('.')[0])?.cols.has(x.split('.')[1]) : db.has(x)) ?? false;
      if ((p.adds ?? []).every(present) && !(p.removes ?? []).some(present)) {
        warn(`pending_changes: PR #${p.pr} is fully reflected in ${set.label}; remove its pending_changes entry once it is merged`);
      }
    }

    const mapBuckets = new Set((map.storage_buckets ?? []).filter(isObj).map((b) => b.id));
    for (const b of buckets) if (!mapBuckets.has(b)) err(`storage_buckets: bucket ${b} is created by the migrations but missing from the data map`);
    for (const b of map.storage_buckets ?? []) {
      if (isObj(b) && ['applied', 'pending_apply'].includes(b.status) && !buckets.includes(b.id)) {
        err(`storage_buckets.${b.id}: status ${b.status} but no migration creates it`);
      }
    }
    return { label: set.label, files: files.length, relations: db.size, columns: rows.length };
  } finally {
    set.cleanup();
  }
}

// ---------------------------------------------------------------------------
// Analytics catalogue
// ---------------------------------------------------------------------------
async function checkAnalytics(map) {
  const file = join(ROOT, 'packages/analytics/src/catalog.ts');
  const { EVENTS, GLOBAL_PROPS } = await importTs(file);
  if (!isObj(EVENTS) || !isObj(GLOBAL_PROPS)) fatal('catalog.ts does not export EVENTS and GLOBAL_PROPS');
  const a = isObj(map.analytics) ? map.analytics : {};
  const mapGlobals = isObj(a.global_props) ? a.global_props : {};
  const mapEvents = isObj(a.events) ? a.events : {};
  let props = 0;
  // Differences an open pull request will make (pending_changes with
  // analytics.events.<event>.<prop> keys) are warnings, not gaps.
  const { adds, removes } = pendingSets(map);
  const gap = (key, msg, set) => (set.has(key) ? warn(`${key}: ${msg} (pending PR #${set.get(key)})`) : err(`${key}: ${msg}`));

  const compareProps = (where, catalogProps, mapProps) => {
    for (const [p, spec] of Object.entries(catalogProps)) {
      props++;
      const level = spec?.level;
      if (level !== 'L2') err(`${where}.${p}: catalog level is ${level}; analytics properties must be L2 (DATA_CLASSIFICATION rule 1.1.9)`);
      if (!(p in mapProps)) gap(`${where}.${p}`, 'in catalog.ts but missing from the data map', adds);
      else if (mapProps[p] !== level) err(`${where}.${p}: level ${mapProps[p]} in the map, ${level} in catalog.ts`);
    }
    for (const p of Object.keys(mapProps)) if (!(p in catalogProps)) gap(`${where}.${p}`, 'in the data map but not in catalog.ts', removes);
  };

  compareProps('analytics.global_props', GLOBAL_PROPS, mapGlobals);
  for (const [e, spec] of Object.entries(EVENTS)) {
    if (!(e in mapEvents)) { err(`analytics.events.${e}: in catalog.ts but missing from the data map`); continue; }
    compareProps(`analytics.events.${e}`, spec.props ?? {}, isObj(mapEvents[e]) ? mapEvents[e] : {});
  }
  for (const e of Object.keys(mapEvents)) if (!(e in EVENTS)) err(`analytics.events.${e}: in the data map but not in catalog.ts`);
  return { events: Object.keys(EVENTS).length, props };
}

// ---------------------------------------------------------------------------
// Device SQLite and settings keys
// ---------------------------------------------------------------------------
async function checkDeviceSqlite(map) {
  const { MIGRATIONS, migrate } = await importTs(join(ROOT, 'apps/mobile/src/lib/db/migrations.ts'));
  const { DatabaseSync } = await import('node:sqlite');
  const d = new DatabaseSync(':memory:');
  const sqlDb = {
    exec: (sql) => d.exec(sql),
    run: (sql, ...p) => void d.prepare(sql).run(...p),
    get: (sql, ...p) => d.prepare(sql).get(...p) ?? null,
    all: (sql, ...p) => d.prepare(sql).all(...p),
    transaction: (fn) => {
      d.exec('BEGIN');
      try { fn(); d.exec('COMMIT'); } catch (e) { d.exec('ROLLBACK'); throw e; }
    },
  };
  let n = 0;
  migrate(sqlDb, { now: '2026-01-01T00:00:00.000Z', newId: () => `id-${++n}` }, MIGRATIONS);
  const tables = d.prepare("select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name").all().map((r) => r.name);
  const mapTables = new Map((map.device_sqlite?.tables ?? []).filter(isObj).map((t) => [t.name, t]));
  let cols = 0;
  for (const t of tables) {
    const actual = d.prepare(`pragma table_info(${t})`).all().map((r) => r.name);
    cols += actual.length;
    const m = mapTables.get(t);
    if (!m) { err(`device_sqlite: table ${t} is created by the app's local migrations but missing from the data map`); continue; }
    const mapped = isObj(m.columns) ? m.columns : {};
    for (const c of actual) if (!(c in mapped)) err(`device_sqlite: column ${t}.${c} is created by the app's local migrations but missing from the data map`);
    for (const c of Object.keys(mapped)) if (!actual.includes(c)) err(`device_sqlite: column ${t}.${c} is in the data map but no local migration creates it`);
  }
  for (const t of mapTables.keys()) if (!tables.includes(t)) err(`device_sqlite: ${t} is in the data map but no local migration creates it`);
  d.close();
  return { tables: tables.length, columns: cols };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (!['node_modules', 'test', '__tests__'].includes(name)) walk(p, out);
    } else if (['.ts', '.tsx'].includes(extname(name)) && !/\.(test|spec)\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

async function checkDeviceKeys(map) {
  const found = new Map();
  for (const file of walk(join(ROOT, 'apps/mobile/src'))) {
    const src = readFileSync(file, 'utf8');
    const consts = new Map([...src.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g)].map((m) => [m[1], m[2]]));
    for (const m of src.matchAll(/\b(?:get|set|delete)Setting\(\s*(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$]*))/g)) {
      const key = m[1] ?? consts.get(m[2]);
      if (m[2] && !key) {
        if (m[2] !== 'key') warn(`device_kv: cannot resolve the settings key ${m[2]} in ${file.slice(ROOT.length + 1)}`);
        continue;
      }
      if (!found.has(key)) found.set(key, file.slice(ROOT.length + 1));
    }
  }
  const { STORAGE_KEYS } = await importTs(join(ROOT, 'packages/analytics/src/consent.ts'));
  for (const k of Object.values(STORAGE_KEYS ?? {})) found.set(k, 'packages/analytics/src/consent.ts');

  const mapKeys = new Map((map.device_kv ?? []).filter(isObj).map((k) => [k.key, k]));
  for (const [k, where] of found) if (!mapKeys.has(k)) err(`device_kv: key ${k} (used in ${where}) is missing from the data map`);
  for (const [k, item] of mapKeys) {
    if (['in_code', 'dev_only'].includes(item.status) && !found.has(k)) warn(`device_kv: ${k} has status ${item.status} but no code reference was found`);
    if (item.status === 'retired' && found.has(k)) warn(`device_kv: ${k} is marked retired but ${found.get(k)} still uses it`);
  }
  return { keys: found.size };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const opts = parseArgs(process.argv.slice(2));
if (!existsSync(opts.map)) fatal(`data map not found: ${opts.map}`);
let map;
try {
  map = parseYamlSubset(readFileSync(opts.map, 'utf8'));
} catch (e) {
  if (e instanceof YamlError) {
    console.error(`FAIL  ${e.message}`);
    process.exit(1);
  }
  throw e;
}
if (!isObj(map)) {
  console.error('FAIL  the data map must be a mapping at the top level');
  process.exit(1);
}

checkShape(map);
const pg = await checkPostgres(map, opts);
const an = await checkAnalytics(map);
const dev = await checkDeviceSqlite(map);
const kv = await checkDeviceKeys(map);

for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`FAIL  ${e}`);
console.log(
  `\nChecked ${opts.map.startsWith(ROOT) ? opts.map.slice(ROOT.length + 1) : opts.map} against ` +
  `${pg.label} (${pg.files} files, ${pg.relations} tables and views, ${pg.columns} columns), ` +
  `catalog.ts (${an.events} events, ${an.props} properties), ` +
  `device SQLite (${dev.tables} tables, ${dev.columns} columns) and ${kv.keys} device keys.`,
);
const failed = errors.length > 0 || (opts.strict && warnings.length > 0);
console.log(failed
  ? `Data map check FAILED: ${errors.length} gap(s), ${warnings.length} warning(s)${opts.strict && warnings.length ? ' (strict)' : ''}.`
  : `Data map check passed with ${warnings.length} warning(s).`);
process.exit(failed ? 1 : 0);
