/**
 * Golden corpus (CORE-08): the engine's output for a fixed set of fictional
 * "Asha" transcripts is pinned per ENGINE_VERSION.
 *
 * ENGINE_VERSION is stored on every entry so any entry can be re-derived with
 * the engine that produced it. This test makes that promise checkable:
 *  - if any output changes and ENGINE_VERSION does not, it fails;
 *  - if ENGINE_VERSION is bumped, the new behaviour must be recorded in a new
 *    `golden/engine-v<N>.json`, and every earlier file stays as it was.
 *
 * To record after a deliberate bump: SCRIBE_GOLDEN_RECORD=1 npx vitest run test/golden.test.ts
 * Never re-record an existing version's file to make this test pass.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, faithfulClean, type Edit } from '../src';
import { GOLDEN_CASES, GOLDEN_DICT, type GoldenCase } from './golden/cases';

const DIR = join(__dirname, 'golden');
const FILE = join(DIR, `engine-v${ENGINE_VERSION}.json`);

interface GoldenOutput {
  text: string;
  applied: Array<Pick<Edit, 'type' | 'start' | 'end' | 'replacement' | 'source'>>;
  rejected: string[];
  suggestions: Array<Pick<Edit, 'start' | 'end'>>;
}

interface GoldenFile {
  engineVersion: number;
  cases: Record<string, GoldenOutput>;
}

function modelEdits(c: GoldenCase): Edit[] {
  return (c.model ?? []).map((m) => {
    let start = -1;
    for (let i = 0; i <= (m.nth ?? 0); i++) start = c.raw.indexOf(m.original, start + 1);
    if (start < 0) throw new Error(`${c.id}: "${m.original}" not found`);
    return { type: m.type, start, end: start + m.original.length, original: m.original, replacement: m.replacement, source: 'model' };
  });
}

function run(c: GoldenCase): GoldenOutput {
  const r = faithfulClean(c.raw, { level: c.level ?? 'clean', dictionary: c.dictionary ?? GOLDEN_DICT, locked: c.locked, modelEdits: modelEdits(c) });
  return {
    text: r.text,
    applied: r.applied.map(({ type, start, end, replacement, source }) => ({ type, start, end, replacement, source })),
    rejected: r.rejected.map((x) => `${x.edit.type}:${x.reason}`),
    suggestions: r.suggestions.map(({ start, end }) => ({ start, end })),
  };
}

const current = (): GoldenFile => ({
  engineVersion: ENGINE_VERSION,
  cases: Object.fromEntries(GOLDEN_CASES.map((c) => [c.id, run(c)])),
});

if (process.env.SCRIBE_GOLDEN_RECORD === '1') {
  if (existsSync(FILE)) throw new Error(`${FILE} exists. Bump ENGINE_VERSION instead of re-recording a released version.`);
  writeFileSync(FILE, `${JSON.stringify(current(), null, 2)}\n`);
}

describe('golden corpus: same engine version, same output (CORE-08)', () => {
  it('has a recorded golden file for the current ENGINE_VERSION', () => {
    expect(existsSync(FILE), `No golden file for ENGINE_VERSION ${ENGINE_VERSION}. Record one (see the header of this test).`).toBe(true);
  });

  it('the newest golden file is the current ENGINE_VERSION', () => {
    const versions = readdirSync(DIR)
      .map((f) => /^engine-v(\d+)\.json$/.exec(f)?.[1])
      .filter((v): v is string => v !== undefined)
      .map(Number);
    expect(Math.max(...versions)).toBe(ENGINE_VERSION);
  });

  it('covers 40 to 70 cases across English, Hinglish, Devanagari and NFD, with unique ids', () => {
    expect(GOLDEN_CASES.length).toBeGreaterThanOrEqual(40);
    expect(GOLDEN_CASES.length).toBeLessThanOrEqual(70); // 60 until engine 8 added its six
    expect(new Set(GOLDEN_CASES.map((c) => c.id)).size).toBe(GOLDEN_CASES.length);
    for (const lang of ['en', 'hinglish', 'hi', 'nfd'] as const) {
      expect(GOLDEN_CASES.filter((c) => c.lang === lang).length, lang).toBeGreaterThanOrEqual(5);
    }
    // NFD cases really are decomposed, or the corpus is not testing what it claims.
    for (const c of GOLDEN_CASES.filter((x) => x.lang === 'nfd')) expect(c.raw, c.id).not.toBe(c.raw.normalize('NFC'));
  });

  it('every case matches its recorded output; a change needs an ENGINE_VERSION bump', () => {
    const golden = JSON.parse(readFileSync(FILE, 'utf8')) as GoldenFile;
    expect(golden.engineVersion).toBe(ENGINE_VERSION);
    expect(Object.keys(golden.cases).sort()).toEqual(GOLDEN_CASES.map((c) => c.id).sort());
    const changed: string[] = [];
    for (const c of GOLDEN_CASES) {
      const got = run(c);
      try {
        expect(got).toEqual(golden.cases[c.id]);
      } catch {
        changed.push(`${c.id}\n  raw:      ${c.raw}\n  recorded: ${golden.cases[c.id]?.text}\n  now:      ${got.text}`);
      }
    }
    expect(
      changed,
      `Engine output changed without an ENGINE_VERSION bump. Bump ENGINE_VERSION in src/pipeline.ts, note why, and record a new golden file.\n${changed.join('\n')}`,
    ).toEqual([]);
  });

  it('never writes a word that was not said: every golden output keeps the CORE-01 refusals', () => {
    const golden = JSON.parse(readFileSync(FILE, 'utf8')) as GoldenFile;
    expect(golden.cases['hi-model-hai-to-ho'].text).toBe('वह खुश है।');
    expect(golden.cases['hi-model-nahin-to-nah'].text).toBe('मैं नहीं जाऊंगा।');
    expect(golden.cases['hi-model-anusvara'].text).toBe('मैं नहीं जाऊंगा।');
    expect(golden.cases['hi-model-virama'].text).toBe('थोड़ा नमक डालो।');
    expect(golden.cases['hi-model-wedge'].text).toBe('वह खुश है');
    expect(golden.cases['nfd-model-drop-accent'].text).toBe('We went to the café today.');
    expect(golden.cases['hinglish-model-negation'].text).toContain('nahi');
  });

  it('[F06-REQ-019] the engine 6 golden file keeps every R-01 case as said', () => {
    if (ENGINE_VERSION < 6) return;
    const golden = JSON.parse(readFileSync(FILE, 'utf8')) as GoldenFile;
    const text = (id: string) => golden.cases[id].text;
    expect(text('r01-d6-uh-uh')).toBe('Did you want more? Uh-uh, she said.');
    expect(text('r01-d6-mm-hmm')).toBe('Mm-hmm, Asha nodded and smiled.');
    expect(text('r01-d6-uh-uh-spaced')).toBe('Uh uh, not now, Asha.');
    expect(text('r01-d7-single-quotes')).toContain('um, up');
    expect(text('r01-d10-name-words')).toBe('I hope you sleep well and we will see Hope tomorrow.');
    expect(text('r01-d13-name-swap')).toBe('Usha came over today and Asha laughed.');
    expect(text('r01-d13-heard-as-negation')).toBe('No, she did not cry. I said no.');
    expect(text('r01-number-range')).toBe('Asha slept 2 - 3 hours.');
    expect(text('r01-d4-model-direction-mark')).toBe('Asha laughed at the duck.');
    expect(text('r01-d9-model-noun-plural')).toBe('We saw the dogs with Asha.');
  });

  // Both files are frozen, so this holds whatever ENGINE_VERSION is now (it ran only at 6 before engine 7).
  it('[F06-REQ-019] engine 6 changed no engine 5 case: every case recorded for 5 reads the same in 6', () => {
    const v5 = join(DIR, 'engine-v5.json');
    const v6 = join(DIR, 'engine-v6.json');
    if (ENGINE_VERSION < 6 || !existsSync(v5)) return;
    const five = JSON.parse(readFileSync(v5, 'utf8')) as GoldenFile;
    const six = JSON.parse(readFileSync(v6, 'utf8')) as GoldenFile;
    for (const id of Object.keys(five.cases)) expect(six.cases[id], id).toEqual(five.cases[id]);
  });

  it('[F06-REQ-019] engine 7 changed no engine 6 case; its two new cases keep the mark the speaker said', () => {
    if (ENGINE_VERSION < 7) return;
    const six = JSON.parse(readFileSync(join(DIR, 'engine-v6.json'), 'utf8')) as GoldenFile;
    const seven = JSON.parse(readFileSync(join(DIR, 'engine-v7.json'), 'utf8')) as GoldenFile;
    for (const id of Object.keys(six.cases)) expect(seven.cases[id], id).toEqual(six.cases[id]);
    expect(seven.cases['e7-model-period-after-question'].text).toBe('Asha slept. Was there more?');
    expect(seven.cases['e7-model-period-after-danda'].text).toBe('आशा आज बहुत हँसी।');
    for (const id of ['e7-model-period-after-question', 'e7-model-period-after-danda']) {
      expect(seven.cases[id].rejected, id).toEqual(['punctuation:changes_sentence_type']);
    }
  });

  it('[F06-REQ-019] engine 8 changed no engine 7 case; its six new cases keep the words, marks and case as said', () => {
    if (ENGINE_VERSION < 8) return;
    const seven = JSON.parse(readFileSync(join(DIR, 'engine-v7.json'), 'utf8')) as GoldenFile;
    const eight = JSON.parse(readFileSync(join(DIR, 'engine-v8.json'), 'utf8')) as GoldenFile;
    for (const id of Object.keys(seven.cases)) expect(eight.cases[id], id).toEqual(seven.cases[id]);
    expect(eight.cases['e8-model-join-through-invisible'].text).toBe('Asha\u200B slept well today.');
    expect(eight.cases['e8-model-join-through-invisible'].rejected).toEqual(['paragraph:changes_word']);
    expect(eight.cases['e8-model-period-behind-quote'].text).toBe("Asha said \u201Ano.'"); // the house rule straightens U+2018 only
    expect(eight.cases['e8-model-period-behind-quote'].rejected).toEqual(['punctuation:changes_sentence_type']);
    expect(eight.cases['e8-heard-as-inside-uh-uh'].text).toBe('Did you want more? Uh-uh, she said.');
    expect(eight.cases['e8-heard-as-inside-uh-uh'].rejected).toEqual(['stt_fix:splits_word', 'stt_fix:splits_word']);
    // Rulings on #262.
    expect(eight.cases['e8-model-capital-after-locked-filler'].text).toBe('Um, hope is here.');
    expect(eight.cases['e8-model-capital-after-locked-filler'].rejected).toEqual(['filler:overlaps_protected', 'punctuation:case_change_not_sentence_start']);
    expect(eight.cases['e8-model-mark-moved-into-quote'].text).toBe('She said no.". Then she slept.');
    expect(eight.cases['e8-model-mark-moved-into-quote'].rejected).toEqual(['punctuation:changes_sentence_type']);
    expect(eight.cases['e8-heard-as-filler'].text).toBe('she came over.');
    expect(eight.cases['e8-heard-as-filler'].rejected).toEqual(['stt_fix:stt_fix_protected_word']);
  });
});
