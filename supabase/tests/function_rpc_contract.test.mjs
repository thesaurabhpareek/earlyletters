// Edge Function to database contract (retro R1-05; IMP-55, guard for IMP-50).
// Every database function and table an Edge Function names must exist in the schema the migrations build.
// `invite_redeem_by_code` was called by invite-redeem/handler.ts with no migration creating it, so typed
// invite codes answered 503 while every test stayed green (20261023010000_s02_purge_and_consent_guards.sql:63).
//
// How it reads the functions (static, no Deno needed). Every non-test .ts file under supabase/functions:
//   - PostgREST URLs: `/rest/v1/rpc/<name>` (a function) and `/rest/v1/<name>` (a table or view);
//   - client calls: `.rpc('<name>'` (also `.rpc<T>('<name>'`) and supabase-js style `.from('<name>')`;
//   - direct SQL (escrow, as escrow_svc): `select public.<name>(` and `from|join|into|update public.<name>`.
// A call whose name is not a literal (for example `rpc/${fn}`) must be listed in DYNAMIC_SITES with how its
// names are resolved; an unlisted one fails, and so does a listed one that no longer exists.
// Names are checked in schema public: PostgREST's default exposed schema (supabase/config.toml sets no
// [api] schemas) and the schema escrow/db.ts names. Grants are not checked here (access_matrix does that).
//
// The extractor is checked first on in-memory fixtures: a planted fake RPC, table and SQL name must each be
// reported missing, a comment must not count, an unlisted dynamic call must be refused, and the allowlist
// self-check must fire once an allowlisted function exists.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from './harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_DIR = join(here, '..', 'functions');
const IDENT = '[A-Za-z_][A-Za-z0-9_]*';

// Calls allowed to name a function the migrations do not create yet. Each entry fails once the name exists,
// so it is removed in the same change that adds the function.
export const ALLOWLIST = [
  { kind: 'rpc', name: 'invite_redeem_by_code', pr: 306,
    why: 'called by invite-redeem/handler.ts; the migration that creates it is open PR #306 (20261027000000_invite_redeem_by_code.sql)' },
];

// Call sites whose name is built at run time. `site` must match in `file`; `resolve(text)` returns the names.
export const DYNAMIC_SITES = [
  { file: 'subscription-status/handler.ts', site: /\/rest\/v1\/rpc\/\$\{fn\}/,
    why: '`fn` is one of the two branches of `const fn = <test> ? \'<a>\' : \'<b>\';`',
    resolve: (text) => (text.match(new RegExp(`const fn = [^?;\\n]*\\?\\s*'(${IDENT})'\\s*:\\s*'(${IDENT})'\\s*;`)) ?? []).slice(1) },
  { file: 'purge-worker/lib/service.ts', site: /\/rest\/v1\/rpc\/\$\{fn\}/,
    why: 'the generic ServiceClient.rpc wrapper; every name reaches it through a literal `c.rpc(...)` call, which the `.rpc(` pattern collects',
    resolve: () => [], wrapper: true },
  { file: 'escrow/db.ts', site: /public\.\$\{fn\}\(/,
    why: '`fn` is the first argument of each `call(\'escrow_...\'` in escrowDb',
    resolve: (text) => [...text.matchAll(/\bcall\(\s*'([A-Za-z_][A-Za-z0-9_]*)'/g)].map((m) => m[1]) },
];

const PATTERNS = [
  { kind: 'rpc', re: new RegExp(`/rest/v1/rpc/(${IDENT})`, 'g') },
  { kind: 'table', re: new RegExp(`/rest/v1/(?!rpc/)(${IDENT})`, 'g') },
  { kind: 'rpc', re: new RegExp(`\\.rpc\\s*(?:<[^()]*?>)?\\s*\\(\\s*(['"\`])(${IDENT})\\1`, 'g'), group: 2 },
  { kind: 'table', re: new RegExp(`\\.from\\s*\\(\\s*(['"\`])(${IDENT})\\1\\s*\\)`, 'g'), group: 2 },
  { kind: 'rpc', re: new RegExp(`\\b(?:select|perform|call)\\s+public\\.(${IDENT})\\s*\\(`, 'gi') },
  { kind: 'table', re: new RegExp(`\\b(?:from|join|into|update)\\s+public\\.(${IDENT})\\b(?!\\s*\\()`, 'gi') },
];
const DYNAMIC = [
  /\/rest\/v1\/(?:rpc\/)?\$\{/g,
  /\.rpc\s*(?:<[^()]*?>)?\s*\(\s*(?!['"`])/g,
  /\.from\s*\(\s*(?!['"`])[A-Za-z_$][\w$.]*\s*\)(?!\s*\.)/g, // not Array.from(x, fn): one bare argument only
  /\bpublic\.\$\{/g,
];
// Array.from(x), Uint8Array.from(x) and friends are not table reads.
const NOT_TABLE_FROM = /\b(?:Array|Uint8Array|Int8Array|Uint16Array|Uint32Array|Buffer|Object|Set|Map)$/;

// Blank comment lines (keep line numbers), so a doc comment that shows an example call is not a call.
const stripCommentLines = (text) => text.split('\n')
  .map((l) => (/^\s*(?:\/\/|\/\*|\*)/.test(l) ? '' : l)).join('\n');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// files: [{ path, text }] with paths relative to supabase/functions. Returns every named call and every
// dynamic call site, each with file and line.
export function extract(files, dynamicSites = DYNAMIC_SITES) {
  const calls = [];
  const unresolved = [];
  const usedSites = new Set();
  for (const { path, text: raw } of files) {
    const text = stripCommentLines(raw);
    for (const p of PATTERNS) {
      for (const m of text.matchAll(p.re)) calls.push({ kind: p.kind, name: m[p.group ?? 1], file: path, line: lineOf(text, m.index) });
    }
    for (const re of DYNAMIC) {
      for (const m of text.matchAll(re)) {
        if (NOT_TABLE_FROM.test(text.slice(Math.max(0, m.index - 20), m.index))) continue;
        const line = lineOf(text, m.index);
        const lineText = text.split('\n')[line - 1];
        const site = dynamicSites.find((d) => d.file === path && d.site.test(lineText));
        if (!site) { unresolved.push({ file: path, line, snippet: lineText.trim().slice(0, 120) }); continue; }
        usedSites.add(site);
        for (const name of site.resolve(raw)) calls.push({ kind: 'rpc', name, file: path, line, via: 'dynamic' });
      }
    }
  }
  const staleSites = dynamicSites.filter((d) => !usedSites.has(d));
  const emptySites = dynamicSites.filter((d) => usedSites.has(d) && !d.wrapper
    && d.resolve(files.find((f) => f.path === d.file)?.text ?? '').length === 0);
  return { calls, unresolved, staleSites, emptySites };
}

// schema: { rpc: Set, table: Set }. Returns what is missing, what the allowlist covers, and allowlist faults.
export function evaluate(calls, schema, allowlist = ALLOWLIST) {
  const isAllowed = (c) => allowlist.find((a) => a.kind === c.kind && a.name === c.name);
  const absent = calls.filter((c) => !schema[c.kind].has(c.name));
  return {
    missing: absent.filter((c) => !isAllowed(c)),
    allowed: absent.filter((c) => isAllowed(c)),
    mustRemove: allowlist.filter((a) => schema[a.kind].has(a.name)),
    unused: allowlist.filter((a) => !calls.some((c) => c.kind === a.kind && c.name === a.name)),
  };
}

export function readFunctionSources(dir = FUNCTIONS_DIR) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) { if (e !== 'test' && e !== 'node_modules') walk(p); continue; }
      if (!e.endsWith('.ts') || e.endsWith('.test.ts')) continue;
      out.push({ path: relative(dir, p).split('\\').join('/'), text: readFileSync(p, 'utf8') });
    }
  };
  walk(dir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const fmt = (c) => `${c.kind} ${c.name} (${c.file}:${c.line})`;
const uniq = (calls) => [...new Set(calls.map((c) => `${c.kind}:${c.name}`))];

// ── Migrated schema ──────────────────────────────────────────────────────
const h = await createDb(process.argv.slice(2));
const { check, sys, done } = h;
const schema = {
  rpc: new Set((await sys(`select distinct p.proname n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                             where s.nspname = 'public' and p.prokind in ('f', 'p')`)).rows.map((r) => r.n)),
  table: new Set((await sys(`select c.relname n from pg_class c join pg_namespace s on s.oid = c.relnamespace
                               where s.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')`)).rows.map((r) => r.n)),
};
check(`the migrated schema has functions and tables in public (${schema.rpc.size} functions, ${schema.table.size} relations)`,
  schema.rpc.size > 50 && schema.table.size > 10);

// ── 1. The extractor on fixtures ─────────────────────────────────────────
const FIXTURE = [
  { path: 'fixture-a/handler.ts', text: [
    '// A comment that shows `/rest/v1/rpc/zz_in_a_comment_only` is not a call.',
    ' * select public.zz_in_a_doc_comment(1)',
    'await fetch(`${url}/rest/v1/rpc/zz_planted_fake_rpc`, { method: "POST" });',
    'await fetch(`${url}/rest/v1/rpc/purge_due`, { method: "POST" });',
    "await c.rpc<Record<string, unknown>>('zz_planted_client_rpc', {});",
    "await client.from('zz_planted_table').select('*');",
    'const bytes = Uint8Array.from(raw, (b) => b);',
    'const list = Array.from(set);',
    "await pg.scalar('select public.zz_planted_sql_fn($1)::text', [x]);",
  ].join('\n') },
  { path: 'fixture-b/handler.ts', text: 'const fn = pick();\nawait fetch(`${url}/rest/v1/rpc/${fn}`);' },
];
const fx = extract(FIXTURE, []);
const fxEval = evaluate(fx.calls, schema, []);
const fxMissing = new Set(fxEval.missing.map((c) => c.name));
check('fixture: a planted fake RPC in a PostgREST URL is reported missing', fxMissing.has('zz_planted_fake_rpc'));
check('fixture: a planted fake RPC in a client .rpc<T>(...) call is reported missing', fxMissing.has('zz_planted_client_rpc'));
check('fixture: a planted fake table in .from(...) is reported missing', fxMissing.has('zz_planted_table')
  && fxEval.missing.find((c) => c.name === 'zz_planted_table').kind === 'table');
check('fixture: a planted fake function in direct SQL is reported missing', fxMissing.has('zz_planted_sql_fn'));
check('fixture: a real function (purge_due) is found and not reported',
  fx.calls.some((c) => c.name === 'purge_due') && !fxMissing.has('purge_due'));
check('fixture: names inside comments are not calls',
  !fx.calls.some((c) => c.name === 'zz_in_a_comment_only' || c.name === 'zz_in_a_doc_comment'));
check('fixture: Array.from and Uint8Array.from are not table reads or dynamic calls',
  !fx.calls.some((c) => c.name === 'set' || c.name === 'raw') && !fx.unresolved.some((u) => u.file === 'fixture-a/handler.ts'));
check('fixture: an unlisted dynamic rpc/${...} call is refused, with its line',
  fx.unresolved.length === 1 && fx.unresolved[0].file === 'fixture-b/handler.ts' && fx.unresolved[0].line === 2);
const fxListed = extract(FIXTURE, [{ file: 'fixture-b/handler.ts', site: /rpc\/\$\{fn\}/, resolve: () => ['zz_dynamic_name'] }]);
check('fixture: a listed dynamic site resolves to its names and is checked like a literal',
  fxListed.unresolved.length === 0 && evaluate(fxListed.calls, schema, []).missing.some((c) => c.name === 'zz_dynamic_name'));
check('fixture: a listed dynamic site that no longer exists is reported stale',
  extract([], [{ file: 'gone.ts', site: /x/, resolve: () => [] }]).staleSites.length === 1);
check('fixture: the planted names make the contract fail (missing is not empty)', fxEval.missing.length >= 4);

// The allowlist self-check, against a schema where the allowlisted function exists.
const allowFx = evaluate([{ kind: 'rpc', name: 'zz_pending', file: 'f.ts', line: 1 }],
  { rpc: new Set(['zz_pending']), table: new Set() }, [{ kind: 'rpc', name: 'zz_pending', pr: 0 }]);
check('allowlist self-check: an entry whose function now exists must be removed', allowFx.mustRemove.length === 1);
const allowNotYet = evaluate([{ kind: 'rpc', name: 'zz_pending', file: 'f.ts', line: 1 }],
  { rpc: new Set(), table: new Set() }, [{ kind: 'rpc', name: 'zz_pending', pr: 0 }]);
check('allowlist self-check: while the function is absent the call is allowed, not missing',
  allowNotYet.mustRemove.length === 0 && allowNotYet.missing.length === 0 && allowNotYet.allowed.length === 1);
check('allowlist self-check: an entry no function calls any more is reported unused',
  evaluate([], { rpc: new Set(), table: new Set() }, [{ kind: 'rpc', name: 'zz_pending', pr: 0 }]).unused.length === 1);
const withInvite = { rpc: new Set([...schema.rpc, 'invite_redeem_by_code']), table: schema.table };
check('allowlist self-check: once invite_redeem_by_code exists (#306 merged), its entry is flagged for removal',
  evaluate([], withInvite).mustRemove.some((a) => a.name === 'invite_redeem_by_code'));

// ── 2. The real Edge Functions ───────────────────────────────────────────
const sources = readFunctionSources();
const real = extract(sources);
const result = evaluate(real.calls, schema);
const names = uniq(real.calls);
console.log(`      ${sources.length} non-test source files; ${real.calls.length} call sites; ${names.length} distinct names`);
for (const n of names.sort()) console.log(`        ${n}`);

check(`the extractor found calls in every function that talks to the database (${names.length} distinct names)`,
  names.length >= 30 && ['analytics-forget/', 'apple-token/', 'escrow/', 'invite-redeem/', 'purge-worker/', 'subscription-status/']
    .every((dir) => real.calls.some((c) => c.file.startsWith(dir))));
for (const u of real.unresolved) console.log(`      unresolved dynamic call: ${u.file}:${u.line}  ${u.snippet}`);
check('every dynamic call site is listed in DYNAMIC_SITES', real.unresolved.length === 0);
for (const s of real.staleSites) console.log(`      stale DYNAMIC_SITES entry: ${s.file} ${s.site}`);
check('every DYNAMIC_SITES entry still matches a call site', real.staleSites.length === 0);
for (const s of real.emptySites) console.log(`      DYNAMIC_SITES entry resolves to no names: ${s.file}`);
check('every non-wrapper DYNAMIC_SITES entry resolves to at least one name', real.emptySites.length === 0);

for (const c of result.missing) console.log(`      missing from the migrated schema: ${fmt(c)}`);
check('every function and table an Edge Function names exists in the migrated schema (public)', result.missing.length === 0);
for (const c of result.allowed) console.log(`      allowed while pending: ${fmt(c)}`);
for (const a of result.mustRemove) console.log(`      remove the allowlist entry: ${a.kind} ${a.name} now exists (PR #${a.pr})`);
check('allowlist: no entry names a function that now exists (remove it when its PR merges)', result.mustRemove.length === 0);
for (const a of result.unused) console.log(`      unused allowlist entry: ${a.kind} ${a.name}`);
check('allowlist: every entry is still called by an Edge Function', result.unused.length === 0);

done();
