/**
 * Engine guards, core part of BL-1347 (FR-AIS-01, 02, 03, 06, 07 in docs/product/prd/functions/ai-and-speech.md).
 * The constitution in tests: the machine may remove and repair, never add meaning. These tests only read the
 * engine; changing what they protect is a founder code-owner decision, never a test edit. Fictional family only.
 * FR-AIS-08 (the other parent reads no raw data) is an access test for test:db and is not here.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CEILING_MIN_WORDS,
  CEILING_RATIO,
  MODEL_EDIT_TYPES,
  applyAuthorEdits,
  faithfulClean,
  finalText,
  replayFinalText,
  verifyEdits,
  withoutEdit,
  type DictionaryTerm,
  type Edit,
} from '../src';

const CORE_SRC = join(__dirname, '..', 'src');
const REPO = join(__dirname, '..', '..', '..');

const SEVEN = ['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph'];
const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Asia'] }];

/** Non-test TypeScript files under a folder (absent folders give none). */
function sources(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((n) => {
    const p = join(dir, n);
    if (n === 'node_modules' || n === 'dist') return [];
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(n) && !/\.(test|spec)\.|\.d\.ts$|\/test\//.test(p) ? [p] : [];
  });
}
const rel = (p: string) => relative(REPO, p).split('\\').join('/');
const read = (p: string) => readFileSync(p, 'utf8');

const stripComments = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const ID = '[A-Za-z_$][\\w$]*';
const esc = (s: string): string => s.replace(/\$/g, '\\$');

/**
 * BL-1843: the paths that call `name`, found through aliases and not only by the text `name(`. A caller is seen when it
 * uses the name under another name: a renamed import (`import { name as x }`), a const alias (`const x = name`, with or
 * without a semicolon), a renamed destructure (`const { name: x } = mod`), a namespace call (`mod.name(`), or a name
 * another file re-exports under a new one (`export { name as y }`, `export const y = name`), which is followed across
 * files until nothing new turns up.
 *
 * Also calls (BL-1879, BL-1914): a call with type arguments (`name<T>(`, including a function-typed argument such as
 * `name<(a: string) => void>(`), a computed access with a plain string key (`mod['name'](`), an optional call
 * (`name?.(`), a parenthesised callee (`(name)(`), and `name.call(`, `name.apply(` and `name.bind(`.
 *
 * Not caught, written as limits: a key built at run time (`mod['apply' + 'Edits'](`, `mod[key](`), because no text
 * scan can know what it holds; an alias that goes through an object value (`const o = { run: name }` then `o.run(`),
 * because the name is then used as a value and not called; a type argument longer than 200 characters. The plain-text
 * floor in `guardCallers` and code review stay the backstop. A line that only re-exports is not a call. Files are
 * `{ path, text }` so a planted case can sit beside the real tree without being written to disk. Not built: a check on
 * the import graph of who may import `name` (BL-1914 item 5); the allow-list of callers is the guard for now.
 *
 * Every pattern that can run across a long line is capped (`{0,200}`, and the destructure body holds no `{`): without the cap a 200,000 character line of
 * `const {` took 24 s and could hang CI.
 */
export function callersOf(files: readonly { path: string; text: string }[], name: string): string[] {
  const code = files.map((f) => ({ path: f.path, text: stripComments(f.text) }));
  const known = new Set<string>([name]);
  const alt = () => [...known].map(esc).join('|');
  const grow = (re: RegExp, text: string, from: number, to: number): boolean => {
    let grew = false;
    for (const m of text.matchAll(re)) {
      if (known.has(m[from]) && !known.has(m[to])) {
        known.add(m[to]);
        grew = true;
      }
    }
    return grew;
  };
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of code) {
      for (const m of f.text.matchAll(/\b(?:import|export)\s*(?:type\s+)?\{([^}]*)\}/g)) {
        for (const part of m[1].split(',')) {
          const [a, b] = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
          if (a && b && known.has(a.trim()) && !known.has(b.trim())) {
            known.add(b.trim());
            grew = true;
          }
        }
      }
      grew = grow(new RegExp(`\\b(?:const|let|var)\\s+(${ID})\\s*=\\s*(${ID})\\s*(?:;|$)`, 'gm'), f.text, 2, 1) || grew;
      grew = grow(new RegExp(`\\b(?:const|let|var)\\s*\\{[^{}]{0,200}?\\b(${ID})\\s*:\\s*(${ID})\\s*[,}]`, 'g'), f.text, 1, 2) || grew;
      grew = grow(new RegExp(`\\bexport\\s+const\\s+(${ID})\\s*=\\s*(${ID})\\s*(?:;|$)`, 'gm'), f.text, 2, 1) || grew;
    }
  }
  // BL-1879: a generic call `name<T>(` and a computed access with a plain string key `x['name'](` are calls too.
  // The type arguments may hold no `;`, `{`, `}` or a lone `=` (an arrow `=>` is allowed, BL-1914), and at most 200 characters,
  // so the scan cannot run away on a long line; a stray `name < a > (b)` comparison is only ever an extra flag.
  const generic = '(?:\\s*<(?:=>|[^;{}=]){0,200}?>)?';
  const open = '\\s*(?:\\?\\.\\s*)?\\(';
  const via = '(?:\\s*\\.\\s*(?:call|apply|bind))?';
  const call = new RegExp(
    `(?<![\\w$.])(?:${alt()})${via}${generic}${open}|\\(\\s*(?:${alt()})\\s*\\)\\s*\\(|\\b${ID}\\.(?:${alt()})${via}${generic}${open}|\\b${ID}\\s*\\[\\s*(['"\`])(?:${alt()})\\1\\s*\\]${generic}${open}`,
  );
  return code.filter((f) => call.test(f.text)).map((f) => f.path);
}

/**
 * What the allow-list checks use: everything `callersOf` finds plus everything the old plain-text scan (`name(` anywhere in
 * the raw text, comments and strings included) finds. The comment stripper can be fooled (a `//` inside a string hides the
 * rest of the line), so this scan may only ever see more callers than the old one, never fewer.
 */
export function guardCallers(files: readonly { path: string; text: string }[], name: string): string[] {
  const plain = new RegExp(`\\b${esc(name)}\\(`);
  const found = new Set<string>(callersOf(files, name));
  for (const f of files) if (plain.test(f.text)) found.add(f.path);
  return [...found];
}

function at(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0, source: Edit['source'] = 'model'): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`fixture: "${original}" not in "${raw}"`);
  return { type, start, end: start + original.length, original, replacement, source };
}

describe('[FR-AIS-01] the seven edit types and nothing else', () => {
  /** The names inside `export type EditType = ...;` in types.ts, read from the source so a new member cannot slip past. */
  const union = (): string[] => {
    const src = read(join(CORE_SRC, 'types.ts')).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = /export type EditType =([^;]*);/.exec(src);
    expect(m, 'EditType must stay one exported union in types.ts').not.toBeNull();
    return [...m![1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  };

  it('EditType is exactly filler, false_start, repeat, stt_fix, punctuation, agreement, paragraph', () => {
    // A new edit type is a founder code-owner decision and a constitution change. Never edit this test to make it pass.
    expect([...union()].sort(), 'A new edit type is a founder code-owner decision and a constitution change, never a test edit.').toEqual([...SEVEN].sort());
  });

  it('the model may propose only names inside that union, and never paragraph (rules only)', () => {
    const allowed = new Set(union());
    for (const t of MODEL_EDIT_TYPES) expect(allowed.has(t), `${t} is not an EditType`).toBe(true);
    expect(MODEL_EDIT_TYPES).not.toContain('paragraph');
    expect(new Set(MODEL_EDIT_TYPES).size).toBe(MODEL_EDIT_TYPES.length);
  });

  it('the verifier refuses a type outside the seven, by name, from any source', () => {
    const raw = 'Asha laughed at the dog.';
    for (const source of ['model', 'rule'] as const) {
      const e = { type: 'rewrite', start: 0, end: 4, original: 'Asha', replacement: 'The baby', source } as unknown as Edit;
      const r = verifyEdits([e], { raw, level: 'clean', dictionary: DICT, protectedSpans: [] });
      expect(r.accepted, source).toEqual([]);
      expect(r.rejected, source).toHaveLength(1);
    }
  });
});

describe('[FR-AIS-02] every machine edit goes through the verifier, with no bypass', () => {
  const roots = [CORE_SRC, join(REPO, 'apps', 'mobile', 'src'), join(REPO, 'supabase', 'functions')];
  const files = roots.flatMap(sources);

  it('the scan sees the code it is meant to guard', () => {
    expect(files.some((f) => rel(f) === 'packages/core/src/pipeline.ts')).toBe(true);
    expect(files.some((f) => rel(f) === 'packages/core/src/verify.ts')).toBe(true);
    expect(files.length).toBeGreaterThan(100);
  });

  it('only verify.ts and pipeline.ts apply edits to words; only pipeline.ts and the model provider call the verifier', () => {
    const texts = files.map((f) => ({ path: rel(f), text: read(f) }));
    const applying = guardCallers(texts, 'applyEdits').sort();
    expect(applying).toEqual(['packages/core/src/pipeline.ts', 'packages/core/src/verify.ts']);
    const verifying = guardCallers(texts, 'verifyEdits').filter((p) => p !== 'packages/core/src/verify.ts').sort();
    expect(verifying).toEqual(['packages/core/src/model-edits.ts', 'packages/core/src/pipeline.ts']);
  });

  // BL-1843: the scan follows aliases. Planted callers sit beside the real tree and each must be flagged.
  const REAL_ONLY = ['packages/core/src/pipeline.ts', 'packages/core/src/verify.ts'];
  const planted: Record<string, string> = {
    'planted/renamed-import.ts': "import { applyEdits as patchWords } from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => patchWords(r, e);",
    'planted/const-alias.ts': "import { applyEdits } from '@scribe/core';\nconst tweak = applyEdits;\nexport const run = (r: string, e: unknown[]) => tweak(r, e);",
    'planted/namespace.ts': "import * as core from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => core.applyEdits(r, e);",
    'planted/destructure.ts': "import * as core from '@scribe/core';\nconst { applyEdits: patch } = core;\nexport const run = (r: string, e: unknown[]) => patch(r, e);",
    'planted/reexport.ts': "export { applyEdits as quietFix } from './verify';",
    'planted/reexport-caller.ts': "import { quietFix } from './reexport';\nexport const run = (r: string, e: unknown[]) => quietFix(r, e);",
    'planted/computed.ts': "import * as core from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => core['applyEdits'](r, e);",
    'planted/computed-dq.ts': 'import * as core from "@scribe/core";\nexport const run = (r: string, e: unknown[]) => core[ "applyEdits" ]<string>(r, e);',
    'planted/generic.ts': "import { applyEdits } from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => applyEdits<string>(r, e);",
    'planted/generic-ns.ts': "import * as core from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => core.applyEdits<Map<string, number>>(r, e);",
    'planted/generic-alias.ts': "import { applyEdits as patch } from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => patch<string>(r, e);",
    'planted/dynamic-key.ts': "import * as core from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => core['apply' + 'Edits'](r, e);",
    'planted/comment-only.ts': "// applyEdits(raw, edits) is only mentioned here\n/* patchWords(raw) too */\nexport const x = 1;",
  };
  const plantedFiles = Object.entries(planted).map(([path, text]) => ({ path, text }));

  it('[BL-1843] an aliased, namespaced, destructured or re-exported caller of applyEdits is flagged; a comment is not', () => {
    const hit = callersOf(plantedFiles, 'applyEdits').sort();
    expect(hit).toEqual([
      'planted/computed-dq.ts',
      'planted/computed.ts',
      'planted/const-alias.ts',
      'planted/destructure.ts',
      'planted/generic-alias.ts',
      'planted/generic-ns.ts',
      'planted/generic.ts',
      'planted/namespace.ts',
      'planted/reexport-caller.ts',
      'planted/renamed-import.ts',
    ]);
  });

  it('[BL-1879] computed access and generic calls are flagged; a key built at run time is the one documented limit', () => {
    const only = (p: string) => plantedFiles.filter((f) => f.path === p);
    for (const p of ['computed', 'computed-dq', 'generic', 'generic-ns', 'generic-alias']) {
      expect(callersOf(only(`planted/${p}.ts`), 'applyEdits'), p).toEqual([`planted/${p}.ts`]);
      expect(guardCallers(only(`planted/${p}.ts`), 'applyEdits'), p).toEqual([`planted/${p}.ts`]);
    }
    expect(callersOf(only('planted/dynamic-key.ts'), 'applyEdits')).toEqual([]);
    const real = files.map((f) => ({ path: rel(f), text: read(f) }));
    expect(guardCallers([...real, ...only('planted/computed.ts'), ...only('planted/generic.ts')], 'applyEdits').sort()).toEqual(
      ['planted/computed.ts', 'planted/generic.ts', ...REAL_ONLY].sort(),
    );
  });

  // BL-1914: more call shapes, and the written limits. Each caught shape must be flagged; each limit is pinned so a change shows.
  const IMP = "import { applyEdits } from '@scribe/core';\n";
  const caught1914: Record<string, string> = {
    'planted/fn-generic.ts': `${IMP}export const run = (r: string, e: unknown[]) => applyEdits<(a: string) => void>(r, e);`,
    'planted/optional-call.ts': `${IMP}export const run = (r: string, e: unknown[]) => applyEdits?.(r, e);`,
    'planted/optional-ns.ts': "import * as core from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => core.applyEdits?.(r, e);",
    'planted/paren-callee.ts': `${IMP}export const run = (r: string, e: unknown[]) => (applyEdits)(r, e);`,
    'planted/dot-call.ts': `${IMP}export const run = (r: string, e: unknown[]) => applyEdits.call(null, r, e);`,
    'planted/dot-bind.ts': `${IMP}export const run = (r: string, e: unknown[]) => applyEdits.bind(null)(r, e);`,
    'planted/ns-apply.ts': "import * as core from '@scribe/core';\nexport const run = (r: string, e: unknown[]) => core.applyEdits.apply(null, [r, e]);",
    'planted/alias-no-semicolon.ts': `${IMP}const tweak = applyEdits\nexport const run = (r: string, e: unknown[]) => tweak(r, e)`,
    'planted/object-shorthand.ts': `${IMP}const o = { applyEdits }\nexport const run = (r: string, e: unknown[]) => o.applyEdits(r, e)`,
  };
  const limits1914: Record<string, string> = {
    // Limit: the name is used as a value inside an object under another key, so no call of the name appears in the text.
    'planted/object-renamed-value.ts': `${IMP}const o = { run: applyEdits };\nexport const go = (r: string, e: unknown[]) => o.run(r, e);`,
  };
  const files1914 = (rec: Record<string, string>) => Object.entries(rec).map(([path, text]) => ({ path, text }));

  it('[BL-1914] a function-typed generic argument, an optional call, a parenthesised callee, .call/.apply/.bind, an alias with no semicolon and an object shorthand are all flagged', () => {
    for (const f of files1914(caught1914)) expect(callersOf([f], 'applyEdits'), f.path).toEqual([f.path]);
  });

  it('[BL-1914] the one written limit: an alias through an object value under another key is not seen (only the old plain scan floor remains)', () => {
    for (const f of files1914(limits1914)) {
      expect(callersOf([f], 'applyEdits'), f.path).toEqual([]);
      expect(guardCallers([f], 'applyEdits'), f.path).toEqual([]);
    }
  });

  it('[BL-1914] the real tree is still only pipeline.ts and verify.ts with the wider patterns (no false positive)', () => {
    const real = files.map((f) => ({ path: rel(f), text: read(f) }));
    expect(callersOf(real, 'applyEdits').sort()).toEqual(REAL_ONLY);
    expect(guardCallers(real, 'applyEdits').sort()).toEqual(REAL_ONLY);
  });

  it('[BL-1914] a very long line returns in under a second (the cap on the type-argument and destructure scans)', () => {
    const lines = [
      { path: 'planted/long-destructure.ts', text: 'const {'.repeat(200_000) },
      { path: 'planted/long-generic.ts', text: 'applyEdits<'.repeat(20_000) + 'a'.repeat(100_000) },
      { path: 'planted/long-generic-ns.ts', text: 'core.applyEdits<' + 'a'.repeat(200_000) },
      { path: 'planted/long-alias.ts', text: 'const x = ' + ' '.repeat(200_000) },
    ];
    for (const f of lines) {
      const t0 = performance.now();
      callersOf([f], 'applyEdits');
      guardCallers([f], 'applyEdits');
      expect(performance.now() - t0, f.path).toBeLessThan(1000);
    }
  });

  it('[BL-1843] the old text-only scan misses the aliased callers the new scan finds (the defect, shown)', () => {
    const naive = plantedFiles.filter((f) => /\bapplyEdits\(/.test(f.text)).map((f) => f.path);
    expect(naive).toEqual(['planted/namespace.ts', 'planted/comment-only.ts']); // and it wrongly counts a comment
    expect(callersOf(plantedFiles, 'applyEdits').length).toBeGreaterThan(naive.length);
  });

  it('[BL-1843] a planted aliased writer beside the real tree breaks the allow-list, and the real tree alone passes', () => {
    const real = files.map((f) => ({ path: rel(f), text: read(f) }));
    expect(guardCallers(real, 'applyEdits').sort()).toEqual(REAL_ONLY);
    const withPlanted = guardCallers([...real, plantedFiles[0]], 'applyEdits').sort();
    expect(withPlanted).toEqual([plantedFiles[0].path, ...REAL_ONLY].sort());
    const verifyAlias = { path: 'planted/verify-alias.ts', text: "import { verifyEdits as check } from '@scribe/core';\nexport const ok = (a: never) => check(a);" };
    expect(guardCallers([...real, verifyAlias], 'verifyEdits')).toContain('planted/verify-alias.ts');
  });

  it('[BL-1843] a // inside a string cannot hide a call: the guard never finds fewer callers than the old plain scan', () => {
    const sneaky = { path: 'planted/string-slashes.ts', text: "const s = ' // '; applyEdits(a, b)" };
    expect(/\bapplyEdits\(/.test(sneaky.text)).toBe(true); // the old scan sees it
    expect(guardCallers([sneaky], 'applyEdits')).toEqual([sneaky.path]);
    const real = files.map((f) => ({ path: rel(f), text: read(f) }));
    expect(guardCallers([...real, sneaky], 'applyEdits').sort()).toEqual([sneaky.path, ...REAL_ONLY].sort());
    // for every planted and real file, the guard is a superset of the old scan
    for (const f of [...plantedFiles, sneaky, ...real]) {
      if (/\bapplyEdits\(/.test(f.text)) expect(guardCallers([f], 'applyEdits'), f.path).toContain(f.path);
    }
  });

  it('faithfulClean applies only what the verifier accepted', () => {
    const src = read(join(CORE_SRC, 'pipeline.ts'));
    expect(src).toMatch(/const applied = restResult\.accepted;/);
    expect(src).toMatch(/applyEdits\(raw, applied\)/);
  });

  it('no flag, parameter or environment variable switches the verifier off', () => {
    const bypass = /\b(skip|bypass|disable|no|without)_?Verif(y|ier|ication)\b|\bverify\s*:\s*false\b|\bunverified\s*:\s*true\b|process\.env\.[A-Z_]*(VERIFY|BYPASS)/i;
    const hits = files.filter((f) => bypass.test(read(f))).map(rel);
    expect(hits).toEqual([]);
  });

  it('a model cannot dodge the ceiling by labelling its edits as rules: faithfulClean stamps the source', () => {
    const raw = 'she have one. she have two. she have three. she have four. she have five. she have six.';
    const claimed = Array.from({ length: 6 }, (_, i) => at(raw, 'agreement', 'have', 'has', i, 'rule'));
    const r = faithfulClean(raw, { level: 'clean', dictionary: DICT, modelEdits: claimed });
    expect(r.applied).toEqual([]);
    expect(r.rejected.filter((x) => x.reason === 'change_ceiling_exceeded')).toHaveLength(6);
  });
});

describe('[FR-AIS-03] the share-of-words ceiling', () => {
  const run = (raw: string, model: Edit[], rule: Edit[] = []) => verifyEdits([...rule, ...model], { raw, level: 'clean', dictionary: DICT, protectedSpans: [] });
  /** Raw of `n` sentences "she have one." with one agreement repair possible in each (one per sentence is the limit). */
  const sentences = (n: number) => Array.from({ length: n }, (_, i) => `she have ${['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][i]}.`).join(' ');
  const repairs = (raw: string, n: number) => Array.from({ length: n }, (_, i) => at(raw, 'agreement', 'have', 'has', i));

  it('pins the ratio at 15 percent and the minimum at 3 words', () => {
    expect(CEILING_RATIO).toBe(0.15);
    expect(CEILING_MIN_WORDS).toBe(3);
  });

  it('at the ceiling every model edit stays; one word past it, every model edit goes and the rule edit stays', () => {
    // 10 sentences of 3 words = 30 words; 15 percent is 4.5, so 5 words are allowed and 6 are not.
    const raw = `um ${sentences(10)}`;
    const total = raw.split(/\s+/).length;
    expect(Math.ceil(CEILING_RATIO * total)).toBe(5);
    const rule = at(raw, 'filler', 'um ', '', 0, 'rule');

    const atCeiling = run(raw, repairs(raw, 5), [rule]);
    expect(atCeiling.accepted.filter((e) => e.source === 'model')).toHaveLength(5);
    expect(atCeiling.rejected).toEqual([]);

    const past = run(raw, repairs(raw, 6), [rule]);
    expect(past.accepted).toEqual([rule]);
    expect(past.rejected).toHaveLength(6);
    expect(past.rejected.every((x) => x.reason === 'change_ceiling_exceeded')).toBe(true);
    expect(past.modelChangeRatio).toBe(0);
  });

  it('a short entry may still take three model words, whatever the share (the 3-word minimum)', () => {
    // Five words: one edit is 20 percent, above 15, but under the minimum of 3 words.
    const raw = 'she have one. she have two.';
    const r = run(raw, repairs(raw, 2));
    expect(r.accepted).toHaveLength(2);
    expect(r.rejected).toEqual([]);
    // Four model words on a six-word entry is past the minimum and goes.
    const raw2 = 'she have one. she have two. she have three. she have four.';
    const past = run(raw2, repairs(raw2, 4));
    expect(past.accepted).toEqual([]);
    expect(past.rejected.every((x) => x.reason === 'change_ceiling_exceeded')).toBe(true);
  });

  it('the model never gets a say: past the ceiling the result is the rules-only result', () => {
    const raw = `um ${sentences(10)}`;
    const rulesOnly = faithfulClean(raw, { level: 'clean', dictionary: DICT });
    const withModel = faithfulClean(raw, { level: 'clean', dictionary: DICT, modelEdits: repairs(raw, 6) });
    expect(withModel.text).toBe(rulesOnly.text);
    expect(withModel.applied.filter((e) => e.source === 'model')).toEqual([]);
  });
});

describe('[FR-AIS-06] a restore runs no model and no rule', () => {
  const raw = 'um she have the the blue ball';

  it('stored edits and words come back as stored, even where today\'s rules would clean more', () => {
    // Stored: nothing was removed. A restore must not run the filler or repeat rules now.
    expect(finalText(raw, [])).toBe(raw);
    expect(replayFinalText(raw, [])).toBe(raw);
    // Stored: one filler removed. Only that edit is applied; the repeat is left as it was stored.
    const stored = [at(raw, 'filler', 'um ', '', 0, 'rule')];
    expect(finalText(raw, stored)).toBe('she have the the blue ball');
    expect(replayFinalText(raw, stored)).toBe('she have the the blue ball');
  });

  it('stored edits are applied as stored, not judged again (no verifier on the way back)', () => {
    // Six model edits would be refused by the ceiling today; a restore does not ask.
    const long = 'she have one. she have two. she have three. she have four. she have five. she have six.';
    const six = Array.from({ length: 6 }, (_, i) => at(long, 'agreement', 'have', 'has', i));
    expect(verifyEdits(six, { raw: long, level: 'clean', dictionary: DICT, protectedSpans: [] }).accepted).toEqual([]);
    expect(finalText(long, six)).toBe('she has one. she has two. she has three. she has four. she has five. she has six.');
  });

  it('undoing one stored edit re-derives from the other stored edits and nothing more', () => {
    const stored = [at(raw, 'filler', 'um ', '', 0, 'rule'), at(raw, 'repeat', 'the ', '', 0, 'rule')];
    const r = withoutEdit(raw, stored, 1);
    expect(r.applied).toEqual([stored[0]]);
    expect(r.text).toBe('she have the the blue ball');
  });

  it('the restore path never reaches the engine: finalText, replay and author layers call no provider, rule run or verifier (source)', () => {
    const pipeline = read(join(CORE_SRC, 'pipeline.ts'));
    const body = /export function finalText\([^)]*\)[^{]*\{([\s\S]*?)\n\}/.exec(pipeline);
    expect(body, 'finalText must stay one exported function').not.toBeNull();
    expect(body![1]).not.toMatch(/faithfulClean|verifyEdits|checkEdit|Provider|modelEdits|fillerEdits|repeatEdits|dictionaryEdits/);
    const author = read(join(CORE_SRC, 'author-edits.ts'));
    expect(author.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/faithfulClean|verifyEdits|checkEdit|cleanWithProviders|model-edits|edit-provider/);
  });
});

describe('[FR-AIS-07] typed words are never machine-edited', () => {
  it('the author layer applies the parent\'s own words exactly, including what the verifier would refuse or the rules would clean', () => {
    const raw = 'she was so happy';
    const base = finalText(raw, []);
    // Typed words with a filler, a repeat, a double space and no capital: all kept as typed.
    const typed = 'um the the baby  laughed';
    const out = applyAuthorEdits(base, [{ start: 0, end: base.length, replacement: typed }]);
    expect(out).toBe(typed);
    expect(replayFinalText(raw, [], [{ start: 0, end: base.length, replacement: typed }])).toBe(typed);
  });

  it('nothing in the author layer produces an edit or a suggestion: it never imports the engine (source)', () => {
    const author = read(join(CORE_SRC, 'author-edits.ts')).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(author).not.toMatch(/\bfaithfulClean\b|\bverifyEdits\b|\bsuggestions?\b|\bmodelEdits\b/);
  });

  it('an author edit is not an EditType and a typed-words save has no machine edit to carry', () => {
    const src = read(join(CORE_SRC, 'author-edits.ts'));
    expect(src).not.toMatch(/type:\s*'(filler|false_start|repeat|stt_fix|punctuation|agreement|paragraph)'/);
  });
});
