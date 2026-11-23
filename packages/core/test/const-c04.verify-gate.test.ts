/**
 * CONST-C04: no machine edit is stored or applied without passing verifyEdits (CLAUDE.md, the constitution).
 *
 * A source scan, because unit tests of verifyEdits cannot see a new writer that never calls it. Read as text: nothing
 * here runs the app. The rule, in four parts, over every non-test source file in packages/ and apps/:
 *
 *  1. Gate. Only GATES call verifyEdits (pipeline.ts, model-edits.ts), and each really does: the text applied or
 *     returned is the verifier's `accepted` list, and the call comes before it.
 *  2. Producers. A file that builds an edit object (`source: 'rule' | 'model'`) is a gate or a listed PRODUCER (a
 *     candidate source whose output only the gate consumes). Nothing under apps/ builds one; the app gets edits from
 *     faithfulClean. A producer never applies edits.
 *  3. Appliers. applyEdits( is called only in verify.ts and pipeline.ts.
 *  4. Writers. A file that writes the machine_edits column is a listed STORE_WRITER, which stores the edits it is given
 *     and never builds or applies one (parts 2 and 3 cover that).
 *  And: no bypass flag (skipVerify, noVerify, bypass...) exists in the edit paths, in code or in the option types.
 *
 * Not proven here: that a caller hands a store writer edits that came from faithfulClean (data flow). That is the
 * review.tsx wiring tests' job. Adding a gate, producer or writer means adding it to the lists below on purpose.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const GATES = ['packages/core/src/pipeline.ts', 'packages/core/src/model-edits.ts'];
const PRODUCERS = [
  'packages/core/src/punctuation.ts',
  'packages/core/src/protect.ts',
  'packages/core/src/rules.ts',
  'packages/core/src/repeats.ts',
  'packages/core/src/lang/dictionary.ts',
  'packages/core/src/lang/script.ts',
  'packages/core/src/lang/punctuation.ts',
];
const APPLIERS = ['packages/core/src/verify.ts', 'packages/core/src/pipeline.ts'];
const STORE_WRITERS = ['apps/mobile/src/lib/db/repos/entries.ts', 'apps/mobile/src/lib/sync/merge.ts'];
const EDIT_PATHS = [
  /^packages\/core\/src\//,
  /^apps\/mobile\/src\/lib\/transcription-queue\/clean\.ts$/,
  /^apps\/mobile\/src\/lib\/capture\/review-persist\.logic\.ts$/,
  /^apps\/mobile\/src\/components\/onboarding\/promise-sample\.logic\.ts$/,
  /^apps\/mobile\/src\/lib\/store\.ts$/,
  /^apps\/mobile\/src\/app\/review\.tsx$/,
  ...STORE_WRITERS.map((p) => new RegExp(`^${p.replace(/[.\\/]/g, '\\$&')}$`)),
];

type Files = Record<string, string>;

/** Code without comments (line and block). Good enough for a scan; a `//` inside a URL string is kept. */
export function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'test' || name === 'e2e' || name === '__tests__') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Every non-test source file under packages/<x>/src and apps/<x>/src, by repo-relative path. */
function loadSource(): Files {
  const files: Files = {};
  for (const top of ['packages', 'apps']) {
    for (const pkg of readdirSync(join(ROOT, top))) {
      const src = join(ROOT, top, pkg, 'src');
      try {
        if (!statSync(src).isDirectory()) continue;
      } catch {
        continue;
      }
      for (const f of walk(src)) files[relative(ROOT, f).split(sep).join('/')] = readFileSync(f, 'utf8');
    }
  }
  return files;
}

const CALLS_VERIFY = /(?<!function\s)\bverifyEdits\s*\(/;
const CALLS_APPLY = /(?<!function\s)\bapplyEdits\s*\(/;
const BUILDS_EDIT = /\bsource:\s*['"](rule|model)['"]/;
const WRITES_COLUMN = /machine_edits\s*=\s*[?']|INSERT\s+(?:OR\s+\w+\s+)?INTO\s+entries\b[^;]*?machine_edits/is;
const BYPASS = /\b(skip_?verif\w*|no_?verif\w*|bypass\w*|unverified\w*|disable_?verif\w*|without_?verif\w*|dont_?verify|trust_?edits?\w*|force_?edits?\w*)\b|\bverif(y|ied)\s*:\s*false\b/i;

/** The rule. Returns one line per breach; empty means the tree is clean. */
export function scan(files: Files): string[] {
  const bad: string[] = [];
  const src = Object.fromEntries(Object.entries(files).map(([p, t]) => [p, code(t)]));
  for (const [path, c] of Object.entries(src)) {
    const gate = GATES.includes(path);
    if (CALLS_VERIFY.test(c) && !gate && path !== 'packages/core/src/verify.ts') bad.push(`${path}: calls verifyEdits but is not a listed gate`);
    if (BUILDS_EDIT.test(c) && !gate && !PRODUCERS.includes(path)) bad.push(`${path}: builds machine edits and is neither a gate nor a listed producer`);
    if (CALLS_APPLY.test(c) && !APPLIERS.includes(path)) bad.push(`${path}: applies edits (applyEdits) outside the verified pipeline`);
    if (WRITES_COLUMN.test(c) && !STORE_WRITERS.includes(path)) bad.push(`${path}: writes machine_edits and is not a listed store writer`);
    if (EDIT_PATHS.some((re) => re.test(path)) && BYPASS.test(c)) bad.push(`${path}: bypass flag in an edit path (${c.match(BYPASS)![0]})`);
  }
  for (const g of GATES) if (!src[g] || !CALLS_VERIFY.test(src[g])) bad.push(`${g}: listed gate does not call verifyEdits`);

  const pipe = src['packages/core/src/pipeline.ts'] ?? '';
  const call = pipe.search(/restResult\s*=\s*verifyEdits\(\s*\[\s*\.\.\.dictResult\.accepted,\s*\.\.\.rules,\s*\.\.\.model\s*\]/);
  const apply = pipe.search(/applyEdits\(raw,\s*applied\)/);
  if (call < 0) bad.push('packages/core/src/pipeline.ts: rule, dictionary and model edits no longer go through one verifyEdits call');
  if (!/const applied = restResult\.accepted/.test(pipe)) bad.push('packages/core/src/pipeline.ts: applied is not the verifier accepted list');
  if (apply < 0 || call < 0 || apply < call) bad.push('packages/core/src/pipeline.ts: faithfulClean applies edits that did not pass verifyEdits first');

  const model = src['packages/core/src/model-edits.ts'] ?? '';
  const mcall = model.search(/verified\s*=\s*verifyEdits\(\s*candidates\b/);
  const mret = model.search(/edits:\s*verified\.accepted/);
  if (mcall < 0 || mret < mcall) bad.push('packages/core/src/model-edits.ts: model candidates are not returned from verifyEdits accepted');
  if (/\bedits:\s*candidates\b/.test(model)) bad.push('packages/core/src/model-edits.ts: returns unverified candidates');

  const types = (src['packages/core/src/pipeline.ts'] ?? '') + (src['packages/core/src/verify.ts'] ?? '');
  for (const iface of ['CleanOptions', 'VerifyContext']) {
    const body = types.match(new RegExp(`interface ${iface}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
    for (const key of body.matchAll(/^\s*(\w+)\??:/gm)) if (/verif|skip|bypass|trust|force|unsafe/i.test(key[1])) bad.push(`${iface}.${key[1]}: option that could switch verification off`);
  }
  return bad;
}

const tree = loadSource();
const fixture = (n: string) => readFileSync(new URL(`./fixtures/const-c04/${n}`, import.meta.url), 'utf8');

describe('CONST-C04 every machine edit goes through verifyEdits', () => {
  it('[CONST-C04] the scan sees the real writers (gates, producers, store writers all exist)', () => {
    for (const p of [...GATES, ...PRODUCERS, ...APPLIERS, ...STORE_WRITERS]) expect(tree[p], p).toBeTypeOf('string');
    for (const p of PRODUCERS) expect(BUILDS_EDIT.test(code(tree[p])), `${p} no longer builds edits: drop it from PRODUCERS`).toBe(true);
    for (const p of STORE_WRITERS) expect(WRITES_COLUMN.test(code(tree[p])), `${p} no longer writes machine_edits: drop it`).toBe(true);
  });

  it('[CONST-C04] no code path stores or applies a machine edit without verifyEdits', () => {
    expect(scan(tree)).toEqual([]);
  });

  it('[CONST-C04] no skipVerify, noVerify or bypass flag exists in the edit paths or the option types', () => {
    expect(scan(tree).filter((l) => /bypass flag|could switch verification off/.test(l))).toEqual([]);
  });

  it('[CONST-C04] positive control: a planted writer that skips verifyEdits turns the scan red', () => {
    const lines = scan({ ...tree, 'apps/mobile/src/lib/quick-save.ts': fixture('unverified-writer.fixture.txt') });
    expect(lines.some((l) => /quick-save\.ts: builds machine edits/.test(l))).toBe(true);
    expect(lines.some((l) => /quick-save\.ts: applies edits/.test(l))).toBe(true);
    expect(lines.some((l) => /quick-save\.ts: writes machine_edits/.test(l))).toBe(true);
  });

  it('[CONST-C04] positive control: a planted skipVerify flag turns the scan red', () => {
    const lines = scan({ ...tree, 'packages/core/src/pipeline-fast.ts': fixture('bypass-flag.fixture.txt') });
    expect(lines.some((l) => /pipeline-fast\.ts: bypass flag/.test(l))).toBe(true);
  });

  it('[CONST-C04] positive control: a gate that stops calling verifyEdits turns the scan red', () => {
    const model = tree['packages/core/src/model-edits.ts'].replace(/verifyEdits\(/g, 'passThrough(');
    expect(scan({ ...tree, 'packages/core/src/model-edits.ts': model }).some((l) => /model-edits\.ts/.test(l))).toBe(true);
    const pipe = tree['packages/core/src/pipeline.ts'].replaceAll('applyEdits(raw, applied)', 'applyEdits(raw, [...applied, ...rules])');
    expect(scan({ ...tree, 'packages/core/src/pipeline.ts': pipe }).some((l) => /pipeline\.ts/.test(l))).toBe(true);
  });

  it('[CONST-C04] a clean tree stays clean when only comments mention verifyEdits or a bypass', () => {
    const lines = scan({ ...tree, 'apps/mobile/src/lib/note.ts': '// verifyEdits( bypass skipVerify applyEdits(\nexport const x = 1;\n' });
    expect(lines).toEqual([]);
  });
});
