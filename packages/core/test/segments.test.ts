/**
 * Review's "With small fixes" view is built from segments(): the person's
 * own words as plain runs and every machine edit as a mark. Display only:
 * nothing here changes an edit, the final text or anything stored.
 *
 * Found by the P4 critics' re-check on #289 (24 Oct): each run was
 * normalised on its own, so a run that began with ", " right after a mark
 * lost it. "Usher, um, today you held the spoon." read "Asha" then the
 * struck "um," with no comma between, and "Usher, today ..." read
 * "Asha" then "today". The saved letter was right; the view was not.
 *
 * The property: joining the runs reproduces the final text byte for byte,
 * every edit is one mark in order, a removal's mark is empty and a word
 * mark shows its word. Checked over the golden fixtures (and the edit sets
 * Review shows for them) and over seeded random edits in every language.
 *
 * F06-REQ-028: every machine change is visible, and the view reads as the
 * letter will. Fictional family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  acceptSuggestions,
  applyEdits,
  compileRules,
  faithfulClean,
  finalText,
  segments,
  withoutEdit,
  type DictionaryTerm,
  type Edit,
  type LanguageCode,
  type LanguageRules,
  type TextRulesPack,
} from '../src';
import { GOLDEN_CASES, GOLDEN_DICT, type GoldenCase } from './golden/cases';

const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];
const EN = compileRules('en');

/** Every invariant of the segments of `edits` over `raw`; returns the joined text. */
function expectSegmentsHold(raw: string, edits: Edit[], R: LanguageRules, label: string): string {
  const segs = segments(raw, edits, R);
  const joined = segs.map((s) => s.text).join('');
  // Byte for byte: the runs rebuild the final text, before trim and after.
  expect(joined, label).toBe(R.normalizeFinal(applyEdits(raw, edits)));
  expect(joined.trim(), label).toBe(finalText(raw, edits, R));
  // Every edit is exactly one mark, in reading order.
  const order = edits.map((e, i) => ({ e, i })).sort((a, b) => a.e.start - b.e.start).map((x) => x.i);
  expect(segs.filter((s) => s.edit !== null).map((s) => s.edit), label).toEqual(order);
  for (const s of segs) {
    if (s.edit === null) continue;
    const e = edits[s.edit];
    // A removal's mark is empty, so Review shows it struck (or as the short mark), never as added text.
    if (e.replacement === '') expect(s.text, label).toBe('');
    // A mark that is a word shows exactly that word: no comma or space drifts into it.
    if (/^[\p{L}\p{M}]+$/u.test(e.replacement)) expect(s.text, label).toBe(R.normalizeFinal(e.replacement));
  }
  return joined;
}

describe('[F06-REQ-028] segments keep the punctuation and space after a mark (#289 re-check)', () => {
  it('a repaired name, then a struck filler: "Asha", ", ", the filler, "today ..."', () => {
    const raw = 'Usher, um, today you held the spoon.';
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT });
    // The edits and the saved text are what they were; only the display runs change.
    expect(out.applied.map(({ type, start, end, original, replacement }) => ({ type, start, end, original, replacement }))).toEqual([
      { type: 'stt_fix', start: 0, end: 5, original: 'Usher', replacement: 'Asha' },
      { type: 'filler', start: 7, end: 11, original: 'um, ', replacement: '' },
    ]);
    expect(out.text).toBe('Asha, today you held the spoon.');
    const segs = segments(raw, out.applied);
    expect(segs).toEqual([
      { text: 'Asha', edit: 0 },
      { text: ', ', edit: null },
      { text: '', edit: 1 },
      { text: 'today you held the spoon.', edit: null },
    ]);
    expect(segs.map((s) => s.text).join('')).toBe(out.text);
  });

  it('a repaired name alone: "Asha", then ", today ..."', () => {
    const raw = 'Usher, today you held the spoon.';
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT });
    expect(out.text).toBe('Asha, today you held the spoon.');
    const segs = segments(raw, out.applied);
    expect(segs).toEqual([
      { text: 'Asha', edit: 0 },
      { text: ', today you held the spoon.', edit: null },
    ]);
    expect(segs.map((s) => s.text).join('')).toBe(out.text);
  });

  it('a filler put back shows as said, with its comma and space, between the runs', () => {
    const raw = 'Usher, um, today you held the spoon.';
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT });
    const kept = withoutEdit(raw, out.applied, 1).applied;
    // Review marks a span just put back as an identity edit.
    const restored = [...kept, { ...out.applied[1], replacement: out.applied[1].original }];
    expect(segments(raw, restored)).toEqual([
      { text: 'Asha', edit: 0 },
      { text: ', ', edit: null },
      { text: 'um, ', edit: 1 },
      { text: 'today you held the spoon.', edit: null },
    ]);
  });

  it('a tidy step that reaches across a cut moves the cut, never a character', () => {
    // A removal between a space and a comma: the final text drops the space, and the comma stays after the mark.
    const raw = 'Asha um , today.';
    const edits: Edit[] = [{ type: 'filler', start: 5, end: 7, original: 'um', replacement: '', source: 'rule' }];
    expect(segments(raw, edits)).toEqual([
      { text: 'Asha', edit: null },
      { text: '', edit: 0 },
      { text: ', today.', edit: null },
    ]);
    expectSegmentsHold(raw, edits, EN, 'space before comma');
  });
});

/* ---------- the property over the golden fixtures ---------- */

function modelEdits(c: GoldenCase): Edit[] {
  return (c.model ?? []).map((m) => {
    let start = -1;
    for (let i = 0; i <= (m.nth ?? 0); i++) start = c.raw.indexOf(m.original, start + 1);
    return { type: m.type, start, end: start + m.original.length, original: m.original, replacement: m.replacement, source: 'model' };
  });
}

describe('[F06-REQ-028] segments rebuild the final text byte for byte: golden fixtures', () => {
  it(`every golden case, with its fixes, each fix undone, each fix put back and every suggestion taken (${GOLDEN_CASES.length} cases)`, () => {
    let checked = 0;
    for (const c of GOLDEN_CASES) {
      const opts = { level: c.level ?? 'clean', dictionary: c.dictionary ?? GOLDEN_DICT, locked: c.locked, modelEdits: modelEdits(c) } as const;
      const out = faithfulClean(c.raw, opts);
      expect(expectSegmentsHold(c.raw, out.applied, EN, c.id).trim()).toBe(out.text);
      checked++;
      out.applied.forEach((e, i) => {
        const kept = withoutEdit(c.raw, out.applied, i).applied;
        expectSegmentsHold(c.raw, kept, EN, `${c.id} without ${i}`);
        expectSegmentsHold(c.raw, [...kept, { ...e, replacement: e.original }], EN, `${c.id} put back ${i}`);
        checked += 2;
      });
      if (out.suggestions.length > 0) {
        const taken = faithfulClean(c.raw, acceptSuggestions(opts, out.suggestions));
        expect(expectSegmentsHold(c.raw, taken.applied, EN, `${c.id} suggestions`).trim()).toBe(taken.text);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(GOLDEN_CASES.length);
  });
});

/* ---------- the property over seeded random edits, every language ---------- */

/** mulberry32, as in verify.fuzz.test.ts. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = Number(process.env.SCRIBE_FUZZ_SEED ?? 20261024);
const RUNS = 1500;
const PACKS = join(__dirname, '../../../packs/text-rules');
const load = (l: LanguageCode) => JSON.parse(readFileSync(join(PACKS, `${l}.json`), 'utf8')) as TextRulesPack;

// Everything the final-text rule touches (dashes, quotes, ellipsis, odd spaces, runs of spaces, commas before
// marks, a comma that starts a line, numbers either side of a dash), plus each language's words and marks.
const MARKS = [' ', '  ', '\t', '\n', ', ', ' ,', ',', ', ,', '. ', '.', '? ', '! ', ' \u2014 ', '\u2014', ' \u2013 ', '\u2013', '2', '3', ' 2 \u2013 3 ', '\u2026', '...', '\u2018', '\u2019', '\u201c', '\u201d', '\u00a0', '\u202f', '\ufeff', '\u00ad', '-'];
const WORDS: Record<LanguageCode, string[]> = {
  en: ['Asha', 'Usher', 'um', 'today', 'you', 'held', 'the', 'spoon'],
  es: ['Asha', 'em', 'hoy', 'la', 'cuchara', '\u00bf', '\u00a1', '\u00ab', '\u00bb'],
  fr: ['Asha', 'euh', "aujourd'hui", 'la', 'cuill\u00e8re', '\u00ab ', ' \u00bb'],
  pt: ['Asha', 'h\u00e3', 'hoje', 'a', 'colher', 'n\u00e3o'],
  hi: ['\u0906\u0936\u093e', '\u0906\u091c', '\u091a\u092e\u094d\u092e\u091a', '\u0964', '\u0967'],
  ar: ['\u0622\u0634\u0627', '\u0627\u0644\u064a\u0648\u0645', '\u0640', '\u060c', '\u060c ', '\u061f', '\u0645\u0644\u0639\u0642\u0629'],
  zh: ['\u963f\u838e', '\u4eca\u5929', '\uff0c', '\u3002', '\uff1f', '\u52fa\u5b50', '\u300c', '\u300d'],
};
const LANGS = Object.keys(WORDS) as LanguageCode[];

describe('[F06-REQ-028] segments rebuild the final text byte for byte: seeded random edits', () => {
  for (const [n, lang] of LANGS.entries()) {
    it(`${lang}: ${RUNS} random letters and edit sets (seed ${SEED})`, () => {
      const R = lang === 'en' ? EN : compileRules(lang, load(lang));
      const rand = mulberry32(SEED + n);
      const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
      const pool = [...MARKS, ...WORDS[lang], ...WORDS[lang]];
      for (let run = 0; run < RUNS; run++) {
        let raw = '';
        const len = 1 + Math.floor(rand() * 14);
        for (let t = 0; t < len; t++) raw += pick(pool);
        // Non-overlapping edits at any cut: removals, replacements and insertions, sometimes touching.
        const edits: Edit[] = [];
        let at = 0;
        while (at <= raw.length && edits.length < 6 && rand() < 0.8) {
          const start = at + Math.floor(rand() * 6);
          if (start > raw.length) break;
          const end = Math.min(raw.length, start + Math.floor(rand() * 6));
          const r = rand();
          const replacement = r < 0.45 ? '' : r < 0.75 ? pick(WORDS[lang]) : pick(MARKS);
          if (start === end && replacement === '') {
            at = start + 1;
            continue;
          }
          edits.push({ type: replacement ? 'punctuation' : 'filler', start, end, original: raw.slice(start, end), replacement, source: 'rule' });
          at = end === start ? start + 1 : end;
        }
        // Shuffled (Fisher-Yates): Review numbers edits as the engine returned them, not by position.
        for (let i = edits.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [edits[i], edits[j]] = [edits[j], edits[i]];
        }
        expectSegmentsHold(raw, edits, R, `${lang} run ${run} seed ${SEED}: ${JSON.stringify({ raw, edits })}`);
      }
    });
  }
});
