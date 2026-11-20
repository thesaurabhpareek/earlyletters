#!/usr/bin/env node
/**
 * The privacy label guard (BL-975; card 07 section 5, rows NS-07-G11-1a to G11-5; council X8, F11; gate G5).
 *
 *   node scripts/release/label-effect.mjs --base origin/develop [--head HEAD] [--body-file <file>]
 *
 * The PR body comes from --body-file, or else the PR_BODY environment variable. Checks:
 *   G11-1a  added lines that send letter text, a recording, a picture or a child name off the phone (a network call),
 *           or add a server table, column, bucket or function for them
 *   G11-3   a new analytics, crash or ads SDK in apps/mobile/package.json, a new entitlement, or a new usage string
 *   Each such finding passes only when the PR body names a D-id, that D-id is a heading in docs/DECISIONS.md on the
 *   base branch, its section names the privacy label, and docs/legal/app-store-privacy-labels.md changes in the PR.
 *   G11-2   every card in docs/product/prd/*.md at the head has a line starting `**Label effect.**` or `Label effect:`.
 * Output names files, lines and ids only, never diff content. Exit 0 pass, 1 a finding, 2 the guard could not run.
 * What it cannot catch, and why the founder's merge stays the real gate: docs/ops/LABEL_GUARD.md.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { permissionNames } from '../../apps/mobile/scripts/preflight-lib.mjs';

export const LABEL_FILE = 'docs/legal/app-store-privacy-labels.md';
export const CARDS_DIR = 'docs/product/prd';

const SHIPPED = /^(?:apps\/mobile\/(?:src|modules)|packages\/[^/]+\/src|supabase\/(?:migrations|functions))\//;
const NOT_SHIPPED = /(?:^|\/)(?:test|tests|__tests__|e2e|fixtures?)\/|\.(?:test|spec)\.[a-z]+$|\.md$/;
const COMMENT = /^\s*(?:\/\/|\/\*|\*|--|#(?![\w!]))/;
/** Calls that send data off the phone, and the Edge Function entry point. */
const NETWORK = /\bfetch\s*\(|\bXMLHttpRequest\b|\bnew\s+WebSocket\s*\(|\bsendBeacon\s*\(|\.rpc\s*\(|\.functions\s*\.\s*invoke\s*\(|\.storage\s*\.\s*from\s*\(|\b(?:sb|supabase|client|admin)\s*\.\s*from\s*\(|\.upload(?:ToSignedUrl)?\s*\(|\bURLSession\b|\bDeno\.serve\s*\(/;
/** Server objects, read in supabase/migrations only (the app's local SQLite migrations are not a server). */
const SERVER = /\bcreate\s+(?:unlogged\s+)?table\b|\badd\s+column\b|\bcreate\s+(?:or\s+replace\s+)?function\b|\bstorage\s*\.\s*buckets\b/i;
/** Letter text, a recording, a picture or a child name, by the L4 column, bucket and field names (DATA_CLASSIFICATION.md). */
const CONTENT = /transcript|final_?text|typed_?text|letter_?text|machine_?edits|author_?edits|stt_?meta|audio|recording|photo|picture|child_?name|nickname|public\.children\b/i;
/** Analytics, crash-reporting and ads SDKs, by package name. */
const TRACKING_SDK = /posthog|sentry|bugsnag|crashlytics|firebase|amplitude|mixpanel|^@segment\/|^@rudderstack\/|appsflyer|^react-native-adjust$|^@adjustcom\/|^react-native-branch$|^@datadog\/|newrelic|instabug|^@embrace-io\/|^@heap\/|appcenter|mobile-ads|admob|fbsdk|fbads|^expo-facebook$|applovin|unity-ads|ironsource|singular|kochava|clarity|tracking-transparency|^expo-insights$/i;
/** An entitlement set as a key in app.config.ts, or an Expo key that writes one. */
const ENTITLEMENT = /['"]?\b(com\.apple\.(?:developer|security)\.[\w.-]+|aps-environment|usesAppleSignIn|associatedDomains|usesIcloudStorage)['"]?\s*:/g;

/** Files of a unified diff: path, added blocks (the added lines of one hunk, with head line numbers), removed lines. */
export function parseDiff(text) {
  const files = [];
  let cur = null;
  let block = null;
  let line = 0;
  for (const raw of String(text ?? '').split('\n')) {
    if (raw.startsWith('diff --git ')) {
      cur = { path: /^diff --git a\/.* b\/(.*)$/.exec(raw)?.[1] ?? null, blocks: [], removed: [], inHunk: false };
      files.push(cur);
      continue;
    }
    if (!cur) continue;
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) [cur.inHunk, line, block] = [true, Number(hunk[1]), null];
    else if (!cur.inHunk) {
      const m = /^(?:\+\+\+ b|--- a)\/(.*)$/.exec(raw);
      if (m) cur.path = m[1];
    } else if (raw.startsWith('+')) {
      if (!block) cur.blocks.push((block = []));
      block.push({ line: line++, text: raw.slice(1) });
    } else if (raw.startsWith('-')) cur.removed.push(raw.slice(1));
    else if (raw.startsWith(' ')) [block, line] = [null, line + 1];
  }
  return files.filter((f) => f.path);
}

const code = (lines) => lines.filter((l) => !COMMENT.test(l.text));

/** Added SQL lines as statements: the first line, and the text outside dollar-quoted bodies (a function counts by its signature). */
export function sqlStatements(lines) {
  const out = [];
  let cur = null;
  let quote = null;
  for (const l of code(lines)) {
    cur ??= { line: l.line, head: '' };
    let rest = l.text;
    while (rest) {
      if (quote) {
        const i = rest.indexOf(quote);
        rest = i < 0 ? '' : rest.slice(i + quote.length);
        if (i >= 0) quote = null;
        continue;
      }
      const m = /\$[A-Za-z_]*\$/.exec(rest);
      cur.head += m ? rest.slice(0, m.index) : rest;
      [quote, rest] = m ? [m[0], rest.slice(m.index + m[0].length)] : [null, ''];
    }
    cur.head += '\n';
    if (!quote && /;\s*(?:--.*)?$/.test(l.text)) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}
const fresh = (found, removedText) => [...new Set(found)].filter((n) => !removedText.includes(n));

/** G11-1a and G11-3: what the diff adds that changes what leaves the phone or what the app may touch. */
export function labelTriggers(files) {
  const out = [];
  for (const f of files) {
    if (SHIPPED.test(f.path) && !NOT_SHIPPED.test(f.path)) {
      const near = 'next to letter text, a recording, a picture or a child name';
      for (const b of f.blocks) {
        if (f.path.startsWith('supabase/migrations/')) {
          for (const st of sqlStatements(b)) if (SERVER.test(st.head) && CONTENT.test(st.head)) out.push({ check: 'G11-1a', path: f.path, line: st.line, what: `adds a server table, column, bucket or function ${near}` });
          continue;
        }
        const lines = code(b);
        const hit = lines.find((l) => NETWORK.test(l.text));
        if (hit && lines.some((l) => CONTENT.test(l.text))) out.push({ check: 'G11-1a', path: f.path, line: hit.line, what: `adds a network call ${near}` });
      }
    }
    const added = f.blocks.flat();
    const removedText = f.removed.join('\n');
    if (f.path === 'apps/mobile/package.json') {
      for (const l of added) {
        const name = /^\s*"([^"]+)"\s*:\s*"[^"]*"/.exec(l.text)?.[1];
        if (name && TRACKING_SDK.test(name) && !removedText.includes(`"${name}"`)) out.push({ check: 'G11-3', path: f.path, line: l.line, what: `adds the SDK ${name}` });
      }
    }
    if (f.path === 'apps/mobile/app.config.ts' || f.path.endsWith('.entitlements')) {
      for (const l of code(added)) {
        const keys = [...l.text.matchAll(f.path.endsWith('.entitlements') ? /<key>([^<]+)<\/key>/g : ENTITLEMENT)].map((m) => m[1]);
        for (const name of fresh(keys, removedText)) out.push({ check: 'G11-3', path: f.path, line: l.line, what: `adds the entitlement ${name}` });
        if (f.path.endsWith('app.config.ts')) {
          for (const name of fresh(permissionNames(l.text), removedText)) out.push({ check: 'G11-3', path: f.path, line: l.line, what: `adds the usage string ${name}` });
        }
      }
    }
  }
  return out;
}

/** Each `### D-nnn` section of DECISIONS.md, heading to the next heading of level 1 to 3. */
export function decisionSections(md) {
  const sections = new Map();
  let id = null;
  for (const l of String(md ?? '').split('\n')) {
    if (/^#{1,3}\s/.test(l)) id = /^#{2,3}\s+(D-\d{3,})\b/.exec(l)?.[1] ?? null;
    if (id) sections.set(id, `${sections.get(id) ?? ''}${l}\n`);
  }
  return sections;
}

/** The G11-1a conditions that do not hold; empty when the label change is recorded. */
export function decisionProblems({ body, decisionsBase, changed }) {
  const problems = [];
  const ids = [...new Set(String(body ?? '').match(/\bD-\d{3,}\b/g) ?? [])];
  const sections = decisionSections(decisionsBase);
  const known = ids.filter((id) => sections.has(id));
  if (!ids.length) problems.push('the PR body names no D-id');
  else if (!known.length) problems.push(`${ids.join(', ')}: not a decision in docs/DECISIONS.md on the base branch`);
  else if (!known.some((id) => /privacy label|app-store-privacy-labels/i.test(sections.get(id)))) problems.push(`${known.join(', ')}: the decision on the base branch does not name the privacy label`);
  if (!changed.has(LABEL_FILE)) problems.push(`${LABEL_FILE} is not changed in this PR`);
  return problems;
}

/** G11-2: every card, or every Part of a card file, has its label line before the next card or Part heading. */
export function labelEffectProblems(cardFiles) {
  const out = [];
  for (const { name, text } of cardFiles) {
    const units = [];
    const labels = [];
    let fence = false;
    String(text ?? '').split('\n').forEach((l, i) => {
      if (/^\s*(?:```|~~~)/.test(l)) fence = !fence;
      if (fence) return;
      if (/^(?:\*\*Label effect\.\*\*|Label effect:)/.test(l)) labels.push(i + 1);
      const h = /^(#{1,2})\s+(.*)$/.exec(l);
      if (!h) return;
      const id = /^NS-\d{2}(?!\d)/.exec(h[2])?.[0];
      const range = /^NS-\d{2}\S*\s*(?:to|and|,|&)\s*NS-\d{2}/i.test(h[2]);
      if (id && !range) units.push({ line: i + 1, id, part: false });
      else if (h[1] === '##' && /^Part\b/.test(h[2]) && units.length) units.push({ line: i + 1, id: `${units.filter((u) => !u.part).at(-1).id} ${/^Part\s+\S+?(?=[.:\s]|$)/.exec(h[2])?.[0] ?? 'Part'}`, part: true });
    });
    units.forEach((u, k) => {
      const end = units[k + 1]?.line ?? Infinity;
      // A card whose next heading is one of its Parts is carried by its Parts (card 06 at the lock).
      if (!u.part && units[k + 1]?.part) return;
      if (!labels.some((n) => n > u.line && n < end)) out.push({ check: 'G11-2', path: `${CARDS_DIR}/${name}`, line: u.line, what: `${u.id} has no "**Label effect.**" line before the next card` });
    });
  }
  return out;
}

/** Every finding, with the decision problems of G11-1a and G11-3 findings attached. `failed` is the exit decision. */
export function runGuard({ diffText, body, decisionsBase, cardFiles }) {
  const files = parseDiff(diffText);
  const changed = new Set(files.map((f) => f.path));
  const triggers = labelTriggers(files);
  const missing = triggers.length ? decisionProblems({ body, decisionsBase, changed }) : [];
  const cards = labelEffectProblems(cardFiles);
  const lines = [
    ...triggers.map((t) => `${missing.length ? 'FAIL' : 'PASS'} ${t.check} ${t.path}:${t.line} ${t.what}${missing.length ? '' : ' (recorded)'}`),
    ...missing.map((m) => `FAIL record: ${m}`),
    ...cards.map((c) => `FAIL ${c.check} ${c.path}:${c.line} ${c.what}`),
  ];
  return { lines, failed: missing.length > 0 || cards.length > 0 };
}

function main(argv) {
  const arg = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
  const base = arg('--base');
  const head = arg('--head') ?? 'HEAD';
  if (!base) throw new Error('--base <ref> is required (the branch the PR merges into, for example origin/develop)');
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const show = (ref, p) => {
    try {
      return git('show', `${ref}:${p}`);
    } catch {
      return '';
    }
  };
  const body = arg('--body-file') ? readFileSync(arg('--body-file'), 'utf8') : (process.env.PR_BODY ?? '');
  const diffText = git('diff', '--no-color', '--no-ext-diff', '-M', '--unified=0', '--src-prefix=a/', '--dst-prefix=b/', `${base}...${head}`);
  const cardFiles = git('ls-tree', '--name-only', head, `${CARDS_DIR}/`)
    .split('\n')
    .filter((p) => p.endsWith('.md'))
    .map((p) => ({ name: p.slice(CARDS_DIR.length + 1), text: show(head, p) }));
  const { lines, failed } = runGuard({ diffText, body, decisionsBase: show(base, 'docs/DECISIONS.md'), cardFiles });
  for (const l of lines) console.log(l);
  console.log(failed ? 'Label guard: FAIL (docs/ops/LABEL_GUARD.md says how to clear each line).' : `Label guard: pass (${cardFiles.length} card files read).`);
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`Label guard error: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`);
    process.exitCode = 2;
  }
}
