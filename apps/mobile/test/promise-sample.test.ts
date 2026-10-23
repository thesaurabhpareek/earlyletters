/**
 * The promise specimen (EXPERIENCE_PASS S04, package P2). The constitution: the machine may remove and repair, it
 * may never add meaning, and every machine edit goes through verifyEdits. The specimen shows the machine working on
 * fictional words, so it must show only what the real engine does: these tests run the sample through the same path
 * a spoken letter takes (lib/transcription-queue/clean.ts) and check that the marks on screen are exactly the
 * engine's edits, that verifyEdits accepts them, that they are one filler and one repeat, and that putting both back
 * gives the raw words exactly. If the engine ever returns something else, this fails and P0 changes the sample's
 * words; the engine is never bent to fit the sample.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { rulesFor, verifyEdits, withoutEdit, finalText, type Edit } from '@scribe/core';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { markableEdits, promiseSample, putBackFix, sampleA11yLabel, samplePieces, sampleText, undoPutBack } from '@/components/onboarding/promise-sample.logic';
import { cleanSpoken } from '@/lib/transcription-queue/clean';

const SRC = join(__dirname, '..', 'src');
const read = (f: string) => readFileSync(join(SRC, f), 'utf8');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const raw = en.onboarding.promise.sampleRaw;
const sample = promiseSample(raw);

describe('[S04] the sample is cleaned by the real engine, on the path a recording takes', () => {
  it('gets exactly one filler and one repeat, and nothing is refused', () => {
    const out = cleanSpoken(raw, [], 'en');
    expect(out.rejected).toEqual([]);
    expect(out.applied.map((e) => e.type).sort()).toEqual(['filler', 'repeat']);
    // What the screen draws is exactly what the engine applied: no edit added, dropped or changed.
    expect(sample.edits).toEqual(out.applied);
  });

  it('verifyEdits accepts every fix the screen shows (constitution: no bypass)', () => {
    const r = verifyEdits([...sample.edits], { raw, level: 'clean', dictionary: [], protectedSpans: [], rules: rulesFor({ language: 'en' }) });
    expect(r.rejected).toEqual([]);
    expect(r.accepted).toEqual(sample.edits);
  });

  it('every fix only takes words out: nothing is written for the person', () => {
    for (const e of sample.edits) {
      expect(e.replacement.trim(), e.type).toBe('');
      expect(raw.slice(e.start, e.end)).toBe(e.original);
    }
    // The cleaned words are a subsequence of the raw words, in order.
    const said = raw.split(/\s+/);
    const kept = sampleText(sample, []).split(/\s+/);
    let i = 0;
    for (const w of kept) {
      while (i < said.length && said[i] !== w) i++;
      expect(i, `"${w}" was said`).toBeLessThan(said.length);
      i++;
    }
  });

  it('putting both fixes back gives the raw words exactly, in either order, and one at a time is reversible', () => {
    expect(sampleText(sample, [0, 1])).toBe(raw);
    expect(sampleText(sample, [1, 0])).toBe(raw);
    // The engine's own reversal agrees with the screen's.
    let applied: Edit[] = [...sample.edits];
    while (applied.length) applied = withoutEdit(raw, applied, 0).applied;
    expect(finalText(raw, applied)).toBe(raw);
    // Put back, then Undo, through the same functions the screen calls: the text goes back to the engine's.
    const cleaned = sampleText(sample, []);
    const one = putBackFix([], 1);
    expect(sampleText(sample, one)).not.toBe(cleaned);
    expect(sampleText(sample, undoPutBack(one))).toBe(cleaned);
    // Putting the same fix back twice changes nothing; Undo returns the last one put back, not the first.
    expect(putBackFix(one, 1)).toEqual([1]);
    const both = putBackFix(one, 0);
    expect(both).toEqual([1, 0]);
    expect(sampleText(sample, both)).toBe(raw);
    expect(undoPutBack(both)).toEqual([1]);
    expect(undoPutBack([])).toEqual([]);
  });
});

describe('[S04] the marks on screen are the words each fix took out', () => {
  it('draws every word that was said, with one mark per fix over the words it took out', () => {
    const marks = sample.pieces.filter((p) => p.kind === 'mark');
    expect(marks).toHaveLength(2);
    for (const m of marks) {
      if (m.kind !== 'mark') continue;
      expect(m.text).toBe(sample.edits[m.edit].original.trim());
    }
    // Joined, the pieces are the raw words (spacing normalised): nothing hidden, nothing added.
    expect(sample.pieces.map((p) => p.text).join(' ')).toBe(raw.trim().replace(/\s+/g, ' '));
  });

  it('VoiceOver hears every word in order, a mark as "Taken out: ..." until it is put back', () => {
    const takenOut = (w: string) => en.review.removedWordsA11y.replace('{name}', w);
    const marked = sampleA11yLabel(sample, [], takenOut);
    for (const e of sample.edits) expect(marked).toContain(takenOut(e.original.trim()));
    expect(sampleA11yLabel(sample, [0, 1], takenOut)).toBe(raw.trim().replace(/\s+/g, ' '));
  });

  it('marks nothing when an edit is not a whole-word removal or one was refused (the screen then shows the raw words)', () => {
    const [filler] = sample.edits;
    // A changed word, a cut inside a word, a refused edit: none is ever drawn as a mark.
    const change: Edit = { ...filler, type: 'stt_fix', start: 0, end: 6, original: 'Today,', replacement: 'Toady,' };
    const cut: Edit = { ...filler, start: filler.start + 1, original: raw.slice(filler.start + 1, filler.end) };
    expect(markableEdits(raw, [change], [])).toEqual([]);
    expect(markableEdits(raw, [cut], [])).toEqual([]);
    expect(markableEdits(raw, sample.edits, [{ reason: 'any' }])).toEqual([]);
    expect(markableEdits(raw, sample.edits, [])).toEqual(sample.edits);
    expect(samplePieces(raw, []).every((p) => p.kind === 'word')).toBe(true);
    // A sentence with nothing to fix (the fictional family Asha) has no marks at all.
    expect(promiseSample('Asha held the spoon.').edits).toEqual([]);
    expect(promiseSample('Asha held the spoon.').pieces.every((p) => p.kind === 'word')).toBe(true);
  });
});

describe('[S04] the screen draws the engine, in the UI face, unsigned', () => {
  const screen = code(read('components/onboarding/promise-sample.tsx'));
  const onboarding = code(read('app/onboarding.tsx'));

  it('takes its marks from promiseSample (never hand-marked) and puts back through state, with Undo', () => {
    expect(screen).toMatch(/promiseSample\(p\.sampleRaw\)/);
    expect(screen).not.toMatch(/['"`]um,?['"`]/);
    expect(screen).toMatch(/copy\.common\.undoButton/);
    expect(screen).toMatch(/setPutBack\(\(all\) => putBackFix\(all, edit\)\)/);
    expect(screen).toMatch(/setPutBack\(undoPutBack\)/);
    expect(screen).toMatch(/pendingCopy\.review\.putBack/);
  });

  it('sets the sample in the UI sans (Mukta), labelled "For example", with no signature and no child name', () => {
    expect(screen).toMatch(/const TYPE = tokens\.type\.callout/);
    expect(tokens.type.callout.fontFamily).toBe(tokens.fontFamily.sans);
    expect(screen).not.toMatch(/letterBody|variant="signature"|common\.signature/);
    expect(screen).toMatch(/p\.sampleLabel/);
    expect(raw).not.toMatch(/\{child\}|\{signsAs\}/);
  });

  it('the strike is the editMark colour at the editMark weight, and each mark reaches 44 pt', () => {
    expect(screen).toMatch(/height: tokens\.stroke\.editMark, backgroundColor: c\.editMark/);
    expect(tokens.stroke.editMark).toBe(1.5);
    expect(screen).toMatch(/tokens\.target\.min - lineHeight/);
    expect(screen).toMatch(/tokens\.target\.min - width/);
  });

  it('first run has no "We can mishear" card; the first Review note and Settings still carry the registered text', () => {
    expect(onboarding).toMatch(/<PromiseSample \/>/);
    expect(onboarding).not.toMatch(/help\.mistakes|mishearTitle|promise\.body\b|recordingTitle/);
    expect(read('app/review.tsx')).toMatch(/r\.firstNote\.body/);
    expect(read('app/settings/recordings.tsx')).toMatch(/copy\.settings\.help\.mistakes/);
  });
});
