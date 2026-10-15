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
  const r = faithfulClean(c.raw, { level: c.level ?? 'clean', dictionary: GOLDEN_DICT, locked: c.locked, modelEdits: modelEdits(c) });
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

  it('covers 40 to 60 cases across English, Hinglish, Devanagari and NFD, with unique ids', () => {
    expect(GOLDEN_CASES.length).toBeGreaterThanOrEqual(40);
    expect(GOLDEN_CASES.length).toBeLessThanOrEqual(60);
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
});
