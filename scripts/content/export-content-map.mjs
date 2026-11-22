#!/usr/bin/env node
// Content map: one row per customer-visible string in the checked-out tree. Read-only, deterministic (sorted, no
// timestamps, no git calls). Usage: node scripts/content/export-content-map.mjs [--check] [--out <dir>]
// Parses with the repo's existing `typescript` package; adds no dependency. How to read it: docs/content/map/README.md.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = 'docs/content/map';
export const COLUMNS = ['id', 'surface', 'channel', 'file', 'line', 'locale', 'text', 'chars', 'hold', 'hold_reason', 'tone', 'day_id', 'layer', 'owner', 'status', 'source'];
const SKIP_KEYS = new Set(['key', 'id', 'band', 'kind', 'tone', 'layer', 'dayId', 'day', 'tradition', 'href', 'url', 'icon', 'testID', 'screen', 'bg', 'locale', 'type', 'variant', 'route', 'slug', 'sku', 'productId', 'currency', 'code', '_comment', 'visual', 'confidence']);
const ts = createRequire(join(ROOT, 'packages/content/package.json'))('typescript');

const rel = (p) => relative(ROOT, p).split('\\').join('/');
function walk(dir, ok, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir).sort()) {
    if (n === 'node_modules' || n === 'generated' || n.startsWith('.')) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, ok, out); else if (ok(n, p)) out.push(p);
  }
  return out;
}
const isSrc = (n) => /\.(ts|tsx)$/.test(n) && !/\.(test|d)\.tsx?$/.test(n) && !['fixtures.ts', 'supabase.ts'].includes(n);
const COPY_FILE = /(^|\/)(copy|[^/]+[.-]copy)\.ts$/;

// ---- classification -------------------------------------------------------------------------------------------
function classify(file, path, text) {
  const top = path[1] ?? '', seg = path.join('.');
  let surface = 'app screen', channel = 'in-app', owner = 'content', source = 'content';
  if (file.startsWith('packages/content/src/emails/') || file.startsWith('packages/emails/')) {
    surface = 'email'; channel = /subject/i.test(seg) ? 'email subject' : /preheader|preview/i.test(seg) ? 'email preheader' : 'email body';
    if (file.endsWith('/legal.en.ts')) owner = 'clo';
  } else if (file.startsWith('supabase/templates/')) { surface = 'email'; channel = 'supabase auth template'; }
  else if (/store\.en\.ts$|^docs\/store\/|store\.config\.json$/.test(file)) { surface = 'store'; channel = 'store listing'; owner = 'cmo'; }
  else if (file.endsWith('release/testflight.en.ts')) { surface = 'store'; channel = 'testflight'; owner = 'cmo'; }
  else if (file.endsWith('release/app-review.en.ts')) { surface = 'store'; channel = 'app review notes'; owner = 'cmo'; }
  else if (/site\.en\.ts$|pages\.en\.ts$|^apps\/web\//.test(file)) { surface = 'site'; channel = 'website'; owner = 'cmo'; }
  else if (file.endsWith('book.en.ts')) { surface = 'book'; channel = 'printed book'; }
  else if (file.endsWith('prompts.ts')) { surface = 'prompt'; channel = 'prompt library'; }
  else if (file.endsWith('helplines.ts')) { surface = 'safety'; channel = 'helpline directory'; owner = 'cco'; }
  else if (file.endsWith('permissions.en.ts')) { surface = 'legal'; channel = 'os permission string'; owner = 'clo'; }
  else if (file.endsWith('pricing.ts')) { surface = 'legal'; channel = 'price and trial'; owner = 'cmo'; }
  if (surface === 'app screen') {
    if (/^(errors?)$/i.test(top) || /(^|\.)errors?(\.|$)/i.test(seg)) { surface = 'error'; channel = 'in-app error'; }
    if (/^(notifications|neutral|named|together|priming)$/i.test(top) || /(^|\.)(neutral|named|together)\./.test(seg) && /reminders/.test(file)) { surface = 'push'; channel = /priming/.test(seg) ? 'in-app' : 'push notification'; }
    if (/^(struggling|helpLinks)$/.test(top)) { surface = 'safety'; channel = 'support links'; owner = 'cco'; }
    if (/^(sensitiveConsent|analyticsConsent|ageGate)$/.test(top) || /consent/i.test(file)) { surface = 'legal'; channel = 'consent'; owner = 'privacy'; }
    if (/(^|\.)(a11y|accessib\w*|aria\w*|voiceover\w*)(\.|$)/i.test(seg)) { surface = 'a11y'; channel = 'screen reader label'; }
    if (file.startsWith('apps/mobile/')) source = 'mobile-copy';
  }
  if (file.startsWith('apps/web/')) source = 'web-content';
  if (file.startsWith('packages/emails/')) source = 'email-template';
  if (file.startsWith('supabase/') || file.startsWith('docs/')) source = file.startsWith('docs/') ? 'store-doc' : 'supabase-template';
  return { surface, channel, owner, source };
}
const HELD = [
  [(r) => /It stays in your words\. Every change is marked/.test(r.text), 'protected', 'D-133 public promise line'],
  [(r) => r.file.endsWith('helplines.ts') || /^(struggling|helpLinks)$/.test(r.path[1] ?? ''), 'protected', 'helplines and safety instructions'],
  [(r) => /(^|\.)erase(\.|$)/.test(r.path.join('.')) || /Your free letters start again\./.test(r.text), 'held', 'D-144 erase-everything lines'],
  [(r) => r.surface === 'legal' && r.channel === 'consent', 'held', 'consent (docs/legal/in-app-disclosures.md)'],
  [(r) => r.channel === 'app review notes' || r.file.endsWith('notes-for-review-1.0.txt'), 'held', 'app-review notes, sent to Apple only'],
  [(r) => r.counsel, 'held', 'counsel-header email'],
  [(r) => r.file.startsWith('supabase/templates/'), 'held', 'D-041 supabase templates'],
  [(r) => r.surface === 'prompt', 'held', 'prompt keys are stable; wording of a live key is not reused'],
  [(r) => r.channel === 'os permission string', 'held', 'OS permission string, registered disclosure'],
  [(r) => r.channel === 'price and trial', 'held', 'price and trial must match StoreKit and pricing.ts'],
];

// ---- extraction -----------------------------------------------------------------------------------------------
function candidate(text, key) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!/[A-Za-z]{2}/.test(t.replace(/\$\{[^}]*\}/g, '')) || key && SKIP_KEYS.has(key)) return false;
  if (/\s/.test(t)) return !/^(https?:|\/|\.{1,2}\/)/.test(t) || /\s.*\s/.test(t);
  return !/^[a-z0-9_.:/#@-]+$/.test(t) && !/^[A-Z0-9_]+$/.test(t) && !/^(https?:|\/)/.test(t);
}
function litText(n) {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isTemplateExpression(n)) return n.head.text + n.templateSpans.map((s) => '${' + s.expression.getText() + '}' + s.literal.text).join('');
  if (ts.isParenthesizedExpression(n)) return litText(n.expression);
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) { const a = litText(n.left), b = litText(n.right); return a === null || b === null ? null : a + b; }
  return null;
}
function extractTs(abs) {
  const file = rel(abs), text = readFileSync(abs, 'utf8');
  const kind = file.endsWith('.json') ? ts.ScriptKind.JSON : file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, kind);
  const counsel = file.startsWith('packages/content/src/emails/') && (/counsel/i.test(text.split('\n').slice(0, 25).join('\n')) || file.endsWith('emails/legal.en.ts'));
  const rows = [];
  const prop = (obj, name) => { const p = obj?.properties?.find((q) => ts.isPropertyAssignment(q) && (q.name.text ?? '') === name); return p ? litText(p.initializer) : null; };
  const emit = (n, path, t) => {
    if (path.includes('PreviewProps') || !path.length && !ts.isJsxAttribute(n.parent)) return;
    const last = [...path].reverse().find((p) => !/^\d+$/.test(p));
    if (!candidate(t, last)) return;
    const obj = ts.isPropertyAssignment(n.parent) && ts.isObjectLiteralExpression(n.parent.parent) ? n.parent.parent : null;
    let id = null;
    if (file.endsWith('prompts.ts')) { id = prop(obj, 'key'); if (!id || last !== 'text') return; }
    rows.push({ file, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, path, id, text: t.replace(/\r/g, ''), counsel,
      tone: prop(obj, 'tone') ?? '', day_id: prop(obj, 'dayId') ?? prop(obj, 'day') ?? '', layer: prop(obj, 'layer') ?? prop(obj, 'tradition') ?? '' });
  };
  const SKIPN = [ts.isImportDeclaration, ts.isExportDeclaration, ts.isTypeAliasDeclaration, ts.isInterfaceDeclaration, ts.isTypeNode];
  (function v(n, path) {
    if (SKIPN.some((f) => f(n))) return;
    const t = ts.isObjectLiteralExpression(n) || ts.isArrayLiteralExpression(n) ? null : litText(n);
    if (t !== null && n.parent && !ts.isJsxAttribute(n.parent)) return emit(n, path, t);
    if (ts.isJsxText(n)) { const s = n.text.replace(/\s+/g, ' ').trim(); if (/[A-Za-z]{3}/.test(s)) rows.push({ file, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, path, id: null, text: s, counsel, tone: '', day_id: '', layer: '' }); return; }
    if (ts.isJsxAttribute(n)) { const s = n.initializer && ts.isStringLiteral(n.initializer) ? n.initializer.text : ''; if (/\s/.test(s) && /^[A-Z]/.test(s)) emit(n.initializer, path.concat(n.name.getText()), s); return; }
    if (ts.isObjectLiteralExpression(n)) { for (const p of n.properties) { if (ts.isPropertyAssignment(p) && !ts.isComputedPropertyName(p.name)) v(p.initializer, path.concat(p.name.text)); else if (!ts.isShorthandPropertyAssignment(p) && !ts.isSpreadAssignment(p)) v(p, path); } return; }
    if (ts.isArrayLiteralExpression(n)) { n.elements.forEach((e, i) => v(e, path.concat(String(i)))); return; }
    if (ts.isVariableDeclaration(n) && n.initializer) return v(n.initializer, ts.isIdentifier(n.name) ? path.concat(n.name.text) : path);
    ts.forEachChild(n, (c) => v(c, path));
  })(sf, []);
  return rows;
}
function extractHtml(abs) {
  const file = rel(abs); let inStyle = false; const rows = [];
  readFileSync(abs, 'utf8').split('\n').forEach((raw, i) => {
    let l = raw.replace(/<!--.*?-->/g, '');
    if (/<style/i.test(l)) inStyle = true; if (inStyle) { if (/<\/style>/i.test(l)) inStyle = false; return; }
    const s = l.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
    if (/[A-Za-z]{3}/.test(s) && !/^\{\{[^}]*\}\}$/.test(s)) rows.push({ file, line: i + 1, path: ['html'], id: null, text: s, counsel: false, tone: '', day_id: '', layer: '' });
  });
  return rows;
}
function extractLines(abs) {
  const file = rel(abs);
  return readFileSync(abs, 'utf8').split('\n').flatMap((l, i) => l.trim().length > 2 ? [{ file, line: i + 1, path: ['text'], id: null, text: l.trim(), counsel: false, tone: '', day_id: '', layer: '' }] : []);
}

// Real family names never enter the map. The guard test stores only SHA-256 hashes; any word whose hash is listed
// there is replaced, so this file never spells what it guards (D-118, packages/content/test/no-real-family-data.test.ts).
function redactor(root) {
  const f = join(root, 'packages/content/test/no-real-family-data.test.ts');
  if (!existsSync(f)) throw new Error('cannot redact: no-real-family-data.test.ts is missing');
  const hashes = new Set(readFileSync(f, 'utf8').match(/\b[0-9a-f]{64}\b/g));
  return (s) => s.replace(/[\p{L}\p{M}\p{N}]+/gu, (w) => hashes.has(createHash('sha256').update(w.toLowerCase().normalize('NFC')).digest('hex')) ? '[redacted]' : w);
}
export function buildMap(root = ROOT) {
  const redact = redactor(root);
  const at = (p) => join(root, p);
  const files = [
    ...walk(at('packages/content/src'), (n) => isSrc(n)),
    ...walk(at('apps/mobile/src'), (n, p) => isSrc(n) && COPY_FILE.test(rel(p))),
    ...walk(at('apps/web/src/content'), (n) => isSrc(n)),
    ...walk(at('packages/emails/src/templates'), (n) => isSrc(n)),
    ...['docs/store/listing/listing.json', 'docs/store/screenshots/captions.json', 'apps/mobile/store.config.json'].map(at).filter(existsSync),
  ];
  const raw = [...files.map(extractTs), ...walk(at('supabase/templates'), (n) => n.endsWith('.html')).map(extractHtml),
    ...['docs/store/notes-for-review-1.0.txt'].map(at).filter(existsSync).map(extractLines)].flat();
  const seen = new Map();
  const rows = raw.map((r) => {
    const c = classify(r.file, r.path, r.text);
    r = { ...r, text: redact(r.text), id: r.id && redact(r.id) };
    const base = r.id ?? `${r.file.replace(/^packages\/content\/src\//, '')}#${redact(r.path.join('.')) || 'L' + r.line}`;
    const n = (seen.get(base) ?? 0) + 1; seen.set(base, n);
    const h = HELD.find(([f]) => f({ ...r, ...c }));
    const owner = h && h[1] === 'protected' && /helpline|safety/.test(h[2]) ? 'cco' : c.owner;
    return { id: n > 1 ? `${base}~${n}` : base, surface: c.surface, channel: c.channel, file: r.file, line: r.line,
      locale: 'en', text: r.text, chars: [...r.text].length, hold: h ? h[1] : '', hold_reason: h ? h[2] : '',
      tone: r.tone, day_id: r.day_id, layer: r.layer, owner, status: 'live on develop', source: c.source };
  });
  rows.sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const count = (k) => Object.fromEntries([...new Set(rows.map((r) => r[k]))].sort().map((v) => [v, rows.filter((r) => r[k] === v).length]));
  return { meta: { columns: COLUMNS, rowCount: rows.length, bySurface: count('surface'), byOwner: count('owner'), byHold: count('hold'), note: 'Generated by scripts/content/export-content-map.mjs; do not edit by hand.' }, rows };
}
const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export function render(map) {
  return { json: JSON.stringify(map, null, 1) + '\n', csv: [COLUMNS.join(','), ...map.rows.map((r) => COLUMNS.map((c) => q(r[c])).join(','))].join('\n') + '\n' };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2), oi = args.indexOf('--out');
  const dir = join(ROOT, oi >= 0 ? args[oi + 1] : OUT_DIR), out = render(buildMap());
  const targets = { 'content-map.json': out.json, 'content-map.csv': out.csv };
  if (args.includes('--check')) {
    const stale = Object.entries(targets).filter(([n, t]) => !existsSync(join(dir, n)) || readFileSync(join(dir, n), 'utf8') !== t).map(([n]) => n);
    if (stale.length) { console.error(`content map is stale: ${stale.join(', ')}. Run: node scripts/content/export-content-map.mjs`); process.exit(1); }
    console.log('content map is current');
  } else {
    mkdirSync(dir, { recursive: true });
    for (const [n, t] of Object.entries(targets)) writeFileSync(join(dir, n), t);
    console.log(`wrote ${rel(dir)}/content-map.{json,csv}: ${JSON.stringify(buildMap().meta.bySurface)}`);
  }
}
