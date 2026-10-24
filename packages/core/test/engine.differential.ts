/**
 * Single-edit differential between two engines (#249 follow-up). Not part of `npm test`:
 *
 *   npm run differential -w @scribe/core
 *   SCRIBE_DIFF_BASE=b734bed SCRIBE_DIFF_HEAD=HEAD npm run differential -w @scribe/core
 *
 * The second line compares engine 6 (b734bed, the last develop commit before #249) with this
 * checkout's HEAD. (efa71a4, the #249 merge, is already engine 7.)
 *
 * Asks verifyEdits of each engine about the same single edits and counts the edits one accepts and
 * the other refuses, by kind, with the first few of each printed. Deterministic: no seed, so the same
 * engines and texts give the same counts on every run. A report, not a gate: it fails only when it
 * finds too few texts, so read the table.
 *
 * The texts and the end marks come from the checkout that runs the script, for both refs: the same two
 * refs give other counts from a checkout with more test strings or marks. Name the checkout's commit
 * next to any table you quote.
 *
 * Engines: SCRIBE_DIFF_BASE is a git ref (default origin/develop); SCRIBE_DIFF_HEAD is a git ref, or
 * unset for this working tree's src. A ref's packages/core/src is extracted with git archive into a
 * temporary folder, removed at the end.
 *
 * Texts: every string literal in packages/core/test whose letters are all ASCII (the English test
 * strings), with two letters or more, a space or an end mark, no "/" (paths) and at most 300
 * characters; deduplicated and sorted. SCRIBE_DIFF_SPLICE makes a variant for each of its characters
 * put right after each end mark of each text, and runs those variants only ("more?." with U+3011
 * gives "more?\u3011." and "more?.\u3011").
 *
 * Edits, under English rules at level clean with no dictionary:
 *   insert_mark   every end mark the working tree's verifier knows, at every boundary not inside a word
 *   replace_mark  each end mark said, to each other end mark
 *   delete_char   each character that is not a letter, combining mark or digit
 *   swap_pair     two neighbouring characters, at least one of them not a letter, swapped
 *   removal       each word, alone or with the space before it, the space after it or the marks after it,
 *                 labelled filler, repeat and false_start
 * Whitespace-only edits are labelled paragraph, the other non-removals punctuation.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as ts from 'typescript';
import { expect, it } from 'vitest';
import { END_MARKS } from '../src/verify';
import type { Edit, EditType, Span } from '../src/types';

interface Engine {
  ENGINE_VERSION: number;
  ENGLISH_RULES: unknown;
  verifyEdits(edits: Edit[], ctx: object): { accepted: Edit[]; rejected: Array<Edit & { reason: string }> };
  protectedSpansFor(text: string, dictionary: [], locked: string[], R: unknown): Span[];
}

const CORE = join(__dirname, '..');
const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: CORE, encoding: 'utf8' }).trim();
const BASE = process.env.SCRIBE_DIFF_BASE || 'origin/develop';
const HEAD = process.env.SCRIBE_DIFF_HEAD || '';
const SPLICE = [...(process.env.SCRIBE_DIFF_SPLICE ?? '')];
const EXAMPLES = 5;

async function load(tmp: string, name: string, ref: string): Promise<{ label: string; engine: Engine }> {
  if (!ref) return { label: 'working tree', engine: (await import('../src')) as unknown as Engine };
  const sha = execFileSync('git', ['rev-parse', '--short', `${ref}^{commit}`], { cwd: REPO, encoding: 'utf8' }).trim();
  const dir = join(tmp, name);
  mkdirSync(dir);
  execFileSync('git', ['archive', '--output', join(tmp, `${name}.tar`), sha, 'packages/core/src'], { cwd: REPO });
  execFileSync('tar', ['-xf', join(tmp, `${name}.tar`), '-C', dir]);
  return { label: `${ref} (${sha})`, engine: (await import(join(dir, 'packages/core/src/index.ts'))) as Engine };
}

/* ---------- texts ---------- */

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? tsFiles(join(dir, d.name)) : d.name.endsWith('.ts') && d.name !== 'engine.differential.ts' ? [join(dir, d.name)] : []))
    .sort();
}

function literals(file: string): string[] {
  const out: string[] = [];
  const walk = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(n.text);
    ts.forEachChild(n, walk);
  };
  walk(ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false));
  return out;
}

const isMark = (c: string) => END_MARKS.includes(c);
const english = (s: string) => {
  const letters = [...s].filter((c) => /\p{L}/u.test(c));
  return s.length <= 300 && letters.length >= 2 && letters.every((c) => /[A-Za-z]/.test(c)) && !s.includes('/') && (/\s/.test(s) || [...s].some(isMark));
};

function spliced(texts: string[]): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    let i = 0;
    for (const c of t) {
      i += c.length;
      if (isMark(c)) for (const x of SPLICE) out.add(t.slice(0, i) + x + t.slice(i));
    }
  }
  return [...out].sort();
}

/* ---------- edits ---------- */

const MARKS: string[] = [];
for (let cp = 0; cp <= 0x10ffff; cp++) if ((cp < 0xd800 || cp > 0xdfff) && isMark(String.fromCodePoint(cp))) MARKS.push(String.fromCodePoint(cp));
const WORDISH = /[\p{L}\p{M}\p{N}]/u;
const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['\u2019][\p{L}\p{M}\p{N}]+)*/gu;
const REMOVALS: EditType[] = ['filler', 'repeat', 'false_start'];

function editsFor(raw: string): Array<{ kind: string; edit: Edit }> {
  const out: Array<{ kind: string; edit: Edit }> = [];
  const put = (kind: string, type: EditType, start: number, end: number, replacement: string) =>
    out.push({ kind, edit: { type, start, end, original: raw.slice(start, end), replacement, source: 'model' } });
  const kindOf = (original: string, replacement: string): EditType => (/^\s*$/.test(original + replacement) ? 'paragraph' : 'punctuation');
  const cps = [...raw];
  const at: number[] = [0];
  for (const c of cps) at.push(at[at.length - 1] + c.length);
  for (let i = 0; i <= cps.length; i++) {
    const [l, r] = [cps[i - 1] ?? '', cps[i] ?? ''];
    if (!(WORDISH.test(l) && WORDISH.test(r))) for (const m of MARKS) put('insert_mark', 'punctuation', at[i], at[i], m);
    if (i === cps.length) break;
    if (isMark(r)) for (const m of MARKS) if (m !== r) put('replace_mark', 'punctuation', at[i], at[i + 1], m);
    if (!WORDISH.test(r)) put('delete_char', kindOf(r, ''), at[i], at[i + 1], '');
    const n = cps[i + 1];
    if (n !== undefined && n !== r && !(WORDISH.test(r) && WORDISH.test(n))) put('swap_pair', kindOf(r + n, ''), at[i], at[i + 2], n + r);
  }
  for (const m of raw.matchAll(WORD)) {
    const s = m.index!;
    const e = s + m[0].length;
    const before = raw.slice(0, s).match(/\s*$/)![0].length;
    const after = raw.slice(e).match(/^\s*/)![0].length;
    const marks = raw.slice(e).match(/^[^\p{L}\p{M}\p{N}\s]*/u)![0].length;
    const spans = new Set([`${s},${e}`, `${s - before},${e}`, `${s},${e + after}`, `${s},${e + marks}`, `${s - before},${e + marks}`]);
    for (const span of spans) {
      const [a, b] = span.split(',').map(Number);
      for (const type of REMOVALS) put('removal', type, a, b, '');
    }
  }
  return out;
}

/* ---------- the run ---------- */

interface Tally { edits: number; both: number; neither: number; baseOnly: number; headOnly: number }
const fmt = (n: number) => n.toLocaleString('en-US');

it('single-edit differential between two engines', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'scribe-differential-'));
  try {
    const base = await load(tmp, 'base', BASE);
    const head = await load(tmp, 'head', HEAD);
    const english_ = [...new Set(tsFiles(join(CORE, 'test')).flatMap(literals).filter(english))].sort();
    const texts = SPLICE.length ? spliced(english_) : english_;
    const tally = new Map<string, Tally>();
    const examples: string[] = [];
    const seen = new Map<string, number>();
    for (const raw of texts) {
      const ctx = (e: Engine) => ({ raw, level: 'clean', dictionary: [], protectedSpans: e.protectedSpansFor(raw, [], [], e.ENGLISH_RULES), rules: e.ENGLISH_RULES });
      const [bc, hc] = [ctx(base.engine), ctx(head.engine)];
      for (const { kind, edit } of editsFor(raw)) {
        const b = base.engine.verifyEdits([{ ...edit }], bc);
        const h = head.engine.verifyEdits([{ ...edit }], hc);
        const [ba, ha] = [b.accepted.length === 1, h.accepted.length === 1];
        const t = tally.get(kind) ?? { edits: 0, both: 0, neither: 0, baseOnly: 0, headOnly: 0 };
        t.edits++;
        if (ba && ha) t.both++;
        else if (!ba && !ha) t.neither++;
        else {
          const dir = ba ? 'base only' : 'head only';
          if (ba) t.baseOnly++;
          else t.headOnly++;
          const key = `${kind} ${dir}`;
          seen.set(key, (seen.get(key) ?? 0) + 1);
          if (seen.get(key)! <= EXAMPLES) {
            const why = ba ? `head refuses: ${h.rejected[0]?.reason}` : `base refuses: ${b.rejected[0]?.reason}`;
            examples.push(`  ${key}: ${JSON.stringify(raw)} ${edit.type} [${edit.start},${edit.end}) ${JSON.stringify(edit.original)} -> ${JSON.stringify(edit.replacement)} (${why})`);
          }
        }
        tally.set(kind, t);
      }
    }
    const total: Tally = { edits: 0, both: 0, neither: 0, baseOnly: 0, headOnly: 0 };
    const rows = [...tally.entries()].sort(([a], [b]) => a.localeCompare(b));
    const lines = [
      '',
      `Engine differential: base ${base.label}, engine ${base.engine.ENGINE_VERSION}; head ${head.label}, engine ${head.engine.ENGINE_VERSION}`,
      `Texts: ${fmt(texts.length)}${SPLICE.length ? ` (${fmt(english_.length)} English test strings, each with ${SPLICE.map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase()}`).join(', ')} after each end mark)` : ' English test strings'}`,
      `${'kind'.padEnd(14)}${'edits'.padStart(12)}${'both accept'.padStart(14)}${'both refuse'.padStart(14)}${'base only'.padStart(12)}${'head only'.padStart(12)}`,
    ];
    for (const [kind, t] of rows) {
      for (const k of Object.keys(total) as Array<keyof Tally>) total[k] += t[k];
      lines.push(`${kind.padEnd(14)}${fmt(t.edits).padStart(12)}${fmt(t.both).padStart(14)}${fmt(t.neither).padStart(14)}${fmt(t.baseOnly).padStart(12)}${fmt(t.headOnly).padStart(12)}`);
    }
    lines.push(`${'total'.padEnd(14)}${fmt(total.edits).padStart(12)}${fmt(total.both).padStart(14)}${fmt(total.neither).padStart(14)}${fmt(total.baseOnly).padStart(12)}${fmt(total.headOnly).padStart(12)}`);
    lines.push('"base only": accepted by base, refused by head. "head only": accepted by head, refused by base.');
    if (examples.length) lines.push(`First ${EXAMPLES} of each:`, ...examples);
    process.stdout.write(`${lines.join('\n')}\n\n`);
    expect(texts.length).toBeGreaterThan(SPLICE.length ? 0 : 100);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}, 3_600_000);
