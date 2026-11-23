/**
 * [BL-1723, CDO-B-015] "Not much today" always answers: the mark is kept, or one calm line says it was not. Never silent.
 * The save is the real helper (lib/capture/quiet-day-save.logic.ts) against an in-memory list; Home's wiring is read as
 * source. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import type { Entry } from '../src/lib/store';
import { keepQuietDay, quietDayResponse } from '../src/lib/capture/quiet-day-save.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const LINE = en.errors.generic.body;

const run = (over: { save?: (e: Entry) => void; entries?: Entry[] } = {}) => {
  const saved: Entry[] = [];
  const answer = keepQuietDay({
    day: '2026-11-02',
    now: '2026-11-02T20:00:00.000Z',
    id: () => 'mark-1',
    entries: () => over.entries ?? saved,
    save: over.save ?? ((e) => void saved.push(e)),
  });
  return { answer, saved };
};

describe('[BL-1723] the saved path answers', () => {
  it('a tap keeps one mark with no words and answers with the kept line', () => {
    const { answer, saved } = run();
    expect(answer).toEqual({ kind: 'quietDay', markId: 'mark-1' });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ kind: 'not_much', rawTranscript: '', finalText: '', occurredOn: '2026-11-02' });
    expect(quietDayResponse(answer, LINE)).toEqual({ shown: 'kept', markId: 'mark-1' });
  });

  it('a second tap the same day finds the first mark and adds nothing, and still answers', () => {
    const first = run();
    const again = run({ entries: first.saved });
    expect(again.answer).toEqual({ kind: 'quietDay', markId: 'mark-1' });
    expect(again.saved).toHaveLength(0);
  });
});

describe('[BL-1723] the failed-save path answers', () => {
  const failing = () => run({ save: () => { throw new Error('disk full'); } });

  it('a save that throws does not throw out of the tap; it answers with a calm line', () => {
    const { answer } = failing();
    expect(answer).toEqual({ kind: 'quietDayNotSaved' });
    const shown = quietDayResponse(answer, LINE);
    expect(shown).toEqual({ shown: 'line', text: LINE });
  });

  it('a store that cannot even be read answers the same way', () => {
    const { answer } = run({ save: () => undefined, entries: new Proxy([], { get() { throw new Error('locked'); } }) as unknown as Entry[] });
    expect(answer.kind).toBe('quietDayNotSaved');
  });

  it('the line is the registered one, not a count, a gap or a blame', () => {
    expect(LINE).toMatch(/Nothing you saved has changed/);
    expect(LINE).not.toMatch(/\d|missed|streak|behind/i);
  });
});

describe('[BL-1723] wiring: the tap on Home shows the line, never nothing', () => {
  it('start-capture returns quietDayNotSaved from the helper, and Home shows and announces the registered line', () => {
    const capture = src('lib/capture/start-capture.ts');
    expect(capture).toMatch(/return keepQuietDay\(/);
    const home = src('app/(tabs)/index.tsx');
    expect(home).toMatch(/kept\.kind === 'quietDayNotSaved'/);
    expect(home).toMatch(/setNotSaved\(true\);\n\s*announce\(copy\.errors\.generic\.body\)/);
    expect(home).toMatch(/\{copy\.errors\.generic\.body\}/);
    expect(home).toMatch(/accessibilityLiveRegion="polite" testID="home\.notMuch\.notSaved"/);
  });
});
